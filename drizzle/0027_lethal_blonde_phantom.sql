CREATE TABLE `student_exercise_answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attemptId` int NOT NULL,
	`questionNumber` int NOT NULL,
	`questionType` varchar(50) NOT NULL,
	`studentAnswer` text NOT NULL,
	`correctAnswer` text,
	`isCorrect` boolean,
	`pointsAwarded` int NOT NULL DEFAULT 0,
	`teacherFeedback` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_exercise_answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_exercise_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exerciseId` int NOT NULL,
	`studentId` int NOT NULL,
	`attemptNumber` int NOT NULL,
	`answers` json NOT NULL,
	`score` int NOT NULL,
	`correctAnswers` int NOT NULL,
	`totalQuestions` int NOT NULL,
	`pointsEarned` int NOT NULL,
	`timeSpent` int,
	`status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_exercise_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moduleId` int NOT NULL,
	`subjectId` int NOT NULL,
	`teacherId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`exerciseData` json NOT NULL,
	`totalQuestions` int NOT NULL,
	`totalPoints` int NOT NULL,
	`passingScore` int NOT NULL DEFAULT 60,
	`maxAttempts` int NOT NULL DEFAULT 3,
	`timeLimit` int,
	`showAnswersAfter` boolean NOT NULL DEFAULT true,
	`availableFrom` timestamp NOT NULL,
	`availableTo` timestamp,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_exercises_id` PRIMARY KEY(`id`)
);
