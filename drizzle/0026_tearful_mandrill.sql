CREATE TABLE `student_subject_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int NOT NULL,
	`badgeId` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_subject_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_subject_points` (
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
CREATE TABLE `subject_badges` (
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
CREATE TABLE `subject_points_history` (
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
