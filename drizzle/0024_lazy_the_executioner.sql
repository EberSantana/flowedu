DROP TABLE `active_methodologies`;--> statement-breakpoint
DROP TABLE `announcementReads`;--> statement-breakpoint
DROP TABLE `announcements`;--> statement-breakpoint
DROP TABLE `assignment_submissions`;--> statement-breakpoint
DROP TABLE `audit_logs`;--> statement-breakpoint
DROP TABLE `badges`;--> statement-breakpoint
DROP TABLE `calendar_events`;--> statement-breakpoint
DROP TABLE `class_statuses`;--> statement-breakpoint
DROP TABLE `classes`;--> statement-breakpoint
DROP TABLE `computational_thinking_scores`;--> statement-breakpoint
DROP TABLE `ct_badges`;--> statement-breakpoint
DROP TABLE `ct_exercises`;--> statement-breakpoint
DROP TABLE `ct_submissions`;--> statement-breakpoint
DROP TABLE `gamification_notifications`;--> statement-breakpoint
DROP TABLE `invite_codes`;--> statement-breakpoint
DROP TABLE `learning_modules`;--> statement-breakpoint
DROP TABLE `learning_topics`;--> statement-breakpoint
DROP TABLE `notifications`;--> statement-breakpoint
DROP TABLE `password_reset_tokens`;--> statement-breakpoint
DROP TABLE `points_history`;--> statement-breakpoint
DROP TABLE `scheduled_classes`;--> statement-breakpoint
DROP TABLE `shifts`;--> statement-breakpoint
DROP TABLE `student_attendance`;--> statement-breakpoint
DROP TABLE `student_badges`;--> statement-breakpoint
DROP TABLE `student_ct_badges`;--> statement-breakpoint
DROP TABLE `student_class_enrollments`;--> statement-breakpoint
DROP TABLE `student_enrollments`;--> statement-breakpoint
DROP TABLE `student_points`;--> statement-breakpoint
DROP TABLE `student_topic_progress`;--> statement-breakpoint
DROP TABLE `students`;--> statement-breakpoint
DROP TABLE `subjectEnrollments`;--> statement-breakpoint
DROP TABLE `subjects`;--> statement-breakpoint
DROP TABLE `tasks`;--> statement-breakpoint
DROP TABLE `time_slots`;--> statement-breakpoint
DROP TABLE `topic_assignments`;--> statement-breakpoint
DROP TABLE `topic_class_links`;--> statement-breakpoint
DROP TABLE `topic_comments`;--> statement-breakpoint
DROP TABLE `topic_materials`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `active`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `approvalStatus`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `inviteCode`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `passwordHash`;