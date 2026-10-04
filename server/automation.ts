/**
 * Daily customer-notification automation endpoint.
 *
 * GET /api/automation/daily?token=<AUTOMATION_TOKEN>
 *
 * Hit once per day by an external cron. Each run:
 *  1. Marks newly past-due invoices as "overdue" and sends reminder emails
 *     at 7, 14, and 30 days overdue (tracked in the activity log).
 *  2. Sends signing reminders for MSA documents expiring in 7, 3, or 1 days.
 *  3. Flags quotes sitting in "sent" for 7+ days (owner alert only, no
 *     customer email - staff decides the follow-up).
 *  4. Flags onboarding checklists stalled 14+ days with no task completions
 *     (owner alert only).
 *
 * Auth: shared token from AUTOMATION_TOKEN (constant-time compare), same
 * pattern as /api/prospect-sync and /api/scheduled-calls/process. Never
 * expose this route without the token: it sends real customer emails.
 * Never throws - individual failures are logged and the run continues.
 */
import { and, desc, eq, inArray, isNotNull, lt, ne, or } from "drizzle-orm";
import type { Express, Request, Response } from "express";
import { timingSafeEqual } from "crypto";
import { getDb, getClient, logActivity } from "./db";
import { ENV } from "./_core/env";
import { notifyOwner } from "./_core/notification";
import {
  activityLogs,
  invoices,
  msaDocuments,
  onboardingChecklists,
  onboardingTasks,
  packageInquiries,
  quotes,
} from "../drizzle/schema";
import {
  sendInvoiceOverdueEmail,
  sendDocumentReminderEmail,
} from "./email";

const DAY_MS = 24 * 60 * 60 * 1000;

function tokenOk(provided: unknown): boolean {
  const expected = process.env.AUTOMATION_TOKEN;
  if (!expected || typeof provided !== "string" || provided.length === 0) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function portalBase(): string {
  return (ENV.portalUrl ?? "https://www.layeronestaging.com").replace(/\/+$/, "");
}

/** Check whether a reminder action was already logged for this entity. */
async function reminderAlreadySent(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  action: string,
  entityType: string,
  entityId: number
): Promise<boolean> {
  const rows = await db
    .select({ id: activityLogs.id })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.action, action),
        eq(activityLogs.entityType, entityType),
        eq(activityLogs.entityId, entityId)
      )
    )
    .limit(1);
  return rows.length > 0;
}

function fmtDate(d: Date | string | null): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fmtMoney(v: string | number | null | undefined): string {
  const n = parseFloat(String(v ?? "0"));
  if (!Number.isFinite(n)) return "$0.00";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── 1. Invoice overdue: mark + remind ───────────────────────────────────────
async function runInvoiceOverdue(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  now: Date
): Promise<{ markedOverdue: number; remindersSent: number }> {
  const result = { markedOverdue: 0, remindersSent: 0 };
  const REMINDER_DAYS = [7, 14, 30];

  // Mark newly past-due invoices as overdue.
  const newlyDue = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.status, "sent"), lt(invoices.dueDate, now)));
  for (const inv of newlyDue) {
    try {
      await db.update(invoices).set({ status: "overdue" }).where(eq(invoices.id, inv.id));
      await logActivity({
        clientId: inv.clientId,
        action: `Automation: invoice ${inv.invoiceNumber} marked overdue`,
        entityType: "invoice",
        entityId: inv.id,
      });
      result.markedOverdue++;
    } catch (err) {
      console.warn(`[Automation] failed to mark invoice ${inv.id} overdue:`, err);
    }
  }

  // Send reminders at 7/14/30 days past due (status sent or overdue).
  const pastDue = await db
    .select()
    .from(invoices)
    .where(
      and(
        inArray(invoices.status, ["sent", "overdue"]),
        lt(invoices.dueDate, now)
      )
    );
  for (const inv of pastDue) {
    try {
      if (!inv.dueDate) continue;
      const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / DAY_MS);
      const bucket = REMINDER_DAYS.find((d) => daysOverdue >= d && daysOverdue < d + 1);
      // Only remind on the exact day boundaries to avoid daily spam.
      if (bucket === undefined) continue;
      const action = `Automation: overdue reminder (${bucket}d) sent for ${inv.invoiceNumber}`;
      if (await reminderAlreadySent(db, action, "invoice", inv.id)) continue;

      const client = await getClient(inv.clientId);
      const to = client?.billingEmail ?? client?.contactEmail;
      if (!to) {
        console.warn(`[Automation] no email for client ${inv.clientId}, skipping overdue reminder`);
        continue;
      }
      const sent = await sendInvoiceOverdueEmail({
        to,
        invoiceNumber: inv.invoiceNumber,
        amount: fmtMoney(inv.total),
        daysOverdue,
        portalUrl: portalBase(),
      });
      if (sent) {
        await logActivity({
          clientId: inv.clientId,
          action,
          entityType: "invoice",
          entityId: inv.id,
        });
        result.remindersSent++;
      }
    } catch (err) {
      console.warn(`[Automation] overdue reminder failed for invoice ${inv.id}:`, err);
    }
  }
  return result;
}

// ─── 2. Document expiry reminders ────────────────────────────────────────────
async function runDocumentReminders(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  now: Date
): Promise<number> {
  let sent = 0;
  const REMINDER_WINDOWS = [7, 3, 1]; // days before expiry

  const docs = await db
    .select({
      doc: msaDocuments,
      company: packageInquiries.company,
      email: packageInquiries.email,
      name: packageInquiries.name,
    })
    .from(msaDocuments)
    .innerJoin(packageInquiries, eq(msaDocuments.inquiryId, packageInquiries.id))
    .where(eq(msaDocuments.status, "pending"));

  for (const { doc, company, email, name } of docs) {
    try {
      const msLeft = new Date(doc.tokenExpiresAt).getTime() - now.getTime();
      if (msLeft <= 0) continue; // already expired - handled elsewhere
      const daysLeft = Math.ceil(msLeft / DAY_MS);
      const window = REMINDER_WINDOWS.find((w) => daysLeft <= w);
      if (window === undefined) continue;

      const action = `Automation: signing reminder (${window}d) sent for MSA doc ${doc.id}`;
      if (await reminderAlreadySent(db, action, "msa_document", doc.id)) continue;

      const ok = await sendDocumentReminderEmail({
        to: email,
        signerName: name || company || "there",
        documentType: "Master Services Agreement",
        expiresInDays: daysLeft,
        signingUrl: `${portalBase()}/sign/${doc.token}`,
      });
      if (ok) {
        await logActivity({
          action,
          entityType: "msa_document",
          entityId: doc.id,
        });
        sent++;
      }
    } catch (err) {
      console.warn(`[Automation] document reminder failed for doc ${doc.id}:`, err);
    }
  }
  return sent;
}

// ─── 3. Quote follow-ups (owner alert only) ───────────────────────────────────
async function runQuoteFollowups(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  now: Date
): Promise<number> {
  let flagged = 0;
  const cutoff = new Date(now.getTime() - 7 * DAY_MS);

  const stale = await db
    .select({
      quote: quotes,
      company: packageInquiries.company,
      email: packageInquiries.email,
    })
    .from(quotes)
    .innerJoin(packageInquiries, eq(quotes.inquiryId, packageInquiries.id))
    .where(and(eq(quotes.status, "sent"), lt(quotes.sentAt, cutoff)));

  for (const { quote, company, email } of stale) {
    try {
      const action = `Automation: quote follow-up flagged for quote ${quote.id}`;
      if (await reminderAlreadySent(db, action, "quote", quote.id)) continue;

      await notifyOwner({
        title: `📋 Quote Follow-Up: ${company}`,
        content: `Quote #${quote.id} (${fmtMoney(quote.totalAmount)}) was sent over 7 days ago with no response.\n\nCompany: ${company}\nContact: ${email}\nSent: ${fmtDate(quote.sentAt)}\n\nConsider a follow-up call or email.`,
      });
      await logActivity({
        action,
        entityType: "quote",
        entityId: quote.id,
      });
      flagged++;
    } catch (err) {
      console.warn(`[Automation] quote follow-up failed for quote ${quote.id}:`, err);
    }
  }
  return flagged;
}

// ─── 4. Onboarding stall (owner alert only) ───────────────────────────────────
async function runOnboardingStall(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  now: Date
): Promise<number> {
  let flagged = 0;
  const cutoff = new Date(now.getTime() - 14 * DAY_MS);

  const open = await db
    .select()
    .from(onboardingChecklists)
    .where(ne(onboardingChecklists.status, "complete"));

  for (const checklist of open) {
    try {
      // Skip if any task was completed in the last 14 days.
      let lastActivity: Date | null = checklist.updatedAt
        ? new Date(checklist.updatedAt)
        : null;
      const latestTask = await db
        .select({ completedAt: onboardingTasks.completedAt })
        .from(onboardingTasks)
        .where(
          and(
            eq(onboardingTasks.checklistId, checklist.id),
            isNotNull(onboardingTasks.completedAt)
          )
        )
        .orderBy(desc(onboardingTasks.completedAt))
        .limit(1);
      if (latestTask.length > 0 && latestTask[0].completedAt) {
        const t = new Date(latestTask[0].completedAt);
        if (!lastActivity || t > lastActivity) lastActivity = t;
      }
      if (lastActivity && lastActivity >= cutoff) continue;

      const action = `Automation: onboarding stall flagged for checklist ${checklist.id}`;
      if (await reminderAlreadySent(db, action, "onboarding_checklist", checklist.id)) continue;

      const client = checklist.clientId ? await getClient(checklist.clientId) : null;
      await notifyOwner({
        title: `⏸️ Onboarding Stalled: ${client?.companyName ?? `Checklist #${checklist.id}`}`,
        content: `Onboarding checklist #${checklist.id} (${checklist.status}) has had no task completions in 14+ days.\n\nClient: ${client?.companyName ?? "unknown"}\nContact: ${client?.contactEmail ?? "unknown"}\nLast activity: ${lastActivity ? fmtDate(lastActivity) : "never"}\n\nConsider reaching out to unblock it.`,
      });
      await logActivity({
        clientId: checklist.clientId ?? undefined,
        action,
        entityType: "onboarding_checklist",
        entityId: checklist.id,
      });
      flagged++;
    } catch (err) {
      console.warn(`[Automation] onboarding stall check failed for checklist ${checklist.id}:`, err);
    }
  }
  return flagged;
}

// ─── Route registration ──────────────────────────────────────────────────────
export function registerAutomationRoutes(app: Express) {
  app.get("/api/automation/daily", async (req: Request, res: Response) => {
    if (!tokenOk(req.query.token)) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }
    const now = new Date();
    const summary = {
      invoicesMarkedOverdue: 0,
      overdueRemindersSent: 0,
      docRemindersSent: 0,
      quoteFollowupsFlagged: 0,
      stalledOnboardings: 0,
    };
    try {
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ ok: false, error: "database unavailable" });
      }
      const inv = await runInvoiceOverdue(db, now);
      summary.invoicesMarkedOverdue = inv.markedOverdue;
      summary.overdueRemindersSent = inv.remindersSent;

      summary.docRemindersSent = await runDocumentReminders(db, now);
      summary.quoteFollowupsFlagged = await runQuoteFollowups(db, now);
      summary.stalledOnboardings = await runOnboardingStall(db, now);

      console.log("[Automation] daily run complete:", JSON.stringify(summary));
      return res.json({ ok: true, ...summary });
    } catch (err: any) {
      console.error("[Automation] daily run failed:", err?.message ?? err);
      return res.status(500).json({ ok: false, error: "daily run failed", ...summary });
    }
  });
}
