CREATE TABLE `belt_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`belt` varchar(50) NOT NULL,
	`pointsAtAchievement` int NOT NULL,
	`achievedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `belt_history_id` PRIMARY KEY(`id`)
);
