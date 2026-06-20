CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int,
	`userId` int,
	`action` varchar(256) NOT NULL,
	`entityType` varchar(64),
	`entityId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boxes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`boxCode` varchar(64) NOT NULL,
	`clientId` int NOT NULL,
	`projectName` varchar(256),
	`palletId` int,
	`deliveryId` int,
	`receivingLogId` int,
	`trackingNumber` varchar(256),
	`condition` enum('good','damaged','exception') NOT NULL DEFAULT 'good',
	`contents` text,
	`storageLocation` varchar(128),
	`status` enum('received','in_storage','staging','packed','shipped','exception') NOT NULL DEFAULT 'received',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boxes_id` PRIMARY KEY(`id`),
	CONSTRAINT `boxes_boxCode_unique` UNIQUE(`boxCode`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(256) NOT NULL,
	`contactName` varchar(128),
	`contactEmail` varchar(320),
	`contactPhone` varchar(32),
	`billingEmail` varchar(320),
	`packageId` int,
	`billingCycleStart` timestamp,
	`status` enum('active','inactive','onboarding','suspended') NOT NULL DEFAULT 'onboarding',
	`projectNotes` text,
	`address` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceCode` varchar(64) NOT NULL,
	`clientId` int NOT NULL,
	`projectName` varchar(256),
	`siteName` varchar(256),
	`deviceType` varchar(128),
	`brand` varchar(128),
	`model` varchar(128),
	`serialNumber` varchar(256),
	`macAddress` varchar(64),
	`assetTag` varchar(128),
	`boxId` int,
	`palletId` int,
	`deliveryId` int,
	`firmwareVersion` varchar(128),
	`configStatus` enum('pending','in_progress','complete','not_required') NOT NULL DEFAULT 'pending',
	`stagingStatus` enum('expected','received','inventory_captured','waiting_instructions','ready_for_staging','in_staging','staged','labeled','packed','ready_to_ship','shipped','picked_up','exception') NOT NULL DEFAULT 'expected',
	`storageLocation` varchar(128),
	`notes` text,
	`receivingLogId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `devices_deviceCode_unique` UNIQUE(`deviceCode`)
);
--> statement-breakpoint
CREATE TABLE `expected_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`projectName` varchar(256),
	`carrier` varchar(128),
	`trackingNumber` varchar(256),
	`expectedDate` timestamp,
	`expectedBoxCount` int DEFAULT 0,
	`expectedPalletCount` int DEFAULT 0,
	`expectedContents` text,
	`siteName` varchar(256),
	`specialInstructions` text,
	`status` enum('expected','in_transit','received','partially_received','damaged','exception','closed') NOT NULL DEFAULT 'expected',
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expected_deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoice_line_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`description` varchar(512) NOT NULL,
	`category` enum('base_package','extra_boxes','extra_pallets','extra_devices','storage_overage','labor_hours','packing_shipping','rush_fee','special_handling','shipping_materials','other') NOT NULL DEFAULT 'other',
	`quantity` decimal(10,2) NOT NULL DEFAULT '1.00',
	`unitPrice` decimal(10,2) NOT NULL,
	`total` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoice_line_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceNumber` varchar(64) NOT NULL,
	`clientId` int NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
	`tax` decimal(10,2) NOT NULL DEFAULT '0.00',
	`total` decimal(10,2) NOT NULL DEFAULT '0.00',
	`status` enum('draft','sent','paid','overdue','void') NOT NULL DEFAULT 'draft',
	`notes` text,
	`dueDate` timestamp,
	`paidAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `outbound_shipments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shipmentCode` varchar(64) NOT NULL,
	`clientId` int NOT NULL,
	`projectName` varchar(256),
	`destination` text,
	`carrier` varchar(128),
	`trackingNumber` varchar(256),
	`packedBy` int,
	`datePacked` timestamp,
	`dateShipped` timestamp,
	`dateDelivered` timestamp,
	`status` enum('requested','packing','ready_to_ship','shipped','delivered','exception','closed') NOT NULL DEFAULT 'requested',
	`notes` text,
	`requestedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `outbound_shipments_id` PRIMARY KEY(`id`),
	CONSTRAINT `outbound_shipments_shipmentCode_unique` UNIQUE(`shipmentCode`)
);
--> statement-breakpoint
CREATE TABLE `packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`tier` enum('pilot','shelf','bay','dedicated','rollout','custom') NOT NULL,
	`basePrice` decimal(10,2) NOT NULL DEFAULT '0.00',
	`billingCycle` enum('one_time','monthly') NOT NULL DEFAULT 'monthly',
	`maxDevices` int DEFAULT 0,
	`maxBoxes` int DEFAULT 0,
	`maxPallets` int DEFAULT 0,
	`storageDays` int DEFAULT 30,
	`maxOutboundShipments` int DEFAULT 0,
	`includedLaborHours` int DEFAULT 0,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`palletCode` varchar(64) NOT NULL,
	`clientId` int NOT NULL,
	`projectName` varchar(256),
	`deliveryId` int,
	`receivingLogId` int,
	`dateReceived` timestamp NOT NULL DEFAULT (now()),
	`boxCount` int DEFAULT 0,
	`storageLocation` varchar(128),
	`status` enum('received','in_storage','staging','ready_to_ship','shipped','exception') NOT NULL DEFAULT 'received',
	`dateRemoved` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `pallets_palletCode_unique` UNIQUE(`palletCode`)
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('delivery','receiving_log','pallet','box','device','staging_task','shipment','exception') NOT NULL,
	`entityId` int NOT NULL,
	`clientId` int NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`url` varchar(512) NOT NULL,
	`fileName` varchar(256),
	`mimeType` varchar(64),
	`caption` text,
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `receiving_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`deliveryId` int,
	`projectName` varchar(256),
	`carrier` varchar(128),
	`trackingNumber` varchar(256),
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`receivedBy` int,
	`boxCount` int DEFAULT 0,
	`palletCount` int DEFAULT 0,
	`condition` enum('good','damaged','exception','partial') NOT NULL DEFAULT 'good',
	`storageLocation` varchar(128),
	`notes` text,
	`status` enum('pending','processed','exception') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `receiving_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipment_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shipmentId` int NOT NULL,
	`itemType` enum('device','box','pallet') NOT NULL,
	`itemId` int NOT NULL,
	CONSTRAINT `shipment_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staging_task_devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`deviceId` int NOT NULL,
	CONSTRAINT `staging_task_devices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staging_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`projectName` varchar(256),
	`taskType` enum('firmware_update','labeling','site_kit_prep','switch_staging','firewall_staging','ap_prep','camera_nvr_kit','config_backup','documentation','other') NOT NULL DEFAULT 'other',
	`title` varchar(256) NOT NULL,
	`instructions` text,
	`assignedTo` int,
	`status` enum('pending','in_progress','completed','on_hold','cancelled') NOT NULL DEFAULT 'pending',
	`priority` enum('low','normal','high','rush') NOT NULL DEFAULT 'normal',
	`startDate` timestamp,
	`completionDate` timestamp,
	`estimatedHours` decimal(6,2),
	`actualHours` decimal(6,2),
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staging_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','staff','customer_admin','customer_viewer') NOT NULL DEFAULT 'customer_viewer';--> statement-breakpoint
ALTER TABLE `users` ADD `clientId` int;