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
ALTER TABLE `users` ADD `approvalStatus` enum('approved','pending','rejected') DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `inviteCode` varchar(20);