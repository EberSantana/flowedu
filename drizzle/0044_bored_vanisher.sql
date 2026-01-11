ALTER TABLE `student_exercise_answers` ADD `detailedExplanation` text;--> statement-breakpoint
ALTER TABLE `student_exercise_answers` ADD `studyStrategy` text;--> statement-breakpoint
ALTER TABLE `student_exercise_answers` ADD `relatedConcepts` text;--> statement-breakpoint
ALTER TABLE `student_exercise_answers` ADD `additionalResources` text;--> statement-breakpoint
ALTER TABLE `student_exercise_answers` ADD `practiceExamples` text;--> statement-breakpoint
ALTER TABLE `student_exercise_answers` ADD `commonMistakes` text;--> statement-breakpoint
ALTER TABLE `student_exercise_answers` ADD `difficultyLevel` int;--> statement-breakpoint
ALTER TABLE `student_exercise_answers` ADD `timeToMaster` int;--> statement-breakpoint
ALTER TABLE `student_exercise_answers` ADD `masteryStatus` enum('not_started','studying','practicing','mastered') DEFAULT 'not_started';--> statement-breakpoint
ALTER TABLE `student_exercise_answers` ADD `lastReviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `student_exercise_answers` ADD `reviewCount` int DEFAULT 0 NOT NULL;