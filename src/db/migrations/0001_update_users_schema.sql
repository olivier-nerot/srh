-- Update users table schema
ALTER TABLE `users` RENAME COLUMN `name` TO `firstname`;
ALTER TABLE `users` DROP COLUMN `role`;
ALTER TABLE `users` ADD `lastname` text;
ALTER TABLE `users` ADD `infopro` text;
ALTER TABLE `users` ADD `isadmin` integer DEFAULT false;
ALTER TABLE `users` ADD `newsletter` integer DEFAULT false;
ALTER TABLE `users` ADD `hospital` text;
ALTER TABLE `users` ADD `address` text;
ALTER TABLE `users` ADD `subscription` text;