ALTER TABLE `staging_notifications` ADD `itemType` varchar(16) DEFAULT 'device' NOT NULL;--> statement-breakpoint
ALTER TABLE `staging_notifications` ADD `itemId` int NOT NULL;