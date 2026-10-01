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
 *  - package_inquiries gains deletedAt (soft-delete / trash for inquiries)
 *  - call_logs gains followupEmailSent (post-call quote follow-up idempotency)
 *  - package_inquiries gains callLogId (link quote requests to the Alex call)
 *  - scheduled_calls gains cancelToken (one-click customer cancellation link,
 *    backfilled for in-flight bookings)
 *  - CREATE TABLE scheduled_calls (website "Schedule a Call" bookings w/ email verification)
 *  - CREATE TABLE call_logs (Bland post-call webhook transcript archive)
 *  - CREATE TABLE quote_terminations (early back-out calculator + refund record)
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

const CREATE_SCHEDULED_CALLS = `
CREATE TABLE IF NOT EXISTS \`scheduled_calls\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`name\` varchar(120) NOT NULL,
  \`phone\` varchar(30) NOT NULL,
  \`email\` varchar(320) NOT NULL,
  \`company\` varchar(200),
  \`topic\` text,
  \`scheduledFor\` timestamp NOT NULL,
  \`timezone\` varchar(60) NOT NULL DEFAULT 'America/Chicago',
  \`status\` enum('unverified','pending','calling','completed','failed','cancelled','expired') NOT NULL DEFAULT 'unverified',
  \`verificationToken\` varchar(64),
  \`verificationExpiresAt\` timestamp,
  \`verifiedAt\` timestamp,
  \`blandCallId\` varchar(64),
  \`attempts\` int NOT NULL DEFAULT 0,
  \`lastError\` text,
  \`ipHash\` varchar(64),
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT \`scheduled_calls_id\` PRIMARY KEY(\`id\`),
  INDEX \`scheduled_calls_status_idx\` (\`status\`),
  INDEX \`scheduled_calls_scheduledFor_idx\` (\`scheduledFor\`)
)`;

// 2026-10-01: Bland post-call webhook transcript archive. rawPayload is the
// full webhook JSON (mediumtext — structured transcript arrays can exceed
// TEXT's 64KB on long calls). blandCallId is unique so retried webhook
// deliveries are idempotent.
const CREATE_CALL_LOGS = `
CREATE TABLE IF NOT EXISTS \`call_logs\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`blandCallId\` varchar(64),
  \`direction\` enum('inbound','outbound','unknown') NOT NULL DEFAULT 'unknown',
  \`fromNumber\` varchar(30),
  \`toNumber\` varchar(30),
  \`callerName\` varchar(120),
  \`company\` varchar(200),
  \`startedAt\` timestamp NULL,
  \`durationSeconds\` int,
  \`summary\` text,
  \`recordingUrl\` text,
  \`transcript\` mediumtext,
  \`rawPayload\` mediumtext NOT NULL,
  \`syncedToSheet\` tinyint(1) NOT NULL DEFAULT 0,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT \`call_logs_id\` PRIMARY KEY(\`id\`),
  CONSTRAINT \`call_logs_blandCallId_unique\` UNIQUE(\`blandCallId\`),
  INDEX \`call_logs_syncedToSheet_idx\` (\`syncedToSheet\`)
)`;

// 2026-10-01: quote_terminations — one auditable row per early back-out.
// Stores Branden's calculator inputs (space cost, re-lease recovery) and the
// calculated forfeit/refund breakdown under MSA Section 7.4.
const CREATE_QUOTE_TERMINATIONS = `
CREATE TABLE IF NOT EXISTS \`quote_terminations\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`quoteId\` int NOT NULL,
  \`inquiryId\` int NOT NULL,
  \`totalPaid\` decimal(10,2) NOT NULL,
  \`spaceCost\` decimal(10,2) NOT NULL DEFAULT 0.00,
  \`recovery\` decimal(10,2) NOT NULL DEFAULT 0.00,
  \`netSpaceCost\` decimal(10,2) NOT NULL,
  \`adminFee\` decimal(10,2) NOT NULL,
  \`forfeitAmount\` decimal(10,2) NOT NULL,
  \`refundAmount\` decimal(10,2) NOT NULL,
  \`stripeRefundId\` varchar(255),
  \`reason\` text,
  \`processedByUserId\` int,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT \`quote_terminations_id\` PRIMARY KEY(\`id\`),
  CONSTRAINT \`quote_terminations_quoteId_unique\` UNIQUE(\`quoteId\`),
  INDEX \`quote_terminations_inquiryId_idx\` (\`inquiryId\`)
)`;

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
      ["scheduled_calls", CREATE_SCHEDULED_CALLS],
      ["call_logs", CREATE_CALL_LOGS],
      ["quote_terminations", CREATE_QUOTE_TERMINATIONS],
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

    // 2026-09-30: deletedAt column on package_inquiries (soft-delete / trash)
    await applyStep("add package_inquiries.deletedAt", async () => {
      if (await columnExists(db, "package_inquiries", "deletedAt")) {
        console.log("[Migration] package_inquiries.deletedAt already exists — skipping");
      } else {
        await db.execute(sql.raw("ALTER TABLE `package_inquiries` ADD `deletedAt` timestamp NULL"));
        console.log("[Migration] package_inquiries.deletedAt added");
      }
    });

    // 2026-10-01: followupEmailSent on call_logs (post-call quote follow-up
    // idempotency) and callLogId on package_inquiries (link quote requests to
    // the Alex call they came from).
    await applyStep("add call_logs.followupEmailSent", async () => {
      if (await columnExists(db, "call_logs", "followupEmailSent")) {
        console.log("[Migration] call_logs.followupEmailSent already exists — skipping");
      } else {
        await db.execute(sql.raw("ALTER TABLE `call_logs` ADD `followupEmailSent` tinyint(1) NOT NULL DEFAULT 0"));
        console.log("[Migration] call_logs.followupEmailSent added");
      }
    });

    await applyStep("add package_inquiries.callLogId", async () => {
      if (await columnExists(db, "package_inquiries", "callLogId")) {
        console.log("[Migration] package_inquiries.callLogId already exists — skipping");
      } else {
        await db.execute(sql.raw("ALTER TABLE `package_inquiries` ADD `callLogId` int NULL"));
        console.log("[Migration] package_inquiries.callLogId added");
      }
    });

    // 2026-10-01: cancelToken on scheduled_calls (one-click customer
    // cancellation link). Backfills in-flight bookings so their emailed
    // cancel links work too.
    await applyStep("add scheduled_calls.cancelToken", async () => {
      if (await columnExists(db, "scheduled_calls", "cancelToken")) {
        console.log("[Migration] scheduled_calls.cancelToken already exists — skipping");
      } else {
        await db.execute(sql.raw("ALTER TABLE `scheduled_calls` ADD `cancelToken` varchar(64) NULL"));
        console.log("[Migration] scheduled_calls.cancelToken added");
      }
      const [res]: any = await db.execute(
        sql.raw(
          "UPDATE `scheduled_calls` SET `cancelToken` = CONCAT(HEX(RANDOM_BYTES(16)), HEX(RANDOM_BYTES(16))) WHERE `cancelToken` IS NULL AND `status` IN ('unverified','pending')"
        )
      );
      const affected = res?.affectedRows ?? 0;
      if (affected > 0) console.log(`[Migration] scheduled_calls.cancelToken backfilled for ${affected} in-flight booking(s)`);
    });

    console.log("[Migration] one-time migration complete");
  } catch (err: any) {
    console.error("[Migration] FAILED (non-fatal):", err?.message ?? err);
  }
}
