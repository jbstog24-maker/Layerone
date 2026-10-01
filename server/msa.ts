import { randomBytes } from "crypto";

// ─── Master Services Agreement builder ───────────────────────────────────────
// Pure module (no DB/env imports) so it can be unit-tested in isolation.
// The returned HTML is stored as the immutable snapshot on msa_documents and
// rendered on the customer signing page at /sign/<token>.

export type MsaInquiryData = {
  company: string;
  contactName: string;
  email?: string | null;
};

export type MsaQuoteData = {
  tierName: string;
  /** Formatted amount, e.g. "$1,500.00" */
  amount: string;
};

function esc(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 64-char hex signing token (matches msa_documents.token varchar(64)). */
export function generateMsaToken(): string {
  return randomBytes(32).toString("hex");
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Builds the full Master Services Agreement HTML for Layer One Staging with
 * {{company}}, {{contactName}}, {{date}}, {{tierName}} and {{amount}} merged in.
 */
export function buildMsaHtml(inquiry: MsaInquiryData, quote: MsaQuoteData): string {
  const template = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Master Services Agreement — Layer One Staging</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; line-height: 1.55; margin: 0; padding: 48px; background: #ffffff; }
  .page { max-width: 760px; margin: 0 auto; }
  h1 { font-size: 22px; text-align: center; margin: 0 0 4px; letter-spacing: 1px; }
  .subtitle { text-align: center; color: #555; font-size: 13px; margin-bottom: 28px; }
  h2 { font-size: 14px; margin: 22px 0 6px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  p, li { font-size: 13.5px; }
  ul { margin: 6px 0 6px 20px; padding: 0; }
  .parties { background: #f7f7f7; border: 1px solid #e2e2e2; border-radius: 6px; padding: 14px 18px; margin: 18px 0; font-size: 13.5px; }
  .sig { display: flex; gap: 32px; margin-top: 18px; }
  .sig div { flex: 1; }
  .sig .line { border-top: 1px solid #333; margin-top: 44px; padding-top: 4px; font-size: 12px; color: #555; }
  .footer { margin-top: 28px; font-size: 11.5px; color: #777; text-align: center; }
</style>
</head>
<body>
<div class="page">
  <h1>MASTER SERVICES AGREEMENT</h1>
  <p class="subtitle">Layer One Staging — IT Equipment Staging &amp; Deployment Services</p>

  <div class="parties">
    <strong>Provider:</strong> Layer One Staging ("Provider")<br />
    <strong>Customer:</strong> {{company}} ("Customer")<br />
    <strong>Customer Contact:</strong> {{contactName}}<br />
    <strong>Effective Date:</strong> {{date}}<br />
    <strong>Service Package:</strong> {{tierName}} &nbsp;|&nbsp; <strong>Agreement Value:</strong> {{amount}}
  </div>

  <h2>1. Services</h2>
  <p>Provider will perform IT equipment staging and deployment-logistics services as described in the accepted proposal, which may include: inbound freight/parcel receiving, inventory and asset capture, secure short-term storage, unboxing, kitting and site-kit assembly, staging and configuration support, quality/photo documentation, and outbound carrier handoff. Specific quantities, service levels, and add-ons are defined in the proposal and any approved change orders.</p>

  <h2>2. Term</h2>
  <p>This Agreement begins on the Effective Date and continues for the term stated in the proposal (or month-to-month if none is stated) until terminated as provided below.</p>

  <h2>3. Fees &amp; Payment</h2>
  <ul>
    <li>Customer agrees to pay the fees in the accepted proposal (Agreement Value above), plus any approved overages, add-ons, or extended storage at Provider's then-current rates.</li>
    <li><strong>Storage</strong> is billed monthly in advance. <strong>Project, kitting, and staging labor</strong> are due as stated in the proposal &mdash; typically a 50% deposit at signing to reserve capacity, with the balance due before equipment ships or is released. First-time engagements may require full payment before work begins.</li>
    <li>No equipment will be shipped or released until the applicable payment has cleared.</li>
    <li>Invoices for overages, add-ons, or extended storage are due <strong>Net 15</strong>. A late charge of 1.5% per month (or the maximum allowed by law) may apply to overdue balances.</li>
    <li>Carrier freight/shipping charges are the Customer's responsibility unless explicitly included in the proposal.</li>
  </ul>

  <h2>4. Customer Responsibilities</h2>
  <ul>
    <li>Provide accurate shipment notifications, device/box counts, and delivery instructions.</li>
    <li>Designate an authorized contact for approvals and communications.</li>
    <li>Ensure equipment is free of liens, hazardous materials, and data subject to special handling requirements unless disclosed in writing and accepted by Provider.</li>
    <li>Respond to approval requests (e.g., overages, shipment releases) within two (2) business days.</li>
  </ul>

  <h2>5. Limitation of Liability</h2>
  <p>Provider's total liability under this Agreement is capped at the fees paid by Customer in the three (3) months preceding the claim. In no event is Provider liable for indirect, incidental, special, or consequential damages. Customer is responsible for insuring its equipment while in Provider's care; Provider maintains commercially reasonable facility security but is not an insurer of Customer property.</p>

  <h2>6. Confidentiality</h2>
  <p>Each party will keep the other's non-public business and technical information confidential and use it only to perform under this Agreement, for two (2) years after disclosure. This does not apply to information that is public, independently developed, or required to be disclosed by law.</p>

  <h2>7. Termination</h2>
  <p>Either party may terminate with thirty (30) days' written notice. Fees for services performed through termination are due in full. Customer must collect or arrange shipment of its equipment within fifteen (15) days after termination; unclaimed equipment thereafter accrues storage fees at Provider's standard rates.</p>

  <h2>8. Governing Law</h2>
  <p>This Agreement is governed by the laws of the State of Texas, without regard to conflict-of-law rules. Any dispute will be resolved in the state or federal courts located in Texas.</p>

  <h2>9. Entire Agreement</h2>
  <p>This Agreement, together with the accepted proposal and any signed change orders, is the entire agreement between the parties regarding the services and supersedes all prior discussions. Amendments must be in writing and signed by both parties.</p>

  <h2>Signatures</h2>
  <p>By signing below (electronic signature), each party agrees to the terms above.</p>
  <div class="sig">
    <div>
      <strong>Layer One Staging</strong>
      <div class="line">Authorized Signature / Date</div>
    </div>
    <div>
      <strong>{{company}}</strong><br />
      <span style="font-size:12.5px;color:#555;">Signed by: {{contactName}}</span>
      <div class="line">Authorized Signature / Date</div>
    </div>
  </div>

  <p class="footer">Layer One Staging &middot; IT Deployment Staging &amp; Warehouse Solutions &middot; info@layeronestaging.com</p>
</div>
</body>
</html>`;

  return template
    .replace(/\{\{company\}\}/g, esc(inquiry.company))
    .replace(/\{\{contactName\}\}/g, esc(inquiry.contactName))
    .replace(/\{\{date\}\}/g, esc(formatDate(new Date())))
    .replace(/\{\{tierName\}\}/g, esc(quote.tierName))
    .replace(/\{\{amount\}\}/g, esc(quote.amount));
}
