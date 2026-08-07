CREATE TABLE `document_jurisdictions` (
	`document` text NOT NULL,
	`jurisdiction` integer NOT NULL,
	CONSTRAINT `document_jurisdictions_pk` PRIMARY KEY(`document`, `jurisdiction`),
	CONSTRAINT `fk_document_jurisdictions_document_documents_id_fk` FOREIGN KEY (`document`) REFERENCES `documents`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_document_jurisdictions_jurisdiction_jurisdictions_id_fk` FOREIGN KEY (`jurisdiction`) REFERENCES `jurisdictions`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `document_topics` (
	`document` text NOT NULL,
	`topic` integer NOT NULL,
	CONSTRAINT `document_topics_pk` PRIMARY KEY(`document`, `topic`),
	CONSTRAINT `fk_document_topics_document_documents_id_fk` FOREIGN KEY (`document`) REFERENCES `documents`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_document_topics_topic_topics_id_fk` FOREIGN KEY (`topic`) REFERENCES `topics`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY,
	`version` text NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`year` text NOT NULL,
	`source_url` text NOT NULL,
	`etag` text,
	`sha256` text NOT NULL,
	`status` text,
	`last_modified` text NOT NULL,
	`downloaded_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `jurisdictions` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`slug` text NOT NULL UNIQUE,
	`label` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `topics` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`slug` text NOT NULL UNIQUE,
	`label` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `document_jurisdiction_topic_slug_idx` ON `document_jurisdictions` (`jurisdiction`);--> statement-breakpoint
CREATE INDEX `document_topics_topic_slug_idx` ON `document_topics` (`topic`);