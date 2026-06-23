CREATE TABLE `drip_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`leadId` int NOT NULL,
	`currentStep` int NOT NULL DEFAULT 0,
	`status` enum('active','paused','completed','unsubscribed') NOT NULL DEFAULT 'active',
	`nextSendAt` timestamp,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`enrolledByUserId` int,
	CONSTRAINT `drip_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drip_sequence_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`delayDays` int NOT NULL DEFAULT 0,
	`subject` varchar(512) NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `drip_sequence_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drip_sequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drip_sequences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_campaign_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`type` enum('cold_email','follow_up_email','linkedin_message','call_script','sms') NOT NULL,
	`subject` varchar(512),
	`body` text NOT NULL,
	`generatedByAi` boolean NOT NULL DEFAULT true,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_campaign_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`tier` varchar(64),
	`deviceCount` int,
	`monthlyRate` varchar(64),
	`setupFee` varchar(64),
	`notes` text,
	`status` enum('draft','sent','accepted','rejected') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(256) NOT NULL,
	`contactName` varchar(256),
	`contactTitle` varchar(256),
	`email` varchar(256),
	`phone` varchar(64),
	`website` varchar(512),
	`address` text,
	`city` varchar(128),
	`state` varchar(64),
	`industry` varchar(128),
	`employeeCount` varchar(64),
	`annualRevenue` varchar(64),
	`source` enum('manual','inquiry_form','google_maps','referral','linkedin','other') NOT NULL DEFAULT 'manual',
	`status` enum('new','contacted','qualified','proposal_sent','negotiating','won','lost','on_hold','unqualified','follow_up','demo_scheduled') NOT NULL DEFAULT 'new',
	`temperature` enum('cold','warm','hot') NOT NULL DEFAULT 'cold',
	`score` int DEFAULT 0,
	`notes` text,
	`placeId` varchar(512),
	`assignedToUserId` int,
	`convertedToClientId` int,
	`lastContactedAt` timestamp,
	`nextFollowUpAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
