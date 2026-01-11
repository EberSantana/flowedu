CREATE TABLE `practice_question_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`practiceQuestionId` int NOT NULL,
	`studentId` int NOT NULL,
	`answerText` text,
	`answerPhotoUrl` text,
	`answerAudioUrl` text,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`timeSpent` int NOT NULL,
	`status` enum('correct','incorrect','partial','pending_review') NOT NULL DEFAULT 'pending_review',
	`isCorrect` boolean DEFAULT false,
	`score` int,
	`beltAtAttempt` varchar(50),
	`difficultyAtAttempt` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `practice_question_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `practice_question_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attemptId` int NOT NULL,
	`teacherId` int NOT NULL,
	`feedbackText` text NOT NULL,
	`score` int,
	`suggestions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `practice_question_feedback_id` PRIMARY KEY(`id`),
	CONSTRAINT `practice_question_feedback_attemptId_unique` UNIQUE(`attemptId`)
);
--> statement-breakpoint
CREATE TABLE `practice_question_hints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attemptId` int NOT NULL,
	`hintText` text NOT NULL,
	`hintType` enum('improvement','encouragement','concept_review','strategy') NOT NULL DEFAULT 'improvement',
	`confidence` int NOT NULL DEFAULT 80,
	`analysisData` text,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `practice_question_hints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `practice_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subjectId` int,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`difficulty` enum('easy','medium','hard','expert') NOT NULL DEFAULT 'medium',
	`belt` enum('white','yellow','orange','green','blue','purple','brown','black') NOT NULL DEFAULT 'white',
	`tags` text,
	`expectedAnswer` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `practice_questions_id` PRIMARY KEY(`id`)
);
