import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { getClient } from "../db";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

// Customer-gated procedure: customer roles must have an approved client
const CUSTOMER_ROLES = ["customer_admin", "customer_viewer"];
export const customerProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    // Admin and staff are always allowed through
    if (!CUSTOMER_ROLES.includes(ctx.user.role)) {
      return next({ ctx: { ...ctx, user: ctx.user } });
    }
    // Customer must have a linked client that is active or onboarding
    if (!ctx.user.clientId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Your account is pending approval. Please contact NSDS to get access." });
    }
    const client = await getClient(ctx.user.clientId);
    if (!client || (client.status !== "active" && client.status !== "onboarding")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Your account is not currently active. Please contact NSDS support." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
