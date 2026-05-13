CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`logo` text,
	`settings` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `document_chunks` ADD `organizationId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `document_versions` ADD `organizationId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `organizationId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `embeddings` ADD `organizationId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `feedback` ADD `organizationId` int;--> statement-breakpoint
ALTER TABLE `notifications` ADD `organizationId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `organizationId` int;--> statement-breakpoint
CREATE INDEX `slug_idx` ON `organizations` (`slug`);--> statement-breakpoint
CREATE INDEX `isActive_idx` ON `organizations` (`isActive`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `document_chunks` (`organizationId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `document_versions` (`organizationId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `documents` (`organizationId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `embeddings` (`organizationId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `feedback` (`organizationId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `notifications` (`organizationId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `users` (`organizationId`);