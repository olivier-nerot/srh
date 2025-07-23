ALTER TABLE `users` ADD `firstname` text;--> statement-breakpoint
ALTER TABLE `users` ADD `lastname` text;--> statement-breakpoint
ALTER TABLE `users` ADD `infopro` text;--> statement-breakpoint
ALTER TABLE `users` ADD `isadmin` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `newsletter` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `hospital` text;--> statement-breakpoint
ALTER TABLE `users` ADD `address` text;--> statement-breakpoint
ALTER TABLE `users` ADD `subscription` text;--> statement-breakpoint
ALTER TABLE `users` ADD `subscribed_until` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `role`;