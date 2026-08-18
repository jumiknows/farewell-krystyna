CREATE TABLE `postcard_uploads` (
	`key` text PRIMARY KEY NOT NULL,
	`content_type` text NOT NULL,
	`content` blob NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
