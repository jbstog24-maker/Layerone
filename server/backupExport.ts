/**
 * Nightly backup export endpoint.
 *
 * GET /api/backup-export?token=<PROSPECT_SYNC_TOKEN>
 *
 * Returns full JSON dumps of the business-critical tables so an external job
 * can keep an off-site, append-only backup (nightly snapshots with retention).
 * This exists because the prospect Google Sheet is a mirror, not a backup:
 * if rows vanish from the database, a mirror wipes them too. Snapshots here
 * are never mutated after being written.
 *
 * Auth: same shared token as /api/prospect-sync (constant-time compare).
 * Read-only. The users table excludes passwordHash and invite/reset tokens —
 * a backup must never become a credential store. Everything else (including
 * MSA signing tokens and warehouse access codes) is included so a restore is
 * actually complete; treat downloaded snapshots as sensitive business data.
 */
import { timingSafeEqual } from "crypto";
import type { Express, Request, Response } from "express";
import { getDb } from "./db";
import {
  clientMessages,
  clients,
  invoiceLineItems,
  invoices,
  msaDocuments,
  onboardingChecklists,
  onboardingTasks,
  packageInquiries,
  quotes,
  users,
} from "../drizzle/schema";

function tokenOk(provided: unknown): boolean {
  const expected = process.env.PROSPECT_SYNC_TOKEN;
  if (!expected || typeof provided !== "string" || provided.length === 0) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// JSON-safe: drizzle returns Date objects for timestamps and Decimal strings;
// stringify them into ISO strings / plain values.
function cleanse(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(cleanse);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = cleanse(v);
    return out;
  }
  return value;
}

export function registerBackupExportRoute(app: Express) {
  app.get("/api/backup-export", async (req: Request, res: Response) => {
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

      const [
        inquiries,
        quotesRows,
        clientsRows,
        messages,
        msaDocs,
        checklists,
        tasks,
        invoicesRows,
        invoiceItems,
        usersRows,
      ] = await Promise.all([
        db.select().from(packageInquiries),
        db.select().from(quotes),
        db.select().from(clients),
        db.select().from(clientMessages),
        db.select().from(msaDocuments),
        db.select().from(onboardingChecklists),
        db.select().from(onboardingTasks),
        db.select().from(invoices),
        db.select().from(invoiceLineItems),
        // Never export credential material.
        db
          .select({
            id: users.id,
            openId: users.openId,
            name: users.name,
            email: users.email,
            loginMethod: users.loginMethod,
            role: users.role,
            clientId: users.clientId,
            businessName: users.businessName,
            phone: users.phone,
            location: users.location,
            jobTitle: users.jobTitle,
            department: users.department,
            isActive: users.isActive,
            hasSeenTour: users.hasSeenTour,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
            lastSignedIn: users.lastSignedIn,
          })
          .from(users),
      ]);

      const tables: Record<string, unknown> = {
        package_inquiries: inquiries,
        quotes: quotesRows,
        clients: clientsRows,
        client_messages: messages,
        msa_documents: msaDocs,
        onboarding_checklists: checklists,
        onboarding_tasks: tasks,
        invoices: invoicesRows,
        invoice_line_items: invoiceItems,
        users: usersRows,
      };

      const counts: Record<string, number> = {};
      for (const [name, rows] of Object.entries(tables)) {
        counts[name] = (rows as unknown[]).length;
      }

      res.json({
        exportedAt: new Date().toISOString(),
        counts,
        tables: cleanse(tables),
      });
    } catch (err: any) {
      console.error("[BackupExport] failed:", err?.message ?? err);
      res.status(500).json({ error: "export failed" });
    }
  });
}
