import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { and, desc, eq, gte, lte, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { scheduledCalls } from "../../drizzle/schema";
import { sendCallVerificationEmail } from "../email";

/**
 * Website "Schedule a Call" bookings.
 *
 * Anti-abuse design:
 *  - Every booking requires email verification before Alex ever calls.
 *  - Unverified bookings expire after 60 minutes and are never dialed.
 *  - DB-backed rate limits: per phone, per email, per IP, and a global daily cap.
 */

const BUSINESS_NUMBER_DISPLAY = "+1 (469) 537-4378";

function requireStaffOrAdmin(role: string | undefined) {
  if (role !== "admin" && role !== "staff") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin or staff access required" });
  }
}

function ipHashFrom(req: any): string {
  const raw =
    (req.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown";
  return createHash("sha256").update(raw).digest("hex");
}

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

/** Pure validation for a requested callback time. Returns an error message or null. */
export function validateScheduledFor(iso: string, nowMs: number = Date.now()): string | null {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "Please choose a valid date and time.";
  const min = nowMs + 15 * 60 * 1000;
  const max = nowMs + 30 * 24 * 60 * 60 * 1000;
  if (t < min) return "Please choose a time at least 15 minutes in the future.";
  if (t > max) return "Please choose a time within the next 30 days.";
  return null;
}

const bookInput = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(7, "Please enter a valid phone number.").max(30),
  email: z.string().email("Please enter a valid email address.").max(320),
  company: z.string().max(200).optional(),
  topic: z.string().max(2000).optional(),
  // ISO-8601 UTC instant, converted client-side from America/Chicago wall time.
  scheduledFor: z.string().min(1),
});

export const scheduledCallRouter = router({
  // ── Public: book a callback ──────────────────────────────────────────────
  book: publicProcedure.input(bookInput).mutation(async ({ input, ctx }) => {
    const timeError = validateScheduledFor(input.scheduledFor);
    if (timeError) {
      throw new TRPCError({ code: "BAD_REQUEST", message: timeError });
    }
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database unavailable" });

    const ipHash = ipHashFrom(ctx.req);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const phone = normalizePhone(input.phone);
    const email = input.email.trim().toLowerCase();

    // Rate limits (all DB-backed so they survive restarts).
    const recent = await db
      .select({ phone: scheduledCalls.phone, email: scheduledCalls.email, ipHash: scheduledCalls.ipHash })
      .from(scheduledCalls)
      .where(gte(scheduledCalls.createdAt, dayAgo));
    const phoneCount = recent.filter((r) => r.phone === phone).length;
    if (phoneCount >= 2) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "This phone number already has the maximum number of scheduled calls. Please call us directly at " + BUSINESS_NUMBER_DISPLAY + ".",
      });
    }
    const emailCount = recent.filter((r) => r.email === email).length;
    if (emailCount >= 3) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "This email address has reached the booking limit for today.",
      });
    }
    const ipCount = recent.filter((r) => r.ipHash === ipHash).length;
    if (ipCount >= 5) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many bookings from your network today. Please call us directly at " + BUSINESS_NUMBER_DISPLAY + ".",
      });
    }
    if (recent.length >= 25) {
      throw new TRPCError({
        code: "SERVICE_UNAVAILABLE",
        message: "Online booking is temporarily unavailable. Please call us directly at " + BUSINESS_NUMBER_DISPLAY + ".",
      });
    }

    const token = randomBytes(32).toString("hex");
    const now = new Date();
    const inserted = await db.insert(scheduledCalls).values({
      name: input.name.trim(),
      phone,
      email,
      company: input.company?.trim() || null,
      topic: input.topic?.trim() || null,
      scheduledFor: new Date(input.scheduledFor),
      timezone: "America/Chicago",
      status: "unverified",
      verificationToken: token,
      verificationExpiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      ipHash,
    });

    const id = (inserted as any)?.[0]?.insertId as number | undefined;
    const verifyUrl = `${ENV.portalUrl.replace(/\/$/, "")}/verify-call?token=${token}`;

    let emailSent = false;
    try {
      emailSent = await sendCallVerificationEmail({
        to: email,
        name: input.name.trim(),
        verifyUrl,
        scheduledFor: new Date(input.scheduledFor),
      });
    } catch (err) {
      console.warn("[ScheduledCall] verification email threw:", (err as Error)?.message);
    }

    return { ok: true as const, id: id ?? null, emailSent };
  }),

  // ── Public: verify email via token link ──────────────────────────────────
  verify: publicProcedure
    .input(z.object({ token: z.string().min(1).max(128) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database unavailable" });
      const rows = await db
        .select()
        .from(scheduledCalls)
        .where(eq(scheduledCalls.verificationToken, input.token))
        .limit(1);
      const row = rows[0];
      if (!row || row.status !== "unverified") {
        throw new TRPCError({ code: "NOT_FOUND", message: "This verification link is invalid or was already used." });
      }
      if (row.verificationExpiresAt && row.verificationExpiresAt.getTime() < Date.now()) {
        await db.update(scheduledCalls).set({ status: "expired" }).where(eq(scheduledCalls.id, row.id));
        throw new TRPCError({ code: "BAD_REQUEST", message: "This verification link has expired. Please book again." });
      }
      await db
        .update(scheduledCalls)
        .set({
          status: "pending",
          verifiedAt: new Date(),
          verificationToken: null,
          verificationExpiresAt: null,
        })
        .where(eq(scheduledCalls.id, row.id));
      return { ok: true as const, scheduledFor: row.scheduledFor.toISOString(), name: row.name };
    }),

  // ── Staff: list bookings ─────────────────────────────────────────────────
  list: protectedProcedure.query(async ({ ctx }) => {
    requireStaffOrAdmin(ctx.user?.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database unavailable" });
    return db.select().from(scheduledCalls).orderBy(desc(scheduledCalls.scheduledFor)).limit(200);
  }),

  // ── Staff: cancel a booking ───────────────────────────────────────────────
  cancel: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      requireStaffOrAdmin(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database unavailable" });
      await db
        .update(scheduledCalls)
        .set({ status: "cancelled" })
        .where(
          and(
            eq(scheduledCalls.id, input.id),
            or(eq(scheduledCalls.status, "unverified"), eq(scheduledCalls.status, "pending"))
          )
        );
      return { ok: true as const };
    }),
});
