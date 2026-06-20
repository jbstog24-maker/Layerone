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
