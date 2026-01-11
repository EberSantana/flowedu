CREATE TABLE `learning_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`topicId` int NOT NULL,
	`reason` text NOT NULL,
	`confidence` int NOT NULL,
	`priority` enum('low','medium','high','urgent') NOT NULL,
	`basedOn` text NOT NULL,
	`status` enum('pending','accepted','rejected','completed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `module_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`moduleId` int NOT NULL,
	`badgeLevel` enum('bronze','silver','gold','platinum') NOT NULL,
	`completionPercentage` int NOT NULL,
	`averageScore` int NOT NULL,
	`timeSpent` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `module_badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `module_badges_studentId_moduleId_unique` UNIQUE(`studentId`,`moduleId`)
);
--> statement-breakpoint
CREATE TABLE `specialization_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`specialization` enum('code_warrior','interface_master','data_sage','system_architect') NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(100) NOT NULL,
	`rarity` enum('common','rare','epic','legendary') NOT NULL,
	`requirement` text NOT NULL,
	`points` int NOT NULL DEFAULT 50,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `specialization_achievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `specialization_achievements_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `student_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`achievementId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`progress` int NOT NULL DEFAULT 100,
	CONSTRAINT `student_achievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_achievements_studentId_achievementId_unique` UNIQUE(`studentId`,`achievementId`)
);
--> statement-breakpoint
CREATE TABLE `topic_progress_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`topicId` int NOT NULL,
	`score` int NOT NULL,
	`timeSpent` int NOT NULL,
	`attemptsCount` int NOT NULL DEFAULT 1,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `topic_progress_history_id` PRIMARY KEY(`id`)
);
