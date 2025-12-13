CREATE TABLE `subjectEnrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int NOT NULL,
	`enrolledAt` timestamp DEFAULT (now()),
	`userId` int NOT NULL,
	CONSTRAINT `subjectEnrollments_id` PRIMARY KEY(`id`)
);
