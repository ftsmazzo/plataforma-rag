CREATE TABLE `document_chunks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`userId` int NOT NULL,
	`chunkIndex` int NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`tokenCount` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_chunks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`filename` varchar(255) NOT NULL,
	`originalFilename` varchar(255) NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`fileSize` int NOT NULL,
	`s3Key` varchar(512) NOT NULL,
	`s3Url` text NOT NULL,
	`status` enum('uploading','processing','completed','failed') NOT NULL DEFAULT 'uploading',
	`errorMessage` text,
	`metadata` text,
	`totalChunks` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `embeddings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chunkId` int NOT NULL,
	`documentId` int NOT NULL,
	`userId` int NOT NULL,
	`embedding` text NOT NULL,
	`embeddingModel` varchar(100) NOT NULL DEFAULT 'text-embedding-3-small',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `embeddings_id` PRIMARY KEY(`id`),
	CONSTRAINT `embeddings_chunkId_unique` UNIQUE(`chunkId`)
);
--> statement-breakpoint
CREATE INDEX `documentId_idx` ON `document_chunks` (`documentId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `document_chunks` (`userId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `documents` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `documents` (`status`);--> statement-breakpoint
CREATE INDEX `chunkId_idx` ON `embeddings` (`chunkId`);--> statement-breakpoint
CREATE INDEX `documentId_idx` ON `embeddings` (`documentId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `embeddings` (`userId`);