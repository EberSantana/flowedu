ALTER TABLE `student_exercise_answers` ADD `aiScore` int;--> statement-breakpoint
ALTER TABLE `student_exercise_answers` ADD `aiConfidence` int;--> statement-breakpoint
ALTER TABLE `student_exercise_answers` ADD `aiAnalysis` text;--> statement-breakpoint
ALTER TABLE `student_exercise_answers` ADD `needsReview` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `student_exercise_answers` ADD `reviewedBy` int;--> statement-breakpoint
ALTER TABLE `student_exercise_answers` ADD `reviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `student_exercise_answers` ADD `finalScore` int;