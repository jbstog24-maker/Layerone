CREATE TABLE `staging_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` int NOT NULL,
	`clientId` int NOT NULL,
	`notifiedByUserId` int NOT NULL,
	`notifiedByName` varchar(200) NOT NULL,
	`deviceCode` varchar(128) NOT NULL,
	`message` text,
	`emailSent` boolean NOT NULL DEFAULT false,
	`acknowledgedAt` timestamp,
	`acknowledgedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staging_notifications_id` PRIMARY KEY(`id`)
);
