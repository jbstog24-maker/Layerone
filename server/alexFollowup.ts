/**
 * Post-call quote follow-up automation for Alex (Bland voice receptionist).
 *
 * Two jobs live here:
 *
 * 1. maybeSendQuoteFollowup - after a call ends, if the caller discussed a
 *    quote/project AND we can find their email in the call summary/transcript,
 *    send a short follow-up email (via Resend) pointing them at the
 *    /get-started quote form. Never throws; never double-sends (the
 *    call_logs.followupEmailSent flag is the idempotency gate).
 *
 * 2. findRecentCallLogId - when a quote inquiry is submitted on the website,
 *    match it to the Alex call it likely came from (by phone or email, most
 *    recent within 7 days) so Branden can review the transcript alongside the
 *    quote in the admin panel.
 *
 * PII discipline: email addresses and phone numbers are never logged.
 */
import { Resend } from "resend";
import { desc, eq, gte } from "drizzle-orm";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { callLogs } from "../drizzle/schema";
import type { ExtractedCallLog } from "./callLog";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const GET_STARTED_URL = "https://www.layeronestaging.com/get-started";

// ─── Email extraction ────────────────────────────────────────────────────────

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

/** First email address found in free text, or null. Summary first, transcript as fallback. */
export function extractEmailFromText(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = EMAIL_RE.exec(text);
  return m ? m[0] : null;
}

// ─── Quote-interest gating ───────────────────────────────────────────────────

const INTEREST_RE = /(quote|pricing|prices?|costs?|estimates?|proposals?)/i;

// Calls that should never trigger a follow-up even if an email is present.
const EXCLUSION_RE = /\b(wrong number|no answer|didn'?t answer|hung? ?up|hang-?up|misdialed|spam|telemarket)/i;

/** True when the text suggests the caller wants pricing/a quote (and isn't a wrong-number/hangup). */
export function hasQuoteInterest(text: string | null | undefined): boolean {
  if (!text) return false;
  if (EXCLUSION_RE.test(text)) return false;
  return INTEREST_RE.test(text);
}

// ─── Phone normalization ─────────────────────────────────────────────────────

/** Strip everything but digits; null when nothing usable remains. */
export function normalizePhoneDigits(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 ? digits : null;
}

/** Compare two digit strings by their last 10 digits (tolerates +1 country codes). */
export function samePhone(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  if (a.length >= 10 && b.length >= 10) return a.slice(-10) === b.slice(-10);
  return a === b;
}

// ─── Resend send ─────────────────────────────────────────────────────────────

let _resend: Resend | null = null;

function getFollowupResend(): Resend {
  if (!_resend) {
    if (!ENV.resendApiKey) throw new Error("RESEND_API_KEY is not configured");
    _resend = new Resend(ENV.resendApiKey);
  }
  return _resend;
}

function buildQuoteFollowupHtml(firstName: string | null): string {
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
  const supportEmail = ENV.supportEmail || "info@layeronestaging.com";
  const supportPhone = ENV.supportPhone || "+1 (469) 537-4378";
  const logoUrl = "https://www.layeronestaging.com/images/layerone-logo-on-dark.png";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Next steps with Layer One Staging</title></head>
<body style="margin:0;padding:0;background:#0B1320;font-family:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B1320;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:rgba(255,255,255,0.05);border-radius:12px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;">
        <tr><td style="padding:32px 40px 8px;text-align:center;">
          <img src="${logoUrl}" alt="Layer One Staging" width="180" style="width:180px;max-width:60%;height:auto;display:inline-block;" />
        </td></tr>
        <tr><td style="padding:24px 40px 32px;">
          <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#ffffff;">${greeting}</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#94a3b8;">
            Thanks for calling Layer One Staging. To get your project quote started, please send us the details
            of your request - number of locations, equipment types and quantities, and your timeline - using our
            quote form:
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="background:#0A84FF;border-radius:12px;padding:14px 28px;">
              <a href="${GET_STARTED_URL}" style="color:#fff;font-size:15px;font-weight:700;text-decoration:none;display:block;text-align:center;">Submit Your Project Details →</a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#ffffff;">What happens next</p>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#94a3b8;">
            1. We review your project details.<br />
            2. Our team approves the quote.<br />
            3. The quote is emailed to you, usually within one business day.
          </p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#94a3b8;">
            Questions in the meantime? Reply to this email or call us at
            <a href="tel:${supportPhone}" style="color:#0A84FF;">${supportPhone}</a>.
          </p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.1);text-align:center;">
          <p style="margin:0;font-size:12px;color:#64748b;">© ${new Date().getFullYear()} Layer One Staging · Dallas-Fort Worth, TX</p>
          <p style="margin:4px 0 0;font-size:12px;color:#64748b;">You're receiving this because you spoke with us about a project quote. Reply "unsubscribe" to opt out.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendQuoteFollowupEmail(params: { to: string; name: string | null }): Promise<boolean> {
  if (!ENV.resendApiKey || !ENV.resendFromEmail) {
    console.warn("[AlexFollowup] RESEND_API_KEY or RESEND_FROM_EMAIL not configured - skipping follow-up");
    return false;
  }
  const firstName = params.name?.trim().split(" ")[0] || null;
  try {
    const resend = getFollowupResend();
    const { error } = await resend.emails.send({
      from: ENV.resendFromEmail,
      to: params.to,
      subject: "Next steps with Layer One Staging",
      html: buildQuoteFollowupHtml(firstName),
    });
    if (error) {
      console.warn("[AlexFollowup] Resend error:", error);
      return false;
    }
    // PII: log the send event, never the address.
    console.log("[AlexFollowup] Quote follow-up email sent");
    return true;
  } catch (err) {
    console.warn("[AlexFollowup] Failed to send follow-up email:", err);
    return false;
  }
}

// ─── Idempotency store ───────────────────────────────────────────────────────

export interface FollowupStore {
  wasFollowupSent(blandCallId: string): Promise<boolean>;
  markFollowupSent(blandCallId: string): Promise<void>;
}

export function drizzleFollowupStore(db: Db): FollowupStore {
  return {
    wasFollowupSent: async (blandCallId) => {
      const [row] = await db
        .select({ followupEmailSent: callLogs.followupEmailSent })
        .from(callLogs)
        .where(eq(callLogs.blandCallId, blandCallId));
      return row?.followupEmailSent ?? false;
    },
    markFollowupSent: async (blandCallId) => {
      await db
        .update(callLogs)
        .set({ followupEmailSent: true })
        .where(eq(callLogs.blandCallId, blandCallId));
    },
  };
}

// ─── Main entry: maybe send the follow-up ────────────────────────────────────

/**
 * Decide whether a finished call warrants a quote follow-up email and send it.
 * Returns true only if the email was actually sent. Never throws - a failure
 * here must never break the call-log webhook.
 */
export async function maybeSendQuoteFollowup(
  fields: ExtractedCallLog,
  store: FollowupStore,
): Promise<boolean> {
  try {
    // No call id → no idempotency tracking → don't send (retries could double-send).
    if (!fields.blandCallId) return false;

    const email =
      extractEmailFromText(fields.summary) ?? extractEmailFromText(fields.transcript);
    if (!email) return false;

    const haystack = [fields.summary, fields.transcript].filter(Boolean).join("\n");
    if (!hasQuoteInterest(haystack)) return false;

    if (await store.wasFollowupSent(fields.blandCallId)) return false;

    const sent = await sendQuoteFollowupEmail({ to: email, name: fields.callerName });
    if (sent) {
      await store.markFollowupSent(fields.blandCallId);
    }
    return sent;
  } catch (err: any) {
    // Never log the payload: it can contain caller PII. Message only.
    console.error("[AlexFollowup] maybeSendQuoteFollowup failed (non-fatal):", err?.message ?? err);
    return false;
  }
}

// ─── Inquiry → call-log matching ─────────────────────────────────────────────

export interface CallLogMatchCandidate {
  id: number;
  direction: "inbound" | "outbound" | "unknown";
  fromNumber: string | null;
  toNumber: string | null;
  summary: string | null;
  transcript: string | null;
}

/** Pure predicate: does this call log plausibly belong to this inquiry? */
export function matchesInquiryCall(
  log: Pick<CallLogMatchCandidate, "direction" | "fromNumber" | "toNumber" | "summary" | "transcript">,
  phoneDigits: string | null,
  emailNorm: string | null,
): boolean {
  if (phoneDigits) {
    // Inbound: the caller is in fromNumber. Outbound (scheduled callbacks):
    // the customer is in toNumber.
    const callDigits =
      log.direction === "outbound"
        ? normalizePhoneDigits(log.toNumber)
        : normalizePhoneDigits(log.fromNumber);
    if (samePhone(callDigits, phoneDigits)) return true;
  }
  if (emailNorm) {
    const found =
      extractEmailFromText(log.summary) ?? extractEmailFromText(log.transcript);
    if (found && found.toLowerCase() === emailNorm) return true;
  }
  return false;
}

/**
 * Find the most recent call log (within the last 7 days) that matches the
 * inquiry by phone number or by the email found in the call summary.
 * Returns the call_logs.id, or null when nothing matches.
 */
export async function findRecentCallLogId(
  db: Db,
  opts: { phone?: string | null; email?: string | null },
): Promise<number | null> {
  try {
    const phoneDigits = normalizePhoneDigits(opts.phone);
    const emailNorm = opts.email?.trim().toLowerCase() || null;
    if (!phoneDigits && !emailNorm) return null;

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await db
      .select({
        id: callLogs.id,
        direction: callLogs.direction,
        fromNumber: callLogs.fromNumber,
        toNumber: callLogs.toNumber,
        summary: callLogs.summary,
        transcript: callLogs.transcript,
      })
      .from(callLogs)
      .where(gte(callLogs.createdAt, since))
      .orderBy(desc(callLogs.createdAt))
      .limit(200);

    for (const row of rows) {
      if (matchesInquiryCall(row, phoneDigits, emailNorm)) return row.id;
    }
    return null;
  } catch (err: any) {
    console.error("[AlexFollowup] findRecentCallLogId failed (non-fatal):", err?.message ?? err);
    return null;
  }
}
