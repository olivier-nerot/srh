CREATE TABLE `publications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`tags` text DEFAULT '[]',
	`pubdate` integer NOT NULL,
	`subscribersonly` integer DEFAULT false NOT NULL,
	`homepage` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
