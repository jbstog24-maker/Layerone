/**
 * Alex voice account-access API.
 *
 * Bland custom tools call these endpoints mid-call so Alex can verify a
 * caller with a portal-set phone PIN, then read and update that caller's
 * account info with guardrails (confirmation loop, tiered changes, audit).
 *
 * Also hosts the inbound spam/sales-call blocklist:
 *   POST /api/voice/check-blocklist  (called at the start of every inbound call)
 *   POST /api/voice/report-spam      (Alex flags a spam caller for blocking)
 *
 * Auth: shared PROSPECT_SYNC_TOKEN, accepted either as the `token` query
 * param (same pattern as /api/call-log) or via the `x-voice-token` request
 * header, since Bland custom tools send headers more reliably than query
 * params.
 *
 * Bland tool-call envelope tolerance: Bland POSTs tool params plus call
 * metadata; params are accepted at the top level OR nested under
 * `params` / `input` / `arguments`. Unknown envelope shapes log only the
 * raw key list (never values) to the server console to ease debugging.
 *
 * Security notes:
 * - The verify-caller flow never reveals whether an identifier exists
 *   (generic {verified:false} on miss) and never returns secret material.
 * - Session tokens are HMAC-SHA256 (keyed with the sync token); only the
 *   SHA-256 hash of the token is stored in voice_sessions.
 * - Errors log metadata only, never PII.
 */
import type { Express, Request, Response } from "express";
import { createHmac, createHash, timingSafeEqual } from "crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { verifyPassword } from "./_core/password";
import { sendVoiceChangeEmail } from "./email";
import {
  accountAuditLog,
  accountNotes,
  blockedNumbers,
  callLogs,
  devices,
  invoices,
  outboundShipments,
  packageInquiries,
  quotes,
  users,
  voiceApprovals,
  voiceSessions,
} from "../drizzle/schema";

// ─── Auth ─────────────────────────────────────────────────────────────────────

function voiceTokenOk(req: Request): boolean {
  const expected = process.env.PROSPECT_SYNC_TOKEN;
  if (!expected) return false;
  const candidates: unknown[] = [
    req.query.token,
    req.headers["x-voice-token"],
  ];
  for (const c of candidates) {
    if (typeof c !== "string" || c.length === 0) continue;
    const a = Buffer.from(c);
    const b = Buffer.from(expected);
    if (a.length !== b.length) continue;
    if (timingSafeEqual(a, b)) return true;
  }
  return false;
}

// ─── Bland envelope tolerance ─────────────────────────────────────────────────

type Obj = Record<string, unknown>;

function unwrapParams(body: unknown): Obj {
  if (!body || typeof body !== "object") return {};
  const obj = body as Obj;
  for (const key of ["params", "input", "arguments"]) {
    const nested = obj[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested as Obj;
    }
  }
  // Top-level params: strip known Bland metadata keys so the remainder is
  // the tool payload.
  const metaKeys = new Set([
    "call_id",
    "callId",
    "blandCallId",
    "from",
    "to",
    "call_from",
    "call_to",
    "variables",
    "metadata",
  ]);
  const out: Obj = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!metaKeys.has(k)) out[k] = v;
  }
  if (Object.keys(out).length === 0) {
    console.log(
      "[voice] unknown tool envelope shape, top-level keys:",
      Object.keys(obj).join(",")
    );
  }
  return out;
}

function asString(v: unknown): string | null {
  if (typeof v === "string") {
    const t = v.trim();
    return t.length > 0 ? t : null;
  }
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function blandCallIdOf(params: Obj, body: Obj): string | null {
  return (
    asString(params.blandCallId) ??
    asString(params.call_id) ??
    asString(params.callId) ??
    asString(body.blandCallId) ??
    asString(body.call_id) ??
    asString(body.callId)
  );
}

/** Digits-only normalization for phone numbers (blocklist storage + lookup). */
export function normalizePhone(phone: unknown): string {
  if (typeof phone !== "string") return "";
  return phone.replace(/\D/g, "");
}

// ─── Session tokens ───────────────────────────────────────────────────────────

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_PIN_ATTEMPTS = 3;
const BASE_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOCKOUT_MS = 24 * 60 * 60 * 1000; // 24 hours (cap for exponential backoff)

/** Roles allowed to make voice writes. customer_viewer is read-only. */
const VOICE_WRITE_ROLES = new Set(["customer_admin", "staff", "admin"]);

/** Exponential lockout: 15min * 2^(n-1), capped at 24h. */
export function lockoutMsFor(consecutiveLockouts: number): number {
  const n = Math.max(1, consecutiveLockouts);
  return Math.min(BASE_LOCKOUT_MS * 2 ** (n - 1), MAX_LOCKOUT_MS);
}

function hmacKey(): string {
  return process.env.PROSPECT_SYNC_TOKEN ?? "";
}

function mintSessionToken(userId: number, blandCallId: string | null, expiresAt: number): string {
  return createHmac("sha256", hmacKey())
    .update(`${userId}.${blandCallId ?? ""}.${expiresAt}`)
    .digest("hex");
}

function tokenHashOf(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Exported for tests.
export { mintSessionToken, tokenHashOf };

interface VoiceSessionCtx {
  userId: number;
  blandCallId: string | null;
}

/**
 * Validate a session token: recompute the HMAC against the token's own
 * embedded claims, then check the DB row (hash, expiry, call binding).
 * Returns the verified user id, or null.
 */
async function validateSession(
  sessionToken: unknown,
  blandCallId: unknown
): Promise<VoiceSessionCtx | null> {
  const db = await getDb();
  if (!db || typeof sessionToken !== "string" || sessionToken.length === 0) return null;
  const callId = asString(blandCallId);
  const rows = await db
    .select()
    .from(voiceSessions)
    .where(eq(voiceSessions.tokenHash, tokenHashOf(sessionToken)))
    .limit(1);
  const sess = rows[0];
  if (!sess || !sess.expiresAt) return null;
  if (sess.expiresAt.getTime() < Date.now()) return null;
  if (sess.blandCallId && callId && sess.blandCallId !== callId) return null;
  // Recompute the HMAC to prove the token was minted by us.
  const expected = mintSessionToken(sess.userId, sess.blandCallId, sess.expiresAt.getTime());
  const a = Buffer.from(sessionToken);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { userId: sess.userId, blandCallId: sess.blandCallId };
}

// ─── Audit helper ─────────────────────────────────────────────────────────────

async function audit(entry: {
  userId: number;
  actor: "alex" | "admin" | "customer";
  action: string;
  entityType?: string | null;
  entityId?: string | number | null;
  beforeValue?: string | null;
  afterValue?: string | null;
  blandCallId?: string | null;
}): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(accountAuditLog).values({
      userId: entry.userId,
      actor: entry.actor,
      action: entry.action,
      entityType: entry.entityType ?? null,
      entityId: entry.entityId != null ? String(entry.entityId) : null,
      beforeValue: entry.beforeValue ?? null,
      afterValue: entry.afterValue ?? null,
      blandCallId: entry.blandCallId ?? null,
    });
  } catch (err: any) {
    console.error("[voice] audit write failed:", err?.message ?? err);
  }
}

// ─── Out-of-band change notification ──────────────────────────────────────────
// Fire-and-forget email to the account holder whenever Alex applies or stages
// a change. Never blocks the voice response; never includes the PIN.
function notifyVoiceChange(
  to: string | null | undefined,
  name: string | null | undefined,
  changeDescription: string,
  staged: boolean
): void {
  if (!to) return;
  sendVoiceChangeEmail({
    to,
    name: name ?? "there",
    changeDescription,
    staged,
  }).catch((err: any) =>
    console.warn("[voice] change notification email failed:", err?.message ?? err)
  );
}

// ─── Field allowlists ─────────────────────────────────────────────────────────

/** Rapid-repeat auto-block tuning for check-blocklist. */
const RAPID_REPEAT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RAPID_REPEAT_THRESHOLD = 2; // 2 prior short calls -> this 3rd call is blocked
const SHORT_CALL_MAX_MINUTES = 1; // see duration note in check-blocklist

export { RAPID_REPEAT_THRESHOLD, SHORT_CALL_MAX_MINUTES };

/**
 * Pure rapid-repeat decision: given recent inbound call rows (already
 * window-filtered), does this normalized phone have enough short calls to
 * trip the auto-block? Exported for tests.
 */
export function isRapidRepeat(
  recentCalls: Array<{ fromNumber: string | null; durationSeconds: number | null }>,
  normalizedPhone: string
): boolean {
  const shortCount = recentCalls.filter(
    (r) =>
      normalizePhone(r.fromNumber) === normalizedPhone &&
      r.durationSeconds != null &&
      r.durationSeconds <= SHORT_CALL_MAX_MINUTES
  ).length;
  return shortCount >= RAPID_REPEAT_THRESHOLD;
}

/** Tier 1: Alex may apply directly, but ONLY with confirmed=true. Maps the
 * tool field name to the users-table column it writes. */
const TIER1_FIELDS: Record<string, string> = {
  contactPhone: "phone",
  deliveryNotes: "deliveryNotes",
  notificationPrefs: "notificationPrefs",
};

/** Tier 2 kinds: never applied by Alex; staged for Branden's review. */
const TIER2_KINDS = new Set([
  "address",
  "location",
  "deliveryDate",
  "invoiceDispute",
  "cancellation",
]);

/** Hard-no: rejected outright, never staged. */
const HARD_NO_FIELDS = new Set([
  "email",
  "passwordHash",
  "phonePinHash",
  "phonePin",
  "pricing",
  "discount",
  "invoiceVoid",
  "invoiceDelete",
  "refund",
  "role",
  "clientId",
]);

// ─── Money formatting ─────────────────────────────────────────────────────────

function money(v: unknown): string {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  if (Number.isNaN(n)) return "unknown";
  return `$${n.toFixed(2)}`;
}

function fmtDate(v: Date | string | null | undefined): string {
  if (!v) return "none set";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return "none set";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export function registerVoiceRoutes(app: Express): void {
  // ── POST /api/voice/check-blocklist ───────────────────────────────────────
  // Called at the start of every inbound call, before any verification.
  // No session token required, but the shared token auth still applies.
  app.post("/api/voice/check-blocklist", async (req: Request, res: Response) => {
    if (!voiceTokenOk(req)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    try {
      const params = unwrapParams(req.body);
      const phone = normalizePhone(params.callerPhone ?? params.phone ?? (req.body as Obj)?.callerPhone);
      if (!phone) {
        res.status(400).json({ error: "callerPhone required" });
        return;
      }
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "database unavailable" });
        return;
      }
      const rows = await db
        .select({ id: blockedNumbers.id })
        .from(blockedNumbers)
        .where(eq(blockedNumbers.phone, phone))
        .limit(1);
      if (rows.length > 0) {
        res.json({ blocked: true });
        return;
      }

      // Rapid-repeat auto-block: count short inbound calls from this number
      // with startedAt in the last 5 minutes. Short hangup/robocall-style
      // calls trip it; a legitimate customer who calls back after a real
      // conversation does not.
      //
      // Duration note: Bland's call_length arrives in minutes despite the
      // column name (observed in production: call_length 1.15 for a ~62s
      // call), rounded to an int on ingest. <= 1 therefore means roughly
      // under 90 seconds.
      const fiveMinAgo = new Date(Date.now() - RAPID_REPEAT_WINDOW_MS);
      const recent = await db
        .select({
          fromNumber: callLogs.fromNumber,
          startedAt: callLogs.startedAt,
          createdAt: callLogs.createdAt,
          durationSeconds: callLogs.durationSeconds,
        })
        .from(callLogs)
        .where(
          and(
            eq(callLogs.direction, "inbound"),
            sql`COALESCE(${callLogs.startedAt}, ${callLogs.createdAt}) >= ${fiveMinAgo}`
          )
        )
        .limit(200);
      const shortCount = recent.filter(
        (r) =>
          normalizePhone(r.fromNumber) === phone &&
          r.durationSeconds != null &&
          r.durationSeconds <= SHORT_CALL_MAX_MINUTES
      ).length;
      const rapid = isRapidRepeat(recent, phone);
      if (rapid) {
        const already = await db
          .select({ id: blockedNumbers.id })
          .from(blockedNumbers)
          .where(eq(blockedNumbers.phone, phone))
          .limit(1);
        if (already.length === 0) {
          await db.insert(blockedNumbers).values({
            phone,
            reason: "rapid repeat calls",
            source: "auto",
          });
        }
        console.log(`[voice] auto-blocked ${phone} after ${shortCount} rapid short calls`);
        res.json({ blocked: true, autoBlocked: true });
        return;
      }

      res.json({ blocked: false });
    } catch (err: any) {
      console.error("[voice] check-blocklist failed:", err?.message ?? err);
      res.status(500).json({ error: "internal error" });
    }
  });

  // ── POST /api/voice/report-spam ───────────────────────────────────────────
  // Alex flags a spam/sales caller for blocking. Idempotent on duplicate
  // phone. Allowed without a session token since the flagged caller may
  // never have verified.
  app.post("/api/voice/report-spam", async (req: Request, res: Response) => {
    if (!voiceTokenOk(req)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    try {
      const params = unwrapParams(req.body);
      const phone = normalizePhone(params.callerPhone ?? params.phone ?? (req.body as Obj)?.callerPhone);
      if (!phone) {
        res.status(400).json({ error: "callerPhone required" });
        return;
      }
      const reason = asString(params.reason)?.slice(0, 255) ?? null;
      const callId = blandCallIdOf(params, req.body as Obj);
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "database unavailable" });
        return;
      }
      const existing = await db
        .select({ id: blockedNumbers.id })
        .from(blockedNumbers)
        .where(eq(blockedNumbers.phone, phone))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(blockedNumbers).values({
          phone,
          reason,
          source: "alex",
        });
      }
      console.log(`[voice] spam report recorded for call ${callId ?? "unknown"}`);
      res.json({ recorded: true, blocked: true });
    } catch (err: any) {
      console.error("[voice] report-spam failed:", err?.message ?? err);
      res.status(500).json({ error: "internal error" });
    }
  });

  // ── POST /api/voice/verify-caller ─────────────────────────────────────────
  app.post("/api/voice/verify-caller", async (req: Request, res: Response) => {
    if (!voiceTokenOk(req)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    try {
      const params = unwrapParams(req.body);
      const identifier = asString(params.identifier);
      const pin = asString(params.pin);
      const callId = blandCallIdOf(params, req.body as Obj);
      if (!identifier || !pin) {
        res.status(400).json({ error: "identifier and pin required" });
        return;
      }
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "database unavailable" });
        return;
      }

      // Find the user by phone (digits) or email. Generic failure either way.
      const digits = normalizePhone(identifier);
      let user: typeof users.$inferSelect | undefined;
      const byEmail =
        identifier.includes("@")
          ? await db.select().from(users).where(eq(users.email, identifier)).limit(1)
          : [];
      if (byEmail[0]) {
        user = byEmail[0];
      } else if (digits.length >= 7) {
        const all = await db.select().from(users).limit(5000);
        user = all.find((u) => normalizePhone(u.phone) === digits);
      }
      if (!user) {
        res.json({ verified: false });
        return;
      }

      // Deactivated accounts can never verify (generic failure, no detail).
      if (!user.isActive) {
        res.json({ verified: false });
        return;
      }

      // Lockout check. An expired lock resets the attempt counter.
      const sessRows = await db
        .select()
        .from(voiceSessions)
        .where(eq(voiceSessions.userId, user.id))
        .orderBy(desc(voiceSessions.verifiedAt))
        .limit(1);
      const latest = sessRows[0];
      if (latest?.lockedUntil && latest.lockedUntil.getTime() > Date.now()) {
        res.json({ verified: false, locked: true });
        return;
      }
      const lockExpired = !!latest?.lockedUntil && latest.lockedUntil.getTime() <= Date.now();
      const baseAttempts = lockExpired ? 0 : (latest?.failedAttempts ?? 0);

      if (!user.phonePinHash) {
        res.json({ verified: false, noPin: true });
        return;
      }

      const ok = await verifyPassword(pin, user.phonePinHash);
      if (ok) {
        const expiresAt = Date.now() + SESSION_TTL_MS;
        const sessionToken = mintSessionToken(user.id, callId, expiresAt);
        await db.insert(voiceSessions).values({
          userId: user.id,
          blandCallId: callId,
          tokenHash: tokenHashOf(sessionToken),
          verifiedAt: new Date(),
          expiresAt: new Date(expiresAt),
          failedAttempts: 0,
        });
        // Successful verification resets the exponential lockout counter.
        if ((user.consecutiveLockouts ?? 0) > 0) {
          await db
            .update(users)
            .set({ consecutiveLockouts: 0 })
            .where(eq(users.id, user.id));
        }
        await audit({
          userId: user.id,
          actor: "alex",
          action: "voice_verified",
          blandCallId: callId,
        });
        res.json({
          verified: true,
          sessionToken,
          accountName: user.name ?? user.businessName ?? "your account",
        });
        return;
      }

      // Failed attempt: bump the counter on the latest session row, or
      // create a tracking row. At MAX_PIN_ATTEMPTS the account locks with
      // exponential backoff (15min * 2^(n-1), capped at 24h).
      const attempts = baseAttempts + 1;
      const lockMs =
        attempts >= MAX_PIN_ATTEMPTS
          ? lockoutMsFor((user.consecutiveLockouts ?? 0) + 1)
          : null;
      if (latest) {
        await db
          .update(voiceSessions)
          .set({
            failedAttempts: attempts,
            ...(lockMs ? { lockedUntil: new Date(Date.now() + lockMs) } : {}),
          })
          .where(eq(voiceSessions.id, latest.id));
      } else {
        await db.insert(voiceSessions).values({
          userId: user.id,
          blandCallId: callId,
          failedAttempts: attempts,
          ...(lockMs ? { lockedUntil: new Date(Date.now() + lockMs) } : {}),
        });
      }
      if (lockMs) {
        const newLockouts = (user.consecutiveLockouts ?? 0) + 1;
        await db
          .update(users)
          .set({ consecutiveLockouts: newLockouts })
          .where(eq(users.id, user.id));
        const lockMin = Math.round(lockMs / 60000);
        await audit({
          userId: user.id,
          actor: "alex",
          action: "voice_pin_lockout",
          blandCallId: callId,
          afterValue: `${attempts} failed PIN attempts; locked ${lockMin} minutes (lockout #${newLockouts})`,
        });
        res.json({ verified: false, locked: true });
        return;
      }
      res.json({ verified: false, attemptsRemaining: MAX_PIN_ATTEMPTS - attempts });
    } catch (err: any) {
      console.error("[voice] verify-caller failed:", err?.message ?? err);
      res.status(500).json({ error: "internal error" });
    }
  });

  // ── POST /api/voice/account-read ───────────────────────────────────────────
  app.post("/api/voice/account-read", async (req: Request, res: Response) => {
    if (!voiceTokenOk(req)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    try {
      const params = unwrapParams(req.body);
      const callId = blandCallIdOf(params, req.body as Obj);
      const sess = await validateSession(params.sessionToken, callId);
      if (!sess) {
        res.status(403).json({ error: "invalid or expired session" });
        return;
      }
      const resource = asString(params.resource);
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "database unavailable" });
        return;
      }
      const [user] = await db.select().from(users).where(eq(users.id, sess.userId)).limit(1);
      if (!user) {
        res.status(403).json({ error: "invalid session" });
        return;
      }
      const clientId = user.clientId ?? null;

      switch (resource) {
        case "profile": {
          res.json({
            resource: "profile",
            summary: `Account for ${user.name ?? "unknown"}${
              user.businessName ? ` at ${user.businessName}` : ""
            }. Phone on file ${user.phone ?? "not set"}. Delivery notes: ${
              user.deliveryNotes ?? "none"
            }.`,
          });
          return;
        }
        case "invoices": {
          if (!clientId) {
            res.json({ resource: "invoices", summary: "No client account linked, so no invoices found." });
            return;
          }
          const rows = await db
            .select()
            .from(invoices)
            .where(eq(invoices.clientId, clientId))
            .orderBy(desc(invoices.createdAt))
            .limit(10);
          const open = rows.filter((r) => r.status === "sent" || r.status === "overdue");
          const balance = open.reduce((s, r) => s + parseFloat(r.total ?? "0"), 0);
          const soonest = open
            .filter((r) => r.dueDate)
            .sort((a, b) => +new Date(a.dueDate!) - +new Date(b.dueDate!))[0];
          res.json({
            resource: "invoices",
            summary:
              open.length === 0
                ? "No open invoices. Everything is paid up."
                : `${open.length} open invoice${open.length === 1 ? "" : "s"}, total balance ${money(
                    balance
                  )}. Soonest due: ${soonest ? `${soonest.invoiceNumber} due ${fmtDate(soonest.dueDate)}` : "no due date set"}.`,
            count: open.length,
          });
          await audit({ userId: user.id, actor: "alex", action: "voice_read", entityType: "invoices", blandCallId: callId });
          return;
        }
        case "quotes": {
          // Quotes hang off package_inquiries (via inquiryId); match the
          // inquiry by the account's email or phone.
          const email = user.email?.toLowerCase() ?? "";
          const phoneDigits = normalizePhone(user.phone);
          const inquiries = await db.select().from(packageInquiries).limit(5000);
          const mine = inquiries.filter(
            (q) =>
              (email && q.email?.toLowerCase() === email) ||
              (phoneDigits.length >= 7 && normalizePhone(q.phone) === phoneDigits)
          );
          const inquiryIds = mine.map((q) => q.id);
          let qs: typeof quotes.$inferSelect[] = [];
          if (inquiryIds.length > 0) {
            qs = await db
              .select()
              .from(quotes)
              .where(sql`${quotes.inquiryId} IN (${sql.join(inquiryIds.map((i) => sql`${i}`), sql`, `)})`)
              .orderBy(desc(quotes.createdAt))
              .limit(10);
          }
          const active = qs.filter((q) => q.status === "sent" || q.status === "draft");
          res.json({
            resource: "quotes",
            summary:
              qs.length === 0
                ? "No quotes found for this account."
                : `${qs.length} quote${qs.length === 1 ? "" : "s"} on file. ${
                    active.length > 0
                      ? `Latest: quote ${active[0].id}, status ${active[0].status}, total ${money(active[0].totalAmount)}.`
                      : "None currently active."
                  }`,
            count: qs.length,
          });
          await audit({ userId: user.id, actor: "alex", action: "voice_read", entityType: "quotes", blandCallId: callId });
          return;
        }
        case "shipments": {
          if (!clientId) {
            res.json({ resource: "shipments", summary: "No client account linked, so no shipments found." });
            return;
          }
          const rows = await db
            .select()
            .from(outboundShipments)
            .where(eq(outboundShipments.clientId, clientId))
            .orderBy(desc(outboundShipments.createdAt))
            .limit(10);
          const latest = rows[0];
          res.json({
            resource: "shipments",
            summary:
              rows.length === 0
                ? "No outbound shipments found for this account."
                : `${rows.length} shipment${rows.length === 1 ? "" : "s"} on file. Latest: ${
                    latest.shipmentCode
                  }, status ${latest.status}${
                    latest.trackingNumber ? `, tracking ${latest.trackingNumber}` : ", no tracking number yet"
                  }${latest.dateDelivered ? `, delivered ${fmtDate(latest.dateDelivered)}` : ""}.`,
            count: rows.length,
          });
          await audit({ userId: user.id, actor: "alex", action: "voice_read", entityType: "shipments", blandCallId: callId });
          return;
        }
        case "devices": {
          if (!clientId) {
            res.json({ resource: "devices", summary: "No client account linked, so no devices found." });
            return;
          }
          const rows = await db
            .select()
            .from(devices)
            .where(eq(devices.clientId, clientId))
            .limit(5000);
          const byStatus: Record<string, number> = {};
          for (const d of rows) byStatus[d.stagingStatus] = (byStatus[d.stagingStatus] ?? 0) + 1;
          const parts = Object.entries(byStatus)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([s, n]) => `${n} ${s.replace(/_/g, " ")}`);
          res.json({
            resource: "devices",
            summary:
              rows.length === 0
                ? "No devices on file for this account."
                : `${rows.length} device${rows.length === 1 ? "" : "s"} on file. Breakdown: ${parts.join(", ")}.`,
            count: rows.length,
          });
          await audit({ userId: user.id, actor: "alex", action: "voice_read", entityType: "devices", blandCallId: callId });
          return;
        }
        default: {
          res.status(400).json({
            error: "unknown resource",
            resources: ["quotes", "invoices", "shipments", "devices", "profile"],
          });
        }
      }
    } catch (err: any) {
      console.error("[voice] account-read failed:", err?.message ?? err);
      res.status(500).json({ error: "internal error" });
    }
  });

  // ── POST /api/voice/account-update ─────────────────────────────────────────
  app.post("/api/voice/account-update", async (req: Request, res: Response) => {
    if (!voiceTokenOk(req)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    try {
      const params = unwrapParams(req.body);
      const callId = blandCallIdOf(params, req.body as Obj);
      const sess = await validateSession(params.sessionToken, callId);
      if (!sess) {
        res.status(403).json({ error: "invalid or expired session" });
        return;
      }
      const field = asString(params.field) ?? "";
      const value = asString(params.value);
      const confirmed = params.confirmed === true;
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "database unavailable" });
        return;
      }
      const [user] = await db.select().from(users).where(eq(users.id, sess.userId)).limit(1);
      if (!user) {
        res.status(403).json({ error: "invalid session" });
        return;
      }

      // Role scoping: customer_viewer is read-only over the phone.
      if (!VOICE_WRITE_ROLES.has(user.role)) {
        await audit({
          userId: user.id, actor: "alex", action: "voice_update_rejected",
          entityType: field, blandCallId: callId, afterValue: "role not permitted for voice writes",
        });
        res.status(403).json({ error: "Your account role cannot make changes by phone." });
        return;
      }

      // Hard-no fields: never applied, never staged.
      if (HARD_NO_FIELDS.has(field)) {
        await audit({
          userId: user.id, actor: "alex", action: "voice_update_rejected",
          entityType: field, blandCallId: callId, afterValue: "hard-no field",
        });
        res.status(403).json({ error: "That change is not allowed over the phone. Branden handles it personally." });
        return;
      }

      // Tier 2: stage for Branden's review.
      const kind = asString(params.kind) ?? field;
      if (TIER2_KINDS.has(kind) || TIER2_KINDS.has(field)) {
        const [inserted] = await db
          .insert(voiceApprovals)
          .values({
            userId: user.id,
            kind,
            field,
            requestedValue: value,
            blandCallId: callId,
          })
          .$returningId();
        const approvalId = typeof inserted === "object" ? inserted.id : inserted;
        await audit({
          userId: user.id, actor: "alex", action: "voice_approval_staged",
          entityType: kind, entityId: approvalId, blandCallId: callId, afterValue: value,
        });
        notifyVoiceChange(
          user.email, user.name,
          `Requested ${kind} change to "${value ?? ""}" (sent to Branden for review, not applied yet).`,
          true
        );
        res.json({
          staged: true,
          message: "I've sent that to Branden for review, he'll follow up shortly.",
        });
        return;
      }

      // Tier 1: apply directly, but only with explicit confirmation.
      const column = TIER1_FIELDS[field];
      if (!column) {
        res.status(400).json({ error: `Unknown updatable field: ${field}` });
        return;
      }
      if (!confirmed) {
        res.status(400).json({ error: "confirmation required" });
        return;
      }
      if (value == null) {
        res.status(400).json({ error: "value required" });
        return;
      }
      const before = (user as Record<string, unknown>)[column];
      await db
        .update(users)
        .set({ [column]: value } as Partial<typeof users.$inferInsert>)
        .where(eq(users.id, user.id));
      await audit({
        userId: user.id, actor: "alex", action: "voice_update_applied",
        entityType: field, blandCallId: callId,
        beforeValue: before != null ? String(before) : null,
        afterValue: value,
      });
      notifyVoiceChange(
        user.email, user.name,
        `Updated ${field} from "${before != null ? String(before) : "not set"}" to "${value}".`,
        false
      );
      res.json({ applied: true, field });
    } catch (err: any) {
      console.error("[voice] account-update failed:", err?.message ?? err);
      res.status(500).json({ error: "internal error" });
    }
  });

  // ── POST /api/voice/account-note ───────────────────────────────────────────
  app.post("/api/voice/account-note", async (req: Request, res: Response) => {
    if (!voiceTokenOk(req)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    try {
      const params = unwrapParams(req.body);
      const callId = blandCallIdOf(params, req.body as Obj);
      const sess = await validateSession(params.sessionToken, callId);
      if (!sess) {
        res.status(403).json({ error: "invalid or expired session" });
        return;
      }
      const note = asString(params.note);
      if (!note) {
        res.status(400).json({ error: "note required" });
        return;
      }
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "database unavailable" });
        return;
      }
      // Role scoping: customer_viewer is read-only over the phone.
      const [noter] = await db.select({ role: users.role }).from(users).where(eq(users.id, sess.userId)).limit(1);
      if (!noter || !VOICE_WRITE_ROLES.has(noter.role)) {
        res.status(403).json({ error: "Your account role cannot make changes by phone." });
        return;
      }
      const trimmed = note.slice(0, 2000);
      await db.insert(accountNotes).values({
        userId: sess.userId,
        authorType: "alex",
        note: trimmed,
        blandCallId: callId,
      });
      await audit({
        userId: sess.userId, actor: "alex", action: "note_added",
        blandCallId: callId, afterValue: trimmed.slice(0, 500),
      });
      res.json({ recorded: true });
    } catch (err: any) {
      console.error("[voice] account-note failed:", err?.message ?? err);
      res.status(500).json({ error: "internal error" });
    }
  });
}
