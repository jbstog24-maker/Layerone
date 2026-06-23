import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createSupportTicket, createTicketReply, getSupportTicket,
  listSupportTickets, listTicketReplies, updateSupportTicket,
} from "../db";
import { customerProcedure, protectedProcedure, router } from "../_core/trpc";
import { sendSupportTicketEmail } from "../email";

const isStaffOrAdmin = (role: string) => role === "admin" || role === "staff";
const isCustomer = (role: string) => role === "customer_admin" || role === "customer_viewer";

export const supportRouter = router({
  // List tickets — customers see only their own; staff/admin see all
  list: protectedProcedure
    .input(z.object({ clientId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (isCustomer(ctx.user.role)) {
        if (!ctx.user.clientId) return [];
        return listSupportTickets(ctx.user.clientId);
      }
      return listSupportTickets(input?.clientId);
    }),

  // Get a single ticket with replies
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const ticket = await getSupportTicket(input.id);
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });
      if (isCustomer(ctx.user.role) && ticket.clientId !== ctx.user.clientId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const replies = await listTicketReplies(ticket.id);
      // Filter out internal notes for customers
      const visibleReplies = isCustomer(ctx.user.role)
        ? replies.filter(r => !r.isInternal)
        : replies;
      return { ticket, replies: visibleReplies };
    }),

  // Submit a new ticket (customers and staff can create)
  create: customerProcedure
    .input(z.object({
      subject: z.string().min(5).max(512),
      category: z.enum(["billing", "shipping", "staging", "account", "technical", "general"]),
      priority: z.enum(["low", "normal", "high", "urgent"]),
      description: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const clientId = ctx.user.clientId;
      if (!clientId) throw new TRPCError({ code: "FORBIDDEN", message: "No client linked to account" });
      await createSupportTicket({
        clientId,
        submittedByUserId: ctx.user.id,
        submittedByName: ctx.user.name ?? "Unknown",
        subject: input.subject,
        category: input.category,
        priority: input.priority,
        description: input.description,
        status: "open",
      });
      // Notify Layer One staff via email (non-blocking)
      sendSupportTicketEmail({
        ticketSubject: input.subject,
        category: input.category,
        priority: input.priority,
        description: input.description,
        submittedBy: ctx.user.name ?? "Unknown",
        clientId,
      }).catch(() => {});
      return { success: true };
    }),

  // Staff/admin can also create tickets on behalf of a client
  createForClient: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      subject: z.string().min(5).max(512),
      category: z.enum(["billing", "shipping", "staging", "account", "technical", "general"]),
      priority: z.enum(["low", "normal", "high", "urgent"]),
      description: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      await createSupportTicket({
        clientId: input.clientId,
        submittedByUserId: ctx.user.id,
        submittedByName: ctx.user.name ?? "Staff",
        subject: input.subject,
        category: input.category,
        priority: input.priority,
        description: input.description,
        status: "open",
      });
      return { success: true };
    }),

  // Update ticket status / assignment (staff/admin only)
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["open", "in_progress", "waiting_on_client", "resolved", "closed"]).optional(),
      assignedToUserId: z.number().nullable().optional(),
      priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isStaffOrAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      const updates: Record<string, unknown> = { ...data };
      if (data.status === "resolved") updates.resolvedAt = new Date();
      if (data.status === "closed") updates.closedAt = new Date();
      await updateSupportTicket(id, updates as any);
      return { success: true };
    }),

  // Add a reply to a ticket
  reply: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      body: z.string().min(1),
      isInternal: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await getSupportTicket(input.ticketId);
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });
      // Customers can only reply to their own tickets and cannot post internal notes
      if (isCustomer(ctx.user.role)) {
        if (ticket.clientId !== ctx.user.clientId) throw new TRPCError({ code: "FORBIDDEN" });
        if (input.isInternal) throw new TRPCError({ code: "FORBIDDEN" });
      }
      await createTicketReply({
        ticketId: input.ticketId,
        senderId: ctx.user.id,
        senderName: ctx.user.name ?? "Unknown",
        senderRole: ctx.user.role as any,
        body: input.body,
        isInternal: input.isInternal,
      });
      // If staff replies, update status to in_progress if still open
      if (isStaffOrAdmin(ctx.user.role) && ticket.status === "open") {
        await updateSupportTicket(ticket.id, { status: "in_progress" });
      }
      return { success: true };
    }),
});
