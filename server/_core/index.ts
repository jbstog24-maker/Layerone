import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerStripeRoutes } from "../stripe";
import { handleMonthlyInvoices, handleDripAutoSend, handleLeadScoreDecay } from "../scheduledHandlers";
import rateLimit from "express-rate-limit";
import { getLandingPageHtml } from "../landingPage";
import { ENV } from "./env";

// Rate limiters — disabled in development to avoid friction
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skip: () => process.env.NODE_ENV === "development",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts, please try again later." },
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
  const server = createServer(app);
  // Register Stripe webhook BEFORE express.json() so raw body is available for signature verification
  registerStripeRoutes(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // Apply rate limiting
  app.use("/api/oauth", authLimiter);
  app.use("/api/trpc", apiLimiter);
  // Scheduled heartbeat handlers (cron callbacks)
  app.post("/api/scheduled/monthly-invoices", handleMonthlyInvoices);
  app.post("/api/scheduled/drip-auto-send", handleDripAutoSend);
  app.post("/api/scheduled/lead-score-decay", handleLeadScoreDecay);
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

  // ── OAuth start redirect (used by landing page Sign In links) ───────────────
  // Builds the correct OAuth URL server-side so the landing page doesn't need JS.
  app.get("/api/oauth/start", (req, res) => {
    const origin = `${req.protocol}://${req.get("host")}`;
    const appId = process.env.VITE_APP_ID ?? "";
    const oauthPortalUrl = process.env.VITE_OAUTH_PORTAL_URL ?? "";
    const redirectUri = `${origin}/api/oauth/callback`;
    const state = Buffer.from(redirectUri).toString("base64");
    const loginUrl = `${oauthPortalUrl}/app-auth?appId=${encodeURIComponent(appId)}&redirectUri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&type=signIn`;
    res.redirect(302, loginUrl);
  });

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
