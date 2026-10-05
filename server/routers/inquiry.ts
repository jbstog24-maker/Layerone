import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";
import { ENV } from "../_core/env";
import { sendWelcomeEmail, sendQuoteEmail, sendInquiryOwnerEmail, sendEnrollmentWelcomeEmail } from "../email";
import {
  getDb,
  listInquiries,
  getInquiry,
  getInquiryById,
  updateInquiryStatus,
  updateInquiryStatusById,
  deleteInquiry,
  restoreInquiry,
  purgeInquiry,
  listDeletedInquiries,
  countNewInquiries,
  listInquiryQuotes,
  createInquiryQuote,
  updateInquiryQuote,
  deleteInquiryQuote,
} from "../db";
import { buildDraftQuote } from "../quoting";
import { packageInquiries, callLogs } from "../../drizzle/schema";
import { findRecentCallLogId } from "../alexFollowup";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";

function requireStaffOrAdmin(role: string | undefined) {
  if (role !== "admin" && role !== "staff") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin or staff access required" });
  }
}

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-08-26.dahlia" });
}

const lineItemSchema = z.object({
  label: z.string().min(1).max(200),
  qty: z.number().min(0),
  unitPrice: z.number().min(0), // in dollars
  total: z.number().min(0),
});

export const inquiryRouter = router({
  // ── Public: submit inquiry from landing page ──────────────────────────────
  submit: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(120),
      company: z.string().min(1).max(200),
      email: z.string().email().max(320),
      phone: z.string().min(7, "Please enter a valid phone number.").max(30),
      // Quote path: "project" (rollout scoping), "pallet" (per-pallet pricing),
      // or "enrollment" (zero-touch enrollment intake).
      // Optional for backwards compatibility (PackageDetail posts a fixed tier).
      quoteType: z.enum(["project", "pallet", "enrollment"]).optional(),
      // Zero-touch enrollment intake fields (quoteType = "enrollment")
      enrollmentPlatforms: z.array(z.enum(["windows", "apple"])).optional(),
      intuneTenant: z.string().max(200).optional(),
      gdapStatus: z.string().max(50).optional(),
      autopilotProfiles: z.string().max(500).optional(),
      abmOrgId: z.string().max(100).optional(),
      mdmServer: z.string().max(200).optional(),
      enrollmentDeviceTypes: z.string().max(500).optional(),
      enrollmentVolume: z.string().max(50).optional(),
      enrollmentTimeline: z.string().max(100).optional(),
      tier: z.enum(["basic", "standard", "professional", "enterprise", "custom"]).optional(),
      deviceVolume: z.string().max(30).optional(),
      deviceCount: z.number().int().min(0).optional(),
      palletCount: z.number().int().min(0).optional(),
      boxCount: z.number().int().min(0).optional(),
      storageDays: z.number().int().min(0).optional(),
      addons: z.array(z.string()).optional(),
      message: z.string().max(2000).optional(),
      // Rollout scoping (project-quote path)
      locationCount: z.number().int().min(0).max(1000000).optional(),
      equipmentTypes: z.array(z.string().max(40)).max(12).optional(),
      startDate: z.string().max(20).optional(),
      rolloutDuration: z.string().max(40).optional(),
      // Optional sales-rep attribution: the prospect names the Layer One
      // sales rep they are working with so the rep can be compensated.
      salesRepName: z.string().trim().max(120).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const quoteType = input.quoteType ?? "project";
      const tier = input.tier ?? "custom";
      const isEnrollment = quoteType === "enrollment";
      // Build the enrollment details JSON for zero-touch enrollment intakes.
      const enrollmentDetails = isEnrollment
        ? JSON.stringify({
            platforms: input.enrollmentPlatforms ?? [],
            intuneTenant: input.intuneTenant ?? null,
            gdapStatus: input.gdapStatus ?? null,
            autopilotProfiles: input.autopilotProfiles ?? null,
            abmOrgId: input.abmOrgId ?? null,
            mdmServer: input.mdmServer ?? null,
            deviceTypes: input.enrollmentDeviceTypes ?? null,
            volume: input.enrollmentVolume ?? null,
            timeline: input.enrollmentTimeline ?? null,
          })
        : null;
      let inquiryId: number | null = null;
      if (db) {
        const result = await db.insert(packageInquiries).values({
          name: input.name,
          company: input.company,
          email: input.email,
          phone: input.phone ?? null,
          quoteType,
          tier,
          deviceVolume: input.deviceVolume ?? null,
          deviceCount: input.deviceCount ?? null,
          palletCount: input.palletCount ?? null,
          boxCount: input.boxCount ?? null,
          storageDays: input.storageDays ?? null,
          addons: input.addons ? JSON.stringify(input.addons) : null,
          message: input.message ?? null,
          locationCount: input.locationCount ?? null,
          equipmentTypes: input.equipmentTypes ? JSON.stringify(input.equipmentTypes) : null,
          startDate: input.startDate ?? null,
          rolloutDuration: input.rolloutDuration ?? null,
          salesRepName: input.salesRepName || null,
          enrollmentDetails,
        });
        inquiryId = (result[0] as any)?.insertId ?? null;
      }

      // Autonomous quoting pipeline: auto-build a draft quote for rep review.
      // Wrapped so it can never fail the public submit. Skipped for
      // zero-touch enrollment intakes (per-device pricing, not project quotes).
      if (db && inquiryId && !isEnrollment) {
        try {
          const inquiryRow = await getInquiryById(inquiryId);
          if (inquiryRow) {
            await buildDraftQuote(db, inquiryRow);
            await updateInquiryStatusById(inquiryId, "needs_review");
          }
        } catch (err) {
          console.error("[Quote] Failed to auto-build draft quote:", err);
        }
      }

      // Link this inquiry to the Alex call it likely came from (matched by
      // phone or email, most recent within 7 days) so Branden can review the
      // call transcript alongside the quote. Never fails the submit.
      if (db && inquiryId) {
        try {
          const callLogId = await findRecentCallLogId(db, {
            phone: input.phone,
            email: input.email,
          });
          if (callLogId) {
            await db
              .update(packageInquiries)
              .set({ callLogId })
              .where(eq(packageInquiries.id, inquiryId));
          }
        } catch (err) {
          console.error("[Inquiry] call-log match failed (non-fatal):", err);
        }
      }

      const tierLabel = isEnrollment
        ? "Zero-Touch Enrollment"
        : quoteType === "pallet"
          ? "Per-Pallet"
          : tier.charAt(0).toUpperCase() + tier.slice(1);
      const quoteTypeLabel = isEnrollment
        ? "Zero-Touch Enrollment"
        : quoteType === "pallet"
          ? "Per-Pallet Quote"
          : "Project Quote";
      const enrollmentSummary = isEnrollment && enrollmentDetails
        ? (() => {
            try {
              const d = JSON.parse(enrollmentDetails);
              const parts = [
                d.platforms?.length ? `**Platforms:** ${d.platforms.join(", ")}` : null,
                d.intuneTenant ? `**Intune Tenant:** ${d.intuneTenant}` : null,
                d.gdapStatus ? `**GDAP Status:** ${d.gdapStatus}` : null,
                d.autopilotProfiles ? `**Autopilot Profiles:** ${d.autopilotProfiles}` : null,
                d.abmOrgId ? `**ABM Org ID:** ${d.abmOrgId}` : null,
                d.mdmServer ? `**MDM Server:** ${d.mdmServer}` : null,
                d.deviceTypes ? `**Device Types:** ${d.deviceTypes}` : null,
                d.volume ? `**Volume:** ${d.volume}` : null,
                d.timeline ? `**Timeline:** ${d.timeline}` : null,
              ].filter(Boolean);
              return parts.length ? parts.join("\n") : null;
            } catch { return null; }
          })()
        : null;
      const content = [
        `**Name:** ${input.name}`,
        `**Company:** ${input.company}`,
        `**Email:** ${input.email}`,
        input.phone ? `**Phone:** ${input.phone}` : null,
        `**Quote Type:** ${quoteTypeLabel}`,
        `**Package:** ${tierLabel}`,
        input.deviceCount != null ? `**Devices:** ${input.deviceCount}` : null,
        input.palletCount != null ? `**Pallets:** ${input.palletCount}` : null,
        input.boxCount != null ? `**Boxes:** ${input.boxCount}` : null,
        input.storageDays != null ? `**Storage Days:** ${input.storageDays}` : null,
        input.locationCount != null ? `**Locations:** ${input.locationCount}` : null,
        input.equipmentTypes?.length ? `**Equipment Types:** ${input.equipmentTypes.join(", ")}` : null,
        input.startDate ? `**Start Date:** ${input.startDate}` : null,
        input.rolloutDuration ? `**Rollout Duration:** ${input.rolloutDuration}` : null,
        input.salesRepName ? `**Sales Rep:** ${input.salesRepName}` : null,
        input.addons?.length ? `**Add-ons:** ${input.addons.join(", ")}` : null,
        input.message ? `**Message:** ${input.message}` : null,
        enrollmentSummary,
      ].filter(Boolean).join("\n");

      await notifyOwner({
        title: `New Package Inquiry - ${quoteTypeLabel} (${input.company})`,
        content,
      }).catch(() => {});

      // Email the owner inbox directly (notifyOwner targets the Manus platform
      // notification service, which is unavailable on self-hosted Render).
      await sendInquiryOwnerEmail({
        to: ENV.ownerNotifyEmail,
        name: input.name,
        company: input.company,
        email: input.email,
        phone: input.phone ?? null,
        quoteType: quoteTypeLabel,
        tierLabel,
        deviceCount: input.deviceCount ?? null,
        palletCount: input.palletCount ?? null,
        boxCount: input.boxCount ?? null,
        storageDays: input.storageDays ?? null,
        addons: input.addons ?? [],
        message: input.message ?? null,
        locationCount: input.locationCount ?? null,
        equipmentTypes: input.equipmentTypes ?? [],
        startDate: input.startDate ?? null,
        rolloutDuration: input.rolloutDuration ?? null,
        salesRepName: input.salesRepName || null,
      }).catch(() => {});

      // Send branded welcome email to the prospect (enrollment-specific for
      // zero-touch enrollment intakes).
      if (isEnrollment) {
        await sendEnrollmentWelcomeEmail({
          to: input.email,
          name: input.name,
          company: input.company,
        }).catch(() => {});
      } else {
        await sendWelcomeEmail({
          to: input.email,
          name: input.name,
          company: input.company,
          tier,
        }).catch(() => {});
      }

      return { success: true };
    }),

  // ── Admin/Staff: list inquiries with optional filters ─────────────────────
  list: protectedProcedure
    .input(z.object({
      status: z.enum(["new", "needs_review", "contacted", "quote_sent", "proposal_sent", "msa_signed", "paid", "onboarding", "won", "lost", "closed"]).optional(),
      tier: z.enum(["basic", "standard", "professional", "enterprise", "custom"]).optional(),
      search: z.string().max(200).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);
      return listInquiries({
        status: input?.status,
        tier: input?.tier,
        search: input?.search,
      });
    }),

  // ── Admin/Staff: get single inquiry ──────────────────────────────────────
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);
      const row = await getInquiry(input.id);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),

  // ── Admin/Staff: get the Alex call log linked to an inquiry ─────────────────
  // Returns the call details (date, duration, summary, transcript) so Branden
  // can review what the caller told Alex alongside the quote request.
  getCallLog: protectedProcedure
    .input(z.object({ inquiryId: z.number() }))
    .query(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);
      const db = await getDb();
      if (!db) return null;
      const [inq] = await db
        .select({ callLogId: packageInquiries.callLogId })
        .from(packageInquiries)
        .where(eq(packageInquiries.id, input.inquiryId));
      if (!inq?.callLogId) return null;
      const [log] = await db
        .select({
          id: callLogs.id,
          blandCallId: callLogs.blandCallId,
          direction: callLogs.direction,
          fromNumber: callLogs.fromNumber,
          toNumber: callLogs.toNumber,
          callerName: callLogs.callerName,
          startedAt: callLogs.startedAt,
          durationSeconds: callLogs.durationSeconds,
          summary: callLogs.summary,
          transcript: callLogs.transcript,
          recordingUrl: callLogs.recordingUrl,
          createdAt: callLogs.createdAt,
        })
        .from(callLogs)
        .where(eq(callLogs.id, inq.callLogId));
      return log ?? null;
    }),

  // ── Admin/Staff: update status ────────────────────────────────────────────
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["new", "needs_review", "contacted", "quote_sent", "proposal_sent", "msa_signed", "paid", "onboarding", "won", "lost", "closed"]),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);
      await updateInquiryStatus(input.id, input.status);
      return { success: true };
    }),

  // ── Admin only: soft-delete inquiry (moves to trash, restorable) ──────────
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      await deleteInquiry(input.id);
      return { success: true };
    }),

  // ── Admin only: list trashed (soft-deleted) inquiries ────────────────────
  trash: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      return listDeletedInquiries();
    }),

  // ── Admin only: restore a trashed inquiry back to the inbox ──────────────
  restore: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      await restoreInquiry(input.id);
      return { success: true };
    }),

  // ── Admin only: permanently delete a trashed inquiry (irreversible) ──────
  purge: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      await purgeInquiry(input.id);
      return { success: true };
    }),

  // ── Admin/Staff: count new inquiries (for badge) ──────────────────────────
  countNew: protectedProcedure
    .query(async ({ ctx }) => {
      requireStaffOrAdmin(ctx.user?.role);
      return countNewInquiries();
    }),

  // ── Quote: list quotes for an inquiry ────────────────────────────────────
  listQuotes: protectedProcedure
    .input(z.object({ inquiryId: z.number() }))
    .query(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);
      return listInquiryQuotes(input.inquiryId);
    }),

  // ── Quote: create a draft quote ──────────────────────────────────────────
  createQuote: protectedProcedure
    .input(z.object({
      inquiryId: z.number(),
      lineItems: z.array(lineItemSchema).min(1),
      notes: z.string().max(2000).optional(),
      taxRate: z.number().min(0).max(1).optional().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);
      const subtotal = input.lineItems.reduce((sum, li) => sum + li.total, 0);
      const tax = Math.round(subtotal * (input.taxRate ?? 0) * 100) / 100;
      const totalAmount = subtotal + tax;

      const { id } = await createInquiryQuote({
        inquiryId: input.inquiryId,
        lineItems: JSON.stringify(input.lineItems),
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        notes: input.notes ?? null,
        status: "draft",
      });
      return { id };
    }),

  // ── Quote: update a quote ─────────────────────────────────────────────────
  updateQuote: protectedProcedure
    .input(z.object({
      id: z.number(),
      lineItems: z.array(lineItemSchema).min(1).optional(),
      notes: z.string().max(2000).optional(),
      taxRate: z.number().min(0).max(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);
      const updates: Record<string, any> = {};
      if (input.lineItems) {
        const subtotal = input.lineItems.reduce((sum, li) => sum + li.total, 0);
        const tax = Math.round(subtotal * (input.taxRate ?? 0) * 100) / 100;
        const totalAmount = subtotal + tax;
        updates.lineItems = JSON.stringify(input.lineItems);
        updates.subtotal = subtotal.toFixed(2);
        updates.tax = tax.toFixed(2);
        updates.totalAmount = totalAmount.toFixed(2);
      }
      if (input.notes !== undefined) updates.notes = input.notes;
      await updateInquiryQuote(input.id, updates);
      return { success: true };
    }),

  // ── Quote: delete a quote ─────────────────────────────────────────────────
  deleteQuote: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);
      await deleteInquiryQuote(input.id);
      return { success: true };
    }),

  // ── Quote: generate Stripe Payment Link and send to customer ─────────────
  sendQuote: protectedProcedure
    .input(z.object({
      quoteId: z.number(),
      inquiryId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);

      const inquiry = await getInquiry(input.inquiryId);
      if (!inquiry) throw new TRPCError({ code: "NOT_FOUND", message: "Inquiry not found" });

      const quotes = await listInquiryQuotes(input.inquiryId);
      const quote = quotes.find(q => q.id === input.quoteId);
      if (!quote) throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found" });

      const totalCents = Math.round(parseFloat(quote.totalAmount) * 100);
      if (totalCents < 50) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Quote total must be at least $0.50" });
      }

      const stripe = getStripe();
      let paymentLinkUrl: string | null = null;
      let paymentLinkId: string | null = null;

      if (stripe) {
        try {
          // Create a Stripe Price for this quote amount
          const price = await stripe.prices.create({
            currency: "usd",
            unit_amount: totalCents,
            product_data: {
              name: `Layer One Staging Quote - ${inquiry.company}`,
              metadata: { inquiry_id: inquiry.id.toString(), quote_id: quote.id.toString() },
            },
          });

          // Create a Payment Link
          const link = await stripe.paymentLinks.create({
            line_items: [{ price: price.id, quantity: 1 }],
            metadata: {
              inquiry_id: inquiry.id.toString(),
              quote_id: quote.id.toString(),
              company: inquiry.company,
            },
            after_completion: {
              type: "hosted_confirmation",
              hosted_confirmation: { custom_message: "Thank you! Your Layer One account will be activated shortly. Our team will be in touch." },
            },
          });

          paymentLinkUrl = link.url;
          paymentLinkId = link.id;
        } catch (err: any) {
          console.error("[Stripe] Failed to create payment link:", err.message);
          // Fall through - still send quote email with manual payment instructions
        }
      }

      // Update quote record with payment link and mark as sent
      await updateInquiryQuote(input.quoteId, {
        stripePaymentLinkId: paymentLinkId ?? undefined,
        stripePaymentLinkUrl: paymentLinkUrl ?? undefined,
        status: "sent",
        sentAt: new Date(),
      });

      // Update inquiry status to quote_sent
      await updateInquiryStatus(input.inquiryId, "quote_sent");

      // Send quote email to customer
      const lineItems: Array<{ label: string; qty: number; unitPrice: number; total: number }> =
        JSON.parse(quote.lineItems);

      await sendQuoteEmail({
        to: inquiry.email,
        name: inquiry.name,
        company: inquiry.company,
        lineItems,
        subtotal: parseFloat(quote.subtotal),
        tax: parseFloat(quote.tax),
        totalAmount: parseFloat(quote.totalAmount),
        notes: quote.notes ?? undefined,
        paymentLinkUrl: paymentLinkUrl ?? undefined,
      }).catch(err => console.error("[Email] Failed to send quote email:", err));

      // Notify owner
      await notifyOwner({
        title: `📄 Quote Sent to ${inquiry.company}`,
        content: `Quote #${quote.id} for $${quote.totalAmount} sent to ${inquiry.email}${paymentLinkUrl ? `\n\nPayment Link: ${paymentLinkUrl}` : ""}`,
      }).catch(() => {});

      return { success: true, paymentLinkUrl };
    }),
});
