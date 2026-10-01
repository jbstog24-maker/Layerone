import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq, gte, isNull, sql } from "drizzle-orm";
import {
  createPhoto, getDashboardStats, getClientUsage, getClient, getPackage,
  listActivityLogs, listPhotosByClient, listPhotos, listUsers, logActivity,
  updateUserRole, updateUser, deleteUser, getUserById, createUser, getDb,
  setInviteToken, countPurgeableUnnamedUsers, deletePurgeableUnnamedUsers,
} from "../db";
import { storagePut } from "../storage";
import { customerProcedure, protectedProcedure, router } from "../_core/trpc";
import { sendPortalInviteEmail } from "../email";
import { ENV } from "../_core/env";
import { randomBytes } from "crypto";
import { devices, outboundShipments, invoices, clients, packageInquiries, quotes, receivingLogs } from "../../drizzle/schema";

const isAdmin = (role: string) => role === "admin";
const isStaffOrAdmin = (role: string) => role === "admin" || role === "staff";
const canRead = (role: string, userClientId: number | null | undefined, targetClientId: number) => {
  if (isStaffOrAdmin(role)) return true;
  return userClientId === targetClientId;
};

// ─── Photos ───────────────────────────────────────────────────────────────────
export const photosRouter = router({
  list: protectedProcedure
    .input(z.object({ entityType: z.string(), entityId: z.number() }))
    .query(async ({ ctx, input }) => {
      return listPhotos(input.entityType, input.entityId);
    }),

  listByClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!canRead(ctx.user.role, ctx.user.clientId, input.clientId)) throw new TRPCError({ code: "FORBIDDEN" });
      return listPhotosByClient(input.clientId);
    }),

  upload: protectedProcedure
    .input(z.object({
      entityType: z.enum(["delivery", "receiving_log", "pallet", "box", "device", "staging_task", "shipment", "exception"]),
      entityId: z.number(),
      clientId: z.number(),
      fileName: z.string(),
      mimeType: z.string(),
      dataBase64: z.string(),
      caption: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role === "customer_viewer") throw new TRPCError({ code: "FORBIDDEN" });
      if (!canRead(ctx.user.role, ctx.user.clientId, input.clientId)) throw new TRPCError({ code: "FORBIDDEN" });

      const buffer = Buffer.from(input.dataBase64, "base64");
      const fileKey = `photos/${input.clientId}/${input.entityType}/${input.entityId}/${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      await createPhoto({
        entityType: input.entityType,
        entityId: input.entityId,
        clientId: input.clientId,
        fileKey,
        url,
        fileName: input.fileName,
        mimeType: input.mimeType,
        caption: input.caption,
        uploadedBy: ctx.user.id,
      });

      await logActivity({ userId: ctx.user.id, clientId: input.clientId, action: `Uploaded photo for ${input.entityType} #${input.entityId}`, entityType: input.entityType, entityId: input.entityId });
      return { success: true, url };
    }),
});

// ─── Activity Logs ────────────────────────────────────────────────────────────
export const activityRouter = router({
  list: protectedProcedure
    .input(z.object({ clientId: z.number().optional(), limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role === "customer_admin" || ctx.user.role === "customer_viewer") {
        return listActivityLogs(ctx.user.clientId ?? undefined, input?.limit);
      }
      return listActivityLogs(input?.clientId, input?.limit);
    }),
});

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardRouter = router({
  adminStats: protectedProcedure.query(async ({ ctx }) => {
    if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
    return getDashboardStats();
  }),

  clientUsage: customerProcedure
    .input(z.object({ clientId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      let clientId = input?.clientId;
      if (ctx.user.role === "customer_admin" || ctx.user.role === "customer_viewer") {
        clientId = ctx.user.clientId ?? undefined;
      }
      if (!clientId) return null;
      const usage = await getClientUsage(clientId);
      const client = await getClient(clientId);
      const pkg = client?.packageId ? await getPackage(client.packageId) : null;
      return { usage, client, pkg };
    }),

  monthlyStats: protectedProcedure
    .input(z.object({ months: z.number().min(3).max(24).default(12) }))
    .query(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) return [];
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - input.months + 1);
      cutoff.setDate(1); cutoff.setHours(0, 0, 0, 0);
      const months: { year: number; month: number; label: string }[] = [];
      for (let i = input.months - 1; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        months.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleString("en-US", { month: "short", year: "2-digit" }) });
      }
      const devRows = await db.select({ yr: sql<number>`YEAR(createdAt)`, mo: sql<number>`MONTH(createdAt)`, count: sql<number>`COUNT(*)` }).from(devices).where(gte(devices.createdAt, cutoff)).groupBy(sql`YEAR(createdAt), MONTH(createdAt)`);
      const shipRows = await db.select({ yr: sql<number>`YEAR(createdAt)`, mo: sql<number>`MONTH(createdAt)`, count: sql<number>`COUNT(*)` }).from(outboundShipments).where(gte(outboundShipments.createdAt, cutoff)).groupBy(sql`YEAR(createdAt), MONTH(createdAt)`);
      const recvRows = await db.select({ yr: sql<number>`YEAR(createdAt)`, mo: sql<number>`MONTH(createdAt)`, count: sql<number>`COUNT(*)` }).from(receivingLogs).where(gte(receivingLogs.createdAt, cutoff)).groupBy(sql`YEAR(createdAt), MONTH(createdAt)`);
      return months.map(({ year, month, label }) => ({
        label,
        devices: Number(devRows.find(r => Number(r.yr) === year && Number(r.mo) === month)?.count ?? 0),
        shipments: Number(shipRows.find(r => Number(r.yr) === year && Number(r.mo) === month)?.count ?? 0),
        receivings: Number(recvRows.find(r => Number(r.yr) === year && Number(r.mo) === month)?.count ?? 0),
      }));
    }),

  revenueByClient: protectedProcedure
    .input(z.object({ months: z.number().min(1).max(24).default(12) }))
    .query(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) return [];
      const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - input.months);
      const rows = await db
        .select({ clientId: invoices.clientId, companyName: clients.companyName, revenue: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} IN ('paid','sent') THEN CAST(${invoices.total} AS DECIMAL(12,2)) ELSE 0 END), 0)`, invoiceCount: sql<number>`COUNT(*)` })
        .from(invoices)
        .leftJoin(clients, eq(invoices.clientId, clients.id))
        .where(gte(invoices.createdAt, cutoff))
        .groupBy(invoices.clientId, clients.companyName)
        .orderBy(sql`revenue DESC`)
        .limit(10);
      return rows.map(r => ({ clientId: r.clientId, companyName: r.companyName ?? `Client #${r.clientId}`, revenue: Number(r.revenue), invoiceCount: Number(r.invoiceCount) }));
    }),

  pipelineFunnel: protectedProcedure.query(async ({ ctx }) => {
    if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return [];
    const [inquiryCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(packageInquiries);
    const [quotedCount] = await db.select({ count: sql<number>`COUNT(DISTINCT inquiryId)` }).from(quotes);
    const [paidCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(quotes).where(eq(quotes.status, "paid"));
    const [activeClients] = await db.select({ count: sql<number>`COUNT(*)` }).from(clients).where(isNull(clients.archivedAt));
    return [
      { stage: "Inquiries", count: Number(inquiryCount?.count ?? 0), fill: "#6366f1" },
      { stage: "Quoted", count: Number(quotedCount?.count ?? 0), fill: "#8b5cf6" },
      { stage: "Paid", count: Number(paidCount?.count ?? 0), fill: "#06b6d4" },
      { stage: "Active Clients", count: Number(activeClients?.count ?? 0), fill: "#10b981" },
    ];
  }),
});

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
    return listUsers();
  }),

  getById: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      return getUserById(input.userId);
    }),

  updateRole: protectedProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["admin", "staff", "customer_admin", "customer_viewer"]),
      clientId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      await updateUserRole(input.userId, input.role, input.clientId);
      await logActivity({ userId: ctx.user.id, action: `Updated user #${input.userId} role to ${input.role}`, entityType: "user", entityId: input.userId });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      userId: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      role: z.enum(["admin", "staff", "customer_admin", "customer_viewer"]).optional(),
      clientId: z.number().nullable().optional(),
      businessName: z.string().nullable().optional(),
      phone: z.string().nullable().optional(),
      location: z.string().nullable().optional(),
      jobTitle: z.string().nullable().optional(),
      department: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const { userId, ...data } = input;
      await updateUser(userId, data);
      await logActivity({ userId: ctx.user.id, action: `Updated user #${userId} profile`, entityType: "user", entityId: userId });
      return { success: true };
    }),

  // Self-service profile update: a signed-in user may edit their own
  // contact details, but never their role, email, or client assignment.
  updateMe: protectedProcedure
    .input(z.object({
      name: z.string().trim().min(1, "Name is required").max(200),
      phone: z.string().trim().max(30).nullish(),
      jobTitle: z.string().trim().max(128).nullish(),
      department: z.string().trim().max(128).nullish(),
    }))
    .mutation(async ({ ctx, input }) => {
      await updateUser(ctx.user.id, {
        name: input.name,
        phone: input.phone?.trim() ? input.phone.trim() : null,
        jobTitle: input.jobTitle?.trim() ? input.jobTitle.trim() : null,
        department: input.department?.trim() ? input.department.trim() : null,
      });
      return { success: true };
    }),

  setActive: protectedProcedure
    .input(z.object({ userId: z.number(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      if (input.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot deactivate your own account" });
      await updateUser(input.userId, { isActive: input.isActive });
      await logActivity({ userId: ctx.user.id, action: `${input.isActive ? "Activated" : "Deactivated"} user #${input.userId}`, entityType: "user", entityId: input.userId });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      if (input.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot delete your own account" });
      await deleteUser(input.userId);
      await logActivity({ userId: ctx.user.id, action: `Deleted user #${input.userId}`, entityType: "user", entityId: input.userId });
      return { success: true };
    }),

  // ── Unnamed-account cleanup ──────────────────────────────────────────
  // Unnamed accounts are never legitimate: every creation path requires a
  // name. These endpoints let an admin preview and bulk-delete them.
  unnamedCount: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
    return { count: await countPurgeableUnnamedUsers(ctx.user.id) };
  }),

  purgeUnnamed: protectedProcedure.mutation(async ({ ctx }) => {
    if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
    const deleted = await deletePurgeableUnnamedUsers(ctx.user.id);
    await logActivity({ userId: ctx.user.id, action: `Purged ${deleted} unnamed user accounts`, entityType: "user", entityId: 0 });
    return { deleted };
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Valid email required"),
      role: z.enum(["admin", "staff", "customer_admin", "customer_viewer"]),
      clientId: z.number().nullable().optional(),
      businessName: z.string().nullable().optional(),
      phone: z.string().nullable().optional(),
      location: z.string().nullable().optional(),
      jobTitle: z.string().nullable().optional(),
      department: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      // New accounts are created without a password - generate a single-use
      // set-password token so the invite email can activate the account.
      const inviteToken = randomBytes(32).toString("hex");
      const inviteTokenExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
      const result = await createUser({ ...input, inviteToken, inviteTokenExpiresAt });
      await logActivity({ userId: ctx.user.id, action: `Pre-provisioned user ${input.email} with role ${input.role}`, entityType: "user", entityId: result.id });
      // Send portal invite email to the newly created user
      const portalBase = (ENV.portalUrl ?? "https://www.layeronestaging.com").replace(/\/+$/, "");
      await sendPortalInviteEmail({
        to: input.email,
        name: input.name,
        businessName: input.businessName,
        role: input.role,
        setPasswordUrl: `${portalBase}/set-password?token=${inviteToken}`,
      }).catch(() => {});
      return result;
    }),

  resendInvite: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const user = await getUserById(input.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      if (!user.email) throw new TRPCError({ code: "BAD_REQUEST", message: "User has no email address" });
      // Issue a fresh single-use set-password token (the old one may have expired).
      const inviteToken = randomBytes(32).toString("hex");
      const inviteTokenExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
      await setInviteToken(user.id, inviteToken, inviteTokenExpiresAt);
      const portalBase = (ENV.portalUrl ?? "https://www.layeronestaging.com").replace(/\/+$/, "");
      await sendPortalInviteEmail({
        to: user.email,
        name: user.name ?? user.email,
        businessName: (user as any).businessName ?? null,
        role: user.role,
        setPasswordUrl: `${portalBase}/set-password?token=${inviteToken}`,
      });
      await logActivity({ userId: ctx.user.id, action: `Resent portal invite to ${user.email}`, entityType: "user", entityId: user.id });
      return { success: true };
    }),

  markTourSeen: protectedProcedure.mutation(async ({ ctx }) => {
    await updateUser(ctx.user.id, { hasSeenTour: true } as any);
    return { success: true };
  }),

  resetTour: protectedProcedure.mutation(async ({ ctx }) => {
    // Allows a user to replay the tour from the Help page
    await updateUser(ctx.user.id, { hasSeenTour: false } as any);
    return { success: true };
  }),
});
