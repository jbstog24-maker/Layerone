/**
 * Referral tracking sync endpoint.
 *
 * GET /api/referral-sync?token=<REFERRAL_SYNC_TOKEN>
 *
 * Returns every referrer signup (newest first) plus referred package
 * inquiries from the last 90 days (newest first) as JSON. Consumed by an
 * external VM-side cron that appends new signups and referred leads to the
 * referral tracker Google Sheet.
 *
 * Auth: shared token from the REFERRAL_SYNC_TOKEN env var (constant-time
 * compare, same pattern as prospectSync.ts). The endpoint is read-only and
 * exposes referrer PII - keep the token secret.
 */
import { and, desc, gte, isNotNull } from "drizzle-orm";
import type { Express, Request, Response } from "express";
import { timingSafeEqual } from "crypto";
import { getDb } from "./db";
import { packageInquiries, referralSignups } from "../drizzle/schema";

function tokenOk(provided: unknown): boolean {
  const expected = process.env.REFERRAL_SYNC_TOKEN;
  if (!expected || typeof provided !== "string" || provided.length === 0) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Token guard for any future referral sync callers that need to verify the
 * REFERRAL_SYNC_TOKEN before reading referral data (e.g. tRPC-side exports).
 */
export function referralSyncTokenOk(provided: unknown): boolean {
  return tokenOk(provided);
}

export function registerReferralSyncRoute(app: Express) {
  app.get("/api/referral-sync", async (req: Request, res: Response) => {
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

      const signups = await db
        .select({
          id: referralSignups.id,
          name: referralSignups.name,
          email: referralSignups.email,
          phone: referralSignups.phone,
          company: referralSignups.company,
          plan: referralSignups.plan,
          createdAt: referralSignups.createdAt,
        })
        .from(referralSignups)
        .orderBy(desc(referralSignups.createdAt));

      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const referredInquiries = await db
        .select({
          id: packageInquiries.id,
          name: packageInquiries.name,
          company: packageInquiries.company,
          email: packageInquiries.email,
          phone: packageInquiries.phone,
          referrerName: packageInquiries.referrerName,
          referrerEmail: packageInquiries.referrerEmail,
          referrerPhone: packageInquiries.referrerPhone,
          status: packageInquiries.status,
          createdAt: packageInquiries.createdAt,
        })
        .from(packageInquiries)
        .where(and(isNotNull(packageInquiries.referrerName), gte(packageInquiries.createdAt, ninetyDaysAgo)))
        .orderBy(desc(packageInquiries.createdAt));

      res.json({ signups, referredInquiries, exportedAt: new Date().toISOString() });
    } catch (err: any) {
      const message = err?.message ?? String(err);
      console.error("[ReferralSync] failed:", message);
      // Token-gated endpoint: returning the message here is what lets the
      // owner's agent diagnose a sync failure without DB access.
      res.status(500).json({ error: "sync failed", detail: message.slice(0, 500) });
    }
  });
}
