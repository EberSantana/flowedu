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
