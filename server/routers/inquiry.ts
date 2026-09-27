import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";
import { ENV } from "../_core/env";
import { sendWelcomeEmail, sendQuoteEmail, sendInquiryOwnerEmail } from "../email";
import {
  getDb,
  listInquiries,
  getInquiry,
  getInquiryById,
  updateInquiryStatus,
  updateInquiryStatusById,
  deleteInquiry,
  countNewInquiries,
  listInquiryQuotes,
  createInquiryQuote,
  updateInquiryQuote,
  deleteInquiryQuote,
} from "../db";
import { buildDraftQuote } from "../quoting";
import { packageInquiries } from "../../drizzle/schema";
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
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
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
      phone: z.string().max(30).optional(),
      tier: z.enum(["basic", "standard", "professional", "enterprise", "custom"]),
      deviceVolume: z.string().max(30).optional(),
      deviceCount: z.number().int().min(0).optional(),
      palletCount: z.number().int().min(0).optional(),
      boxCount: z.number().int().min(0).optional(),
      storageDays: z.number().int().min(0).optional(),
      addons: z.array(z.string()).optional(),
      message: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      let inquiryId: number | null = null;
      if (db) {
        const result = await db.insert(packageInquiries).values({
          name: input.name,
          company: input.company,
          email: input.email,
          phone: input.phone ?? null,
          tier: input.tier,
          deviceVolume: input.deviceVolume ?? null,
          deviceCount: input.deviceCount ?? null,
          palletCount: input.palletCount ?? null,
          boxCount: input.boxCount ?? null,
          storageDays: input.storageDays ?? null,
          addons: input.addons ? JSON.stringify(input.addons) : null,
          message: input.message ?? null,
        });
        inquiryId = (result[0] as any)?.insertId ?? null;
      }

      // Autonomous quoting pipeline: auto-build a draft quote for rep review.
      // Wrapped so it can never fail the public submit.
      if (db && inquiryId) {
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

      const tierLabel = input.tier.charAt(0).toUpperCase() + input.tier.slice(1);
      const content = [
        `**Name:** ${input.name}`,
        `**Company:** ${input.company}`,
        `**Email:** ${input.email}`,
        input.phone ? `**Phone:** ${input.phone}` : null,
        `**Package:** ${tierLabel}`,
        input.deviceCount != null ? `**Devices:** ${input.deviceCount}` : null,
        input.palletCount != null ? `**Pallets:** ${input.palletCount}` : null,
        input.boxCount != null ? `**Boxes:** ${input.boxCount}` : null,
        input.storageDays != null ? `**Storage Days:** ${input.storageDays}` : null,
        input.addons?.length ? `**Add-ons:** ${input.addons.join(", ")}` : null,
        input.message ? `**Message:** ${input.message}` : null,
      ].filter(Boolean).join("\n");

      await notifyOwner({
        title: `New Package Inquiry — ${tierLabel} (${input.company})`,
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
        tierLabel,
        deviceCount: input.deviceCount ?? null,
        palletCount: input.palletCount ?? null,
        boxCount: input.boxCount ?? null,
        storageDays: input.storageDays ?? null,
        addons: input.addons ?? [],
        message: input.message ?? null,
      }).catch(() => {});

      // Send branded welcome email to the prospect
      await sendWelcomeEmail({
        to: input.email,
        name: input.name,
        company: input.company,
        tier: input.tier,
      }).catch(() => {});

      return { success: true };
    }),

  // ── Admin/Staff: list inquiries with optional filters ─────────────────────
  list: protectedProcedure
    .input(z.object({
      status: z.enum(["new", "contacted", "quote_sent", "closed"]).optional(),
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

  // ── Admin/Staff: update status ────────────────────────────────────────────
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["new", "contacted", "quote_sent", "closed"]),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);
      await updateInquiryStatus(input.id, input.status);
      return { success: true };
    }),

  // ── Admin only: delete inquiry ────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      await deleteInquiry(input.id);
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
              name: `Layer One Staging Quote — ${inquiry.company}`,
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
          // Fall through — still send quote email with manual payment instructions
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
