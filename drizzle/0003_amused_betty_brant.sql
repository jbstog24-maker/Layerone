CREATE TABLE `package_inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`company` varchar(200) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(30),
	`tier` enum('basic','standard','professional','enterprise','custom') NOT NULL,
	`deviceVolume` varchar(30),
	`message` text,
	`status` enum('new','contacted','closed') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `package_inquiries_id` PRIMARY KEY(`id`)
);
