CREATE TABLE IF NOT EXISTS `personal_records` (
	`id` integer PRIMARY KEY NOT NULL,
	`set_id` integer NOT NULL,
	`exercise_id` integer NOT NULL,
	FOREIGN KEY (`set_id`) REFERENCES `sets_data`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `prSetIdx` ON `personal_records` (`set_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `prExerciseIdx` ON `personal_records` (`exercise_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `exerciseNameIdx` ON `exercises` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `setIdIdx` ON `sets_data` (`id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `setDateIdx` ON `sets_data` (`date`);