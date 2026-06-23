import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import {
  getClientInstructions,
  upsertClientInstructions,
  acknowledgeClientInstructions,
  listInstructionFiles,
  addInstructionFile,
  deleteInstructionFile,
  logActivity,
} from "../db";
import { storagePut, storageGetSignedUrl } from "../storage";

const isAdminOrStaff = (role: string) => role === "admin" || role === "staff";
const isCustomer = (role: string) => role === "customer_admin" || role === "customer_viewer";

export const instructionsRouter = router({
  /** Get the text instructions for a client */
  get: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Customers can only see their own instructions
      if (isCustomer(ctx.user.role) && input.clientId !== ctx.user.clientId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const instructions = await getClientInstructions(input.clientId);
      const files = await listInstructionFiles(input.clientId);
      return { instructions: instructions ?? null, files };
    }),

  /** Customer saves/updates their staging instructions text */
  upsert: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      textBody: z.string().max(50000),
    }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      // Customers can only edit their own instructions; staff/admin can edit any
      if (isCustomer(user.role) && input.clientId !== user.clientId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await upsertClientInstructions(input.clientId, input.textBody, user.id);
      await logActivity({
        userId: user.id,
        clientId: input.clientId,
        action: "Updated staging/provisioning instructions",
        entityType: "client",
        entityId: input.clientId,
      });
      return { success: true };
    }),

  /** Upload an instruction file (PDF, Word, image, etc.) */
  uploadFile: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      fileName: z.string().max(512),
      mimeType: z.string().max(128),
      fileDataBase64: z.string(), // base64-encoded file content
    }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      if (isCustomer(user.role) && input.clientId !== user.clientId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const buffer = Buffer.from(input.fileDataBase64, "base64");
      const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileKey = `clients/${input.clientId}/instructions/${Date.now()}-${safeFileName}`;
      const { key, url } = await storagePut(fileKey, buffer, input.mimeType);
      const { id } = await addInstructionFile({
        clientId: input.clientId,
        fileName: input.fileName,
        fileKey: key,
        fileUrl: url,
        mimeType: input.mimeType,
        uploadedById: user.id,
      });
      await logActivity({
        userId: user.id,
        clientId: input.clientId,
        action: `Uploaded instruction file "${input.fileName}"`,
        entityType: "client",
        entityId: input.clientId,
      });
      return { id, fileKey: key, fileUrl: url };
    }),

  /** Get a signed download URL for an instruction file */
  getFileUrl: protectedProcedure
    .input(z.object({ clientId: z.number(), fileKey: z.string() }))
    .query(async ({ ctx, input }) => {
      if (isCustomer(ctx.user.role) && input.clientId !== ctx.user.clientId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const signedUrl = await storageGetSignedUrl(input.fileKey);
      return { url: signedUrl };
    }),

  /** Delete an instruction file */
  deleteFile: protectedProcedure
    .input(z.object({ id: z.number(), clientId: z.number(), fileName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      if (isCustomer(user.role) && input.clientId !== user.clientId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await deleteInstructionFile(input.id, input.clientId);
      await logActivity({
        userId: user.id,
        clientId: input.clientId,
        action: `Deleted instruction file "${input.fileName}"`,
        entityType: "client",
        entityId: input.clientId,
      });
      return { success: true };
    }),

  /** Staff/admin acknowledges they have reviewed the instructions */
  acknowledge: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      if (!isAdminOrStaff(user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only staff and admins can acknowledge instructions" });
      }
      await acknowledgeClientInstructions(input.clientId, user.id);
      await logActivity({
        userId: user.id,
        clientId: input.clientId,
        action: "Acknowledged client staging instructions",
        entityType: "client",
        entityId: input.clientId,
      });
      return { success: true };
    }),
});
