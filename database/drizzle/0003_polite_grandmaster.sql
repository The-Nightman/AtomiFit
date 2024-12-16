ALTER TABLE `exercises` RENAME COLUMN "unit" TO "weight_unit";--> statement-breakpoint
ALTER TABLE `sets_data` RENAME COLUMN "unit" TO "weight_unit";--> statement-breakpoint
ALTER TABLE `sets_data` ADD `distance_unit` text;