ALTER TABLE `clients` ADD `contractSignedAt` timestamp;--> statement-breakpoint
ALTER TABLE `clients` ADD `goLiveDate` timestamp;--> statement-breakpoint
ALTER TABLE `clients` ADD `onboardingNotes` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `stripeCustomerId` varchar(128);--> statement-breakpoint
ALTER TABLE `clients` ADD `stripeSubscriptionId` varchar(128);--> statement-breakpoint
ALTER TABLE `clients` ADD `paymentStatus` enum('unpaid','pending','paid','failed','cancelled') DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `warehouseUnitNumber` varchar(64);--> statement-breakpoint
ALTER TABLE `clients` ADD `warehouseAddress` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `warehouseAccessCode` varchar(128);--> statement-breakpoint
ALTER TABLE `clients` ADD `warehouseDimensions` varchar(128);--> statement-breakpoint
ALTER TABLE `clients` ADD `warehouseNotes` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `warehouseAssignedAt` timestamp;--> statement-breakpoint
ALTER TABLE `clients` ADD `assignedTechNames` text;