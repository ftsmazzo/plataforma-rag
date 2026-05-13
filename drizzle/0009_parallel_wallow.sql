ALTER TABLE `api_keys` ADD `rateLimit` int DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE `knowledge_bases` ADD `webhookUrl` text;