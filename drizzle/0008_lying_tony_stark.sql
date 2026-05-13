CREATE TABLE `api_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiKeyId` int NOT NULL,
	`knowledgeBaseId` int NOT NULL,
	`query` text NOT NULL,
	`answer` text NOT NULL,
	`sourcesCount` int NOT NULL DEFAULT 0,
	`responseTime` int NOT NULL,
	`userId` int NOT NULL,
	`organizationId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `apiKeyId_idx` ON `api_logs` (`apiKeyId`);--> statement-breakpoint
CREATE INDEX `knowledgeBaseId_idx` ON `api_logs` (`knowledgeBaseId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `api_logs` (`userId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `api_logs` (`organizationId`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `api_logs` (`createdAt`);