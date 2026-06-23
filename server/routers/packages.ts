import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createPackage, getPackage, listPackages, updatePackage } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

// Must match the DB enum: mysqlEnum("tier", ["basic","standard","professional","enterprise","custom"])
const TIER_ENUM = z.enum(["basic", "standard", "professional", "enterprise", "custom"]);

export const packagesRouter = router({
  list: publicProcedure.query(() => listPackages()),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const pkg = await getPackage(input.id);
      if (!pkg) throw new TRPCError({ code: "NOT_FOUND" });
      return pkg;
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      tier: TIER_ENUM,
      basePrice: z.string(),
      billingCycle: z.enum(["one_time", "monthly"]).optional(),
      maxDevices: z.number().optional(),
      maxBoxes: z.number().optional(),
      maxPallets: z.number().optional(),
      storageDays: z.number().optional(),
      maxOutboundShipments: z.number().optional(),
      includedLaborHours: z.number().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await createPackage(input as any);
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      tier: TIER_ENUM.optional(),
      basePrice: z.string().optional(),
      billingCycle: z.enum(["one_time", "monthly"]).optional(),
      maxDevices: z.number().optional(),
      maxBoxes: z.number().optional(),
      maxPallets: z.number().optional(),
      storageDays: z.number().optional(),
      maxOutboundShipments: z.number().optional(),
      includedLaborHours: z.number().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await updatePackage(id, data as any);
      return { success: true };
    }),
});
