CREATE TABLE IF NOT EXISTS `audio_metadata` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`audioUrl` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `audioNameIdx` ON `audio_metadata` (`name`);