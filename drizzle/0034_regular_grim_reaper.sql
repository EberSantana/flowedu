CREATE TABLE `student_learning_journal` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`topicId` int NOT NULL,
	`entryDate` timestamp NOT NULL DEFAULT (now()),
	`content` text NOT NULL,
	`tags` text,
	`mood` enum('great','good','neutral','confused','frustrated'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_learning_journal_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_topic_doubts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`topicId` int NOT NULL,
	`professorId` int NOT NULL,
	`question` text NOT NULL,
	`context` text,
	`status` enum('pending','answered','resolved') NOT NULL DEFAULT 'pending',
	`answer` text,
	`answeredAt` timestamp,
	`isPrivate` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_topic_doubts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `learning_topics` ADD `difficulty` enum('easy','medium','hard') DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE `learning_topics` ADD `prerequisiteTopicIds` text;--> statement-breakpoint
ALTER TABLE `topic_materials` ADD `contentType` enum('text','video','exercise','quiz','project') DEFAULT 'text';