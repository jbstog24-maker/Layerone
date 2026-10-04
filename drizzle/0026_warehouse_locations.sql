-- 0026: warehouse locations for ship-to addresses.
-- Adds the locations table (physical warehouse facilities) and a locationId
-- on clients so staff can assign one ship-to location per customer account.
CREATE TABLE IF NOT EXISTS `locations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(128) NOT NULL,
  `address` text NOT NULL,
  `city` varchar(64) NOT NULL,
  `state` varchar(8) NOT NULL DEFAULT 'TX',
  `zip` varchar(16) NOT NULL,
  `contactName` varchar(128),
  `contactPhone` varchar(32),
  `receivingHours` varchar(256),
  `dockInfo` text,
  `notes` text,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE (now()),
  CONSTRAINT `locations_id` PRIMARY KEY(`id`)
);
ALTER TABLE `clients` ADD `locationId` int NULL;
