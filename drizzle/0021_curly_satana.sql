CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`category` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `badges_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `gamification_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gamification_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `points_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`points` int NOT NULL,
	`reason` varchar(255) NOT NULL,
	`activityType` varchar(100) NOT NULL,
	`relatedId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `points_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`badgeId` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`totalPoints` int NOT NULL DEFAULT 0,
	`currentBelt` varchar(50) NOT NULL DEFAULT 'white',
	`streakDays` int NOT NULL DEFAULT 0,
	`lastActivityDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_points_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_points_studentId_unique` UNIQUE(`studentId`)
);
