CREATE TABLE `quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inquiryId` int NOT NULL,
	`lineItems` text NOT NULL,
	`subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
	`tax` decimal(10,2) NOT NULL DEFAULT '0.00',
	`totalAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`notes` text,
	`stripePaymentLinkId` varchar(255),
	`stripePaymentLinkUrl` text,
	`stripePriceId` varchar(255),
	`status` enum('draft','sent','paid','cancelled') NOT NULL DEFAULT 'draft',
	`sentAt` timestamp,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `package_inquiries` MODIFY COLUMN `status` enum('new','contacted','quote_sent','closed') NOT NULL DEFAULT 'new';--> statement-breakpoint
ALTER TABLE `package_inquiries` ADD `deviceCount` int;--> statement-breakpoint
ALTER TABLE `package_inquiries` ADD `palletCount` int;--> statement-breakpoint
ALTER TABLE `package_inquiries` ADD `boxCount` int;--> statement-breakpoint
ALTER TABLE `package_inquiries` ADD `storageDays` int;--> statement-breakpoint
ALTER TABLE `package_inquiries` ADD `addons` text;