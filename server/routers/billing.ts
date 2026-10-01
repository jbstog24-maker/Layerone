import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createInvoice, createLineItem, deleteLineItem, getClient, getClientUsage,
  getInvoice, getInvoiceLineItems, getPackage, listInvoices,
  logActivity, updateInvoice,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const isAdmin = (role: string) => role === "admin";
const canRead = (role: string, userClientId: number | null | undefined, targetClientId: number) => {
  if (isAdmin(role) || role === "staff") return true;
  return userClientId === targetClientId;
};

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
      await updateInvoice(id, {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      } as any);
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
