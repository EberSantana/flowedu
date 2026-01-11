CREATE TABLE `content_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subjectId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`color` varchar(7) DEFAULT '#3b82f6',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_tags_userId_subjectId_name_unique` UNIQUE(`userId`,`subjectId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `exercise_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exerciseId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exercise_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `exercise_tags_exerciseId_tagId_unique` UNIQUE(`exerciseId`,`tagId`)
);
--> statement-breakpoint
CREATE TABLE `review_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`queueItemId` int NOT NULL,
	`answerId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`wasCorrect` boolean NOT NULL,
	`timeSpent` int NOT NULL,
	`confidenceLevel` int,
	`selfRating` enum('again','hard','good','easy'),
	`notes` text,
	`previousEaseFactor` float,
	`newEaseFactor` float,
	`previousInterval` int,
	`newInterval` int,
	`reviewedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `review_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `review_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`notificationType` enum('daily_reminder','overdue_items','streak_milestone','mastery_achieved','goal_completed') NOT NULL,
	`relatedSubjectId` int,
	`relatedExerciseId` int,
	`itemsCount` int DEFAULT 0,
	`isRead` boolean NOT NULL DEFAULT false,
	`isSent` boolean NOT NULL DEFAULT false,
	`sentAt` timestamp,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `review_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `review_statistics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int,
	`totalReviewsCompleted` int NOT NULL DEFAULT 0,
	`totalTimeSpent` int NOT NULL DEFAULT 0,
	`averageSessionTime` int NOT NULL DEFAULT 0,
	`correctReviews` int NOT NULL DEFAULT 0,
	`incorrectReviews` int NOT NULL DEFAULT 0,
	`successRate` int NOT NULL DEFAULT 0,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastReviewDate` date,
	`itemsMastered` int NOT NULL DEFAULT 0,
	`itemsInProgress` int NOT NULL DEFAULT 0,
	`itemsPending` int NOT NULL DEFAULT 0,
	`dailyGoal` int NOT NULL DEFAULT 10,
	`weeklyGoal` int NOT NULL DEFAULT 50,
	`dailyProgress` int NOT NULL DEFAULT 0,
	`weeklyProgress` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `review_statistics_id` PRIMARY KEY(`id`),
	CONSTRAINT `review_statistics_studentId_unique` UNIQUE(`studentId`)
);
--> statement-breakpoint
CREATE TABLE `smart_review_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`answerId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`subjectId` int NOT NULL,
	`easeFactor` float NOT NULL DEFAULT 2.5,
	`interval` int NOT NULL DEFAULT 1,
	`repetitions` int NOT NULL DEFAULT 0,
	`priority` int NOT NULL DEFAULT 50,
	`difficultyScore` int NOT NULL DEFAULT 50,
	`lastReviewedAt` timestamp,
	`nextReviewDate` timestamp NOT NULL,
	`addedToQueueAt` timestamp NOT NULL DEFAULT (now()),
	`reviewCount` int NOT NULL DEFAULT 0,
	`successRate` int NOT NULL DEFAULT 0,
	`status` enum('pending','reviewing','mastered','archived') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `smart_review_queue_id` PRIMARY KEY(`id`),
	CONSTRAINT `smart_review_queue_studentId_answerId_unique` UNIQUE(`studentId`,`answerId`)
);
--> statement-breakpoint
CREATE TABLE `study_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int,
	`sessionType` enum('quick_review','full_review','focused_practice','random_practice') NOT NULL,
	`totalItems` int NOT NULL DEFAULT 0,
	`itemsCompleted` int NOT NULL DEFAULT 0,
	`itemsCorrect` int NOT NULL DEFAULT 0,
	`totalTime` int NOT NULL DEFAULT 0,
	`averageTimePerItem` int NOT NULL DEFAULT 0,
	`sessionScore` int NOT NULL DEFAULT 0,
	`pointsEarned` int NOT NULL DEFAULT 0,
	`status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `study_sessions_id` PRIMARY KEY(`id`)
);
