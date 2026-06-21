import { Resend } from "resend";
import { ENV } from "./_core/env";

// NSDS brand SVG — kept in sync with Documents.tsx
const NSDS_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 120" width="200" height="43">
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
  <text x="115" y="52" font-family="Inter,Arial,sans-serif" font-size="38" font-weight="700" fill="url(#textGrad)" letter-spacing="2">NSDS</text>
  <text x="116" y="75" font-family="Inter,Arial,sans-serif" font-size="11" font-weight="400" fill="#94a3b8" letter-spacing="1.5">NETWORK STAGING &amp; DEPLOYMENT SOLUTIONS</text>
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
  basic:        { label: "Basic",        price: "$499 one-time",    description: "Up to 50 devices, standard staging, 30-day storage" },
  standard:     { label: "Standard",     price: "$750/month",       description: "Up to 150 devices, priority staging, 60-day storage" },
  professional: { label: "Professional", price: "$1,500/month",     description: "Up to 500 devices, dedicated tech, 90-day storage" },
  enterprise:   { label: "Enterprise",   price: "$3,500/month",     description: "Unlimited devices, 24/7 support, custom SLA" },
  custom:       { label: "Custom",       price: "Contact us",       description: "Tailored solution for your unique requirements" },
};

function buildWelcomeHtml(params: WelcomeEmailParams): string {
  const tier = TIER_DETAILS[params.tier] ?? TIER_DETAILS.custom;
  const firstName = params.name.split(" ")[0] ?? params.name;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to NSDS — Next Steps</title>
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
        ${NSDS_LOGO_SVG}
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
              <p class="step-desc">Once the MSA is signed, you'll receive a secure payment link. After payment is confirmed, your StagingOps Portal account is activated immediately.</p>
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
              <p class="step-title">Go Live — 14-Day Onboarding Period</p>
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
          <a href="${ENV.portalUrl}" class="btn">Access the StagingOps Portal</a>
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
          This email was sent because you submitted a package inquiry on the NSDS StagingOps Portal. If you did not submit this inquiry, please disregard this email.
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>© ${new Date().getFullYear()} Network Staging &amp; Deployment Solutions (NSDS). All rights reserved.</p>
        <p style="margin-top:4px;">StagingOps Portal — Warehouse &amp; Device Staging Management</p>
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
    console.warn("[Email] RESEND_API_KEY or RESEND_FROM_EMAIL not configured — skipping welcome email");
    return false;
  }

  try {
    const resend = getResend();
    const tierLabel = TIER_DETAILS[params.tier]?.label ?? params.tier;

    const { error } = await resend.emails.send({
      from: ENV.resendFromEmail,
      to: params.to,
      subject: `Welcome to NSDS — Your ${tierLabel} Package Inquiry`,
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

// ─── Portal Invite Email (admin-provisioned users) ────────────────────────────

export type PortalInviteEmailParams = {
  to: string;
  name: string;
  businessName?: string | null;
  role: string;
  portalUrl?: string;
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  staff: "Staff",
  customer_admin: "Customer Admin",
  customer_viewer: "Customer Viewer",
};

function buildPortalInviteHtml(params: PortalInviteEmailParams): string {
  const firstName = params.name.split(" ")[0] ?? params.name;
  const portalUrl = params.portalUrl ?? ENV.portalUrl ?? "https://stagingops.manus.space";
  const roleLabel = ROLE_LABELS[params.role] ?? params.role;
  const supportEmail = ENV.supportEmail ?? "support@nsds.com";
  const supportPhone = ENV.supportPhone ?? "(800) 000-0000";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your NSDS Portal Account is Ready</title>
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
                  <span style="font-size:22px;font-weight:800;color:#38bdf8;letter-spacing:-0.5px;">NSDS</span>
                  <span style="color:#334155;font-size:18px;">|</span>
                  <span style="font-size:13px;color:#64748b;letter-spacing:1px;text-transform:uppercase;">Network Staging & Deployment Solutions</span>
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
            An NSDS admin has created a portal account for you${params.businessName ? ` on behalf of <strong style="color:#e2e8f0;">${params.businessName}</strong>` : ""}. Your role is <strong style="color:#38bdf8;">${roleLabel}</strong>.
          </p>

          <!-- Access CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr><td style="background:linear-gradient(135deg,#0284c7,#0ea5e9);border-radius:8px;padding:14px 28px;">
              <a href="${portalUrl}" style="color:#fff;font-size:15px;font-weight:600;text-decoration:none;display:block;text-align:center;">
                Access Your Portal →
              </a>
            </td></tr>
          </table>

          <!-- Steps -->
          <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#cbd5e1;text-transform:uppercase;letter-spacing:0.5px;">Getting Started</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            ${[
              ["1", "Sign In", `Visit <a href="${portalUrl}" style="color:#38bdf8;">${portalUrl}</a> and click <strong>Sign In</strong>. Use the email address this message was sent to.`],
              ["2", "Explore Your Dashboard", "View your devices, staging tasks, shipments, and documents — all in one place."],
              ["3", "Message Your Team", "Use the Support Messages section to communicate directly with NSDS staff."],
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
            © ${new Date().getFullYear()} NSDS — Network Staging &amp; Deployment Solutions<br />
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
    console.warn("[Email] RESEND_API_KEY or RESEND_FROM_EMAIL not configured — skipping portal invite email");
    return false;
  }

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: ENV.resendFromEmail,
      to: params.to,
      subject: "Your NSDS Portal Account is Ready",
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
    console.warn("[Email] RESEND_API_KEY or RESEND_FROM_EMAIL not configured — skipping staging complete email");
    return false;
  }

  const firstName = params.recipientName.split(" ")[0] ?? params.recipientName;
  const portalUrl = params.portalUrl ?? ENV.portalUrl ?? "https://stagingops-khmxpmyr.manus.space";
  const deviceCount = params.devices.length;
  const deviceWord = deviceCount === 1 ? "device" : "devices";

  const deviceRows = params.devices.map(d => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #1e3a5f;font-size:13px;color:#e2e8f0;font-family:monospace;">${d.deviceCode}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e3a5f;font-size:13px;color:#94a3b8;">${d.model ?? "—"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e3a5f;font-size:13px;color:#64748b;">${d.serialNumber ?? "—"}</td>
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
          <p style="margin:0;font-size:22px;font-weight:800;color:#38bdf8;letter-spacing:3px;">NSDS</p>
          <p style="margin:4px 0 0;font-size:10px;color:#64748b;letter-spacing:2px;text-transform:uppercase;">Network Staging &amp; Deployment Solutions</p>
        </td></tr>

        <!-- Alert Banner -->
        <tr><td style="background:linear-gradient(135deg,#064e3b,#065f46);padding:20px 40px;border-bottom:1px solid #1e3a5f;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:12px;font-size:28px;">✅</td>
              <td>
                <p style="margin:0;font-size:18px;font-weight:700;color:#6ee7b7;">Staging Complete — Ready to Ship</p>
                <p style="margin:4px 0 0;font-size:13px;color:#a7f3d0;">${deviceCount} ${deviceWord} ${deviceCount === 1 ? "has" : "have"} been staged and ${deviceCount === 1 ? "is" : "are"} ready for outbound shipment.</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 16px;font-size:16px;color:#e2e8f0;">Hi ${firstName},</p>
          <p style="margin:0 0 20px;font-size:14px;color:#94a3b8;line-height:1.6;">
            Great news — your ${deviceWord} ${deviceCount === 1 ? "has" : "have"} completed staging at the NSDS facility and ${deviceCount === 1 ? "is" : "are"} now <strong style="color:#6ee7b7;">ready to ship</strong>. Please log into your portal to set or confirm the forwarding address and request outbound shipment.
          </p>

          ${params.message ? `<div style="background:#07111f;border-left:3px solid #38bdf8;padding:12px 16px;margin:0 0 20px;border-radius:0 6px 6px 0;"><p style="margin:0;font-size:13px;color:#94a3b8;font-style:italic;">"${params.message}"</p><p style="margin:6px 0 0;font-size:12px;color:#475569;">— ${params.staffName}, NSDS</p></div>` : ""}

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
          <p style="margin:0;font-size:12px;color:#475569;">© ${new Date().getFullYear()} Network Staging &amp; Deployment Solutions (NSDS). All rights reserved.</p>
          <p style="margin:4px 0 0;font-size:12px;color:#475569;">StagingOps Portal — Warehouse &amp; Device Staging Management</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const resend = getResend();
    const subject = deviceCount === 1
      ? `Device ${params.devices[0].deviceCode} is Ready to Ship — NSDS`
      : `${deviceCount} Devices Ready to Ship — NSDS`;

    const { error } = await resend.emails.send({
      from: ENV.resendFromEmail,
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
