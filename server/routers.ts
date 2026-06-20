import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { clientsRouter } from "./routers/clients";
import { packagesRouter } from "./routers/packages";
import { deliveriesRouter } from "./routers/deliveries";
import { receivingRouter, palletsRouter, boxesRouter, devicesRouter } from "./routers/inventory";
import { stagingRouter } from "./routers/staging";
import { shipmentsRouter } from "./routers/shipments";
import { billingRouter } from "./routers/billing";
import { photosRouter, activityRouter, dashboardRouter, usersRouter } from "./routers/misc";
import { inquiryRouter } from "./routers/inquiry";
import { documentsRouter } from "./routers/documents";
import { messagesRouter } from "./routers/messages";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
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
  documents: documentsRouter,
  messages: messagesRouter,
});

export type AppRouter = typeof appRouter;
