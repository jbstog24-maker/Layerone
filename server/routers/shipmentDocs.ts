import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import {
  listShipmentDocuments,
  addShipmentDocument,
  getShipmentDocument,
  deleteShipmentDocument,
  logActivity,
} from "../db";
import { storagePut, storageGetSignedUrl } from "../storage";

const isAdminOrStaff = (role: string) => role === "admin" || role === "staff";
const isCustomer = (role: string) => role === "customer_admin" || role === "customer_viewer";

// ─── Shipment Documents Router ────────────────────────────────────────────────
export const shipmentDocsRouter = router({

  /** List all documents for a shipment (customer sees own, admin/staff sees all) */
  list: protectedProcedure
    .input(z.object({ shipmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const docs = await listShipmentDocuments(input.shipmentId);
      // Customers can only see docs for their own client's shipments
      if (isCustomer(ctx.user.role)) {
        return docs.filter(d => d.clientId === ctx.user.clientId);
      }
      return docs;
    }),

  /** Upload a document: accepts base64-encoded file content */
  upload: protectedProcedure
    .input(z.object({
      shipmentId: z.number(),
      clientId: z.number(),
      filename: z.string().max(512),
      mimeType: z.string().max(128),
      fileSize: z.number().optional(),
      fileDataBase64: z.string(), // base64-encoded file content
      label: z.string().max(256).optional(),
      notes: z.string().max(2000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      // Customers can only upload to their own client's shipments
      if (isCustomer(user.role) && input.clientId !== user.clientId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only upload documents to your own shipments" });
      }

      // Decode base64 and upload to S3
      const buffer = Buffer.from(input.fileDataBase64, "base64");
      const fileKey = `clients/${input.clientId}/shipment-docs/${input.shipmentId}/${Date.now()}-${input.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { key, url } = await storagePut(fileKey, buffer, input.mimeType);

      const doc = await addShipmentDocument({
        shipmentId: input.shipmentId,
        clientId: input.clientId,
        uploadedById: user.id,
        uploadedByName: user.name ?? undefined,
        filename: input.filename,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        fileKey: key,
        fileUrl: url,
        label: input.label,
        notes: input.notes,
      });

      await logActivity({
        userId: user.id,
        clientId: input.clientId,
        action: `Uploaded document "${input.filename}" to shipment #${input.shipmentId}`,
        entityType: "shipment",
        entityId: input.shipmentId,
      });

      return doc;
    }),

  /** Get a signed download URL for a document */
  getDownloadUrl: protectedProcedure
    .input(z.object({ docId: z.number() }))
    .query(async ({ ctx, input }) => {
      const doc = await getShipmentDocument(input.docId);
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });

      if (isCustomer(ctx.user.role) && doc.clientId !== ctx.user.clientId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const signedUrl = await storageGetSignedUrl(doc.fileKey);
      return { url: signedUrl, filename: doc.filename };
    }),

  /** Delete a document (customer can delete their own; admin/staff can delete any) */
  delete: protectedProcedure
    .input(z.object({ docId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const doc = await getShipmentDocument(input.docId);
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });

      // Customers can only delete their own uploads
      if (isCustomer(user.role)) {
        if (doc.clientId !== user.clientId) throw new TRPCError({ code: "FORBIDDEN" });
        if (doc.uploadedById !== user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own uploads" });
      }

      await deleteShipmentDocument(input.docId);
      await logActivity({
        userId: user.id,
        clientId: doc.clientId,
        action: `Deleted document "${doc.filename}" from shipment #${doc.shipmentId}`,
        entityType: "shipment",
        entityId: doc.shipmentId,
      });
      return { success: true };
    }),
});
