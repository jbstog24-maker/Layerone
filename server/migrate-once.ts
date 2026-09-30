/**
 * One-time additive migration for the autonomous quote → MSA → payment → onboarding flow.
 *
 * Runs at boot ONLY when RUN_ONCE_MIGRATION=1 is set. Every step inspects
 * INFORMATION_SCHEMA first and applies only what is missing, so it is safe to
 * run multiple times. Never throws — failures are logged and boot continues.
 *
 * Statements applied (additive only, no data touched):
 *  - CREATE TABLE msa_documents / onboarding_checklists / onboarding_tasks
 *  - package_inquiries.status enum extended with new workflow values
 *  - quotes gains msaStatus, stripeCheckoutSessionId, msaDocumentId
 *  - quotes gains stripePaymentLinkId, stripePaymentLinkUrl, stripePriceId, sentAt, paidAt
 *  - users gains inviteToken, inviteTokenExpiresAt (set-password / reset flow)
 *  - package_inquiries gains locationCount, equipmentTypes, startDate, rolloutDuration (rollout scoping)
 *  - package_inquiries gains quoteType (project vs per-pallet quote path)
 */
import { sql } from "drizzle-orm";
import { getDb } from "./db";

const CREATE_MSA_DOCUMENTS = `
CREATE TABLE IF NOT EXISTS \`msa_documents\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`inquiryId\` int NOT NULL,
  \`quoteId\` int NOT NULL,
  \`token\` varchar(64) NOT NULL,
  \`tokenExpiresAt\` timestamp NOT NULL,
  \`htmlSnapshot\` mediumtext NOT NULL,
  \`status\` enum('pending','signed','expired') NOT NULL DEFAULT 'pending',
  \`signedByName\` varchar(120),
  \`signerTitle\` varchar(120),
  \`signedAt\` timestamp,
  \`signatureIp\` varchar(45),
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT \`msa_documents_id\` PRIMARY KEY(\`id\`),
  CONSTRAINT \`msa_documents_token_unique\` UNIQUE(\`token\`)
)`;

const CREATE_ONBOARDING_CHECKLISTS = `
CREATE TABLE IF NOT EXISTS \`onboarding_checklists\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`inquiryId\` int NOT NULL,
  \`clientId\` int,
  \`template\` varchar(60) NOT NULL DEFAULT 'standard',
  \`status\` enum('open','in_progress','complete') NOT NULL DEFAULT 'open',
  \`unitAssignment\` text,
  \`notes\` text,
  \`completedAt\` timestamp,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT \`onboarding_checklists_id\` PRIMARY KEY(\`id\`),
  CONSTRAINT \`onboarding_checklists_inquiryId_unique\` UNIQUE(\`inquiryId\`)
)`;

const CREATE_ONBOARDING_TASKS = `
CREATE TABLE IF NOT EXISTS \`onboarding_tasks\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`checklistId\` int NOT NULL,
  \`label\` varchar(255) NOT NULL,
  \`detail\` text,
  \`sortOrder\` int NOT NULL DEFAULT 0,
  \`completedAt\` timestamp,
  \`completedBy\` varchar(120),
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT \`onboarding_tasks_id\` PRIMARY KEY(\`id\`)
)`;

const EXTEND_INQUIRY_STATUS = `
ALTER TABLE \`package_inquiries\` MODIFY COLUMN \`status\`
enum('new','needs_review','contacted','proposal_sent','quote_sent','msa_signed','paid','onboarding','won','lost','closed')
NOT NULL DEFAULT 'new'`;

// NOTE (2026-09-27): db.execute() on the mysql2 driver resolves to the raw
// mysql2 [rows, fields] tuple, NOT the rows array. Reading `.length` on the
// tuple is always 2 (truthy), which made every existence check below report
// "already exists" — so this migration silently skipped everything it was
// supposed to apply. Always unwrap to the data rows first.
export async function execRows(db: any, query: any): Promise<any[]> {
  const res = await db.execute(query);
  const rows = Array.isArray(res) ? res[0] : res;
  return (Array.isArray(rows) ? rows : []) as any[];
}

export async function tableExists(db: any, name: string): Promise<boolean> {
  const rows = await execRows(
    db,
    sql`SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${name} LIMIT 1`
  );
  return rows.length > 0;
}

export async function columnExists(db: any, table: string, column: string): Promise<boolean> {
  const rows = await execRows(
    db,
    sql`SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${table} AND COLUMN_NAME = ${column} LIMIT 1`
  );
  return rows.length > 0;
}

export async function inquiryStatusHas(db: any, value: string): Promise<boolean> {
  const rows = await execRows(db, sql`SHOW COLUMNS FROM \`package_inquiries\` LIKE 'status'`);
  const type = rows?.[0]?.Type as string | undefined;
  return !!type && type.includes(`'${value}'`);
}

/**
 * Run one additive step without letting it abort the remaining steps.
 * A failure here is never fatal to boot; it is logged and we continue so a
 * single duplicate/partial state can't block the columns the app needs.
 */
async function applyStep(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err: any) {
    console.error(`[Migration] step "${label}" failed (non-fatal, continuing):`, err?.message ?? err);
  }
}

export async function runOnceMigration(): Promise<void> {
  if (process.env.RUN_ONCE_MIGRATION !== "1") return;
  console.log("[Migration] RUN_ONCE_MIGRATION=1 — starting one-time migration (invite-token fix)");
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Migration] Database unavailable, skipping");
      return;
    }

    for (const [name, ddl] of [
      ["msa_documents", CREATE_MSA_DOCUMENTS],
      ["onboarding_checklists", CREATE_ONBOARDING_CHECKLISTS],
      ["onboarding_tasks", CREATE_ONBOARDING_TASKS],
    ] as const) {
      await applyStep(`create table ${name}`, async () => {
        if (await tableExists(db, name)) {
          console.log(`[Migration] table ${name} already exists — skipping`);
        } else {
          await db.execute(sql.raw(ddl));
          console.log(`[Migration] table ${name} created`);
        }
      });
    }

    await applyStep("extend package_inquiries.status enum", async () => {
      if (await inquiryStatusHas(db, "needs_review")) {
        console.log("[Migration] package_inquiries.status already extended — skipping");
      } else {
        await db.execute(sql.raw(EXTEND_INQUIRY_STATUS));
        console.log("[Migration] package_inquiries.status enum extended");
      }
    });

    for (const col of ["msaStatus", "stripeCheckoutSessionId", "msaDocumentId"] as const) {
      await applyStep(`add quotes.${col}`, async () => {
        if (await columnExists(db, "quotes", col)) {
          console.log(`[Migration] quotes.${col} already exists — skipping`);
        } else if (col === "msaStatus") {
          await db.execute(sql.raw(`ALTER TABLE \`quotes\` ADD \`${col}\` enum('pending','signed','waived') DEFAULT 'pending' NOT NULL`));
          console.log(`[Migration] quotes.${col} added`);
        } else if (col === "stripeCheckoutSessionId") {
          await db.execute(sql.raw(`ALTER TABLE \`quotes\` ADD \`${col}\` varchar(255)`));
          console.log(`[Migration] quotes.${col} added`);
        } else {
          await db.execute(sql.raw(`ALTER TABLE \`quotes\` ADD \`${col}\` int`));
          console.log(`[Migration] quotes.${col} added`);
        }
      });
    }

    // 2026-09-27: ensure quotes columns from the earlier Stripe/payment-link
    // migration are present (some environments missed them).
    const QUOTE_COLUMN_DEFS: Record<string, string> = {
      stripePaymentLinkId: "varchar(255)",
      stripePaymentLinkUrl: "text",
      stripePriceId: "varchar(255)",
      sentAt: "timestamp NULL",
      paidAt: "timestamp NULL",
    };
    for (const [col, def] of Object.entries(QUOTE_COLUMN_DEFS)) {
      await applyStep(`add quotes.${col}`, async () => {
        if (await columnExists(db, "quotes", col)) {
          console.log(`[Migration] quotes.${col} already exists — skipping`);
        } else {
          await db.execute(sql.raw(`ALTER TABLE \`quotes\` ADD \`${col}\` ${def}`));
          console.log(`[Migration] quotes.${col} added`);
        }
      });
    }

    // 2026-09-27: invite / password-reset token columns on users (set-password flow)
    const USER_COLUMN_DEFS: Record<string, string> = {
      inviteToken: "varchar(128) NULL",
      inviteTokenExpiresAt: "timestamp NULL",
    };
    for (const [col, def] of Object.entries(USER_COLUMN_DEFS)) {
      await applyStep(`add users.${col}`, async () => {
        if (await columnExists(db, "users", col)) {
          console.log(`[Migration] users.${col} already exists — skipping`);
        } else {
          await db.execute(sql.raw(`ALTER TABLE \`users\` ADD \`${col}\` ${def}`));
          console.log(`[Migration] users.${col} added`);
        }
      });
    }

    // 2026-09-30: rollout scoping columns on package_inquiries (project-quote form)
    const INQUIRY_COLUMN_DEFS: Record<string, string> = {
      locationCount: "int NULL",
      equipmentTypes: "text NULL",
      startDate: "varchar(20) NULL",
      rolloutDuration: "varchar(40) NULL",
    };
    for (const [col, def] of Object.entries(INQUIRY_COLUMN_DEFS)) {
      await applyStep(`add package_inquiries.${col}`, async () => {
        if (await columnExists(db, "package_inquiries", col)) {
          console.log(`[Migration] package_inquiries.${col} already exists — skipping`);
        } else {
          await db.execute(sql.raw(`ALTER TABLE \`package_inquiries\` ADD \`${col}\` ${def}`));
          console.log(`[Migration] package_inquiries.${col} added`);
        }
      });
    }

    // 2026-09-30: quoteType column on package_inquiries (project vs per-pallet path)
    await applyStep("add package_inquiries.quoteType", async () => {
      if (await columnExists(db, "package_inquiries", "quoteType")) {
        console.log("[Migration] package_inquiries.quoteType already exists — skipping");
      } else {
        await db.execute(sql.raw("ALTER TABLE `package_inquiries` ADD `quoteType` varchar(20) NULL"));
        console.log("[Migration] package_inquiries.quoteType added");
      }
    });

    console.log("[Migration] one-time migration complete");
  } catch (err: any) {
    console.error("[Migration] FAILED (non-fatal):", err?.message ?? err);
  }
}
