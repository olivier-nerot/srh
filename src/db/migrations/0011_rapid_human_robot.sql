CREATE TABLE `liens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`icon` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`url` text NOT NULL,
	`logo` text,
	`picture` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`excerpt` text,
	`image_url` text,
	`category` text NOT NULL,
	`status` text DEFAULT 'draft',
	`author_id` integer,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_articles`("id", "title", "content", "excerpt", "image_url", "category", "status", "author_id", "published_at", "created_at", "updated_at") SELECT "id", "title", "content", "excerpt", "image_url", "category", "status", "author_id", "published_at", "created_at", "updated_at" FROM `articles`;--> statement-breakpoint
DROP TABLE `articles`;--> statement-breakpoint
ALTER TABLE `__new_articles` RENAME TO `articles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`file_size` integer,
	`mime_type` text,
	`category` text NOT NULL,
	`is_public` integer DEFAULT true,
	`uploaded_by` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_documents`("id", "title", "description", "file_name", "file_path", "file_size", "mime_type", "category", "is_public", "uploaded_by", "created_at", "updated_at") SELECT "id", "title", "description", "file_name", "file_path", "file_size", "mime_type", "category", "is_public", "uploaded_by", "created_at", "updated_at" FROM `documents`;--> statement-breakpoint
DROP TABLE `documents`;--> statement-breakpoint
ALTER TABLE `__new_documents` RENAME TO `documents`;--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
ALTER TABLE `faq` ALTER COLUMN "tags" TO "tags" text;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `publications` ALTER COLUMN "content" TO "content" text;--> statement-breakpoint
ALTER TABLE `jotextes` ALTER COLUMN "content" TO "content" text NOT NULL;--> statement-breakpoint
ALTER TABLE `rapports` ALTER COLUMN "content" TO "content" text NOT NULL;