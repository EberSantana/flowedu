CREATE TABLE `class_statuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduledClassId` int NOT NULL,
	`weekNumber` int NOT NULL,
	`year` int NOT NULL,
	`status` enum('given','not_given','cancelled') NOT NULL,
	`reason` text,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `class_statuses_id` PRIMARY KEY(`id`)
);
