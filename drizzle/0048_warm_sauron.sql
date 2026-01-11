CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(50) NOT NULL,
	`category` enum('speed','accuracy','streak','completion','special') NOT NULL,
	`requirement` int NOT NULL,
	`rewardPoints` int NOT NULL DEFAULT 0,
	`rewardMultiplier` double NOT NULL DEFAULT 0,
	`isHidden` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `achievements_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `active_methodologies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`url` text NOT NULL,
	`tips` text,
	`logoUrl` text,
	`isFavorite` boolean NOT NULL DEFAULT false,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `active_methodologies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_analysis_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cacheKey` varchar(255) NOT NULL,
	`analysisType` varchar(50) NOT NULL,
	`inputData` text NOT NULL,
	`resultData` text NOT NULL,
	`expiresAt` timestamp,
	`hitCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastAccessedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_analysis_cache_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_analysis_cache_userId_analysisType_cacheKey_unique` UNIQUE(`userId`,`analysisType`,`cacheKey`)
);
--> statement-breakpoint
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
CREATE TABLE `announcementReads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`announcementId` int NOT NULL,
	`studentId` int NOT NULL,
	`readAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `announcementReads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`isImportant` boolean NOT NULL DEFAULT false,
	`subjectId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`admin_id` int NOT NULL,
	`admin_name` varchar(255) NOT NULL,
	`action` varchar(100) NOT NULL,
	`target_user_id` int,
	`target_user_name` varchar(255),
	`old_data` text,
	`new_data` text,
	`ip_address` varchar(45),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(50) NOT NULL,
	`category` enum('streak','accuracy','speed','completion','special') NOT NULL,
	`requirement` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `badges_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `belt_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`belt` varchar(50) NOT NULL,
	`pointsAtAchievement` int NOT NULL,
	`achievedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `belt_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `belts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`level` int NOT NULL,
	`color` varchar(7) NOT NULL,
	`pointsRequired` int NOT NULL,
	`description` text,
	`icon` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `belts_id` PRIMARY KEY(`id`),
	CONSTRAINT `belts_name_unique` UNIQUE(`name`),
	CONSTRAINT `belts_level_unique` UNIQUE(`level`)
);
--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`eventDate` varchar(10) NOT NULL,
	`eventType` enum('holiday','commemorative','school_event','personal') NOT NULL,
	`isRecurring` int NOT NULL DEFAULT 0,
	`color` varchar(7) DEFAULT '#3b82f6',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendar_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `class_statuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduledClassId` int NOT NULL,
	`weekNumber` int NOT NULL,
	`year` int NOT NULL,
	`status` enum('given','not_given','cancelled') NOT NULL,
	`reason` text,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `class_statuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(20) NOT NULL,
	`description` text,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `classes_id` PRIMARY KEY(`id`),
	CONSTRAINT `classes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `coin_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`amount` int NOT NULL,
	`transactionType` enum('earn','spend','bonus','penalty') NOT NULL,
	`source` varchar(100),
	`description` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coin_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `computational_thinking_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int NOT NULL,
	`dimension` enum('decomposition','pattern_recognition','abstraction','algorithms') NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`exercisesCompleted` int NOT NULL DEFAULT 0,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `computational_thinking_scores_id` PRIMARY KEY(`id`),
	CONSTRAINT `computational_thinking_scores_studentId_subjectId_dimension_unique` UNIQUE(`studentId`,`subjectId`,`dimension`)
);
--> statement-breakpoint
CREATE TABLE `content_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subjectId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`color` varchar(7) DEFAULT '#3b82f6',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_tags_userId_subjectId_name_unique` UNIQUE(`userId`,`subjectId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `ct_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`dimension` enum('decomposition','pattern_recognition','abstraction','algorithms','all') NOT NULL,
	`requirement` text NOT NULL,
	`icon` varchar(50) NOT NULL,
	`color` varchar(50) NOT NULL,
	`points` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ct_badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `ct_badges_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `ct_exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`dimension` enum('decomposition','pattern_recognition','abstraction','algorithms') NOT NULL,
	`difficulty` enum('easy','medium','hard') NOT NULL,
	`content` text NOT NULL,
	`expectedAnswer` text,
	`points` int NOT NULL DEFAULT 10,
	`createdBy` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ct_exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ct_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`answer` text NOT NULL,
	`score` int NOT NULL,
	`feedback` text,
	`timeSpent` int,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ct_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dashboard_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`quickActionsConfig` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dashboard_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exercise_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exerciseId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exercise_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `exercise_tags_exerciseId_tagId_unique` UNIQUE(`exerciseId`,`tagId`)
);
--> statement-breakpoint
CREATE TABLE `gamification_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gamification_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hidden_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(50) NOT NULL,
	`rewardCoins` int NOT NULL DEFAULT 0,
	`rarity` enum('common','rare','epic','legendary') NOT NULL DEFAULT 'common',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hidden_achievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `hidden_achievements_code_unique` UNIQUE(`code`)
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
CREATE TABLE `invite_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`createdBy` int NOT NULL,
	`usedBy` int,
	`maxUses` int NOT NULL DEFAULT 1,
	`currentUses` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`description` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invite_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `invite_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `learning_modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`orderIndex` int NOT NULL DEFAULT 0,
	`userId` int NOT NULL,
	`infographic_url` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_modules_id` PRIMARY KEY(`id`)
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
CREATE TABLE `learning_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`topicId` int NOT NULL,
	`reason` text NOT NULL,
	`confidence` int NOT NULL,
	`priority` enum('low','medium','high','urgent') NOT NULL,
	`basedOn` text NOT NULL,
	`status` enum('pending','accepted','rejected','completed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_topics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moduleId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
	`estimatedHours` int DEFAULT 0,
	`theoryHours` int DEFAULT 0,
	`practiceHours` int DEFAULT 0,
	`individualWorkHours` int DEFAULT 0,
	`teamWorkHours` int DEFAULT 0,
	`difficulty` enum('easy','medium','hard') DEFAULT 'medium',
	`prerequisiteTopicIds` text,
	`orderIndex` int NOT NULL DEFAULT 0,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_topics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `level_up_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`fromBeltId` int NOT NULL,
	`toBeltId` int NOT NULL,
	`pointsAtLevelUp` int NOT NULL,
	`timeTaken` int,
	`celebrationSeen` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `level_up_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `module_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`moduleId` int NOT NULL,
	`badgeLevel` enum('bronze','silver','gold','platinum') NOT NULL,
	`completionPercentage` int NOT NULL,
	`averageScore` int NOT NULL,
	`timeSpent` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `module_badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `module_badges_studentId_moduleId_unique` UNIQUE(`studentId`,`moduleId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('new_material','new_assignment','new_announcement','assignment_due','feedback_received','grade_received','comment_received') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`link` varchar(500),
	`relatedId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_token_unique` UNIQUE(`token`)
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
CREATE TABLE `points_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`points` int NOT NULL,
	`reason` varchar(255) NOT NULL,
	`activityType` varchar(100) NOT NULL,
	`relatedId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `points_history_id` PRIMARY KEY(`id`)
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
--> statement-breakpoint
CREATE TABLE `question_answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questionId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`isAccepted` boolean NOT NULL DEFAULT false,
	`helpful` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `question_answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`userId` int NOT NULL,
	`subjectId` int NOT NULL,
	`classId` int,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`status` enum('pending','answered','resolved') NOT NULL DEFAULT 'pending',
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`isAnonymous` boolean NOT NULL DEFAULT false,
	`viewCount` int NOT NULL DEFAULT 0,
	`answeredAt` timestamp,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `review_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`queueItemId` int NOT NULL,
	`answerId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`wasCorrect` boolean NOT NULL,
	`timeSpent` int NOT NULL,
	`confidenceLevel` int,
	`selfRating` enum('again','hard','good','easy'),
	`notes` text,
	`previousEaseFactor` float,
	`newEaseFactor` float,
	`previousInterval` int,
	`newInterval` int,
	`reviewedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `review_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `review_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`notificationType` enum('daily_reminder','overdue_items','streak_milestone','mastery_achieved','goal_completed') NOT NULL,
	`relatedSubjectId` int,
	`relatedExerciseId` int,
	`itemsCount` int DEFAULT 0,
	`isRead` boolean NOT NULL DEFAULT false,
	`isSent` boolean NOT NULL DEFAULT false,
	`sentAt` timestamp,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `review_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `review_statistics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int,
	`totalReviewsCompleted` int NOT NULL DEFAULT 0,
	`totalTimeSpent` int NOT NULL DEFAULT 0,
	`averageSessionTime` int NOT NULL DEFAULT 0,
	`correctReviews` int NOT NULL DEFAULT 0,
	`incorrectReviews` int NOT NULL DEFAULT 0,
	`successRate` int NOT NULL DEFAULT 0,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastReviewDate` date,
	`itemsMastered` int NOT NULL DEFAULT 0,
	`itemsInProgress` int NOT NULL DEFAULT 0,
	`itemsPending` int NOT NULL DEFAULT 0,
	`dailyGoal` int NOT NULL DEFAULT 10,
	`weeklyGoal` int NOT NULL DEFAULT 50,
	`dailyProgress` int NOT NULL DEFAULT 0,
	`weeklyProgress` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `review_statistics_id` PRIMARY KEY(`id`),
	CONSTRAINT `review_statistics_studentId_unique` UNIQUE(`studentId`)
);
--> statement-breakpoint
CREATE TABLE `scheduled_classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectId` int NOT NULL,
	`classId` int NOT NULL,
	`timeSlotId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`notes` text,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_classes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`color` varchar(7) NOT NULL,
	`displayOrder` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shifts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`category` enum('hat','glasses','accessory','background','special','power_up','certificate','unlock') NOT NULL,
	`price` int NOT NULL,
	`imageUrl` text,
	`svgData` text,
	`metadata` json,
	`requiredBelt` varchar(20) DEFAULT 'white',
	`requiredPoints` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`rarity` enum('common','rare','epic','legendary') NOT NULL DEFAULT 'common',
	`stock` int NOT NULL DEFAULT -1,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shop_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smart_review_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`answerId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`subjectId` int NOT NULL,
	`easeFactor` float NOT NULL DEFAULT 2.5,
	`interval` int NOT NULL DEFAULT 1,
	`repetitions` int NOT NULL DEFAULT 0,
	`priority` int NOT NULL DEFAULT 50,
	`difficultyScore` int NOT NULL DEFAULT 50,
	`lastReviewedAt` timestamp,
	`nextReviewDate` timestamp NOT NULL,
	`addedToQueueAt` timestamp NOT NULL DEFAULT (now()),
	`reviewCount` int NOT NULL DEFAULT 0,
	`successRate` int NOT NULL DEFAULT 0,
	`status` enum('pending','reviewing','mastered','archived') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `smart_review_queue_id` PRIMARY KEY(`id`),
	CONSTRAINT `smart_review_queue_studentId_answerId_unique` UNIQUE(`studentId`,`answerId`)
);
--> statement-breakpoint
CREATE TABLE `specialization_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`specialization` enum('code_warrior','interface_master','data_sage','system_architect') NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(100) NOT NULL,
	`rarity` enum('common','rare','epic','legendary') NOT NULL,
	`requirement` text NOT NULL,
	`points` int NOT NULL DEFAULT 50,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `specialization_achievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `specialization_achievements_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `specialization_skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`specialization` enum('code_warrior','interface_master','data_sage','system_architect') NOT NULL,
	`skillKey` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`tier` int NOT NULL,
	`requiredLevel` int NOT NULL,
	`bonusType` varchar(50) NOT NULL,
	`bonusValue` double NOT NULL,
	`prerequisiteSkills` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `specialization_skills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`achievementId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`notificationSeen` boolean NOT NULL DEFAULT false,
	CONSTRAINT `student_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`actionType` varchar(50) NOT NULL,
	`actionData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`classId` int NOT NULL,
	`scheduleId` int NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`status` enum('present','absent','justified') NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`badgeId` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_badges_id` PRIMARY KEY(`id`)
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
--> statement-breakpoint
CREATE TABLE `student_ct_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`badgeId` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_ct_badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_ct_badges_studentId_badgeId_unique` UNIQUE(`studentId`,`badgeId`)
);
--> statement-breakpoint
CREATE TABLE `student_class_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`classId` int NOT NULL,
	`userId` int NOT NULL,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_class_enrollments_id` PRIMARY KEY(`id`)
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
CREATE TABLE `student_equipped_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`itemId` int NOT NULL,
	`slot` enum('hat','glasses','accessory','background') NOT NULL,
	`equippedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_equipped_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_equipped_items_studentId_slot_unique` UNIQUE(`studentId`,`slot`)
);
--> statement-breakpoint
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
	`aiFeedback` text,
	`studyTips` text,
	`aiScore` int,
	`aiConfidence` int,
	`aiAnalysis` text,
	`needsReview` boolean DEFAULT false,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`finalScore` int,
	`detailedExplanation` text,
	`studyStrategy` text,
	`relatedConcepts` text,
	`additionalResources` text,
	`practiceExamples` text,
	`commonMistakes` text,
	`difficultyLevel` int,
	`timeToMaster` int,
	`masteryStatus` enum('not_started','studying','practicing','mastered') DEFAULT 'not_started',
	`lastReviewedAt` timestamp,
	`reviewCount` int NOT NULL DEFAULT 0,
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
--> statement-breakpoint
CREATE TABLE `student_hidden_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`achievementId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`progress` int DEFAULT 0,
	CONSTRAINT `student_hidden_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `student_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`totalPoints` int NOT NULL DEFAULT 0,
	`currentBelt` varchar(50) NOT NULL DEFAULT 'white',
	`streakDays` int NOT NULL DEFAULT 0,
	`lastActivityDate` timestamp,
	`honorificTitle` varchar(100),
	`beltAnimationSeen` boolean NOT NULL DEFAULT false,
	`lastBeltUpgrade` timestamp,
	`pointsMultiplier` double NOT NULL DEFAULT 1,
	`consecutivePerfectScores` int NOT NULL DEFAULT 0,
	`totalExercisesCompleted` int NOT NULL DEFAULT 0,
	`totalPerfectScores` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_points_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_points_studentId_unique` UNIQUE(`studentId`)
);
--> statement-breakpoint
CREATE TABLE `student_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`currentBeltId` int NOT NULL,
	`totalPoints` int NOT NULL DEFAULT 0,
	`pointsInCurrentBelt` int NOT NULL DEFAULT 0,
	`pointsMultiplier` double NOT NULL DEFAULT 1,
	`streakDays` int NOT NULL DEFAULT 0,
	`lastActivityDate` date,
	`totalExercisesCompleted` int NOT NULL DEFAULT 0,
	`totalPerfectScores` int NOT NULL DEFAULT 0,
	`consecutivePerfectScores` int NOT NULL DEFAULT 0,
	`fastestExerciseTime` int,
	`averageAccuracy` double NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_progress_studentId_unique` UNIQUE(`studentId`)
);
--> statement-breakpoint
CREATE TABLE `student_purchased_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`itemId` int NOT NULL,
	`purchasedAt` timestamp NOT NULL DEFAULT (now()),
	`isEquipped` boolean NOT NULL DEFAULT false,
	CONSTRAINT `student_purchased_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_purchased_items_studentId_itemId_unique` UNIQUE(`studentId`,`itemId`)
);
--> statement-breakpoint
CREATE TABLE `student_skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`skillId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_skills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_specialization_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`achievementId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`progress` int NOT NULL DEFAULT 100,
	CONSTRAINT `student_specialization_achievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_specialization_achievements_studentId_achievementId_unique` UNIQUE(`studentId`,`achievementId`)
);
--> statement-breakpoint
CREATE TABLE `student_specializations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`specialization` enum('code_warrior','interface_master','data_sage','system_architect') NOT NULL,
	`chosenAt` timestamp NOT NULL DEFAULT (now()),
	`level` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_specializations_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_specializations_studentId_unique` UNIQUE(`studentId`)
);
--> statement-breakpoint
CREATE TABLE `student_subject_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int NOT NULL,
	`badgeId` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_subject_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_subject_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int NOT NULL,
	`totalPoints` int NOT NULL DEFAULT 0,
	`currentBelt` varchar(50) NOT NULL DEFAULT 'white',
	`streakDays` int NOT NULL DEFAULT 0,
	`lastActivityDate` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_subject_points_id` PRIMARY KEY(`id`)
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
CREATE TABLE `student_wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`techCoins` int NOT NULL DEFAULT 0,
	`totalEarned` int NOT NULL DEFAULT 0,
	`totalSpent` int NOT NULL DEFAULT 0,
	`lastTransactionAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_wallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_wallets_studentId_unique` UNIQUE(`studentId`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`registrationNumber` varchar(50) NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`avatarGender` enum('male','female') NOT NULL DEFAULT 'male',
	`avatarSkinTone` varchar(20) DEFAULT 'light',
	`avatarKimonoColor` varchar(20) DEFAULT 'white',
	`avatarHairStyle` varchar(20) DEFAULT 'short',
	`avatarHairColor` varchar(20) DEFAULT 'black',
	`avatarKimonoStyle` varchar(20) DEFAULT 'traditional',
	`avatarHeadAccessory` varchar(20) DEFAULT 'none',
	`avatarExpression` varchar(20) DEFAULT 'neutral',
	`avatarPose` varchar(20) DEFAULT 'standing',
	`specialKimono` varchar(30) DEFAULT 'none',
	`avatarAccessories` text,
	`hd2dCharacterId` int NOT NULL DEFAULT 1,
	`hd2dUnlockedCharacters` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `study_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int,
	`sessionType` enum('quick_review','full_review','focused_practice','random_practice') NOT NULL,
	`totalItems` int NOT NULL DEFAULT 0,
	`itemsCompleted` int NOT NULL DEFAULT 0,
	`itemsCorrect` int NOT NULL DEFAULT 0,
	`totalTime` int NOT NULL DEFAULT 0,
	`averageTimePerItem` int NOT NULL DEFAULT 0,
	`sessionScore` int NOT NULL DEFAULT 0,
	`pointsEarned` int NOT NULL DEFAULT 0,
	`status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `study_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subject_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectId` int NOT NULL,
	`badgeKey` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`iconUrl` varchar(255),
	`requiredPoints` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subject_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subjectEnrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int NOT NULL,
	`enrolledAt` timestamp DEFAULT (now()),
	`userId` int NOT NULL,
	`status` enum('active','completed','dropped') NOT NULL DEFAULT 'active',
	CONSTRAINT `subjectEnrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subject_points_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int NOT NULL,
	`points` int NOT NULL,
	`activityType` varchar(50) NOT NULL,
	`activityId` int,
	`description` text,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subject_points_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(20) NOT NULL,
	`description` text,
	`color` varchar(7) DEFAULT '#3b82f6',
	`userId` int NOT NULL,
	`ementa` text,
	`generalObjective` text,
	`specificObjectives` text,
	`programContent` text,
	`basicBibliography` text,
	`complementaryBibliography` text,
	`coursePlanPdfUrl` text,
	`googleDriveUrl` text,
	`googleClassroomUrl` text,
	`workload` int DEFAULT 60,
	`computationalThinkingEnabled` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `subjects_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`category` varchar(100),
	`dueDate` varchar(10),
	`completed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teacher_activities_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`activityType` enum('class_taught','planning','grading','meeting','course_creation','material_creation','student_support','professional_dev','other') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`points` int NOT NULL,
	`duration` int,
	`activityDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teacher_activities_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teacher_belt_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`previousBelt` varchar(50) NOT NULL,
	`newBelt` varchar(50) NOT NULL,
	`previousLevel` int NOT NULL,
	`newLevel` int NOT NULL,
	`pointsAtUpgrade` int NOT NULL,
	`upgradedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teacher_belt_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teacher_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalPoints` int NOT NULL DEFAULT 0,
	`currentBelt` varchar(50) NOT NULL DEFAULT 'white',
	`beltLevel` int NOT NULL DEFAULT 1,
	`lastBeltUpgrade` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teacher_points_id` PRIMARY KEY(`id`),
	CONSTRAINT `teacher_points_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `time_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shiftId` int NOT NULL,
	`slotNumber` int NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `time_slots_id` PRIMARY KEY(`id`)
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
CREATE TABLE `topic_class_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topicId` int NOT NULL,
	`scheduledClassId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `topic_class_links_id` PRIMARY KEY(`id`)
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
	`contentType` enum('text','video','exercise','quiz','project') DEFAULT 'text',
	`url` text NOT NULL,
	`fileSize` int,
	`orderIndex` int NOT NULL DEFAULT 0,
	`isRequired` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `topic_materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `topic_progress_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`topicId` int NOT NULL,
	`score` int NOT NULL,
	`timeSpent` int NOT NULL,
	`attemptsCount` int NOT NULL DEFAULT 1,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `topic_progress_history_id` PRIMARY KEY(`id`)
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
--> statement-breakpoint
ALTER TABLE `users` ADD `profile` enum('traditional','enthusiast','interactive','organizational') DEFAULT 'traditional' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `approvalStatus` enum('approved','pending','rejected') DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `inviteCode` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);