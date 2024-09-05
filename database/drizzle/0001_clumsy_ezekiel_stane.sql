CREATE TABLE IF NOT EXISTS `sets_data` (
	`id` integer PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`exercise_id` integer NOT NULL,
	`weight` real,
	`reps` integer,
	`distance` real,
	`time` integer,
	`notes` text,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
