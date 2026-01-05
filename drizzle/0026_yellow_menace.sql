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
ALTER TABLE `shop_items` MODIFY COLUMN `category` enum('hat','glasses','accessory','background','special','power_up','certificate','unlock') NOT NULL;--> statement-breakpoint
ALTER TABLE `shop_items` ADD `metadata` json;--> statement-breakpoint
ALTER TABLE `shop_items` ADD `requiredPoints` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `shop_items` ADD `rarity` enum('common','rare','epic','legendary') DEFAULT 'common' NOT NULL;--> statement-breakpoint
ALTER TABLE `shop_items` ADD `stock` int DEFAULT -1 NOT NULL;--> statement-breakpoint
ALTER TABLE `student_purchased_items` ADD `isEquipped` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `shop_items` DROP COLUMN `isRare`;