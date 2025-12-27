import { and, or, desc, asc, eq, ne, gte, lte, gt, lt, inArray, sql } from "drizzle-orm";
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
  InsertInviteCode,
  studentPoints,
  pointsHistory,
  badges,
  studentBadges,
  gamificationNotifications,
  computationalThinkingScores,
  ctExercises,
  ctSubmissions,
  ctBadges,
  studentCTBadges,
  studentSubjectPoints,
  subjectPointsHistory,
  subjectBadges,
  studentSubjectBadges,
  studentExercises,
  studentExerciseAttempts,
  studentExerciseAnswers,
  InsertStudentExercise,
  InsertStudentExerciseAttempt,
  InsertStudentExerciseAnswer
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
  
  // Buscar informações da submissão
  const submission = await db.select()
    .from(assignmentSubmissions)
    .where(eq(assignmentSubmissions.id, id))
    .limit(1);
  
  if (submission.length === 0) {
    throw new Error("Submissão não encontrada");
  }
  
  const submissionData = submission[0];
  
  // Buscar atividade para obter tipo e nota máxima
  const assignment = await db.select()
    .from(topicAssignments)
    .where(eq(topicAssignments.id, submissionData.assignmentId))
    .limit(1);
  
  if (assignment.length === 0) {
    throw new Error("Atividade não encontrada");
  }
  
  const assignmentData = assignment[0];
  
  // Buscar tópico para obter módulo
  const topic = await db.select()
    .from(learningTopics)
    .where(eq(learningTopics.id, assignmentData.topicId))
    .limit(1);
  
  if (topic.length === 0) {
    throw new Error("Tópico não encontrado");
  }
  
  // Buscar módulo para obter disciplina
  const module = await db.select()
    .from(learningModules)
    .where(eq(learningModules.id, topic[0].moduleId))
    .limit(1);
  
  if (module.length === 0) {
    throw new Error("Módulo não encontrado");
  }
  
  const subjectId = module[0].subjectId;
  
  // Atualizar submissão
  await db.update(assignmentSubmissions)
    .set({
      score: data.score,
      feedback: data.feedback,
      gradedBy: data.gradedBy,
      gradedAt: new Date(),
      status: 'graded',
    })
    .where(eq(assignmentSubmissions.id, id));
  
  // Calcular pontos baseado no tipo de atividade e desempenho
  const maxScore = assignmentData.maxScore || 100;
  const percentage = (data.score / maxScore) * 100;
  
  // Pontos base por tipo de atividade
  const basePoints: Record<string, number> = {
    exercise: 10,
    quiz: 15,
    practical: 25,
    project: 50,
    essay: 30,
  };
  
  let points = basePoints[assignmentData.type] || 10;
  
  // Bônus por desempenho
  if (percentage >= 90) {
    points += Math.floor(points * 0.5); // +50% de bônus
  } else if (percentage >= 70) {
    points += Math.floor(points * 0.25); // +25% de bônus
  }
  
  // Adicionar pontos ao aluno na disciplina
  try {
    await addSubjectPoints(
      submissionData.studentId,
      subjectId,
      points,
      assignmentData.type,
      assignmentData.id,
      `Atividade: ${assignmentData.title} (${percentage.toFixed(0)}%)`
    );
  } catch (error) {
    console.error("[Database] Erro ao adicionar pontos de gamificação:", error);
    // Não falhar a avaliação se houver erro na gamificação
  }
  
  return { success: true, pointsEarned: points };
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

// ==================== GAMIFICATION FUNCTIONS ====================

// Configuração das faixas
export const BELT_CONFIG = [
  { name: 'white', label: 'Branca', minPoints: 0, maxPoints: 200, color: 'gray' },
  { name: 'yellow', label: 'Amarela', minPoints: 200, maxPoints: 400, color: 'yellow' },
  { name: 'orange', label: 'Laranja', minPoints: 400, maxPoints: 600, color: 'orange' },
  { name: 'green', label: 'Verde', minPoints: 600, maxPoints: 900, color: 'green' },
  { name: 'blue', label: 'Azul', minPoints: 900, maxPoints: 1200, color: 'blue' },
  { name: 'purple', label: 'Roxa', minPoints: 1200, maxPoints: 1600, color: 'purple' },
  { name: 'brown', label: 'Marrom', minPoints: 1600, maxPoints: 2000, color: 'brown' },
  { name: 'black', label: 'Preta', minPoints: 2000, maxPoints: 999999, color: 'black' },
];

// Calcular faixa baseado em pontos
export function calculateBelt(points: number): string {
  for (const belt of BELT_CONFIG) {
    if (points >= belt.minPoints && points < belt.maxPoints) {
      return belt.name;
    }
  }
  return 'black'; // Máximo
}

// Obter ou criar pontuação do aluno
export async function getOrCreateStudentPoints(studentId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const existing = await db.select().from(studentPoints)
      .where(eq(studentPoints.studentId, studentId))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Criar novo registro
    await db.insert(studentPoints).values({
      studentId,
      totalPoints: 0,
      currentBelt: 'white',
      streakDays: 0,
      lastActivityDate: null,
    });

    // Buscar o registro recém-criado
    const newRecord = await db.select().from(studentPoints)
      .where(eq(studentPoints.studentId, studentId))
      .limit(1);

    return newRecord[0];
  } catch (error) {
    console.error("[Database] Error getting/creating student points:", error);
    return null;
  }
}

// Adicionar pontos ao aluno
export async function addPointsToStudent(
  studentId: number,
  points: number,
  reason: string,
  activityType: string,
  relatedId?: number
) {
  const db = await getDb();
  if (!db) return null;

  try {
    // Obter pontuação atual
    const current = await getOrCreateStudentPoints(studentId);
    if (!current) return null;

    const newTotalPoints = current.totalPoints + points;
    const newBelt = calculateBelt(newTotalPoints);
    const oldBelt = current.currentBelt;

    // Atualizar pontuação
    await db.update(studentPoints)
      .set({
        totalPoints: newTotalPoints,
        currentBelt: newBelt,
        updatedAt: new Date(),
      })
      .where(eq(studentPoints.studentId, studentId));

    // Registrar no histórico
    await db.insert(pointsHistory).values({
      studentId,
      points,
      reason,
      activityType,
      relatedId,
    });

    // Se subiu de faixa, criar notificação
    if (newBelt !== oldBelt) {
      const beltInfo = BELT_CONFIG.find(b => b.name === newBelt);
      await db.insert(gamificationNotifications).values({
        studentId,
        type: 'belt_upgrade',
        title: `🥋 Nova Faixa: ${beltInfo?.label || newBelt}!`,
        message: `Parabéns! Você alcançou a faixa ${beltInfo?.label || newBelt} com ${newTotalPoints} pontos!`,
        isRead: false,
      });
    }

    return { newTotalPoints, newBelt, oldBelt };
  } catch (error) {
    console.error("[Database] Error adding points to student:", error);
    return null;
  }
}

// Atualizar streak do aluno
export async function updateStudentStreak(studentId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const current = await getOrCreateStudentPoints(studentId);
    if (!current) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newStreak = current.streakDays;

    if (!current.lastActivityDate) {
      // Primeira atividade
      newStreak = 1;
    } else {
      const lastActivity = new Date(current.lastActivityDate);
      lastActivity.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Mesmo dia, não incrementa
        return current;
      } else if (diffDays === 1) {
        // Dia consecutivo
        newStreak = current.streakDays + 1;

        // Conceder badges de streak
        if (newStreak === 7) {
          await awardBadgeToStudent(studentId, 'fire_streak_7');
        } else if (newStreak === 30) {
          await awardBadgeToStudent(studentId, 'fire_streak_30');
        }
      } else {
        // Quebrou o streak
        newStreak = 1;
      }
    }

    await db.update(studentPoints)
      .set({
        streakDays: newStreak,
        lastActivityDate: today,
        updatedAt: new Date(),
      })
      .where(eq(studentPoints.studentId, studentId));

    return { streakDays: newStreak };
  } catch (error) {
    console.error("[Database] Error updating student streak:", error);
    return null;
  }
}

// Conceder badge ao aluno
export async function awardBadgeToStudent(studentId: number, badgeCode: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    // Verificar se badge existe
    const badge = await db.select().from(badges)
      .where(eq(badges.code, badgeCode))
      .limit(1);

    if (badge.length === 0) return null;

    // Verificar se aluno já tem o badge
    const existing = await db.select().from(studentBadges)
      .where(and(
        eq(studentBadges.studentId, studentId),
        eq(studentBadges.badgeId, badge[0].id)
      ))
      .limit(1);

    if (existing.length > 0) return null; // Já tem

    // Conceder badge
    await db.insert(studentBadges).values({
      studentId,
      badgeId: badge[0].id,
    });

    // Criar notificação
    await db.insert(gamificationNotifications).values({
      studentId,
      type: 'badge_earned',
      title: `🏆 Novo Badge: ${badge[0].name}!`,
      message: badge[0].description || `Você conquistou o badge ${badge[0].name}!`,
      isRead: false,
    });

    return badge[0];
  } catch (error) {
    console.error("[Database] Error awarding badge to student:", error);
    return null;
  }
}

// Obter histórico de pontos do aluno
export async function getStudentPointsHistory(studentId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  try {
    const history = await db.select().from(pointsHistory)
      .where(eq(pointsHistory.studentId, studentId))
      .orderBy(desc(pointsHistory.createdAt))
      .limit(limit);

    return history;
  } catch (error) {
    console.error("[Database] Error getting student points history:", error);
    return [];
  }
}

// Obter badges conquistados pelo aluno
export async function getStudentBadges(studentId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const earnedBadges = await db.select({
      id: studentBadges.id,
      badgeId: studentBadges.badgeId,
      earnedAt: studentBadges.earnedAt,
      code: badges.code,
      name: badges.name,
      description: badges.description,
      icon: badges.icon,
    })
    .from(studentBadges)
    .innerJoin(badges, eq(studentBadges.badgeId, badges.id))
    .where(eq(studentBadges.studentId, studentId))
    .orderBy(desc(studentBadges.earnedAt));

    return earnedBadges;
  } catch (error) {
    console.error("[Database] Error getting student badges:", error);
    return [];
  }
}

// Obter todos os badges disponíveis
export async function getAllBadges() {
  const db = await getDb();
  if (!db) return [];

  try {
    const allBadges = await db.select().from(badges)
      .orderBy(badges.id);

    return allBadges;
  } catch (error) {
    console.error("[Database] Error getting all badges:", error);
    return [];
  }
}

// Obter notificações de gamificação
export async function getGamificationNotifications(studentId: number, onlyUnread: boolean = false) {
  const db = await getDb();
  if (!db) return [];

  try {
    const conditions = [eq(gamificationNotifications.studentId, studentId)];
    
    if (onlyUnread) {
      conditions.push(eq(gamificationNotifications.isRead, false));
    }

    const notifications = await db.select().from(gamificationNotifications)
      .where(and(...conditions))
      .orderBy(desc(gamificationNotifications.createdAt));

    return notifications;
  } catch (error) {
    console.error("[Database] Error getting gamification notifications:", error);
    return [];
  }
}

// Marcar notificação como lida
export async function markGamificationNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(gamificationNotifications)
      .set({ isRead: true })
      .where(eq(gamificationNotifications.id, notificationId));

    return true;
  } catch (error) {
    console.error("[Database] Error marking notification as read:", error);
    return false;
  }
}

// Obter ranking da turma
export async function getClassRanking(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  try {
    const ranking = await db.select({
      studentId: studentPoints.studentId,
      studentName: students.fullName,
      totalPoints: studentPoints.totalPoints,
      currentBelt: studentPoints.currentBelt,
      streakDays: studentPoints.streakDays,
    })
    .from(studentPoints)
    .innerJoin(students, eq(studentPoints.studentId, students.id))
    .orderBy(desc(studentPoints.totalPoints))
    .limit(limit);

    return ranking;
  } catch (error) {
    console.error("[Database] Error getting class ranking:", error);
    return [];
  }
}

// ==================== TEACHER DASHBOARD FUNCTIONS ====================

// Obter total de alunos com badges
export async function getTotalStudentsWithBadges() {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db.select({ studentId: studentBadges.studentId })
      .from(studentBadges)
      .groupBy(studentBadges.studentId);

    return result.length;
  } catch (error) {
    console.error("[Database] Error getting total students with badges:", error);
    return 0;
  }
}

// Obter estatísticas de badges (quantos alunos conquistaram cada badge)
export async function getBadgeStatistics() {
  const db = await getDb();
  if (!db) return [];

  try {
    const allBadges = await db.select().from(badges);
    const badgeStats = [];

    for (const badge of allBadges) {
      const earnedCount = await db.select({ studentId: studentBadges.studentId })
        .from(studentBadges)
        .where(eq(studentBadges.badgeId, badge.id));

      badgeStats.push({
        ...badge,
        earnedCount: earnedCount.length,
      });
    }

    // Ordenar por mais conquistados
    return badgeStats.sort((a, b) => b.earnedCount - a.earnedCount);
  } catch (error) {
    console.error("[Database] Error getting badge statistics:", error);
    return [];
  }
}

// Contar quantos exercícios o aluno completou
export async function getStudentExerciseCount(studentId: number) {
  const db = await getDb();
  if (!db) return 0;

  try {
    const history = await db.select()
      .from(pointsHistory)
      .where(
        and(
          eq(pointsHistory.studentId, studentId),
          or(
            eq(pointsHistory.activityType, 'exercise_objective'),
            eq(pointsHistory.activityType, 'exercise_subjective'),
            eq(pointsHistory.activityType, 'exercise_case_study')
          )
        )
      );

    return history.length;
  } catch (error) {
    console.error("[Database] Error counting student exercises:", error);
    return 0;
  }
}

// Obter evolução temporal de pontos (últimas 4 semanas)
export async function getPointsEvolutionData() {
  const db = await getDb();
  if (!db) return [];

  try {
    // Calcular data de 4 semanas atrás
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    // Buscar histórico de pontos das últimas 4 semanas
    const history = await db.select({
      createdAt: pointsHistory.createdAt,
      points: pointsHistory.points,
    })
    .from(pointsHistory)
    .where(sql`${pointsHistory.createdAt} >= ${fourWeeksAgo}`)
    .orderBy(pointsHistory.createdAt);

    // Agrupar por semana
    const weeklyData: { [key: string]: number } = {};
    
    history.forEach((entry) => {
      if (!entry.createdAt) return;
      
      const date = new Date(entry.createdAt);
      // Calcular número da semana (0-3, sendo 0 a mais antiga)
      const daysDiff = Math.floor((date.getTime() - fourWeeksAgo.getTime()) / (1000 * 60 * 60 * 24));
      const weekNumber = Math.floor(daysDiff / 7);
      
      const weekKey = `Semana ${weekNumber + 1}`;
      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + entry.points;
    });

    // Garantir que todas as 4 semanas existam
    const result = [];
    for (let i = 0; i < 4; i++) {
      const weekKey = `Semana ${i + 1}`;
      result.push({
        week: weekKey,
        totalPoints: weeklyData[weekKey] || 0,
      });
    }

    return result;
  } catch (error) {
    console.error("[Database] Error getting points evolution data:", error);
    return [];
  }
}


// ==================== PENSAMENTO COMPUTACIONAL ====================

/**
 * Criar ou atualizar pontuação de uma dimensão do PC
 */
export async function updateCTScore(studentId: number, dimension: string, scoreToAdd: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    const existing = await db
      .select()
      .from(computationalThinkingScores)
      .where(
        and(
          eq(computationalThinkingScores.studentId, studentId),
          eq(computationalThinkingScores.dimension, dimension as any)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Atualizar pontuação existente (média ponderada)
      const currentScore = existing[0].score;
      const exercisesCompleted = existing[0].exercisesCompleted + 1;
      const newScore = Math.round((currentScore * existing[0].exercisesCompleted + scoreToAdd) / exercisesCompleted);
      
      await db
        .update(computationalThinkingScores)
        .set({
          score: Math.min(100, newScore), // Máximo 100
          exercisesCompleted,
          lastUpdated: new Date(),
        })
        .where(eq(computationalThinkingScores.id, existing[0].id));
      
      return { score: Math.min(100, newScore), exercisesCompleted };
    } else {
      // Criar novo registro
      await db.insert(computationalThinkingScores).values({
        studentId,
        dimension: dimension as any,
        score: Math.min(100, scoreToAdd),
        exercisesCompleted: 1,
      });
      
      return { score: Math.min(100, scoreToAdd), exercisesCompleted: 1 };
    }
  } catch (error) {
    console.error("[Database] Error updating CT score:", error);
    throw error;
  }
}

/**
 * Buscar perfil completo de PC do aluno (4 dimensões)
 */
export async function getStudentCTProfile(studentId: number) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const scores = await db
      .select()
      .from(computationalThinkingScores)
      .where(eq(computationalThinkingScores.studentId, studentId));

    // Garantir que todas as 4 dimensões existam (mesmo com score 0)
    const dimensions = ['decomposition', 'pattern_recognition', 'abstraction', 'algorithms'];
    const profile: any = {};
    
    dimensions.forEach(dim => {
      const found = scores.find(s => s.dimension === dim);
      profile[dim] = found ? {
        score: found.score,
        exercisesCompleted: found.exercisesCompleted,
        lastUpdated: found.lastUpdated,
      } : {
        score: 0,
        exercisesCompleted: 0,
        lastUpdated: null,
      };
    });

    return profile;
  } catch (error) {
    console.error("[Database] Error getting student CT profile:", error);
    return null;
  }
}

/**
 * Buscar média da turma em cada dimensão
 */
export async function getClassCTAverage(userId: number) {
  const db = await getDb();
  if (!db) return { decomposition: 0, pattern_recognition: 0, abstraction: 0, algorithms: 0 };
  
  try {
    // Buscar todos os alunos do professor
    const teacherStudents = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.userId, userId));

    if (teacherStudents.length === 0) {
      return {
        decomposition: 0,
        pattern_recognition: 0,
        abstraction: 0,
        algorithms: 0,
      };
    }

    const studentIds = teacherStudents.map(s => s.id);

    // Buscar todas as pontuações
    const allScores = await db
      .select()
      .from(computationalThinkingScores)
      .where(inArray(computationalThinkingScores.studentId, studentIds));

    // Calcular média por dimensão
    const dimensions = ['decomposition', 'pattern_recognition', 'abstraction', 'algorithms'];
    const averages: any = {};

    dimensions.forEach(dim => {
      const dimScores = allScores.filter(s => s.dimension === dim);
      const sum = dimScores.reduce((acc, s) => acc + s.score, 0);
      averages[dim] = dimScores.length > 0 ? Math.round(sum / dimScores.length) : 0;
    });

    return averages;
  } catch (error) {
    console.error("[Database] Error getting class CT average:", error);
    return {
      decomposition: 0,
      pattern_recognition: 0,
      abstraction: 0,
      algorithms: 0,
    };
  }
}

/**
 * Criar exercício de PC
 */
export async function createCTExercise(data: {
  title: string;
  description: string;
  dimension: string;
  difficulty: string;
  content: string;
  expectedAnswer?: string;
  points: number;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    const result = await db.insert(ctExercises).values({
      ...data,
      dimension: data.dimension as any,
      difficulty: data.difficulty as any,
    });
    return result;
  } catch (error) {
    console.error("[Database] Error creating CT exercise:", error);
    throw error;
  }
}

/**
 * Buscar exercícios de PC (com filtros opcionais)
 */
export async function getCTExercises(filters?: {
  dimension?: string;
  difficulty?: string;
  createdBy?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    let query = db.select().from(ctExercises).where(eq(ctExercises.isActive, true));

    // Aplicar filtros se fornecidos
    // (Simplificado - em produção usar query builder dinâmico)
    
    const exercises = await query;
    return exercises;
  } catch (error) {
    console.error("[Database] Error getting CT exercises:", error);
    return [];
  }
}

/**
 * Submeter resposta de exercício de PC
 */
export async function submitCTExercise(data: {
  studentId: number;
  exerciseId: number;
  answer: string;
  score: number;
  feedback?: string;
  timeSpent?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    // Inserir submissão
    await db.insert(ctSubmissions).values(data);

    // Buscar exercício para pegar a dimensão
    const exercise = await db
      .select()
      .from(ctExercises)
      .where(eq(ctExercises.id, data.exerciseId))
      .limit(1);

    if (exercise.length > 0) {
      // Atualizar pontuação da dimensão
      await updateCTScore(data.studentId, exercise[0].dimension, data.score);
    }

    return { success: true };
  } catch (error) {
    console.error("[Database] Error submitting CT exercise:", error);
    throw error;
  }
}

/**
 * Buscar histórico de submissões do aluno
 */
export async function getStudentCTSubmissions(studentId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const submissions = await db
      .select({
        id: ctSubmissions.id,
        exerciseId: ctSubmissions.exerciseId,
        exerciseTitle: ctExercises.title,
        dimension: ctExercises.dimension,
        answer: ctSubmissions.answer,
        score: ctSubmissions.score,
        feedback: ctSubmissions.feedback,
        timeSpent: ctSubmissions.timeSpent,
        submittedAt: ctSubmissions.submittedAt,
      })
      .from(ctSubmissions)
      .leftJoin(ctExercises, eq(ctSubmissions.exerciseId, ctExercises.id))
      .where(eq(ctSubmissions.studentId, studentId))
      .orderBy(desc(ctSubmissions.submittedAt))
      .limit(limit);

    return submissions;
  } catch (error) {
    console.error("[Database] Error getting student CT submissions:", error);
    return [];
  }
}

/**
 * Conceder badge de PC ao aluno
 */
export async function awardCTBadge(studentId: number, badgeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    // Verificar se já possui o badge
    const existing = await db
      .select()
      .from(studentCTBadges)
      .where(
        and(
          eq(studentCTBadges.studentId, studentId),
          eq(studentCTBadges.badgeId, badgeId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return { alreadyHas: true };
    }

    // Conceder badge
    await db.insert(studentCTBadges).values({
      studentId,
      badgeId,
    });

    // Buscar informações do badge
    const badge = await db
      .select()
      .from(ctBadges)
      .where(eq(ctBadges.id, badgeId))
      .limit(1);

    // Se o badge dá pontos de gamificação, adicionar
    if (badge.length > 0 && badge[0].points > 0) {
      await addPointsToStudent(studentId, badge[0].points, 'ct_badge', `Badge de PC: ${badge[0].name}`);
    }

    return { success: true, badge: badge[0] };
  } catch (error) {
    console.error("[Database] Error awarding CT badge:", error);
    throw error;
  }
}

/**
 * Buscar badges de PC do aluno
 */
export async function getStudentCTBadges(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const badges = await db
      .select({
        id: studentCTBadges.id,
        badgeId: ctBadges.id,
        name: ctBadges.name,
        description: ctBadges.description,
        dimension: ctBadges.dimension,
        icon: ctBadges.icon,
        color: ctBadges.color,
        earnedAt: studentCTBadges.earnedAt,
      })
      .from(studentCTBadges)
      .leftJoin(ctBadges, eq(studentCTBadges.badgeId, ctBadges.id))
      .where(eq(studentCTBadges.studentId, studentId))
      .orderBy(desc(studentCTBadges.earnedAt));

    return badges;
  } catch (error) {
    console.error("[Database] Error getting student CT badges:", error);
    return [];
  }
}

/**
 * Buscar todos os badges de PC disponíveis
 */
export async function getAllCTBadges() {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const badges = await db.select().from(ctBadges).orderBy(ctBadges.dimension);
    return badges;
  } catch (error) {
    console.error("[Database] Error getting all CT badges:", error);
    return [];
  }
}

/**
 * Verificar e conceder badges automaticamente baseado nas pontuações
 */
export async function checkAndAwardCTBadges(studentId: number) {
  try {
    const profile = await getStudentCTProfile(studentId);
    const allBadges = await getAllCTBadges();
    const studentBadges = await getStudentCTBadges(studentId);
    const studentBadgeIds = studentBadges.map(b => b.badgeId);

    const badgesToAward = [];

    for (const badge of allBadges) {
      // Pular se já possui
      if (studentBadgeIds.includes(badge.id)) continue;

      const requirement = JSON.parse(badge.requirement);

      // Badge "Mestre da Lógica" - 80+ em Algoritmos
      if (badge.name === 'Mestre da Lógica' && profile.algorithms.score >= 80) {
        badgesToAward.push(badge.id);
      }

      // Badge "Caçador de Padrões" - 80+ em Reconhecimento de Padrões
      if (badge.name === 'Caçador de Padrões' && profile.pattern_recognition.score >= 80) {
        badgesToAward.push(badge.id);
      }

      // Badge "Simplificador" - 80+ em Abstração
      if (badge.name === 'Simplificador' && profile.abstraction.score >= 80) {
        badgesToAward.push(badge.id);
      }

      // Badge "Quebra-Cabeças" - 80+ em Decomposição
      if (badge.name === 'Quebra-Cabeças' && profile.decomposition.score >= 80) {
        badgesToAward.push(badge.id);
      }

      // Badge "Pensador Completo" - 70+ em todas as dimensões
      if (
        badge.name === 'Pensador Completo' &&
        profile.decomposition.score >= 70 &&
        profile.pattern_recognition.score >= 70 &&
        profile.abstraction.score >= 70 &&
        profile.algorithms.score >= 70
      ) {
        badgesToAward.push(badge.id);
      }
    }

    // Conceder badges
    for (const badgeId of badgesToAward) {
      await awardCTBadge(studentId, badgeId);
    }

    return { badgesAwarded: badgesToAward.length };
  } catch (error) {
    console.error("[Database] Error checking and awarding CT badges:", error);
    return { badgesAwarded: 0 };
  }
}


// ==================== GAMIFICAÇÃO POR DISCIPLINA ====================

/**
 * Obter ou criar pontos do aluno em uma disciplina específica
 */
export async function getOrCreateStudentSubjectPoints(studentId: number, subjectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const existing = await db
      .select()
      .from(studentSubjectPoints)
      .where(
        and(
          eq(studentSubjectPoints.studentId, studentId),
          eq(studentSubjectPoints.subjectId, subjectId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Criar novo registro
    await db.insert(studentSubjectPoints).values({
      studentId,
      subjectId,
      totalPoints: 0,
      currentBelt: "white",
      streakDays: 0,
    });

    const newRecord = await db
      .select()
      .from(studentSubjectPoints)
      .where(
        and(
          eq(studentSubjectPoints.studentId, studentId),
          eq(studentSubjectPoints.subjectId, subjectId)
        )
      )
      .limit(1);

    return newRecord[0];
  } catch (error) {
    console.error("[Database] Error getting/creating student subject points:", error);
    throw error;
  }
}

/**
 * Adicionar pontos ao aluno em uma disciplina específica
 */
export async function addSubjectPoints(
  studentId: number,
  subjectId: number,
  points: number,
  activityType: string,
  activityId: number | null,
  description: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Obter ou criar registro de pontos
    const studentPoints = await getOrCreateStudentSubjectPoints(studentId, subjectId);

    // Calcular novos pontos
    const newTotalPoints = studentPoints.totalPoints + points;

    // Determinar nova faixa
    const BELT_THRESHOLDS = [
      { name: "white", min: 0 },
      { name: "yellow", min: 100 },
      { name: "orange", min: 250 },
      { name: "green", min: 500 },
      { name: "blue", min: 1000 },
      { name: "purple", min: 2000 },
      { name: "brown", min: 3500 },
      { name: "black", min: 5000 },
    ];

    let newBelt = "white";
    for (const belt of BELT_THRESHOLDS) {
      if (newTotalPoints >= belt.min) {
        newBelt = belt.name;
      }
    }

    // Atualizar pontos
    await db
      .update(studentSubjectPoints)
      .set({
        totalPoints: newTotalPoints,
        currentBelt: newBelt,
        lastActivityDate: new Date(),
      })
      .where(
        and(
          eq(studentSubjectPoints.studentId, studentId),
          eq(studentSubjectPoints.subjectId, subjectId)
        )
      );

    // Adicionar ao histórico
    await db.insert(subjectPointsHistory).values({
      studentId,
      subjectId,
      points,
      activityType,
      activityId,
      description,
    });

    // Verificar se ganhou novos badges
    await checkAndAwardSubjectBadges(studentId, subjectId, newTotalPoints);

    return { newTotalPoints, newBelt, oldBelt: studentPoints.currentBelt };
  } catch (error) {
    console.error("[Database] Error adding subject points:", error);
    throw error;
  }
}

/**
 * Verificar e conceder badges baseados em pontos
 */
async function checkAndAwardSubjectBadges(studentId: number, subjectId: number, totalPoints: number) {
  const db = await getDb();
  if (!db) return;

  try {
    // Buscar badges disponíveis para a disciplina
    const availableBadges = await db
      .select()
      .from(subjectBadges)
      .where(
        and(
          eq(subjectBadges.subjectId, subjectId),
          lte(subjectBadges.requiredPoints, totalPoints)
        )
      );

    // Buscar badges já conquistados
    const earnedBadges = await db
      .select()
      .from(studentSubjectBadges)
      .where(
        and(
          eq(studentSubjectBadges.studentId, studentId),
          eq(studentSubjectBadges.subjectId, subjectId)
        )
      );

    const earnedBadgeIds = new Set(earnedBadges.map((b) => b.badgeId));

    // Conceder novos badges
    for (const badge of availableBadges) {
      if (!earnedBadgeIds.has(badge.id)) {
        await db.insert(studentSubjectBadges).values({
          studentId,
          subjectId,
          badgeId: badge.id,
        });
      }
    }
  } catch (error) {
    console.error("[Database] Error checking/awarding badges:", error);
  }
}

/**
 * Obter estatísticas de gamificação do aluno em uma disciplina
 */
export async function getStudentSubjectStats(studentId: number, subjectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const points = await getOrCreateStudentSubjectPoints(studentId, subjectId);

    // Buscar badges conquistados
    const earnedBadgesData = await db
      .select({
        badge: subjectBadges,
        earnedAt: studentSubjectBadges.earnedAt,
      })
      .from(studentSubjectBadges)
      .innerJoin(subjectBadges, eq(studentSubjectBadges.badgeId, subjectBadges.id))
      .where(
        and(
          eq(studentSubjectBadges.studentId, studentId),
          eq(studentSubjectBadges.subjectId, subjectId)
        )
      );

    // Buscar ranking na disciplina
    const allStudents = await db
      .select()
      .from(studentSubjectPoints)
      .where(eq(studentSubjectPoints.subjectId, subjectId))
      .orderBy(desc(studentSubjectPoints.totalPoints));

    const rankPosition = allStudents.findIndex((s) => s.studentId === studentId) + 1;

    return {
      totalPoints: points.totalPoints,
      currentBelt: points.currentBelt,
      streakDays: points.streakDays,
      badgesEarned: earnedBadgesData.length,
      rankPosition,
      totalStudents: allStudents.length,
    };
  } catch (error) {
    console.error("[Database] Error getting student subject stats:", error);
    throw error;
  }
}

/**
 * Obter ranking de uma disciplina
 */
export async function getSubjectRanking(subjectId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const ranking = await db
      .select({
        studentId: studentSubjectPoints.studentId,
        fullName: students.fullName,
        totalPoints: studentSubjectPoints.totalPoints,
        currentBelt: studentSubjectPoints.currentBelt,
        streakDays: studentSubjectPoints.streakDays,
      })
      .from(studentSubjectPoints)
      .innerJoin(students, eq(studentSubjectPoints.studentId, students.id))
      .where(eq(studentSubjectPoints.subjectId, subjectId))
      .orderBy(desc(studentSubjectPoints.totalPoints))
      .limit(limit);

    return ranking;
  } catch (error) {
    console.error("[Database] Error getting subject ranking:", error);
    return [];
  }
}

/**
 * Obter histórico de pontos de um aluno em uma disciplina
 */
export async function getSubjectPointsHistory(studentId: number, subjectId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const history = await db
      .select()
      .from(subjectPointsHistory)
      .where(
        and(
          eq(subjectPointsHistory.studentId, studentId),
          eq(subjectPointsHistory.subjectId, subjectId)
        )
      )
      .orderBy(desc(subjectPointsHistory.earnedAt))
      .limit(limit);

    return history;
  } catch (error) {
    console.error("[Database] Error getting subject points history:", error);
    return [];
  }
}

/**
 * Obter todas as disciplinas com pontos do aluno
 */
export async function getStudentSubjectsWithPoints(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const subjectsWithPoints = await db
      .select({
        subjectId: studentSubjectPoints.subjectId,
        subjectName: subjects.name,
        totalPoints: studentSubjectPoints.totalPoints,
        currentBelt: studentSubjectPoints.currentBelt,
        streakDays: studentSubjectPoints.streakDays,
      })
      .from(studentSubjectPoints)
      .innerJoin(subjects, eq(studentSubjectPoints.subjectId, subjects.id))
      .where(eq(studentSubjectPoints.studentId, studentId))
      .orderBy(desc(studentSubjectPoints.totalPoints));

    return subjectsWithPoints;
  } catch (error) {
    console.error("[Database] Error getting student subjects with points:", error);
    return [];
  }
}

/**
 * Criar badges padrão para uma disciplina
 */
export async function createDefaultSubjectBadges(subjectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const defaultBadges = [
    { badgeKey: "first_steps", name: "Primeiros Passos", description: "Complete sua primeira atividade", requiredPoints: 10 },
    { badgeKey: "dedicated", name: "Dedicado", description: "Alcance 100 pontos", requiredPoints: 100 },
    { badgeKey: "committed", name: "Comprometido", description: "Alcance 250 pontos", requiredPoints: 250 },
    { badgeKey: "expert", name: "Expert", description: "Alcance 500 pontos", requiredPoints: 500 },
    { badgeKey: "master", name: "Mestre", description: "Alcance 1000 pontos", requiredPoints: 1000 },
    { badgeKey: "legend", name: "Lenda", description: "Alcance 2000 pontos", requiredPoints: 2000 },
  ];

  try {
    for (const badge of defaultBadges) {
      await db.insert(subjectBadges).values({
        subjectId,
        ...badge,
      }).onDuplicateKeyUpdate({ set: { name: badge.name } });
    }
  } catch (error) {
    console.error("[Database] Error creating default subject badges:", error);
  }
}


// ============================================
// STUDENT EXERCISES - Exercícios para Alunos
// ============================================

/**
 * Criar um novo exercício para alunos
 */
export async function createStudentExercise(data: InsertStudentExercise) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(studentExercises).values(data);
  return result;
}

/**
 * Listar exercícios disponíveis para um aluno
 */
export async function listAvailableExercises(studentId: number, subjectId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const now = new Date();
  
  // Primeiro, buscar disciplinas em que o aluno está matriculado
  const enrolledSubjects = await db
    .select({ subjectId: subjectEnrollments.subjectId })
    .from(subjectEnrollments)
    .where(eq(subjectEnrollments.studentId, studentId));
  
  const enrolledSubjectIds = enrolledSubjects.map(e => e.subjectId);
  
  // Se o aluno não está matriculado em nenhuma disciplina, retornar vazio
  if (enrolledSubjectIds.length === 0) {
    return [];
  }
  
  const conditions = [
    eq(studentExercises.status, "published"),
    lte(studentExercises.availableFrom, now),
    // Apenas exercícios das disciplinas em que o aluno está matriculado
    inArray(studentExercises.subjectId, enrolledSubjectIds)
  ];
  
  if (subjectId) {
    conditions.push(eq(studentExercises.subjectId, subjectId));
  }
  
  const exercises = await db
    .select()
    .from(studentExercises)
    .where(and(...conditions));
  
  // Para cada exercício, buscar tentativas do aluno
  const exercisesWithAttempts = await Promise.all(
    exercises.map(async (exercise) => {
      const attempts = await db
        .select()
        .from(studentExerciseAttempts)
        .where(
          and(
            eq(studentExerciseAttempts.exerciseId, exercise.id),
            eq(studentExerciseAttempts.studentId, studentId)
          )
        )
        .orderBy(desc(studentExerciseAttempts.attemptNumber));
      
      return {
        ...exercise,
        attempts: attempts.length,
        lastAttempt: attempts[0] || null,
        canAttempt: exercise.maxAttempts === 0 || attempts.length < exercise.maxAttempts,
      };
    })
  );
  
  return exercisesWithAttempts;
}

/**
 * Obter detalhes de um exercício específico
 */
export async function getExerciseDetails(exerciseId: number, studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const exercise = await db
    .select()
    .from(studentExercises)
    .where(eq(studentExercises.id, exerciseId))
    .limit(1);
  
  if (!exercise[0]) return null;
  
  const subject = await db
    .select()
    .from(subjects)
    .where(eq(subjects.id, exercise[0].subjectId))
    .limit(1);
  
  const module = await db
    .select()
    .from(learningModules)
    .where(eq(learningModules.id, exercise[0].moduleId))
    .limit(1);
  
  const attempts = await db
    .select()
    .from(studentExerciseAttempts)
    .where(
      and(
        eq(studentExerciseAttempts.exerciseId, exerciseId),
        eq(studentExerciseAttempts.studentId, studentId)
      )
    )
    .orderBy(desc(studentExerciseAttempts.attemptNumber));
  
  const exerciseData = exercise[0].exerciseData ? JSON.parse(exercise[0].exerciseData as string) : { questions: [] };
  
  const currentAttempt = attempts.find(a => a.status === "in_progress");
  
  return {
    ...exercise[0],
    subjectName: subject[0]?.name || "Disciplina",
    moduleName: module[0]?.title || "Módulo",
    questions: exerciseData.questions || [],
    attempts,
    currentAttemptId: currentAttempt?.id || null,
    startedAt: currentAttempt?.startedAt || null,
    canAttempt: exercise[0].maxAttempts === 0 || attempts.length < exercise[0].maxAttempts,
  };
}

/**
 * Iniciar uma nova tentativa de exercício
 */
export async function startExerciseAttempt(exerciseId: number, studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar número de tentativas anteriores
  const previousAttempts = await db
    .select()
    .from(studentExerciseAttempts)
    .where(
      and(
        eq(studentExerciseAttempts.exerciseId, exerciseId),
        eq(studentExerciseAttempts.studentId, studentId)
      )
    );
  
  const attemptNumber = previousAttempts.length + 1;
  
  const result = await db.insert(studentExerciseAttempts).values({
    exerciseId,
    studentId,
    attemptNumber,
    answers: [],
    score: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    pointsEarned: 0,
    status: "in_progress",
    startedAt: new Date(),
  });
  
  return { attemptId: result[0].insertId, attemptNumber };
}

/**
 * Submeter tentativa de exercício completa
 */
export async function submitExerciseAttempt(
  attemptId: number,
  answers: any[],
  exerciseData: any
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar tentativa
  const attempt = await db
    .select()
    .from(studentExerciseAttempts)
    .where(eq(studentExerciseAttempts.id, attemptId))
    .limit(1);
  
  if (!attempt[0]) throw new Error("Attempt not found");
  
  // Calcular tempo gasto
  const timeSpent = Math.floor((Date.now() - attempt[0].startedAt.getTime()) / 1000);
  
  // Corrigir questões objetivas
  let correctAnswers = 0;
  const questions = exerciseData.exercises || [];
  
  const detailedAnswers = answers.map((answer, idx) => {
    const question = questions[idx];
    let isCorrect = false;
    
    if (question.type === "objective" && question.correctAnswer) {
      // Normalizar respostas para comparação
      const studentAns = answer.answer?.trim().toUpperCase();
      const correctAns = question.correctAnswer.trim().toUpperCase();
      isCorrect = studentAns === correctAns;
      if (isCorrect) correctAnswers++;
    }
    
    return {
      attemptId,
      questionNumber: idx + 1,
      questionType: question.type,
      studentAnswer: answer.answer || "",
      correctAnswer: question.correctAnswer || null,
      isCorrect: question.type === "objective" ? isCorrect : null,
      pointsAwarded: isCorrect ? 10 : 0, // 10 pontos por questão correta
    };
  });
  
  // Calcular pontuação
  const totalQuestions = questions.length;
  const score = Math.round((correctAnswers / totalQuestions) * 100);
  const pointsEarned = correctAnswers * 10; // 10 pontos por acerto
  
  // Atualizar tentativa
  await db
    .update(studentExerciseAttempts)
    .set({
      answers: JSON.stringify(answers),
      score,
      correctAnswers,
      totalQuestions,
      pointsEarned,
      timeSpent,
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(studentExerciseAttempts.id, attemptId));
  
  // Salvar respostas individuais
  for (const answer of detailedAnswers) {
    await db.insert(studentExerciseAnswers).values(answer);
  }
  
  return {
    score,
    correctAnswers,
    totalQuestions,
    pointsEarned,
    timeSpent,
  };
}

/**
 * Obter resultados de uma tentativa
 */
export async function getExerciseResults(attemptId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const attempt = await db
    .select()
    .from(studentExerciseAttempts)
    .where(eq(studentExerciseAttempts.id, attemptId))
    .limit(1);
  
  if (!attempt[0]) return null;
  
  // Buscar o exercício para obter título e questões
  const exercise = await db
    .select()
    .from(studentExercises)
    .where(eq(studentExercises.id, attempt[0].exerciseId))
    .limit(1);
  
  const answers = await db
    .select()
    .from(studentExerciseAnswers)
    .where(eq(studentExerciseAnswers.attemptId, attemptId))
    .orderBy(asc(studentExerciseAnswers.questionNumber));
  
  // Parse exerciseData para obter as questões originais
  const exerciseData = exercise[0]?.exerciseData ? JSON.parse(exercise[0].exerciseData as string) : { questions: [] };
  
  // Combinar respostas com questões originais
  const questionsWithAnswers = answers.map((answer) => {
    const originalQuestion = exerciseData.questions?.find((q: any) => q.number === answer.questionNumber) || {};
    return {
      question: originalQuestion.question || answer.questionType,
      studentAnswer: answer.studentAnswer,
      correctAnswer: answer.correctAnswer,
      isCorrect: answer.isCorrect,
      explanation: originalQuestion.explanation || null,
      questionType: answer.questionType,
      pointsAwarded: answer.pointsAwarded,
    };
  });
  
  return {
    ...attempt[0],
    exerciseTitle: exercise[0]?.title || "Exercício",
    questions: questionsWithAnswers,
    detailedAnswers: answers,
    correctCount: attempt[0].correctAnswers,
    totalQuestions: attempt[0].totalQuestions,
    canRetry: exercise[0] ? (attempt[0].attemptNumber < (exercise[0].maxAttempts || 999)) : false,
  };
}

/**
 * Obter histórico de tentativas de um aluno
 */
export async function getStudentExerciseHistory(studentId: number, subjectId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [eq(studentExerciseAttempts.studentId, studentId)];
  
  if (subjectId) {
    conditions.push(eq(studentExercises.subjectId, subjectId));
  }
  
  const history = await db
    .select({
      attempt: studentExerciseAttempts,
      exercise: studentExercises,
    })
    .from(studentExerciseAttempts)
    .innerJoin(
      studentExercises,
      eq(studentExerciseAttempts.exerciseId, studentExercises.id)
    )
    .where(and(...conditions))
    .orderBy(desc(studentExerciseAttempts.completedAt));
  
  return history;
}

/**
 * Adicionar pontos de gamificação após completar exercício
 */
export async function addExercisePoints(studentId: number, subjectId: number, points: number, description: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Adicionar aos pontos gerais
  await db.insert(pointsHistory).values({
    studentId,
    points,
    reason: description,
    activityType: "exercise",
  });
  
  // Atualizar total de pontos do aluno
  const currentPoints = await db
    .select()
    .from(studentPoints)
    .where(eq(studentPoints.studentId, studentId))
    .limit(1);
  
  if (currentPoints[0]) {
    await db
      .update(studentPoints)
      .set({
        totalPoints: currentPoints[0].totalPoints + points,
      })
      .where(eq(studentPoints.studentId, studentId));
  } else {
    await db.insert(studentPoints).values({
      studentId,
      totalPoints: points,
      currentBelt: "white",
      streakDays: 0,
    });
  }
  
  // Adicionar aos pontos da disciplina específica
  await db.insert(subjectPointsHistory).values({
    studentId,
    subjectId,
    points,
    activityType: "exercise",
    description,
    earnedAt: new Date(),
  });
  
  // Atualizar total de pontos da disciplina
  const currentSubjectPoints = await db
    .select()
    .from(studentSubjectPoints)
    .where(
      and(
        eq(studentSubjectPoints.studentId, studentId),
        eq(studentSubjectPoints.subjectId, subjectId)
      )
    )
    .limit(1);
  
  if (currentSubjectPoints[0]) {
    await db
      .update(studentSubjectPoints)
      .set({
        totalPoints: currentSubjectPoints[0].totalPoints + points,
      })
      .where(
        and(
          eq(studentSubjectPoints.studentId, studentId),
          eq(studentSubjectPoints.subjectId, subjectId)
        )
      );
  } else {
    await db.insert(studentSubjectPoints).values({
      studentId,
      subjectId,
      totalPoints: points,
      currentBelt: "white",
      streakDays: 0,
    });
  }
  
  return { success: true, pointsAdded: points };
}


/**
 * ===========================
 * SISTEMA DE RANKINGS (LEADERBOARD)
 * ===========================
 */

/**
 * Obter posição de um aluno no ranking de uma disciplina
 */
export async function getStudentRankPosition(studentId: number, subjectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Buscar todos os alunos da disciplina ordenados por pontos
    const allStudents = await db
      .select({
        studentId: studentSubjectPoints.studentId,
        totalPoints: studentSubjectPoints.totalPoints,
      })
      .from(studentSubjectPoints)
      .where(eq(studentSubjectPoints.subjectId, subjectId))
      .orderBy(desc(studentSubjectPoints.totalPoints));

    // Encontrar posição do aluno
    const position = allStudents.findIndex(s => s.studentId === studentId) + 1;
    
    // Buscar dados completos do aluno
    const studentData = await db
      .select({
        studentId: studentSubjectPoints.studentId,
        fullName: students.fullName,
        totalPoints: studentSubjectPoints.totalPoints,
        currentBelt: studentSubjectPoints.currentBelt,
        streakDays: studentSubjectPoints.streakDays,
      })
      .from(studentSubjectPoints)
      .innerJoin(students, eq(studentSubjectPoints.studentId, students.id))
      .where(
        and(
          eq(studentSubjectPoints.studentId, studentId),
          eq(studentSubjectPoints.subjectId, subjectId)
        )
      )
      .limit(1);

    if (studentData.length === 0) {
      return {
        position: 0,
        totalStudents: allStudents.length,
        studentData: null,
      };
    }

    return {
      position,
      totalStudents: allStudents.length,
      studentData: studentData[0],
    };
  } catch (error) {
    console.error("[Database] Error getting student rank position:", error);
    return {
      position: 0,
      totalStudents: 0,
      studentData: null,
    };
  }
}

/**
 * Obter top 3 performers de uma disciplina (para badges especiais)
 */
export async function getSubjectTopPerformers(subjectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const topPerformers = await db
      .select({
        studentId: studentSubjectPoints.studentId,
        fullName: students.fullName,
        registrationNumber: students.registrationNumber,
        totalPoints: studentSubjectPoints.totalPoints,
        currentBelt: studentSubjectPoints.currentBelt,
        streakDays: studentSubjectPoints.streakDays,
      })
      .from(studentSubjectPoints)
      .innerJoin(students, eq(studentSubjectPoints.studentId, students.id))
      .where(eq(studentSubjectPoints.subjectId, subjectId))
      .orderBy(desc(studentSubjectPoints.totalPoints))
      .limit(3);

    return topPerformers.map((performer, index) => ({
      ...performer,
      position: index + 1,
      medal: index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉",
    }));
  } catch (error) {
    console.error("[Database] Error getting top performers:", error);
    return [];
  }
}

/**
 * Obter ranking de uma disciplina com filtro de período
 */
export async function getSubjectRankingByPeriod(
  subjectId: number,
  startDate: Date,
  endDate: Date,
  limit: number = 20
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Buscar pontos ganhos no período especificado
    const pointsInPeriod = await db
      .select({
        studentId: subjectPointsHistory.studentId,
        totalPoints: sql<number>`SUM(${subjectPointsHistory.points})`.as('totalPoints'),
      })
      .from(subjectPointsHistory)
      .where(
        and(
          eq(subjectPointsHistory.subjectId, subjectId),
          sql`${subjectPointsHistory.earnedAt} >= ${startDate}`,
          sql`${subjectPointsHistory.earnedAt} <= ${endDate}`
        )
      )
      .groupBy(subjectPointsHistory.studentId)
      .orderBy(desc(sql`SUM(${subjectPointsHistory.points})`))
      .limit(limit);

    // Buscar dados completos dos alunos
    const studentIds = pointsInPeriod.map(p => p.studentId);
    if (studentIds.length === 0) return [];

    const studentsData = await db
      .select({
        studentId: students.id,
        fullName: students.fullName,
        registrationNumber: students.registrationNumber,
      })
      .from(students)
      .where(inArray(students.id, studentIds));

    // Combinar dados
    return pointsInPeriod.map((points, index) => {
      const student = studentsData.find(s => s.studentId === points.studentId);
      return {
        position: index + 1,
        studentId: points.studentId,
        fullName: student?.fullName || "Desconhecido",
        registrationNumber: student?.registrationNumber || "",
        totalPoints: points.totalPoints,
      };
    });
  } catch (error) {
    console.error("[Database] Error getting ranking by period:", error);
    return [];
  }
}

/**
 * Obter ranking por módulo de aprendizagem
 */
export async function getModuleRanking(moduleId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Buscar tópicos do módulo
    const topics = await db
      .select({ id: learningTopics.id })
      .from(learningTopics)
      .where(eq(learningTopics.moduleId, moduleId));

    const topicIds = topics.map(t => t.id);
    if (topicIds.length === 0) return [];

    // Buscar progresso dos alunos nos tópicos do módulo
    const progress = await db
      .select({
        studentId: studentTopicProgress.studentId,
        completedTopics: sql<number>`COUNT(CASE WHEN ${studentTopicProgress.status} = 'completed' THEN 1 END)`.as('completedTopics'),
        totalTopics: sql<number>`COUNT(*)`.as('totalTopics'),
      })
      .from(studentTopicProgress)
      .where(inArray(studentTopicProgress.topicId, topicIds))
      .groupBy(studentTopicProgress.studentId)
      .orderBy(
        desc(sql`COUNT(CASE WHEN ${studentTopicProgress.status} = 'completed' THEN 1 END)`)
      )
      .limit(limit);

    // Buscar dados dos alunos
    const studentIds = progress.map(p => p.studentId);
    if (studentIds.length === 0) return [];

    const studentsData = await db
      .select({
        studentId: students.id,
        fullName: students.fullName,
        registrationNumber: students.registrationNumber,
      })
      .from(students)
      .where(inArray(students.id, studentIds));

    // Combinar dados
    return progress.map((prog, index) => {
      const student = studentsData.find(s => s.studentId === prog.studentId);
      return {
        position: index + 1,
        studentId: prog.studentId,
        fullName: student?.fullName || "Desconhecido",
        registrationNumber: student?.registrationNumber || "",
        completedTopics: prog.completedTopics,
        totalTopics: prog.totalTopics,
        completionRate: Math.round((prog.completedTopics / prog.totalTopics) * 100),
      };
    });
  } catch (error) {
    console.error("[Database] Error getting module ranking:", error);
    return [];
  }
}

/**
 * Obter estatísticas gerais de ranking de uma disciplina
 */
export async function getSubjectRankingStats(subjectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const stats = await db
      .select({
        totalStudents: sql<number>`COUNT(*)`.as('totalStudents'),
        avgPoints: sql<number>`AVG(${studentSubjectPoints.totalPoints})`.as('avgPoints'),
        maxPoints: sql<number>`MAX(${studentSubjectPoints.totalPoints})`.as('maxPoints'),
        minPoints: sql<number>`MIN(${studentSubjectPoints.totalPoints})`.as('minPoints'),
      })
      .from(studentSubjectPoints)
      .where(eq(studentSubjectPoints.subjectId, subjectId));

    return stats[0] || {
      totalStudents: 0,
      avgPoints: 0,
      maxPoints: 0,
      minPoints: 0,
    };
  } catch (error) {
    console.error("[Database] Error getting ranking stats:", error);
    return {
      totalStudents: 0,
      avgPoints: 0,
      maxPoints: 0,
      minPoints: 0,
    };
  }
}

/**
 * Obter histórico de posições de um aluno ao longo do tempo
 */
export async function getStudentRankHistory(studentId: number, subjectId: number, days: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Buscar pontos acumulados por dia
    const dailyPoints = await db
      .select({
        date: sql<string>`DATE(${subjectPointsHistory.earnedAt})`.as('date'),
        cumulativePoints: sql<number>`SUM(${subjectPointsHistory.points})`.as('cumulativePoints'),
      })
      .from(subjectPointsHistory)
      .where(
        and(
          eq(subjectPointsHistory.studentId, studentId),
          eq(subjectPointsHistory.subjectId, subjectId),
          sql`${subjectPointsHistory.earnedAt} >= ${startDate}`
        )
      )
      .groupBy(sql`DATE(${subjectPointsHistory.earnedAt})`)
      .orderBy(sql`DATE(${subjectPointsHistory.earnedAt})`);

    return dailyPoints;
  } catch (error) {
    console.error("[Database] Error getting rank history:", error);
    return [];
  }
}
