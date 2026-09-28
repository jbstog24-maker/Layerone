/**
 * Prospect tracking sync endpoint.
 *
 * GET /api/prospect-sync?token=<PROSPECT_SYNC_TOKEN>
 *
 * Returns every package inquiry with its current pipeline state (latest quote
 * totals, MSA status, payment status, onboarding status) as JSON, newest first.
 * Consumed by an external job that upserts rows into the Layer One prospect
 * tracking Google Sheet.
 *
 * Auth: shared token from the PROSPECT_SYNC_TOKEN env var (constant-time compare).
 * The endpoint is read-only and exposes prospect PII — keep the token secret.
 */
import { desc, eq } from "drizzle-orm";
import type { Express, Request, Response } from "express";
import { timingSafeEqual } from "crypto";
import { getDb } from "./db";
import {
  msaDocuments,
  onboardingChecklists,
  packageInquiries,
  quotes,
} from "../drizzle/schema";

function tokenOk(provided: unknown): boolean {
  const expected = process.env.PROSPECT_SYNC_TOKEN;
  if (!expected || typeof provided !== "string" || provided.length === 0) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Runs a sub-query, returning undefined instead of throwing on failure. */
async function safeQuery<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn();
  } catch (err: any) {
    console.error("[ProspectSync] sub-query failed:", err?.message ?? err);
    return undefined;
  }
}

export function registerProspectSyncRoute(app: Express) {
  app.get("/api/prospect-sync", async (req: Request, res: Response) => {
    if (!tokenOk(req.query.token)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    try {
      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "db unavailable" });
        return;
      }
      const inquiries = await db
        .select()
        .from(packageInquiries)
        .orderBy(desc(packageInquiries.createdAt))
        .limit(2000);

      const prospects = await Promise.all(
        inquiries.map(async (inq) => {
          // Each sub-query is fault-tolerant: a problem with one inquiry's
          // related rows must never fail the whole sync.
          const quote = await safeQuery(() =>
            db
              .select({
                totalAmount: quotes.totalAmount,
                status: quotes.status,
                msaStatus: quotes.msaStatus,
                paidAt: quotes.paidAt,
                createdAt: quotes.createdAt,
              })
              .from(quotes)
              .where(eq(quotes.inquiryId, inq.id))
              .orderBy(desc(quotes.createdAt))
              .limit(1).then((rows) => rows[0])
          );
          const msa = await safeQuery(() =>
            db
              .select({ status: msaDocuments.status })
              .from(msaDocuments)
              .where(eq(msaDocuments.inquiryId, inq.id))
              .orderBy(desc(msaDocuments.createdAt))
              .limit(1).then((rows) => rows[0])
          );
          const ob = await safeQuery(() =>
            db
              .select({ status: onboardingChecklists.status })
              .from(onboardingChecklists)
              .where(eq(onboardingChecklists.inquiryId, inq.id))
              .limit(1).then((rows) => rows[0])
          );

          let addons: string[] = [];
          try {
            const parsed: unknown = inq.addons ? JSON.parse(inq.addons) : [];
            if (Array.isArray(parsed)) addons = parsed.filter((k): k is string => typeof k === "string");
          } catch {
            addons = [];
          }

          return {
            id: inq.id,
            createdAt: inq.createdAt,
            name: inq.name,
            company: inq.company,
            email: inq.email,
            phone: inq.phone,
            tier: inq.tier,
            deviceCount: inq.deviceCount,
            boxCount: inq.boxCount,
            palletCount: inq.palletCount,
            storageDays: inq.storageDays,
            addons,
            message: inq.message,
            status: inq.status,
            quote: quote
              ? {
                  total: quote.totalAmount != null ? String(quote.totalAmount) : null,
                  status: quote.status,
                  msaStatus: quote.msaStatus,
                  paidAt: quote.paidAt ?? null,
                  paid: quote.status === "paid" || quote.paidAt != null,
                }
              : null,
            msaStatus: msa?.status ?? null,
            onboardingStatus: ob?.status ?? null,
          };
        })
      );

      res.json({ prospects, exportedAt: new Date().toISOString() });
    } catch (err: any) {
      const message = err?.message ?? String(err);
      console.error("[ProspectSync] failed:", message);
      // Token-gated endpoint: returning the message here is what lets the
      // owner's agent diagnose a sync failure without DB access.
      res.status(500).json({ error: "sync failed", detail: message.slice(0, 500) });
    }
  });
}
