/**
 * Onboarding automation for Layer One Staging.
 *
 * Flow: quote paid (Stripe webhook) + MSA signed → onboarding checklist created,
 * inquiry moved to "onboarding", owner notified. Staff then work the checklist
 * (unit assignment, tasks) in the admin onboarding section until complete → "won".
 */
import { Resend } from "resend";
import { desc, eq } from "drizzle-orm";
import {
  onboardingChecklists,
  onboardingTasks,
  packageInquiries,
  quotes,
  type OnboardingChecklist,
  type OnboardingTask,
} from "../drizzle/schema";
import { getDb } from "./db";
import { ENV } from "./_core/env";

export type { OnboardingChecklist, OnboardingTask };

// ─── Checklist template ───────────────────────────────────────────────────────

export const ONBOARDING_TEMPLATE: Array<{ label: string; detail: string }> = [
  {
    label: "Payment & MSA confirmed",
    detail: "Auto-completed by the system when payment is received and the MSA is signed.",
  },
  {
    label: "Assign staging bay / units",
    detail: "Reserve bay, shelf, and pallet positions for this client's hardware.",
  },
  {
    label: "Schedule inbound freight receiving",
    detail: "Coordinate carrier delivery windows and dock appointments.",
  },
  {
    label: "Asset capture & tagging (serials, photos)",
    detail: "Record serial numbers, asset tags, and condition photos for every device.",
  },
  {
    label: "Staging & configuration complete",
    detail: "Image, configure, and test all devices per the statement of work.",
  },
  {
    label: "QA validation",
    detail: "Final quality check: serials match, configs verified, checklist signed off.",
  },
  {
    label: "Outbound shipment scheduled",
    detail: "Book carrier, print labels, and stage packed units for pickup.",
  },
  {
    label: "Closeout documentation sent",
    detail: "Send the client the final pack list, serial report, and tracking details.",
  },
];

// ─── Resend helper (mirrors server/email.ts brand pattern) ────────────────────

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!ENV.resendApiKey) throw new Error("RESEND_API_KEY is not configured");
    _resend = new Resend(ENV.resendApiKey);
  }
  return _resend;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendOwnerEmail(params: {
  subject: string;
  title: string;
  contentHtml: string;
}): Promise<boolean> {
  if (!ENV.resendApiKey || !ENV.resendFromEmail) {
    console.warn(
      "[Onboarding] RESEND_API_KEY or RESEND_FROM_EMAIL not configured - skipping owner email"
    );
    return false;
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><title>${escapeHtml(params.title)}</title></head>
<body style="margin:0;padding:0;background:#07111f;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07111f;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0d1f35;border-radius:12px;border:1px solid #1e3a5f;overflow:hidden;">
        <tr><td style="padding:28px 40px;border-bottom:1px solid #1e3a5f;">
          <p style="margin:0;font-size:20px;font-weight:800;color:#0A84FF;letter-spacing:1px;">${escapeHtml(params.title)}</p>
        </td></tr>
        <tr><td style="padding:24px 40px;">${params.contentHtml}</td></tr>
        <tr><td style="padding:16px 40px;border-top:1px solid #1e3a5f;text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">© ${new Date().getFullYear()} Layer One Staging</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: ENV.resendFromEmail,
      to: ENV.ownerNotifyEmail,
      subject: params.subject,
      html,
    });
    if (error) {
      console.warn("[Onboarding] Resend error (owner email):", error);
      return false;
    }
    console.log(`[Onboarding] Owner email sent: ${params.subject}`);
    return true;
  } catch (err) {
    console.warn("[Onboarding] Failed to send owner email:", err);
    return false;
  }
}

/** Base URL for admin links in owner emails. */
function portalBase(): string {
  return ENV.portalUrl;
}

// ─── Checklist lifecycle ──────────────────────────────────────────────────────

/**
 * Create the onboarding checklist for an inquiry (idempotent).
 * Task 1 ("Payment & MSA confirmed") is pre-completed by the system.
 */
export async function createOnboardingChecklist(
  inquiryId: number
): Promise<OnboardingChecklist | null> {
  const db = await getDb();
  if (!db) return null;

  const [existing] = await db
    .select()
    .from(onboardingChecklists)
    .where(eq(onboardingChecklists.inquiryId, inquiryId));
  if (existing) return existing;

  const now = new Date();
  const result = await db.insert(onboardingChecklists).values({
    inquiryId,
    template: "standard",
    status: "in_progress",
  });
  const id = (result[0] as any).insertId as number;

  await db.insert(onboardingTasks).values(
    ONBOARDING_TEMPLATE.map((t, i) => ({
      checklistId: id,
      label: t.label,
      detail: t.detail,
      sortOrder: i + 1,
      completedAt: i === 0 ? now : null,
      completedBy: i === 0 ? "system" : null,
    }))
  );

  const [created] = await db
    .select()
    .from(onboardingChecklists)
    .where(eq(onboardingChecklists.id, id));
  return created ?? null;
}

/**
 * Trigger the paid+signed → onboarding handoff.
 * Returns true when the handoff fired, false otherwise. Never throws.
 */
export async function checkAndTriggerHandoff(inquiryId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const [quote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.inquiryId, inquiryId))
      .orderBy(desc(quotes.createdAt))
      .limit(1);
    if (!quote || quote.status !== "paid" || quote.msaStatus !== "signed") {
      return false;
    }

    const [inquiry] = await db
      .select()
      .from(packageInquiries)
      .where(eq(packageInquiries.id, inquiryId));
    if (!inquiry) return false;

    // Already handed off (e.g. webhook retry) - don't duplicate emails.
    if (inquiry.status === "onboarding" || inquiry.status === "won") {
      return false;
    }

    await createOnboardingChecklist(inquiryId);
    await db
      .update(packageInquiries)
      .set({ status: "onboarding" })
      .where(eq(packageInquiries.id, inquiryId));

    const amount = `$${Number(quote.totalAmount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    const inquiriesUrl = `${portalBase()}/inquiries`;

    await sendOwnerEmail({
      subject: `✅ Ready for onboarding - ${inquiry.company} paid & signed`,
      title: "Ready for Onboarding",
      contentHtml: `
        <p style="font-size:15px;color:#e2e8f0;margin:0 0 16px;"><strong>${escapeHtml(inquiry.company)}</strong> has paid and signed the MSA. The onboarding checklist is open and assigned for review.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1929;border-radius:8px;border:1px solid #1e3a5f;margin-bottom:20px;">
          <tr><td style="padding:8px 12px;font-size:13px;color:#64748b;width:38%;">Amount paid</td><td style="padding:8px 12px;font-size:14px;color:#6ee7b7;font-weight:700;">${amount}</td></tr>
          <tr><td style="padding:8px 12px;font-size:13px;color:#64748b;">MSA</td><td style="padding:8px 12px;font-size:14px;color:#e2e8f0;">Signed ✅</td></tr>
          <tr><td style="padding:8px 12px;font-size:13px;color:#64748b;">Contact</td><td style="padding:8px 12px;font-size:14px;color:#e2e8f0;">${escapeHtml(inquiry.name)} (${escapeHtml(inquiry.email)})</td></tr>
        </table>
        <p style="margin:0;"><a href="${inquiriesUrl}" style="display:inline-block;background:#0A84FF;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;">Open Inquiries</a></p>
        <p style="font-size:13px;color:#64748b;margin:16px 0 0;">Next: assign staging bay/units and work the 8-step onboarding checklist in the admin onboarding section.</p>`,
    });

    console.log(
      `[Onboarding] Handoff triggered for inquiry ${inquiryId} (${inquiry.company})`
    );
    return true;
  } catch (err) {
    console.error("[Onboarding] checkAndTriggerHandoff failed:", err);
    return false;
  }
}
