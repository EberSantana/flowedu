ALTER TABLE `learning_topics` ADD `theoryHours` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `learning_topics` ADD `practiceHours` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `learning_topics` ADD `individualWorkHours` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `learning_topics` ADD `teamWorkHours` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `subjects` ADD `workload` int DEFAULT 60;