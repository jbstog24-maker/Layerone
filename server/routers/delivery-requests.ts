import { TRPCError } from "@trpc/server";
import { z } from "zod";
import Stripe from "stripe";
import {
  createDeliveryRequest,
  getClient,
  getDeliveryRequest,
  listDeliveryRequests,
  logActivity,
  updateDeliveryRequest,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { calculateDeliveryQuote } from "../../shared/delivery-pricing";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-08-26.dahlia" });
}

const canAccessClient = (
  userRole: string,
  userClientId: number | null | undefined,
  targetClientId: number
) => {
  if (userRole === "admin" || userRole === "staff") return true;
  return userClientId === targetClientId;
};

function generateTrackingNumber(): string {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate()
  ).padStart(2, "0")}`;
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `L1-${ymd}-${suffix}`;
}

const createInput = z.object({
  deliveryDate: z.string().min(1, "Delivery date is required"),
  timeWindow: z.enum(["morning", "afternoon", "custom"]),
  customTimeWindow: z.string().max(128).optional(),
  siteName: z.string().min(1, "Site name is required").max(256),
  addressStreet: z.string().min(1, "Street address is required").max(256),
  addressCity: z.string().min(1, "City is required").max(128),
  addressState: z.string().max(8).default("TX"),
  addressZip: z.string().min(1, "ZIP is required").max(16),
  estimatedMiles: z.number().int().min(0).max(500),
  packageCount: z.number().int().min(0).max(1000).default(0),
  largeItemCount: z.number().int().min(0).max(500).default(0),
  palletCount: z.number().int().min(0).max(200).default(0),
  looseDeviceCount: z.number().int().min(0).max(2000).default(0),
  specialInstructions: z.string().max(4000).optional(),
  disclaimerAccepted: z.literal(true, "You must accept the delivery terms to continue."),
});

export const deliveryRequestsRouter = router({
  // ── Create a delivery request and start Stripe Checkout ────────────────────
  create: protectedProcedure.input(createInput).mutation(async ({ ctx, input }) => {
    if (ctx.user.role === "customer_viewer") {
      throw new TRPCError({ code: "FORBIDDEN", message: "View-only accounts cannot request deliveries." });
    }
    const clientId = ctx.user.clientId;
    if (!clientId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No client account linked to this user." });
    }

    if (
      input.packageCount + input.largeItemCount + input.palletCount + input.looseDeviceCount ===
      0
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Add at least one package, large item, pallet, or device.",
      });
    }

    // Server-side pricing (source of truth - never trust client totals)
    const quote = calculateDeliveryQuote({
      miles: input.estimatedMiles,
      packages: input.packageCount,
      largeItems: input.largeItemCount,
      pallets: input.palletCount,
      looseDevices: input.looseDeviceCount,
    });
    if (quote.totalCents <= 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Could not calculate a delivery total." });
    }

    const stripe = getStripe();
    if (!stripe) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payments are not configured." });
    }

    const trackingNumber = generateTrackingNumber();
    const record = await createDeliveryRequest({
      clientId,
      createdBy: ctx.user.id,
      deliveryDate: new Date(input.deliveryDate),
      timeWindow: input.timeWindow,
      customTimeWindow: input.customTimeWindow || null,
      siteName: input.siteName,
      addressStreet: input.addressStreet,
      addressCity: input.addressCity,
      addressState: input.addressState,
      addressZip: input.addressZip,
      estimatedMiles: input.estimatedMiles,
      packageCount: input.packageCount,
      largeItemCount: input.largeItemCount,
      palletCount: input.palletCount,
      looseDeviceCount: input.looseDeviceCount,
      specialInstructions: input.specialInstructions || null,
      disclaimerAccepted: true,
      tripCents: quote.tripCents,
      packageCents: quote.lines.find((l) => l.label.startsWith("Packages"))?.amountCents ?? 0,
      largeItemCents: quote.lines.find((l) => l.label.startsWith("Large items"))?.amountCents ?? 0,
      palletCents: quote.lines.find((l) => l.label.startsWith("Pallets"))?.amountCents ?? 0,
      deviceCents: quote.lines.find((l) => l.label.startsWith("Loose devices"))?.amountCents ?? 0,
      totalCents: quote.totalCents,
      trackingNumber,
      status: "pending_payment",
    });
    if (!record) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not save the delivery request." });

    const client = await getClient(clientId);
    const origin = (ctx.req.headers.origin as string | undefined) || `https://${ctx.req.headers.host}`;
    const summaryLines = quote.lines.map((l) => `${l.label}`).join(", ");

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: client?.billingEmail ?? client?.contactEmail ?? undefined,
        client_reference_id: clientId.toString(),
        metadata: {
          delivery_request_id: record.id.toString(),
          tracking_number: trackingNumber,
          client_id: clientId.toString(),
          client_name: client?.companyName ?? "",
        },
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Layer One Staging - Delivery ${trackingNumber}`,
                description: `Delivery to ${input.siteName}, ${input.addressCity} ${input.addressState} on ${new Date(input.deliveryDate).toLocaleDateString("en-US")}. ${summaryLines}`,
              },
              unit_amount: quote.totalCents,
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/delivery-requests/${record.id}?payment=success`,
        cancel_url: `${origin}/delivery-requests/${record.id}?payment=cancelled`,
      });

      await updateDeliveryRequest(record.id, { stripeCheckoutSessionId: session.id });
      await logActivity({
        userId: ctx.user.id,
        clientId,
        action: `Created delivery request ${trackingNumber} ($${(quote.totalCents / 100).toFixed(2)}) - awaiting payment`,
        entityType: "delivery_request",
        entityId: record.id,
      });

      return { url: session.url, trackingNumber, id: record.id };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[DeliveryRequests] Failed to create checkout session:", message);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not start the payment session." });
    }
  }),

  // ── List requests ──────────────────────────────────────────────────────────
  list: protectedProcedure
    .input(z.object({ clientId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role === "customer_admin" || ctx.user.role === "customer_viewer") {
        return listDeliveryRequests(ctx.user.clientId ?? undefined);
      }
      return listDeliveryRequests(input?.clientId);
    }),

  // ── Get one request ────────────────────────────────────────────────────────
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const record = await getDeliveryRequest(input.id);
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canAccessClient(ctx.user.role, ctx.user.clientId, record.clientId)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return record;
    }),

  // ── Staff: mark scheduled / in transit ─────────────────────────────────────
  setStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["scheduled", "in_transit", "failed", "cancelled"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "staff") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const record = await getDeliveryRequest(input.id);
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      if (record.status !== "paid" && record.status !== "scheduled" && record.status !== "in_transit") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only paid or scheduled deliveries can change status.",
        });
      }
      await updateDeliveryRequest(input.id, { status: input.status });
      await logActivity({
        userId: ctx.user.id,
        clientId: record.clientId,
        action: `Delivery ${record.trackingNumber} marked ${input.status}`,
        entityType: "delivery_request",
        entityId: input.id,
      });
      return { success: true };
    }),

  // ── Staff: complete delivery with proof of delivery ────────────────────────
  completeDelivery: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        receiverFirstName: z.string().min(1, "Receiver first name is required").max(128),
        receiverLastName: z.string().min(1, "Receiver last name is required").max(128),
        receiverPhone: z.string().min(1, "Receiver phone is required").max(32),
        receiverEmail: z.string().email("Enter a valid email").max(256),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "staff") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const record = await getDeliveryRequest(input.id);
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      if (record.status !== "paid" && record.status !== "scheduled" && record.status !== "in_transit") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only paid, scheduled, or in-transit deliveries can be completed.",
        });
      }
      await updateDeliveryRequest(input.id, {
        status: "delivered",
        receiverFirstName: input.receiverFirstName,
        receiverLastName: input.receiverLastName,
        receiverPhone: input.receiverPhone,
        receiverEmail: input.receiverEmail,
        deliveredAt: new Date(),
      });
      await logActivity({
        userId: ctx.user.id,
        clientId: record.clientId,
        action: `Delivery ${record.trackingNumber} completed - received by ${input.receiverFirstName} ${input.receiverLastName}`,
        entityType: "delivery_request",
        entityId: input.id,
      });
      return { success: true };
    }),

  // ── Cancel a pending (unpaid) request ──────────────────────────────────────
  cancel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const record = await getDeliveryRequest(input.id);
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canAccessClient(ctx.user.role, ctx.user.clientId, record.clientId)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (ctx.user.role === "customer_viewer") throw new TRPCError({ code: "FORBIDDEN" });
      if (record.status !== "pending_payment") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only unpaid requests can be cancelled." });
      }
      await updateDeliveryRequest(input.id, { status: "cancelled" });
      await logActivity({
        userId: ctx.user.id,
        clientId: record.clientId,
        action: `Delivery request ${record.trackingNumber} cancelled before payment`,
        entityType: "delivery_request",
        entityId: input.id,
      });
      return { success: true };
    }),
});
