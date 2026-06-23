CREATE TABLE `marketing_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`assetType` enum('image','video') NOT NULL,
	`prompt` text NOT NULL,
	`style` varchar(128),
	`format` varchar(64),
	`fileKey` varchar(512),
	`fileUrl` varchar(1024),
	`thumbnailUrl` varchar(1024),
	`status` enum('generating','ready','failed') NOT NULL DEFAULT 'generating',
	`errorMessage` text,
	`createdByUserId` int,
	`createdByName` varchar(256),
	`tags` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketing_assets_id` PRIMARY KEY(`id`)
);
