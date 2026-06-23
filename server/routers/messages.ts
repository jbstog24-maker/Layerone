import { z } from "zod";
import { customerProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  listClientMessages,
  sendClientMessage,
  markClientMessagesRead,
  countUnreadClientMessages,
  listAllThreads,
  countTotalUnread,
  getClient,
} from "../db";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";

function isStaffOrAdmin(role: string | undefined) {
  return role === "admin" || role === "staff";
}

export const messagesRouter = router({
  // List all messages for a client thread
  list: customerProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const role = ctx.user?.role;
      // Staff/admin can see any client; customers can only see their own
      if (!isStaffOrAdmin(role)) {
        if (ctx.user?.clientId !== input.clientId) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
      }
      return listClientMessages(input.clientId);
    }),

  // Send a message in a client thread
  send: customerProcedure
    .input(z.object({
      clientId: z.number(),
      body: z.string().min(1).max(5000),
    }))
    .mutation(async ({ ctx, input }) => {
      const role = ctx.user?.role ?? "customer_viewer";
      // Customers can only message on their own thread
      if (!isStaffOrAdmin(role)) {
        if (ctx.user?.clientId !== input.clientId) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
      }

      await sendClientMessage({
        clientId: input.clientId,
        senderId: ctx.user?.id ?? null,
        senderRole: role as any,
        senderName: ctx.user?.name ?? "Unknown",
        body: input.body,
      });

      // Notify owner when a customer sends a message
      if (!isStaffOrAdmin(role)) {
        const client = await getClient(input.clientId);
        await notifyOwner({
          title: `New message from ${ctx.user?.name ?? "a client"} (${client?.companyName ?? "Unknown"})`,
          content: input.body.slice(0, 500),
        }).catch(() => {});
      }


      return { success: true };
    }),

  // Mark messages as read when staff opens the thread
  markRead: customerProcedure
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const role = ctx.user?.role;
      const forStaff = isStaffOrAdmin(role);
      if (!forStaff && ctx.user?.clientId !== input.clientId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await markClientMessagesRead(input.clientId, forStaff);
      return { success: true };
    }),

  // List all client threads (admin/staff only)
  threads: protectedProcedure
    .query(async ({ ctx }) => {
      if (!isStaffOrAdmin(ctx.user?.role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return listAllThreads();
    }),

  // Total unread count across all threads (admin/staff only)
  totalUnread: protectedProcedure
    .query(async ({ ctx }) => {
      if (!isStaffOrAdmin(ctx.user?.role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return countTotalUnread();
    }),

  // Count unread messages for a client thread (staff perspective)
  countUnread: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const role = ctx.user?.role;
      if (!isStaffOrAdmin(role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return countUnreadClientMessages(input.clientId, true);
    }),

  // Count unread staff replies for the current customer's own thread
  myUnread: customerProcedure
    .query(async ({ ctx }) => {
      const role = ctx.user?.role;
      // Only customers use this; staff/admin use totalUnread instead
      if (isStaffOrAdmin(role)) return 0;
      const clientId = ctx.user?.clientId;
      if (!clientId) return 0;
      return countUnreadClientMessages(clientId, false);
    }),
});
