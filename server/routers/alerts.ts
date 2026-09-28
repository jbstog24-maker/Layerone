import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  clientMessages,
  clients,
  msaDocuments,
  onboardingChecklists,
  onboardingTasks,
  packageInquiries,
  quotes,
  users,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { customerProcedure, protectedProcedure, router } from "../_core/trpc";

function isStaffOrAdmin(role: string | undefined) {
  return role === "admin" || role === "staff";
}

export interface AlertItem {
  id: string;
  kind: "message" | "inquiry" | "quote" | "msa" | "user" | "onboarding";
  severity: "urgent" | "warning" | "info";
  title: string;
  detail: string;
  /** What the user/staff needs to do — shown behind the info button. */
  actionHint: string;
  clientId: number | null;
  clientName: string | null;
  href: string;
  createdAt: string;
}

const SEVERITY_RANK: Record<AlertItem["severity"], number> = {
  urgent: 0,
  warning: 1,
  info: 2,
};

function sortAlerts(alerts: AlertItem[]): AlertItem[] {
  return alerts.sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

async function adminAlerts(): Promise<AlertItem[]> {
  const db = await getDb();
  if (!db) return [];
  const alerts: AlertItem[] = [];

  // ── 1. Unread customer messages, grouped by client ──────────────────────────
  const unreadThreads = await db
    .select({
      clientId: clientMessages.clientId,
      unreadCount: sql<number>`SUM(CASE WHEN ${clientMessages.senderRole} IN ('customer_admin','customer_viewer') AND ${clientMessages.readAt} IS NULL THEN 1 ELSE 0 END)`,
      latestBody: sql<string>`(SELECT body FROM client_messages cm2 WHERE cm2.clientId = ${clientMessages.clientId} ORDER BY cm2.createdAt DESC LIMIT 1)`,
      latestAt: sql<Date>`MAX(${clientMessages.createdAt})`,
    })
    .from(clientMessages)
    .groupBy(clientMessages.clientId)
    .having(sql`SUM(CASE WHEN ${clientMessages.senderRole} IN ('customer_admin','customer_viewer') AND ${clientMessages.readAt} IS NULL THEN 1 ELSE 0 END) > 0`)
    .orderBy(sql`MAX(${clientMessages.createdAt}) DESC`);

  if (unreadThreads.length > 0) {
    const clientRows = await db
      .select({ id: clients.id, companyName: clients.companyName })
      .from(clients)
      .where(
        inArray(
          clients.id,
          unreadThreads.map(t => t.clientId)
        )
      );
    const nameById = Object.fromEntries(clientRows.map(c => [c.id, c.companyName]));
    for (const t of unreadThreads) {
      const n = Number(t.unreadCount ?? 0);
      const name = nameById[t.clientId] ?? "Unknown client";
      alerts.push({
        id: `msg-${t.clientId}`,
        kind: "message",
        severity: "warning",
        title: `${n} unread message${n === 1 ? "" : "s"} from ${name}`,
        detail: (t.latestBody ?? "").slice(0, 120),
        actionHint:
          "Open the conversation, read the customer's latest message, and reply. The unread badge clears once you've read the thread.",
        clientId: t.clientId,
        clientName: name,
        href: `/messages?client=${t.clientId}`,
        createdAt: new Date(t.latestAt ?? Date.now()).toISOString(),
      });
    }
  }

  // ── 2. New / needs-review inquiries ─────────────────────────────────────────
  const pendingInquiries = await db
    .select()
    .from(packageInquiries)
    .where(inArray(packageInquiries.status, ["new", "needs_review"]))
    .orderBy(desc(packageInquiries.createdAt))
    .limit(25);
  for (const q of pendingInquiries) {
    const isNew = q.status === "new";
    alerts.push({
      id: `inquiry-${q.id}`,
      kind: "inquiry",
      severity: isNew ? "info" : "warning",
      title: isNew
        ? `New inquiry from ${q.company}`
        : `Inquiry needs review — ${q.company}`,
      detail: `${q.name} · ${q.tier} package · ${new Date(q.createdAt).toLocaleDateString()}`,
      actionHint: isNew
        ? "Open the inquiry, review the requirements, and either generate a draft quote or mark it contacted."
        : "This inquiry was flagged for review. Check the details and move it forward — approve the draft quote or follow up with the prospect.",
      clientId: null,
      clientName: q.company,
      href: "/inquiries",
      createdAt: new Date(q.createdAt).toISOString(),
    });
  }

  // ── 3. Draft quotes awaiting approval ───────────────────────────────────────
  const draftQuotes = await db
    .select({
      id: quotes.id,
      totalAmount: quotes.totalAmount,
      createdAt: quotes.createdAt,
      company: packageInquiries.company,
    })
    .from(quotes)
    .innerJoin(packageInquiries, eq(quotes.inquiryId, packageInquiries.id))
    .where(eq(quotes.status, "draft"))
    .orderBy(desc(quotes.createdAt))
    .limit(25);
  for (const q of draftQuotes) {
    alerts.push({
      id: `quote-${q.id}`,
      kind: "quote",
      severity: "warning",
      title: `Draft quote awaiting approval — ${q.company}`,
      detail: `Quote #${q.id} · $${Number(q.totalAmount ?? 0).toLocaleString()}`,
      actionHint:
        "Review the draft quote on the inquiry, then approve and send it to email the customer their proposal, MSA signing link, and payment link.",
      clientId: null,
      clientName: q.company,
      href: "/inquiries",
      createdAt: new Date(q.createdAt).toISOString(),
    });
  }

  // ── 4. MSAs awaiting customer signature ─────────────────────────────────────
  const pendingMsa = await db
    .select({
      id: msaDocuments.id,
      createdAt: msaDocuments.createdAt,
      company: packageInquiries.company,
    })
    .from(msaDocuments)
    .innerJoin(packageInquiries, eq(msaDocuments.inquiryId, packageInquiries.id))
    .where(eq(msaDocuments.status, "pending"))
    .orderBy(desc(msaDocuments.createdAt))
    .limit(25);
  for (const m of pendingMsa) {
    alerts.push({
      id: `msa-${m.id}`,
      kind: "msa",
      severity: "warning",
      title: `MSA awaiting signature — ${m.company}`,
      detail: `Service agreement sent, not yet signed.`,
      actionHint:
        "The customer received the signing link by email. If it's been a while, nudge them via Messages or resend the proposal from the inquiry.",
      clientId: null,
      clientName: m.company,
      href: "/inquiries",
      createdAt: new Date(m.createdAt).toISOString(),
    });
  }

  // ── 5. Users with no linked client (stuck at Pending Approval) ─────────────
  const unlinked = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(
      and(
        inArray(users.role, ["customer_admin", "customer_viewer"]),
        isNull(users.clientId)
      )
    )
    .limit(25);
  if (unlinked.length > 0) {
    alerts.push({
      id: "users-unlinked",
      kind: "user",
      severity: "warning",
      title: `${unlinked.length} user${unlinked.length === 1 ? "" : "s"} awaiting client link`,
      detail: unlinked
        .slice(0, 3)
        .map(u => u.email ?? u.name ?? `#${u.id}`)
        .join(", "),
      actionHint:
        "These users can sign in but see the Pending Approval screen. Open Users, edit each one, and link them to their client account to grant portal access.",
      clientId: null,
      clientName: null,
      href: "/users",
      createdAt: new Date().toISOString(),
    });
  }

  // ── 6. Onboarding checklists still open ─────────────────────────────────────
  const openOnboarding = await db
    .select({
      id: onboardingChecklists.id,
      status: onboardingChecklists.status,
      clientId: onboardingChecklists.clientId,
      updatedAt: onboardingChecklists.updatedAt,
      companyName: clients.companyName,
    })
    .from(onboardingChecklists)
    .leftJoin(clients, eq(onboardingChecklists.clientId, clients.id))
    .where(inArray(onboardingChecklists.status, ["open", "in_progress"]))
    .orderBy(desc(onboardingChecklists.updatedAt))
    .limit(25);
  for (const o of openOnboarding) {
    alerts.push({
      id: `onboarding-${o.id}`,
      kind: "onboarding",
      severity: "info",
      title: `Onboarding ${o.status === "open" ? "not started" : "in progress"} — ${o.companyName ?? "Unknown client"}`,
      detail: "Customer onboarding checklist is still open.",
      actionHint:
        "Open the onboarding checklist, assign warehouse units if needed, and work through the remaining tasks with the customer.",
      clientId: o.clientId,
      clientName: o.companyName ?? null,
      href: "/onboarding",
      createdAt: new Date(o.updatedAt).toISOString(),
    });
  }

  return sortAlerts(alerts);
}

async function customerAlerts(
  userId: number,
  clientId: number,
  email: string
): Promise<AlertItem[]> {
  const db = await getDb();
  if (!db) return [];
  const alerts: AlertItem[] = [];

  // ── 1. Unread replies from Layer One staff ──────────────────────────────────
  const [unreadRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(clientMessages)
    .where(
      and(
        eq(clientMessages.clientId, clientId),
        sql`${clientMessages.senderRole} IN ('admin','staff')`,
        sql`${clientMessages.readAt} IS NULL`
      )
    );
  const unread = Number(unreadRow?.count ?? 0);
  if (unread > 0) {
    alerts.push({
      id: "my-messages",
      kind: "message",
      severity: "warning",
      title: `${unread} new message${unread === 1 ? "" : "s"} from Layer One`,
      detail: "Your Layer One team replied to your conversation.",
      actionHint:
        "Open Messages to read the reply. If they asked you a question or need a decision, reply right in the thread.",
      clientId,
      clientName: null,
      href: "/support-messages",
      createdAt: new Date().toISOString(),
    });
  }

  // ── 2. Open onboarding tasks for my client ─────────────────────────────────
  const openTasks = await db
    .select({ count: sql<number>`count(*)` })
    .from(onboardingTasks)
    .innerJoin(
      onboardingChecklists,
      eq(onboardingTasks.checklistId, onboardingChecklists.id)
    )
    .where(
      and(
        eq(onboardingChecklists.clientId, clientId),
        sql`${onboardingTasks.completedAt} IS NULL`
      )
    );
  const openCount = Number(openTasks[0]?.count ?? 0);
  if (openCount > 0) {
    alerts.push({
      id: "my-onboarding",
      kind: "onboarding",
      severity: "info",
      title: `${openCount} onboarding task${openCount === 1 ? "" : "s"} still open`,
      detail: "Your move-in checklist isn't finished yet.",
      actionHint:
        "Open Onboarding to see which steps are left — usually confirming inventory details or delivery scheduling.",
      clientId,
      clientName: null,
      href: "/onboarding",
      createdAt: new Date().toISOString(),
    });
  }

  // ── 3. MSA awaiting my signature (matched by inquiry email) ────────────────
  const normalizedEmail = email.trim().toLowerCase();
  const pendingMsa = await db
    .select({ id: msaDocuments.id, createdAt: msaDocuments.createdAt })
    .from(msaDocuments)
    .innerJoin(
      packageInquiries,
      eq(msaDocuments.inquiryId, packageInquiries.id)
    )
    .where(
      and(
        eq(msaDocuments.status, "pending"),
        sql`LOWER(${packageInquiries.email}) = ${normalizedEmail}`
      )
    )
    .limit(5);
  for (const m of pendingMsa) {
    alerts.push({
      id: `my-msa-${m.id}`,
      kind: "msa",
      severity: "urgent",
      title: "Service agreement ready to sign",
      detail: "Your MSA is waiting for your signature before work can start.",
      actionHint:
        "Check your email for the signing link from Layer One. Can't find it? Message us and we'll resend it right away.",
      clientId,
      clientName: null,
      href: "/support-messages",
      createdAt: new Date(m.createdAt).toISOString(),
    });
  }

  return sortAlerts(alerts);
}

export const alertsRouter = router({
  // Admin/staff: everything pending across clients — the todo list.
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!isStaffOrAdmin(ctx.user?.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return adminAlerts();
  }),

  // Customer: what needs *my* attention.
  myList: customerProcedure.query(async ({ ctx }) => {
    const clientId = ctx.user?.clientId;
    if (!clientId) return [];
    return customerAlerts(
      ctx.user.id,
      clientId,
      ctx.user.email ?? ""
    );
  }),
});
