import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createClient, getClient, listClients, updateClient, listClientNotes, createClientNote, updateClientNote, deleteClientNote } from "../db";
import { logActivity } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const isAdminOrStaff = (role: string) => role === "admin" || role === "staff";

export const clientsRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional(), showArchived: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (!isAdminOrStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      return listClients(input?.search, input?.showArchived);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!isAdminOrStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const client = await getClient(input.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND" });
      return client;
    }),

  create: protectedProcedure
    .input(z.object({
      companyName: z.string().min(1),
      contactName: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      billingEmail: z.string().email().optional(),
      packageId: z.number().optional(),
      status: z.enum(["active", "inactive", "onboarding", "suspended"]).optional(),
      projectNotes: z.string().optional(),
      address: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await createClient(input);
      await logActivity({ userId: ctx.user.id, action: `Created client: ${input.companyName}`, entityType: "client" });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      companyName: z.string().min(1).optional(),
      contactName: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      billingEmail: z.string().email().optional(),
      packageId: z.number().optional(),
      status: z.enum(["active", "inactive", "onboarding", "suspended"]).optional(),
      projectNotes: z.string().optional(),
      address: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await updateClient(id, data);
      await logActivity({ userId: ctx.user.id, clientId: id, action: `Updated client #${id}`, entityType: "client", entityId: id });
      return { success: true };
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const client = await getClient(input.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND" });
      await updateClient(input.id, { archivedAt: new Date() } as any);
      await logActivity({ userId: ctx.user.id, clientId: input.id, action: `Archived client: ${client.companyName}`, entityType: "client", entityId: input.id });
      return { success: true };
    }),

  unarchive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const client = await getClient(input.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND" });
      await updateClient(input.id, { archivedAt: null } as any);
      await logActivity({ userId: ctx.user.id, clientId: input.id, action: `Unarchived client: ${client.companyName}`, entityType: "client", entityId: input.id });
      return { success: true };
    }),

  // ── Internal Notes (staff/admin only) ──────────────────────────────────────
  listNotes: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!isAdminOrStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      return listClientNotes(input.clientId);
    }),

  addNote: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      body: z.string().min(1).max(4000),
      isPinned: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdminOrStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      await createClientNote({ clientId: input.clientId, authorId: ctx.user.id, authorName: ctx.user.name ?? undefined, body: input.body, isPinned: input.isPinned ?? false });
      return { success: true };
    }),

  updateNote: protectedProcedure
    .input(z.object({
      id: z.number(),
      body: z.string().min(1).max(4000).optional(),
      isPinned: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdminOrStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await updateClientNote(id, data);
      return { success: true };
    }),

  deleteNote: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdminOrStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      await deleteClientNote(input.id);
      return { success: true };
    }),
});
