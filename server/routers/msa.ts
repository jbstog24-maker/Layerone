import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type { Request } from "express";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
// NOTE: msa_documents is being added to drizzle/schema.ts in parallel
// (workstream A). This import resolves once that change merges.
import { msaDocuments, packageInquiries, quotes } from "../../drizzle/schema";

// Customer-facing MSA signing flow. All procedures are public: access is gated
// by the unguessable per-document token. Signing URL: /sign/<token>.

const tokenSchema = z.string().min(1).max(64);

function tierLabel(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function getClientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0].trim();
  if (Array.isArray(fwd) && fwd.length > 0)
    return String(fwd[0]).split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

async function loadValidDocument(token: string) {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database unavailable",
    });

  const [doc] = await db
    .select()
    .from(msaDocuments)
    .where(eq(msaDocuments.token, token));

  if (!doc)
    throw new TRPCError({ code: "NOT_FOUND", message: "Agreement not found" });

  // Lazily expire stale pending links.
  if (
    doc.status === "pending" &&
    doc.tokenExpiresAt &&
    doc.tokenExpiresAt.getTime() < Date.now()
  ) {
    await db
      .update(msaDocuments)
      .set({ status: "expired" })
      .where(eq(msaDocuments.id, doc.id));
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "This signing link has expired",
    });
  }

  return { db, doc };
}

export const msaRouter = router({
  // ── Public: fetch the agreement for a signing token ──────────────────────
  getByToken: publicProcedure
    .input(z.object({ token: tokenSchema }))
    .query(async ({ input }) => {
      const { db, doc } = await loadValidDocument(input.token);
      if (doc.status !== "pending" && doc.status !== "signed") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agreement not found",
        });
      }

      const [inquiry] = await db
        .select()
        .from(packageInquiries)
        .where(eq(packageInquiries.id, doc.inquiryId));
      const [quote] = await db
        .select()
        .from(quotes)
        .where(eq(quotes.id, doc.quoteId));

      return {
        company: inquiry?.company ?? "",
        contactName: inquiry?.name ?? "",
        tierLabel: inquiry ? tierLabel(inquiry.tier) : "",
        amount: quote ? `$${Number(quote.totalAmount).toFixed(2)}` : "",
        htmlSnapshot: doc.htmlSnapshot,
        status: doc.status,
        signedByName: doc.signedByName,
        signedAt: doc.signedAt,
      };
    }),

  // ── Public: e-sign the agreement ─────────────────────────────────────────
  sign: publicProcedure
    .input(
      z.object({
        token: tokenSchema,
        name: z.string().min(1).max(120),
        title: z.string().max(120).optional().default(""),
        agree: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.agree !== true || !input.name.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You must agree to the terms and provide your name to sign",
        });
      }

      const { db, doc } = await loadValidDocument(input.token);
      if (doc.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This agreement has already been signed",
        });
      }

      const ip = getClientIp(ctx.req);
      const now = new Date();

      await db
        .update(msaDocuments)
        .set({
          status: "signed",
          signedByName: input.name.trim(),
          signerTitle: input.title?.trim() || null,
          signedAt: now,
          signatureIp: ip,
        })
        .where(eq(msaDocuments.id, doc.id));

      await db
        .update(quotes)
        .set({ msaStatus: "signed" })
        .where(eq(quotes.id, doc.quoteId));

      await db
        .update(packageInquiries)
        .set({ status: "msa_signed" })
        .where(eq(packageInquiries.id, doc.inquiryId));

      // Hand off to onboarding (workstream C). Never fail the signature because
      // the handoff check failed.
      try {
        // NOTE: ../onboarding is being added in parallel (workstream C).
        const { checkAndTriggerHandoff } = await import("../onboarding");
        await checkAndTriggerHandoff(doc.inquiryId);
      } catch (err) {
        console.warn("[MSA] onboarding handoff check failed:", err);
      }

      return { success: true };
    }),
});
