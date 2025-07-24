ALTER TABLE `publications` ADD `picture` text;--> statement-breakpoint
ALTER TABLE `publications` ADD `attachment_ids` text DEFAULT '[]';