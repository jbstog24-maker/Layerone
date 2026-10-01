/**
 * Call transcript archive.
 *
 * Bland POSTs a post-call webhook (JSON) here after every inbound/outbound
 * call:
 *
 *   POST /api/call-log?token=<PROSPECT_SYNC_TOKEN>
 *
 * Every payload is stored durably in `call_logs` — the raw JSON is always
 * saved, and the extracted fields are best-effort (this endpoint never throws
 * on a weird payload shape).
 *
 * A separate cron mirrors new rows to Google Sheets:
 *   GET  /api/call-log/unsynced?token=...   → rows with syncedToSheet=false (oldest first, cap 100)
 *   POST /api/call-log/mark-synced?token=... → body { ids: [...] } marks rows synced
 *
 * Auth: shared token from PROSPECT_SYNC_TOKEN (constant-time compare), same as
 * /api/prospect-sync and the scheduled-calls worker. The Bland call id is
 * unique so retried webhook deliveries are idempotent (duplicates are
 * swallowed, not stored twice).
 */
import { asc, eq, inArray } from "drizzle-orm";
import type { Express, Request, Response } from "express";
import { timingSafeEqual } from "crypto";
import { getDb } from "./db";
import { callLogs, type CallLog, type InsertCallLog } from "../drizzle/schema";

const UNSYNCED_LIMIT = 100;

export function tokenOk(provided: unknown): boolean {
  const expected = process.env.PROSPECT_SYNC_TOKEN;
  if (!expected || typeof provided !== "string" || provided.length === 0) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ─── Defensive payload extraction ────────────────────────────────────────────
// Bland's webhook shape varies (phone calls vs chat widget vs API versions),
// so we probe several likely key names and never throw.

export interface ExtractedCallLog {
  blandCallId: string | null;
  direction: "inbound" | "outbound" | "unknown";
  fromNumber: string | null;
  toNumber: string | null;
  callerName: string | null;
  company: string | null;
  startedAt: Date | null;
  durationSeconds: number | null;
  summary: string | null;
  recordingUrl: string | null;
  transcript: string | null;
}

const EMPTY_FIELDS: ExtractedCallLog = {
  blandCallId: null,
  direction: "unknown",
  fromNumber: null,
  toNumber: null,
  callerName: null,
  company: null,
  startedAt: null,
  durationSeconds: null,
  summary: null,
  recordingUrl: null,
  transcript: null,
};

function asString(v: unknown): string | null {
  if (typeof v === "string") {
    const t = v.trim();
    return t.length > 0 ? t : null;
  }
  return null;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function asDate(v: unknown): Date | null {
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

type Obj = Record<string, unknown>;

// First non-empty string across candidate keys, checking top-level first and
// then Bland's `variables` bag (custom extracted fields land there).
function pickString(obj: Obj, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = asString(obj[k]);
    if (v) return v;
  }
  const vars = obj["variables"];
  if (vars && typeof vars === "object" && !Array.isArray(vars)) {
    const vobj = vars as Obj;
    for (const k of keys) {
      const v = asString(vobj[k]);
      if (v) return v;
    }
  }
  return null;
}

function pickNumber(obj: Obj, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = asNumber(obj[k]);
    if (v != null) return v;
  }
  return null;
}

function pickDate(obj: Obj, ...keys: string[]): Date | null {
  for (const k of keys) {
    const v = asDate(obj[k]);
    if (v) return v;
  }
  return null;
}

// Structured turn arrays → "Speaker: text" lines. Handles both the phone-call
// shape ({ user: "user"|"assistant", text }) and the chat-widget shape
// ({ sender_type: "USER"|"ASSISTANT", content }).
function transcriptFromArray(items: unknown[]): string | null {
  const lines: string[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const o = item as Obj;
    const text = asString(o["text"]) ?? asString(o["content"]) ?? asString(o["message"]);
    if (!text) continue;
    const role = asString(o["user"]) ?? asString(o["sender_type"]) ?? asString(o["role"]) ?? "";
    const speaker = /^(user|caller|customer)$/i.test(role) ? "Caller" : "Alex";
    lines.push(`${speaker}: ${text}`);
  }
  return lines.length > 0 ? lines.join("\n") : null;
}

function extractTranscript(obj: Obj): string | null {
  const direct = asString(obj["concatenated_transcript"]) ?? asString(obj["transcript"]);
  if (direct) return direct;
  for (const key of ["transcripts", "conversation_history", "messages"]) {
    const arr = obj[key];
    if (Array.isArray(arr)) {
      const t = transcriptFromArray(arr);
      if (t) return t;
    }
  }
  return null;
}

export function extractCallLogFields(payload: unknown): ExtractedCallLog {
  try {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return { ...EMPTY_FIELDS };
    const obj = payload as Obj;
    const dirRaw = (asString(obj["direction"]) ?? "").toLowerCase();
    const direction = dirRaw === "inbound" ? "inbound" : dirRaw === "outbound" ? "outbound" : "unknown";
    const dur = pickNumber(obj, "call_length", "callLength", "duration", "duration_seconds", "call_duration");
    return {
      blandCallId: pickString(obj, "call_id", "callId", "callID", "id"),
      direction,
      fromNumber: pickString(obj, "from", "from_number", "fromNumber", "caller", "caller_number"),
      toNumber: pickString(obj, "to", "to_number", "toNumber", "callee", "phone_number"),
      callerName: pickString(obj, "caller_name", "callerName", "name"),
      company: pickString(obj, "company", "company_name", "companyName"),
      startedAt: pickDate(obj, "started_at", "start_time", "created_at", "call_started_at"),
      durationSeconds: dur != null ? Math.round(dur) : null,
      summary: pickString(obj, "summary", "call_summary"),
      recordingUrl: pickString(obj, "recording_url", "recordingUrl", "recording"),
      transcript: extractTranscript(obj),
    };
  } catch {
    return { ...EMPTY_FIELDS };
  }
}

// ─── Storage ─────────────────────────────────────────────────────────────────

export interface CallLogStore {
  insert(fields: InsertCallLog): Promise<void>;
  listUnsynced(limit: number): Promise<CallLog[]>;
  /** Returns the number of rows marked. */
  markSynced(ids: unknown[]): Promise<number>;
}

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export function drizzleCallLogStore(db: Db): CallLogStore {
  return {
    insert: async (fields) => {
      try {
        await db.insert(callLogs).values(fields);
      } catch (err: any) {
        // Bland retries webhook deliveries; a duplicate call id means the
        // payload is already stored — treat as success, not an error.
        if (err?.code === "ER_DUP_ENTRY") return;
        throw err;
      }
    },
    listUnsynced: (limit) =>
      db
        .select()
        .from(callLogs)
        .where(eq(callLogs.syncedToSheet, false))
        .orderBy(asc(callLogs.id))
        .limit(limit),
    markSynced: async (ids) => {
      // Dedupe + drop anything that isn't a positive integer id.
      const clean: number[] = [];
      const seen = new Set<number>();
      for (const n of Array.isArray(ids) ? ids : []) {
        if (Number.isInteger(n) && (n as number) > 0 && !seen.has(n as number)) {
          seen.add(n as number);
          clean.push(n as number);
        }
      }
      if (clean.length === 0) return 0;
      await db.update(callLogs).set({ syncedToSheet: true }).where(inArray(callLogs.id, clean));
      return clean.length;
    },
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export function registerCallLogRoutes(
  app: Express,
  getStore: () => Promise<CallLogStore | null> = async () => {
    const db = await getDb();
    return db ? drizzleCallLogStore(db) : null;
  }
) {
  app.post("/api/call-log", async (req: Request, res: Response) => {
    if (!tokenOk(req.query.token)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    const store = await getStore();
    if (!store) {
      res.status(503).json({ error: "db unavailable" });
      return;
    }
    let fields: ExtractedCallLog;
    try {
      fields = extractCallLogFields(req.body);
    } catch {
      fields = { ...EMPTY_FIELDS }; // unreachable in practice; belt-and-braces
    }
    let raw: string;
    try {
      raw = JSON.stringify(req.body ?? null);
    } catch {
      raw = '{"unserializable":true}';
    }
    try {
      await store.insert({
        blandCallId: fields.blandCallId,
        direction: fields.direction,
        fromNumber: fields.fromNumber,
        toNumber: fields.toNumber,
        callerName: fields.callerName,
        company: fields.company,
        startedAt: fields.startedAt,
        durationSeconds: fields.durationSeconds,
        summary: fields.summary,
        recordingUrl: fields.recordingUrl,
        transcript: fields.transcript,
        rawPayload: raw,
      });
      res.json({ ok: true });
    } catch (err: any) {
      // Never log the payload: it can contain caller PII. Message only.
      console.error("[CallLog] insert failed:", err?.message ?? err);
      res.status(500).json({ ok: false, error: "store failed" });
    }
  });

  app.get("/api/call-log/unsynced", async (req: Request, res: Response) => {
    if (!tokenOk(req.query.token)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    const store = await getStore();
    if (!store) {
      res.status(503).json({ error: "db unavailable" });
      return;
    }
    try {
      const rows = await store.listUnsynced(UNSYNCED_LIMIT);
      res.json({ ok: true, rows });
    } catch (err: any) {
      console.error("[CallLog] unsynced fetch failed:", err?.message ?? err);
      res.status(500).json({ ok: false, error: "fetch failed" });
    }
  });

  app.post("/api/call-log/mark-synced", async (req: Request, res: Response) => {
    if (!tokenOk(req.query.token)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    const store = await getStore();
    if (!store) {
      res.status(503).json({ error: "db unavailable" });
      return;
    }
    try {
      const marked = await store.markSynced(req.body?.ids);
      res.json({ ok: true, marked });
    } catch (err: any) {
      console.error("[CallLog] mark-synced failed:", err?.message ?? err);
      res.status(500).json({ ok: false, error: "update failed" });
    }
  });
}
