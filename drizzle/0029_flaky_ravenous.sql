CREATE TABLE `specialization_skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`specialization` enum('code_warrior','interface_master','data_sage','system_architect') NOT NULL,
	`skillKey` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`tier` int NOT NULL,
	`requiredLevel` int NOT NULL,
	`bonusType` varchar(50) NOT NULL,
	`bonusValue` double NOT NULL,
	`prerequisiteSkills` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `specialization_skills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`skillId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_skills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_specializations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`specialization` enum('code_warrior','interface_master','data_sage','system_architect') NOT NULL,
	`chosenAt` timestamp NOT NULL DEFAULT (now()),
	`level` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_specializations_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_specializations_studentId_unique` UNIQUE(`studentId`)
);
--> statement-breakpoint
ALTER TABLE `student_points` ADD `honorificTitle` varchar(100);