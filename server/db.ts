import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  professionalBands,
  teachers,
  subjects,
  classGroups,
  schedules,
  activities,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================
// Professional Bands
// ============================================================

export async function getAllProfessionalBands() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(professionalBands).orderBy(professionalBands.name);
}

export async function getProfessionalBandById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [band] = await db
    .select()
    .from(professionalBands)
    .where(eq(professionalBands.id, id));
  return band;
}

export async function createProfessionalBand(
  data: Omit<typeof professionalBands.$inferInsert, "id" | "createdAt" | "updatedAt">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [band] = await db.insert(professionalBands).values(data);
  return band;
}

export async function updateProfessionalBand(
  id: number,
  data: Partial<Omit<typeof professionalBands.$inferInsert, "id" | "createdAt" | "updatedAt">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(professionalBands).set(data).where(eq(professionalBands.id, id));
  return await getProfessionalBandById(id);
}

export async function deleteProfessionalBand(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(professionalBands).where(eq(professionalBands.id, id));
}

// ============================================================
// Teachers
// ============================================================

export async function getTeacherByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [teacher] = await db
    .select()
    .from(teachers)
    .where(eq(teachers.userId, userId));
  return teacher;
}

export async function getTeacherById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [teacher] = await db
    .select()
    .from(teachers)
    .where(eq(teachers.id, id));
  return teacher;
}

export async function createTeacher(
  data: Omit<typeof teachers.$inferInsert, "id" | "createdAt" | "updatedAt">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [teacher] = await db.insert(teachers).values(data);
  return teacher;
}

export async function updateTeacher(
  id: number,
  data: Partial<Omit<typeof teachers.$inferInsert, "id" | "createdAt" | "updatedAt">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(teachers).set(data).where(eq(teachers.id, id));
  return await getTeacherById(id);
}

// ============================================================
// Subjects
// ============================================================

export async function getAllSubjects() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(subjects).orderBy(subjects.name);
}

export async function getSubjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [subject] = await db
    .select()
    .from(subjects)
    .where(eq(subjects.id, id));
  return subject;
}

export async function createSubject(
  data: Omit<typeof subjects.$inferInsert, "id" | "createdAt" | "updatedAt">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [subject] = await db.insert(subjects).values(data);
  return subject;
}

export async function updateSubject(
  id: number,
  data: Partial<Omit<typeof subjects.$inferInsert, "id" | "createdAt" | "updatedAt">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(subjects).set(data).where(eq(subjects.id, id));
  return await getSubjectById(id);
}

export async function deleteSubject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(subjects).where(eq(subjects.id, id));
}

// ============================================================
// Class Groups
// ============================================================

export async function getAllClassGroups() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(classGroups).orderBy(classGroups.name);
}

export async function getClassGroupById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [classGroup] = await db
    .select()
    .from(classGroups)
    .where(eq(classGroups.id, id));
  return classGroup;
}

export async function createClassGroup(
  data: Omit<typeof classGroups.$inferInsert, "id" | "createdAt" | "updatedAt">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [classGroup] = await db.insert(classGroups).values(data);
  return classGroup;
}

export async function updateClassGroup(
  id: number,
  data: Partial<Omit<typeof classGroups.$inferInsert, "id" | "createdAt" | "updatedAt">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(classGroups).set(data).where(eq(classGroups.id, id));
  return await getClassGroupById(id);
}

export async function deleteClassGroup(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(classGroups).where(eq(classGroups.id, id));
}

// ============================================================
// Schedules
// ============================================================

export async function getSchedulesByTeacherId(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(schedules)
    .where(eq(schedules.teacherId, teacherId))
    .orderBy(schedules.dayOfWeek, schedules.startTime);
}

export async function getScheduleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [schedule] = await db
    .select()
    .from(schedules)
    .where(eq(schedules.id, id));
  return schedule;
}

export async function createSchedule(
  data: Omit<typeof schedules.$inferInsert, "id" | "createdAt" | "updatedAt">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [schedule] = await db.insert(schedules).values(data);
  return schedule;
}

export async function updateSchedule(
  id: number,
  data: Partial<Omit<typeof schedules.$inferInsert, "id" | "createdAt" | "updatedAt">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(schedules).set(data).where(eq(schedules.id, id));
  return await getScheduleById(id);
}

export async function deleteSchedule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(schedules).where(eq(schedules.id, id));
}

// ============================================================
// Activities
// ============================================================

export async function getActivitiesByTeacherId(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(activities)
    .where(eq(activities.teacherId, teacherId))
    .orderBy(desc(activities.createdAt));
}

export async function getActivityById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, id));
  return activity;
}

export async function createActivity(
  data: Omit<typeof activities.$inferInsert, "id" | "createdAt" | "updatedAt">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [activity] = await db.insert(activities).values(data);
  return activity;
}

export async function updateActivity(
  id: number,
  data: Partial<Omit<typeof activities.$inferInsert, "id" | "createdAt" | "updatedAt">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(activities).set(data).where(eq(activities.id, id));
  return await getActivityById(id);
}

export async function deleteActivity(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(activities).where(eq(activities.id, id));
}
