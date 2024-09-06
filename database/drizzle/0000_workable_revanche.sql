CREATE TABLE IF NOT EXISTS `categories` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`colour` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `exercises` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`notes` text NOT NULL,
	`type` text NOT NULL,
	`category_id` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `nameIdx` ON `categories` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `exerciseNameIdx` ON `exercises` (`name`);