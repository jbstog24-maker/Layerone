CREATE TABLE `shipment_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shipmentId` int NOT NULL,
	`clientId` int NOT NULL,
	`uploadedById` int NOT NULL,
	`uploadedByName` varchar(200),
	`filename` varchar(512) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`fileSize` int,
	`fileKey` varchar(1024) NOT NULL,
	`fileUrl` varchar(2048) NOT NULL,
	`label` varchar(256),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shipment_documents_id` PRIMARY KEY(`id`)
);
