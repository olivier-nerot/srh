-- Create OTP table for login authentication
CREATE TABLE `otps` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `email` text NOT NULL,
  `otp` text NOT NULL,
  `expires_at` integer NOT NULL,
  `created_at` integer NOT NULL
);

-- Create index for faster lookups
CREATE INDEX `otps_email_idx` ON `otps` (`email`);
CREATE INDEX `otps_expires_at_idx` ON `otps` (`expires_at`);