CREATE TABLE `msa_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inquiryId` int NOT NULL,
	`quoteId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`tokenExpiresAt` timestamp NOT NULL,
	`htmlSnapshot` mediumtext NOT NULL,
	`status` enum('pending','signed','expired') NOT NULL DEFAULT 'pending',
	`signedByName` varchar(120),
	`signerTitle` varchar(120),
	`signedAt` timestamp,
	`signatureIp` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `msa_documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `msa_documents_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_checklists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inquiryId` int NOT NULL,
	`clientId` int,
	`template` varchar(60) NOT NULL DEFAULT 'standard',
	`status` enum('open','in_progress','complete') NOT NULL DEFAULT 'open',
	`unitAssignment` text,
	`notes` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_checklists_id` PRIMARY KEY(`id`),
	CONSTRAINT `onboarding_checklists_inquiryId_unique` UNIQUE(`inquiryId`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checklistId` int NOT NULL,
	`label` varchar(255) NOT NULL,
	`detail` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`completedBy` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `onboarding_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `package_inquiries` MODIFY COLUMN `status` enum('new','needs_review','contacted','proposal_sent','quote_sent','msa_signed','paid','onboarding','won','lost','closed') NOT NULL DEFAULT 'new';--> statement-breakpoint
ALTER TABLE `quotes` ADD `msaStatus` enum('pending','signed','waived') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `stripeCheckoutSessionId` varchar(255);--> statement-breakpoint
ALTER TABLE `quotes` ADD `msaDocumentId` int;
--> statement-breakpoint
-- NOTE: drizzle-kit also generated `ALTER TABLE users ADD passwordHash` for this
-- snapshot; it was intentionally excluded — unrelated to this change and not applied.
-- Statements above were applied manually via the TiDB Cloud SQL editor on 2026-09-27
-- (direct DB access from the build VM is blocked at the network level).