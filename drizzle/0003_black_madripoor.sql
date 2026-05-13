CREATE TABLE `document_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`userId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`filename` varchar(255) NOT NULL,
	`s3Key` varchar(512) NOT NULL,
	`s3Url` text NOT NULL,
	`fileSize` int NOT NULL,
	`tags` text,
	`description` text,
	`changeDescription` text,
	`totalChunks` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('bug','feature','improvement','other') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`adminResponse` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `documentId_idx` ON `document_versions` (`documentId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `document_versions` (`userId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `feedback` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `feedback` (`status`);