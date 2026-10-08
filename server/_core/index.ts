import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerStripeRoutes } from "../stripe";
import { runOnceMigration } from "../migrate-once";
import { mintDemoDocOnce, mintDemoUserOnce } from "../demo-seed-once";
import { registerProspectSyncRoute } from "../prospectSync";
import { registerReferralSyncRoute } from "../referralSync";
import { registerBackupExportRoute } from "../backupExport";
import { registerMessageSyncRoutes } from "../messageSync";
import { registerScheduledCallRoutes } from "../scheduledCalls";
import { registerCallLogRoutes } from "../callLog";
import { registerVoiceRoutes } from "../voice";
import { registerTrainingGuideRoutes } from "../trainingGuide";
import { registerAutomationRoutes } from "../automation";
import {
  handleMonthlyInvoices,
  handleDripAutoSend,
  handleLeadScoreDecay,
} from "../scheduledHandlers";
import rateLimit from "express-rate-limit";
import { ENV } from "./env";

// Rate limiters - disabled in development to avoid friction
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skip: () => process.env.NODE_ENV === "development",
});

// Strict limiter for public inquiry/request forms - max 5 per IP per hour
const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many submissions. Please wait before submitting again.",
  },
  skip: () => process.env.NODE_ENV === "development",
});

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  // Behind Render's reverse proxy: trust the first proxy hop so req.ip and
  // express-rate-limit see the real client IP from X-Forwarded-For.
  app.set("trust proxy", 1);
  const server = createServer(app);
  // One-time additive DB migration (only runs when RUN_ONCE_MIGRATION=1). Never throws.
  await runOnceMigration();
  // One-time demo MSA seeder (only runs when MINT_DEMO_DOC=1). Never throws.
  await mintDemoDocOnce();
  // One-time demo portal user seeder (only runs when MINT_DEMO_USER=1). Never throws.
  await mintDemoUserOnce();
  // Register Stripe webhook BEFORE express.json() so raw body is available for signature verification
  registerStripeRoutes(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  // Apply rate limiting
  app.use("/api/trpc", apiLimiter);
  // Strict rate limit on public form submissions
  app.use("/api/trpc/inquiry.submit", inquiryLimiter);
  app.use("/api/trpc/packages.request", inquiryLimiter);
  app.use("/api/trpc/scheduledCall.book", inquiryLimiter);
  // Scheduled heartbeat handlers (cron callbacks)
  app.post("/api/scheduled/monthly-invoices", handleMonthlyInvoices);
  app.post("/api/scheduled/drip-auto-send", handleDripAutoSend);
  app.post("/api/scheduled/lead-score-decay", handleLeadScoreDecay);
  // Prospect tracking sheet sync (token-authenticated, read-only)
  registerProspectSyncRoute(app);
  // Referral tracking sheet sync (token-authenticated, read-only)
  registerReferralSyncRoute(app);
  // Nightly off-site backup export (token-authenticated, read-only)
  registerBackupExportRoute(app);
  // Client message monitoring + owner-approved replies (token-authenticated)
  registerMessageSyncRoutes(app);
  // Scheduled website callbacks: Alex calls verified bookings at their time (token-authenticated)
  registerScheduledCallRoutes(app);
  // Bland post-call webhook → durable call transcript archive (token-authenticated)
  registerCallLogRoutes(app);
  // Alex voice account-access + spam blocklist (token-authenticated)
  registerVoiceRoutes(app);
  // Sadie training guide email (token-authenticated)
  registerTrainingGuideRoutes(app);
  // Daily customer-notification automation: invoice overdue, doc expiry,
  // quote follow-ups, onboarding stalls (token-authenticated)
  registerAutomationRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // GET / is handled by the React SPA (Landing.tsx) in both dev and production.
  // The serveStatic catch-all below will serve index.html for all SPA routes
  // including "/", which renders the Landing component.

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
