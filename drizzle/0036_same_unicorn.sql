ALTER TABLE `student_points` ADD `beltAnimationSeen` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `student_points` ADD `lastBeltUpgrade` timestamp;--> statement-breakpoint
ALTER TABLE `student_points` ADD `pointsMultiplier` double DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `student_points` ADD `consecutivePerfectScores` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `student_points` ADD `totalExercisesCompleted` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `student_points` ADD `totalPerfectScores` int DEFAULT 0 NOT NULL;