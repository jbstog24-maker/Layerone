import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import {
  getDevice,
  getBox,
  getPallet,
  createStagingNotification,
  listStagingNotifications,
  listAllStagingNotifications,
  getStagingNotification,
  acknowledgeStagingNotification,
  countUnacknowledgedNotifications,
  getUsersByClientId,
  updateDevice,
  updateBox,
  updatePallet,
  logActivity,
} from "../db";
import { sendStagingCompleteEmail } from "../email";

const STAFF_ROLES = ["admin", "staff"] as const;
function isStaff(role: string) {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

/** Resolve any item type to { id, clientId, code, model?, serialNumber? } */
async function resolveItem(itemType: "device" | "box" | "pallet", itemId: number) {
  if (itemType === "device") {
    const d = await getDevice(itemId);
    if (!d) return null;
    return { id: d.id, clientId: d.clientId, code: d.deviceCode, model: d.model, serialNumber: d.serialNumber };
  }
  if (itemType === "box") {
    const b = await getBox(itemId);
    if (!b) return null;
    return { id: b.id, clientId: b.clientId, code: b.boxCode, model: undefined, serialNumber: undefined };
  }
  // pallet
  const p = await getPallet(itemId);
  if (!p) return null;
  return { id: p.id, clientId: p.clientId, code: p.palletCode, model: undefined, serialNumber: undefined };
}

/** Mark an item as ready_to_ship in its own table */
async function markItemReadyToShip(itemType: "device" | "box" | "pallet", itemId: number) {
  if (itemType === "device") return updateDevice(itemId, { stagingStatus: "ready_to_ship" });
  if (itemType === "box") return updateBox(itemId, { status: "ready_to_ship" as any });
  return updatePallet(itemId, { status: "ready_to_ship" as any });
}

export const stagingNotifyRouter = router({
  /**
   * Staff/admin: mark one device as ready to ship and notify the client.
   */
  notifyDevice: protectedProcedure
    .input(z.object({
      deviceId: z.number(),
      message: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });

      const device = await getDevice(input.deviceId);
      if (!device) throw new TRPCError({ code: "NOT_FOUND", message: "Device not found" });

      await updateDevice(device.id, { stagingStatus: "ready_to_ship" });

      const notification = await createStagingNotification({
        itemType: "device",
        itemId: device.id,
        deviceId: device.id,
        clientId: device.clientId,
        notifiedByUserId: ctx.user.id,
        notifiedByName: ctx.user.name ?? "NSDS Staff",
        deviceCode: device.deviceCode,
        message: input.message ?? null,
        emailSent: false,
      });

      const clientUsers = await getUsersByClientId(device.clientId);
      const emailTargets = clientUsers.filter(u => u.email);
      let emailSent = false;

      if (emailTargets.length > 0) {
        const results = await Promise.allSettled(
          emailTargets.map(u =>
            sendStagingCompleteEmail({
              to: u.email!,
              recipientName: u.name ?? u.email!,
              devices: [{ deviceCode: device.deviceCode, model: device.model, serialNumber: device.serialNumber }],
              staffName: ctx.user.name ?? "NSDS Staff",
              message: input.message,
            })
          )
        );
        emailSent = results.some(r => r.status === "fulfilled" && r.value === true);
        if (emailSent) {
          const { stagingNotifications } = await import("../../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          const db = await (await import("../db")).getDb();
          if (db) {
            await db.update(stagingNotifications)
              .set({ emailSent: true })
              .where(eq(stagingNotifications.id, notification.id));
          }
        }
      }

      await logActivity({
        userId: ctx.user.id,
        action: `Marked device ${device.deviceCode} as Ready to Ship`,
        entityType: "device",
        entityId: device.id,
      });

      return { success: true, notificationId: notification.id, emailSent };
    }),

  /**
   * Staff/admin: mark multiple devices as ready to ship in bulk.
   */
  notifyBulk: protectedProcedure
    .input(z.object({
      deviceIds: z.array(z.number()).min(1).max(100),
      message: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });

      const results: Array<{ deviceId: number; deviceCode: string; success: boolean }> = [];
      const clientDeviceMap = new Map<number, typeof results>();

      for (const deviceId of input.deviceIds) {
        const device = await getDevice(deviceId);
        if (!device) {
          results.push({ deviceId, deviceCode: "UNKNOWN", success: false });
          continue;
        }

        await updateDevice(device.id, { stagingStatus: "ready_to_ship" });
        await createStagingNotification({
          itemType: "device",
          itemId: device.id,
          deviceId: device.id,
          clientId: device.clientId,
          notifiedByUserId: ctx.user.id,
          notifiedByName: ctx.user.name ?? "NSDS Staff",
          deviceCode: device.deviceCode,
          message: input.message ?? null,
        });

        const entry = { deviceId, deviceCode: device.deviceCode, success: true };
        results.push(entry);
        if (!clientDeviceMap.has(device.clientId)) clientDeviceMap.set(device.clientId, []);
        clientDeviceMap.get(device.clientId)!.push(entry);
      }

      for (const [clientId, clientDevices] of Array.from(clientDeviceMap.entries())) {
        const clientUsers = await getUsersByClientId(clientId);
        const emailTargets = clientUsers.filter(u => u.email);
        if (emailTargets.length === 0) continue;

        const deviceList = await Promise.all(
          clientDevices.map(async (d: { deviceId: number; deviceCode: string; success: boolean }) => {
            const dev = await getDevice(d.deviceId);
            return { deviceCode: d.deviceCode, model: dev?.model, serialNumber: dev?.serialNumber };
          })
        );

        await Promise.allSettled(
          emailTargets.map(u =>
            sendStagingCompleteEmail({
              to: u.email!,
              recipientName: u.name ?? u.email!,
              devices: deviceList,
              staffName: ctx.user.name ?? "NSDS Staff",
              message: input.message,
            })
          )
        );
      }

      await logActivity({
        userId: ctx.user.id,
        action: `Bulk marked ${results.filter(r => r.success).length} device(s) as Ready to Ship`,
        entityType: "device",
        entityId: null,
      });

      return { results };
    }),

  /**
   * Staff/admin: mark multiple boxes OR pallets as ready to ship in bulk.
   */
  notifyBulkItems: protectedProcedure
    .input(z.object({
      itemType: z.enum(["box", "pallet"]),
      itemIds: z.array(z.number()).min(1).max(100),
      message: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });

      const results: Array<{ itemId: number; itemCode: string; success: boolean }> = [];
      const clientItemMap = new Map<number, Array<{ code: string; model?: string | null; serialNumber?: string | null }>>();

      for (const itemId of input.itemIds) {
        const item = await resolveItem(input.itemType, itemId);
        if (!item) {
          results.push({ itemId, itemCode: "UNKNOWN", success: false });
          continue;
        }

        await markItemReadyToShip(input.itemType, itemId);
        await createStagingNotification({
          itemType: input.itemType,
          itemId: item.id,
          deviceId: item.id, // kept for compat
          clientId: item.clientId,
          notifiedByUserId: ctx.user.id,
          notifiedByName: ctx.user.name ?? "NSDS Staff",
          deviceCode: item.code,
          message: input.message ?? null,
        });

        results.push({ itemId, itemCode: item.code, success: true });
        if (!clientItemMap.has(item.clientId)) clientItemMap.set(item.clientId, []);
        clientItemMap.get(item.clientId)!.push({ code: item.code, model: item.model, serialNumber: item.serialNumber });
      }

      // Send one email per client
      for (const [clientId, itemList] of Array.from(clientItemMap.entries())) {
        const clientUsers = await getUsersByClientId(clientId);
        const emailTargets = clientUsers.filter(u => u.email);
        if (emailTargets.length === 0) continue;

        await Promise.allSettled(
          emailTargets.map(u =>
            sendStagingCompleteEmail({
              to: u.email!,
              recipientName: u.name ?? u.email!,
              devices: itemList.map(i => ({ deviceCode: i.code, model: i.model, serialNumber: i.serialNumber })),
              staffName: ctx.user.name ?? "NSDS Staff",
              message: input.message,
            })
          )
        );
      }

      await logActivity({
        userId: ctx.user.id,
        action: `Bulk marked ${results.filter(r => r.success).length} ${input.itemType}(s) as Ready to Ship`,
        entityType: input.itemType,
        entityId: null,
      });

      return { results };
    }),

  /**
   * Customer/staff: list staging notifications for a client.
   */
  listForClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!isStaff(ctx.user.role)) {
        if (ctx.user.clientId !== input.clientId) throw new TRPCError({ code: "FORBIDDEN" });
      }
      return listStagingNotifications(input.clientId);
    }),

  /**
   * Staff/admin: list all staging notifications across all clients.
   */
  listAll: protectedProcedure
    .query(async ({ ctx }) => {
      if (!isStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      return listAllStagingNotifications();
    }),

  /**
   * Customer: acknowledge (mark as read) a notification.
   */
  acknowledge: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await getStagingNotification(input.notificationId);
      if (!notification) throw new TRPCError({ code: "NOT_FOUND" });

      if (!isStaff(ctx.user.role) && ctx.user.clientId !== notification.clientId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await acknowledgeStagingNotification(notification.id, ctx.user.id);
      return { success: true };
    }),

  /**
   * Customer: count unacknowledged notifications (for badge).
   */
  unreadCount: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!isStaff(ctx.user.role) && ctx.user.clientId !== input.clientId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return countUnacknowledgedNotifications(input.clientId);
    }),
});
