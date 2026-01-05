CREATE TABLE `collaborative_tools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`url` text NOT NULL,
	`logoUrl` text,
	`tips` text,
	`isPremium` boolean NOT NULL DEFAULT false,
	`isFavorite` boolean NOT NULL DEFAULT false,
	`usageCount` int NOT NULL DEFAULT 0,
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `collaborative_tools_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interactive_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`objectives` text,
	`subjects` text,
	`methodology` varchar(100),
	`startDate` date,
	`endDate` date,
	`status` enum('planning','active','completed','cancelled') NOT NULL DEFAULT 'planning',
	`deliverables` text,
	`resources` text,
	`color` varchar(7) DEFAULT '#3b82f6',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interactive_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`dueDate` date,
	`status` enum('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
	`assignedStudents` text,
	`toolId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`studentId` int NOT NULL,
	`role` varchar(100),
	`contribution` text,
	`engagementScore` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_students_id` PRIMARY KEY(`id`)
);
