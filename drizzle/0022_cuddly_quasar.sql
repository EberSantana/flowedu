ALTER TABLE `badges` MODIFY COLUMN `code` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `badges` MODIFY COLUMN `name` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `badges` MODIFY COLUMN `description` text NOT NULL;--> statement-breakpoint
ALTER TABLE `badges` MODIFY COLUMN `icon` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `badges` MODIFY COLUMN `category` enum('streak','accuracy','speed','completion','special') NOT NULL;--> statement-breakpoint
ALTER TABLE `badges` ADD `requirement` int NOT NULL;