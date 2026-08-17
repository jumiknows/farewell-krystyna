CREATE TABLE `farewell_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'teammate' NOT NULL,
	`message` text NOT NULL,
	`stamp` text DEFAULT 'WITH LOVE' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
