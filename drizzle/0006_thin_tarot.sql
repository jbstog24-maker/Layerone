CREATE TABLE `client_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`senderId` int,
	`senderRole` enum('admin','staff','customer_admin','customer_viewer') NOT NULL,
	`senderName` varchar(200) NOT NULL,
	`body` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_messages_id` PRIMARY KEY(`id`)
);
