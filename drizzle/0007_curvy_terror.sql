CREATE TABLE `learning_modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`orderIndex` int NOT NULL DEFAULT 0,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_modules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_topics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moduleId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
	`estimatedHours` int DEFAULT 0,
	`orderIndex` int NOT NULL DEFAULT 0,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_topics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `topic_class_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topicId` int NOT NULL,
	`scheduledClassId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `topic_class_links_id` PRIMARY KEY(`id`)
);
