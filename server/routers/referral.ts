import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";
import { ENV } from "../_core/env";
import {
  sendReferralSignupConfirmation,
  sendReferrerThanksEmail,
  sendLeadOutreachEmail,
  sendInquiryOwnerEmail,
} from "../email";
import { getDb } from "../db";
import { packageInquiries, referralSignups, hubspotPendingSyncs } from "../../drizzle/schema";
import { createContact, createDeal, ensureContact, hubspotConfigured } from "../hubspot";
import { eq, desc, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

function requireStaffOrAdmin(role: string | undefined) {
  if (role !== "admin" && role !== "staff") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin or staff access required" });
  }
}

// Zod schemas are exported so they can be unit-tested in isolation
// (server/routers/referral.test.ts exercises these without a database).
export const referralSignupSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(320),
  phone: z.string().max(30).optional(),
  company: z.string().max(200).optional(),
  plan: z.string().max(1000).optional(),
});

export const submitLeadSchema = z.object({
  referrerName: z.string().min(1).max(120),
  referrerEmail: z.string().email(),
  leadCompany: z.string().min(1).max(200),
  leadName: z.string().min(1).max(120),
  leadEmail: z.string().email(),
  leadPhone: z.string().max(30).optional(),
  notes: z.string().max(2000).optional(),
});

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? fullName,
    lastName: parts.slice(1).join(" ") || "(no last name)",
  };
}

async function queuePendingSync(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, kind: "contact" | "deal", payload: unknown) {
  try {
    await db.insert(hubspotPendingSyncs).values({
      kind,
      payload: JSON.stringify(payload),
      status: "pending",
      attempts: 0,
    });
  } catch (err) {
    console.error(`[Referral] failed to queue pending ${kind} sync (non-fatal):`, err);
  }
}

export const referralRouter = router({
  // ── Public: sign up as a referrer ─────────────────────────────────────────
  signup: publicProcedure
    .input(referralSignupSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.insert(referralSignups).values({
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        company: input.company ?? null,
        plan: input.plan ?? null,
      });

      // Confirmation email. Never fails the signup.
      await sendReferralSignupConfirmation({ to: input.email, name: input.name }).catch(() => {});

      return { success: true };
    }),

  // ── Public: submit a referred lead ───────────────────────────────────────
  submitLead: publicProcedure
    .input(submitLeadSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Soft lookup: is this referrer signed up? Log it, never block.
      const [existingReferrer] = await db
        .select({ id: referralSignups.id })
        .from(referralSignups)
        .where(eq(referralSignups.email, input.referrerEmail))
        .limit(1)
        .catch(() => []);
      if (!existingReferrer) {
        console.log(`[Referral] lead submitted by ${input.referrerEmail} who is not a signed-up referrer`);
      }

      // Insert into packageInquiries so the lead flows through the normal
      // quote-to-cash pipeline (status defaults to "new").
      const insertResult = await db.insert(packageInquiries).values({
        name: input.leadName,
        company: input.leadCompany,
        email: input.leadEmail,
        phone: input.leadPhone || null,
        tier: "custom",
        quoteType: "project",
        message: input.notes
          ? `[Referral lead submitted via /referral-submit]\n${input.notes}`
          : "[Referral lead submitted via /referral-submit]",
        referrerName: input.referrerName,
        referrerEmail: input.referrerEmail,
        referrerPhone: null,
      });
      const inquiryId = (insertResult[0] as any)?.insertId ?? null;

      // HubSpot: create contact, then a deal in the New Lead stage associated
      // to the contact. Without an API key (or on failure), queue both for
      // later so processPendingSyncs can flush them. Never throws.
      const leadName = splitName(input.leadName);
      const contactInput = {
        firstName: leadName.firstName,
        lastName: leadName.lastName,
        email: input.leadEmail,
        phone: input.leadPhone || null,
        company: input.leadCompany,
      };
      const dealPayload = {
        contact: contactInput,
        dealName: `${input.leadCompany} (via ${input.referrerName})`,
        referrerName: input.referrerName,
        referrerEmail: input.referrerEmail,
        notes: input.notes
          ? `Inquiry #${inquiryId ?? "unknown"}: ${input.notes}`
          : `Inquiry #${inquiryId ?? "unknown"}`,
        inquiryId,
      };
      try {
        if (!hubspotConfigured()) {
          console.log("[Referral] HUBSPOT_API_KEY not set - queueing contact+deal sync");
          await queuePendingSync(db, "contact", contactInput);
          await queuePendingSync(db, "deal", dealPayload);
        } else {
          const contactRes = await createContact(contactInput);
          if (!contactRes.ok) {
            console.warn("[Referral] HubSpot contact create failed - queueing:", contactRes.reason);
            await queuePendingSync(db, "contact", contactInput);
            await queuePendingSync(db, "deal", dealPayload);
          } else {
            const dealRes = await createDeal({
              contactId: contactRes.id,
              dealName: dealPayload.dealName,
              referrerName: input.referrerName,
              referrerEmail: input.referrerEmail,
              notes: dealPayload.notes,
            });
            if (!dealRes.ok) {
              console.warn("[Referral] HubSpot deal create failed - queueing:", dealRes.reason);
              await queuePendingSync(db, "deal", dealPayload);
            }
          }
        }
      } catch (err) {
        console.error("[Referral] HubSpot sync failed (non-fatal):", err);
      }

      // Thank the referrer. Never fails the submit.
      await sendReferrerThanksEmail({
        to: input.referrerEmail,
        referrerName: input.referrerName,
        companyName: input.leadCompany,
      }).catch(() => {});

      // Outreach to the lead. Pre-authorized by Branden as a high-quality
      // sales-pipeline email. Never fails the submit.
      await sendLeadOutreachEmail({
        to: input.leadEmail,
        leadName: input.leadName,
        companyName: input.leadCompany,
        referrerName: input.referrerName,
      }).catch(() => {});

      // Owner notification (platform channel) + owner inbox email, following
      // the inquiry.ts pattern, with referrer info included.
      const ownerContent = [
        `**Name:** ${input.leadName}`,
        `**Company:** ${input.leadCompany}`,
        `**Email:** ${input.leadEmail}`,
        input.leadPhone ? `**Phone:** ${input.leadPhone}` : null,
        `**Quote Type:** Project Quote`,
        `**Referrer:** ${input.referrerName} <${input.referrerEmail}>`,
        input.notes ? `**Notes:** ${input.notes}` : null,
        inquiryId ? `**Inquiry ID:** ${inquiryId}` : null,
      ].filter(Boolean).join("\n");

      await notifyOwner({
        title: `New Referral Lead - ${input.leadCompany} (via ${input.referrerName})`,
        content: ownerContent,
      }).catch(() => {});

      await sendInquiryOwnerEmail({
        to: ENV.ownerNotifyEmail,
        name: input.leadName,
        company: input.leadCompany,
        email: input.leadEmail,
        phone: input.leadPhone || null,
        quoteType: "Project Quote",
        tierLabel: "Custom",
        deviceCount: null,
        palletCount: null,
        boxCount: null,
        storageDays: null,
        addons: [],
        message: input.notes
          ? `[Referral lead submitted via /referral-submit]\n${input.notes}`
          : "[Referral lead submitted via /referral-submit]",
        locationCount: null,
        equipmentTypes: [],
        startDate: null,
        rolloutDuration: null,
        salesRepName: null,
        referredBy: input.referrerName,
        referrerName: input.referrerName,
        referrerEmail: input.referrerEmail,
        referrerPhone: null,
      }).catch(() => {});

      return { success: true, inquiryId };
    }),

  // ── Admin/Staff: list referrer signups, newest first ──────────────────────
  listSignups: protectedProcedure
    .query(async ({ ctx }) => {
      requireStaffOrAdmin(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      return db
        .select()
        .from(referralSignups)
        .orderBy(desc(referralSignups.createdAt));
    }),

  // ── Admin/Staff: flush the HubSpot pending queue ──────────────────────────
  // Takes up to 25 pending rows oldest-first. Contact rows create the
  // contact; deal rows match/create the contact by email first, then create
  // the deal and associate it. Marks each row sent/failed with attempts+1.
  processPendingSyncs: protectedProcedure
    .mutation(async ({ ctx }) => {
      requireStaffOrAdmin(ctx.user?.role);
      if (!hubspotConfigured()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "HUBSPOT_API_KEY is not configured - add it to the Render env vars first",
        });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db
        .select()
        .from(hubspotPendingSyncs)
        .where(eq(hubspotPendingSyncs.status, "pending"))
        .orderBy(asc(hubspotPendingSyncs.createdAt))
        .limit(25);

      let sent = 0;
      let failed = 0;
      for (const row of rows) {
        let ok = false;
        let lastError: string | null = null;
        try {
          const payload = JSON.parse(row.payload);
          if (row.kind === "contact") {
            const res = await createContact({
              firstName: payload.firstName ?? "Unknown",
              lastName: payload.lastName ?? "",
              email: payload.email,
              phone: payload.phone ?? null,
              company: payload.company ?? null,
            });
            ok = res.ok;
            if (!res.ok) lastError = res.reason + (res.detail ? `: ${res.detail}` : "");
          } else if (row.kind === "deal") {
            const contactInput = payload.contact ?? {
              firstName: "Unknown",
              lastName: "",
              email: payload.referrerEmail ?? "",
              phone: null,
              company: null,
            };
            const contactRes = await ensureContact({
              firstName: contactInput.firstName ?? "Unknown",
              lastName: contactInput.lastName ?? "",
              email: contactInput.email,
              phone: contactInput.phone ?? null,
              company: contactInput.company ?? null,
            });
            if (contactRes.ok) {
              const dealRes = await createDeal({
                contactId: contactRes.id,
                dealName: payload.dealName ?? "Referred lead",
                referrerName: payload.referrerName ?? "",
                referrerEmail: payload.referrerEmail ?? "",
                notes: payload.notes ?? null,
              });
              ok = dealRes.ok;
              if (!dealRes.ok) lastError = dealRes.reason + (dealRes.detail ? `: ${dealRes.detail}` : "");
            } else {
              lastError = `contact: ${contactRes.reason}`;
            }
          } else {
            lastError = `unknown kind: ${row.kind}`;
          }
        } catch (err: any) {
          lastError = String(err?.message ?? err).slice(0, 500);
        }

        try {
          await db
            .update(hubspotPendingSyncs)
            .set({
              status: ok ? "sent" : "failed",
              attempts: (row.attempts ?? 0) + 1,
              lastError,
              processedAt: new Date(),
            })
            .where(eq(hubspotPendingSyncs.id, row.id));
        } catch (err) {
          console.error(`[Referral] failed to mark pending sync ${row.id} (non-fatal):`, err);
        }
        if (ok) sent++; else failed++;
      }

      return { processed: rows.length, sent, failed };
    }),
});
