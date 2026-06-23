import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  createBox, createDevice, createPallet, createReceivingLog,
  getBox, getClient, getDevice, getPallet, getReceivingLog,
  getDb,
  listBoxes, listDevices, listPallets, listReceivingLogs,
  logActivity, updateBox, updateDevice, updatePallet, updateReceivingLog,
} from "../db";
import { sendDeliveryNotificationEmail } from "../email";
import { protectedProcedure, router } from "../_core/trpc";

const isStaffOrAdmin = (role: string) => role === "admin" || role === "staff";
const canRead = (role: string, userClientId: number | null | undefined, targetClientId: number) => {
  if (isStaffOrAdmin(role)) return true;
  return userClientId === targetClientId;
};

// ─── Receiving Logs ───────────────────────────────────────────────────────────
export const receivingRouter = router({
  list: protectedProcedure
    .input(z.object({ clientId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role === "customer_admin" || ctx.user.role === "customer_viewer") {
        return listReceivingLogs(ctx.user.clientId ?? undefined);
      }
      return listReceivingLogs(input?.clientId);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const log = await getReceivingLog(input.id);
      if (!log) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canRead(ctx.user.role, ctx.user.clientId, log.clientId)) throw new TRPCError({ code: "FORBIDDEN" });
      return log;
    }),

  create: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      deliveryId: z.number().optional(),
      projectName: z.string().optional(),
      carrier: z.string().optional(),
      trackingNumber: z.string().optional(),
      boxCount: z.number().optional(),
      palletCount: z.number().optional(),
      condition: z.enum(["good", "damaged", "exception", "partial"]).optional(),
      storageLocation: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      await createReceivingLog({ ...input, receivedBy: ctx.user.id });
      await logActivity({ userId: ctx.user.id, clientId: input.clientId, action: `Logged receiving: ${input.boxCount ?? 0} boxes, ${input.palletCount ?? 0} pallets`, entityType: "receiving_log" });
      // Auto-notify client via email (non-blocking)
      try {
        const client = await getClient(input.clientId);
        if (client?.contactEmail) {
          sendDeliveryNotificationEmail({
            to: client.contactEmail,
            clientName: client.companyName,
            boxCount: input.boxCount ?? 0,
            palletCount: input.palletCount ?? 0,
            carrier: input.carrier,
            trackingNumber: input.trackingNumber,
            storageLocation: input.storageLocation,
            notes: input.notes,
            receivedAt: new Date(),
          }).catch(() => {});
        }
      } catch (_e) { /* non-blocking */ }
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      condition: z.enum(["good", "damaged", "exception", "partial"]).optional(),
      storageLocation: z.string().optional(),
      notes: z.string().optional(),
      status: z.enum(["pending", "processed", "exception"]).optional(),
      boxCount: z.number().optional(),
      palletCount: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await updateReceivingLog(id, data);
      return { success: true };
    }),
});

// ─── Pallets ──────────────────────────────────────────────────────────────────
export const palletsRouter = router({
  list: protectedProcedure
    .input(z.object({ clientId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role === "customer_admin" || ctx.user.role === "customer_viewer") {
        return listPallets(ctx.user.clientId ?? undefined);
      }
      return listPallets(input?.clientId);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const pallet = await getPallet(input.id);
      if (!pallet) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canRead(ctx.user.role, ctx.user.clientId, pallet.clientId)) throw new TRPCError({ code: "FORBIDDEN" });
      return pallet;
    }),

  create: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      projectName: z.string().optional(),
      deliveryId: z.number().optional(),
      receivingLogId: z.number().optional(),
      boxCount: z.number().optional(),
      storageLocation: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const result = await createPallet(input);
      await logActivity({ userId: ctx.user.id, clientId: input.clientId, action: `Created pallet ${result.palletCode}`, entityType: "pallet" });
      return result;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["received", "in_storage", "staging", "ready_to_ship", "shipped", "exception"]).optional(),
      storageLocation: z.string().optional(),
      boxCount: z.number().optional(),
      notes: z.string().optional(),
      dateRemoved: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await updatePallet(id, {
        ...data,
        dateRemoved: data.dateRemoved ? new Date(data.dateRemoved) : undefined,
      });
      await logActivity({ userId: ctx.user.id, action: `Updated pallet #${id}`, entityType: "pallet", entityId: id });
      return { success: true };
    }),
});

// ─── Boxes ────────────────────────────────────────────────────────────────────
export const boxesRouter = router({
  list: protectedProcedure
    .input(z.object({ clientId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role === "customer_admin" || ctx.user.role === "customer_viewer") {
        return listBoxes(ctx.user.clientId ?? undefined);
      }
      return listBoxes(input?.clientId);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const box = await getBox(input.id);
      if (!box) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canRead(ctx.user.role, ctx.user.clientId, box.clientId)) throw new TRPCError({ code: "FORBIDDEN" });
      return box;
    }),

  create: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      projectName: z.string().optional(),
      palletId: z.number().optional(),
      deliveryId: z.number().optional(),
      receivingLogId: z.number().optional(),
      trackingNumber: z.string().optional(),
      condition: z.enum(["good", "damaged", "exception"]).optional(),
      contents: z.string().optional(),
      storageLocation: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const result = await createBox(input);
      await logActivity({ userId: ctx.user.id, clientId: input.clientId, action: `Created box ${result.boxCode}`, entityType: "box" });
      return result;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["received", "in_storage", "staging", "packed", "shipped", "exception"]).optional(),
      condition: z.enum(["good", "damaged", "exception"]).optional(),
      storageLocation: z.string().optional(),
      contents: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await updateBox(id, data);
      return { success: true };
    }),
});

// ─── Devices ──────────────────────────────────────────────────────────────────
export const devicesRouter = router({
  list: protectedProcedure
    .input(z.object({ clientId: z.number().optional(), search: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role === "customer_admin" || ctx.user.role === "customer_viewer") {
        return listDevices(ctx.user.clientId ?? undefined, input?.search);
      }
      return listDevices(input?.clientId, input?.search);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const device = await getDevice(input.id);
      if (!device) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canRead(ctx.user.role, ctx.user.clientId, device.clientId)) throw new TRPCError({ code: "FORBIDDEN" });
      return device;
    }),

  create: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      projectName: z.string().optional(),
      siteName: z.string().optional(),
      deviceType: z.string().optional(),
      brand: z.string().optional(),
      model: z.string().optional(),
      serialNumber: z.string().optional(),
      macAddress: z.string().optional(),
      assetTag: z.string().optional(),
      boxId: z.number().optional(),
      palletId: z.number().optional(),
      deliveryId: z.number().optional(),
      firmwareVersion: z.string().optional(),
      storageLocation: z.string().optional(),
      notes: z.string().optional(),
      receivingLogId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const result = await createDevice(input);
      await logActivity({ userId: ctx.user.id, clientId: input.clientId, action: `Added device ${result.deviceCode} (${input.model ?? "unknown"})`, entityType: "device" });
      return result;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      stagingStatus: z.enum(["expected", "received", "inventory_captured", "waiting_instructions", "ready_for_staging", "in_staging", "staged", "labeled", "packed", "ready_to_ship", "shipped", "picked_up", "exception"]).optional(),
      configStatus: z.enum(["pending", "in_progress", "complete", "not_required"]).optional(),
      serialNumber: z.string().optional(),
      macAddress: z.string().optional(),
      firmwareVersion: z.string().optional(),
      storageLocation: z.string().optional(),
      notes: z.string().optional(),
      assetTag: z.string().optional(),
      brand: z.string().optional(),
      model: z.string().optional(),
      deviceType: z.string().optional(),
      siteName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      const device = await getDevice(id);
      if (!device) throw new TRPCError({ code: "NOT_FOUND" });
      await updateDevice(id, data);
      await logActivity({ userId: ctx.user.id, clientId: device.clientId, action: `Updated device #${id} staging: ${data.stagingStatus ?? "updated"}`, entityType: "device", entityId: id });

      // Auto-advance: if this device was marked staged/labeled/packed, check if all task devices are now staged
      const stagedStatuses = ["staged", "labeled", "packed", "ready_to_ship", "shipped", "picked_up"];
      if (data.stagingStatus && stagedStatuses.includes(data.stagingStatus)) {
        try {
          const db2 = await getDb();
          if (db2) {
            const { stagingTaskDevices } = await import("../../drizzle/schema");
            const taskLinks = await db2.select().from(stagingTaskDevices).where(eq(stagingTaskDevices.deviceId, id));
            for (const link of taskLinks) {
              const { getStagingTask, getStagingTaskDevices, updateStagingTask } = await import("../db");
              const task = await getStagingTask(link.taskId);
              if (!task || task.status === "completed" || task.status === "cancelled") continue;
              const allDevices = await getStagingTaskDevices(link.taskId);
              const { devices: devicesTable } = await import("../../drizzle/schema");
              const { inArray } = await import("drizzle-orm");
              const deviceIds = allDevices.map((td: any) => td.deviceId);
              const deviceRows = await db2.select({ stagingStatus: devicesTable.stagingStatus })
                .from(devicesTable).where(inArray(devicesTable.id, deviceIds));
              const allStaged = deviceRows.length > 0 && deviceRows.every((d: any) => stagedStatuses.includes(d.stagingStatus ?? ""));
              if (allStaged) {
                await updateStagingTask(link.taskId, { status: "completed", completionDate: new Date() } as any);
                await logActivity({ userId: ctx.user.id, clientId: task.clientId, action: `Staging task #${link.taskId} auto-completed (all ${deviceIds.length} devices staged)`, entityType: "staging_task", entityId: link.taskId });
              }
            }
          }
        } catch (_e) { /* non-blocking */ }
      }

      return { success: true };
    }),

  batchImport: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      devices: z.array(z.object({
        deviceType: z.string().optional(),
        brand: z.string().optional(),
        model: z.string().optional(),
        serialNumber: z.string().optional(),
        macAddress: z.string().optional(),
        assetTag: z.string().optional(),
        siteName: z.string().optional(),
        projectName: z.string().optional(),
        notes: z.string().optional(),
      })).min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const results = [];
      for (const device of input.devices) {
        const result = await createDevice({ ...device, clientId: input.clientId });
        results.push(result);
      }
      await logActivity({ userId: ctx.user.id, clientId: input.clientId, action: `Bulk imported ${results.length} devices via CSV`, entityType: "device" });
      return { imported: results.length, devices: results };
    }),
});
