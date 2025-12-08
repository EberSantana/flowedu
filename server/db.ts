import { and, desc, eq, ne, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  subjects, 
  classes, 
  shifts, 
  timeSlots, 
  scheduledClasses,
  calendarEvents,
  invitations,
  InsertSubject,
  InsertClass,
  InsertShift,
  InsertTimeSlot,
  InsertScheduledClass,
  InsertCalendarEvent,
  InsertInvitation
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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

// ========== SUBJECTS ==========

export async function createSubject(data: InsertSubject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(subjects).values(data);
  return result;
}

export async function getSubjectsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(subjects).where(eq(subjects.userId, userId)).orderBy(subjects.name);
}

export async function getSubjectById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(subjects).where(
    and(eq(subjects.id, id), eq(subjects.userId, userId))
  ).limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSubject(id: number, userId: number, data: Partial<InsertSubject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(subjects).set(data).where(
    and(eq(subjects.id, id), eq(subjects.userId, userId))
  );
}

export async function deleteSubject(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(subjects).where(
    and(eq(subjects.id, id), eq(subjects.userId, userId))
  );
}

// ========== CLASSES ==========

export async function createClass(data: InsertClass) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(classes).values(data);
  return result;
}

export async function getClassesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(classes).where(eq(classes.userId, userId)).orderBy(classes.name);
}

export async function getClassById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(classes).where(
    and(eq(classes.id, id), eq(classes.userId, userId))
  ).limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function updateClass(id: number, userId: number, data: Partial<InsertClass>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(classes).set(data).where(
    and(eq(classes.id, id), eq(classes.userId, userId))
  );
}

export async function deleteClass(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(classes).where(
    and(eq(classes.id, id), eq(classes.userId, userId))
  );
}

// ========== SHIFTS ==========

export async function createShift(data: InsertShift) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(shifts).values(data);
  return result;
}

export async function getShiftsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(shifts).where(eq(shifts.userId, userId)).orderBy(shifts.displayOrder);
}

export async function getShiftById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(shifts).where(
    and(eq(shifts.id, id), eq(shifts.userId, userId))
  ).limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function updateShift(id: number, userId: number, data: Partial<InsertShift>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(shifts).set(data).where(
    and(eq(shifts.id, id), eq(shifts.userId, userId))
  );
}

export async function deleteShift(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(shifts).where(
    and(eq(shifts.id, id), eq(shifts.userId, userId))
  );
}

// ========== TIME SLOTS ==========

export async function createTimeSlot(data: InsertTimeSlot) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(timeSlots).values(data);
  return result;
}

export async function getTimeSlotsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(timeSlots).where(eq(timeSlots.userId, userId)).orderBy(timeSlots.shiftId, timeSlots.slotNumber);
}

export async function getTimeSlotsByShiftId(shiftId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(timeSlots).where(
    and(eq(timeSlots.shiftId, shiftId), eq(timeSlots.userId, userId))
  ).orderBy(timeSlots.slotNumber);
}

export async function getTimeSlotById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(timeSlots).where(
    and(eq(timeSlots.id, id), eq(timeSlots.userId, userId))
  ).limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function updateTimeSlot(id: number, userId: number, data: Partial<InsertTimeSlot>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(timeSlots).set(data).where(
    and(eq(timeSlots.id, id), eq(timeSlots.userId, userId))
  );
}

export async function deleteTimeSlot(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(timeSlots).where(
    and(eq(timeSlots.id, id), eq(timeSlots.userId, userId))
  );
}

// ========== SCHEDULED CLASSES ==========

export async function createScheduledClass(data: InsertScheduledClass) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(scheduledClasses).values(data);
  return result;
}

export async function getScheduledClassesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(scheduledClasses).where(eq(scheduledClasses.userId, userId)).orderBy(desc(scheduledClasses.createdAt));
}

export async function getScheduledClassById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(scheduledClasses).where(
    and(eq(scheduledClasses.id, id), eq(scheduledClasses.userId, userId))
  ).limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function updateScheduledClass(id: number, userId: number, data: Partial<InsertScheduledClass>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(scheduledClasses).set(data).where(
    and(eq(scheduledClasses.id, id), eq(scheduledClasses.userId, userId))
  );
}

export async function deleteScheduledClass(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(scheduledClasses).where(
    and(eq(scheduledClasses.id, id), eq(scheduledClasses.userId, userId))
  );
}

export async function checkScheduleConflict(
  timeSlotId: number, 
  dayOfWeek: number, 
  classId: number, 
  userId: number,
  excludeId?: number
) {
  const db = await getDb();
  if (!db) return false;
  
  const conditions = [
    eq(scheduledClasses.timeSlotId, timeSlotId),
    eq(scheduledClasses.dayOfWeek, dayOfWeek),
    eq(scheduledClasses.classId, classId),
    eq(scheduledClasses.userId, userId)
  ];
  
  if (excludeId) {
    // @ts-ignore
    conditions.push(ne(scheduledClasses.id, excludeId));
  }
  
  const result = await db.select().from(scheduledClasses).where(
    and(...conditions)
  ).limit(1);
  
  return result.length > 0;
}

// ========== CALENDAR EVENTS ==========

export async function getCalendarEventsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId));
}

export async function getCalendarEventsByYear(userId: number, year: number) {
  const db = await getDb();
  if (!db) return [];
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  return db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.userId, userId),
        gte(calendarEvents.eventDate, startDate),
        lte(calendarEvents.eventDate, endDate)
      )
    );
}

export async function createCalendarEvent(event: InsertCalendarEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(calendarEvents).values(event);
  return result;
}

export async function updateCalendarEvent(id: number, userId: number, data: Partial<InsertCalendarEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(calendarEvents)
    .set(data)
    .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, userId)));
}

export async function deleteCalendarEvent(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(calendarEvents)
    .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, userId)));
}


// ========== USER MANAGEMENT ==========

export async function updateUserProfile(userId: number, data: { name?: string; email?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, userId));
  return { success: true };
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(users.createdAt);
}

export async function updateUserRole(userId: number, role: "admin" | "user") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
  return { success: true };
}


// ========== INVITATION MANAGEMENT ==========

export async function createInvitation(data: InsertInvitation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(invitations).values(data);
  return { success: true };
}

export async function getInvitationByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(invitations).where(eq(invitations.token, token));
  return result[0] || null;
}

export async function getInvitationsByCreator(creatorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invitations).where(eq(invitations.createdBy, creatorId)).orderBy(desc(invitations.createdAt));
}

export async function getAllInvitations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invitations).orderBy(desc(invitations.createdAt));
}

export async function updateInvitationStatus(id: number, status: "pending" | "accepted" | "expired" | "cancelled", acceptedBy?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  if (status === "accepted" && acceptedBy) {
    updateData.acceptedBy = acceptedBy;
    updateData.acceptedAt = new Date();
  }
  
  await db.update(invitations).set(updateData).where(eq(invitations.id, id));
  return { success: true };
}

export async function deleteInvitation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(invitations).where(eq(invitations.id, id));
  return { success: true };
}

export async function checkEmailAlreadyInvited(email: string) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(invitations).where(
    and(
      eq(invitations.email, email),
      eq(invitations.status, "pending")
    )
  );
  return result.length > 0;
}

export async function checkEmailAlreadyRegistered(email: string) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(users).where(eq(users.email, email));
  return result.length > 0;
}


export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, userId));
  return { success: true };
}
