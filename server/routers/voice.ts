/**
 * tRPC router for the Alex voice account-access feature (portal side).
 *
 * Customer procedures: manage the phone PIN Alex uses for caller
 * verification, and view the account activity timeline (notes + changes).
 *
 * Admin procedures: full per-account timeline (notes, audit, approvals),
 * list/resolve Tier 2 voice approvals, and manage the spam blocklist.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { hashPassword, verifyPassword } from "../_core/password";
import {
  accountAuditLog,
  accountNotes,
  blockedNumbers,
  users,
  voiceApprovals,
} from "../../drizzle/schema";
import {
  adminProcedure,
  customerProcedure,
  router,
} from "../_core/trpc";

const PIN_RE = /^\d{4,6}$/;

// ─── Shared apply logic for Tier 1 fields + Tier 2 approvals ─────────────────
// Mirrors the allowlist in server/voice.ts so admin resolutions apply the
// exact same rules Alex follows on the phone.

const TIER1_COLUMNS: Record<string, "phone" | "deliveryNotes" | "notificationPrefs"> = {
  contactPhone: "phone",
  deliveryNotes: "deliveryNotes",
  notificationPrefs: "notificationPrefs",
};

const TIER2_FIELDS: Record<string, "phone" | "deliveryNotes" | "notificationPrefs" | null> = {
  // kind/field -> users column to write on approval (null = informational only)
  address: null,
  location: null,
  deliveryDate: null,
  invoiceDispute: null,
  cancellation: null,
};

async function applyTier1Field(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number,
  field: string,
  value: string,
  actor: "admin" | "alex",
  blandCallId: string | null,
  resolvedBy?: number
): Promise<void> {
  const column = TIER1_COLUMNS[field];
  if (!column) throw new TRPCError({ code: "BAD_REQUEST", message: `Field '${field}' cannot be applied` });
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  const before = (user as Record<string, unknown>)[column];
  await db
    .update(users)
    .set({ [column]: value } as Partial<typeof users.$inferInsert>)
    .where(eq(users.id, userId));
  await db.insert(accountAuditLog).values({
    userId,
    actor,
    action: "voice_update_applied",
    entityType: field,
    blandCallId,
    beforeValue: before != null ? String(before) : null,
    afterValue: value,
  });
  if (resolvedBy) {
    await db.insert(accountNotes).values({
      userId,
      authorType: "admin",
      note: `Approved voice request: set ${field} to "${value}".`,
      blandCallId,
    });
  }
}

// ─── Customer procedures ─────────────────────────────────────────────────────

const customerRouter = router({
  /** Set or change the phone PIN Alex asks for on calls. */
  setPhonePin: customerProcedure
    .input(
      z.object({
        pin: z.string().regex(PIN_RE, "PIN must be 4 to 6 digits"),
        currentPin: z.string().optional(),
        password: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      if (user.phonePinHash) {
        // Changing an existing PIN requires the current PIN or the account password.
        const pinOk = input.currentPin ? await verifyPassword(input.currentPin, user.phonePinHash) : false;
        const pwOk =
          input.password && user.passwordHash ? await verifyPassword(input.password, user.passwordHash) : false;
        if (!pinOk && !pwOk) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Enter your current phone PIN or account password to change it.",
          });
        }
      }
      await db
        .update(users)
        .set({ phonePinHash: await hashPassword(input.pin), phonePinSetAt: new Date() })
        .where(eq(users.id, ctx.user.id));
      await db.insert(accountAuditLog).values({
        userId: ctx.user.id,
        actor: "customer",
        action: "phone_pin_set",
      });
      return { success: true };
    }),

  /** Whether a phone PIN is set (never returns the hash). */
  getPhonePinStatus: customerProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { isSet: false, setAt: null };
    const [user] = await db
      .select({ phonePinHash: users.phonePinHash, phonePinSetAt: users.phonePinSetAt })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    return { isSet: !!user?.phonePinHash, setAt: user?.phonePinSetAt ?? null };
  }),

  /** The customer's own activity timeline: notes + audit entries, newest first. */
  getMyActivity: customerProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const notes = await db
      .select()
      .from(accountNotes)
      .where(eq(accountNotes.userId, ctx.user.id))
      .orderBy(desc(accountNotes.createdAt))
      .limit(50);
    const audits = await db
      .select()
      .from(accountAuditLog)
      .where(eq(accountAuditLog.userId, ctx.user.id))
      .orderBy(desc(accountAuditLog.createdAt))
      .limit(50);
    const items = [
      ...notes.map((n) => ({
        kind: "note" as const,
        id: n.id,
        author: n.authorType,
        text: n.note,
        callId: n.blandCallId,
        createdAt: n.createdAt,
      })),
      ...audits.map((a) => ({
        kind: "change" as const,
        id: a.id,
        author: a.actor,
        text: describeAudit(a.action, a.entityType, a.beforeValue, a.afterValue),
        callId: a.blandCallId,
        createdAt: a.createdAt,
      })),
    ];
    items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return items.slice(0, 50);
  }),
});

function describeAudit(
  action: string,
  entityType: string | null,
  before: string | null,
  after: string | null
): string {
  switch (action) {
    case "voice_update_applied":
      return `Updated ${humanField(entityType)}${before ? ` from "${before}"` : ""} to "${after ?? ""}".`;
    case "voice_approval_staged":
      return `Requested ${humanField(entityType)} change to "${after ?? ""}" - waiting for Branden's review.`;
    case "note_added":
      return "Alex added a call note.";
    case "voice_verified":
      return "Caller verified by phone PIN.";
    case "voice_pin_lockout":
      return "Phone PIN locked after too many wrong attempts.";
    case "phone_pin_set":
      return "Phone PIN was set or changed.";
    default:
      return action.replace(/_/g, " ");
  }
}

function humanField(field: string | null): string {
  switch (field) {
    case "contactPhone":
      return "contact phone";
    case "deliveryNotes":
      return "delivery notes";
    case "notificationPrefs":
      return "notification preferences";
    default:
      return field ?? "account";
  }
}

// ─── Admin procedures ────────────────────────────────────────────────────────

const adminRouter = router({
  /** Full per-account timeline: notes + audit + approvals, newest first. */
  getAccountTimeline: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const notes = await db
        .select()
        .from(accountNotes)
        .where(eq(accountNotes.userId, input.userId))
        .orderBy(desc(accountNotes.createdAt))
        .limit(100);
      const audits = await db
        .select()
        .from(accountAuditLog)
        .where(eq(accountAuditLog.userId, input.userId))
        .orderBy(desc(accountAuditLog.createdAt))
        .limit(100);
      const approvals = await db
        .select()
        .from(voiceApprovals)
        .where(eq(voiceApprovals.userId, input.userId))
        .orderBy(desc(voiceApprovals.createdAt))
        .limit(100);
      type Item = {
        kind: "note" | "change" | "approval";
        id: number;
        author: string;
        text: string;
        callId: string | null;
        status?: string;
        createdAt: Date;
      };
      const items: Item[] = [
        ...notes.map((n): Item => ({
          kind: "note",
          id: n.id,
          author: n.authorType,
          text: n.note ?? "",
          callId: n.blandCallId,
          createdAt: n.createdAt,
        })),
        ...audits.map((a): Item => ({
          kind: "change",
          id: a.id,
          author: a.actor,
          text: describeAudit(a.action, a.entityType, a.beforeValue, a.afterValue),
          callId: a.blandCallId,
          createdAt: a.createdAt,
        })),
        ...approvals.map((a): Item => ({
          kind: "approval",
          id: a.id,
          author: "alex",
          text: `Requested ${a.kind}${a.field ? ` (${a.field})` : ""}: "${a.requestedValue ?? ""}" - ${a.status}`,
          callId: a.blandCallId,
          status: a.status,
          createdAt: a.createdAt,
        })),
      ];
      items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      return items.slice(0, 100);
    }),

  /** List Tier 2 voice approvals, optionally filtered by status. */
  listVoiceApprovals: adminProcedure
    .input(z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const base = db
        .select({
          approval: voiceApprovals,
          userName: users.name,
          userEmail: users.email,
        })
        .from(voiceApprovals)
        .leftJoin(users, eq(users.id, voiceApprovals.userId))
        .orderBy(desc(voiceApprovals.createdAt))
        .limit(100);
      if (input?.status) {
        return base.where(eq(voiceApprovals.status, input.status));
      }
      return base;
    }),

  /** Approve or reject a Tier 2 request. Approval applies the change through
   * the same field allowlist Alex uses; informational kinds just close out. */
  resolveVoiceApproval: adminProcedure
    .input(z.object({ id: z.number().int().positive(), approve: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [approval] = await db
        .select()
        .from(voiceApprovals)
        .where(and(eq(voiceApprovals.id, input.id), eq(voiceApprovals.status, "pending")))
        .limit(1);
      if (!approval) throw new TRPCError({ code: "NOT_FOUND", message: "Pending approval not found" });

      if (input.approve) {
        const column = TIER2_FIELDS[approval.kind] ?? TIER1_COLUMNS[approval.field ?? ""];
        if (column && approval.requestedValue) {
          await applyTier1Field(db, approval.userId, approval.field ?? approval.kind, approval.requestedValue, "admin", approval.blandCallId, ctx.user.id);
        } else {
          // Informational kind (address, cancellation, dispute): record the
          // decision as a note + audit entry so the timeline stays complete.
          await db.insert(accountNotes).values({
            userId: approval.userId,
            authorType: "admin",
            note: `Approved voice request (${approval.kind}): "${approval.requestedValue ?? ""}". Handled manually.`,
            blandCallId: approval.blandCallId,
          });
          await db.insert(accountAuditLog).values({
            userId: approval.userId,
            actor: "admin",
            action: "voice_approval_approved_manual",
            entityType: approval.kind,
            blandCallId: approval.blandCallId,
            afterValue: approval.requestedValue,
          });
        }
      } else {
        await db.insert(accountNotes).values({
          userId: approval.userId,
          authorType: "admin",
          note: `Declined voice request (${approval.kind}): "${approval.requestedValue ?? ""}".`,
          blandCallId: approval.blandCallId,
        });
      }
      await db
        .update(voiceApprovals)
        .set({ status: input.approve ? "approved" : "rejected", resolvedAt: new Date(), resolvedBy: ctx.user.id })
        .where(eq(voiceApprovals.id, input.id));
      return { success: true };
    }),

  /** Spam blocklist management. */
  listBlockedNumbers: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(blockedNumbers).orderBy(desc(blockedNumbers.createdAt)).limit(200);
  }),

  addBlockedNumber: adminProcedure
    .input(z.object({ phone: z.string().min(7), reason: z.string().max(255).optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const digits = input.phone.replace(/\D/g, "");
      if (digits.length < 7) throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a valid phone number" });
      const existing = await db
        .select({ id: blockedNumbers.id })
        .from(blockedNumbers)
        .where(eq(blockedNumbers.phone, digits))
        .limit(1);
      if (existing.length > 0) return { success: true, duplicate: true };
      await db.insert(blockedNumbers).values({ phone: digits, reason: input.reason ?? null, source: "manual" });
      return { success: true };
    }),

  removeBlockedNumber: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.delete(blockedNumbers).where(eq(blockedNumbers.id, input.id));
      return { success: true };
    }),
});

export const voiceRouter = router({
  customer: customerRouter,
  admin: adminRouter,
  /** Back-compat: customer procedures also reachable at the top level. */
  setPhonePin: customerRouter.setPhonePin,
  getPhonePinStatus: customerRouter.getPhonePinStatus,
  getMyActivity: customerRouter.getMyActivity,
});
