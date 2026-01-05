CREATE TABLE `teacher_activities_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`activityType` enum('class_taught','planning','grading','meeting','course_creation','material_creation','student_support','professional_dev','other') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`points` int NOT NULL,
	`duration` int,
	`activityDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teacher_activities_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teacher_belt_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`previousBelt` varchar(50) NOT NULL,
	`newBelt` varchar(50) NOT NULL,
	`previousLevel` int NOT NULL,
	`newLevel` int NOT NULL,
	`pointsAtUpgrade` int NOT NULL,
	`upgradedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teacher_belt_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teacher_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalPoints` int NOT NULL DEFAULT 0,
	`currentBelt` varchar(50) NOT NULL DEFAULT 'white',
	`beltLevel` int NOT NULL DEFAULT 1,
	`lastBeltUpgrade` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teacher_points_id` PRIMARY KEY(`id`),
	CONSTRAINT `teacher_points_userId_unique` UNIQUE(`userId`)
);
