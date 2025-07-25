CREATE TABLE `jotextes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`content` text NOT NULL,
	`document` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
