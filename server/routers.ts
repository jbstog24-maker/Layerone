import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { hashPassword, verifyPassword } from "./_core/password";
import { sdk } from "./_core/sdk";
import {
  getUserByEmail,
  getUserByInviteToken,
  setInviteToken,
  consumeInviteToken,
  upsertUser,
} from "./db";
import { randomBytes } from "crypto";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { clientsRouter } from "./routers/clients";
import { packagesRouter } from "./routers/packages";
import { deliveriesRouter } from "./routers/deliveries";
import {
  receivingRouter,
  palletsRouter,
  boxesRouter,
  devicesRouter,
} from "./routers/inventory";
import { stagingRouter } from "./routers/staging";
import { shipmentsRouter } from "./routers/shipments";
import { billingRouter } from "./routers/billing";
import {
  photosRouter,
  activityRouter,
  dashboardRouter,
  usersRouter,
} from "./routers/misc";
import { inquiryRouter } from "./routers/inquiry";
import { scheduledCallRouter } from "./routers/scheduledCalls";
import { msaRouter } from "./routers/msa";
import { quotesRouter } from "./routers/quotes";
import { terminationRouter } from "./routers/termination";
import { onboardingRouter } from "./routers/onboarding";
import { documentsRouter } from "./routers/documents";
import { messagesRouter } from "./routers/messages";
import { alertsRouter } from "./routers/alerts";
import { forwardingRouter } from "./routers/forwarding";
import { shipmentDocsRouter } from "./routers/shipmentDocs";
import { stagingNotifyRouter } from "./routers/stagingNotify";
import { leadsRouter } from "./routers/leads";
import { contentRouter } from "./routers/content";
import { supportRouter } from "./routers/support";
import { instructionsRouter } from "./routers/instructions";
import { voiceRouter } from "./routers/voice";
import { ENV } from "./_core/env";

function getPortalBaseUrl(): string {
  return (ENV.portalUrl ?? "https://www.layeronestaging.com").replace(/\/+$/, "");
}

// Simple in-memory brute-force guard for the login mutation:
// max 10 failed attempts per email per 15 minutes.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(email: string) {
  const now = Date.now();
  const record = loginAttempts.get(email);
  if (record && record.resetAt > now && record.count >= LOGIN_MAX_ATTEMPTS) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many sign-in attempts. Please try again in 15 minutes.",
    });
  }
}

function recordFailedLogin(email: string) {
  const now = Date.now();
  const record = loginAttempts.get(email);
  if (!record || record.resetAt <= now) {
    loginAttempts.set(email, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    record.count += 1;
  }
}

function clearLoginAttempts(email: string) {
  loginAttempts.delete(email);
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    register: publicProcedure
      .input(
        z.object({
          name: z.string().trim().min(1, "Name is required").max(100),
          email: z
            .string()
            .trim()
            .toLowerCase()
            .email("Enter a valid email")
            .max(320),
          password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(128),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "An account with this email already exists. Try signing in instead.",
          });
        }
        const passwordHash = await hashPassword(input.password);
        const openId = `local:${input.email}`;
        const ownerEmail = (process.env.OWNER_EMAIL ?? "").toLowerCase().trim();
        const role =
          ownerEmail && input.email === ownerEmail
            ? "admin"
            : "customer_viewer";
        await upsertUser({
          openId,
          name: input.name,
          email: input.email,
          passwordHash,
          loginMethod: "password",
          role,
          lastSignedIn: new Date(),
        });
        const sessionToken = await sdk.createSessionToken(openId, {
          name: input.name,
          expiresInMs: ONE_YEAR_MS,
        });
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: ONE_YEAR_MS,
        });
        return { success: true } as const;
      }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().trim().toLowerCase().email().max(320),
          password: z.string().min(1).max(128),
        })
      )
      .mutation(async ({ ctx, input }) => {
        checkLoginRateLimit(input.email);
        const user = await getUserByEmail(input.email);
        const valid =
          user && (await verifyPassword(input.password, user.passwordHash));
        if (!valid) {
          recordFailedLogin(input.email);
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password.",
          });
        }
        if (user.isActive === false) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This account has been deactivated. Contact support.",
          });
        }
        await upsertUser({ openId: user.openId, lastSignedIn: new Date() });
        clearLoginAttempts(input.email);
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: ONE_YEAR_MS,
        });
        return { success: true } as const;
      }),

    // Set an initial password (or reset it) via a single-use invite token.
    // This is how admin-invited users - who are created without a password -
    // activate their accounts.
    setupPassword: publicProcedure
      .input(
        z.object({
          token: z.string().min(16).max(128),
          password: z.string().min(8, "Password must be at least 8 characters").max(128),
        })
      )
      .mutation(async ({ input }) => {
        const user = await getUserByInviteToken(input.token);
        if (
          !user ||
          !user.inviteTokenExpiresAt ||
          user.inviteTokenExpiresAt.getTime() < Date.now()
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This link is invalid or has expired. Ask your Layer One admin for a new invite.",
          });
        }
        const passwordHash = await hashPassword(input.password);
        await consumeInviteToken(user.id, passwordHash);
        return { success: true } as const;
      }),

    // Request a password-reset email. Always returns success so account
    // existence can't be probed.
    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().trim().toLowerCase().email().max(320) }))
      .mutation(async ({ input }) => {
        const user = await getUserByEmail(input.email);
        if (user && user.email) {
          const token = randomBytes(32).toString("hex");
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
          await setInviteToken(user.id, token, expiresAt);
          const { sendPasswordResetEmail } = await import("./email");
          await sendPasswordResetEmail({
            to: user.email,
            name: user.name ?? user.email,
            resetUrl: `${getPortalBaseUrl()}/set-password?token=${token}`,
          }).catch(() => {});
        }
        return { success: true } as const;
      }),
  }),
  clients: clientsRouter,
  packages: packagesRouter,
  deliveries: deliveriesRouter,
  receiving: receivingRouter,
  pallets: palletsRouter,
  boxes: boxesRouter,
  devices: devicesRouter,
  staging: stagingRouter,
  shipments: shipmentsRouter,
  billing: billingRouter,
  photos: photosRouter,
  activity: activityRouter,
  dashboard: dashboardRouter,
  users: usersRouter,
  inquiry: inquiryRouter,
  scheduledCall: scheduledCallRouter,
  msa: msaRouter,
  quotes: quotesRouter,
  termination: terminationRouter,
  onboarding: onboardingRouter,
  documents: documentsRouter,
  messages: messagesRouter,
  alerts: alertsRouter,
  forwarding: forwardingRouter,
  shipmentDocs: shipmentDocsRouter,
  stagingNotify: stagingNotifyRouter,
  leads: leadsRouter,
  content: contentRouter,
  support: supportRouter,
  instructions: instructionsRouter,
  voice: voiceRouter,
});

export type AppRouter = typeof appRouter;
