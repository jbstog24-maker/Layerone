/**
 * Client message monitoring + reply endpoints for the owner's agent.
 *
 * GET  /api/message-sync?token=<PROSPECT_SYNC_TOKEN>
 *   Returns the 100 most recent client_messages (newest first) with client
 *   company/name attached. The agent polls this to watch for new customer
 *   messages in the portal's Support Messages threads.
 *
 * POST /api/message-reply
 *   Body: { token, clientId, body }
 *   Sends a staff reply into a client's thread as the owner (Branden).
 *   Used only after the owner approves a drafted reply in chat.
 *
 * Auth: shared token from PROSPECT_SYNC_TOKEN (constant-time compare).
 * Both endpoints expose customer PII — keep the token secret.
 */
import { desc, eq } from "drizzle-orm";
import type { Express, Request, Response } from "express";
import { timingSafeEqual } from "crypto";
import { getDb, getUserByEmail } from "./db";
import { clientMessages, clients } from "../drizzle/schema";

const OWNER_EMAIL = "jbstog24@gmail.com";

function tokenOk(provided: unknown): boolean {
  const expected = process.env.PROSPECT_SYNC_TOKEN;
  if (!expected || typeof provided !== "string" || provided.length === 0) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function registerMessageSyncRoutes(app: Express) {
  app.get("/api/message-sync", async (req: Request, res: Response) => {
    if (!tokenOk(req.query.token)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    try {
      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "db unavailable" });
        return;
      }
      const rows = await db
        .select({
          id: clientMessages.id,
          clientId: clientMessages.clientId,
          senderRole: clientMessages.senderRole,
          senderName: clientMessages.senderName,
          body: clientMessages.body,
          readAt: clientMessages.readAt,
          createdAt: clientMessages.createdAt,
          companyName: clients.companyName,
          contactName: clients.contactName,
        })
        .from(clientMessages)
        .leftJoin(clients, eq(clients.id, clientMessages.clientId))
        .orderBy(desc(clientMessages.id))
        .limit(100);
      res.json({ messages: rows, exportedAt: new Date().toISOString() });
    } catch (err: any) {
      console.error("[MessageSync] failed:", err?.message ?? err);
      res.status(500).json({ error: "sync failed" });
    }
  });

  app.post("/api/message-reply", async (req: Request, res: Response) => {
    const { token, clientId, body } = req.body ?? {};
    if (!tokenOk(token)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    if (typeof clientId !== "number" || !Number.isInteger(clientId)) {
      res.status(400).json({ error: "clientId must be an integer" });
      return;
    }
    if (typeof body !== "string" || body.trim().length === 0 || body.length > 5000) {
      res.status(400).json({ error: "body must be 1-5000 characters" });
      return;
    }
    try {
      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "db unavailable" });
        return;
      }
      const [client] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.id, clientId))
        .limit(1);
      if (!client) {
        res.status(404).json({ error: "client not found" });
        return;
      }
      const owner = await getUserByEmail(OWNER_EMAIL).catch(() => null);
      const [result] = await db.insert(clientMessages).values({
        clientId,
        senderId: owner?.id ?? null,
        senderRole: "admin",
        senderName: owner?.name ?? "Branden",
        body: body.trim(),
      });
      const insertId = (result as any)?.insertId ?? null;
      console.log(`[MessageSync] staff reply sent to client ${clientId} (message ${insertId})`);
      res.json({ success: true, messageId: insertId });
    } catch (err: any) {
      console.error("[MessageSync] reply failed:", err?.message ?? err);
      res.status(500).json({ error: "reply failed" });
    }
  });
}
