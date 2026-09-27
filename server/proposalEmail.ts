import { Resend } from "resend";
import { ENV } from "./_core/env";

// ─── Proposal Email (MSA + payment) ──────────────────────────────────────────
// Sent to the prospect when a Layer One rep approves a quote. Contains both the
// "Review & Sign MSA" and "Pay Securely" actions. Self-contained Resend setup
// mirroring server/email.ts. Non-throwing: returns boolean.

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!ENV.resendApiKey) throw new Error("RESEND_API_KEY is not configured");
    _resend = new Resend(ENV.resendApiKey);
  }
  return _resend;
}

export type ProposalLineItem = {
  label: string;
  qty: number;
  unitPrice: number;
  total: number;
};

export type ProposalEmailParams = {
  to: string;
  name: string;
  company: string;
  tierLabel: string;
  lineItems: ProposalLineItem[];
  totalAmount: number;
  msaUrl: string;
  payUrl: string;
};

function esc(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const money = (n: number): string =>
  `$${Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function buildProposalHtml(params: ProposalEmailParams): string {
  const firstName = esc(params.name.split(" ")[0] ?? params.name);

  const itemRows = params.lineItems
    .map(
      (li) => `<tr>
        <td style="padding:10px 12px;font-size:13.5px;color:#e2e8f0;border-bottom:1px solid #1e3a5f;">${esc(li.label)}</td>
        <td align="center" style="padding:10px 12px;font-size:13.5px;color:#94a3b8;border-bottom:1px solid #1e3a5f;">${esc(li.qty)}</td>
        <td align="right" style="padding:10px 12px;font-size:13.5px;color:#94a3b8;border-bottom:1px solid #1e3a5f;">${money(li.unitPrice)}</td>
        <td align="right" style="padding:10px 12px;font-size:13.5px;color:#e2e8f0;font-weight:600;border-bottom:1px solid #1e3a5f;">${money(li.total)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><title>Your Layer One Proposal</title></head>
<body style="margin:0;padding:0;background:#07111f;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07111f;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0d1f35;border-radius:12px;border:1px solid #1e3a5f;overflow:hidden;">
        <tr><td style="padding:28px 40px;border-bottom:1px solid #1e3a5f;">
          <p style="margin:0;font-size:20px;font-weight:800;color:#0A84FF;letter-spacing:1px;">Your Layer One Proposal</p>
          <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">${esc(params.tierLabel)} package &mdash; ${esc(params.company)}</p>
        </td></tr>
        <tr><td style="padding:24px 40px;">
          <p style="font-size:15px;color:#e2e8f0;margin:0 0 12px;">Hi ${firstName},</p>
          <p style="font-size:14px;color:#94a3b8;margin:0 0 20px;line-height:1.6;">
            Your proposal is ready. Review the details below, then complete both steps to activate your services:
            <strong style="color:#e2e8f0;">sign the Master Services Agreement</strong> and <strong style="color:#e2e8f0;">submit payment</strong>.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1929;border-radius:8px;border:1px solid #1e3a5f;margin-bottom:20px;">
            <tr>
              <td style="padding:10px 12px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #1e3a5f;">Item</td>
              <td align="center" style="padding:10px 12px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #1e3a5f;">Qty</td>
              <td align="right" style="padding:10px 12px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #1e3a5f;">Unit</td>
              <td align="right" style="padding:10px 12px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #1e3a5f;">Amount</td>
            </tr>
            ${itemRows}
            <tr>
              <td colspan="3" align="right" style="padding:12px;font-size:14px;color:#94a3b8;font-weight:600;">Total</td>
              <td align="right" style="padding:12px;font-size:16px;color:#6ee7b7;font-weight:800;">${money(params.totalAmount)}</td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
            <tr>
              <td align="center" style="padding:6px;">
                <a href="${esc(params.msaUrl)}" style="display:inline-block;background:#0A84FF;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:8px;">Review &amp; Sign MSA</a>
              </td>
              <td align="center" style="padding:6px;">
                <a href="${esc(params.payUrl)}" style="display:inline-block;background:#16a34a;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:8px;">Pay Securely</a>
              </td>
            </tr>
          </table>
          <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0;">
            Both steps are needed before onboarding begins. The signing link expires in 30 days.
            Questions? Reply to this email or contact us at ${esc(ENV.supportEmail)}.
          </p>
        </td></tr>
        <tr><td style="padding:16px 40px;border-top:1px solid #1e3a5f;text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">&copy; ${new Date().getFullYear()} Layer One Staging</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Sends the branded proposal email (MSA signing link + payment link).
 * Returns true on success, false on failure (non-throwing).
 */
export async function sendProposalEmail(
  params: ProposalEmailParams
): Promise<boolean> {
  if (!ENV.resendApiKey || !ENV.resendFromEmail) {
    console.warn(
      "[Email] RESEND_API_KEY or RESEND_FROM_EMAIL not configured — skipping proposal email"
    );
    return false;
  }

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: ENV.resendFromEmail,
      to: params.to,
      subject: `Your Layer One proposal — ${params.company}`,
      html: buildProposalHtml(params),
    });

    if (error) {
      console.warn("[Email] Resend error (proposal):", error);
      return false;
    }

    console.log(`[Email] Proposal email sent to ${params.to}`);
    return true;
  } catch (err) {
    console.warn("[Email] Failed to send proposal email:", err);
    return false;
  }
}
