CREATE TABLE `client_instruction_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`fileName` varchar(512) NOT NULL,
	`fileKey` varchar(1024) NOT NULL,
	`fileUrl` varchar(2048) NOT NULL,
	`mimeType` varchar(256),
	`uploadedById` int,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_instruction_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_instructions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`textBody` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedByUserId` int,
	`acknowledgedAt` timestamp,
	`acknowledgedByUserId` int,
	CONSTRAINT `client_instructions_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_instructions_clientId_unique` UNIQUE(`clientId`)
);
