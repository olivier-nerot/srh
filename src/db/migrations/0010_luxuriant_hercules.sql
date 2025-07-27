DROP INDEX "users_email_unique";--> statement-breakpoint
ALTER TABLE `jotextes` ALTER COLUMN "content" TO "content" text;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `jotextes` ADD `year` text;--> statement-breakpoint
ALTER TABLE `rapports` ALTER COLUMN "content" TO "content" text;--> statement-breakpoint
ALTER TABLE `rapports` ADD `year` text;