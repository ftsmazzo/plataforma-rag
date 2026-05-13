CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`key` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`organizationId` int NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE INDEX `key_idx` ON `api_keys` (`key`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `api_keys` (`userId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `api_keys` (`organizationId`);--> statement-breakpoint
CREATE INDEX `isActive_idx` ON `api_keys` (`isActive`);