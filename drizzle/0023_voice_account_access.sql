ALTER TABLE `users` ADD `phonePinHash` varchar(255);
--> statement-breakpoint
ALTER TABLE `users` ADD `phonePinSetAt` timestamp;
--> statement-breakpoint
ALTER TABLE `users` ADD `deliveryNotes` text;
--> statement-breakpoint
ALTER TABLE `users` ADD `notificationPrefs` varchar(255);
--> statement-breakpoint
ALTER TABLE `users` ADD `consecutiveLockouts` int NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE TABLE `voice_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`blandCallId` varchar(128),
	`tokenHash` varchar(255),
	`verifiedAt` timestamp,
	`expiresAt` timestamp,
	`failedAttempts` int NOT NULL DEFAULT 0,
	`lockedUntil` timestamp,
	CONSTRAINT `voice_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `account_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`authorType` enum('alex','admin','customer','system') NOT NULL DEFAULT 'alex',
	`note` text,
	`blandCallId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `account_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `account_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`actor` enum('alex','admin','customer') NOT NULL,
	`action` varchar(128) NOT NULL,
	`entityType` varchar(64),
	`entityId` varchar(128),
	`beforeValue` text,
	`afterValue` text,
	`blandCallId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `account_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `voice_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`kind` varchar(64) NOT NULL,
	`field` varchar(128),
	`requestedValue` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`blandCallId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`resolvedBy` int,
	CONSTRAINT `voice_approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blocked_numbers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phone` varchar(30) NOT NULL,
	`reason` varchar(255),
	`source` enum('alex','manual','auto') NOT NULL DEFAULT 'manual',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blocked_numbers_id` PRIMARY KEY(`id`),
	CONSTRAINT `blocked_numbers_phone_unique` UNIQUE(`phone`)
);
