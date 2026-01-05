CREATE TABLE `ai_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`userId` int NOT NULL,
	`subjectId` int,
	`insightType` enum('recommendation','prediction','alert','strength','weakness','opportunity','risk','achievement','trend') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`actionable` boolean NOT NULL DEFAULT false,
	`actionSuggestion` text,
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`confidence` float NOT NULL,
	`relatedData` json,
	`dismissed` boolean NOT NULL DEFAULT false,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`userId` int NOT NULL,
	`subjectId` int,
	`alertType` enum('performance_drop','low_engagement','missed_deadlines','struggling','at_risk','exceptional_progress','needs_attention','pattern_change','milestone_reached','inactivity') NOT NULL,
	`severity` enum('info','warning','urgent','critical') NOT NULL DEFAULT 'info',
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`recommendedAction` text,
	`relatedInsightId` int,
	`acknowledged` boolean NOT NULL DEFAULT false,
	`acknowledgedAt` timestamp,
	`resolved` boolean NOT NULL DEFAULT false,
	`resolvedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_patterns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`userId` int NOT NULL,
	`subjectId` int,
	`patternType` enum('learning_pace','preferred_time','difficulty_areas','strength_areas','engagement_pattern','submission_pattern','improvement_trend','struggle_pattern','consistency','collaboration') NOT NULL,
	`patternDescription` text NOT NULL,
	`confidence` float NOT NULL,
	`evidence` json,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_patterns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`userId` int NOT NULL,
	`subjectId` int,
	`metricType` enum('overall_performance','exercise_accuracy','quiz_performance','attendance_rate','submission_rate','engagement_score','improvement_rate','consistency_score','collaboration_score','ct_skills') NOT NULL,
	`value` double NOT NULL,
	`previousValue` double,
	`trend` enum('improving','stable','declining'),
	`percentile` float,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	`periodStart` date NOT NULL,
	`periodEnd` date NOT NULL,
	CONSTRAINT `performance_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_behaviors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`userId` int NOT NULL,
	`subjectId` int,
	`behaviorType` enum('exercise_completion','quiz_attempt','topic_access','material_download','doubt_posted','comment_posted','assignment_submission','attendance','late_submission','improvement_shown','struggle_detected','engagement_high','engagement_low') NOT NULL,
	`behaviorData` json,
	`score` float,
	`metadata` text,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_behaviors_id` PRIMARY KEY(`id`)
);
