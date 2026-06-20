import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createPhoto, getDashboardStats, getClientUsage, getClient, getPackage,
  listActivityLogs, listPhotosByClient, listPhotos, listUsers, logActivity,
  updateUserRole, updateUser, deleteUser, getUserById,
} from "../db";
import { storagePut } from "../storage";
import { protectedProcedure, router } from "../_core/trpc";

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

  clientUsage: protectedProcedure
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
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const { userId, ...data } = input;
      await updateUser(userId, data);
      await logActivity({ userId: ctx.user.id, action: `Updated user #${userId} profile`, entityType: "user", entityId: userId });
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
});
