-- Tabelas já existentes, pulando...
-- CREATE TABLE `belt_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`belt` varchar(50) NOT NULL,
	`pointsAtAchievement` int NOT NULL,
	`achievedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `belt_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
-- CREATE TABLE `review_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int,
	`moduleId` int,
	`totalQuestionsReviewed` int NOT NULL DEFAULT 0,
	`questionsRetaken` int NOT NULL DEFAULT 0,
	`improvementRate` int NOT NULL DEFAULT 0,
	`sessionDuration` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `review_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
-- CREATE TABLE `shop_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`category` enum('hat','glasses','accessory','background','special') NOT NULL,
	`price` int NOT NULL,
	`imageUrl` text,
	`svgData` text,
	`requiredBelt` varchar(20) DEFAULT 'white',
	`isActive` boolean NOT NULL DEFAULT true,
	`isRare` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shop_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
-- CREATE TABLE `student_equipped_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`itemId` int NOT NULL,
	`slot` enum('hat','glasses','accessory','background') NOT NULL,
	`equippedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_equipped_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_equipped_items_studentId_slot_unique` UNIQUE(`studentId`,`slot`)
);
--> statement-breakpoint
-- CREATE TABLE `student_exercise_answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attemptId` int NOT NULL,
	`questionNumber` int NOT NULL,
	`questionType` varchar(50) NOT NULL,
	`studentAnswer` text NOT NULL,
	`correctAnswer` text,
	`isCorrect` boolean,
	`pointsAwarded` int NOT NULL DEFAULT 0,
	`teacherFeedback` text,
	`aiFeedback` text,
	`studyTips` text,
	`aiScore` int,
	`aiConfidence` int,
	`aiAnalysis` text,
	`needsReview` boolean DEFAULT false,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`finalScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_exercise_answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
-- CREATE TABLE `student_exercise_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exerciseId` int NOT NULL,
	`studentId` int NOT NULL,
	`attemptNumber` int NOT NULL,
	`answers` json NOT NULL,
	`score` int NOT NULL,
	`correctAnswers` int NOT NULL,
	`totalQuestions` int NOT NULL,
	`pointsEarned` int NOT NULL,
	`timeSpent` int,
	`status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_exercise_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
-- CREATE TABLE `student_exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moduleId` int NOT NULL,
	`subjectId` int NOT NULL,
	`teacherId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`exerciseData` json NOT NULL,
	`totalQuestions` int NOT NULL,
	`totalPoints` int NOT NULL,
	`passingScore` int NOT NULL DEFAULT 60,
	`maxAttempts` int NOT NULL DEFAULT 3,
	`timeLimit` int,
	`showAnswersAfter` boolean NOT NULL DEFAULT true,
	`availableFrom` timestamp NOT NULL,
	`availableTo` timestamp,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
-- CREATE TABLE `student_purchased_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`itemId` int NOT NULL,
	`purchasedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_purchased_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_purchased_items_studentId_itemId_unique` UNIQUE(`studentId`,`itemId`)
);
--> statement-breakpoint
-- CREATE TABLE `student_subject_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int NOT NULL,
	`badgeId` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_subject_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
-- CREATE TABLE `student_subject_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int NOT NULL,
	`totalPoints` int NOT NULL DEFAULT 0,
	`currentBelt` varchar(50) NOT NULL DEFAULT 'white',
	`streakDays` int NOT NULL DEFAULT 0,
	`lastActivityDate` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_subject_points_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
-- CREATE TABLE `subject_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectId` int NOT NULL,
	`badgeKey` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`iconUrl` varchar(255),
	`requiredPoints` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subject_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
-- CREATE TABLE `subject_points_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int NOT NULL,
	`points` int NOT NULL,
	`activityType` varchar(50) NOT NULL,
	`activityId` int,
	`description` text,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subject_points_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `computational_thinking_scores` DROP INDEX `computational_thinking_scores_studentId_dimension_unique`;--> statement-breakpoint
ALTER TABLE `computational_thinking_scores` ADD `subjectId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `ct_exercises` ADD `subjectId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `ct_submissions` ADD `subjectId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `avatarGender` enum('male','female') DEFAULT 'male' NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `avatarSkinTone` varchar(20) DEFAULT 'light';--> statement-breakpoint
ALTER TABLE `students` ADD `avatarKimonoColor` varchar(20) DEFAULT 'white';--> statement-breakpoint
ALTER TABLE `students` ADD `avatarHairStyle` varchar(20) DEFAULT 'short';--> statement-breakpoint
ALTER TABLE `students` ADD `avatarHairColor` varchar(20) DEFAULT 'black';--> statement-breakpoint
ALTER TABLE `students` ADD `avatarKimonoStyle` varchar(20) DEFAULT 'traditional';--> statement-breakpoint
ALTER TABLE `students` ADD `avatarHeadAccessory` varchar(20) DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `students` ADD `avatarExpression` varchar(20) DEFAULT 'neutral';--> statement-breakpoint
ALTER TABLE `students` ADD `avatarPose` varchar(20) DEFAULT 'standing';--> statement-breakpoint
ALTER TABLE `students` ADD `avatarAccessories` text;--> statement-breakpoint
ALTER TABLE `subjects` ADD `computationalThinkingEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `computational_thinking_scores` ADD CONSTRAINT `computational_thinking_scores_studentId_subjectId_dimension_unique` UNIQUE(`studentId`,`subjectId`,`dimension`);