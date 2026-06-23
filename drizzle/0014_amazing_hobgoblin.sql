CREATE TABLE `support_ticket_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`senderId` int,
	`senderName` varchar(256),
	`senderRole` enum('admin','staff','customer_admin','customer_viewer') NOT NULL,
	`body` text NOT NULL,
	`isInternal` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `support_ticket_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`submittedByUserId` int,
	`submittedByName` varchar(256),
	`subject` varchar(512) NOT NULL,
	`category` enum('billing','shipping','staging','account','technical','general') NOT NULL DEFAULT 'general',
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`description` text NOT NULL,
	`status` enum('open','in_progress','waiting_on_client','resolved','closed') NOT NULL DEFAULT 'open',
	`assignedToUserId` int,
	`resolvedAt` timestamp,
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`)
);
