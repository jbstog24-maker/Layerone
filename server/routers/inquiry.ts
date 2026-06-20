import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";
import { sendWelcomeEmail } from "../email";
import {
  getDb,
  listInquiries,
  getInquiry,
  updateInquiryStatus,
  deleteInquiry,
  countNewInquiries,
} from "../db";
import { packageInquiries } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

function requireStaffOrAdmin(role: string | undefined) {
  if (role !== "admin" && role !== "staff") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin or staff access required" });
  }
}

export const inquiryRouter = router({
  // ── Public: submit inquiry from landing page ──────────────────────────────
  submit: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(120),
      company: z.string().min(1).max(200),
      email: z.string().email().max(320),
      phone: z.string().max(30).optional(),
      tier: z.enum(["basic", "standard", "professional", "enterprise", "custom"]),
      deviceVolume: z.string().max(30).optional(),
      message: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (db) {
        await db.insert(packageInquiries).values({
          name: input.name,
          company: input.company,
          email: input.email,
          phone: input.phone ?? null,
          tier: input.tier,
          deviceVolume: input.deviceVolume ?? null,
          message: input.message ?? null,
        });
      }

      const tierLabel = input.tier.charAt(0).toUpperCase() + input.tier.slice(1);
      const content = [
        `**Name:** ${input.name}`,
        `**Company:** ${input.company}`,
        `**Email:** ${input.email}`,
        input.phone ? `**Phone:** ${input.phone}` : null,
        `**Package:** ${tierLabel}`,
        input.deviceVolume ? `**Device Volume:** ${input.deviceVolume}` : null,
        input.message ? `**Message:** ${input.message}` : null,
      ].filter(Boolean).join("\n");

      await notifyOwner({
        title: `New Package Inquiry — ${tierLabel} (${input.company})`,
        content,
      }).catch(() => {});

      // Send branded welcome email to the prospect
      await sendWelcomeEmail({
        to: input.email,
        name: input.name,
        company: input.company,
        tier: input.tier,
      }).catch(() => {});

      return { success: true };
    }),

  // ── Admin/Staff: list inquiries with optional filters ─────────────────────
  list: protectedProcedure
    .input(z.object({
      status: z.enum(["new", "contacted", "closed"]).optional(),
      tier: z.enum(["basic", "standard", "professional", "enterprise", "custom"]).optional(),
      search: z.string().max(200).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);
      return listInquiries({
        status: input?.status,
        tier: input?.tier,
        search: input?.search,
      });
    }),

  // ── Admin/Staff: get single inquiry ──────────────────────────────────────
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);
      const row = await getInquiry(input.id);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),

  // ── Admin/Staff: update status ────────────────────────────────────────────
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["new", "contacted", "closed"]),
    }))
    .mutation(async ({ ctx, input }) => {
      requireStaffOrAdmin(ctx.user?.role);
      await updateInquiryStatus(input.id, input.status);
      return { success: true };
    }),

  // ── Admin only: delete inquiry ────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      await deleteInquiry(input.id);
      return { success: true };
    }),

  // ── Admin/Staff: count new inquiries (for badge) ──────────────────────────
  countNew: protectedProcedure
    .query(async ({ ctx }) => {
      requireStaffOrAdmin(ctx.user?.role);
      return countNewInquiries();
    }),
});
