import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createDelivery, getDelivery, listDeliveries, logActivity, updateDelivery } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const canAccessClient = (userRole: string, userClientId: number | null | undefined, targetClientId: number) => {
  if (userRole === "admin" || userRole === "staff") return true;
  return userClientId === targetClientId;
};

export const deliveriesRouter = router({
  list: protectedProcedure
    .input(z.object({ clientId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role === "customer_admin" || ctx.user.role === "customer_viewer") {
        return listDeliveries(ctx.user.clientId ?? undefined);
      }
      return listDeliveries(input?.clientId);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const delivery = await getDelivery(input.id);
      if (!delivery) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canAccessClient(ctx.user.role, ctx.user.clientId, delivery.clientId)) throw new TRPCError({ code: "FORBIDDEN" });
      return delivery;
    }),

  create: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      projectName: z.string().optional(),
      carrier: z.string().optional(),
      trackingNumber: z.string().optional(),
      expectedDate: z.string().optional(),
      expectedBoxCount: z.number().optional(),
      expectedPalletCount: z.number().optional(),
      expectedContents: z.string().optional(),
      siteName: z.string().optional(),
      specialInstructions: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role === "customer_viewer") throw new TRPCError({ code: "FORBIDDEN" });
      if (!canAccessClient(ctx.user.role, ctx.user.clientId, input.clientId)) throw new TRPCError({ code: "FORBIDDEN" });
      await createDelivery({
        ...input,
        expectedDate: input.expectedDate ? new Date(input.expectedDate) : undefined,
        createdBy: ctx.user.id,
      });
      await logActivity({ userId: ctx.user.id, clientId: input.clientId, action: `Created expected delivery for ${input.projectName ?? "project"}`, entityType: "delivery" });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["expected", "in_transit", "received", "partially_received", "damaged", "exception", "closed"]).optional(),
      carrier: z.string().optional(),
      trackingNumber: z.string().optional(),
      expectedDate: z.string().optional(),
      expectedBoxCount: z.number().optional(),
      expectedPalletCount: z.number().optional(),
      expectedContents: z.string().optional(),
      siteName: z.string().optional(),
      specialInstructions: z.string().optional(),
      projectName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const delivery = await getDelivery(input.id);
      if (!delivery) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canAccessClient(ctx.user.role, ctx.user.clientId, delivery.clientId)) throw new TRPCError({ code: "FORBIDDEN" });
      if (ctx.user.role === "customer_viewer") throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await updateDelivery(id, {
        ...data,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : undefined,
      });
      await logActivity({ userId: ctx.user.id, clientId: delivery.clientId, action: `Updated delivery #${id} status: ${data.status ?? "updated"}`, entityType: "delivery", entityId: id });
      return { success: true };
    }),
});
