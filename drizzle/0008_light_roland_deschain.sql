ALTER TABLE `boxes` ADD `forwardingAddress` text;--> statement-breakpoint
ALTER TABLE `boxes` ADD `forwardingContact` varchar(256);--> statement-breakpoint
ALTER TABLE `boxes` ADD `forwardingNotes` text;--> statement-breakpoint
ALTER TABLE `boxes` ADD `forwardingStatus` enum('pending','in_transit','delivered') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `boxes` ADD `forwardingUpdatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `devices` ADD `forwardingAddress` text;--> statement-breakpoint
ALTER TABLE `devices` ADD `forwardingContact` varchar(256);--> statement-breakpoint
ALTER TABLE `devices` ADD `forwardingNotes` text;--> statement-breakpoint
ALTER TABLE `devices` ADD `forwardingStatus` enum('pending','in_transit','delivered') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `devices` ADD `forwardingUpdatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `pallets` ADD `forwardingAddress` text;--> statement-breakpoint
ALTER TABLE `pallets` ADD `forwardingContact` varchar(256);--> statement-breakpoint
ALTER TABLE `pallets` ADD `forwardingNotes` text;--> statement-breakpoint
ALTER TABLE `pallets` ADD `forwardingStatus` enum('pending','in_transit','delivered') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `pallets` ADD `forwardingUpdatedAt` timestamp;