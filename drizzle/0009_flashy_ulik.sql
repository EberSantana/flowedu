CREATE TABLE `assignment_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int NOT NULL,
	`studentId` int NOT NULL,
	`content` text,
	`fileUrl` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`score` int,
	`feedback` text,
	`status` enum('pending','graded','late') NOT NULL DEFAULT 'pending',
	`gradedAt` timestamp,
	`gradedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assignment_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int NOT NULL,
	`classId` int,
	`professorId` int NOT NULL,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('active','completed','dropped') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_topic_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`topicId` int NOT NULL,
	`status` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
	`completedAt` timestamp,
	`selfAssessment` enum('understood','have_doubts','need_help'),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_topic_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `topic_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topicId` int NOT NULL,
	`professorId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`type` enum('exercise','essay','project','quiz','practical') NOT NULL,
	`dueDate` timestamp,
	`maxScore` int NOT NULL DEFAULT 100,
	`isRequired` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `topic_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `topic_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topicId` int NOT NULL,
	`studentId` int NOT NULL,
	`professorId` int NOT NULL,
	`authorId` int NOT NULL,
	`authorType` enum('professor','student') NOT NULL,
	`content` text NOT NULL,
	`isPrivate` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `topic_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `topic_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topicId` int NOT NULL,
	`professorId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`type` enum('pdf','video','link','presentation','document','other') NOT NULL,
	`url` text NOT NULL,
	`fileSize` int,
	`orderIndex` int NOT NULL DEFAULT 0,
	`isRequired` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `topic_materials_id` PRIMARY KEY(`id`)
);
