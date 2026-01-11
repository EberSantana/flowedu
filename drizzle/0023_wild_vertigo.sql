CREATE TABLE `computational_thinking_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`dimension` enum('decomposition','pattern_recognition','abstraction','algorithms') NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`exercisesCompleted` int NOT NULL DEFAULT 0,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `computational_thinking_scores_id` PRIMARY KEY(`id`),
	CONSTRAINT `computational_thinking_scores_studentId_dimension_unique` UNIQUE(`studentId`,`dimension`)
);
--> statement-breakpoint
CREATE TABLE `ct_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`dimension` enum('decomposition','pattern_recognition','abstraction','algorithms','all') NOT NULL,
	`requirement` text NOT NULL,
	`icon` varchar(50) NOT NULL,
	`color` varchar(50) NOT NULL,
	`points` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ct_badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `ct_badges_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `ct_exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`dimension` enum('decomposition','pattern_recognition','abstraction','algorithms') NOT NULL,
	`difficulty` enum('easy','medium','hard') NOT NULL,
	`content` text NOT NULL,
	`expectedAnswer` text,
	`points` int NOT NULL DEFAULT 10,
	`createdBy` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ct_exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ct_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`answer` text NOT NULL,
	`score` int NOT NULL,
	`feedback` text,
	`timeSpent` int,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ct_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_ct_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`badgeId` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_ct_badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_ct_badges_studentId_badgeId_unique` UNIQUE(`studentId`,`badgeId`)
);
