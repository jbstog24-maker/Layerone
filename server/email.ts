import { Resend } from "resend";
import { INFO_CC } from "./infoCc";
import { sendHtmlEmail } from "./emailText";
import { ENV } from "./_core/env";

// Layer One brand SVG - kept in sync with Documents.tsx
const LAYER_ONE_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 120" width="200" height="43">
  <defs>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#39a7ff;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#6ee7b7;stop-opacity:1"/>
    </linearGradient>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#39a7ff;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#6ee7b7;stop-opacity:1"/>
    </linearGradient>
  </defs>
  <g transform="translate(8,8)">
    <path d="M50,0 L90,15 L90,55 Q90,85 50,100 Q10,85 10,55 L10,15 Z" fill="url(#shieldGrad)" opacity="0.15" stroke="url(#shieldGrad)" stroke-width="2"/>
    <path d="M50,8 L82,20 L82,55 Q82,78 50,92 Q18,78 18,55 L18,20 Z" fill="none" stroke="url(#shieldGrad)" stroke-width="1.5" opacity="0.6"/>
    <circle cx="50" cy="38" r="3" fill="#39a7ff"/>
    <circle cx="35" cy="55" r="3" fill="#6ee7b7"/>
    <circle cx="65" cy="55" r="3" fill="#6ee7b7"/>
    <circle cx="50" cy="70" r="3" fill="#39a7ff"/>
    <line x1="50" y1="38" x2="35" y2="55" stroke="#39a7ff" stroke-width="1.5" opacity="0.7"/>
    <line x1="50" y1="38" x2="65" y2="55" stroke="#39a7ff" stroke-width="1.5" opacity="0.7"/>
    <line x1="35" y1="55" x2="50" y2="70" stroke="#6ee7b7" stroke-width="1.5" opacity="0.7"/>
    <line x1="65" y1="55" x2="50" y2="70" stroke="#6ee7b7" stroke-width="1.5" opacity="0.7"/>
  </g>
  <text x="115" y="52" font-family="Inter,Arial,sans-serif" font-size="38" font-weight="700" fill="url(#textGrad)" letter-spacing="2">Layer One</text>
  <text x="116" y="75" font-family="Inter,Arial,sans-serif" font-size="11" font-weight="400" fill="#94a3b8" letter-spacing="1.5">DEPLOYMENT STAGING &amp; WAREHOUSE SOLUTIONS</text>
</svg>`;

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!ENV.resendApiKey) throw new Error("RESEND_API_KEY is not configured");
    _resend = new Resend(ENV.resendApiKey);
  }
  return _resend;
}

export type WelcomeEmailParams = {
  to: string;
  name: string;
  company: string;
  tier: string;
};

const TIER_DETAILS: Record<string, { label: string; price: string; description: string }> = {
  basic:        { label: "Basic",        price: "$499 one-time",    description: "Up to 5 devices, 5 boxes received, 14-day project window" },
  standard:     { label: "Standard",     price: "$750/month",       description: "Up to 10 devices, 10 boxes/month, 1 pallet/month, 30-day storage" },
  professional: { label: "Professional", price: "$1,500/month",     description: "Up to 25 devices, 30 boxes/month, 3 pallets/month, 30-day storage" },
  enterprise:   { label: "Enterprise",   price: "$3,500/month",     description: "Up to 75 devices, 75 boxes/month, 6 pallets/month, 45-day storage" },
  custom:       { label: "Custom",       price: "Contact us",       description: "Up to 150 devices, 200 boxes/month, 20 pallets/month, 60-day storage" },
};

function buildWelcomeHtml(params: WelcomeEmailParams): string {
  const tier = TIER_DETAILS[params.tier] ?? TIER_DETAILS.custom;
  const firstName = params.name.split(" ")[0] ?? params.name;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Layer One - Next Steps</title>
  <style>
    body { margin: 0; padding: 0; background: #07111f; font-family: Inter, Arial, sans-serif; color: #e2e8f0; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #0d1f35; border: 1px solid #1e3a5f; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0d1f35 0%, #07111f 100%); border-bottom: 1px solid #1e3a5f; padding: 32px; text-align: center; }
    .logo-text { font-size: 32px; font-weight: 800; background: linear-gradient(90deg, #39a7ff, #6ee7b7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 3px; }
    .logo-sub { font-size: 10px; color: #64748b; letter-spacing: 2px; margin-top: 4px; text-transform: uppercase; }
    .body { padding: 32px; }
    h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 8px; }
    p { font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px; }
    .highlight { color: #39a7ff; font-weight: 600; }
    .tier-box { background: #07111f; border: 1px solid #1e3a5f; border-radius: 10px; padding: 16px 20px; margin: 20px 0; }
    .tier-box .tier-name { font-size: 16px; font-weight: 700; color: #39a7ff; }
    .tier-box .tier-price { font-size: 13px; color: #6ee7b7; font-weight: 600; margin-top: 2px; }
    .tier-box .tier-desc { font-size: 13px; color: #64748b; margin-top: 4px; }
    .steps { margin: 24px 0; }
    .step { display: flex; gap: 16px; margin-bottom: 20px; align-items: flex-start; }
    .step-num { background: linear-gradient(135deg, #39a7ff, #6ee7b7); color: #07111f; font-weight: 800; font-size: 13px; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; min-width: 28px; }
    .step-content { flex: 1; }
    .step-title { font-size: 14px; font-weight: 700; color: #ffffff; margin: 0 0 4px; }
    .step-desc { font-size: 13px; color: #64748b; margin: 0; line-height: 1.5; }
    .timeline { background: #07111f; border: 1px solid #1e3a5f; border-radius: 10px; padding: 16px 20px; margin: 20px 0; }
    .timeline-title { font-size: 13px; font-weight: 700; color: #ffffff; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px; }
    .timeline-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #1e3a5f; font-size: 13px; }
    .timeline-row:last-child { border-bottom: none; }
    .timeline-label { color: #94a3b8; }
    .timeline-value { color: #6ee7b7; font-weight: 600; }
    .cta { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #39a7ff, #6ee7b7); color: #07111f; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 8px; text-decoration: none; letter-spacing: 0.5px; }
    .contact-box { background: #07111f; border: 1px solid #1e3a5f; border-radius: 10px; padding: 16px 20px; margin: 20px 0; }
    .contact-title { font-size: 13px; font-weight: 700; color: #ffffff; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px; }
    .contact-row { font-size: 13px; color: #94a3b8; margin: 4px 0; }
    .contact-row a { color: #39a7ff; text-decoration: none; }
    .footer { padding: 20px 32px; border-top: 1px solid #1e3a5f; text-align: center; }
    .footer p { font-size: 12px; color: #475569; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <!-- Header / Logo -->
      <div class="header">
        ${LAYER_ONE_LOGO_SVG}
      </div>

      <!-- Body -->
      <div class="body">
        <h1>Thank you, ${firstName}! 🎉</h1>
        <p>
          We've received your inquiry for <span class="highlight">${params.company}</span> and we're excited to get started.
          A member of our team will reach out within <strong style="color:#ffffff">1 business day</strong> to confirm your package and walk you through the onboarding process.
        </p>

        <!-- Selected Package -->
        <div class="tier-box">
          <div class="tier-name">${tier.label} Package</div>
          <div class="tier-price">${tier.price}</div>
          <div class="tier-desc">${tier.description}</div>
        </div>

        <!-- Next Steps -->
        <p style="font-size:14px;font-weight:700;color:#ffffff;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;">What Happens Next</p>
        <div class="steps">
          <div class="step">
            <div class="step-num">1</div>
            <div class="step-content">
              <p class="step-title">Team Review &amp; Consultation Call</p>
              <p class="step-desc">Our team reviews your inquiry and schedules a brief consultation call to confirm your requirements, device volume, and any custom needs.</p>
            </div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-content">
              <p class="step-title">Master Service Agreement (MSA)</p>
              <p class="step-desc">We'll send you a customized MSA outlining the full scope of services, SLA terms, and pricing. You'll review and sign it electronically via the portal.</p>
            </div>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div class="step-content">
              <p class="step-title">Payment &amp; Account Activation</p>
              <p class="step-desc">Once the MSA is signed, you'll receive a secure payment link. After payment is confirmed, your Layer One Staging Solutions Portal account is activated immediately.</p>
            </div>
          </div>
          <div class="step">
            <div class="step-num">4</div>
            <div class="step-content">
              <p class="step-title">Warehouse Space Assignment</p>
              <p class="step-desc">Our logistics team assigns your dedicated warehouse space and sends you access credentials, unit details, and intake instructions.</p>
            </div>
          </div>
          <div class="step">
            <div class="step-num">5</div>
            <div class="step-content">
              <p class="step-title">Go Live - 14-Day Onboarding Period</p>
              <p class="step-desc">Your 14-day onboarding period begins. Our technicians work with you to stage your first batch of devices, configure imaging workflows, and validate your deployment pipeline.</p>
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="timeline">
          <p class="timeline-title">Typical Timeline</p>
          <div class="timeline-row">
            <span class="timeline-label">Consultation call</span>
            <span class="timeline-value">Within 1 business day</span>
          </div>
          <div class="timeline-row">
            <span class="timeline-label">MSA sent</span>
            <span class="timeline-value">Within 2 business days</span>
          </div>
          <div class="timeline-row">
            <span class="timeline-label">Account activation</span>
            <span class="timeline-value">Same day as payment</span>
          </div>
          <div class="timeline-row">
            <span class="timeline-label">Warehouse assignment</span>
            <span class="timeline-value">Within 3 business days</span>
          </div>
          <div class="timeline-row">
            <span class="timeline-label">Go-live date</span>
            <span class="timeline-value">14 days after MSA signing</span>
          </div>
        </div>

        <!-- CTA -->
        <div class="cta">
          <a href="${ENV.portalUrl}" class="btn">Access the Layer One Staging Solutions Portal</a>
        </div>

        <!-- Contact -->
        <div class="contact-box">
          <p class="contact-title">Need Help?</p>
          <p class="contact-row">Our team is here to answer any questions before, during, and after onboarding.</p>
          <p class="contact-row">📧 <a href="mailto:${ENV.supportEmail}">${ENV.supportEmail}</a></p>
          <p class="contact-row">📞 ${ENV.supportPhone}</p>
          <p class="contact-row">You can also message us directly from your portal account once activated.</p>
        </div>

        <p style="font-size:13px;color:#475569;margin-top:24px;">
          This email was sent because you submitted a package inquiry on the Layer One Layer One Staging Solutions Portal. If you did not submit this inquiry, please disregard this email.
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>© ${new Date().getFullYear()} Layer One Staging. All rights reserved.</p>
        <p style="margin-top:4px;">Layer One Staging Solutions Portal - Warehouse &amp; Device Staging Management</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Sends a branded welcome / next-steps email to a prospect who just submitted
 * a package inquiry. Returns true on success, false on failure (non-throwing).
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<boolean> {
  if (!ENV.resendApiKey || !ENV.resendFromEmail) {
    console.warn("[Email] RESEND_API_KEY or RESEND_FROM_EMAIL not configured - skipping welcome email");
    return false;
  }

  try {
    const resend = getResend();
    const tierLabel = TIER_DETAILS[params.tier]?.label ?? params.tier;

    const { error } = await sendHtmlEmail(resend, {
      from: ENV.resendFromEmail,
      cc: INFO_CC,
      to: params.to,
      subject: `Welcome to Layer One - Your ${tierLabel} Package Inquiry`,
      html: buildWelcomeHtml(params),
    });

    if (error) {
      console.warn("[Email] Resend error:", error);
      return false;
    }

    console.log(`[Email] Welcome email sent to ${params.to}`);
    return true;
  } catch (err) {
    console.warn("[Email] Failed to send welcome email:", err);
    return false;
  }
}

// ─── Inquiry Owner Notification Email ─────────────────────────────────────────
// Sent to the Layer One owner inbox when a prospect submits a package inquiry.
// (notifyOwner targets the Manus platform notification service, which is not
// available on self-hosted Render - this email is the production path.)

export type InquiryOwnerEmailParams = {
  to: string;
  name: string;
  company: string;
  email: string;
  phone?: string | null;
  quoteType?: string | null;
  tierLabel: string;
  deviceCount?: number | null;
  palletCount?: number | null;
  boxCount?: number | null;
  storageDays?: number | null;
  addons?: string[];
  message?: string | null;
  locationCount?: number | null;
  equipmentTypes?: string[];
  startDate?: string | null;
  rolloutDuration?: string | null;
  salesRepName?: string | null;
};

export async function sendInquiryOwnerEmail(params: InquiryOwnerEmailParams): Promise<boolean> {
  if (!ENV.resendApiKey || !ENV.resendFromEmail) {
    console.warn("[Email] RESEND_API_KEY or RESEND_FROM_EMAIL not configured - skipping inquiry owner email");
    return false;
  }

  const row = (label: string, value: string | null | undefined) =>
    value ? `<tr><td style="padding:8px 12px;font-size:13px;color:#64748b;width:38%;">${label}</td><td style="padding:8px 12px;font-size:14px;color:#e2e8f0;">${value}</td></tr>` : "";

  const details =
    row("Name", params.name) +
    row("Company", params.company) +
    row("Email", params.email) +
    row("Phone", params.phone) +
    row("Quote Type", params.quoteType) +
    row("Package", params.tierLabel) +
    row("Devices", params.deviceCount != null ? String(params.deviceCount) : null) +
    row("Pallets", params.palletCount != null ? String(params.palletCount) : null) +
    row("Boxes", params.boxCount != null ? String(params.boxCount) : null) +
    row("Storage Days", params.storageDays != null ? String(params.storageDays) : null) +
    row("Locations", params.locationCount != null ? String(params.locationCount) : null) +
    row("Equipment Types", params.equipmentTypes?.length ? params.equipmentTypes.join(", ") : null) +
    row("Start Date", params.startDate) +
    row("Rollout Duration", params.rolloutDuration) +
    row("Sales Rep", params.salesRepName) +
    row("Add-ons", params.addons?.length ? params.addons.join(", ") : null);

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><title>New Package Inquiry</title></head>
<body style="margin:0;padding:0;background:#07111f;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07111f;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0d1f35;border-radius:12px;border:1px solid #1e3a5f;overflow:hidden;">
        <tr><td style="padding:28px 40px;border-bottom:1px solid #1e3a5f;">
          <p style="margin:0;font-size:20px;font-weight:800;color:#0A84FF;letter-spacing:1px;">New Package Inquiry</p>
          <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">${params.tierLabel} - ${params.company}</p>
        </td></tr>
        <tr><td style="padding:24px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1929;border-radius:8px;border:1px solid #1e3a5f;margin-bottom:20px;">${details}</table>
          ${params.message ? `<p style="font-size:13px;color:#94a3b8;background:#0a1929;padding:12px 16px;border-radius:6px;border-left:3px solid #0A84FF;"><strong style="color:#ffffff;">Message:</strong> ${params.message}</p>` : ""}
          <p style="font-size:13px;color:#64748b;">Reply directly to this email to respond to ${params.name} at ${params.email}.</p>
        </td></tr>
        <tr><td style="padding:16px 40px;border-top:1px solid #1e3a5f;text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">© ${new Date().getFullYear()} Layer One Staging</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    const resend = getResend();
    const { error } = await sendHtmlEmail(resend, {
      from: ENV.resendFromEmail,
      cc: INFO_CC,
      to: params.to,
      replyTo: params.email,
      subject: `New Package Inquiry - ${params.tierLabel} (${params.company})`,
      html,
    });
    if (error) {
      console.warn("[Email] Resend error (inquiry owner):", error);
      return false;
    }
    console.log(`[Email] Inquiry owner notification sent to ${params.to}`);
    return true;
  } catch (err) {
    console.warn("[Email] Failed to send inquiry owner email:", err);
    return false;
  }
}

// ─── Portal Invite Email (admin-provisioned users) ────────────────────────────

export type PortalInviteEmailParams = {
  to: string;
  name: string;
  businessName?: string | null;
  role: string;
  portalUrl?: string;
  /** Set-password link (single-use token). When present, the CTA sets the password. */
  setPasswordUrl?: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  staff: "Staff",
  customer_admin: "Customer Admin",
  customer_viewer: "Customer Viewer",
};

export function buildPortalInviteHtml(params: PortalInviteEmailParams): string {
  const firstName = params.name.split(" ")[0] ?? params.name;
  const portalUrl = params.portalUrl ?? ENV.portalUrl ?? "https://www.layeronestaging.com";
  const roleLabel = ROLE_LABELS[params.role] ?? params.role;
  const supportEmail = ENV.supportEmail ?? "info@layeronestaging.com";
  const supportPhone = ENV.supportPhone ?? "+1 (469) 537-4378";
  const ctaUrl = params.setPasswordUrl ?? portalUrl;
  const ctaLabel = params.setPasswordUrl ? "Set Your Password →" : "Access Your Portal →";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Layer One Portal Account is Ready</title>
</head>
<body style="margin:0;padding:0;background:#07111f;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07111f;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0d1f35;border-radius:12px;border:1px solid #1e3a5f;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0d1f35 0%,#0a2540 100%);padding:32px 40px;border-bottom:1px solid #1e3a5f;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:12px;">
                  <span style="font-size:22px;font-weight:800;color:#38bdf8;letter-spacing:-0.5px;">Layer One</span>
                  <span style="color:#334155;font-size:18px;">|</span>
                  <span style="font-size:13px;color:#64748b;letter-spacing:1px;text-transform:uppercase;">Layer One Staging Solutions</span>
                </div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#f1f5f9;">
            Your portal account is ready, ${firstName}!
          </h1>
          <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
            A Layer One admin has created a portal account for you${params.businessName ? ` on behalf of <strong style="color:#e2e8f0;">${params.businessName}</strong>` : ""}. Your role is <strong style="color:#38bdf8;">${roleLabel}</strong>.
          </p>

          <!-- Access CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr><td style="background:linear-gradient(135deg,#0284c7,#0ea5e9);border-radius:8px;padding:14px 28px;">
              <a href="${ctaUrl}" style="color:#fff;font-size:15px;font-weight:600;text-decoration:none;display:block;text-align:center;">
                ${ctaLabel}
              </a>
            </td></tr>
          </table>
          ${params.setPasswordUrl ? `<p style="margin:-16px 0 28px;font-size:13px;color:#94a3b8;">This link expires in 72 hours. If it expires, use "Forgot password?" on the sign-in page.</p>` : ""}

          <!-- Steps -->
          <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#cbd5e1;text-transform:uppercase;letter-spacing:0.5px;">Getting Started</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            ${[
              ["1", params.setPasswordUrl ? "Set Your Password" : "Sign In", params.setPasswordUrl ? `Click the button above to choose your password, then sign in with the email address this message was sent to.` : `Visit <a href="${portalUrl}" style="color:#38bdf8;">${portalUrl}</a> and click <strong>Sign In</strong>. Use the email address this message was sent to.`],
              ["2", "Explore Your Dashboard", "View your devices, staging tasks, shipments, and documents - all in one place."],
              ["3", "Message Your Team", "Use the Support Messages section to communicate directly with Layer One staff."],
              ["4", "Track Onboarding Progress", "Your onboarding timeline, go-live date, and warehouse assignment are visible on your profile."],
            ].map(([num, title, desc]) => `
            <tr><td style="padding:10px 0;border-bottom:1px solid #1e3a5f;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:32px;height:32px;background:#0284c7;border-radius:50%;text-align:center;vertical-align:middle;font-size:13px;font-weight:700;color:#fff;">${num}</td>
                <td style="padding-left:14px;vertical-align:top;">
                  <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#e2e8f0;">${title}</p>
                  <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">${desc}</p>
                </td>
              </tr></table>
            </td></tr>`).join("")}
          </table>

          <!-- Support -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a2540;border-radius:8px;border:1px solid #1e3a5f;padding:20px;">
            <tr><td>
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#cbd5e1;text-transform:uppercase;letter-spacing:0.5px;">Need Help?</p>
              <p style="margin:0;font-size:13px;color:#94a3b8;">
                Email us at <a href="mailto:${supportEmail}" style="color:#38bdf8;">${supportEmail}</a> or call <a href="tel:${supportPhone}" style="color:#38bdf8;">${supportPhone}</a>. You can also use the Support Messages feature inside the portal.
              </p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid #1e3a5f;text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">
            © ${new Date().getFullYear()} Layer One Staging<br />
            This email was sent because an admin created a portal account for you.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Sends a portal invite email to a user whose account was pre-provisioned by an admin.
 */
export async function sendPortalInviteEmail(params: PortalInviteEmailParams): Promise<boolean> {
  if (!ENV.resendApiKey || !ENV.resendFromEmail) {
    console.warn("[Email] RESEND_API_KEY or RESEND_FROM_EMAIL not configured - skipping portal invite email");
    return false;
  }

  try {
    const resend = getResend();
    const { error } = await sendHtmlEmail(resend, {
      from: ENV.resendFromEmail,
      cc: INFO_CC,
      to: params.to,
      subject: "Your Layer One Portal Account is Ready",
      html: buildPortalInviteHtml(params),
    });

    if (error) {
      console.warn("[Email] Resend error (portal invite):", error);
      return false;
    }

    console.log(`[Email] Portal invite email sent to ${params.to}`);
    return true;
  } catch (err) {
    console.warn("[Email] Failed to send portal invite email:", err);
    return false;
  }
}

// ─── Password Reset Email ────────────────────────────────────────────────────

export type PasswordResetEmailParams = {
  to: string;
  name: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<boolean> {
  if (!ENV.resendApiKey || !ENV.resendFromEmail) {
    console.warn("[Email] RESEND_API_KEY or RESEND_FROM_EMAIL not configured - skipping password reset email");
    return false;
  }
  const firstName = params.name.split(" ")[0] ?? params.name;
  try {
    const resend = getResend();
    const { error } = await sendHtmlEmail(resend, {
      from: ENV.resendFromEmail,
      cc: INFO_CC,
      to: params.to,
      subject: "Reset your Layer One portal password",
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Reset your password</title></head>
<body style="margin:0;padding:0;background:#07111f;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07111f;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0d1f35;border-radius:12px;border:1px solid #1e3a5f;overflow:hidden;">
        <tr><td style="padding:36px 40px;">
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f1f5f9;">Reset your password</h1>
          <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
            Hi ${firstName}, click the button below to choose a new password for your Layer One portal account. This link expires in 1 hour.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="background:linear-gradient(135deg,#0284c7,#0ea5e9);border-radius:8px;padding:14px 28px;">
              <a href="${params.resetUrl}" style="color:#fff;font-size:15px;font-weight:600;text-decoration:none;display:block;text-align:center;">Set New Password →</a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:13px;color:#64748b;">If you didn't request this, you can safely ignore this email - your password won't change.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    if (error) {
      console.warn("[Email] Resend error (password reset):", error);
      return false;
    }
    console.log(`[Email] Password reset email sent to ${params.to}`);
    return true;
  } catch (err) {
    console.warn("[Email] Failed to send password reset email:", err);
    return false;
  }
}

// ─── Scheduled Call Verification Email ──────────────────────────────────────
// Sent when a visitor books a callback on the website. They must click the
// verification link before Alex is allowed to call them (abuse prevention).

export type CallVerificationEmailParams = {
  to: string;
  name: string;
  verifyUrl: string;
  cancelUrl: string;
  scheduledFor: Date;
};

export async function sendCallVerificationEmail(params: CallVerificationEmailParams): Promise<boolean> {
  if (!ENV.resendApiKey || !ENV.resendFromEmail) {
    console.warn("[Email] RESEND_API_KEY or RESEND_FROM_EMAIL not configured - skipping call verification email");
    return false;
  }
  const firstName = params.name.split(" ")[0] ?? params.name;
  const whenCentral = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(params.scheduledFor);
  try {
    const resend = getResend();
    const { error } = await sendHtmlEmail(resend, {
      from: ENV.resendFromEmail,
      cc: INFO_CC,
      to: params.to,
      subject: "Confirm your Layer One callback",
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Confirm your callback</title></head>
<body style="margin:0;padding:0;background:#0B1320;font-family:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B1320;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:rgba(255,255,255,0.05);border-radius:12px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;">
        <tr><td style="padding:32px 40px 8px;text-align:center;">
          <img src="https://www.layeronestaging.com/images/layerone-logo-on-dark.png" alt="Layer One Staging" width="180" style="width:180px;max-width:60%;height:auto;display:inline-block;" />
        </td></tr>
        <tr><td style="padding:24px 40px 32px;">
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#ffffff;">One quick step, ${firstName}</h1>
          <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">
            You asked Alex from Layer One Staging to call you on <strong style="color:#e2e8f0;">${whenCentral} (Central)</strong>.
            Click below to confirm - we'll only call once you've verified this email.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="background:#0A84FF;border-radius:12px;padding:14px 28px;">
              <a href="${params.verifyUrl}" style="color:#fff;font-size:15px;font-weight:700;text-decoration:none;display:block;text-align:center;">Confirm My Callback →</a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:13px;color:#64748b;">This link expires in 1 hour. If you didn't request a call, just ignore this email - nothing will be scheduled.</p>
          <p style="margin:16px 0 0;font-size:13px;color:#64748b;">Changed your mind? <a href="${params.cancelUrl}" style="color:#94a3b8;text-decoration:underline;">Cancel this callback</a>.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    if (error) {
      console.warn("[Email] Resend error (call verification):", error);
      return false;
    }
    console.log(`[Email] Call verification email sent to ${params.to}`);
    return true;
  } catch (err) {
    console.warn("[Email] Failed to send call verification email:", err);
    return false;
  }
}

// ─── Staging Complete / Ready to Ship Email ───────────────────────────────────

export type StagingCompleteEmailParams = {
  to: string;
  recipientName: string;
  devices: Array<{ deviceCode: string; model?: string | null; serialNumber?: string | null }>;
  staffName: string;
  message?: string | null;
  portalUrl?: string;
};

export async function sendStagingCompleteEmail(params: StagingCompleteEmailParams): Promise<boolean> {
  if (!ENV.resendApiKey || !ENV.resendFromEmail) {
    console.warn("[Email] RESEND_API_KEY or RESEND_FROM_EMAIL not configured - skipping staging complete email");
    return false;
  }

  const firstName = params.recipientName.split(" ")[0] ?? params.recipientName;
  const portalUrl = params.portalUrl ?? ENV.portalUrl ?? "https://www.layeronestaging.com";
  const deviceCount = params.devices.length;
  const deviceWord = deviceCount === 1 ? "device" : "devices";

  const deviceRows = params.devices.map(d => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #1e3a5f;font-size:13px;color:#e2e8f0;font-family:monospace;">${d.deviceCode}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e3a5f;font-size:13px;color:#94a3b8;">${d.model ?? "-"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e3a5f;font-size:13px;color:#64748b;">${d.serialNumber ?? "-"}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your ${deviceCount} ${deviceWord} ${deviceCount === 1 ? "is" : "are"} Ready to Ship</title>
</head>
<body style="margin:0;padding:0;background:#07111f;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07111f;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0d1f35;border-radius:12px;border:1px solid #1e3a5f;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0d1f35 0%,#0a2540 100%);padding:32px 40px;border-bottom:1px solid #1e3a5f;">
          <p style="margin:0;font-size:22px;font-weight:800;color:#38bdf8;letter-spacing:3px;">Layer One</p>
          <p style="margin:4px 0 0;font-size:10px;color:#64748b;letter-spacing:2px;text-transform:uppercase;">Deployment Staging &amp; Warehouse Solutions</p>
        </td></tr>

        <!-- Alert Banner -->
        <tr><td style="background:linear-gradient(135deg,#064e3b,#065f46);padding:20px 40px;border-bottom:1px solid #1e3a5f;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:12px;font-size:28px;">✅</td>
              <td>
                <p style="margin:0;font-size:18px;font-weight:700;color:#6ee7b7;">Staging Complete - Ready to Ship</p>
                <p style="margin:4px 0 0;font-size:13px;color:#a7f3d0;">${deviceCount} ${deviceWord} ${deviceCount === 1 ? "has" : "have"} been staged and ${deviceCount === 1 ? "is" : "are"} ready for outbound shipment.</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 16px;font-size:16px;color:#e2e8f0;">Hi ${firstName},</p>
          <p style="margin:0 0 20px;font-size:14px;color:#94a3b8;line-height:1.6;">
            Great news - your ${deviceWord} ${deviceCount === 1 ? "has" : "have"} completed staging at the Layer One facility and ${deviceCount === 1 ? "is" : "are"} now <strong style="color:#6ee7b7;">ready to ship</strong>. Please log into your portal to set or confirm the forwarding address and request outbound shipment.
          </p>

          ${params.message ? `<div style="background:#07111f;border-left:3px solid #38bdf8;padding:12px 16px;margin:0 0 20px;border-radius:0 6px 6px 0;"><p style="margin:0;font-size:13px;color:#94a3b8;font-style:italic;">"${params.message}"</p><p style="margin:6px 0 0;font-size:12px;color:#475569;">- ${params.staffName}, Layer One</p></div>` : ""}

          <!-- Device Table -->
          <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">Staged ${deviceWord.charAt(0).toUpperCase() + deviceWord.slice(1)}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e3a5f;border-radius:8px;overflow:hidden;margin-bottom:24px;">
            <thead>
              <tr style="background:#07111f;">
                <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Device Code</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Model</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Serial #</th>
              </tr>
            </thead>
            <tbody>${deviceRows}</tbody>
          </table>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 24px;">
              <a href="${portalUrl}/my-devices" style="display:inline-block;background:linear-gradient(135deg,#39a7ff,#6ee7b7);color:#07111f;font-weight:700;font-size:15px;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">View My Devices in Portal</a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">
            If you have any questions or need to update the shipping destination, reply to this email or message us directly from your portal account.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid #1e3a5f;text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">© ${new Date().getFullYear()} Layer One Staging. All rights reserved.</p>
          <p style="margin:4px 0 0;font-size:12px;color:#475569;">Layer One Staging Solutions Portal - Warehouse &amp; Device Staging Management</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const resend = getResend();
    const subject = deviceCount === 1
      ? `Device ${params.devices[0].deviceCode} is Ready to Ship - Layer One`
      : `${deviceCount} Devices Ready to Ship - Layer One`;

    const { error } = await sendHtmlEmail(resend, {
      from: ENV.resendFromEmail,
      cc: INFO_CC,
      to: params.to,
      subject,
      html,
    });

    if (error) {
      console.warn("[Email] Resend error (staging complete):", error);
      return false;
    }

    console.log(`[Email] Staging complete email sent to ${params.to} for ${deviceCount} device(s)`);
    return true;
  } catch (err) {
    console.warn("[Email] Failed to send staging complete email:", err);
    return false;
  }
}

// ─── Introduction Email (Lead Outreach) ──────────────────────────────────────

export type IntroductionEmailParams = {
  to: string;
  subject: string;
  body: string;
  companyName: string;
};

/**
 * Sends a professional introduction email to a prospective lead.
 * The body is AI-drafted and passed in from the router.
 * Returns true on success, false on failure (non-throwing).
 */
export async function sendIntroductionEmail(params: IntroductionEmailParams): Promise<boolean> {
  if (!ENV.resendApiKey || !ENV.resendFromEmail) {
    console.warn("[Email] RESEND_API_KEY or RESEND_FROM_EMAIL not configured - skipping intro email");
    return false;
  }

  // Accept either HTML (from rich text editor) or plain text (auto-convert)
  const isHtml = params.body.trimStart().startsWith("<");
  const bodyHtml = isHtml
    ? params.body
        // Inject email-safe inline styles onto common tags
        .replace(/<p>/g, '<p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#94a3b8;">')
        .replace(/<ul>/g, '<ul style="margin:0 0 12px;padding-left:20px;color:#94a3b8;font-size:15px;">')
        .replace(/<ol>/g, '<ol style="margin:0 0 12px;padding-left:20px;color:#94a3b8;font-size:15px;">')
        .replace(/<li>/g, '<li style="margin-bottom:4px;">')
        .replace(/<strong>/g, '<strong style="color:#ffffff;">')
        .replace(/<a /g, '<a style="color:#39a7ff;" ')
    : params.body
        .split("\n")
        .map((line) => `<p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#94a3b8;">${line || "&nbsp;"}</p>`)
        .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${params.subject}</title>
</head>
<body style="margin:0;padding:0;background:#07111f;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07111f;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0d1f35;border-radius:12px;border:1px solid #1e3a5f;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0d1f35 0%,#0a2540 100%);padding:28px 40px;border-bottom:1px solid #1e3a5f;text-align:center;">
          <span style="font-size:28px;font-weight:800;background:linear-gradient(90deg,#39a7ff,#6ee7b7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:3px;">Layer One</span>
          <p style="margin:4px 0 0;font-size:10px;color:#64748b;letter-spacing:2px;text-transform:uppercase;">DEPLOYMENT STAGING &amp; WAREHOUSE SOLUTIONS</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 40px;">
          ${bodyHtml}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid #1e3a5f;text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">© ${new Date().getFullYear()} Layer One Staging · Dallas-Fort Worth, TX</p>
          <p style="margin:4px 0 0;font-size:12px;color:#475569;">You are receiving this because Layer One identified your business as a potential fit for our services. To opt out, simply reply with "unsubscribe".</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const resend = getResend();
    const { error } = await sendHtmlEmail(resend, {
      from: ENV.resendFromEmail,
      cc: INFO_CC,
      to: params.to,
      subject: params.subject,
      html,
    });

    if (error) {
      console.warn("[Email] Resend error (intro email):", error);
      return false;
    }

    console.log(`[Email] Introduction email sent to ${params.to} for ${params.companyName}`);
    return true;
  } catch (err) {
    console.warn("[Email] Failed to send introduction email:", err);
    return false;
  }
}

// ─── Drip Sequence Email ──────────────────────────────────────────────────────
export type DripEmailParams = {
  to: string;
  toName: string;
  subject: string;
  htmlBody: string;
  companyName: string;
};

/**
 * Sends a drip sequence step email via Resend.
 * Called by the scheduled drip auto-send heartbeat handler.
 */
export async function sendDripEmail(params: DripEmailParams): Promise<boolean> {
  if (!ENV.resendApiKey || !ENV.resendFromEmail) {
    console.warn("[Email] RESEND_API_KEY or RESEND_FROM_EMAIL not configured - skipping drip email");
    return false;
  }

  const isHtml = params.htmlBody.trimStart().startsWith("<");
  const bodyHtml = isHtml
    ? params.htmlBody
    : params.htmlBody
        .split("\n")
        .map((line) => `<p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#94a3b8;">${line || "&nbsp;"}</p>`)
        .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${params.subject}</title>
</head>
<body style="margin:0;padding:0;background:#07111f;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07111f;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0d1f35;border-radius:12px;border:1px solid #1e3a5f;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#0d1f35 0%,#0a2540 100%);padding:28px 40px;border-bottom:1px solid #1e3a5f;text-align:center;">
          <span style="font-size:28px;font-weight:800;background:linear-gradient(90deg,#39a7ff,#6ee7b7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:3px;">Layer One</span>
          <p style="margin:4px 0 0;font-size:10px;color:#64748b;letter-spacing:2px;text-transform:uppercase;">DEPLOYMENT STAGING &amp; WAREHOUSE SOLUTIONS</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #1e3a5f;text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">© ${new Date().getFullYear()} Layer One Staging · Dallas-Fort Worth, TX</p>
          <p style="margin:4px 0 0;font-size:12px;color:#475569;">You are receiving this as part of an outreach sequence. Reply "unsubscribe" to opt out.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const resend = getResend();
    const { error } = await sendHtmlEmail(resend, {
      from: ENV.resendFromEmail,
      cc: INFO_CC,
      to: params.to,
      subject: params.subject,
      html,
    });

    if (error) {
      console.warn("[Email] Resend error (drip email):", error);
      return false;
    }

    console.log(`[Email] Drip email sent to ${params.to} (${params.companyName})`);
    return true;
  } catch (err) {
    console.warn("[Email] Failed to send drip email:", err);
    return false;
  }
}

// ─── Customer Delivery Notification ──────────────────────────────────────────
export type DeliveryNotificationParams = {
  to: string;
  clientName: string;
  boxCount: number;
  palletCount: number;
  carrier?: string;
  trackingNumber?: string;
  storageLocation?: string;
  notes?: string;
  receivedAt: Date;
};

export async function sendDeliveryNotificationEmail(params: DeliveryNotificationParams): Promise<boolean> {
  if (!ENV.resendApiKey || !ENV.resendFromEmail) return false;

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>Delivery Received</title></head>
<body style="margin:0;padding:0;background:#07111f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07111f;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0d1f35;border-radius:12px;border:1px solid #1e3a5f;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#0d1f35,#0a2540);padding:28px 40px;border-bottom:1px solid #1e3a5f;text-align:center;">
          <span style="font-size:28px;font-weight:800;background:linear-gradient(90deg,#39a7ff,#6ee7b7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:3px;">Layer One</span>
          <p style="margin:4px 0 0;font-size:10px;color:#64748b;letter-spacing:2px;text-transform:uppercase;">DEPLOYMENT STAGING &amp; WAREHOUSE SOLUTIONS</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <h2 style="margin:0 0 8px;font-size:20px;color:#ffffff;">Delivery Received ✓</h2>
          <p style="margin:0 0 20px;font-size:15px;color:#94a3b8;">Hi ${params.clientName}, we've received a delivery on your behalf at our DFW facility.</p>
          <table width="100%" cellpadding="8" cellspacing="0" style="background:#0a1929;border-radius:8px;border:1px solid #1e3a5f;margin-bottom:20px;">
            <tr><td style="font-size:13px;color:#64748b;width:40%;">Received At</td><td style="font-size:14px;color:#e2e8f0;">${params.receivedAt.toLocaleString("en-US", { timeZone: "America/Chicago" })} CST</td></tr>
            <tr><td style="font-size:13px;color:#64748b;">Boxes</td><td style="font-size:14px;color:#e2e8f0;">${params.boxCount}</td></tr>
            <tr><td style="font-size:13px;color:#64748b;">Pallets</td><td style="font-size:14px;color:#e2e8f0;">${params.palletCount}</td></tr>
            ${params.carrier ? `<tr><td style="font-size:13px;color:#64748b;">Carrier</td><td style="font-size:14px;color:#e2e8f0;">${params.carrier}</td></tr>` : ""}
            ${params.trackingNumber ? `<tr><td style="font-size:13px;color:#64748b;">Tracking #</td><td style="font-size:14px;color:#e2e8f0;">${params.trackingNumber}</td></tr>` : ""}
            ${params.storageLocation ? `<tr><td style="font-size:13px;color:#64748b;">Storage Location</td><td style="font-size:14px;color:#e2e8f0;">${params.storageLocation}</td></tr>` : ""}
          </table>
          ${params.notes ? `<p style="font-size:14px;color:#94a3b8;background:#0a1929;padding:12px 16px;border-radius:6px;border-left:3px solid #39a7ff;"><strong style="color:#ffffff;">Notes:</strong> ${params.notes}</p>` : ""}
          <p style="font-size:14px;color:#94a3b8;">Your items are now securely stored at our facility. Log in to your portal to view inventory details and track staging progress.</p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #1e3a5f;text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">© ${new Date().getFullYear()} Layer One · Dallas-Fort Worth, TX · <a href="mailto:info@layeronestaging.com" style="color:#39a7ff;">info@layeronestaging.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    const resend = getResend();
    const { error } = await sendHtmlEmail(resend, {
      from: ENV.resendFromEmail,
      cc: INFO_CC,
      to: params.to,
      subject: `Delivery received at Layer One - ${params.boxCount} box${params.boxCount !== 1 ? "es" : ""}, ${params.palletCount} pallet${params.palletCount !== 1 ? "s" : ""}`,
      html,
    });
    if (error) { console.warn("[Email] Delivery notification error:", error); return false; }
    console.log(`[Email] Delivery notification sent to ${params.to}`);
    return true;
  } catch (err) {
    console.warn("[Email] Failed to send delivery notification:", err);
    return false;
  }
}

// ─── Shipment Request Approval Email (to staff) ───────────────────────────────
export type ShipmentApprovalRequestParams = {
  staffEmail: string;
  clientName: string;
  shipmentId: number;
  destination: string;
  itemCount: number;
  requestedBy: string;
  portalUrl: string;
};

export async function sendShipmentApprovalRequestEmail(params: ShipmentApprovalRequestParams): Promise<boolean> {
  if (!ENV.resendApiKey || !ENV.resendFromEmail) return false;

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>Shipment Approval Required</title></head>
<body style="margin:0;padding:0;background:#07111f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07111f;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0d1f35;border-radius:12px;border:1px solid #1e3a5f;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#0d1f35,#0a2540);padding:28px 40px;border-bottom:1px solid #1e3a5f;text-align:center;">
          <span style="font-size:28px;font-weight:800;background:linear-gradient(90deg,#39a7ff,#6ee7b7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:3px;">Layer One</span>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <h2 style="margin:0 0 8px;font-size:20px;color:#ffffff;">Shipment Approval Required</h2>
          <p style="font-size:15px;color:#94a3b8;"><strong style="color:#ffffff;">${params.clientName}</strong> has submitted an outbound shipment request that requires your approval.</p>
          <table width="100%" cellpadding="8" cellspacing="0" style="background:#0a1929;border-radius:8px;border:1px solid #1e3a5f;margin-bottom:20px;">
            <tr><td style="font-size:13px;color:#64748b;width:40%;">Shipment ID</td><td style="font-size:14px;color:#e2e8f0;">#${params.shipmentId}</td></tr>
            <tr><td style="font-size:13px;color:#64748b;">Destination</td><td style="font-size:14px;color:#e2e8f0;">${params.destination}</td></tr>
            <tr><td style="font-size:13px;color:#64748b;">Items</td><td style="font-size:14px;color:#e2e8f0;">${params.itemCount}</td></tr>
            <tr><td style="font-size:13px;color:#64748b;">Requested By</td><td style="font-size:14px;color:#e2e8f0;">${params.requestedBy}</td></tr>
          </table>
          <p style="text-align:center;"><a href="${params.portalUrl}/shipments/${params.shipmentId}" style="display:inline-block;background:#39a7ff;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">Review &amp; Approve</a></p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #1e3a5f;text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">© ${new Date().getFullYear()} Layer One · Dallas-Fort Worth, TX</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    const resend = getResend();
    const { error } = await sendHtmlEmail(resend, {
      from: ENV.resendFromEmail,
      cc: INFO_CC,
      to: params.staffEmail,
      subject: `[Action Required] Shipment request from ${params.clientName} - #${params.shipmentId}`,
      html,
    });
    if (error) { console.warn("[Email] Shipment approval email error:", error); return false; }
    console.log(`[Email] Shipment approval request sent to ${params.staffEmail}`);
    return true;
  } catch (err) {
    console.warn("[Email] Failed to send shipment approval email:", err);
    return false;
  }
}

// ─── Support Ticket Notification ─────────────────────────────────────────────
export type SupportTicketEmailParams = {
  ticketSubject: string;
  category: string;
  priority: string;
  description: string;
  submittedBy: string;
  clientId: number;
};

export async function sendSupportTicketEmail(params: SupportTicketEmailParams): Promise<boolean> {
  if (!ENV.resendApiKey || !ENV.resendFromEmail) return false;
  const { ticketSubject, category, priority, description, submittedBy, clientId } = params;
  const priorityColors: Record<string, string> = {
    urgent: "#ef4444", high: "#f97316", normal: "#3b82f6", low: "#6b7280",
  };
  const color = priorityColors[priority] ?? "#3b82f6";
  const html = `<!DOCTYPE html><html><body style="margin:0;background:#07111f;font-family:Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0d1f35;border-radius:12px;border:1px solid #1e3a5f;overflow:hidden;">
        <tr><td style="padding:24px 32px;border-bottom:1px solid #1e3a5f;">
          <h2 style="margin:0;color:#fff;font-size:18px;">New Support Ticket</h2>
          <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Layer One Staging Solutions Portal - Client #${clientId}</p>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            <tr><td style="padding:8px 0;color:#94a3b8;width:120px;">Subject</td><td style="padding:8px 0;font-weight:600;">${ticketSubject}</td></tr>
            <tr><td style="padding:8px 0;color:#94a3b8;">Category</td><td style="padding:8px 0;text-transform:capitalize;">${category}</td></tr>
            <tr><td style="padding:8px 0;color:#94a3b8;">Priority</td><td style="padding:8px 0;"><span style="background:${color}33;color:${color};padding:2px 8px;border-radius:4px;font-size:12px;text-transform:uppercase;font-weight:600;">${priority}</span></td></tr>
            <tr><td style="padding:8px 0;color:#94a3b8;">Submitted by</td><td style="padding:8px 0;">${submittedBy}</td></tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#0a1628;border-radius:6px;border-left:3px solid ${color};">
            <p style="margin:0;font-size:13px;color:#cbd5e1;white-space:pre-wrap;">${description}</p>
          </div>
          <p style="margin-top:20px;font-size:12px;color:#64748b;">Log in to the Layer One Staging Solutions Portal to respond to this ticket.</p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #1e3a5f;text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">© ${new Date().getFullYear()} Layer One · Dallas-Fort Worth, TX</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  try {
    const resend = getResend();
    const { error } = await sendHtmlEmail(resend, {
      from: ENV.resendFromEmail,
      cc: INFO_CC,
      to: ENV.resendFromEmail, // notify the Layer One ops inbox
      subject: `[${priority.toUpperCase()}] Support Ticket: ${ticketSubject}`,
      html,
    });
    if (error) { console.warn("[Email] Support ticket email error:", error); return false; }
    return true;
  } catch (err) {
    console.warn("[Email] Failed to send support ticket email:", err);
    return false;
  }
}

// ─── Quote Email (send quote + payment link to prospect) ─────────────────────
export type QuoteEmailParams = {
  to: string;
  name: string;
  company: string;
  lineItems: Array<{ label: string; qty: number; unitPrice: number; total: number }>;
  subtotal: number;
  tax: number;
  totalAmount: number;
  notes?: string;
  paymentLinkUrl?: string;
};

export async function sendQuoteEmail(params: QuoteEmailParams): Promise<boolean> {
  if (!ENV.resendApiKey || !ENV.resendFromEmail) {
    console.warn("[Email] RESEND_API_KEY or RESEND_FROM_EMAIL not configured - skipping quote email");
    return false;
  }

  const firstName = params.name.split(" ")[0] ?? params.name;
  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const lineItemRows = params.lineItems.map(li => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #1e3a5f;font-size:13px;color:#e2e8f0;">${li.label}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #1e3a5f;font-size:13px;color:#94a3b8;text-align:center;">${li.qty}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #1e3a5f;font-size:13px;color:#94a3b8;text-align:right;">${fmt(li.unitPrice)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #1e3a5f;font-size:13px;color:#6ee7b7;text-align:right;font-weight:600;">${fmt(li.total)}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Layer One Quote</title>
</head>
<body style="margin:0;padding:0;background:#07111f;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07111f;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0d1f35;border-radius:12px;border:1px solid #1e3a5f;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0d1f35 0%,#07111f 100%);padding:32px 40px;border-bottom:1px solid #1e3a5f;text-align:center;">
          <span style="font-size:28px;font-weight:800;background:linear-gradient(90deg,#39a7ff,#6ee7b7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:3px;">Layer One</span>
          <p style="margin:4px 0 0;font-size:10px;color:#64748b;letter-spacing:2px;text-transform:uppercase;">DEPLOYMENT STAGING &amp; WAREHOUSE SOLUTIONS</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">Your Custom Quote is Ready</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">
            Hi ${firstName}, our team has prepared a custom quote for <strong style="color:#ffffff;">${params.company}</strong> based on your requirements. Please review the details below.
          </p>

          <!-- Line Items Table -->
          <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">Quote Summary</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e3a5f;border-radius:8px;overflow:hidden;margin-bottom:16px;">
            <thead>
              <tr style="background:#07111f;">
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Service / Item</th>
                <th style="padding:10px 12px;text-align:center;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Qty</th>
                <th style="padding:10px 12px;text-align:right;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Unit Price</th>
                <th style="padding:10px 12px;text-align:right;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Total</th>
              </tr>
            </thead>
            <tbody>${lineItemRows}</tbody>
          </table>

          <!-- Totals -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="font-size:13px;color:#64748b;padding:4px 0;">Subtotal</td>
              <td style="font-size:13px;color:#94a3b8;text-align:right;padding:4px 0;">${fmt(params.subtotal)}</td>
            </tr>
            ${params.tax > 0 ? `<tr>
              <td style="font-size:13px;color:#64748b;padding:4px 0;">Tax</td>
              <td style="font-size:13px;color:#94a3b8;text-align:right;padding:4px 0;">${fmt(params.tax)}</td>
            </tr>` : ""}
            <tr>
              <td style="font-size:16px;font-weight:700;color:#ffffff;padding:10px 0 4px;border-top:1px solid #1e3a5f;">Total Due</td>
              <td style="font-size:18px;font-weight:800;color:#6ee7b7;text-align:right;padding:10px 0 4px;border-top:1px solid #1e3a5f;">${fmt(params.totalAmount)}</td>
            </tr>
          </table>

          ${params.notes ? `<div style="background:#07111f;border-left:3px solid #39a7ff;padding:12px 16px;margin:0 0 24px;border-radius:0 6px 6px 0;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#39a7ff;text-transform:uppercase;letter-spacing:1px;">Notes from our team</p>
            <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">${params.notes}</p>
          </div>` : ""}

          ${params.paymentLinkUrl ? `
          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td align="center">
              <a href="${params.paymentLinkUrl}" style="display:inline-block;background:linear-gradient(135deg,#39a7ff,#6ee7b7);color:#07111f;font-weight:700;font-size:16px;padding:16px 40px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">Pay Now - ${fmt(params.totalAmount)}</a>
            </td></tr>
          </table>
          <p style="margin:0 0 24px;font-size:13px;color:#64748b;text-align:center;">Secure payment powered by Stripe. Your account will be activated immediately after payment.</p>
          ` : `
          <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;background:#07111f;padding:16px;border-radius:8px;border:1px solid #1e3a5f;">
            To proceed with payment, please reply to this email or contact your Layer One representative. We'll send you a secure payment link.
          </p>
          `}

          <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">
            This quote is valid for 30 days. If you have any questions, reply to this email or contact us directly.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid #1e3a5f;text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">© ${new Date().getFullYear()} Layer One Staging · Dallas-Fort Worth, TX</p>
          <p style="margin:4px 0 0;font-size:12px;color:#475569;">Layer One Staging Solutions Portal - Warehouse &amp; Device Staging Management</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const resend = getResend();
    const { error } = await sendHtmlEmail(resend, {
      from: ENV.resendFromEmail,
      cc: INFO_CC,
      to: params.to,
      subject: `Your Layer One Quote - ${fmt(params.totalAmount)} (${params.company})`,
      html,
    });
    if (error) { console.warn("[Email] Quote email error:", error); return false; }
    console.log(`[Email] Quote email sent to ${params.to} for ${params.company}`);
    return true;
  } catch (err) {
    console.warn("[Email] Failed to send quote email:", err);
    return false;
  }
}

// ─── Shipment Tracking Notification ──────────────────────────────────────────
export type TrackingNotificationParams = {
  to: string;
  clientName: string;
  shipmentCode: string;
  destination: string;
  carrier: string;
  trackingNumber: string;
  portalUrl: string;
};

export async function sendTrackingNotificationEmail(params: TrackingNotificationParams): Promise<boolean> {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#07111f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07111f;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0d1f35;border-radius:12px;border:1px solid #1e3a5f;overflow:hidden;max-width:600px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#0f3460 0%,#1a5276 100%);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">📦 Your Shipment Is On Its Way</h1>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Layer One Staging Solutions</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 16px;color:#cbd5e1;font-size:15px;">Hi ${params.clientName},</p>
          <p style="margin:0 0 24px;color:#cbd5e1;font-size:15px;">
            Your shipment <strong style="color:#e2e8f0;">${params.shipmentCode}</strong> has been dispatched and is now in transit to <strong style="color:#e2e8f0;">${params.destination}</strong>.
          </p>
          <div style="background:#07111f;border:1px solid #1e3a5f;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;color:#64748b;font-size:13px;width:120px;">Carrier</td>
                <td style="padding:6px 0;color:#e2e8f0;font-size:13px;font-weight:600;">${params.carrier}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#64748b;font-size:13px;">Tracking #</td>
                <td style="padding:6px 0;color:#38bdf8;font-size:13px;font-weight:600;">${params.trackingNumber}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#64748b;font-size:13px;">Destination</td>
                <td style="padding:6px 0;color:#e2e8f0;font-size:13px;">${params.destination}</td>
              </tr>
            </table>
          </div>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${params.portalUrl}/shipments" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
              View Shipment Details →
            </a>
          </div>
          <p style="margin:0;color:#64748b;font-size:13px;text-align:center;">
            Track your shipment status in real time from your customer portal.
          </p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #1e3a5f;text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">© ${new Date().getFullYear()} Layer One Staging · Dallas-Fort Worth, TX</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const resend = getResend();
    const { error } = await sendHtmlEmail(resend, {
      from: ENV.resendFromEmail,
      cc: INFO_CC,
      to: params.to,
      subject: `Shipment ${params.shipmentCode} Dispatched - ${params.carrier} ${params.trackingNumber}`,
      html,
    });
    if (error) { console.warn("[Email] Tracking notification error:", error); return false; }
    console.log(`[Email] Tracking notification sent to ${params.to} for ${params.shipmentCode}`);
    return true;
  } catch (err) {
    console.warn("[Email] Failed to send tracking notification:", err);
    return false;
  }
}

// ─── Voice Change Notification Email ─────────────────────────────────────────
// Out-of-band confirmation whenever Alex applies a Tier 1 change or stages a
// Tier 2 change during a phone call. Tells the account holder what happened
// and invites them to report it if it wasn't them. Never includes the PIN.
export type VoiceChangeEmailParams = {
  to: string;
  name: string;
  changeDescription: string; // e.g. 'Updated delivery notes to "call upon arrival"'
  staged: boolean; // true = sent to Branden for review, not applied yet
};

export async function sendVoiceChangeEmail(params: VoiceChangeEmailParams): Promise<boolean> {
  if (!ENV.resendApiKey || !ENV.resendFromEmail) {
    console.warn("[Email] RESEND_API_KEY or RESEND_FROM_EMAIL not configured - skipping voice change email");
    return false;
  }
  if (!params.to) return false;
  const firstName = params.name.split(" ")[0] ?? params.name;
  const subject = params.staged
    ? "Change request received by phone - Layer One"
    : "Account change made by phone - Layer One";
  const headline = params.staged ? "Change request received" : "Account change made";
  const bodyCopy = params.staged
    ? `During a phone call with Alex, a change was requested on your Layer One account. It has been sent to our team for review and has <strong>not</strong> been applied yet:`
    : `During a phone call with Alex, the following change was made on your Layer One account:`;
  try {
    const resend = getResend();
    const { error } = await sendHtmlEmail(resend, {
      from: ENV.resendFromEmail,
      cc: INFO_CC,
      to: params.to,
      subject,
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${headline}</title></head>
<body style="margin:0;padding:0;background:#07111f;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07111f;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0d1f35;border-radius:12px;border:1px solid #1e3a5f;overflow:hidden;">
        <tr><td style="padding:36px 40px;">
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f1f5f9;">${headline}</h1>
          <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">
            Hi ${firstName}, ${bodyCopy}
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#07111f;border:1px solid #1e3a5f;border-radius:8px;">
            <tr><td style="padding:16px 20px;font-size:15px;color:#e2e8f0;">${params.changeDescription}</td></tr>
          </table>
          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
            If this was you, no action is needed. If you did not make this request, please let us know right away by replying to this email or calling (469) 537-4378.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    if (error) {
      console.warn("[Email] Resend error (voice change):", error);
      return false;
    }
    console.log(`[Email] Voice change notification sent to ${params.to}`);
    return true;
  } catch (err) {
    console.warn("[Email] Failed to send voice change email:", err);
    return false;
  }
}
