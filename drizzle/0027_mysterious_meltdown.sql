CREATE TABLE `hidden_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(50) NOT NULL,
	`rewardCoins` int NOT NULL DEFAULT 0,
	`rarity` enum('common','rare','epic','legendary') NOT NULL DEFAULT 'common',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hidden_achievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `hidden_achievements_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `student_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`actionType` varchar(50) NOT NULL,
	`actionData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_hidden_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`achievementId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`progress` int DEFAULT 0,
	CONSTRAINT `student_hidden_achievements_id` PRIMARY KEY(`id`)
);
