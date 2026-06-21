import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import {
  getDevice,
  createStagingNotification,
  listStagingNotifications,
  listAllStagingNotifications,
  getStagingNotification,
  acknowledgeStagingNotification,
  countUnacknowledgedNotifications,
  getUsersByClientId,
  updateDevice,
  logActivity,
} from "../db";
import { sendStagingCompleteEmail } from "../email";

const STAFF_ROLES = ["admin", "staff"] as const;
function isStaff(role: string) {
  return (STAFF_ROLES as readonly string[]).includes(role);
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

      // Update device staging status to ready_to_ship
      await updateDevice(device.id, { stagingStatus: "ready_to_ship" });

      // Create notification record
      const notification = await createStagingNotification({
        deviceId: device.id,
        clientId: device.clientId,
        notifiedByUserId: ctx.user.id,
        notifiedByName: ctx.user.name ?? "NSDS Staff",
        deviceCode: device.deviceCode,
        message: input.message ?? null,
        emailSent: false,
      });

      // Send email to all users in this client
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
        // Update emailSent flag
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
      // Group devices by clientId for batched emails
      const clientDeviceMap = new Map<number, typeof results>();

      for (const deviceId of input.deviceIds) {
        const device = await getDevice(deviceId);
        if (!device) {
          results.push({ deviceId, deviceCode: "UNKNOWN", success: false });
          continue;
        }

        await updateDevice(device.id, { stagingStatus: "ready_to_ship" });
        await createStagingNotification({
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

      // Send one email per client with all their devices
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
   * Customer/staff: list staging notifications for a client.
   */
  listForClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Customers can only see their own notifications
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

      // Customers can only acknowledge their own client's notifications
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
