CREATE TABLE `shop_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`category` enum('hat','glasses','accessory','background','special') NOT NULL,
	`price` int NOT NULL,
	`imageUrl` text,
	`svgData` text,
	`requiredBelt` varchar(20) DEFAULT 'white',
	`isActive` boolean NOT NULL DEFAULT true,
	`isRare` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shop_items_id` PRIMARY KEY(`id`)
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
CREATE TABLE `student_purchased_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`itemId` int NOT NULL,
	`purchasedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_purchased_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_purchased_items_studentId_itemId_unique` UNIQUE(`studentId`,`itemId`)
);
