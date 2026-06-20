import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import {
  getDevice,
  getBox,
  getPallet,
  updateDeviceForwarding,
  updateBoxForwarding,
  updatePalletForwarding,
  listStagedDevicesForClient,
  listStagedBoxesForClient,
  listStagedPalletsForClient,
  listDevices,
  listBoxes,
  listPallets,
  logActivity,
} from "../db";

const isAdminOrStaff = (role: string) => role === "admin" || role === "staff";
const isCustomer = (role: string) => role === "customer_admin" || role === "customer_viewer";

const forwardingInput = z.object({
  forwardingAddress: z.string().max(1000).nullable().optional(),
  forwardingContact: z.string().max(256).nullable().optional(),
  forwardingNotes: z.string().max(2000).nullable().optional(),
  forwardingStatus: z.enum(["pending", "in_transit", "delivered"]).optional(),
});

// ─── Forwarding Router ────────────────────────────────────────────────────────
export const forwardingRouter = router({

  /** Customer: list all staged items (devices + boxes + pallets) with forwarding info */
  myItems: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;
    // Customers must have a clientId
    if (isCustomer(user.role)) {
      if (!user.clientId) return { devices: [], boxes: [], pallets: [] };
      const [devs, bxs, plts] = await Promise.all([
        listStagedDevicesForClient(user.clientId),
        listStagedBoxesForClient(user.clientId),
        listStagedPalletsForClient(user.clientId),
      ]);
      return { devices: devs, boxes: bxs, pallets: plts };
    }
    // Admin/staff: return all staged items (no client filter)
    const [devs, bxs, plts] = await Promise.all([
      listDevices(),
      listBoxes(),
      listPallets(),
    ]);
    return { devices: devs, boxes: bxs, pallets: plts };
  }),

  /** Customer or admin/staff: update forwarding info on a device */
  updateDevice: protectedProcedure
    .input(z.object({ deviceId: z.number(), ...forwardingInput.shape }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const device = await getDevice(input.deviceId);
      if (!device) throw new TRPCError({ code: "NOT_FOUND", message: "Device not found" });

      // Customers can only update their own client's devices
      if (isCustomer(user.role)) {
        if (!user.clientId || device.clientId !== user.clientId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only update your own devices" });
        }
      }

      const { deviceId, ...data } = input;
      const updated = await updateDeviceForwarding(deviceId, data);
      await logActivity({
        userId: user.id,
        clientId: device.clientId,
        action: `Updated forwarding info for device ${device.deviceCode} → ${input.forwardingAddress ?? "cleared"}`,
        entityType: "device",
        entityId: deviceId,
      });
      return updated;
    }),

  /** Customer or admin/staff: update forwarding info on a box */
  updateBox: protectedProcedure
    .input(z.object({ boxId: z.number(), ...forwardingInput.shape }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const box = await getBox(input.boxId);
      if (!box) throw new TRPCError({ code: "NOT_FOUND", message: "Box not found" });

      if (isCustomer(user.role)) {
        if (!user.clientId || box.clientId !== user.clientId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only update your own boxes" });
        }
      }

      const { boxId, ...data } = input;
      const updated = await updateBoxForwarding(boxId, data);
      await logActivity({
        userId: user.id,
        clientId: box.clientId,
        action: `Updated forwarding info for box ${box.boxCode} → ${input.forwardingAddress ?? "cleared"}`,
        entityType: "box",
        entityId: boxId,
      });
      return updated;
    }),

  /** Customer or admin/staff: update forwarding info on a pallet */
  updatePallet: protectedProcedure
    .input(z.object({ palletId: z.number(), ...forwardingInput.shape }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const pallet = await getPallet(input.palletId);
      if (!pallet) throw new TRPCError({ code: "NOT_FOUND", message: "Pallet not found" });

      if (isCustomer(user.role)) {
        if (!user.clientId || pallet.clientId !== user.clientId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only update your own pallets" });
        }
      }

      const { palletId, ...data } = input;
      const updated = await updatePalletForwarding(palletId, data);
      await logActivity({
        userId: user.id,
        clientId: pallet.clientId,
        action: `Updated forwarding info for pallet ${pallet.palletCode} → ${input.forwardingAddress ?? "cleared"}`,
        entityType: "pallet",
        entityId: palletId,
      });
      return updated;
    }),
});
