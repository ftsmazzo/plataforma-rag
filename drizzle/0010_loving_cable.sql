CREATE TABLE `system_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`organizationId` int NOT NULL,
	`llmProvider` varchar(50) NOT NULL DEFAULT 'openai',
	`ollamaBaseUrl` text,
	`ollamaEmbeddingModel` varchar(100),
	`ollamaChatModel` varchar(100),
	`isActive` int NOT NULL DEFAULT 1,
	`lastTestedAt` timestamp,
	`lastTestStatus` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `userId_idx` ON `system_settings` (`userId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `system_settings` (`organizationId`);--> statement-breakpoint
CREATE INDEX `llmProvider_idx` ON `system_settings` (`llmProvider`);