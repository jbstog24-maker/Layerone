import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
// NOTE: msa_documents and the new quotes columns (msaStatus, msaDocumentId,
// stripeCheckoutSessionId) plus the 'proposal_sent' inquiry status are being
// added to drizzle/schema.ts in parallel (workstream A). These references
// resolve once that change merges.
import { msaDocuments, packageInquiries, quotes } from "../../drizzle/schema";
import { buildMsaHtml, generateMsaToken } from "../msa";
import { sendProposalEmail } from "../proposalEmail";

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
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
}

const SIGNING_BASE_URL = "https://www.layeronestaging.com";
const MSA_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type ProposalLineItem = {
  label: string;
  qty: number;
  unitPrice: number;
  total: number;
};

export const quotesRouter = router({
  // ── Staff/Admin: approve a draft quote, then send MSA + payment link ──────
  // Creates the Stripe payment link, mints the MSA signing document, emails
  // the proposal to the customer, and marks the quote sent. The autonomous
  // flow continues when the customer signs (msa.sign) and pays (Stripe webhook).
  approveAndSend: protectedProcedure
    .input(z.object({ quoteId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);

      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const [quote] = await db
        .select()
        .from(quotes)
        .where(eq(quotes.id, input.quoteId));
      if (!quote)
        throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found" });
      if (quote.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft quotes can be approved and sent",
        });
      }

      const [inquiry] = await db
        .select()
        .from(packageInquiries)
        .where(eq(packageInquiries.id, quote.inquiryId));
      if (!inquiry)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Inquiry not found",
        });

      const totalCents = Math.round(parseFloat(quote.totalAmount) * 100);
      if (totalCents < 50) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Quote total must be at least $0.50",
        });
      }

      // ── Stripe payment link (mirrors inquiry.sendQuote) ──────────────────
      const stripe = getStripe();
      if (!stripe) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Stripe is not configured",
        });
      }

      let paymentLinkUrl: string;
      let paymentLinkId: string;
      try {
        const price = await stripe.prices.create({
          currency: "usd",
          unit_amount: totalCents,
          product_data: {
            name: `Layer One Staging Proposal — ${inquiry.company}`,
            metadata: {
              inquiry_id: inquiry.id.toString(),
              quote_id: quote.id.toString(),
            },
          },
        });

        const link = await stripe.paymentLinks.create({
          line_items: [{ price: price.id, quantity: 1 }],
          metadata: {
            inquiry_id: inquiry.id.toString(),
            quote_id: quote.id.toString(),
            company: inquiry.company,
          },
          after_completion: {
            type: "hosted_confirmation",
            hosted_confirmation: {
              custom_message:
                "Thank you! Your Layer One agreement is being finalized. Our team will be in touch with onboarding next steps.",
            },
          },
        });
        paymentLinkUrl = link.url;
        paymentLinkId = link.id;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[Stripe] Failed to create payment link:", message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create payment link",
        });
      }

      // ── MSA signing document ─────────────────────────────────────────────
      const token = generateMsaToken();
      const tokenExpiresAt = new Date(Date.now() + MSA_TOKEN_TTL_MS);
      const tierName =
        inquiry.tier.charAt(0).toUpperCase() + inquiry.tier.slice(1);
      const amount = `$${parseFloat(quote.totalAmount).toFixed(2)}`;
      const htmlSnapshot = buildMsaHtml(
        {
          company: inquiry.company,
          contactName: inquiry.name,
          email: inquiry.email,
        },
        { tierName, amount }
      );

      const insertResult = await db.insert(msaDocuments).values({
        inquiryId: inquiry.id,
        quoteId: quote.id,
        token,
        tokenExpiresAt,
        htmlSnapshot,
        status: "pending",
      });
      const msaDocumentId = (insertResult[0] as unknown as { insertId: number })
        .insertId;

      const msaUrl = `${SIGNING_BASE_URL}/sign/${token}`;

      // ── Proposal email (non-throwing; warn only) ─────────────────────────
      const lineItems = JSON.parse(quote.lineItems) as ProposalLineItem[];
      const emailOk = await sendProposalEmail({
        to: inquiry.email,
        name: inquiry.name,
        company: inquiry.company,
        tierLabel: tierName,
        lineItems,
        totalAmount: parseFloat(quote.totalAmount),
        msaUrl,
        payUrl: paymentLinkUrl,
      });
      if (!emailOk) {
        console.warn(
          `[Quotes] Proposal email failed for quote ${quote.id} — continuing`
        );
      }

      // ── Persist state transitions ────────────────────────────────────────
      await db
        .update(quotes)
        .set({
          status: "sent",
          sentAt: new Date(),
          stripePaymentLinkId: paymentLinkId,
          stripePaymentLinkUrl: paymentLinkUrl,
          msaDocumentId,
          // msaStatus keeps its 'pending' default until the customer signs.
        })
        .where(eq(quotes.id, quote.id));

      await db
        .update(packageInquiries)
        .set({ status: "proposal_sent" })
        .where(eq(packageInquiries.id, inquiry.id));

      return { success: true, msaUrl, payUrl: paymentLinkUrl };
    }),
});
