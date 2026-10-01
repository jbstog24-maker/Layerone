/**
 * Scheduled-call worker endpoint.
 *
 * POST /api/scheduled-calls/process?token=<PROSPECT_SYNC_TOKEN>
 *
 * Hit every 5 minutes by an external cron. Each run:
 *  1. Expires unverified bookings whose verification window lapsed.
 *  2. Queues verified bookings that are due through Bland (Alex calls them).
 *  3. Finalizes in-flight calls by checking Bland for their outcome, with
 *     one retry for failed/no-answer calls before marking them failed.
 *
 * Auth: shared token from PROSPECT_SYNC_TOKEN (constant-time compare), same as
 * /api/prospect-sync. Never expose this route without the token: triggering it
 * places real outbound calls that cost money.
 */
import { and, asc, eq, lte, or } from "drizzle-orm";
import type { Express, Request, Response } from "express";
import { timingSafeEqual } from "crypto";
import { getDb } from "./db";
import { ENV } from "./_core/env";
import { scheduledCalls } from "../drizzle/schema";

const BLAND_API = "https://api.bland.ai";
const MAX_CALL_ATTEMPTS = 2; // initial try + 1 retry
const RETRY_DELAY_MS = 30 * 60 * 1000;
const FINALIZE_AFTER_MS = 15 * 60 * 1000;
const STALE_CALL_MS = 2 * 60 * 60 * 1000;
const PER_RUN_QUEUE_LIMIT = 10;

function tokenOk(provided: unknown): boolean {
  const expected = process.env.PROSPECT_SYNC_TOKEN;
  if (!expected || typeof provided !== "string" || provided.length === 0) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function blandHeaders(): Record<string, string> {
  return { authorization: ENV.blandApiKey, "content-type": "application/json" };
}

function buildCallbackTask(row: {
  name: string;
  company: string | null;
  topic: string | null;
}): string {
  const companyBit = row.company ? ` from ${row.company}` : "";
  const topicBit = row.topic ? ` They said they'd like to discuss: ${row.topic}.` : "";
  return [
    `You are Alex, the phone receptionist for Layer One Staging, a B2B IT equipment staging, kitting, configuration, storage, and delivery company serving the Dallas-Fort Worth metro.`,
    `Speak like a real person, not a robot: warm, plain-spoken, unhurried, a little Texas friendliness. Short sentences, contractions, one question at a time. React to what they say before moving on.`,
    `You are calling ${row.name}${companyBit} because they scheduled a callback on the Layer One Staging website.${topicBit}`,
    `Wait for them to say hello first, then greet them BY NAME — for example: "Hi ${row.name}! This is Alex from Layer One Staging, calling about the callback you scheduled. Is now still a good time to chat?" Always use their name in the greeting.`,
    `Help with their questions about staging, kitting, device configuration and testing, warehousing, and delivery.`,
    `Approved pricing you may quote: receiving $12 per pallet, storage $30 per pallet per month, DFW delivery $175 per pallet or $30 per loose device. Larger rollouts get a custom project quote.`,
    `Qualify the caller when natural: their name, company, callback number, email, number of locations, device types and quantities, services needed, and timeline.`,
    `If they don't pick up and you reach voicemail, leave a brief message: who you are, that you're returning their scheduled callback request, and that they can reach Layer One Staging at ${ENV.blandFromNumber} or rebook on the website.`,
    `If asked whether you are an AI, answer honestly. Never invent statistics, customer names, addresses, or capabilities. Keep the call focused and under 12 minutes, then politely wrap up.`,
  ].join(" ");
}

async function blandPlaceCall(row: { name: string; phone: string; company: string | null; topic: string | null }) {
  const res = await fetch(`${BLAND_API}/v1/calls`, {
    method: "POST",
    headers: blandHeaders(),
    body: JSON.stringify({
      phone_number: row.phone,
      from: ENV.blandFromNumber,
      task: buildCallbackTask(row),
      // Lenny: down-to-earth country/southern American male voice
      voice: "6241bb03-305e-45af-aab7-1efe35d2d1c5",
      model: "enhanced",
      language: "ENG",
      record: true,
      max_duration: 15,
      // Post-call webhook → call-log archive (same as the 469 inbound number).
      webhook: `${ENV.portalUrl}/api/call-log?token=${process.env.PROSPECT_SYNC_TOKEN ?? ""}`,
      // Let the person pick up and say hello first — don't talk over the ring.
      wait_for_greeting: true,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || data.status === "error") {
    throw new Error(data?.message || data?.error || `Bland API ${res.status}`);
  }
  return data as { call_id?: string; status?: string };
}

async function blandCallStatus(callId: string): Promise<string | null> {
  const res = await fetch(`${BLAND_API}/v1/calls/${callId}`, {
    headers: { authorization: ENV.blandApiKey },
  });
  if (!res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as any;
  return typeof data?.status === "string" ? data.status : null;
}

const TERMINAL_FAILURE = new Set([
  "failed",
  "canceled",
  "cancelled",
  "voicemail", // Bland sometimes reports voicemail-only outcomes; message was left
]);

// Busy / no-answer get one retry before we give up — the person asked to be
// called, and a single callback 30 minutes later is worth one more attempt.
const RETRYABLE_NO_ANSWER = new Set(["busy", "no-answer", "no_answer"]);

export function registerScheduledCallRoutes(app: Express) {
  app.post("/api/scheduled-calls/process", async (req: Request, res: Response) => {
    if (!tokenOk(req.query.token)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: "db unavailable" });
      return;
    }
    const now = new Date();
    const result = { expired: 0, queued: 0, completed: 0, failed: 0, retried: 0, errors: [] as string[] };

    try {
      // 1. Expire stale unverified bookings.
      const stale = await db
        .select({ id: scheduledCalls.id })
        .from(scheduledCalls)
        .where(
          and(eq(scheduledCalls.status, "unverified"), lte(scheduledCalls.verificationExpiresAt, now))
        );
      for (const row of stale) {
        await db.update(scheduledCalls).set({ status: "expired" }).where(eq(scheduledCalls.id, row.id));
        result.expired++;
      }

      const blandReady = ENV.blandApiKey.length > 0;

      // 2. Queue due, verified bookings.
      const due = await db
        .select()
        .from(scheduledCalls)
        .where(and(eq(scheduledCalls.status, "pending"), lte(scheduledCalls.scheduledFor, now)))
        .orderBy(asc(scheduledCalls.scheduledFor))
        .limit(PER_RUN_QUEUE_LIMIT);

      for (const row of due) {
        if (!blandReady) {
          await db
            .update(scheduledCalls)
            .set({ status: "failed", lastError: "Bland API key not configured (BLAND_API_KEY)" })
            .where(eq(scheduledCalls.id, row.id));
          result.failed++;
          continue;
        }
        try {
          const call = await blandPlaceCall(row);
          if (!call.call_id) throw new Error("Bland returned no call_id");
          await db
            .update(scheduledCalls)
            .set({
              status: "calling",
              blandCallId: call.call_id,
              attempts: row.attempts + 1,
              lastError: null,
            })
            .where(eq(scheduledCalls.id, row.id));
          result.queued++;
        } catch (err: any) {
          const attempts = row.attempts + 1;
          const msg = err?.message ?? String(err);
          if (attempts >= MAX_CALL_ATTEMPTS) {
            await db
              .update(scheduledCalls)
              .set({ status: "failed", attempts, lastError: msg })
              .where(eq(scheduledCalls.id, row.id));
            result.failed++;
          } else {
            await db
              .update(scheduledCalls)
              .set({
                attempts,
                lastError: msg,
                scheduledFor: new Date(now.getTime() + RETRY_DELAY_MS),
              })
              .where(eq(scheduledCalls.id, row.id));
            result.retried++;
          }
          result.errors.push(`queue #${row.id}: ${msg}`);
        }
      }

      // 3. Finalize in-flight calls.
      if (blandReady) {
        const inFlight = await db
          .select()
          .from(scheduledCalls)
          .where(
            and(
              eq(scheduledCalls.status, "calling"),
              lte(scheduledCalls.updatedAt, new Date(now.getTime() - FINALIZE_AFTER_MS))
            )
          )
          .limit(20);
        for (const row of inFlight) {
          try {
            const ageMs = now.getTime() - row.updatedAt.getTime();
            const status = row.blandCallId ? await blandCallStatus(row.blandCallId) : null;
            if (status === "completed" || (status && TERMINAL_FAILURE.has(status))) {
              // Voicemail counts as an attempt made; Alex leaves a message per the task.
              await db
                .update(scheduledCalls)
                .set({
                  status: "completed",
                  lastError: status === "voicemail" ? "Left voicemail message" : null,
                })
                .where(eq(scheduledCalls.id, row.id));
              result.completed++;
            } else if (status && RETRYABLE_NO_ANSWER.has(status)) {
              const attempts = row.attempts + 1;
              if (attempts >= MAX_CALL_ATTEMPTS) {
                await db
                  .update(scheduledCalls)
                  .set({
                    status: "failed",
                    attempts,
                    lastError: "No answer after 2 attempts — follow up manually",
                  })
                  .where(eq(scheduledCalls.id, row.id));
                result.failed++;
              } else {
                await db
                  .update(scheduledCalls)
                  .set({
                    status: "pending",
                    attempts,
                    lastError: "No answer; retrying in 30 minutes",
                    scheduledFor: new Date(now.getTime() + RETRY_DELAY_MS),
                  })
                  .where(eq(scheduledCalls.id, row.id));
                result.retried++;
              }
            } else if (!status || ageMs > STALE_CALL_MS) {
              await db
                .update(scheduledCalls)
                .set({ status: "failed", lastError: "Call outcome unknown; timed out waiting for Bland" })
                .where(eq(scheduledCalls.id, row.id));
              result.failed++;
            }
            // else: still in progress — leave it for the next run.
          } catch (err: any) {
            result.errors.push(`finalize #${row.id}: ${err?.message ?? String(err)}`);
          }
        }
      }

      res.json({ ok: true, ...result });
    } catch (err: any) {
      console.error("[ScheduledCalls] process run failed:", err?.message ?? err);
      res.status(500).json({ ok: false, error: "process run failed" });
    }
  });
}
