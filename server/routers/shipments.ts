import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addShipmentItem, createShipment, getClient, getShipment, getShipmentItems,
  listShipments, logActivity, updateShipment,
} from "../db";
import { sendShipmentApprovalRequestEmail, sendTrackingNotificationEmail } from "../email";
import { ENV } from "../_core/env";
import { protectedProcedure, router } from "../_core/trpc";

const isStaffOrAdmin = (role: string) => role === "admin" || role === "staff";
const canRead = (role: string, userClientId: number | null | undefined, targetClientId: number) => {
  if (isStaffOrAdmin(role)) return true;
  return userClientId === targetClientId;
};

export const shipmentsRouter = router({
  list: protectedProcedure
    .input(z.object({ clientId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role === "customer_admin" || ctx.user.role === "customer_viewer") {
        return listShipments(ctx.user.clientId ?? undefined);
      }
      return listShipments(input?.clientId);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const shipment = await getShipment(input.id);
      if (!shipment) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canRead(ctx.user.role, ctx.user.clientId, shipment.clientId)) throw new TRPCError({ code: "FORBIDDEN" });
      const items = await getShipmentItems(input.id);
      return { ...shipment, items };
    }),

  create: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      projectName: z.string().optional(),
      destination: z.string().optional(),
      carrier: z.string().optional(),
      trackingNumber: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role === "customer_viewer") throw new TRPCError({ code: "FORBIDDEN" });
      if (!canRead(ctx.user.role, ctx.user.clientId, input.clientId)) throw new TRPCError({ code: "FORBIDDEN" });
      const result = await createShipment({ ...input, requestedBy: ctx.user.id });
      await logActivity({ userId: ctx.user.id, clientId: input.clientId, action: `Created shipment request ${result.shipmentCode}`, entityType: "shipment" });
      // Notify staff when a customer submits a shipment request (non-blocking)
      if (!isStaffOrAdmin(ctx.user.role)) {
        try {
          const client = await getClient(input.clientId);
          const staffEmail = ENV.resendFromEmail; // notify the Layer One ops inbox
          if (staffEmail && client) {
            sendShipmentApprovalRequestEmail({
              staffEmail,
              clientName: client.companyName,
              shipmentId: (result as any).insertId ?? 0,
              destination: input.destination ?? "(not specified)",
              itemCount: 0,
              requestedBy: ctx.user.name ?? ctx.user.email ?? "Customer",
              portalUrl: ENV.portalUrl ?? "",
            }).catch(() => {});
          }
        } catch (_e) { /* non-blocking */ }
      }
      return result;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["requested", "packing", "ready_to_ship", "shipped", "delivered", "exception", "closed"]).optional(),
      carrier: z.string().optional(),
      trackingNumber: z.string().optional(),
      destination: z.string().optional(),
      notes: z.string().optional(),
      datePacked: z.string().optional(),
      dateShipped: z.string().optional(),
      dateDelivered: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const shipment = await getShipment(input.id);
      if (!shipment) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canRead(ctx.user.role, ctx.user.clientId, shipment.clientId)) throw new TRPCError({ code: "FORBIDDEN" });
      if (ctx.user.role === "customer_viewer") throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await updateShipment(id, {
        ...data,
        datePacked: data.datePacked ? new Date(data.datePacked) : undefined,
        dateShipped: data.dateShipped ? new Date(data.dateShipped) : undefined,
        dateDelivered: data.dateDelivered ? new Date(data.dateDelivered) : undefined,
        packedBy: isStaffOrAdmin(ctx.user.role) ? ctx.user.id : undefined,
      } as any);
      await logActivity({ userId: ctx.user.id, clientId: shipment.clientId, action: `Updated shipment #${id}: ${data.status ?? "updated"}`, entityType: "shipment", entityId: id });

      // Send tracking notification email when tracking number is added/changed by staff
      const trackingAdded = data.trackingNumber && data.trackingNumber !== shipment.trackingNumber;
      if (trackingAdded && isStaffOrAdmin(ctx.user.role)) {
        try {
          const client = await getClient(shipment.clientId);
          // Find the primary customer_admin email for this client
          if (client) {
            // Get the updated shipment to have latest data
            const updated = await getShipment(id);
            const carrier = data.carrier ?? shipment.carrier ?? "Carrier";
            const portalUrl = ENV.portalUrl ?? "";
            // We'll send to the client contact email if available
            const contactEmail = (client as any).contactEmail ?? (client as any).email;
            if (contactEmail) {
              sendTrackingNotificationEmail({
                to: contactEmail,
                clientName: client.companyName,
                shipmentCode: (updated as any)?.shipmentCode ?? `#${id}`,
                destination: data.destination ?? shipment.destination ?? "(not specified)",
                carrier,
                trackingNumber: data.trackingNumber!,
                portalUrl,
              }).catch(() => {});
            }
          }
        } catch (_e) { /* non-blocking */ }
      }

      return { success: true };
    }),

  addItem: protectedProcedure
    .input(z.object({
      shipmentId: z.number(),
      itemType: z.enum(["device", "box", "pallet"]),
      itemId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      await addShipmentItem(input.shipmentId, input.itemType, input.itemId);
      return { success: true };
    }),
});
