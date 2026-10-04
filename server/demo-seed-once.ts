/**
 * One-time DEMO seeder for the e-signature customer experience.
 *
 * Runs at boot ONLY when MINT_DEMO_DOC=1 is set. Creates a clearly-labeled
 * DEMO inquiry + quote + MSA signing document (no Stripe objects, no emails,
 * no money movement) and logs the customer signing URL so it can be pasted
 * into a demo proposal email.
 *
 * Idempotent: if a pending demo document already exists it is reused and no
 * duplicate rows are created. Never throws - failures are logged and boot
 * continues. Remove the env var after use (same pattern as RUN_ONCE_MIGRATION).
 */
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { packageInquiries, quotes, msaDocuments, users } from "../drizzle/schema";
import { buildMsaHtml, generateMsaToken } from "./msa";
import { hashPassword } from "./_core/password";

const DEMO_COMPANY = "Stogner IT Services (DEMO)";
const SIGNING_BASE_URL = "https://www.layeronestaging.com";
const MSA_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const DEMO_PORTAL_EMAIL = "demo@layeronestaging.com";
// Never hardcode the demo password in source. Set DEMO_PORTAL_PASSWORD
// as an environment variable on Render.
const DEMO_PORTAL_PASSWORD = process.env.DEMO_PORTAL_PASSWORD || "";

const DEMO_LINE_ITEMS = [
  { label: "Receiving - pallet intake, count & inspect", qty: 24, unitPrice: 12, total: 288 },
  { label: "Storage - secure pallet storage (1 month)", qty: 24, unitPrice: 30, total: 720 },
  { label: "Asset tagging, serial/MAC capture", qty: 180, unitPrice: 2.5, total: 450 },
  { label: "Site kitting labor (per site kit)", qty: 12, unitPrice: 95, total: 1140 },
  { label: "DFW pallet delivery", qty: 12, unitPrice: 175, total: 2100 },
];

export async function mintDemoDocOnce(): Promise<void> {
  if (process.env.MINT_DEMO_DOC !== "1") return;
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[DemoSeed] no DB connection - skipping");
      return;
    }

    // Reuse an existing pending demo document if there is one.
    const existing = await db
      .select({ token: msaDocuments.token, status: msaDocuments.status })
      .from(msaDocuments)
      .innerJoin(packageInquiries, eq(msaDocuments.inquiryId, packageInquiries.id))
      .where(eq(packageInquiries.company, DEMO_COMPANY))
      .orderBy(msaDocuments.id)
      .limit(1);
    const pending = existing.find((d) => d.status === "pending");
    if (pending) {
      console.log(
        `[DemoSeed] demo signing URL (existing): ${SIGNING_BASE_URL}/sign/${pending.token}`
      );
      return;
    }

    const inquiryResult = await db.insert(packageInquiries).values({
      name: "Branden Stogner",
      company: DEMO_COMPANY,
      email: "jb_stogner@yahoo.com",
      phone: "(469) 537-4378",
      tier: "custom",
      deviceCount: 180,
      palletCount: 24,
      message: "DEMO ONLY - created to preview the customer e-signature flow. Not a real inquiry.",
      status: "needs_review",
    });
    const inquiryId = (inquiryResult[0] as unknown as { insertId: number }).insertId;

    const total = DEMO_LINE_ITEMS.reduce((s, i) => s + i.total, 0);
    const quoteResult = await db.insert(quotes).values({
      inquiryId,
      lineItems: JSON.stringify(DEMO_LINE_ITEMS),
      subtotal: total.toFixed(2),
      tax: "0.00",
      totalAmount: total.toFixed(2),
      notes: "DEMO ONLY - no payment link attached.",
      status: "sent",
      sentAt: new Date(),
    });
    const quoteId = (quoteResult[0] as unknown as { insertId: number }).insertId;

    const token = generateMsaToken();
    const htmlSnapshot = buildMsaHtml(
      { company: "Stogner IT Services", contactName: "Branden Stogner", email: "jb_stogner@yahoo.com" },
      { tierName: "Custom", amount: `$${total.toFixed(2)}` }
    );
    const docResult = await db.insert(msaDocuments).values({
      inquiryId,
      quoteId,
      token,
      tokenExpiresAt: new Date(Date.now() + MSA_TOKEN_TTL_MS),
      htmlSnapshot,
      status: "pending",
    });
    const docId = (docResult[0] as unknown as { insertId: number }).insertId;

    await db.update(quotes).set({ msaDocumentId: docId }).where(eq(quotes.id, quoteId));

    console.log(
      `[DemoSeed] demo signing URL (new): ${SIGNING_BASE_URL}/sign/${token}`
    );
  } catch (err) {
    console.warn(
      "[DemoSeed] failed:",
      err instanceof Error ? err.message : String(err)
    );
  }
}

/**
 * One-time DEMO portal user seeder.
 *
 * Runs at boot ONLY when MINT_DEMO_USER=1 is set. Creates a clearly-labeled
 * DEMO customer_admin portal login (demo@layeronestaging.com) with a known
 * password for showing the customer portal to prospects.
 *
 * Idempotent: if the demo user already exists it is reused. Never throws.
 * Remove the env var after use (same pattern as MINT_DEMO_DOC).
 */
export async function mintDemoUserOnce(): Promise<void> {
  if (process.env.MINT_DEMO_USER !== "1") return;
  if (!DEMO_PORTAL_PASSWORD) {
    console.warn("[DemoSeed] DEMO_PORTAL_PASSWORD env var not set - skipping demo user");
    return;
  }
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[DemoSeed] no DB connection - skipping demo user");
      return;
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, DEMO_PORTAL_EMAIL))
      .limit(1);
    if (existing.length > 0) {
      console.log(`[DemoSeed] demo portal user already exists (id=${existing[0].id})`);
      return;
    }

    const passwordHash = await hashPassword(DEMO_PORTAL_PASSWORD);
    const result = await db.insert(users).values({
      openId: `demo-${Date.now()}`,
      name: "Demo User",
      email: DEMO_PORTAL_EMAIL,
      passwordHash,
      loginMethod: "password",
      role: "customer_admin",
      businessName: "Demo Company (DEMO)",
      isActive: true,
    });
    const id = (result[0] as unknown as { insertId: number }).insertId;
    console.log(
      `[DemoSeed] demo portal user created (id=${id}): ${DEMO_PORTAL_EMAIL}`
    );
  } catch (err) {
    console.warn(
      "[DemoSeed] failed to create demo user:",
      err instanceof Error ? err.message : String(err)
    );
  }
}
