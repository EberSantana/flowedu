import { and, or, desc, eq, ne, gte, lte, gt, lt, inArray, sql } from "drizzle-orm";
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
  studentEnrollments,
  studentTopicProgress,
  topicMaterials,
  topicAssignments,
  assignmentSubmissions,
  topicComments,
  notifications,
  students,
  studentClassEnrollments,
  studentAttendance,
  subjectEnrollments,
  announcements,
  announcementReads,
  inviteCodes,
  passwordResetTokens,
  PasswordResetToken,
  InsertPasswordResetToken,
  InsertSubject,
  InsertClass,
  InsertShift,
  InsertTimeSlot,
  InsertScheduledClass,
  InsertCalendarEvent,
  InsertActiveMethodology,
  InsertClassStatus,
  InsertStudent,
  InsertInviteCode
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

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
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

export async function updateLearningModule(id: number, data: { title?: string; description?: string; infographicUrl?: string }, userId: number) {
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

export async function createLearningTopic(data: { moduleId: number; title: string; description?: string; estimatedHours?: number; theoryHours?: number; practiceHours?: number; individualWorkHours?: number; teamWorkHours?: number; userId: number }) {
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

export async function updateLearningTopic(id: number, data: { title?: string; description?: string; status?: 'not_started' | 'in_progress' | 'completed'; estimatedHours?: number; theoryHours?: number; practiceHours?: number; individualWorkHours?: number; teamWorkHours?: number }, userId: number) {
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

export async function getLearningTopicById(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const topics = await db.select().from(learningTopics)
    .where(and(eq(learningTopics.id, id), eq(learningTopics.userId, userId)));
  
  return topics[0] || null;
}

export async function getLearningModuleById(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const modules = await db.select().from(learningModules)
    .where(and(eq(learningModules.id, id), eq(learningModules.userId, userId)));
  
  return modules[0] || null;
}

export async function getLearningTopicsByModule(moduleId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const topics = await db.select().from(learningTopics)
    .where(and(eq(learningTopics.moduleId, moduleId), eq(learningTopics.userId, userId)))
    .orderBy(learningTopics.orderIndex);
  
  return topics;
}

// ==================== STUDENT ENROLLMENTS ====================

export async function createStudentEnrollment(data: { studentId: number; subjectId: number; classId?: number; professorId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(studentEnrollments).values({
    ...data,
    status: 'active',
  });
  
  return { id: result.insertId, ...data, status: 'active' };
}

export async function getStudentEnrollments(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar matrículas na tabela subjectEnrollments
  return await db.select().from(subjectEnrollments)
    .where(eq(subjectEnrollments.studentId, studentId));
}

export async function getEnrollmentsBySubject(subjectId: number, professorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(studentEnrollments)
    .where(and(
      eq(studentEnrollments.subjectId, subjectId),
      eq(studentEnrollments.professorId, professorId)
    ));
}

export async function updateEnrollmentStatus(id: number, status: 'active' | 'completed' | 'dropped', userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Atualizar na tabela subjectEnrollments
  await db.update(subjectEnrollments)
    .set({ status })
    .where(and(
      eq(subjectEnrollments.id, id),
      eq(subjectEnrollments.userId, userId)
    ));
  
  return { success: true };
}

export async function deleteEnrollment(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Deletar da tabela subjectEnrollments
  await db.delete(subjectEnrollments)
    .where(and(
      eq(subjectEnrollments.id, id),
      eq(subjectEnrollments.userId, userId)
    ));
  
  return { success: true };
}

// ==================== STUDENT TOPIC PROGRESS ====================

export async function getStudentTopicProgress(studentId: number, topicId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const progress = await db.select().from(studentTopicProgress)
    .where(and(
      eq(studentTopicProgress.studentId, studentId),
      eq(studentTopicProgress.topicId, topicId)
    ));
  
  return progress[0] || null;
}

export async function updateStudentTopicProgress(data: { studentId: number; topicId: number; status?: 'not_started' | 'in_progress' | 'completed'; selfAssessment?: 'understood' | 'have_doubts' | 'need_help'; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getStudentTopicProgress(data.studentId, data.topicId);
  
  if (existing) {
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.selfAssessment) updateData.selfAssessment = data.selfAssessment;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status === 'completed') updateData.completedAt = new Date();
    
    await db.update(studentTopicProgress)
      .set(updateData)
      .where(and(
        eq(studentTopicProgress.studentId, data.studentId),
        eq(studentTopicProgress.topicId, data.topicId)
      ));
    
    return { ...existing, ...updateData };
  } else {
    const [result] = await db.insert(studentTopicProgress).values({
      studentId: data.studentId,
      topicId: data.topicId,
      status: data.status || 'not_started',
      selfAssessment: data.selfAssessment,
      notes: data.notes,
      completedAt: data.status === 'completed' ? new Date() : undefined,
    });
    
    return { id: result.insertId, ...data };
  }
}

export async function getStudentProgressBySubject(studentId: number, subjectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get all modules for this subject
  const modules = await db.select().from(learningModules)
    .where(eq(learningModules.subjectId, subjectId));
  
  const moduleIds = modules.map(m => m.id);
  
  if (moduleIds.length === 0) {
    return [];
  }
  
  // Get all topics for these modules
  const topics = await db.select().from(learningTopics)
    .where(sql`${learningTopics.moduleId} IN (${sql.join(moduleIds.map(id => sql`${id}`), sql`, `)})`);
  
  // Get student progress for all topics
  const topicIds = topics.map(t => t.id);
  
  if (topicIds.length === 0) {
    return [];
  }
  
  const progress = await db.select().from(studentTopicProgress)
    .where(and(
      eq(studentTopicProgress.studentId, studentId),
      sql`${studentTopicProgress.topicId} IN (${sql.join(topicIds.map(id => sql`${id}`), sql`, `)})`
    ));
  
  return progress;
}

// ==================== TOPIC MATERIALS ====================

export async function createTopicMaterial(data: { topicId: number; professorId: number; title: string; description?: string; type: 'pdf' | 'video' | 'link' | 'presentation' | 'document' | 'other'; url: string; fileSize?: number; isRequired?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get the next order index
  const [lastMaterial] = await db.select({ orderIndex: topicMaterials.orderIndex })
    .from(topicMaterials)
    .where(eq(topicMaterials.topicId, data.topicId))
    .orderBy(desc(topicMaterials.orderIndex))
    .limit(1);
  
  const nextOrder = lastMaterial ? lastMaterial.orderIndex + 1 : 0;
  
  const [result] = await db.insert(topicMaterials).values({
    ...data,
    orderIndex: nextOrder,
    isRequired: data.isRequired ?? false,
  });
  
  return { id: result.insertId, ...data, orderIndex: nextOrder };
}

export async function getTopicMaterials(topicId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(topicMaterials)
    .where(eq(topicMaterials.topicId, topicId))
    .orderBy(topicMaterials.orderIndex);
}

export async function updateTopicMaterial(id: number, data: { title?: string; description?: string; url?: string; isRequired?: boolean }, professorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(topicMaterials)
    .set(data as any)
    .where(and(
      eq(topicMaterials.id, id),
      eq(topicMaterials.professorId, professorId)
    ));
  
  return { success: true };
}

export async function deleteTopicMaterial(id: number, professorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(topicMaterials)
    .where(and(
      eq(topicMaterials.id, id),
      eq(topicMaterials.professorId, professorId)
    ));
  
  return { success: true };
}

// ==================== TOPIC ASSIGNMENTS ====================

export async function createTopicAssignment(data: { topicId: number; professorId: number; title: string; description: string; type: 'exercise' | 'essay' | 'project' | 'quiz' | 'practical'; dueDate?: Date; maxScore?: number; isRequired?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(topicAssignments).values({
    ...data,
    maxScore: data.maxScore ?? 100,
    isRequired: data.isRequired ?? true,
  });
  
  return { id: result.insertId, ...data };
}

export async function getTopicAssignments(topicId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(topicAssignments)
    .where(eq(topicAssignments.topicId, topicId));
}

export async function updateTopicAssignment(id: number, data: { title?: string; description?: string; dueDate?: Date; maxScore?: number; isRequired?: boolean }, professorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(topicAssignments)
    .set(data as any)
    .where(and(
      eq(topicAssignments.id, id),
      eq(topicAssignments.professorId, professorId)
    ));
  
  return { success: true };
}

export async function deleteTopicAssignment(id: number, professorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(topicAssignments)
    .where(and(
      eq(topicAssignments.id, id),
      eq(topicAssignments.professorId, professorId)
    ));
  
  return { success: true };
}

// ==================== ASSIGNMENT SUBMISSIONS ====================

export async function createAssignmentSubmission(data: { assignmentId: number; studentId: number; content?: string; fileUrl?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(assignmentSubmissions).values({
    ...data,
    status: 'pending',
  });
  
  return { id: result.insertId, ...data, status: 'pending' };
}

export async function getAssignmentSubmissions(assignmentId: number, professorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verify professor owns this assignment
  const assignment = await db.select().from(topicAssignments)
    .where(and(
      eq(topicAssignments.id, assignmentId),
      eq(topicAssignments.professorId, professorId)
    ));
  
  if (assignment.length === 0) {
    throw new Error("Assignment not found or access denied");
  }
  
  return await db.select().from(assignmentSubmissions)
    .where(eq(assignmentSubmissions.assignmentId, assignmentId));
}

export async function getStudentSubmission(assignmentId: number, studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const submissions = await db.select().from(assignmentSubmissions)
    .where(and(
      eq(assignmentSubmissions.assignmentId, assignmentId),
      eq(assignmentSubmissions.studentId, studentId)
    ));
  
  return submissions[0] || null;
}

export async function gradeSubmission(id: number, data: { score: number; feedback?: string; gradedBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(assignmentSubmissions)
    .set({
      score: data.score,
      feedback: data.feedback,
      gradedBy: data.gradedBy,
      gradedAt: new Date(),
      status: 'graded',
    })
    .where(eq(assignmentSubmissions.id, id));
  
  return { success: true };
}

// ==================== TOPIC COMMENTS ====================

export async function createTopicComment(data: { topicId: number; studentId: number; professorId: number; authorId: number; authorType: 'professor' | 'student'; content: string; isPrivate?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(topicComments).values({
    ...data,
    isPrivate: data.isPrivate ?? true,
  });
  
  return { id: result.insertId, ...data };
}

export async function getTopicComments(topicId: number, studentId: number, professorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(topicComments)
    .where(and(
      eq(topicComments.topicId, topicId),
      eq(topicComments.studentId, studentId),
      eq(topicComments.professorId, professorId)
    ))
    .orderBy(topicComments.createdAt);
}

export async function deleteTopicComment(id: number, authorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(topicComments)
    .where(and(
      eq(topicComments.id, id),
      eq(topicComments.authorId, authorId)
    ));
  
  return { success: true };
}


// ==================== NOTIFICATIONS ====================

export async function createNotification(data: {
  userId: number;
  type: 'new_material' | 'new_assignment' | 'new_announcement' | 'assignment_due' | 'feedback_received' | 'grade_received' | 'comment_received';
  title: string;
  message: string;
  link?: string;
  relatedId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result]: any = await db.insert(notifications).values(data);
  
  return { id: Number(result.insertId || 0), ...data };
}

export async function getNotifications(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationsCount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    ));
  
  return result[0]?.count || 0;
}

export async function markNotificationAsRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications)
    .set({ isRead: true })
    .where(and(
      eq(notifications.id, id),
      eq(notifications.userId, userId)
    ));
  
  return { success: true };
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications)
    .set({ isRead: true })
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    ));
  
  return { success: true };
}

export async function deleteNotification(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(notifications)
    .where(and(
      eq(notifications.id, id),
      eq(notifications.userId, userId)
    ));
  
  return { success: true };
}

// ==================== STUDENTS (MATRÍCULAS) ====================

export async function createStudent(data: InsertStudent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(students).values(data);
  const insertId = Number(result[0].insertId);
  
  // Buscar o registro criado para retornar com todos os campos
  const [created] = await db.select()
    .from(students)
    .where(eq(students.id, insertId));
  
  return created;
}

export async function getStudentsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select()
    .from(students)
    .where(eq(students.userId, userId))
    .orderBy(desc(students.createdAt));
}

export async function getStudentById(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select()
    .from(students)
    .where(and(
      eq(students.id, id),
      eq(students.userId, userId)
    ));
  
  return result[0] || null;
}

export async function updateStudent(id: number, data: Partial<InsertStudent>, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(students)
    .set(data)
    .where(and(
      eq(students.id, id),
      eq(students.userId, userId)
    ));
  
  return { success: true };
}

export async function deleteStudent(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(students)
    .where(and(
      eq(students.id, id),
      eq(students.userId, userId)
    ));
  
  return { success: true };
}

export async function getStudentByRegistration(registrationNumber: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select()
    .from(students)
    .where(eq(students.registrationNumber, registrationNumber));
  
  return result[0] || null;
}

// ==================== STUDENT PROFILE FUNCTIONS ====================

export async function getStudentProfile(studentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar dados do aluno
  const student = await db.select()
    .from(students)
    .where(and(
      eq(students.id, studentId),
      eq(students.userId, userId)
    ));
  
  if (!student[0]) return null;
  
  // Buscar turmas matriculadas
  const enrollments = await db.select({
    enrollmentId: studentClassEnrollments.id,
    classId: classes.id,
    className: classes.name,
    classCode: classes.code,
    enrolledAt: studentClassEnrollments.enrolledAt,
  })
    .from(studentClassEnrollments)
    .innerJoin(classes, eq(studentClassEnrollments.classId, classes.id))
    .where(and(
      eq(studentClassEnrollments.studentId, studentId),
      eq(studentClassEnrollments.userId, userId)
    ))
    .orderBy(desc(studentClassEnrollments.enrolledAt));
  
  return {
    student: student[0],
    enrollments,
  };
}

export async function getStudentAttendanceHistory(studentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const attendance = await db.select({
    id: studentAttendance.id,
    date: studentAttendance.date,
    status: studentAttendance.status,
    notes: studentAttendance.notes,
    classId: classes.id,
    className: classes.name,
    classCode: classes.code,
    scheduleId: studentAttendance.scheduleId,
  })
    .from(studentAttendance)
    .innerJoin(classes, eq(studentAttendance.classId, classes.id))
    .where(and(
      eq(studentAttendance.studentId, studentId),
      eq(studentAttendance.userId, userId)
    ))
    .orderBy(desc(studentAttendance.date));
  
  return attendance;
}

export async function getStudentStatistics(studentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const attendance = await db.select()
    .from(studentAttendance)
    .where(and(
      eq(studentAttendance.studentId, studentId),
      eq(studentAttendance.userId, userId)
    ));
  
  const totalClasses = attendance.length;
  const present = attendance.filter(a => a.status === 'present').length;
  const absent = attendance.filter(a => a.status === 'absent').length;
  const justified = attendance.filter(a => a.status === 'justified').length;
  const attendanceRate = totalClasses > 0 ? (present / totalClasses) * 100 : 0;
  
  return {
    totalClasses,
    present,
    absent,
    justified,
    attendanceRate: Math.round(attendanceRate * 10) / 10, // Arredondar para 1 casa decimal
  };
}

export async function enrollStudentInClass(studentId: number, classId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(studentClassEnrollments).values({
    studentId,
    classId,
    userId,
  });
  
  return { success: true };
}

export async function unenrollStudentFromClass(enrollmentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(studentClassEnrollments)
    .where(and(
      eq(studentClassEnrollments.id, enrollmentId),
      eq(studentClassEnrollments.userId, userId)
    ));
  
  return { success: true };
}


// ===== Subject Enrollments Functions =====

export async function enrollStudentInSubject(studentId: number, subjectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(subjectEnrollments).values({
    studentId,
    subjectId,
    userId,
  });
  
  return { success: true };
}

export async function unenrollStudentFromSubject(enrollmentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(subjectEnrollments)
    .where(and(
      eq(subjectEnrollments.id, enrollmentId),
      eq(subjectEnrollments.userId, userId)
    ));
  
  return { success: true };
}

export async function getStudentsBySubject(subjectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const enrollments = await db.select({
    enrollmentId: subjectEnrollments.id,
    studentId: students.id,
    registrationNumber: students.registrationNumber,
    fullName: students.fullName,
    enrolledAt: subjectEnrollments.enrolledAt,
    status: subjectEnrollments.status,
  })
    .from(subjectEnrollments)
    .innerJoin(students, eq(subjectEnrollments.studentId, students.id))
    .where(and(
      eq(subjectEnrollments.subjectId, subjectId),
      eq(subjectEnrollments.userId, userId)
    ))
    .orderBy(students.fullName);
  
  return enrollments;
}

export async function getSubjectsByStudent(studentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const enrollments = await db.select({
    subjectId: subjects.id,
    subjectName: subjects.name,
    subjectCode: subjects.code,
    enrolledAt: subjectEnrollments.enrolledAt,
  })
    .from(subjectEnrollments)
    .innerJoin(subjects, eq(subjectEnrollments.subjectId, subjects.id))
    .where(and(
      eq(subjectEnrollments.studentId, studentId),
      eq(subjectEnrollments.userId, userId)
    ))
    .orderBy(subjects.name);
  
  return enrollments;
}


// ==================== ANNOUNCEMENTS (AVISOS) ====================

export async function createAnnouncement(data: { title: string; message: string; isImportant: boolean; subjectId: number; userId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(announcements).values(data);
  return { id: Number(result[0].insertId), ...data };
}

export async function getAnnouncementsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select({
    id: announcements.id,
    title: announcements.title,
    message: announcements.message,
    isImportant: announcements.isImportant,
    subjectId: announcements.subjectId,
    subjectName: subjects.name,
    createdAt: announcements.createdAt,
    updatedAt: announcements.updatedAt,
  })
    .from(announcements)
    .innerJoin(subjects, eq(announcements.subjectId, subjects.id))
    .where(eq(announcements.userId, userId))
    .orderBy(desc(announcements.createdAt));
  
  return result;
}

export async function getAnnouncementsForStudent(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar avisos das disciplinas em que o aluno está matriculado
  const result = await db.select({
    id: announcements.id,
    title: announcements.title,
    message: announcements.message,
    isImportant: announcements.isImportant,
    subjectId: announcements.subjectId,
    subjectName: subjects.name,
    createdAt: announcements.createdAt,
    isRead: announcementReads.readAt,
  })
    .from(announcements)
    .innerJoin(subjects, eq(announcements.subjectId, subjects.id))
    .innerJoin(subjectEnrollments, eq(subjectEnrollments.subjectId, announcements.subjectId))
    .leftJoin(announcementReads, and(
      eq(announcementReads.announcementId, announcements.id),
      eq(announcementReads.studentId, studentId)
    ))
    .where(eq(subjectEnrollments.studentId, studentId))
    .orderBy(desc(announcements.isImportant), desc(announcements.createdAt));
  
  return result;
}

export async function getUnreadAnnouncementsCount(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select({
    count: sql<number>`COUNT(DISTINCT ${announcements.id})`,
  })
    .from(announcements)
    .innerJoin(subjectEnrollments, eq(subjectEnrollments.subjectId, announcements.subjectId))
    .leftJoin(announcementReads, and(
      eq(announcementReads.announcementId, announcements.id),
      eq(announcementReads.studentId, studentId)
    ))
    .where(and(
      eq(subjectEnrollments.studentId, studentId),
      sql`${announcementReads.id} IS NULL`
    ));
  
  return result[0]?.count || 0;
}

export async function markAnnouncementAsRead(announcementId: number, studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    await db.insert(announcementReads).values({
      announcementId,
      studentId,
    });
    return { success: true };
  } catch (error: any) {
    // Se já foi marcado como lido, ignorar erro de duplicata
    if (error.code === 'ER_DUP_ENTRY') {
      return { success: true };
    }
    throw error;
  }
}

export async function updateAnnouncement(id: number, data: { title?: string; message?: string; isImportant?: boolean }, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(announcements)
    .set(data)
    .where(and(
      eq(announcements.id, id),
      eq(announcements.userId, userId)
    ));
  
  return { success: true };
}

export async function deleteAnnouncement(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Deletar leituras associadas primeiro
  await db.delete(announcementReads).where(eq(announcementReads.announcementId, id));
  
  // Deletar aviso
  await db.delete(announcements).where(and(
    eq(announcements.id, id),
    eq(announcements.userId, userId)
  ));
  
  return { success: true };
}


// ==================== STUDENT NOTIFICATIONS ====================

export async function getStudentNotifications(studentId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(notifications)
    .where(eq(notifications.userId, studentId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getStudentUnreadNotificationsCount(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(
      eq(notifications.userId, studentId),
      eq(notifications.isRead, false)
    ));
  
  return result[0]?.count || 0;
}

export async function markStudentNotificationAsRead(id: number, studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications)
    .set({ isRead: true })
    .where(and(
      eq(notifications.id, id),
      eq(notifications.userId, studentId)
    ));
  
  return { success: true };
}

export async function markAllStudentNotificationsAsRead(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications)
    .set({ isRead: true })
    .where(and(
      eq(notifications.userId, studentId),
      eq(notifications.isRead, false)
    ));
  
  return { success: true };
}


// ==================== CÓDIGOS DE CONVITE ====================

// Gerar código alfanumérico único
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem I, O, 0, 1 para evitar confusão
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Criar código de convite
export async function createInviteCode(data: {
  createdBy: number;
  maxUses?: number;
  expiresAt?: Date;
  description?: string;
}): Promise<{ id: number; code: string } | null> {
  const db = await getDb();
  if (!db) return null;

  const code = generateInviteCode();
  
  try {
    const result = await db.insert(inviteCodes).values({
      code,
      createdBy: data.createdBy,
      maxUses: data.maxUses || 1,
      expiresAt: data.expiresAt || null,
      description: data.description || null,
    });

    return { id: Number(result[0].insertId), code };
  } catch (error) {
    console.error("[Database] Error creating invite code:", error);
    return null;
  }
}

// Buscar código de convite por código
export async function getInviteCodeByCode(code: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(inviteCodes).where(eq(inviteCodes.code, code));
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Error getting invite code:", error);
    return null;
  }
}

// Validar código de convite
export async function validateInviteCode(code: string): Promise<{ valid: boolean; message: string; inviteId?: number }> {
  const invite = await getInviteCodeByCode(code);
  
  if (!invite) {
    return { valid: false, message: "Código de convite inválido" };
  }
  
  if (!invite.isActive) {
    return { valid: false, message: "Este código de convite foi desativado" };
  }
  
  if (invite.currentUses >= invite.maxUses) {
    return { valid: false, message: "Este código de convite já foi utilizado o número máximo de vezes" };
  }
  
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return { valid: false, message: "Este código de convite expirou" };
  }
  
  return { valid: true, message: "Código válido", inviteId: invite.id };
}

// Usar código de convite (incrementar uso)
export async function useInviteCode(code: string, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(inviteCodes)
      .set({
        currentUses: sql`${inviteCodes.currentUses} + 1`,
        usedBy: userId,
      })
      .where(eq(inviteCodes.code, code));
    return true;
  } catch (error) {
    console.error("[Database] Error using invite code:", error);
    return false;
  }
}

// Listar todos os códigos de convite (admin)
export async function getAllInviteCodes() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.select().from(inviteCodes).orderBy(desc(inviteCodes.createdAt));
    return result;
  } catch (error) {
    console.error("[Database] Error getting invite codes:", error);
    return [];
  }
}

// Desativar código de convite
export async function deactivateInviteCode(codeId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(inviteCodes)
      .set({ isActive: false })
      .where(eq(inviteCodes.id, codeId));
    return true;
  } catch (error) {
    console.error("[Database] Error deactivating invite code:", error);
    return false;
  }
}

// Reativar código de convite
export async function reactivateInviteCode(codeId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(inviteCodes)
      .set({ isActive: true })
      .where(eq(inviteCodes.id, codeId));
    return true;
  } catch (error) {
    console.error("[Database] Error reactivating invite code:", error);
    return false;
  }
}

// Deletar código de convite
export async function deleteInviteCode(codeId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(inviteCodes).where(eq(inviteCodes.id, codeId));
    return true;
  } catch (error) {
    console.error("[Database] Error deleting invite code:", error);
    return false;
  }
}

// ==================== APROVAÇÃO DE USUÁRIOS ====================

// Listar usuários pendentes de aprovação
export async function getPendingUsers() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.select().from(users)
      .where(eq(users.approvalStatus, 'pending'))
      .orderBy(desc(users.createdAt));
    return result;
  } catch (error) {
    console.error("[Database] Error getting pending users:", error);
    return [];
  }
}

// Aprovar usuário
export async function approveUser(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(users)
      .set({ approvalStatus: 'approved' })
      .where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("[Database] Error approving user:", error);
    return false;
  }
}

// Rejeitar usuário
export async function rejectUser(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(users)
      .set({ approvalStatus: 'rejected' })
      .where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("[Database] Error rejecting user:", error);
    return false;
  }
}

// Atualizar status de aprovação e código de convite do usuário
export async function updateUserApprovalStatus(userId: number, status: 'approved' | 'pending' | 'rejected', inviteCode?: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const updateData: { approvalStatus: 'approved' | 'pending' | 'rejected'; inviteCode?: string } = { approvalStatus: status };
    if (inviteCode) {
      updateData.inviteCode = inviteCode;
    }
    
    await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("[Database] Error updating user approval status:", error);
    return false;
  }
}

// Buscar usuário por ID com status de aprovação
export async function getUserWithApprovalStatus(userId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(users).where(eq(users.id, userId));
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Error getting user:", error);
    return null;
  }
}

// ==================== AUTENTICAÇÃO DE PROFESSOR COM E-MAIL/SENHA ====================

// Buscar usuário por e-mail
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Error getting user by email:", error);
    return null;
  }
}

// Criar professor com e-mail e senha
export async function createTeacherWithPassword(data: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<{ id: number; openId: string } | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Gerar openId único para o professor
    const openId = `teacher-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    await db.insert(users).values({
      openId,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      loginMethod: 'email',
      role: 'user',
      active: true,
      approvalStatus: 'approved', // Aprovado automaticamente
    });

    // Buscar o usuário criado para retornar o ID
    const created = await db.select().from(users)
      .where(eq(users.openId, openId))
      .limit(1);
    
    if (created[0]) {
      return { id: created[0].id, openId: created[0].openId };
    }
    return null;
  } catch (error) {
    console.error("[Database] Error creating teacher:", error);
    return null;
  }
}

// Atualizar senha do usuário
export async function updateUserPassword(userId: number, passwordHash: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("[Database] Error updating password:", error);
    return false;
  }
}

// ===== RECUPERAÇÃO DE SENHA =====

// Criar token de recuperação de senha
export async function createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
      used: false,
    });
    return true;
  } catch (error) {
    console.error("[Database] Error creating password reset token:", error);
    return false;
  }
}

// Buscar token de recuperação válido
export async function getPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        gt(passwordResetTokens.expiresAt, new Date())
      ))
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Error getting password reset token:", error);
    return null;
  }
}

// Marcar token como usado
export async function markTokenAsUsed(token: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
    return true;
  } catch (error) {
    console.error("[Database] Error marking token as used:", error);
    return false;
  }
}

// Deletar tokens expirados ou usados (limpeza)
export async function cleanupExpiredTokens(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(passwordResetTokens)
      .where(or(
        eq(passwordResetTokens.used, true),
        lt(passwordResetTokens.expiresAt, new Date())
      ));
    return true;
  } catch (error) {
    console.error("[Database] Error cleaning up tokens:", error);
    return false;
  }
}
