import { and, desc, eq, ne, gte, lte, inArray } from "drizzle-orm";
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
  auditLogs,
  activeMethodologies,
  classStatuses,
  InsertSubject,
  InsertClass,
  InsertShift,
  InsertTimeSlot,
  InsertScheduledClass,
  InsertCalendarEvent,
  InsertActiveMethodology,
  InsertClassStatus
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

export async function deleteEventsByYearAndType(
  userId: number,
  startDate: string,
  endDate: string,
  eventTypes: ("holiday" | "commemorative" | "school_event" | "personal")[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .delete(calendarEvents)
    .where(
      and(
        eq(calendarEvents.userId, userId),
        gte(calendarEvents.eventDate, startDate),
        lte(calendarEvents.eventDate, endDate),
        inArray(calendarEvents.eventType, eventTypes as any)
      )
    );
  
  // MySQL delete doesn't return rowsAffected, so we'll return a success indicator
  return 1;
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


export async function checkEmailAlreadyRegistered(email: string) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(users).where(eq(users.email, email));
  return result.length > 0;
}


export async function deactivateUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ active: false }).where(eq(users.id, userId));
  return { success: true };
}

export async function reactivateUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ active: true }).where(eq(users.id, userId));
  return { success: true };
}

export async function getActiveUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.active, true)).orderBy(desc(users.createdAt));
}

export async function getInactiveUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.active, false)).orderBy(desc(users.createdAt));
}


export async function permanentDeleteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Deletar permanentemente o usuário
  await db.delete(users).where(eq(users.id, userId));
  
  return { success: true };
}


// Audit Logs
export async function createAuditLog(log: {
  adminId: number;
  adminName: string;
  action: string;
  targetUserId?: number;
  targetUserName?: string;
  oldData?: string;
  newData?: string;
  ipAddress?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(auditLogs).values(log);
  return { success: true };
}

export async function getAllAuditLogs() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp));
  return logs;
}

export async function getAuditLogsByAdmin(adminId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const logs = await db.select().from(auditLogs).where(eq(auditLogs.adminId, adminId)).orderBy(desc(auditLogs.timestamp));
  return logs;
}

export async function getAuditLogsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const logs = await db.select().from(auditLogs).where(eq(auditLogs.targetUserId, userId)).orderBy(desc(auditLogs.timestamp));
  return logs;
}


// Active Methodologies
export async function getActiveMethodologiesByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const methodologies = await db.select().from(activeMethodologies).where(eq(activeMethodologies.userId, userId)).orderBy(desc(activeMethodologies.createdAt));
  return methodologies;
}

export async function createActiveMethodology(methodology: InsertActiveMethodology) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(activeMethodologies).values(methodology);
  return result;
}

export async function updateActiveMethodology(id: number, userId: number, data: Partial<InsertActiveMethodology>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(activeMethodologies)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(activeMethodologies.id, id), eq(activeMethodologies.userId, userId)));
  
  return { success: true };
}

export async function deleteActiveMethodology(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(activeMethodologies).where(and(eq(activeMethodologies.id, id), eq(activeMethodologies.userId, userId)));
  return { success: true };
}


// Class Status Management
export async function setClassStatus(
  scheduledClassId: number,
  weekNumber: number,
  year: number,
  status: 'given' | 'not_given' | 'cancelled',
  userId: number,
  reason?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se já existe um status para esta aula nesta semana
  const existing = await db.select().from(classStatuses)
    .where(and(
      eq(classStatuses.scheduledClassId, scheduledClassId),
      eq(classStatuses.weekNumber, weekNumber),
      eq(classStatuses.year, year),
      eq(classStatuses.userId, userId)
    ));
  
  if (existing.length > 0) {
    // Atualizar status existente
    await db.update(classStatuses)
      .set({ status, reason, updatedAt: new Date() })
      .where(eq(classStatuses.id, existing[0].id));
    return { success: true, id: existing[0].id };
  } else {
    // Criar novo status
    const [result] = await db.insert(classStatuses).values({
      scheduledClassId,
      weekNumber,
      year,
      status,
      reason,
      userId
    });
    return { success: true, id: result.insertId };
  }
}

export async function getClassStatus(
  scheduledClassId: number,
  weekNumber: number,
  year: number,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [status] = await db.select().from(classStatuses)
    .where(and(
      eq(classStatuses.scheduledClassId, scheduledClassId),
      eq(classStatuses.weekNumber, weekNumber),
      eq(classStatuses.year, year),
      eq(classStatuses.userId, userId)
    ));
  
  return status || null;
}

export async function getWeekClassStatuses(weekNumber: number, year: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const statuses = await db.select().from(classStatuses)
    .where(and(
      eq(classStatuses.weekNumber, weekNumber),
      eq(classStatuses.year, year),
      eq(classStatuses.userId, userId)
    ));
  
  return statuses;
}

export async function deleteClassStatus(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(classStatuses).where(and(
    eq(classStatuses.id, id),
    eq(classStatuses.userId, userId)
  ));
  
  return { success: true };
}
