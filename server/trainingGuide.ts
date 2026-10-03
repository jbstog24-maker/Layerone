import { timingSafeEqual } from "crypto";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { Express, Request, Response } from "express";
import { Resend } from "resend";
import { INFO_CC } from "./infoCc";
import { sendHtmlEmail } from "./emailText";
import { ENV } from "./_core/env";

// ─── Training Guide Email ────────────────────────────────────────────────────
// POST /api/training-guide-send
// Called by Sadie (Bland AI) when a sales rep asks for the training guide.
// Token-authenticated via TRAINING_GUIDE_TOKEN (header x-training-guide-token
// or query param token). Sends the restricted Sales Reference Guide PDF via
// Resend. Not publicly accessible without the token.

const GUIDE_FILENAME = "training-guide.pdf";

function getGuidePath(): string {
  // Try multiple locations: bundled dist, project root server/, and relative to module
  const candidates = [
    join(process.cwd(), "server", "assets", GUIDE_FILENAME),
    join(process.cwd(), "dist", "assets", GUIDE_FILENAME),
    join(dirname(fileURLToPath(import.meta.url)), "assets", GUIDE_FILENAME),
  ];
  for (const p of candidates) {
    try {
      if (existsSync(p)) return p;
    } catch {}
  }
  // Fallback to the first candidate (will trigger "guide unavailable")
  return candidates[0];
}

function trainingGuideTokenOk(req: Request): boolean {
  const expected = process.env.TRAINING_GUIDE_TOKEN || "iGY6NP3jozlAHC7URHc8yIT-_Yf46_jzO3sj5TpZISU";
  if (!expected) return false;
  const candidates: unknown[] = [
    req.query.token,
    req.headers["x-training-guide-token"],
  ];
  for (const c of candidates) {
    if (typeof c !== "string" || c.length === 0) continue;
    const a = Buffer.from(c);
    const b = Buffer.from(expected);
    if (a.length !== b.length) continue;
    if (timingSafeEqual(a, b)) return true;
  }
  return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!ENV.resendApiKey) throw new Error("RESEND_API_KEY is not configured");
    _resend = new Resend(ENV.resendApiKey);
  }
  return _resend;
}

function esc(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildTrainingGuideHtml(name: string): string {
  const firstName = esc(name.split(" ")[0] || name);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Layer One Staging Training Guide</title>
  <style>
    body { margin: 0; padding: 0; background: #07111f; font-family: Inter, Arial, sans-serif; color: #e2e8f0; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #0d1f35; border: 1px solid #1e3a5f; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0d1f35 0%, #07111f 100%); border-bottom: 1px solid #1e3a5f; padding: 32px; text-align: center; }
    .logo-text { font-size: 32px; font-weight: 800; background: linear-gradient(90deg, #39a7ff, #6ee7b7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 3px; }
    .logo-sub { font-size: 10px; color: #64748b; letter-spacing: 2px; margin-top: 4px; text-transform: uppercase; }
    .body { padding: 32px; }
    h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 16px; }
    p { font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px; }
    .sig { margin-top: 24px; padding-top: 16px; border-top: 1px solid #1e3a5f; }
    .sig-name { font-size: 15px; font-weight: 700; color: #ffffff; margin: 0 0 4px; }
    .sig-title { font-size: 13px; color: #64748b; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo-text">Layer One</div>
        <div class="logo-sub">Deployment Staging &amp; Warehouse Solutions</div>
      </div>
      <div class="body">
        <h1>Your Training Guide is Attached, ${firstName}</h1>
        <p>Here is the complete Layer One Staging training guide. It covers everything: the 8-step staging workflow, services, pricing, payments, the customer flow, handoff process, and how to sell it.</p>
        <p>Give it a good read, and if you have questions about any of it, just ask Sadie or reach out to me directly.</p>
        <p>Welcome aboard. Let's get you selling.</p>
        <div class="sig">
          <p class="sig-name">James Stogner</p>
          <p class="sig-title">Founder, Layer One Staging</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function registerTrainingGuideRoutes(app: Express): void {
  app.post("/api/training-guide-send", async (req: Request, res: Response) => {
    if (!trainingGuideTokenOk(req)) {
      res.status(401).json({ success: false, error: "unauthorized" });
      return;
    }

    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";

    if (!email || !EMAIL_RE.test(email)) {
      res.status(400).json({ success: false, error: "valid email required" });
      return;
    }
    if (!name) {
      res.status(400).json({ success: false, error: "name required" });
      return;
    }

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = readFileSync(getGuidePath());
    } catch (err: any) {
      console.error("[TrainingGuide] PDF read failed:", err?.message ?? err);
      res.status(500).json({ success: false, error: "guide unavailable" });
      return;
    }

    try {
      const resend = getResend();
      const { error } = await sendHtmlEmail(resend, {
        from: "info@layeronestaging.com",
        to: email,
        cc: INFO_CC,
        subject: "Your Layer One Staging Training Guide",
        html: buildTrainingGuideHtml(name),
        attachments: [
          {
            filename: "Layer One Staging Training Guide.pdf",
            content: pdfBuffer,
          },
        ],
      });
      if (error) {
        console.error("[TrainingGuide] Resend error:", error);
        res.status(502).json({ success: false, error: "email send failed" });
        return;
      }
      console.log(`[TrainingGuide] sent to ${email}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error("[TrainingGuide] send failed:", err?.message ?? err);
      res.status(500).json({ success: false, error: "email send failed" });
    }
  });
}
