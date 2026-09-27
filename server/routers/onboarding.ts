import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  onboardingChecklists,
  onboardingTasks,
  packageInquiries,
} from "../../drizzle/schema";

function requireStaffOrAdmin(role: string | undefined) {
  if (role !== "admin" && role !== "staff") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin or staff access required" });
  }
}

function dbOrThrow() {
  return getDb().then((db) => {
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    }
    return db;
  });
}

function parseUnitAssignment(raw: string | null): {
  bays: string[];
  shelves: string[];
  pallets: string[];
  notes?: string;
} | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return {
      bays: Array.isArray(parsed.bays) ? parsed.bays : [],
      shelves: Array.isArray(parsed.shelves) ? parsed.shelves : [],
      pallets: Array.isArray(parsed.pallets) ? parsed.pallets : [],
      notes: typeof parsed.notes === "string" ? parsed.notes : undefined,
    };
  } catch {
    return null;
  }
}

const unitAssignmentSchema = z.object({
  bays: z.array(z.string().max(60)).default([]),
  shelves: z.array(z.string().max(60)).default([]),
  pallets: z.array(z.string().max(60)).default([]),
  notes: z.string().max(1000).optional(),
});

export const onboardingRouter = router({
  // ── Get the checklist + tasks for one inquiry ─────────────────────────────
  getChecklist: protectedProcedure
    .input(z.object({ inquiryId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);
      const db = await dbOrThrow();
      const [checklist] = await db
        .select()
        .from(onboardingChecklists)
        .where(eq(onboardingChecklists.inquiryId, input.inquiryId));
      if (!checklist) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No onboarding checklist for this inquiry",
        });
      }
      const tasks = await db
        .select()
        .from(onboardingTasks)
        .where(eq(onboardingTasks.checklistId, checklist.id))
        .orderBy(asc(onboardingTasks.sortOrder));
      return {
        checklist: {
          ...checklist,
          unitAssignment: parseUnitAssignment(checklist.unitAssignment),
        },
        tasks,
      };
    }),

  // ── List all checklists (with inquiry company) ─────────────────────────────
  listChecklists: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(["open", "in_progress", "complete"]).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);
      const db = await dbOrThrow();
      const conditions = input?.status
        ? [eq(onboardingChecklists.status, input.status)]
        : [];
      let query = db
        .select({
          checklist: onboardingChecklists,
          company: packageInquiries.company,
          inquiryStatus: packageInquiries.status,
        })
        .from(onboardingChecklists)
        .innerJoin(
          packageInquiries,
          eq(onboardingChecklists.inquiryId, packageInquiries.id)
        )
        .$dynamic();
      if (conditions.length > 0) query = query.where(and(...conditions));
      const rows = await query.orderBy(desc(onboardingChecklists.updatedAt));
      return rows.map((r) => ({
        ...r.checklist,
        unitAssignment: parseUnitAssignment(r.checklist.unitAssignment),
        company: r.company,
        inquiryStatus: r.inquiryStatus,
      }));
    }),

  // ── Toggle a task; completing all tasks completes the checklist ────────────
  toggleTask: protectedProcedure
    .input(
      z.object({
        taskId: z.number().int(),
        completed: z.boolean(),
        completedBy: z.string().max(120).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);
      const db = await dbOrThrow();
      const [task] = await db
        .select()
        .from(onboardingTasks)
        .where(eq(onboardingTasks.id, input.taskId));
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      const now = new Date();
      await db
        .update(onboardingTasks)
        .set({
          completedAt: input.completed ? now : null,
          completedBy: input.completed
            ? (input.completedBy ?? ctx.user?.email ?? "staff")
            : null,
        })
        .where(eq(onboardingTasks.id, input.taskId));

      const tasks = await db
        .select()
        .from(onboardingTasks)
        .where(eq(onboardingTasks.checklistId, task.checklistId));
      const allDone = tasks.length > 0 && tasks.every((t) => t.completedAt != null);

      const [checklist] = await db
        .select()
        .from(onboardingChecklists)
        .where(eq(onboardingChecklists.id, task.checklistId));

      if (allDone && checklist && checklist.status !== "complete") {
        await db
          .update(onboardingChecklists)
          .set({ status: "complete", completedAt: now })
          .where(eq(onboardingChecklists.id, checklist.id));
        await db
          .update(packageInquiries)
          .set({ status: "won" })
          .where(eq(packageInquiries.id, checklist.inquiryId));
      } else if (!allDone && checklist && checklist.status === "complete") {
        // Reopened — a task was unchecked after completion.
        await db
          .update(onboardingChecklists)
          .set({ status: "in_progress", completedAt: null })
          .where(eq(onboardingChecklists.id, checklist.id));
      }

      return { success: true, allComplete: allDone };
    }),

  // ── Assign staging units (bays / shelves / pallets) ────────────────────────
  assignUnits: protectedProcedure
    .input(
      z.object({
        checklistId: z.number().int(),
        unitAssignment: unitAssignmentSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);
      const db = await dbOrThrow();
      await db
        .update(onboardingChecklists)
        .set({ unitAssignment: JSON.stringify(input.unitAssignment) })
        .where(eq(onboardingChecklists.id, input.checklistId));
      return { success: true };
    }),

  // ── Update checklist notes ─────────────────────────────────────────────────
  updateNotes: protectedProcedure
    .input(
      z.object({
        checklistId: z.number().int(),
        notes: z.string().max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);
      const db = await dbOrThrow();
      await db
        .update(onboardingChecklists)
        .set({ notes: input.notes })
        .where(eq(onboardingChecklists.id, input.checklistId));
      return { success: true };
    }),

  // ── Explicitly complete a checklist (marks inquiry won) ────────────────────
  completeChecklist: protectedProcedure
    .input(z.object({ checklistId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);
      const db = await dbOrThrow();
      const [checklist] = await db
        .select()
        .from(onboardingChecklists)
        .where(eq(onboardingChecklists.id, input.checklistId));
      if (!checklist) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Checklist not found" });
      }
      const now = new Date();
      const completedBy = ctx.user?.email ?? "staff";
      // Close out any remaining open tasks so the checklist is consistent.
      await db
        .update(onboardingTasks)
        .set({ completedAt: now, completedBy })
        .where(
          and(
            eq(onboardingTasks.checklistId, input.checklistId),
            isNull(onboardingTasks.completedAt)
          )
        );
      await db
        .update(onboardingChecklists)
        .set({ status: "complete", completedAt: now })
        .where(eq(onboardingChecklists.id, input.checklistId));
      await db
        .update(packageInquiries)
        .set({ status: "won" })
        .where(eq(packageInquiries.id, checklist.inquiryId));
      return { success: true };
    }),
});
