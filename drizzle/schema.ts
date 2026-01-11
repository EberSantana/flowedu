import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  time,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Professional bands table - defines teacher career levels
 */
export const professionalBands = mysqlTable("professional_bands", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  weeklyHours: int("weeklyHours").notNull(),
  classHours: int("classHours").notNull(),
  planningHours: int("planningHours").notNull(),
  otherActivitiesHours: int("otherActivitiesHours").notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3b82f6"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProfessionalBand = typeof professionalBands.$inferSelect;
export type InsertProfessionalBand = typeof professionalBands.$inferInsert;

/**
 * Teachers table - extends user with teacher-specific information
 */
export const teachers = mysqlTable("teachers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  professionalBandId: int("professionalBandId").references(
    () => professionalBands.id,
    { onDelete: "set null" }
  ),
  specialization: varchar("specialization", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = typeof teachers.$inferInsert;

/**
 * Subjects table - academic subjects taught
 */
export const subjects = mysqlTable("subjects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }),
  color: varchar("color", { length: 7 }).default("#10b981"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = typeof subjects.$inferInsert;

/**
 * Classes table - student groups
 */
export const classGroups = mysqlTable("class_groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  grade: varchar("grade", { length: 50 }),
  shift: mysqlEnum("shift", ["morning", "afternoon", "evening", "full"]),
  studentCount: int("studentCount").default(0),
  academicYear: varchar("academicYear", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClassGroup = typeof classGroups.$inferSelect;
export type InsertClassGroup = typeof classGroups.$inferInsert;

/**
 * Schedules table - class schedules
 */
export const schedules = mysqlTable("schedules", {
  id: int("id").autoincrement().primaryKey(),
  teacherId: int("teacherId")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  subjectId: int("subjectId")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  classGroupId: int("classGroupId")
    .notNull()
    .references(() => classGroups.id, { onDelete: "cascade" }),
  dayOfWeek: int("dayOfWeek").notNull(),
  startTime: time("startTime").notNull(),
  endTime: time("endTime").notNull(),
  location: varchar("location", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = typeof schedules.$inferInsert;

/**
 * Activities table - tasks and activities for teachers
 */
export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  teacherId: int("teacherId")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", [
    "planning",
    "grading",
    "meeting",
    "training",
    "other",
  ])
    .notNull()
    .default("other"),
  status: mysqlEnum("status", [
    "pending",
    "in_progress",
    "completed",
    "cancelled",
  ])
    .notNull()
    .default("pending"),
  priority: mysqlEnum("priority", ["low", "medium", "high"])
    .notNull()
    .default("medium"),
  dueDate: timestamp("dueDate"),
  estimatedHours: int("estimatedHours"),
  actualHours: int("actualHours"),
  classGroupId: int("classGroupId").references(() => classGroups.id, {
    onDelete: "set null",
  }),
  subjectId: int("subjectId").references(() => subjects.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;
