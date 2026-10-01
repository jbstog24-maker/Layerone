import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { packageInquiries, quoteTerminations, quotes } from "../../drizzle/schema";

/**
 * Early back-out calculator + refund processing (MSA Section 7.4).
 *
 * Formula (Branden's terms, 2026-10-01):
 *   netSpaceCost = spaceCost − recovery            (re-lease recovery offsets)
 *   adminFee     = 15% × (totalPaid − netSpaceCost)
 *   forfeit      = netSpaceCost + adminFee
 *   refund       = totalPaid − forfeit
 *
 * All money math is done in integer cents to avoid float drift; the DB stores
 * decimal dollars.
 */

export const ADMIN_FEE_RATE = 0.15;

export interface TerminationBreakdown {
  totalPaidCents: number;
  spaceCostCents: number;
  recoveryCents: number;
  netSpaceCostCents: number;
  adminFeeCents: number;
  forfeitCents: number;
  refundCents: number;
}

export function calculateTermination(
  totalPaidCents: number,
  spaceCostCents: number,
  recoveryCents: number,
): TerminationBreakdown {
  const safe = (n: number) => Math.max(0, Math.round(n));
  const total = safe(totalPaidCents);
  const space = safe(spaceCostCents);
  const rec = safe(recoveryCents);
  const netSpaceCostCents = Math.max(0, space - rec);
  const remainderCents = Math.max(0, total - netSpaceCostCents);
  const adminFeeCents = Math.round(remainderCents * ADMIN_FEE_RATE);
  const forfeitCents = netSpaceCostCents + adminFeeCents;
  const refundCents = Math.max(0, total - forfeitCents);
  return {
    totalPaidCents: total,
    spaceCostCents: space,
    recoveryCents: rec,
    netSpaceCostCents,
    adminFeeCents,
    forfeitCents,
    refundCents,
  };
}

export const dollarsToCents = (d: string | number): number =>
  Math.round(parseFloat(String(d)) * 100);
export const centsToDollars = (c: number): string => (c / 100).toFixed(2);

function requireStaffOrAdmin(role: string | undefined) {
  if (role !== "admin" && role !== "staff") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin or staff access required",
    });
  }
}

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-08-26.dahlia" });
}

const calcInput = z.object({
  quoteId: z.number().int().positive(),
  // dollars, as typed into the admin calculator
  spaceCost: z.number().min(0).default(0),
  recovery: z.number().min(0).default(0),
});

async function getPaidQuote(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, quoteId: number) {
  const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId));
  if (!quote) throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found" });
  if (quote.status !== "paid") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Only paid quotes can be terminated (status: ${quote.status})`,
    });
  }
  const [existing] = await db
    .select()
    .from(quoteTerminations)
    .where(eq(quoteTerminations.quoteId, quoteId));
  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "This quote was already terminated",
    });
  }
  return quote;
}

export const terminationRouter = router({
  /**
   * Preview the forfeit/refund breakdown without changing anything.
   * Powers the live calculator in the admin dialog.
   */
  preview: protectedProcedure.input(calcInput).query(async ({ ctx, input }) => {
    requireStaffOrAdmin(ctx.user?.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const quote = await getPaidQuote(db, input.quoteId);
    return calculateTermination(
      dollarsToCents(quote.totalAmount),
      Math.round(input.spaceCost * 100),
      Math.round(input.recovery * 100),
    );
  }),

  /**
   * Process the termination: issue the Stripe refund (when > $0), record the
   * auditable termination row, and mark the quote cancelled. Idempotent via
   * the unique quoteTerminations.quoteId - a double-click returns CONFLICT.
   */
  process: protectedProcedure
    .input(
      calcInput.extend({
        reason: z.string().max(2000).optional(),
        confirmAmountCents: z.number().int().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const quote = await getPaidQuote(db, input.quoteId);

      const b = calculateTermination(
        dollarsToCents(quote.totalAmount),
        Math.round(input.spaceCost * 100),
        Math.round(input.recovery * 100),
      );
      // The UI shows the exact amounts and asks for confirmation; the server
      // re-verifies the confirmed refund matches the calculation so a stale
      // dialog can't process the wrong number.
      if (input.confirmAmountCents !== b.refundCents) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Confirmed amount doesn't match the calculated refund - please recalculate",
        });
      }

      let stripeRefundId: string | null = null;
      if (b.refundCents > 0) {
        const stripe = getStripe();
        if (!stripe) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe is not configured" });
        }
        if (!quote.stripeCheckoutSessionId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Quote has no Stripe checkout session - refund must be issued manually in the Stripe dashboard",
          });
        }
        const session = await stripe.checkout.sessions.retrieve(quote.stripeCheckoutSessionId);
        const paymentIntentId =
          typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
        if (!paymentIntentId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No payment intent on the checkout session - refund must be issued manually in the Stripe dashboard",
          });
        }
        const refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: b.refundCents,
          reason: "requested_by_customer",
          metadata: {
            quote_id: quote.id.toString(),
            inquiry_id: quote.inquiryId.toString(),
            forfeit_cents: b.forfeitCents.toString(),
          },
        });
        stripeRefundId = refund.id;
      }

      await db.insert(quoteTerminations).values({
        quoteId: quote.id,
        inquiryId: quote.inquiryId,
        totalPaid: centsToDollars(b.totalPaidCents),
        spaceCost: centsToDollars(b.spaceCostCents),
        recovery: centsToDollars(b.recoveryCents),
        netSpaceCost: centsToDollars(b.netSpaceCostCents),
        adminFee: centsToDollars(b.adminFeeCents),
        forfeitAmount: centsToDollars(b.forfeitCents),
        refundAmount: centsToDollars(b.refundCents),
        stripeRefundId,
        reason: input.reason?.trim() || null,
        processedByUserId: ctx.user?.id ?? null,
      });

      await db.update(quotes).set({ status: "cancelled" }).where(eq(quotes.id, quote.id));
      await db
        .update(packageInquiries)
        .set({ status: "lost" })
        .where(eq(packageInquiries.id, quote.inquiryId));

      return { ...b, stripeRefundId };
    }),

  /**
   * Fetch the recorded termination for a quote (to show "already terminated"
   * state in the admin UI).
   */
  get: protectedProcedure
    .input(z.object({ quoteId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [row] = await db
        .select()
        .from(quoteTerminations)
        .where(eq(quoteTerminations.quoteId, input.quoteId));
      return row ?? null;
    }),
});
