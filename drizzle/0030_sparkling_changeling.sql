CREATE TABLE `review_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int,
	`moduleId` int,
	`totalQuestionsReviewed` int NOT NULL DEFAULT 0,
	`questionsRetaken` int NOT NULL DEFAULT 0,
	`improvementRate` int NOT NULL DEFAULT 0,
	`sessionDuration` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `review_sessions_id` PRIMARY KEY(`id`)
);
