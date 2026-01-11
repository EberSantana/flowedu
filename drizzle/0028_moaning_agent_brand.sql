CREATE TABLE `challenge_rankings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`studentId` int NOT NULL,
	`rank` int NOT NULL,
	`totalScore` int NOT NULL,
	`rewardCoins` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `challenge_rankings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `challenge_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`studentId` int NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`completionTime` int,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `challenge_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weekly_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`challengeType` enum('code','logic','speed','precision','collaborative') NOT NULL,
	`difficulty` enum('easy','medium','hard','expert') NOT NULL DEFAULT 'medium',
	`coinMultiplier` float NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weekly_challenges_id` PRIMARY KEY(`id`)
);
