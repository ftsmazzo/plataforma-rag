CREATE TABLE `knowledge_bases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`userId` int NOT NULL,
	`organizationId` int NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_bases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `document_chunks` ADD `knowledgeBaseId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `knowledgeBaseId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `embeddings` ADD `knowledgeBaseId` int NOT NULL;--> statement-breakpoint
CREATE INDEX `userId_idx` ON `knowledge_bases` (`userId`);--> statement-breakpoint
CREATE INDEX `organizationId_idx` ON `knowledge_bases` (`organizationId`);--> statement-breakpoint
CREATE INDEX `isActive_idx` ON `knowledge_bases` (`isActive`);--> statement-breakpoint
CREATE INDEX `knowledgeBaseId_idx` ON `document_chunks` (`knowledgeBaseId`);--> statement-breakpoint
CREATE INDEX `knowledgeBaseId_idx` ON `documents` (`knowledgeBaseId`);--> statement-breakpoint
CREATE INDEX `knowledgeBaseId_idx` ON `embeddings` (`knowledgeBaseId`);