CREATE TABLE IF NOT EXISTS `distance` (
	`id` integer PRIMARY KEY NOT NULL,
	`exercise_id` integer NOT NULL,
	`workout_id` integer NOT NULL,
	`distance` real NOT NULL,
	`notes` text NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `distance_time` (
	`id` integer PRIMARY KEY NOT NULL,
	`exercise_id` integer NOT NULL,
	`workout_id` integer NOT NULL,
	`distance` real NOT NULL,
	`time` integer NOT NULL,
	`notes` text NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `reps` (
	`id` integer PRIMARY KEY NOT NULL,
	`exercise_id` integer NOT NULL,
	`workout_id` integer NOT NULL,
	`reps` integer NOT NULL,
	`notes` text NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `reps_distance` (
	`id` integer PRIMARY KEY NOT NULL,
	`exercise_id` integer NOT NULL,
	`workout_id` integer NOT NULL,
	`reps` integer NOT NULL,
	`distance` real NOT NULL,
	`notes` text NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `reps_time` (
	`id` integer PRIMARY KEY NOT NULL,
	`exercise_id` integer NOT NULL,
	`workout_id` integer NOT NULL,
	`reps` integer NOT NULL,
	`time` integer NOT NULL,
	`notes` text NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `time` (
	`id` integer PRIMARY KEY NOT NULL,
	`exercise_id` integer NOT NULL,
	`workout_id` integer NOT NULL,
	`time` integer NOT NULL,
	`notes` text NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `weight` (
	`id` integer PRIMARY KEY NOT NULL,
	`exercise_id` integer NOT NULL,
	`workout_id` integer NOT NULL,
	`weight` real NOT NULL,
	`notes` text NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `weight_distance` (
	`id` integer PRIMARY KEY NOT NULL,
	`exercise_id` integer NOT NULL,
	`workout_id` integer NOT NULL,
	`weight` real NOT NULL,
	`distance` real NOT NULL,
	`notes` text NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `weight_reps` (
	`id` integer PRIMARY KEY NOT NULL,
	`exercise_id` integer NOT NULL,
	`workout_id` integer NOT NULL,
	`weight` real NOT NULL,
	`reps` integer NOT NULL,
	`notes` text NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `weight_time` (
	`id` integer PRIMARY KEY NOT NULL,
	`exercise_id` integer NOT NULL,
	`workout_id` integer NOT NULL,
	`weight` real NOT NULL,
	`time` integer NOT NULL,
	`notes` text NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `workouts` (
	`id` integer PRIMARY KEY NOT NULL,
	`date` text NOT NULL
);
