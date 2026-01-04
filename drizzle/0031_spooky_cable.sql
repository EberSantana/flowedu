ALTER TABLE `computational_thinking_scores` DROP INDEX `computational_thinking_scores_studentId_dimension_unique`;--> statement-breakpoint
ALTER TABLE `computational_thinking_scores` ADD `subjectId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `ct_exercises` ADD `subjectId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `ct_submissions` ADD `subjectId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `subjects` ADD `computationalThinkingEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `computational_thinking_scores` ADD CONSTRAINT `computational_thinking_scores_studentId_subjectId_dimension_unique` UNIQUE(`studentId`,`subjectId`,`dimension`);