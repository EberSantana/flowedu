import { and, or, desc, eq, ne, gte, lte, inArray, sql } from "drizzle-orm";
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
  tasks,
  learningModules,
  learningTopics,
  topicClassLinks,
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

export async function updateUserLastSignIn(userId: number, lastSignedIn: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ lastSignedIn }).where(eq(users.id, userId));
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

export async function cleanInvalidUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar usuários inválidos (sem nome E sem email)
  const invalidUsers = await db.select()
    .from(users)
    .where(
      and(
        or(
          eq(users.name, ''),
          sql`${users.name} IS NULL`
        ),
        or(
          eq(users.email, ''),
          sql`${users.email} IS NULL`
        )
      )
    );
  
  const invalidCount = invalidUsers.length;
  
  if (invalidCount > 0) {
    // Deletar usuários inválidos
    await db.delete(users).where(
      and(
        or(
          eq(users.name, ''),
          sql`${users.name} IS NULL`
        ),
        or(
          eq(users.email, ''),
          sql`${users.email} IS NULL`
        )
      )
    );
  }
  
  return { 
    success: true, 
    deletedCount: invalidCount,
    message: `${invalidCount} usuário(s) inválido(s) removido(s)` 
  };
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


// ============================================
// TASKS (TO-DO LIST)
// ============================================

export async function createTask(data: { title: string; description?: string; priority?: "low" | "medium" | "high"; category?: string; dueDate?: string; userId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(tasks).values(data);
  return { success: true, id: result.insertId };
}

export async function getAllTasks(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(tasks.orderIndex, tasks.createdAt);
}

export async function getTasksByFilter(userId: number, filter: { completed?: boolean; priority?: string; category?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [eq(tasks.userId, userId)];
  
  if (filter.completed !== undefined) {
    conditions.push(eq(tasks.completed, filter.completed));
  }
  if (filter.priority) {
    conditions.push(eq(tasks.priority, filter.priority as any));
  }
  if (filter.category) {
    conditions.push(eq(tasks.category, filter.category));
  }
  
  return await db.select().from(tasks)
    .where(and(...conditions))
    .orderBy(tasks.orderIndex, tasks.createdAt);
}

export async function updateTask(id: number, userId: number, data: Partial<{ title: string; description: string; priority: string; category: string; dueDate: string; orderIndex: number }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(tasks)
    .set(data as any)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  
  return { success: true };
}

export async function toggleTaskComplete(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [task] = await db.select().from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  
  if (!task) throw new Error("Task not found");
  
  const newCompleted = !task.completed;
  await db.update(tasks)
    .set({ 
      completed: newCompleted, 
      completedAt: newCompleted ? new Date() : null 
    })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  
  return { success: true, completed: newCompleted };
}

export async function deleteTask(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  
  return { success: true };
}

export async function getTaskCategories(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.selectDistinct({ category: tasks.category })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), sql`${tasks.category} IS NOT NULL`));
  
  return result.map((r: any) => r.category).filter(Boolean);
}


// ========== LEARNING PATHS (TRILHAS DE APRENDIZAGEM) ==========

export async function getLearningPathBySubject(subjectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const modules = await db.select().from(learningModules)
    .where(and(eq(learningModules.subjectId, subjectId), eq(learningModules.userId, userId)))
    .orderBy(learningModules.orderIndex);
  
  const modulesWithTopics = await Promise.all(
    modules.map(async (module) => {
      const topics = await db.select().from(learningTopics)
        .where(and(eq(learningTopics.moduleId, module.id), eq(learningTopics.userId, userId)))
        .orderBy(learningTopics.orderIndex);
      
      return { ...module, topics };
    })
  );
  
  return modulesWithTopics;
}

export async function createLearningModule(data: { subjectId: number; title: string; description?: string; userId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get the next order index
  const [lastModule] = await db.select({ orderIndex: learningModules.orderIndex })
    .from(learningModules)
    .where(and(eq(learningModules.subjectId, data.subjectId), eq(learningModules.userId, data.userId)))
    .orderBy(desc(learningModules.orderIndex))
    .limit(1);
  
  const nextOrder = lastModule ? lastModule.orderIndex + 1 : 0;
  
  const [result] = await db.insert(learningModules).values({
    ...data,
    orderIndex: nextOrder,
  });
  
  return { id: result.insertId, ...data, orderIndex: nextOrder };
}

export async function updateLearningModule(id: number, data: { title?: string; description?: string }, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(learningModules)
    .set(data as any)
    .where(and(eq(learningModules.id, id), eq(learningModules.userId, userId)));
  
  return { success: true };
}

export async function deleteLearningModule(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete all topics in this module first
  await db.delete(learningTopics)
    .where(and(eq(learningTopics.moduleId, id), eq(learningTopics.userId, userId)));
  
  // Delete the module
  await db.delete(learningModules)
    .where(and(eq(learningModules.id, id), eq(learningModules.userId, userId)));
  
  return { success: true };
}

export async function createLearningTopic(data: { moduleId: number; title: string; description?: string; estimatedHours?: number; userId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get the next order index
  const [lastTopic] = await db.select({ orderIndex: learningTopics.orderIndex })
    .from(learningTopics)
    .where(and(eq(learningTopics.moduleId, data.moduleId), eq(learningTopics.userId, data.userId)))
    .orderBy(desc(learningTopics.orderIndex))
    .limit(1);
  
  const nextOrder = lastTopic ? lastTopic.orderIndex + 1 : 0;
  
  const [result] = await db.insert(learningTopics).values({
    ...data,
    orderIndex: nextOrder,
    status: 'not_started',
  });
  
  return { id: result.insertId, ...data, orderIndex: nextOrder, status: 'not_started' };
}

export async function updateLearningTopic(id: number, data: { title?: string; description?: string; status?: 'not_started' | 'in_progress' | 'completed'; estimatedHours?: number }, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(learningTopics)
    .set(data as any)
    .where(and(eq(learningTopics.id, id), eq(learningTopics.userId, userId)));
  
  return { success: true };
}

export async function deleteLearningTopic(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete topic-class links first
  await db.delete(topicClassLinks)
    .where(and(eq(topicClassLinks.topicId, id), eq(topicClassLinks.userId, userId)));
  
  // Delete the topic
  await db.delete(learningTopics)
    .where(and(eq(learningTopics.id, id), eq(learningTopics.userId, userId)));
  
  return { success: true };
}

export async function getLearningPathProgress(subjectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const modules = await db.select().from(learningModules)
    .where(and(eq(learningModules.subjectId, subjectId), eq(learningModules.userId, userId)));
  
  const moduleIds = modules.map(m => m.id);
  
  if (moduleIds.length === 0) {
    return { totalTopics: 0, completedTopics: 0, inProgressTopics: 0, notStartedTopics: 0, percentage: 0 };
  }
  
  const allTopics = await db.select().from(learningTopics)
    .where(and(
      sql`${learningTopics.moduleId} IN (${sql.join(moduleIds.map(id => sql`${id}`), sql`, `)})`,
      eq(learningTopics.userId, userId)
    ));
  
  const totalTopics = allTopics.length;
  const completedTopics = allTopics.filter(t => t.status === 'completed').length;
  const inProgressTopics = allTopics.filter(t => t.status === 'in_progress').length;
  const notStartedTopics = allTopics.filter(t => t.status === 'not_started').length;
  const percentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  
  return { totalTopics, completedTopics, inProgressTopics, notStartedTopics, percentage };
}
