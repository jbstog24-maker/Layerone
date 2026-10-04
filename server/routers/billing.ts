import { TRPCError } from "@trpc/server";
import { z } from "zod";
import Stripe from "stripe";
import {
  createInvoice, createLineItem, deleteLineItem, getClient, getClientUsage,
  getInvoice, getInvoiceLineItems, getPackage, listInvoices,
  logActivity, updateInvoice,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { sendInvoiceSentEmail } from "../email";

const isAdmin = (role: string) => role === "admin";
const canRead = (role: string, userClientId: number | null | undefined, targetClientId: number) => {
  if (isAdmin(role) || role === "staff") return true;
  return userClientId === targetClientId;
};

// Mirrors the Stripe setup in quotes.ts and stripe.ts: one-off sessions, no
// subscription handling here.
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-08-26.dahlia" });
}

export const billingRouter = router({
  listInvoices: protectedProcedure
    .input(z.object({ clientId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role === "customer_admin" || ctx.user.role === "customer_viewer") {
        return listInvoices(ctx.user.clientId ?? undefined);
      }
      return listInvoices(input?.clientId);
    }),

  getInvoice: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const invoice = await getInvoice(input.id);
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canRead(ctx.user.role, ctx.user.clientId, invoice.clientId)) throw new TRPCError({ code: "FORBIDDEN" });
      const lineItems = await getInvoiceLineItems(input.id);
      return { ...invoice, lineItems };
    }),

  createInvoice: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      periodStart: z.string(),
      periodEnd: z.string(),
      notes: z.string().optional(),
      dueDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const invoiceNumber = `INV-${Date.now()}`;
      await createInvoice({
        ...input,
        invoiceNumber,
        periodStart: new Date(input.periodStart),
        periodEnd: new Date(input.periodEnd),
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        createdBy: ctx.user.id,
        subtotal: "0.00",
        tax: "0.00",
        total: "0.00",
      });
      await logActivity({ userId: ctx.user.id, clientId: input.clientId, action: `Created invoice ${invoiceNumber}`, entityType: "invoice" });
      return { success: true, invoiceNumber };
    }),

  updateInvoice: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["draft", "sent", "paid", "overdue", "void"]).optional(),
      notes: z.string().optional(),
      dueDate: z.string().optional(),
      subtotal: z.string().optional(),
      tax: z.string().optional(),
      total: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      // Capture prior status to detect draft-to-sent transitions.
      const before = data.status ? await getInvoice(id) : null;
      await updateInvoice(id, {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      } as any);
      // First time an invoice goes out: notify the customer (non-blocking).
      if (data.status === "sent" && before && before.status !== "sent") {
        const invoice = await getInvoice(id);
        if (invoice) {
          const client = await getClient(invoice.clientId);
          const to = client?.billingEmail ?? client?.contactEmail;
          if (to) {
            const portalBase = (ENV.portalUrl ?? "https://www.layeronestaging.com").replace(/\/+$/, "");
            sendInvoiceSentEmail({
              to,
              invoiceNumber: invoice.invoiceNumber,
              amount: `$${parseFloat(String(invoice.total ?? "0")).toFixed(2)}`,
              dueDate: invoice.dueDate
                ? new Date(invoice.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                : "upon receipt",
              portalUrl: portalBase,
            }).catch((err) => {
              console.warn(`[Billing] invoice-sent email failed for invoice ${id}:`, err);
            });
          }
        }
      }
      return { success: true };
    }),

  addLineItem: protectedProcedure
    .input(z.object({
      invoiceId: z.number(),
      description: z.string().min(1),
      category: z.enum(["base_package", "extra_boxes", "extra_pallets", "extra_devices", "storage_overage", "labor_hours", "packing_shipping", "rush_fee", "special_handling", "shipping_materials", "other"]),
      quantity: z.string(),
      unitPrice: z.string(),
      total: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      await createLineItem(input as any);
      // Recalculate totals
      const lineItems = await getInvoiceLineItems(input.invoiceId);
      const subtotal = lineItems.reduce((sum, li) => sum + parseFloat(String(li.total)), 0);
      const tax = 0;
      await updateInvoice(input.invoiceId, {
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: (subtotal + tax).toFixed(2),
      } as any);
      return { success: true };
    }),

  deleteLineItem: protectedProcedure
    .input(z.object({ id: z.number(), invoiceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      await deleteLineItem(input.id);
      const lineItems = await getInvoiceLineItems(input.invoiceId);
      const subtotal = lineItems.reduce((sum, li) => sum + parseFloat(String(li.total)), 0);
      await updateInvoice(input.invoiceId, {
        subtotal: subtotal.toFixed(2),
        total: subtotal.toFixed(2),
      } as any);
      return { success: true };
    }),

  // ── "Pay Now": create a one-off Stripe Checkout session for an unpaid invoice.
  // Redirects back to /invoices/:id with ?payment=success|cancelled; the client
  // renders a graceful status from that param.
  createCheckoutSession: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await getInvoice(input.id);
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canRead(ctx.user.role, ctx.user.clientId, invoice.clientId)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (invoice.status === "paid" || invoice.status === "void") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This invoice cannot be paid" });
      }
      const totalCents = Math.round(parseFloat(String(invoice.total)) * 100);
      if (!Number.isFinite(totalCents) || totalCents <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invoice total must be greater than $0" });
      }

      const stripe = getStripe();
      if (!stripe) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe is not configured" });
      }

      const client = await getClient(invoice.clientId);
      const origin = (ctx.req.headers.origin as string | undefined) || `https://${ctx.req.headers.host}`;

      try {
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer_email: client?.billingEmail ?? client?.contactEmail ?? undefined,
          client_reference_id: invoice.clientId.toString(),
          metadata: {
            invoice_id: invoice.id.toString(),
            invoice_number: invoice.invoiceNumber,
            client_id: invoice.clientId.toString(),
            client_name: client?.companyName ?? "",
          },
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: { name: `Layer One Staging - Invoice ${invoice.invoiceNumber}` },
                unit_amount: totalCents,
              },
              quantity: 1,
            },
          ],
          success_url: `${origin}/invoices/${invoice.id}?payment=success`,
          cancel_url: `${origin}/invoices/${invoice.id}?payment=cancelled`,
        });

        await logActivity({
          userId: ctx.user.id,
          clientId: invoice.clientId,
          action: `Created Stripe checkout session for invoice ${invoice.invoiceNumber}`,
          entityType: "invoice",
          entityId: invoice.id,
        });

        return { url: session.url };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[Stripe] Failed to create invoice checkout session:", message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create payment session" });
      }
    }),

  generateFromUsage: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      periodStart: z.string(),
      periodEnd: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const client = await getClient(input.clientId);
      if (!client) throw new TRPCError({ code: "NOT_FOUND" });
      const pkg = client.packageId ? await getPackage(client.packageId) : null;
      const usage = await getClientUsage(input.clientId);

      const invoiceNumber = `INV-${Date.now()}`;
      await createInvoice({
        invoiceNumber,
        clientId: input.clientId,
        periodStart: new Date(input.periodStart),
        periodEnd: new Date(input.periodEnd),
        subtotal: "0.00",
        tax: "0.00",
        total: "0.00",
        createdBy: ctx.user.id,
      });

      // Fetch the invoice we just created
      const allInvoices = await listInvoices(input.clientId);
      const newInvoice = allInvoices[0];
      if (!newInvoice) return { success: false };

      const lineItems = [];

      if (pkg) {
        lineItems.push({
          invoiceId: newInvoice.id,
          description: `${pkg.name} - Base Package`,
          category: "base_package" as const,
          quantity: "1.00",
          unitPrice: String(pkg.basePrice),
          total: String(pkg.basePrice),
        });

        if (usage) {
          const maxDevices = pkg.maxDevices ?? 0;
          const maxBoxes = pkg.maxBoxes ?? 0;
          const maxPallets = pkg.maxPallets ?? 0;
          const maxShipments = pkg.maxOutboundShipments ?? 0;

          if (usage.devices > maxDevices && maxDevices > 0) {
            const extra = usage.devices - maxDevices;
            lineItems.push({ invoiceId: newInvoice.id, description: `Extra devices (${extra} over limit)`, category: "extra_devices" as const, quantity: String(extra), unitPrice: "25.00", total: (extra * 25).toFixed(2) });
          }
          if (usage.boxes > maxBoxes && maxBoxes > 0) {
            const extra = usage.boxes - maxBoxes;
            lineItems.push({ invoiceId: newInvoice.id, description: `Extra boxes received (${extra} over limit)`, category: "extra_boxes" as const, quantity: String(extra), unitPrice: "20.00", total: (extra * 20).toFixed(2) });
          }
          if (usage.pallets > maxPallets && maxPallets > 0) {
            const extra = usage.pallets - maxPallets;
            lineItems.push({ invoiceId: newInvoice.id, description: `Extra pallets (${extra} over limit)`, category: "extra_pallets" as const, quantity: String(extra), unitPrice: "150.00", total: (extra * 150).toFixed(2) });
          }
          if (usage.shipments > maxShipments && maxShipments > 0) {
            const extra = usage.shipments - maxShipments;
            lineItems.push({ invoiceId: newInvoice.id, description: `Extra outbound shipments (${extra} over limit)`, category: "packing_shipping" as const, quantity: String(extra), unitPrice: "50.00", total: (extra * 50).toFixed(2) });
          }
        }
      }

      for (const item of lineItems) {
        await createLineItem(item as any);
      }

      const subtotal = lineItems.reduce((sum, li) => sum + parseFloat(li.total), 0);
      await updateInvoice(newInvoice.id, { subtotal: subtotal.toFixed(2), total: subtotal.toFixed(2) } as any);
      await logActivity({ userId: ctx.user.id, clientId: input.clientId, action: `Generated invoice ${invoiceNumber} from usage`, entityType: "invoice" });

      return { success: true, invoiceId: newInvoice.id, invoiceNumber };
    }),
});
