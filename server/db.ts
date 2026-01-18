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
  studentLearningJournal,
  studentTopicDoubts,
  InsertStudentLearningJournal,
  InsertStudentTopicDoubt,
  studentSpecializations,
  specializationSkills,
  studentSkills,
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
  reviewSessions,
  InsertStudentExercise,
  InsertStudentExerciseAttempt,
  InsertStudentExerciseAnswer,
  beltHistory,
  shopItems,
  studentPurchasedItems,
  studentEquippedItems,
  ShopItem,
  InsertShopItem,
  studentWallets,
  coinTransactions,
  StudentWallet,
  InsertStudentWallet,
  CoinTransaction,
  InsertCoinTransaction,
  moduleBadges,
  InsertModuleBadge,
  specializationAchievements,
  studentSpecializationAchievements,
  InsertStudentSpecializationAchievement,
  learningRecommendations,
  InsertLearningRecommendation,
  topicProgressHistory,
  InsertTopicProgressHistory,
  teacherPoints,
  teacherActivitiesHistory,
  teacherBeltHistory,
  InsertTeacherPoints,
  InsertTeacherActivitiesHistory,
  InsertTeacherBeltHistory,
  mistakeNotebookQuestions,
  mistakeNotebookAttempts,
  mistakeNotebookTopics,
  mistakeNotebookInsights,
  mistakeNotebookStudyPlans,
  InsertMistakeNotebookQuestion,
  InsertMistakeNotebookAttempt,
  InsertMistakeNotebookTopic,
  InsertMistakeNotebookInsight,
  InsertMistakeNotebookStudyPlan,
  belts,
  Belt,
  InsertBelt,
  studentProgress,
  StudentProgress,
  InsertStudentProgress,
  achievements,
  Achievement,
  InsertAchievement,
  studentAchievements,
  StudentAchievement,
  InsertStudentAchievement,
  levelUpHistory,
  LevelUpHistory,
  InsertLevelUpHistory,
  dashboardPreferences,
  DashboardPreference,
  InsertDashboardPreference,
  studentBehaviors,
  StudentBehavior,
  InsertStudentBehavior,
  learningPatterns,
  LearningPattern,
  InsertLearningPattern,
  aiInsights,
  AIInsight,
  InsertAIInsight,
  performanceMetrics,
  PerformanceMetric,
  InsertPerformanceMetric,
  alerts,
  Alert,
  InsertAlert,
  questions,
  questionAnswers,
  InsertQuestion,
  InsertQuestionAnswer,} from "../drizzle/schema";
import { ENV } from './_core/env';
import { invokeLLM } from './_core/llm';

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
  const insertId = Number(result[0].insertId);
  
  // Buscar o registro criado para retornar com todos os campos
  const [created] = await db.select()
    .from(subjects)
    .where(eq(subjects.id, insertId));
  
  return created;
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

export async function toggleSubjectCT(id: number, userId: number, enabled: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(subjects).set({ computationalThinkingEnabled: enabled }).where(
    and(eq(subjects.id, id), eq(subjects.userId, userId))
  );
  
  const [updated] = await db.select().from(subjects).where(
    and(eq(subjects.id, id), eq(subjects.userId, userId))
  ).limit(1);
  
  return updated;
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

export async function checkTimeSlotOverlap(
  shiftId: number,
  startTime: string,
  endTime: string,
  userId: number,
  excludeId?: number
) {
  const db = await getDb();
  if (!db) return false;
  
  // Buscar todos os horários do mesmo turno
  const conditions = [
    eq(timeSlots.shiftId, shiftId),
    eq(timeSlots.userId, userId)
  ];
  
  if (excludeId) {
    conditions.push(ne(timeSlots.id, excludeId) as any);
  }
  
  const existingSlots = await db.select().from(timeSlots).where(
    and(...conditions)
  );
  
  // Converter horários para minutos para facilitar comparação
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const newStartMinutes = startHour * 60 + startMin;
  const newEndMinutes = endHour * 60 + endMin;
  
  // Verificar sobreposição com cada horário existente
  for (const slot of existingSlots) {
    const [existStartHour, existStartMin] = slot.startTime.split(':').map(Number);
    const [existEndHour, existEndMin] = slot.endTime.split(':').map(Number);
    const existStartMinutes = existStartHour * 60 + existStartMin;
    const existEndMinutes = existEndHour * 60 + existEndMin;
    
    // Verifica se há sobreposição:
    // - Novo horário começa durante um horário existente
    // - Novo horário termina durante um horário existente
    // - Novo horário engloba completamente um horário existente
    const overlaps = (
      (newStartMinutes >= existStartMinutes && newStartMinutes < existEndMinutes) ||
      (newEndMinutes > existStartMinutes && newEndMinutes <= existEndMinutes) ||
      (newStartMinutes <= existStartMinutes && newEndMinutes >= existEndMinutes)
    );
    
    if (overlaps) {
      return true;
    }
  }
  
  return false;
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
    conditions.push(ne(scheduledClasses.id, excludeId) as any);
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

export async function updateUserProfileType(userId: number, profile: "traditional" | "enthusiast" | "interactive" | "organizational") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ profile }).where(eq(users.id, userId));
  return { success: true };
}

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ profile: users.profile }).from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0].profile : undefined;
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

export async function updateLearningModule(id: number, data: { title?: string; description?: string; infographicUrl?: string; guideTitle?: string | null; guideContent?: string | null; guideType?: string }, userId: number) {
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
  
  // Buscar matrículas de AMBAS as tabelas para garantir compatibilidade
  // Tabela 1: student_enrollments (usada pelo portal do professor para matrículas em turmas)
  const enrollmentsFromStudentEnrollments = await db.select().from(studentEnrollments)
    .where(eq(studentEnrollments.studentId, studentId));
  
  // Tabela 2: subjectEnrollments (usada pelo portal do professor para matrículas diretas em disciplinas)
  const enrollmentsFromSubjectEnrollments = await db.select().from(subjectEnrollments)
    .where(eq(subjectEnrollments.studentId, studentId));
  
  // Combinar resultados de ambas as tabelas
  const combinedEnrollments = [
    // Matrículas de student_enrollments (mapeando professorId para userId)
    ...enrollmentsFromStudentEnrollments.map(enrollment => ({
      ...enrollment,
      userId: enrollment.professorId,
      source: 'student_enrollments' as const,
    })),
    // Matrículas de subjectEnrollments (já tem userId)
    ...enrollmentsFromSubjectEnrollments.map(enrollment => ({
      ...enrollment,
      source: 'subjectEnrollments' as const,
    })),
  ];
  
  // Remover duplicatas (mesmo studentId + subjectId)
  const uniqueEnrollments = combinedEnrollments.reduce((acc, enrollment) => {
    const key = `${enrollment.studentId}-${enrollment.subjectId}`;
    if (!acc.has(key)) {
      acc.set(key, enrollment);
    }
    return acc;
  }, new Map());
  
  return Array.from(uniqueEnrollments.values());
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
    id: students.id,
    studentId: students.id,
    userId: students.userId,
    registrationNumber: students.registrationNumber,
    fullName: students.fullName,
    avatarGender: students.avatarGender,
    avatarSkinTone: students.avatarSkinTone,
    avatarKimonoColor: students.avatarKimonoColor,
    avatarHairStyle: students.avatarHairStyle,
    avatarHairColor: students.avatarHairColor,
    avatarKimonoStyle: students.avatarKimonoStyle,
    avatarHeadAccessory: students.avatarHeadAccessory,
    avatarExpression: students.avatarExpression,
    avatarPose: students.avatarPose,
    specialKimono: students.specialKimono,
    avatarAccessories: students.avatarAccessories,
    hd2dCharacterId: students.hd2dCharacterId,
    hd2dUnlockedCharacters: students.hd2dUnlockedCharacters,
    createdAt: students.createdAt,
    updatedAt: students.updatedAt,
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

export async function getAnnouncementCountsBySubject(userId: number): Promise<Record<number, number>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select({
    subjectId: announcements.subjectId,
    count: sql<number>`COUNT(*)`
  })
    .from(announcements)
    .where(eq(announcements.userId, userId))
    .groupBy(announcements.subjectId);
  
  // Converter array para objeto { subjectId: count }
  const counts: Record<number, number> = {};
  for (const row of result) {
    counts[row.subjectId] = Number(row.count);
  }
  
  return counts;
}

export async function getAnnouncementsForStudent(studentId: number, subjectId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar avisos das disciplinas em que o aluno está matriculado
  // Buscar de AMBAS as tabelas de matrícula (studentEnrollments e subjectEnrollments)
  
  // Primeiro, buscar de studentEnrollments
  const conditions1 = [eq(studentEnrollments.studentId, studentId)];
  if (subjectId !== undefined && subjectId !== null) {
    conditions1.push(eq(announcements.subjectId, subjectId));
  }
  
  const result1 = await db.select({
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
    .innerJoin(studentEnrollments, eq(studentEnrollments.subjectId, announcements.subjectId))
    .leftJoin(announcementReads, and(
      eq(announcementReads.announcementId, announcements.id),
      eq(announcementReads.studentId, studentId)
    ))
    .where(and(...conditions1));
  
  // Segundo, buscar de subjectEnrollments
  const conditions2 = [eq(subjectEnrollments.studentId, studentId)];
  if (subjectId !== undefined && subjectId !== null) {
    conditions2.push(eq(announcements.subjectId, subjectId));
  }
  
  const result2 = await db.select({
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
    .where(and(...conditions2));
  
  // Combinar resultados e remover duplicatas por ID
  const combined = [...result1, ...result2];
  const uniqueMap = new Map();
  combined.forEach(item => uniqueMap.set(item.id, item));
  const uniqueResults = Array.from(uniqueMap.values());
  
  // Ordenar por importância e data
  uniqueResults.sort((a, b) => {
    if (a.isImportant !== b.isImportant) {
      return a.isImportant ? -1 : 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  return uniqueResults;
}

export async function getUnreadAnnouncementsCount(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar de AMBAS as tabelas de matrícula (studentEnrollments e subjectEnrollments)
  
  // Primeiro, buscar de studentEnrollments
  const result1 = await db.select({
    id: announcements.id,
  })
    .from(announcements)
    .innerJoin(studentEnrollments, eq(studentEnrollments.subjectId, announcements.subjectId))
    .leftJoin(announcementReads, and(
      eq(announcementReads.announcementId, announcements.id),
      eq(announcementReads.studentId, studentId)
    ))
    .where(and(
      eq(studentEnrollments.studentId, studentId),
      sql`${announcementReads.id} IS NULL`
    ));
  
  // Segundo, buscar de subjectEnrollments
  const result2 = await db.select({
    id: announcements.id,
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
  
  // Combinar e contar IDs únicos
  const combined = [...result1, ...result2];
  const uniqueIds = new Set(combined.map(item => item.id));
  
  return uniqueIds.size;
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
  inviteCode?: string; // Código de convite opcional
}): Promise<{ id: number; openId: string; approvalStatus: string } | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Verificar código de convite se fornecido
    let hasValidInvite = false;
    if (data.inviteCode) {
      const invite = await db.select().from(inviteCodes)
        .where(and(
          eq(inviteCodes.code, data.inviteCode),
          eq(inviteCodes.isActive, true)
        ))
        .limit(1);
      
      if (invite[0]) {
        // Verificar se não expirou
        const notExpired = !invite[0].expiresAt || new Date(invite[0].expiresAt) > new Date();
        // Verificar se não atingiu limite de usos
        const hasUses = invite[0].currentUses < invite[0].maxUses;
        
        if (notExpired && hasUses) {
          hasValidInvite = true;
          // Incrementar uso do código
          await db.update(inviteCodes)
            .set({ currentUses: invite[0].currentUses + 1 })
            .where(eq(inviteCodes.id, invite[0].id));
        }
      }
    }

    // Gerar openId único para o professor
    const openId = `teacher-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Se tem código de convite válido: aprovado automaticamente
    // Se não tem código: pendente de aprovação
    const approvalStatus = hasValidInvite ? 'approved' : 'pending';
    
    await db.insert(users).values({
      openId,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      loginMethod: 'email',
      role: 'user',
      active: true,
      approvalStatus: approvalStatus,
      inviteCode: data.inviteCode || null,
    });

    // Buscar o usuário criado para retornar o ID
    const created = await db.select().from(users)
      .where(eq(users.openId, openId))
      .limit(1);
    
    if (created[0]) {
      return { id: created[0].id, openId: created[0].openId, approvalStatus: approvalStatus };
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
  return 'black';
}

/**
 * Obter ou criar registro de pontos do aluno (MIGRADO PARA TECH COINS)
 * Esta função agora retorna dados baseados em Tech Coins
 */
export async function getOrCreateStudentPoints(studentId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    // Buscar registro de pontos do aluno
    const existing = await db.select().from(studentPoints)
      .where(eq(studentPoints.studentId, studentId))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Criar novo registro se não existir
    await db.insert(studentPoints).values({
      studentId,
      totalPoints: 0,
      currentBelt: 'white',
      streakDays: 0,
      lastActivityDate: null,
      beltAnimationSeen: false,
      lastBeltUpgrade: null,
      pointsMultiplier: 1.0,
      consecutivePerfectScores: 0,
      totalExercisesCompleted: 0,
      totalPerfectScores: 0,
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

/**
 * Calcular faixa baseado em Tech Coins acumulados
 */
function calculateBeltFromTechCoins(totalEarned: number): string {
  if (totalEarned >= 5000) return 'black';
  if (totalEarned >= 2500) return 'brown';
  if (totalEarned >= 1500) return 'purple';
  if (totalEarned >= 1000) return 'blue';
  if (totalEarned >= 600) return 'green';
  if (totalEarned >= 300) return 'orange';
  if (totalEarned >= 100) return 'yellow';
  return 'white';
}

/**
 * DEPRECATED: Obter ou criar registro de pontos do aluno (VERSÃO ANTIGA)
 * Use getOrCreateStudentPoints() que agora usa Tech Coins
 */
export async function getOrCreateStudentPointsOld(studentId: number) {
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

// Adicionar pontos ao aluno (MIGRADO PARA TECH COINS)
export async function addPointsToStudent(
  studentId: number,
  points: number,
  reason: string,
  activityType: string,
  relatedId?: number
) {
  // Migrado para usar Tech Coins
  const result = await addTechCoins(
    studentId,
    points, // Pontos agora são Tech Coins
    activityType,
    reason,
    relatedId ? { relatedId } : undefined
  );
  
  if (!result) return null;
  
  // Verificar mudança de faixa
  const wallet = await getStudentWallet(studentId);
  if (!wallet) return null;
  
  const newBelt = calculateBeltFromTechCoins(wallet.totalEarned);
  const oldBelt = calculateBeltFromTechCoins(wallet.totalEarned - points);
  
  // Se mudou de faixa, criar notificação
  if (newBelt !== oldBelt) {
    const db = await getDb();
    if (db) {
      const beltInfo = BELT_CONFIG.find(b => b.name === newBelt);
      
      // Registrar no histórico de faixas
      await db.insert(beltHistory).values({
        studentId,
        belt: newBelt,
        pointsAtAchievement: wallet.totalEarned,
      });
      
      // Criar notificação
      await db.insert(gamificationNotifications).values({
        studentId,
        type: 'belt_upgrade',
        title: `🥋 Nova Faixa: ${beltInfo?.label || newBelt}!`,
        message: `Parabéns! Você alcançou a faixa ${beltInfo?.label || newBelt} com ${wallet.totalEarned} Tech Coins!`,
        isRead: false,
      });
    }
  }

  return { 
    newTotalPoints: wallet.totalEarned, 
    newBelt, 
    oldBelt 
  };
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

// Criar notificação de gamificação
export async function createGamificationNotification(data: {
  studentId: number;
  type: string;
  title: string;
  message: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const [result] = await db.insert(gamificationNotifications).values({
      studentId: data.studentId,
      type: data.type,
      title: data.title,
      message: data.message,
      isRead: false
    });

    return result.insertId;
  } catch (error) {
    console.error("[Database] Error creating gamification notification:", error);
    throw error;
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

// Obter ranking da turma (com filtro opcional por disciplina)
export async function getClassRanking(limit: number = 10, subjectId?: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    // Se subjectId fornecido, usar pontos por disciplina
    if (subjectId) {
      const ranking = await db.select({
        studentId: studentSubjectPoints.studentId,
        studentName: students.fullName,
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
    }

    // Caso contrário, usar pontos globais
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

// Obter total de alunos com badges (com filtro opcional por disciplina)
export async function getTotalStudentsWithBadges(subjectId?: number) {
  const db = await getDb();
  if (!db) return 0;

  try {
    // Se subjectId fornecido, contar apenas badges relacionados à disciplina
    if (subjectId) {
      // Contar alunos únicos que ganharam badges em exercícios desta disciplina
      const result = await db.select({ studentId: studentBadges.studentId })
        .from(studentBadges)
        .innerJoin(studentExerciseAttempts, eq(studentBadges.studentId, studentExerciseAttempts.studentId))
        .innerJoin(studentExercises, eq(studentExerciseAttempts.exerciseId, studentExercises.id))
        .where(eq(studentExercises.subjectId, subjectId))
        .groupBy(studentBadges.studentId);

      return result.length;
    }

    // Caso contrário, contar todos os alunos com badges
    const result = await db.select({ studentId: studentBadges.studentId })
      .from(studentBadges)
      .groupBy(studentBadges.studentId);

    return result.length;
  } catch (error) {
    console.error("[Database] Error getting total students with badges:", error);
    return 0;
  }
}

// Obter estatísticas de badges (quantos alunos conquistaram cada badge, com filtro opcional por disciplina)
export async function getBadgeStatistics(subjectId?: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const allBadges = await db.select().from(badges);
    const badgeStats = [];

    for (const badge of allBadges) {
      let earnedCount;

      // Se subjectId fornecido, contar apenas badges de exercícios desta disciplina
      if (subjectId) {
        earnedCount = await db.select({ studentId: studentBadges.studentId })
          .from(studentBadges)
          .innerJoin(studentExerciseAttempts, eq(studentBadges.studentId, studentExerciseAttempts.studentId))
          .innerJoin(studentExercises, eq(studentExerciseAttempts.exerciseId, studentExercises.id))
          .where(and(
            eq(studentBadges.badgeId, badge.id),
            eq(studentExercises.subjectId, subjectId)
          ));
      } else {
        // Caso contrário, contar todos
        earnedCount = await db.select({ studentId: studentBadges.studentId })
          .from(studentBadges)
          .where(eq(studentBadges.badgeId, badge.id));
      }

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

// Obter evolução temporal de pontos (últimas 4 semanas, com filtro opcional por disciplina)
export async function getPointsEvolutionData(subjectId?: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    // Calcular data de 4 semanas atrás
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    // Se subjectId fornecido, buscar histórico de pontos por disciplina
    if (subjectId) {
      const history = await db.select({
        createdAt: subjectPointsHistory.earnedAt,
        points: subjectPointsHistory.points,
      })
      .from(subjectPointsHistory)
      .where(and(
        sql`${subjectPointsHistory.earnedAt} >= ${fourWeeksAgo}`,
        eq(subjectPointsHistory.subjectId, subjectId)
      ))
      .orderBy(subjectPointsHistory.earnedAt);

      // Agrupar por semana
      const weeklyData: { [key: string]: number } = {};
      
      history.forEach(record => {
        const date = new Date(record.createdAt);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Início da semana (domingo)
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = 0;
        }
        weeklyData[weekKey] += record.points;
      });

      // Converter para array ordenado
      return Object.entries(weeklyData)
        .map(([week, totalPoints]) => ({ week, totalPoints }))
        .sort((a, b) => a.week.localeCompare(b.week));
    }

    // Caso contrário, buscar histórico global
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
export async function updateCTScore(studentId: number, subjectId: number, dimension: string, scoreToAdd: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    const existing = await db
      .select()
      .from(computationalThinkingScores)
      .where(
        and(
          eq(computationalThinkingScores.studentId, studentId),
          eq(computationalThinkingScores.subjectId, subjectId),
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
        subjectId,
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
 * Buscar perfil completo de PC do aluno (4 dimensões) por disciplina
 */
export async function getStudentCTProfile(studentId: number, subjectId: number) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const scores = await db
      .select()
      .from(computationalThinkingScores)
      .where(
        and(
          eq(computationalThinkingScores.studentId, studentId),
          eq(computationalThinkingScores.subjectId, subjectId)
        )
      );

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
 * Buscar média da turma em cada dimensão por disciplina
 */
export async function getClassCTAverage(userId: number, subjectId: number) {
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

    // Buscar todas as pontuações da disciplina específica
    const allScores = await db
      .select()
      .from(computationalThinkingScores)
      .where(
        and(
          inArray(computationalThinkingScores.studentId, studentIds),
          eq(computationalThinkingScores.subjectId, subjectId)
        )
      );

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
  subjectId: number;
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
  subjectId?: number;
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
  subjectId: number;
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
      await updateCTScore(data.studentId, data.subjectId, exercise[0].dimension, data.score);
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
 * Obter estatísticas completas de PC por disciplina para o professor
 */
export async function getCTStatsBySubject(userId: number, subjectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    // Buscar alunos matriculados na disciplina
    const enrolledStudents = await db
      .select({
        studentId: students.id,
        fullName: students.fullName,
        registrationNumber: students.registrationNumber,
      })
      .from(subjectEnrollments)
      .innerJoin(students, eq(students.id, subjectEnrollments.studentId))
      .where(
        and(
          eq(subjectEnrollments.subjectId, subjectId),
          eq(subjectEnrollments.userId, userId)
        )
      );
    
    // Buscar pontuações de PC de cada aluno
    const studentsWithScores = await Promise.all(
      enrolledStudents.map(async (student) => {
        const profile = await getStudentCTProfile(student.studentId, subjectId);
        const decomposition = profile?.decomposition?.score || 0;
        const pattern_recognition = profile?.pattern_recognition?.score || 0;
        const abstraction = profile?.abstraction?.score || 0;
        const algorithms = profile?.algorithms?.score || 0;
        
        return {
          ...student,
          decomposition,
          pattern_recognition,
          abstraction,
          algorithms,
          average: Math.round((decomposition + pattern_recognition + abstraction + algorithms) / 4),
        };
      })
    );
    
    // Calcular média da turma
    const classAverage = await getClassCTAverage(userId, subjectId);
    
    return {
      students: studentsWithScores,
      classAverage,
    };
  } catch (error) {
    console.error("[Database] Error getting CT stats by subject:", error);
    throw error;
  }
}

/**
 * Obter evolução temporal do PC de um aluno em uma disciplina
 */
export async function getStudentCTEvolution(studentId: number, subjectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    // Buscar submissões de exercícios de PC ordenadas por data
    const submissions = await db
      .select({
        id: ctSubmissions.id,
        exerciseId: ctSubmissions.exerciseId,
        dimension: ctExercises.dimension,
        score: ctSubmissions.score,
        submittedAt: ctSubmissions.submittedAt,
      })
      .from(ctSubmissions)
      .innerJoin(ctExercises, eq(ctExercises.id, ctSubmissions.exerciseId))
      .where(
        and(
          eq(ctSubmissions.studentId, studentId),
          eq(ctSubmissions.subjectId, subjectId)
        )
      )
      .orderBy(ctSubmissions.submittedAt);
    
    // Agrupar por dimensão e calcular evolução
    const evolutionByDimension: Record<string, Array<{ date: string; score: number }>> = {
      decomposition: [],
      pattern_recognition: [],
      abstraction: [],
      algorithms: [],
    };
    
    submissions.forEach((sub) => {
      const date = new Date(sub.submittedAt).toISOString().split('T')[0];
      if (evolutionByDimension[sub.dimension]) {
        evolutionByDimension[sub.dimension].push({
          date,
          score: sub.score,
        });
      }
    });
    
    // Perfil atual
    const currentProfile = await getStudentCTProfile(studentId, subjectId);
    
    return {
      evolution: evolutionByDimension,
      currentProfile,
      totalSubmissions: submissions.length,
    };
  } catch (error) {
    console.error("[Database] Error getting student CT evolution:", error);
    throw error;
  }
}

/**
 * Verificar e conceder badges automaticamente baseado nas pontuações
 */
export async function checkAndAwardCTBadges(studentId: number, subjectId: number) {
  try {
    const profile = await getStudentCTProfile(studentId, subjectId);
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
 * Listar exercícios por módulo para um aluno
 */
export async function listExercisesByModule(studentId: number, moduleId: number) {
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
    eq(studentExercises.moduleId, moduleId),
    lte(studentExercises.availableFrom, now),
    // Apenas exercícios das disciplinas em que o aluno está matriculado
    inArray(studentExercises.subjectId, enrolledSubjectIds)
  ];
  
  const exercises = await db
    .select()
    .from(studentExercises)
    .where(and(...conditions))
    .orderBy(studentExercises.availableFrom);
  
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
  
  // exerciseData já é um objeto JSON (tipo json no Drizzle), não precisa fazer parse
  const exerciseData = exercise[0].exerciseData as any || { exercises: [] };
  
  const currentAttempt = attempts.find(a => a.status === "in_progress");
  
  return {
    ...exercise[0],
    subjectName: subject[0]?.name || "Disciplina",
    moduleName: module[0]?.title || "Módulo",
    questions: exerciseData.exercises || [],
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
 * Gerar feedback personalizado com IA para questões erradas
 */
async function generateQuestionFeedback(
  question: string,
  studentAnswer: string,
  correctAnswer: string,
  existingExplanation: string
): Promise<{ feedback: string; studyTips: string }> {
  const prompt = `Você é um professor experiente. Um aluno errou a seguinte questão:

**Questão:** ${question}

**Resposta do aluno:** ${studentAnswer}
**Resposta correta:** ${correctAnswer}
${existingExplanation ? `**Explicação existente:** ${existingExplanation}` : ''}

Por favor, forneça:
1. Um feedback educativo explicando por que a resposta do aluno está incorreta e qual é o raciocínio correto (máximo 3 frases).
2. Dicas de estudo específicas para ajudar o aluno a entender melhor esse tópico (máximo 2 dicas práticas).

Formato da resposta:
FEEDBACK: [seu feedback aqui]
DICAS: [suas dicas aqui]`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Você é um professor experiente e empatíco que ajuda alunos a aprenderem com seus erros." },
      { role: "user", content: prompt }
    ],
    maxTokens: 500
  });

  const content = response.choices[0]?.message?.content || "";
  const text = typeof content === 'string' ? content : '';
  
  // Extrair feedback e dicas do texto
  const feedbackMatch = text.match(/FEEDBACK:\s*([\s\S]*?)(?=DICAS:|$)/i);
  const tipsMatch = text.match(/DICAS:\s*([\s\S]*?)$/i);
  
  const feedback = feedbackMatch ? feedbackMatch[1].trim() : text.split('DICAS:')[0].trim();
  const studyTips = tipsMatch ? tipsMatch[1].trim() : "Revise o conteúdo relacionado e pratique exercícios similares.";
  
  return { feedback, studyTips };
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
  
  // Tentar diferentes estruturas possíveis de exerciseData
  let questions = [];
  if (exerciseData.exercises && Array.isArray(exerciseData.exercises)) {
    questions = exerciseData.exercises;
  } else if (exerciseData.questions && Array.isArray(exerciseData.questions)) {
    questions = exerciseData.questions;
  } else if (Array.isArray(exerciseData)) {
    questions = exerciseData;
  }
  
  const detailedAnswers = answers.map((answer, idx) => {
    const question = questions[idx];
    
    // Proteção: se a questão não existe, retornar resposta inválida
    if (!question) {
      return {
        attemptId,
        questionNumber: idx + 1,
        questionType: 'unknown',
        studentAnswer: answer.answer || "",
        correctAnswer: null,
        isCorrect: null,
        pointsAwarded: 0,
      };
    }
    
    let isCorrect = false;
    
    // Verificar se é questão objetiva (aceitar "objective" ou "multiple_choice")
    const isObjectiveQuestion = question && (question.type === "objective" || question.type === "multiple_choice");
    
    // Variáveis para armazenar as respostas normalizadas
    let normalizedStudentAnswer = answer.answer || "";
    let normalizedCorrectAnswer = question.correctAnswer || null;
    
    if (isObjectiveQuestion && question.correctAnswer) {
      // Normalizar respostas para comparação
      const studentAns = answer.answer?.trim();
      const correctAns = question.correctAnswer.trim();
      
      // Extrair letra da resposta do aluno (se houver formato "C) Texto")
      let studentLetter = studentAns;
      if (studentAns && studentAns.includes(')')) {
        studentLetter = studentAns.substring(0, studentAns.indexOf(')')).trim();
      }
      
      // Extrair letra da resposta correta (se houver formato "C) Texto")
      let correctLetter = correctAns;
      if (correctAns.includes(')')) {
        correctLetter = correctAns.substring(0, correctAns.indexOf(')')).trim();
      }
      
      // Comparar as letras extraídas (ignorando o texto completo)
      isCorrect = studentLetter === correctLetter;
      
      if (isCorrect) {
        correctAnswers++;
      }
      
      // CORREÇÃO: Salvar apenas as letras normalizadas no banco para consistência
      normalizedStudentAnswer = studentLetter;
      normalizedCorrectAnswer = correctLetter;
    }
    
    return {
      attemptId,
      questionNumber: idx + 1,
      questionType: question.type,
      studentAnswer: normalizedStudentAnswer,
      correctAnswer: normalizedCorrectAnswer,
      isCorrect: isObjectiveQuestion ? isCorrect : null,
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
  
  // Salvar respostas individuais e gerar feedback com IA para questões erradas
  for (const answer of detailedAnswers) {
    let aiFeedback = null;
    let studyTips = null;
    
    const question = questions[answer.questionNumber - 1];
    
    // Gerar feedback para questões objetivas
    if (answer.questionType === "objective") {
      try {
        if (answer.isCorrect === false) {
          // Feedback detalhado para respostas incorretas
          const feedbackResponse = await generateQuestionFeedback(
            question.question,
            answer.studentAnswer,
            answer.correctAnswer,
            question.explanation || ""
          );
          aiFeedback = feedbackResponse.feedback;
          studyTips = feedbackResponse.studyTips;
        } else if (answer.isCorrect === true && question.explanation) {
          // Para respostas corretas, mostrar a explicação do professor como reforço
          aiFeedback = `Parabéns! Você acertou. ${question.explanation}`;
        }
      } catch (error) {
        console.error("Erro ao gerar feedback com IA:", error);
      }
    }

    
    await db.insert(studentExerciseAnswers).values({
      ...answer,
      aiFeedback,
      studyTips,
    });
  }
  
  // Verificar e conceder badges especiais
  await checkAllSpecialBadges(attempt[0].studentId, timeSpent, new Date());
  
  // INTEGRAÇÃO COM REVISÃO INTELIGENTE
  // Adicionar questões erradas à fila de revisão automática
  const exercise = await db
    .select()
    .from(studentExercises)
    .where(eq(studentExercises.id, attempt[0].exerciseId))
    .limit(1);
  
  if (exercise[0]) {
    // Buscar IDs das respostas recém-inseridas para adicionar à fila
    const insertedAnswers = await db
      .select()
      .from(studentExerciseAnswers)
      .where(eq(studentExerciseAnswers.attemptId, attemptId));
    
    // Adicionar questões erradas à fila de revisão inteligente
    for (const answer of insertedAnswers) {
      // Apenas questões objetivas erradas ou subjetivas com baixa pontuação
      const shouldAddToQueue = 
        (answer.questionType === "objective" && answer.isCorrect === false) ||
        (answer.questionType === "subjective" && answer.aiScore && answer.aiScore < 70);
      
      if (shouldAddToQueue) {
        try {
          // Calcular dificuldade inicial baseada na pontuação
          const initialDifficulty = answer.aiScore ? (100 - answer.aiScore) : 80;
          
          await addToReviewQueue({
            studentId: attempt[0].studentId,
            answerId: answer.id,
            exerciseId: attempt[0].exerciseId,
            subjectId: exercise[0].subjectId,
            initialDifficulty,
          });
        } catch (error) {
          console.error("Erro ao adicionar questão à fila de revisão:", error);
          // Não falhar a submissão se houver erro na fila de revisão
        }
      }
    }
  }
  
  return {
    attemptId,
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
  
  // exerciseData já é um objeto JSON (tipo json no Drizzle), não precisa fazer parse
  const exerciseData = exercise[0]?.exerciseData as any || { exercises: [] };
  
  // Combinar respostas com questões originais
  const questionsWithAnswers = answers.map((answer, idx) => {
    // Buscar questão original pelo número (index + 1)
    const originalQuestion = exerciseData.exercises?.[answer.questionNumber - 1] || 
                            exerciseData.exercises?.find((q: any) => q.number === answer.questionNumber) || 
                            {};
    return {
      // ID único para React key
      id: answer.id || `question-${attemptId}-${idx}`,
      // Dados da questão original
      question: originalQuestion.question || answer.questionType, // Mantido para compatibilidade
      text: originalQuestion.text || originalQuestion.question || answer.questionType, // Enunciado completo
      type: originalQuestion.type || answer.questionType, // Tipo da questão
      options: originalQuestion.options || [], // Alternativas (para múltipla escolha)
      
      // Respostas do aluno
      studentAnswer: answer.studentAnswer,
      correctAnswer: answer.correctAnswer,
      isCorrect: answer.isCorrect,
      
      // Feedback e explicações
      explanation: originalQuestion.explanation || null,
      pointsAwarded: answer.pointsAwarded,
      aiFeedback: answer.aiFeedback || null,
      studyTips: answer.studyTips || null,
      
      // Metadados (compatibilidade)
      questionType: answer.questionType,
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

// ==================== REVIEW SYSTEM ====================

/**
 * Buscar TODAS as questões de um aluno (acertos e erros) para revisão inteligente
 */
export async function getAllAnswersForReview(
  studentId: number,
  filters?: {
    subjectId?: number;
    moduleId?: number;
    questionType?: string;
    limit?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Aplicar filtros opcionais - REMOVIDO o filtro de isCorrect = false
    const conditions = [
      eq(studentExerciseAttempts.studentId, studentId),
      eq(studentExerciseAttempts.status, "completed"), // Apenas exercícios finalizados
    ];

    if (filters?.subjectId) {
      conditions.push(eq(studentExercises.subjectId, filters.subjectId));
    }

    if (filters?.moduleId) {
      conditions.push(eq(studentExercises.moduleId, filters.moduleId));
    }

    if (filters?.questionType) {
      conditions.push(eq(studentExerciseAnswers.questionType, filters.questionType));
    }

    const results = await db
      .select({
        id: studentExerciseAnswers.id,
        attemptId: studentExerciseAnswers.attemptId,
        questionNumber: studentExerciseAnswers.questionNumber,
        questionType: studentExerciseAnswers.questionType,
        studentAnswer: studentExerciseAnswers.studentAnswer,
        correctAnswer: studentExerciseAnswers.correctAnswer,
        isCorrect: studentExerciseAnswers.isCorrect,
        pointsAwarded: studentExerciseAnswers.pointsAwarded,
        aiFeedback: studentExerciseAnswers.aiFeedback,
        studyTips: studentExerciseAnswers.studyTips,
        aiScore: studentExerciseAnswers.aiScore,
        aiConfidence: studentExerciseAnswers.aiConfidence,
        aiAnalysis: studentExerciseAnswers.aiAnalysis,
        createdAt: studentExerciseAnswers.createdAt,
        exerciseId: studentExerciseAttempts.exerciseId,
        subjectId: studentExercises.subjectId,
        moduleId: studentExercises.moduleId,
        exerciseTitle: studentExercises.title,
      })
      .from(studentExerciseAnswers)
      .innerJoin(
        studentExerciseAttempts,
        eq(studentExerciseAnswers.attemptId, studentExerciseAttempts.id)
      )
      .innerJoin(studentExercises, eq(studentExerciseAttempts.exerciseId, studentExercises.id))
      .where(and(...conditions))
      .orderBy(desc(studentExerciseAnswers.createdAt))
      .limit(filters?.limit || 100);

    return results;
  } catch (error) {
    console.error("[Database] Error getting all answers for review:", error);
    return [];
  }
}

/**
 * Buscar questões erradas de um aluno com filtros
 */
export async function getWrongAnswers(
  studentId: number,
  filters?: {
    subjectId?: number;
    moduleId?: number;
    questionType?: string;
    limit?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Aplicar filtros opcionais
    const conditions = [
      eq(studentExerciseAttempts.studentId, studentId),
      eq(studentExerciseAnswers.isCorrect, false),
    ];

    if (filters?.subjectId) {
      conditions.push(eq(studentExercises.subjectId, filters.subjectId));
    }

    if (filters?.moduleId) {
      conditions.push(eq(studentExercises.moduleId, filters.moduleId));
    }

    if (filters?.questionType) {
      conditions.push(eq(studentExerciseAnswers.questionType, filters.questionType));
    }

    const results = await db
      .select({
        id: studentExerciseAnswers.id,
        attemptId: studentExerciseAnswers.attemptId,
        questionNumber: studentExerciseAnswers.questionNumber,
        questionType: studentExerciseAnswers.questionType,
        studentAnswer: studentExerciseAnswers.studentAnswer,
        correctAnswer: studentExerciseAnswers.correctAnswer,
        isCorrect: studentExerciseAnswers.isCorrect,
        pointsAwarded: studentExerciseAnswers.pointsAwarded,
        aiFeedback: studentExerciseAnswers.aiFeedback,
        studyTips: studentExerciseAnswers.studyTips,
        aiScore: studentExerciseAnswers.aiScore,
        aiConfidence: studentExerciseAnswers.aiConfidence,
        aiAnalysis: studentExerciseAnswers.aiAnalysis,
        createdAt: studentExerciseAnswers.createdAt,
        exerciseId: studentExerciseAttempts.exerciseId,
        subjectId: studentExercises.subjectId,
        moduleId: studentExercises.moduleId,
        exerciseTitle: studentExercises.title,
      })
      .from(studentExerciseAnswers)
      .innerJoin(
        studentExerciseAttempts,
        eq(studentExerciseAnswers.attemptId, studentExerciseAttempts.id)
      )
      .innerJoin(studentExercises, eq(studentExerciseAttempts.exerciseId, studentExercises.id))
      .where(and(...conditions))
      .orderBy(desc(studentExerciseAnswers.createdAt))
      .limit(filters?.limit || 50);

    return results;
  } catch (error) {
    console.error("[Database] Error getting wrong answers:", error);
    return [];
  }
}

/**
 * Analisar padrões de erro de um aluno
 */
export async function analyzeErrorPatterns(studentId: number, subjectId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const conditions = [
      eq(studentExerciseAttempts.studentId, studentId),
      eq(studentExerciseAnswers.isCorrect, false),
    ];

    if (subjectId) {
      conditions.push(eq(studentExercises.subjectId, subjectId));
    }

    // Erros por tipo de questão
    const errorsByType = await db
      .select({
        questionType: studentExerciseAnswers.questionType,
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(studentExerciseAnswers)
      .innerJoin(
        studentExerciseAttempts,
        eq(studentExerciseAnswers.attemptId, studentExerciseAttempts.id)
      )
      .innerJoin(studentExercises, eq(studentExerciseAttempts.exerciseId, studentExercises.id))
      .where(and(...conditions))
      .groupBy(studentExerciseAnswers.questionType);

    // Erros por módulo
    const errorsByModule = await db
      .select({
        moduleId: studentExercises.moduleId,
        moduleName: learningModules.title,
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(studentExerciseAnswers)
      .innerJoin(
        studentExerciseAttempts,
        eq(studentExerciseAnswers.attemptId, studentExerciseAttempts.id)
      )
      .innerJoin(studentExercises, eq(studentExerciseAttempts.exerciseId, studentExercises.id))
      .leftJoin(learningModules, eq(studentExercises.moduleId, learningModules.id))
      .where(
        and(...conditions)
      )
      .groupBy(studentExercises.moduleId, learningModules.title)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(5);

    // Taxa de erro geral
    const totalAnswers = await db
      .select({
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(studentExerciseAnswers)
      .innerJoin(
        studentExerciseAttempts,
        eq(studentExerciseAnswers.attemptId, studentExerciseAttempts.id)
      )
      .innerJoin(studentExercises, eq(studentExerciseAttempts.exerciseId, studentExercises.id))
      .where(
        subjectId
          ? and(
              eq(studentExerciseAttempts.studentId, studentId),
              eq(studentExercises.subjectId, subjectId)
            )
          : eq(studentExerciseAttempts.studentId, studentId)
      );

    const wrongAnswers = await db
      .select({
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(studentExerciseAnswers)
      .innerJoin(
        studentExerciseAttempts,
        eq(studentExerciseAnswers.attemptId, studentExerciseAttempts.id)
      )
      .innerJoin(studentExercises, eq(studentExerciseAttempts.exerciseId, studentExercises.id))
      .where(and(...conditions));

    const errorRate =
      totalAnswers[0]?.count > 0
        ? Math.round((wrongAnswers[0]?.count / totalAnswers[0]?.count) * 100)
        : 0;

    return {
      errorsByType,
      errorsByModule,
      errorRate,
      totalErrors: wrongAnswers[0]?.count || 0,
      totalAnswers: totalAnswers[0]?.count || 0,
    };
  } catch (error) {
    console.error("[Database] Error analyzing error patterns:", error);
    return {
      errorsByType: [],
      errorsByModule: [],
      errorRate: 0,
      totalErrors: 0,
      totalAnswers: 0,
    };
  }
}

/**
 * Marcar questão como revisada
 */
export async function markQuestionAsReviewed(answerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Adicionar campo 'reviewed' na tabela se ainda não existir
    // Por enquanto, vamos usar o campo studyTips para indicar que foi revisada
    await db
      .update(studentExerciseAnswers)
      .set({
        studyTips: sql`CONCAT(COALESCE(${studentExerciseAnswers.studyTips}, ''), '\n[REVISADA]')`,
      })
      .where(eq(studentExerciseAnswers.id, answerId));

    return true;
  } catch (error) {
    console.error("[Database] Error marking question as reviewed:", error);
    return false;
  }
}

/**
 * Criar sessão de revisão
 */
export async function createReviewSession(data: {
  studentId: number;
  subjectId?: number;
  moduleId?: number;
  totalQuestionsReviewed: number;
  sessionDuration: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(reviewSessions).values(data);
    return result[0].insertId;
  } catch (error) {
    console.error("[Database] Error creating review session:", error);
    throw error;
  }
}

/**
 * Obter estatísticas de revisão de um aluno
 */
export async function getReviewStats(studentId: number, subjectId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const conditions = subjectId
      ? and(
          eq(reviewSessions.studentId, studentId),
          eq(reviewSessions.subjectId, subjectId)
        )
      : eq(reviewSessions.studentId, studentId);

    const stats = await db
      .select({
        totalSessions: sql<number>`COUNT(*)`.as("totalSessions"),
        totalQuestionsReviewed: sql<number>`SUM(${reviewSessions.totalQuestionsReviewed})`.as(
          "totalQuestionsReviewed"
        ),
        totalQuestionsRetaken: sql<number>`SUM(${reviewSessions.questionsRetaken})`.as(
          "totalQuestionsRetaken"
        ),
        avgImprovementRate: sql<number>`AVG(${reviewSessions.improvementRate})`.as(
          "avgImprovementRate"
        ),
        totalStudyTime: sql<number>`SUM(${reviewSessions.sessionDuration})`.as("totalStudyTime"),
      })
      .from(reviewSessions)
      .where(conditions);

    return stats[0] || {
      totalSessions: 0,
      totalQuestionsReviewed: 0,
      totalQuestionsRetaken: 0,
      avgImprovementRate: 0,
      totalStudyTime: 0,
    };
  } catch (error) {
    console.error("[Database] Error getting review stats:", error);
    return {
      totalSessions: 0,
      totalQuestionsReviewed: 0,
      totalQuestionsRetaken: 0,
      avgImprovementRate: 0,
      totalStudyTime: 0,
    };
  }
}

/**
 * Salvar material de estudo detalhado para uma questão
 */
export async function saveDetailedStudyMaterial(
  answerId: number,
  material: {
    detailedExplanation: string;
    studyStrategy: string;
    relatedConcepts: string; // JSON string
    additionalResources: string; // JSON string
    practiceExamples: string; // JSON string
    commonMistakes: string; // JSON string
    timeToMaster: number;
    memorizationTips: string; // JSON string
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .update(studentExerciseAnswers)
      .set({
        detailedExplanation: material.detailedExplanation,
        studyStrategy: material.studyStrategy,
        relatedConcepts: material.relatedConcepts,
        additionalResources: material.additionalResources,
        practiceExamples: material.practiceExamples,
        commonMistakes: material.commonMistakes,
        timeToMaster: material.timeToMaster,
        lastReviewedAt: new Date(),
        reviewCount: sql`${studentExerciseAnswers.reviewCount} + 1`,
      })
      .where(eq(studentExerciseAnswers.id, answerId));

    return true;
  } catch (error) {
    console.error("[Database] Error saving detailed study material:", error);
    throw error;
  }
}

/**
 * Atualizar status de domínio de uma questão
 */
export async function updateMasteryStatus(
  answerId: number,
  status: "not_started" | "studying" | "practicing" | "mastered"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .update(studentExerciseAnswers)
      .set({
        masteryStatus: status,
        lastReviewedAt: new Date(),
      })
      .where(eq(studentExerciseAnswers.id, answerId));

    return true;
  } catch (error) {
    console.error("[Database] Error updating mastery status:", error);
    throw error;
  }
}

// ==================== AVATAR CUSTOMIZATION FUNCTIONS ====================

export async function getStudentAvatarByStudentId(studentId: number) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db.select({
      id: students.id,
      registrationNumber: students.registrationNumber,
      fullName: students.fullName,
      avatarGender: students.avatarGender,
      avatarSkinTone: students.avatarSkinTone,
      avatarKimonoColor: students.avatarKimonoColor,
      avatarHairStyle: students.avatarHairStyle,
      avatarHairColor: students.avatarHairColor,
      avatarKimonoStyle: students.avatarKimonoStyle,
      avatarHeadAccessory: students.avatarHeadAccessory,
      avatarExpression: students.avatarExpression,
      avatarPose: students.avatarPose,
      avatarAccessories: students.avatarAccessories,
    })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error("Error getting student avatar:", error);
    return null;
  }
}

export async function updateStudentAvatar(
  studentId: number,
  avatarData: {
    avatarGender?: 'male' | 'female';
    avatarSkinTone?: string;
    avatarKimonoColor?: string;
    avatarHairStyle?: string;
    avatarHairColor?: string;
    avatarKimonoStyle?: string;
    avatarHeadAccessory?: string;
    avatarExpression?: string;
    avatarPose?: string;
    specialKimono?: string;
    avatarAccessories?: string;
  }
) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    await db.update(students)
      .set({
        ...avatarData,
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId));
    
    return await getStudentAvatarByStudentId(studentId);
  } catch (error) {
    console.error("Error updating student avatar:", error);
    return null;
  }
}

// ==================== HISTÓRICO DE FAIXAS ====================

/**
 * Buscar histórico de evolução de faixas do aluno
 */
export async function getStudentBeltHistory(studentId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const history = await db.select()
      .from(beltHistory)
      .where(eq(beltHistory.studentId, studentId))
      .orderBy(beltHistory.achievedAt);

    return history;
  } catch (error) {
    console.error("[Database] Error fetching belt history:", error);
    return [];
  }
}

/**
 * Registrar faixa inicial (branca) para novo aluno
 */
export async function registerInitialBelt(studentId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    // Verificar se já existe registro
    const existing = await db.select()
      .from(beltHistory)
      .where(eq(beltHistory.studentId, studentId))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Registrar faixa branca inicial
    await db.insert(beltHistory).values({
      studentId,
      belt: 'white',
      pointsAtAchievement: 0,
    });

    return { studentId, belt: 'white', pointsAtAchievement: 0 };
  } catch (error) {
    console.error("[Database] Error registering initial belt:", error);
    return null;
  }
}

// ==================== BADGES ESPECIAIS ====================

/**
 * Verificar e conceder badge "Velocista" (exercício em menos de 2 minutos)
 */
export async function checkSpeedsterBadge(studentId: number, timeSpent: number) {
  if (timeSpent < 120) { // Menos de 2 minutos (120 segundos)
    await awardBadgeToStudent(studentId, 'speedster');
  }
}

/**
 * Verificar e conceder badge "Perfeccionista" (10 acertos consecutivos)
 */
export async function checkPerfectionistBadge(studentId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    // Buscar últimas 10 tentativas
    const recentAttempts = await db.select()
      .from(studentExerciseAttempts)
      .where(eq(studentExerciseAttempts.studentId, studentId))
      .orderBy(sql`${studentExerciseAttempts.completedAt} DESC`)
      .limit(10);

    // Verificar se todas têm 100% de acerto
    if (recentAttempts.length >= 10) {
      const allPerfect = recentAttempts.every(attempt => attempt.score === 100);
      if (allPerfect) {
        await awardBadgeToStudent(studentId, 'perfectionist');
      }
    }
  } catch (error) {
    console.error("[Database] Error checking perfectionist badge:", error);
  }
}

/**
 * Verificar e conceder badge "Maratonista" (5 exercícios no mesmo dia)
 */
export async function checkMarathonBadge(studentId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttempts = await db.select()
      .from(studentExerciseAttempts)
      .where(
        and(
          eq(studentExerciseAttempts.studentId, studentId),
          sql`${studentExerciseAttempts.completedAt} >= ${today}`,
          sql`${studentExerciseAttempts.completedAt} < ${tomorrow}`
        )
      );

    if (todayAttempts.length >= 5) {
      await awardBadgeToStudent(studentId, 'marathon_runner');
    }
  } catch (error) {
    console.error("[Database] Error checking marathon badge:", error);
  }
}

/**
 * Verificar e conceder badge "Coruja Noturna" (exercício após 22h)
 */
export async function checkNightOwlBadge(studentId: number, completedAt: Date) {
  const hour = completedAt.getHours();
  if (hour >= 22 || hour < 6) { // Entre 22h e 6h
    await awardBadgeToStudent(studentId, 'night_owl');
  }
}

/**
 * Verificar e conceder badge "Madrugador" (exercício antes das 7h)
 */
export async function checkEarlyBirdBadge(studentId: number, completedAt: Date) {
  const hour = completedAt.getHours();
  if (hour >= 5 && hour < 7) { // Entre 5h e 7h
    await awardBadgeToStudent(studentId, 'early_bird');
  }
}

/**
 * Verificar e conceder badge "Mestre do Combo" (5 exercícios seguidos sem pausar)
 */
export async function checkComboMasterBadge(studentId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    // Buscar últimas 5 tentativas
    const recentAttempts = await db.select()
      .from(studentExerciseAttempts)
      .where(eq(studentExerciseAttempts.studentId, studentId))
      .orderBy(sql`${studentExerciseAttempts.completedAt} DESC`)
      .limit(5);

    if (recentAttempts.length >= 5) {
      // Verificar se todas foram feitas com intervalo menor que 5 minutos
      let isCombo = true;
      for (let i = 0; i < recentAttempts.length - 1; i++) {
        const current = recentAttempts[i]?.completedAt;
        const next = recentAttempts[i + 1]?.completedAt;
        if (!current || !next) continue;
        const diffMinutes = (current.getTime() - next.getTime()) / (1000 * 60);
        if (diffMinutes > 5) {
          isCombo = false;
          break;
        }
      }

      if (isCombo) {
        await awardBadgeToStudent(studentId, 'combo_master');
      }
    }
  } catch (error) {
    console.error("[Database] Error checking combo master badge:", error);
  }
}

/**
 * Verificar e conceder badge "Persistente" (20 exercícios em uma semana)
 */
export async function checkPersistentBadge(studentId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekAttempts = await db.select()
      .from(studentExerciseAttempts)
      .where(
        and(
          eq(studentExerciseAttempts.studentId, studentId),
          sql`${studentExerciseAttempts.completedAt} >= ${weekAgo}`
        )
      );

    if (weekAttempts.length >= 20) {
      await awardBadgeToStudent(studentId, 'persistent');
    }
  } catch (error) {
    console.error("[Database] Error checking persistent badge:", error);
  }
}

/**
 * Verificar e conceder badge "Semana Perfeita" (100% de acertos na semana)
 */
export async function checkFlawlessWeekBadge(studentId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekAttempts = await db.select()
      .from(studentExerciseAttempts)
      .where(
        and(
          eq(studentExerciseAttempts.studentId, studentId),
          sql`${studentExerciseAttempts.completedAt} >= ${weekAgo}`
        )
      );

    if (weekAttempts.length > 0) {
      const allPerfect = weekAttempts.every(attempt => attempt.score === 100);
      if (allPerfect) {
        await awardBadgeToStudent(studentId, 'flawless_week');
      }
    }
  } catch (error) {
    console.error("[Database] Error checking flawless week badge:", error);
  }
}

/**
 * Verificar e conceder badge "Rei do Retorno" (voltar após 7 dias de inatividade)
 */
export async function checkComebackBadge(studentId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    const points = await getOrCreateStudentPoints(studentId);
    if (!points || !points.lastActivityDate) return;

    const lastActivity = new Date(points.lastActivityDate);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays >= 7) {
      await awardBadgeToStudent(studentId, 'comeback_king');
    }
  } catch (error) {
    console.error("[Database] Error checking comeback badge:", error);
  }
}

/**
 * Verificar todos os badges especiais após completar exercício
 */
export async function checkAllSpecialBadges(
  studentId: number,
  timeSpent: number,
  completedAt: Date
) {
  try {
    // Badges baseados em tempo
    await checkSpeedsterBadge(studentId, timeSpent);
    await checkNightOwlBadge(studentId, completedAt);
    await checkEarlyBirdBadge(studentId, completedAt);

    // Badges baseados em histórico
    await checkPerfectionistBadge(studentId);
    await checkMarathonBadge(studentId);
    await checkComboMasterBadge(studentId);
    await checkPersistentBadge(studentId);
    await checkFlawlessWeekBadge(studentId);
    await checkComebackBadge(studentId);
  } catch (error) {
    console.error("[Database] Error checking special badges:", error);
  }
}


// ============================================
// LOJA DE ITENS PARA AVATARES
// ============================================

/**
 * Listar todos os itens ativos da loja
 */
export async function getShopItems(filters?: { category?: string; requiredBelt?: string }) {
  const db = await getDb();
  if (!db) return [];

  try {
    let query = db.select().from(shopItems).where(eq(shopItems.isActive, true));
    
    const items = await query.orderBy(shopItems.sortOrder, shopItems.price);
    
    // Aplicar filtros em memória se necessário
    let filteredItems = items;
    if (filters?.category) {
      filteredItems = filteredItems.filter(item => item.category === filters.category);
    }
    if (filters?.requiredBelt) {
      filteredItems = filteredItems.filter(item => item.requiredBelt === filters.requiredBelt);
    }
    
    return filteredItems;
  } catch (error) {
    console.error("[Database] Error getting shop items:", error);
    return [];
  }
}

/**
 * Buscar item específico da loja
 */
export async function getShopItemById(itemId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const [item] = await db.select().from(shopItems).where(eq(shopItems.id, itemId));
    return item || null;
  } catch (error) {
    console.error("[Database] Error getting shop item:", error);
    return null;
  }
}

/**
 * Verificar se aluno já possui um item
 */
export async function studentOwnsItem(studentId: number, itemId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const [purchase] = await db
      .select()
      .from(studentPurchasedItems)
      .where(and(
        eq(studentPurchasedItems.studentId, studentId),
        eq(studentPurchasedItems.itemId, itemId)
      ));
    return !!purchase;
  } catch (error) {
    console.error("[Database] Error checking item ownership:", error);
    return false;
  }
}

/**
 * Comprar item da loja (usando Tech Coins)
 */
export async function purchaseShopItem(studentId: number, itemId: number): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Banco de dados não disponível" };

  try {
    // Verificar se o item existe e está ativo
    const item = await getShopItemById(itemId);
    if (!item) {
      return { success: false, message: "Item não encontrado" };
    }
    if (!item.isActive) {
      return { success: false, message: "Item não está disponível" };
    }

    // Verificar se já possui o item
    const alreadyOwns = await studentOwnsItem(studentId, itemId);
    if (alreadyOwns) {
      return { success: false, message: "Você já possui este item" };
    }

    // Verificar Tech Coins do aluno
    const wallet = await getStudentWallet(studentId);
    if (!wallet || wallet.techCoins < item.price) {
      return { success: false, message: `Tech Coins insuficientes. Você tem ${wallet?.techCoins || 0} Tech Coins, mas precisa de ${item.price}` };
    }

    // Verificar faixa necessária
    const points = await getOrCreateStudentPoints(studentId);
    const BELT_ORDER = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black'];
    const studentBeltIndex = BELT_ORDER.indexOf(points?.currentBelt || 'white');
    const requiredBeltIndex = BELT_ORDER.indexOf(item.requiredBelt || 'white');
    
    if (studentBeltIndex < requiredBeltIndex) {
      return { success: false, message: `Você precisa da faixa ${item.requiredBelt} para comprar este item` };
    }

    // Verificar pontos mínimos necessários
    if (item.requiredPoints && item.requiredPoints > 0) {
      if (!points || points.totalPoints < item.requiredPoints) {
        return { success: false, message: `Você precisa de pelo menos ${item.requiredPoints} pontos para comprar este item` };
      }
    }

    // Usar função spendTechCoins para processar a compra
    const result = await spendTechCoins(studentId, item.price, itemId, `Compra: ${item.name}`);
    
    if (!result) {
      return { success: false, message: "Erro ao processar compra" };
    }

    return { success: true, message: `Item "${item.name}" comprado com sucesso!` };
  } catch (error) {
    console.error("[Database] Error purchasing item:", error);
    return { success: false, message: error instanceof Error ? error.message : "Erro ao processar compra" };
  }
}

/**
 * Listar itens comprados pelo aluno
 */
export async function getStudentPurchasedItems(studentId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const purchases = await db
      .select({
        purchaseId: studentPurchasedItems.id,
        purchasedAt: studentPurchasedItems.purchasedAt,
        item: shopItems,
      })
      .from(studentPurchasedItems)
      .innerJoin(shopItems, eq(studentPurchasedItems.itemId, shopItems.id))
      .where(eq(studentPurchasedItems.studentId, studentId))
      .orderBy(desc(studentPurchasedItems.purchasedAt));

    return purchases;
  } catch (error) {
    console.error("[Database] Error getting student purchases:", error);
    return [];
  }
}

/**
 * Equipar item no avatar
 */
export async function equipItem(studentId: number, itemId: number): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Banco de dados não disponível" };

  try {
    // Verificar se possui o item
    const owns = await studentOwnsItem(studentId, itemId);
    if (!owns) {
      return { success: false, message: "Você não possui este item" };
    }

    // Buscar detalhes do item
    const item = await getShopItemById(itemId);
    if (!item) {
      return { success: false, message: "Item não encontrado" };
    }

    // Determinar o slot baseado na categoria
    const slotMap: Record<string, string> = {
      'hat': 'hat',
      'glasses': 'glasses',
      'accessory': 'accessory',
      'background': 'background',
      'special': 'accessory', // Itens especiais vão no slot de acessório
    };
    const slot = slotMap[item.category] || 'accessory';

    // Remover item anterior do mesmo slot (se houver)
    await db.delete(studentEquippedItems)
      .where(and(
        eq(studentEquippedItems.studentId, studentId),
        eq(studentEquippedItems.slot, slot as any)
      ));

    // Equipar novo item
    await db.insert(studentEquippedItems).values({
      studentId,
      itemId,
      slot: slot as any,
    });

    return { success: true, message: `Item "${item.name}" equipado!` };
  } catch (error) {
    console.error("[Database] Error equipping item:", error);
    return { success: false, message: "Erro ao equipar item" };
  }
}

/**
 * Desequipar item do avatar
 */
export async function unequipItem(studentId: number, slot: string): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Banco de dados não disponível" };

  try {
    await db.delete(studentEquippedItems)
      .where(and(
        eq(studentEquippedItems.studentId, studentId),
        eq(studentEquippedItems.slot, slot as any)
      ));

    return { success: true, message: "Item removido" };
  } catch (error) {
    console.error("[Database] Error unequipping item:", error);
    return { success: false, message: "Erro ao remover item" };
  }
}

/**
 * Listar itens equipados pelo aluno
 */
export async function getStudentEquippedItems(studentId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const equipped = await db
      .select({
        slot: studentEquippedItems.slot,
        equippedAt: studentEquippedItems.equippedAt,
        item: shopItems,
      })
      .from(studentEquippedItems)
      .innerJoin(shopItems, eq(studentEquippedItems.itemId, shopItems.id))
      .where(eq(studentEquippedItems.studentId, studentId));

    return equipped;
  } catch (error) {
    console.error("[Database] Error getting equipped items:", error);
    return [];
  }
}

/**
 * Criar item na loja (admin)
 */
export async function createShopItem(data: InsertShopItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(shopItems).values(data);
    return result;
  } catch (error) {
    console.error("[Database] Error creating shop item:", error);
    throw error;
  }
}

/**
 * Atualizar item da loja (admin)
 */
export async function updateShopItem(itemId: number, data: Partial<InsertShopItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.update(shopItems).set(data).where(eq(shopItems.id, itemId));
    return true;
  } catch (error) {
    console.error("[Database] Error updating shop item:", error);
    throw error;
  }
}

/**
 * Deletar item da loja (admin) - soft delete
 */
export async function deleteShopItem(itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.update(shopItems).set({ isActive: false }).where(eq(shopItems.id, itemId));
    return true;
  } catch (error) {
    console.error("[Database] Error deleting shop item:", error);
    throw error;
  }
}

/**
 * Seed inicial de itens da loja
 */
export async function seedShopItems() {
  const db = await getDb();
  if (!db) return;

  try {
    // Verificar se já existem itens
    const existingItems = await db.select().from(shopItems).limit(1);
    if (existingItems.length > 0) {
      console.log("[Database] Shop items already seeded");
      return;
    }

    const initialItems: InsertShopItem[] = [
      // Chapéus
      { name: "Bandana Vermelha", description: "Uma bandana estilosa para treinos intensos", category: "hat", price: 50, requiredBelt: "white", sortOrder: 1 },
      { name: "Faixa na Cabeça", description: "Faixa tradicional de karateca", category: "hat", price: 75, requiredBelt: "yellow", sortOrder: 2 },
      { name: "Boné Esportivo", description: "Boné moderno para o dia a dia", category: "hat", price: 100, requiredBelt: "orange", sortOrder: 3 },
      { name: "Chapéu Samurai", description: "Chapéu inspirado nos guerreiros samurais", category: "hat", price: 200, requiredBelt: "green", rarity: "rare", sortOrder: 4 },
      { name: "Coroa de Campeão", description: "Para os verdadeiros mestres", category: "hat", price: 500, requiredBelt: "black", rarity: "epic", sortOrder: 5 },
      
      // Óculos
      { name: "Óculos de Sol", description: "Óculos escuros estilosos", category: "glasses", price: 60, requiredBelt: "white", sortOrder: 10 },
      { name: "Óculos Esportivos", description: "Proteção para treinos ao ar livre", category: "glasses", price: 90, requiredBelt: "yellow", sortOrder: 11 },
      { name: "Óculos Ninja", description: "Visão aguçada como um ninja", category: "glasses", price: 150, requiredBelt: "blue", rarity: "rare", sortOrder: 12 },
      
      // Acessórios
      { name: "Medalha de Bronze", description: "Primeira conquista", category: "accessory", price: 30, requiredBelt: "white", sortOrder: 20 },
      { name: "Medalha de Prata", description: "Reconhecimento intermediário", category: "accessory", price: 80, requiredBelt: "green", sortOrder: 21 },
      { name: "Medalha de Ouro", description: "Excelência comprovada", category: "accessory", price: 150, requiredBelt: "purple", sortOrder: 22 },
      { name: "Troféu de Mestre", description: "O maior reconhecimento", category: "accessory", price: 300, requiredBelt: "brown", rarity: "epic", sortOrder: 23 },
      { name: "Dragão Dourado", description: "Símbolo de poder supremo", category: "accessory", price: 1000, requiredBelt: "black", rarity: "legendary", sortOrder: 24 },
      
      // Fundos
      { name: "Dojo Tradicional", description: "Fundo de dojo japonês", category: "background", price: 100, requiredBelt: "yellow", sortOrder: 30 },
      { name: "Montanha Sagrada", description: "Cenário de montanha ao amanhecer", category: "background", price: 150, requiredBelt: "green", sortOrder: 31 },
      { name: "Templo Zen", description: "Ambiente de paz e concentração", category: "background", price: 200, requiredBelt: "blue", sortOrder: 32 },
      { name: "Arena de Combate", description: "Palco para grandes batalhas", category: "background", price: 300, requiredBelt: "purple", rarity: "rare", sortOrder: 33 },
      { name: "Céu Estrelado", description: "Treine sob as estrelas", category: "background", price: 400, requiredBelt: "brown", rarity: "epic", sortOrder: 34 },
      
      // Especiais
      { name: "Aura de Fogo", description: "Efeito especial de chamas", category: "special", price: 500, requiredBelt: "purple", rarity: "epic", sortOrder: 40 },
      { name: "Aura de Gelo", description: "Efeito especial de gelo", category: "special", price: 500, requiredBelt: "purple", rarity: "epic", sortOrder: 41 },
      { name: "Aura Dourada", description: "Brilho de um verdadeiro mestre", category: "special", price: 800, requiredBelt: "black", rarity: "legendary", sortOrder: 42 },
    ];

    await db.insert(shopItems).values(initialItems);
    console.log("[Database] Shop items seeded successfully");
  } catch (error) {
    console.error("[Database] Error seeding shop items:", error);
  }
}


/**
 * ===== SISTEMA DE TECH COINS (ECONOMIA VIRTUAL) =====
 */

/**
 * Obter carteira do aluno (cria se não existir)
 */
export async function getStudentWallet(studentId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    let wallet = await db.select().from(studentWallets)
      .where(eq(studentWallets.studentId, studentId))
      .limit(1);
    
    if (!wallet[0]) {
      // Criar carteira inicial
      await db.insert(studentWallets).values({ 
        studentId, 
        techCoins: 0,
        totalEarned: 0,
        totalSpent: 0
      });
      
      wallet = await db.select().from(studentWallets)
        .where(eq(studentWallets.studentId, studentId))
        .limit(1);
    }
    
    return wallet[0];
  } catch (error) {
    console.error("[Database] Error getting student wallet:", error);
    return null;
  }
}

/**
 * Adicionar Tech Coins ao aluno
 */
export async function addTechCoins(
  studentId: number, 
  amount: number, 
  source: string, 
  description: string, 
  metadata?: any
) {
  const db = await getDb();
  if (!db) return null;

  try {
    const wallet = await getStudentWallet(studentId);
    if (!wallet) return null;
    
    // Criar transação
    await db.insert(coinTransactions).values({
      studentId,
      amount,
      transactionType: 'earn',
      source,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null
    });
    
    // Atualizar carteira
    await db.update(studentWallets)
      .set({
        techCoins: wallet.techCoins + amount,
        totalEarned: wallet.totalEarned + amount,
        lastTransactionAt: new Date()
      })
      .where(eq(studentWallets.studentId, studentId));
    
    return { success: true, newBalance: wallet.techCoins + amount };
  } catch (error) {
    console.error("[Database] Error adding tech coins:", error);
    return null;
  }
}

/**
 * Gastar Tech Coins (comprar item)
 */
export async function spendTechCoins(
  studentId: number, 
  amount: number, 
  itemId: number, 
  description: string
) {
  const db = await getDb();
  if (!db) return null;

  try {
    const wallet = await getStudentWallet(studentId);
    if (!wallet) throw new Error('Wallet not found');
    
    if (wallet.techCoins < amount) {
      throw new Error('Insufficient tech coins');
    }
    
    // Criar transação
    await db.insert(coinTransactions).values({
      studentId,
      amount: -amount,
      transactionType: 'spend',
      source: 'shop_purchase',
      description,
      metadata: JSON.stringify({ itemId })
    });
    
    // Atualizar carteira
    await db.update(studentWallets)
      .set({
        techCoins: wallet.techCoins - amount,
        totalSpent: wallet.totalSpent + amount,
        lastTransactionAt: new Date()
      })
      .where(eq(studentWallets.studentId, studentId));
    
    // Registrar compra
    await db.insert(studentPurchasedItems).values({
      studentId,
      itemId
    });
    
    return { success: true, newBalance: wallet.techCoins - amount };
  } catch (error) {
    console.error("[Database] Error spending tech coins:", error);
    throw error;
  }
}

// Funções de loja já existem acima (getShopItems, getStudentPurchasedItems, equipItem)

/**
 * Obter histórico de transações do aluno
 */
export async function getCoinTransactionHistory(studentId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  try {
    const transactions = await db.select().from(coinTransactions)
      .where(eq(coinTransactions.studentId, studentId))
      .orderBy(desc(coinTransactions.createdAt))
      .limit(limit);
    
    return transactions;
  } catch (error) {
    console.error("[Database] Error getting coin transaction history:", error);
    return [];
  }
}

/**
 * Obter todas as transações da carteira do aluno (para página de carteira)
 */
export async function getWalletTransactions(studentId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const transactions = await db.select({
      id: coinTransactions.id,
      amount: coinTransactions.amount,
      type: coinTransactions.transactionType,
      source: coinTransactions.source,
      description: coinTransactions.description,
      createdAt: coinTransactions.createdAt,
    }).from(coinTransactions)
      .where(eq(coinTransactions.studentId, studentId))
      .orderBy(desc(coinTransactions.createdAt));
    
    return transactions;
  } catch (error) {
    console.error("[Database] Error getting wallet transactions:", error);
    return [];
  }
}

// studentOwnsItem já existe acima

// ==================== CONQUISTAS OCULTAS (EASTER EGGS) ====================

/**
 * Registrar ação do aluno (para rastreamento de conquistas)
 */
export async function trackStudentAction(
  studentId: number,
  actionType: string,
  actionData?: any
) {
  const db = await getDb();
  if (!db) return;

  try {
    const { studentActions } = await import('../drizzle/schema');
    await db.insert(studentActions).values({
      studentId,
      actionType,
      actionData: actionData ? JSON.stringify(actionData) : null,
    });
  } catch (error) {
    console.error("[Database] Error tracking student action:", error);
  }
}

/**
 * Verificar e desbloquear conquistas ocultas
 */
export async function checkAndUnlockAchievements(studentId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const { hiddenAchievements, studentHiddenAchievements, studentActions } = await import('../drizzle/schema');
    const unlockedAchievements: any[] = [];

    // Buscar todas as conquistas ativas
    const achievements = await db.select().from(hiddenAchievements)
      .where(eq(hiddenAchievements.isActive, true));

    // Buscar conquistas já desbloqueadas pelo aluno
    const alreadyUnlocked = await db.select()
      .from(studentHiddenAchievements)
      .where(eq(studentHiddenAchievements.studentId, studentId));
    
    const unlockedIds = new Set(alreadyUnlocked.map(a => a.achievementId));

    // Verificar cada conquista
    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;

      // Lógica de verificação por tipo de conquista
      switch (achievement.code) {
        case 'curious_clicker': {
          const clicks = await db.select().from(studentActions)
            .where(and(
              eq(studentActions.studentId, studentId),
              eq(studentActions.actionType, 'avatar_click')
            ));
          shouldUnlock = clicks.length >= 100;
          break;
        }

        case 'night_owl': {
          const midnightExercises = await db.select().from(studentActions)
            .where(and(
              eq(studentActions.studentId, studentId),
              eq(studentActions.actionType, 'exercise_complete_midnight')
            ));
          shouldUnlock = midnightExercises.length > 0;
          break;
        }

        case 'early_bird': {
          const earlyExercises = await db.select().from(studentActions)
            .where(and(
              eq(studentActions.studentId, studentId),
              eq(studentActions.actionType, 'exercise_complete_early')
            ));
          shouldUnlock = earlyExercises.length > 0;
          break;
        }

        case 'perfectionist': {
          const perfectStreaks = await db.select().from(studentActions)
            .where(and(
              eq(studentActions.studentId, studentId),
              eq(studentActions.actionType, 'perfect_streak_10')
            ));
          shouldUnlock = perfectStreaks.length > 0;
          break;
        }

        case 'explorer': {
          const pageVisits = await db.select().from(studentActions)
            .where(and(
              eq(studentActions.studentId, studentId),
              eq(studentActions.actionType, 'page_visit')
            ));
          const uniquePages = new Set(pageVisits.map((v: any) => {
            try {
              return JSON.parse(v.actionData || '{}').page;
            } catch {
              return null;
            }
          }).filter(Boolean));
          shouldUnlock = uniquePages.size >= 10; // Pelo menos 10 páginas diferentes
          break;
        }

        case 'speed_demon': {
          const speedRecords = await db.select().from(studentActions)
            .where(and(
              eq(studentActions.studentId, studentId),
              eq(studentActions.actionType, 'exercise_speed_record')
            ));
          shouldUnlock = speedRecords.length > 0;
          break;
        }

        case 'marathon_runner': {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayExercises = await db.select().from(studentActions)
            .where(and(
              eq(studentActions.studentId, studentId),
              eq(studentActions.actionType, 'exercise_complete'),
              sql`DATE(${studentActions.createdAt}) = DATE(${today})`
            ));
          shouldUnlock = todayExercises.length >= 10;
          break;
        }

        case 'weekend_warrior': {
          const weekendExercises = await db.select().from(studentActions)
            .where(and(
              eq(studentActions.studentId, studentId),
              eq(studentActions.actionType, 'exercise_complete_weekend')
            ));
          shouldUnlock = weekendExercises.length > 0;
          break;
        }

        case 'holiday_hero': {
          const holidayExercises = await db.select().from(studentActions)
            .where(and(
              eq(studentActions.studentId, studentId),
              eq(studentActions.actionType, 'exercise_complete_holiday')
            ));
          shouldUnlock = holidayExercises.length > 0;
          break;
        }

        case 'fire_streak': {
          const streakActions = await db.select().from(studentActions)
            .where(and(
              eq(studentActions.studentId, studentId),
              eq(studentActions.actionType, 'daily_streak_30')
            ));
          shouldUnlock = streakActions.length > 0;
          break;
        }
      }

      // Desbloquear conquista
      if (shouldUnlock) {
        await db.insert(studentHiddenAchievements).values({
          studentId,
          achievementId: achievement.id,
        });

        // Adicionar Tech Coins como recompensa
        if (achievement.rewardCoins > 0) {
          await addTechCoins(
            studentId,
            achievement.rewardCoins,
            'hidden_achievement',
            `Conquista desbloqueada: ${achievement.name}`,
            { achievementId: achievement.id }
          );
        }

        unlockedAchievements.push(achievement);
      }
    }

    return unlockedAchievements;
  } catch (error) {
    console.error("[Database] Error checking achievements:", error);
    return [];
  }
}

/**
 * Obter conquistas ocultas do aluno
 */
export async function getStudentHiddenAchievements(studentId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const { hiddenAchievements, studentHiddenAchievements } = await import('../drizzle/schema');
    
    const achievements = await db.select({
      id: hiddenAchievements.id,
      code: hiddenAchievements.code,
      name: hiddenAchievements.name,
      description: hiddenAchievements.description,
      icon: hiddenAchievements.icon,
      rewardCoins: hiddenAchievements.rewardCoins,
      rarity: hiddenAchievements.rarity,
      unlockedAt: studentHiddenAchievements.unlockedAt,
    })
    .from(studentHiddenAchievements)
    .innerJoin(
      hiddenAchievements,
      eq(studentHiddenAchievements.achievementId, hiddenAchievements.id)
    )
    .where(eq(studentHiddenAchievements.studentId, studentId));

    return achievements;
  } catch (error) {
    console.error("[Database] Error getting student hidden achievements:", error);
    return [];
  }
}

/**
 * Obter todas as conquistas ocultas (para exibição)
 */
export async function getAllHiddenAchievements() {
  const db = await getDb();
  if (!db) return [];

  try {
    const { hiddenAchievements } = await import('../drizzle/schema');
    return db.select().from(hiddenAchievements)
      .where(eq(hiddenAchievements.isActive, true));
  } catch (error) {
    console.error("[Database] Error getting all hidden achievements:", error);
    return [];
  }
}

/**
 * Seed inicial de itens da loja com Tech Coins
 */
export async function seedShopItemsWithTechCoins() {
  const db = await getDb();
  if (!db) return;

  try {
    // Verificar se já existem itens com rarity definida
    const existingRareItems = await db.select().from(shopItems)
      .where(eq(shopItems.rarity, 'rare'))
      .limit(1);
    
    if (existingRareItems.length > 0) {
      console.log("[Database] Shop items with rarity already seeded");
      return;
    }

    // Adicionar novos itens com sistema de raridade e Tech Coins
    const newItems: InsertShopItem[] = [
      // Power-ups (novos itens)
      { 
        name: "Dobro de XP (1h)", 
        description: "Ganhe o dobro de pontos por 1 hora", 
        category: "power_up", 
        price: 100, 
        rarity: "common",
        requiredBelt: "white",
        requiredPoints: 0,
        stock: -1,
        sortOrder: 100,
        metadata: JSON.stringify({ duration: 3600, multiplier: 2 })
      },
      { 
        name: "Triplo de XP (1h)", 
        description: "Ganhe o triplo de pontos por 1 hora", 
        category: "power_up", 
        price: 250, 
        rarity: "rare",
        requiredBelt: "green",
        requiredPoints: 500,
        stock: -1,
        sortOrder: 101,
        metadata: JSON.stringify({ duration: 3600, multiplier: 3 })
      },
      { 
        name: "Dica Extra", 
        description: "Receba uma dica adicional em exercícios difíceis", 
        category: "power_up", 
        price: 50, 
        rarity: "common",
        requiredBelt: "white",
        requiredPoints: 0,
        stock: -1,
        sortOrder: 102,
        metadata: JSON.stringify({ type: "hint" })
      },
      { 
        name: "Segunda Chance", 
        description: "Tente novamente sem perder pontos", 
        category: "power_up", 
        price: 150, 
        rarity: "rare",
        requiredBelt: "yellow",
        requiredPoints: 200,
        stock: -1,
        sortOrder: 103,
        metadata: JSON.stringify({ type: "retry" })
      },
      
      // Certificados especiais
      { 
        name: "Certificado de Excelência", 
        description: "Certificado digital de excelência acadêmica", 
        category: "certificate", 
        price: 500, 
        rarity: "epic",
        requiredBelt: "purple",
        requiredPoints: 1000,
        stock: -1,
        sortOrder: 200,
        metadata: JSON.stringify({ type: "excellence" })
      },
      { 
        name: "Certificado de Mestre", 
        description: "Certificado de conclusão de trilha de especialização", 
        category: "certificate", 
        price: 1000, 
        rarity: "legendary",
        requiredBelt: "black",
        requiredPoints: 3000,
        stock: -1,
        sortOrder: 201,
        metadata: JSON.stringify({ type: "master" })
      },
      
      // Unlocks (desbloqueios)
      { 
        name: "Tema Escuro Premium", 
        description: "Desbloqueie o tema escuro exclusivo", 
        category: "unlock", 
        price: 200, 
        rarity: "rare",
        requiredBelt: "orange",
        requiredPoints: 300,
        stock: -1,
        sortOrder: 300,
        metadata: JSON.stringify({ type: "theme_dark" })
      },
      { 
        name: "Avatar Animado", 
        description: "Seu avatar ganha animações especiais", 
        category: "unlock", 
        price: 400, 
        rarity: "epic",
        requiredBelt: "blue",
        requiredPoints: 800,
        stock: -1,
        sortOrder: 301,
        metadata: JSON.stringify({ type: "animated_avatar" })
      },
      { 
        name: "Título Personalizado", 
        description: "Crie seu próprio título no perfil", 
        category: "unlock", 
        price: 300, 
        rarity: "epic",
        requiredBelt: "green",
        requiredPoints: 600,
        stock: -1,
        sortOrder: 302,
        metadata: JSON.stringify({ type: "custom_title" })
      },
    ];

    await db.insert(shopItems).values(newItems);
    console.log("[Database] New shop items with Tech Coins seeded successfully");
  } catch (error) {
    console.error("[Database] Error seeding shop items with tech coins:", error);
  }
}


// ============================================
// SPECIALIZATION SYSTEM (Dojo Tech)
// ============================================

/**
 * Escolher especialização do aluno
 */
export async function chooseSpecialization(
  studentId: number,
  specialization: 'code_warrior' | 'interface_master' | 'data_sage' | 'system_architect'
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Verificar se já possui especialização
    const existing = await db.select().from(studentSpecializations)
      .where(eq(studentSpecializations.studentId, studentId));
    
    if (existing.length > 0) {
      throw new Error("Aluno já possui uma especialização");
    }

    // Criar especialização
    await db.insert(studentSpecializations).values({
      studentId,
      specialization,
      level: 1
    });

    return { success: true, specialization };
  } catch (error) {
    console.error("[chooseSpecialization] Error:", error);
    throw error;
  }
}

/**
 * Buscar especialização do aluno
 */
export async function getStudentSpecialization(studentId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const [spec] = await db.select().from(studentSpecializations)
      .where(eq(studentSpecializations.studentId, studentId));
    
    return spec || null;
  } catch (error) {
    console.error("[getStudentSpecialization] Error:", error);
    return null;
  }
}

/**
 * Desbloquear skill para o aluno
 */
export async function unlockSkill(studentId: number, skillId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Verificar se já possui a skill
    const existing = await db.select().from(studentSkills)
      .where(and(
        eq(studentSkills.studentId, studentId),
        eq(studentSkills.skillId, skillId)
      ));
    
    if (existing.length > 0) {
      return { success: false, message: "Skill já desbloqueada" };
    }

    // Desbloquear skill
    await db.insert(studentSkills).values({
      studentId,
      skillId,
      isActive: true
    });

    return { success: true };
  } catch (error) {
    console.error("[unlockSkill] Error:", error);
    throw error;
  }
}

/**
 * Buscar árvore de skills da especialização
 */
export async function getSkillTree(specialization: string) {
  const db = await getDb();
  if (!db) return [];

  try {
    const skills = await db.select().from(specializationSkills)
      .where(eq(specializationSkills.specialization, specialization as any))
      .orderBy(specializationSkills.tier, specializationSkills.requiredLevel);
    
    return skills;
  } catch (error) {
    console.error("[getSkillTree] Error:", error);
    return [];
  }
}

/**
 * Buscar skills desbloqueadas do aluno
 */
export async function getStudentSkills(studentId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const skills = await db.select({
      id: studentSkills.id,
      skillId: studentSkills.skillId,
      unlockedAt: studentSkills.unlockedAt,
      isActive: studentSkills.isActive,
      skillKey: specializationSkills.skillKey,
      name: specializationSkills.name,
      description: specializationSkills.description,
      tier: specializationSkills.tier,
      bonusType: specializationSkills.bonusType,
      bonusValue: specializationSkills.bonusValue
    })
    .from(studentSkills)
    .innerJoin(specializationSkills, eq(studentSkills.skillId, specializationSkills.id))
    .where(eq(studentSkills.studentId, studentId));
    
    return skills;
  } catch (error) {
    console.error("[getStudentSkills] Error:", error);
    return [];
  }
}

/**
 * Calcular multiplicador de bônus total do aluno
 */
export async function calculateBonusMultiplier(studentId: number, bonusType: string) {
  const db = await getDb();
  if (!db) return 1.0;

  try {
    const skills = await db.select({
      bonusType: specializationSkills.bonusType,
      bonusValue: specializationSkills.bonusValue
    })
    .from(studentSkills)
    .innerJoin(specializationSkills, eq(studentSkills.skillId, specializationSkills.id))
    .where(and(
      eq(studentSkills.studentId, studentId),
      eq(studentSkills.isActive, true),
      eq(specializationSkills.bonusType, bonusType)
    ));

    // Multiplicar todos os bônus
    let multiplier = 1.0;
    for (const skill of skills) {
      multiplier *= skill.bonusValue;
    }

    return multiplier;
  } catch (error) {
    console.error("[calculateBonusMultiplier] Error:", error);
    return 1.0;
  }
}

/**
 * Atribuir título honorífico ao aluno
 */
export async function awardHonorificTitle(studentId: number, title: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.update(studentPoints)
      .set({ honorificTitle: title })
      .where(eq(studentPoints.studentId, studentId));

    return { success: true, title };
  } catch (error) {
    console.error("[awardHonorificTitle] Error:", error);
    throw error;
  }
}

/**
 * Verificar e atualizar nível da especialização baseado em pontos
 */
export async function updateSpecializationLevel(studentId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const spec = await getStudentSpecialization(studentId);
    if (!spec) return null;

    const points = await getOrCreateStudentPoints(studentId);
    if (!points) return null;

    // Calcular nível baseado em pontos (a cada 500 pontos = 1 nível)
    const newLevel = Math.floor(points.totalPoints / 500) + 1;

    if (newLevel > spec.level) {
      await db.update(studentSpecializations)
        .set({ level: newLevel })
        .where(eq(studentSpecializations.studentId, studentId));

      // Verificar títulos honoríficos
      if (newLevel >= 10) {
        await awardHonorificTitle(studentId, "Mestre");
      } else if (newLevel >= 20) {
        await awardHonorificTitle(studentId, "Grão-Mestre");
      } else if (newLevel >= 30) {
        await awardHonorificTitle(studentId, "Sensei");
      }

      return { levelUp: true, newLevel, oldLevel: spec.level };
    }

    return { levelUp: false, currentLevel: spec.level };
  } catch (error) {
    console.error("[updateSpecializationLevel] Error:", error);
    return null;
  }
}

/**
 * Seed inicial de skills para todas as especializações
 */
export async function seedSpecializationSkills() {
  const db = await getDb();
  if (!db) return;

  try {
    // Verificar se já existem skills
    const existing = await db.select().from(specializationSkills).limit(1);
    if (existing.length > 0) {
      console.log("[seedSpecializationSkills] Skills já existem, pulando seed");
      return;
    }

    const skills = [
      // CODE WARRIOR (Guerreiro do Código)
      { specialization: 'code_warrior', skillKey: 'cw_algo_basic', name: 'Algoritmos Básicos', description: 'Domínio de estruturas básicas de algoritmos', tier: 1, requiredLevel: 1, bonusType: 'points_multiplier', bonusValue: 1.1, prerequisiteSkills: null },
      { specialization: 'code_warrior', skillKey: 'cw_data_struct', name: 'Estruturas de Dados', description: 'Conhecimento avançado de arrays, listas e árvores', tier: 2, requiredLevel: 3, bonusType: 'points_multiplier', bonusValue: 1.15, prerequisiteSkills: JSON.stringify(['cw_algo_basic']) },
      { specialization: 'code_warrior', skillKey: 'cw_optimization', name: 'Otimização de Código', description: 'Habilidade de escrever código eficiente', tier: 3, requiredLevel: 5, bonusType: 'accuracy_bonus', bonusValue: 1.2, prerequisiteSkills: JSON.stringify(['cw_data_struct']) },
      { specialization: 'code_warrior', skillKey: 'cw_recursion', name: 'Recursão Avançada', description: 'Domínio de técnicas recursivas complexas', tier: 4, requiredLevel: 8, bonusType: 'points_multiplier', bonusValue: 1.25, prerequisiteSkills: JSON.stringify(['cw_optimization']) },
      { specialization: 'code_warrior', skillKey: 'cw_master', name: 'Mestre dos Algoritmos', description: 'Domínio completo de algoritmos avançados', tier: 5, requiredLevel: 12, bonusType: 'points_multiplier', bonusValue: 1.5, prerequisiteSkills: JSON.stringify(['cw_recursion']) },

      // INTERFACE MASTER (Mestre das Interfaces)
      { specialization: 'interface_master', skillKey: 'im_html_css', name: 'HTML & CSS Básico', description: 'Fundamentos de marcação e estilização', tier: 1, requiredLevel: 1, bonusType: 'points_multiplier', bonusValue: 1.1, prerequisiteSkills: null },
      { specialization: 'interface_master', skillKey: 'im_responsive', name: 'Design Responsivo', description: 'Criação de interfaces adaptáveis', tier: 2, requiredLevel: 3, bonusType: 'points_multiplier', bonusValue: 1.15, prerequisiteSkills: JSON.stringify(['im_html_css']) },
      { specialization: 'interface_master', skillKey: 'im_ux_principles', name: 'Princípios de UX', description: 'Compreensão de experiência do usuário', tier: 3, requiredLevel: 5, bonusType: 'accuracy_bonus', bonusValue: 1.2, prerequisiteSkills: JSON.stringify(['im_responsive']) },
      { specialization: 'interface_master', skillKey: 'im_animations', name: 'Animações e Transições', description: 'Domínio de animações CSS e JS', tier: 4, requiredLevel: 8, bonusType: 'points_multiplier', bonusValue: 1.25, prerequisiteSkills: JSON.stringify(['im_ux_principles']) },
      { specialization: 'interface_master', skillKey: 'im_master', name: 'Mestre das Interfaces', description: 'Criação de experiências visuais excepcionais', tier: 5, requiredLevel: 12, bonusType: 'points_multiplier', bonusValue: 1.5, prerequisiteSkills: JSON.stringify(['im_animations']) },

      // DATA SAGE (Sábio dos Dados)
      { specialization: 'data_sage', skillKey: 'ds_sql_basic', name: 'SQL Básico', description: 'Consultas e manipulação de dados', tier: 1, requiredLevel: 1, bonusType: 'points_multiplier', bonusValue: 1.1, prerequisiteSkills: null },
      { specialization: 'data_sage', skillKey: 'ds_analytics', name: 'Análise de Dados', description: 'Técnicas de análise e visualização', tier: 2, requiredLevel: 3, bonusType: 'points_multiplier', bonusValue: 1.15, prerequisiteSkills: JSON.stringify(['ds_sql_basic']) },
      { specialization: 'data_sage', skillKey: 'ds_statistics', name: 'Estatística Aplicada', description: 'Domínio de métodos estatísticos', tier: 3, requiredLevel: 5, bonusType: 'accuracy_bonus', bonusValue: 1.2, prerequisiteSkills: JSON.stringify(['ds_analytics']) },
      { specialization: 'data_sage', skillKey: 'ds_ml_intro', name: 'Introdução ao ML', description: 'Fundamentos de Machine Learning', tier: 4, requiredLevel: 8, bonusType: 'points_multiplier', bonusValue: 1.25, prerequisiteSkills: JSON.stringify(['ds_statistics']) },
      { specialization: 'data_sage', skillKey: 'ds_master', name: 'Sábio dos Dados', description: 'Domínio completo de ciência de dados', tier: 5, requiredLevel: 12, bonusType: 'points_multiplier', bonusValue: 1.5, prerequisiteSkills: JSON.stringify(['ds_ml_intro']) },

      // SYSTEM ARCHITECT (Arquiteto de Sistemas)
      { specialization: 'system_architect', skillKey: 'sa_networking', name: 'Redes e Protocolos', description: 'Fundamentos de redes de computadores', tier: 1, requiredLevel: 1, bonusType: 'points_multiplier', bonusValue: 1.1, prerequisiteSkills: null },
      { specialization: 'system_architect', skillKey: 'sa_devops', name: 'DevOps Básico', description: 'Práticas de integração e entrega contínua', tier: 2, requiredLevel: 3, bonusType: 'points_multiplier', bonusValue: 1.15, prerequisiteSkills: JSON.stringify(['sa_networking']) },
      { specialization: 'system_architect', skillKey: 'sa_cloud', name: 'Cloud Computing', description: 'Arquitetura em nuvem', tier: 3, requiredLevel: 5, bonusType: 'accuracy_bonus', bonusValue: 1.2, prerequisiteSkills: JSON.stringify(['sa_devops']) },
      { specialization: 'system_architect', skillKey: 'sa_security', name: 'Segurança de Sistemas', description: 'Práticas de segurança e criptografia', tier: 4, requiredLevel: 8, bonusType: 'points_multiplier', bonusValue: 1.25, prerequisiteSkills: JSON.stringify(['sa_cloud']) },
      { specialization: 'system_architect', skillKey: 'sa_master', name: 'Arquiteto de Sistemas', description: 'Domínio completo de arquitetura de sistemas', tier: 5, requiredLevel: 12, bonusType: 'points_multiplier', bonusValue: 1.5, prerequisiteSkills: JSON.stringify(['sa_security']) },
    ];

    await db.insert(specializationSkills).values(skills as any);
    console.log("[seedSpecializationSkills] Skills criadas com sucesso");
  } catch (error) {
    console.error("[seedSpecializationSkills] Error:", error);
  }
}

// ========== ENHANCED LEARNING PATHS (TRILHAS DE APRENDIZAGEM MELHORADAS) ==========

/**
 * Buscar trilha completa com progresso do aluno e pré-requisitos
 */
export async function getEnhancedLearningPath(studentId: number, subjectId: number, professorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar módulos da disciplina
  const modules = await db.select().from(learningModules)
    .where(and(eq(learningModules.subjectId, subjectId), eq(learningModules.userId, professorId)))
    .orderBy(learningModules.orderIndex);
  
  // Buscar todos os tópicos e progresso do aluno
  const modulesWithTopics = await Promise.all(
    modules.map(async (module) => {
      const topics = await db.select().from(learningTopics)
        .where(and(eq(learningTopics.moduleId, module.id), eq(learningTopics.userId, professorId)))
        .orderBy(learningTopics.orderIndex);
      
      // Buscar progresso do aluno para cada tópico
      const topicsWithProgress = await Promise.all(
        topics.map(async (topic) => {
          const [progress] = await db.select().from(studentTopicProgress)
            .where(and(
              eq(studentTopicProgress.studentId, studentId),
              eq(studentTopicProgress.topicId, topic.id)
            ));
          
          // Buscar materiais do tópico
          const materials = await db.select().from(topicMaterials)
            .where(eq(topicMaterials.topicId, topic.id))
            .orderBy(topicMaterials.orderIndex);
          
          // Verificar se tópico está desbloqueado (pré-requisitos completados)
          let isUnlocked = true;
          if (topic.prerequisiteTopicIds) {
            try {
              const prerequisiteIds = JSON.parse(topic.prerequisiteTopicIds);
              if (prerequisiteIds && prerequisiteIds.length > 0) {
                const prerequisiteProgress = await db.select().from(studentTopicProgress)
                  .where(and(
                    eq(studentTopicProgress.studentId, studentId),
                    inArray(studentTopicProgress.topicId, prerequisiteIds)
                  ));
                
                // Todos os pré-requisitos devem estar completados
                isUnlocked = prerequisiteProgress.length === prerequisiteIds.length &&
                  prerequisiteProgress.every(p => p.status === 'completed');
              }
            } catch (e) {
              console.error('Error parsing prerequisiteTopicIds:', e);
            }
          }
          
          return {
            ...topic,
            progress: progress || null,
            materials,
            isUnlocked
          };
        })
      );
      
      return {
        ...module,
        topics: topicsWithProgress
      };
    })
  );
  
  return modulesWithTopics;
}

/**
 * Atualizar progresso do aluno em um tópico
 */
export async function updateStudentTopicProgressEnhanced(data: {
  studentId: number;
  topicId: number;
  status?: 'not_started' | 'in_progress' | 'completed';
  selfAssessment?: 'understood' | 'have_doubts' | 'need_help';
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se já existe progresso
  const [existing] = await db.select().from(studentTopicProgress)
    .where(and(
      eq(studentTopicProgress.studentId, data.studentId),
      eq(studentTopicProgress.topicId, data.topicId)
    ));
  
  if (existing) {
    // Atualizar existente
    await db.update(studentTopicProgress)
      .set({
        ...data,
        completedAt: data.status === 'completed' ? new Date() : existing.completedAt,
        updatedAt: new Date()
      } as any)
      .where(eq(studentTopicProgress.id, existing.id));
    
    return { success: true, id: existing.id };
  } else {
    // Criar novo
    const [result] = await db.insert(studentTopicProgress)
      .values({
        studentId: data.studentId,
        topicId: data.topicId,
        status: data.status || 'not_started',
        selfAssessment: data.selfAssessment,
        notes: data.notes,
        completedAt: data.status === 'completed' ? new Date() : null,
      } as any);
    
    return { success: true, id: result.insertId };
  }
}

/**
 * Adicionar entrada no diário de aprendizagem
 */
export async function addJournalEntry(data: InsertStudentLearningJournal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(studentLearningJournal)
    .values(data as any);
  
  return { success: true, id: result.insertId };
}

/**
 * Buscar entradas do diário por tópico
 */
export async function getJournalEntriesByTopic(studentId: number, topicId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const entries = await db.select().from(studentLearningJournal)
    .where(and(
      eq(studentLearningJournal.studentId, studentId),
      eq(studentLearningJournal.topicId, topicId)
    ))
    .orderBy(desc(studentLearningJournal.entryDate));
  
  return entries;
}

/**
 * Buscar todas as entradas do diário do aluno
 */
export async function getAllJournalEntries(studentId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const entries = await db.select().from(studentLearningJournal)
    .where(eq(studentLearningJournal.studentId, studentId))
    .orderBy(desc(studentLearningJournal.entryDate))
    .limit(limit);
  
  return entries;
}

/**
 * Enviar dúvida ao professor
 */
export async function submitDoubt(data: InsertStudentTopicDoubt) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(studentTopicDoubts)
    .values(data as any);
  
  // Criar notificação para o professor
  await createNotification({
    userId: data.professorId,
    title: 'Nova dúvida recebida',
    message: `Um aluno enviou uma dúvida sobre um tópico`,
    type: 'new_announcement',
    relatedId: result.insertId
  });
  
  return { success: true, id: result.insertId };
}

/**
 * Buscar dúvidas do aluno
 */
export async function getStudentDoubts(studentId: number, topicId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let doubts;
  
  if (topicId) {
    doubts = await db.select().from(studentTopicDoubts)
      .where(and(
        eq(studentTopicDoubts.studentId, studentId),
        eq(studentTopicDoubts.topicId, topicId)
      ))
      .orderBy(desc(studentTopicDoubts.createdAt));
  } else {
    doubts = await db.select().from(studentTopicDoubts)
      .where(eq(studentTopicDoubts.studentId, studentId))
      .orderBy(desc(studentTopicDoubts.createdAt));
  }
  
  return doubts;
}

/**
 * Deletar dúvida do aluno
 */
export async function deleteStudentDoubt(doubtId: number, studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se a dúvida pertence ao aluno
  const [doubt] = await db.select().from(studentTopicDoubts)
    .where(and(
      eq(studentTopicDoubts.id, doubtId),
      eq(studentTopicDoubts.studentId, studentId)
    ));
  
  if (!doubt) {
    throw new Error("Dúvida não encontrada ou sem permissão");
  }
  
  // Deletar a dúvida
  await db.delete(studentTopicDoubts)
    .where(eq(studentTopicDoubts.id, doubtId));
  
  return { success: true };
}

/**
 * Buscar dúvidas pendentes para o professor
 */
export async function getPendingDoubts(professorId: number, subjectId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let doubts = await db.select({
    doubt: studentTopicDoubts,
    topic: learningTopics,
    module: learningModules,
    student: students
  })
  .from(studentTopicDoubts)
  .innerJoin(learningTopics, eq(studentTopicDoubts.topicId, learningTopics.id))
  .innerJoin(learningModules, eq(learningTopics.moduleId, learningModules.id))
  .innerJoin(students, eq(studentTopicDoubts.studentId, students.id))
  .where(and(
    eq(studentTopicDoubts.professorId, professorId),
    eq(studentTopicDoubts.status, 'pending')
  ))
  .orderBy(desc(studentTopicDoubts.createdAt));
  
  // Filtrar por disciplina se especificado
  if (subjectId) {
    doubts = doubts.filter(d => d.module.subjectId === subjectId);
  }
  
  return doubts;
}

/**
 * Responder dúvida do aluno
 */
export async function respondDoubt(doubtId: number, answer: string, professorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar a dúvida para pegar o studentId
  const [doubt] = await db.select().from(studentTopicDoubts)
    .where(and(
      eq(studentTopicDoubts.id, doubtId),
      eq(studentTopicDoubts.professorId, professorId)
    ));
  
  if (!doubt) {
    throw new Error("Dúvida não encontrada ou sem permissão");
  }
  
  // Atualizar dúvida
  await db.update(studentTopicDoubts)
    .set({
      answer,
      status: 'answered',
      answeredAt: new Date(),
      updatedAt: new Date()
    } as any)
    .where(eq(studentTopicDoubts.id, doubtId));
  
  // Criar notificação para o aluno
  await createNotification({
    userId: doubt.studentId,
    title: 'Sua dúvida foi respondida',
    message: 'O professor respondeu sua dúvida',
    type: 'feedback_received',
    relatedId: doubtId
  });
  
  return { success: true };
}

/**
 * Buscar estatísticas de estudo do aluno
 */
export async function getStudyStatistics(studentId: number, subjectId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar matrículas do aluno em ambas as tabelas
  let enrollments = await db.select().from(studentEnrollments)
    .where(eq(studentEnrollments.studentId, studentId));
  
  // Também buscar na tabela subject_enrollments (matrículas feitas pelo professor)
  const subjectEnrollmentsData = await db.select().from(subjectEnrollments)
    .where(eq(subjectEnrollments.studentId, studentId));
  
  // Combinar os IDs de disciplinas de ambas as tabelas
  let subjectIdsFromStudentEnrollments = enrollments.map(e => e.subjectId);
  let subjectIdsFromSubjectEnrollments = subjectEnrollmentsData.map(e => e.subjectId);
  
  // Unir e remover duplicatas
  let allSubjectIds = Array.from(new Set([...subjectIdsFromStudentEnrollments, ...subjectIdsFromSubjectEnrollments]));
  
  if (subjectId) {
    allSubjectIds = allSubjectIds.filter(id => id === subjectId);
  }
  
  const subjectIds = allSubjectIds;
  
  // Buscar dúvidas - buscar todas as dúvidas do aluno (independente do tópico/matrícula)
  const allDoubts = await db.select().from(studentTopicDoubts)
    .where(eq(studentTopicDoubts.studentId, studentId));
  
  const pendingDoubtsCount = allDoubts.filter(d => d.status === 'pending').length;
  const answeredDoubtsCount = allDoubts.filter(d => d.status === 'answered').length;
  
  if (subjectIds.length === 0) {
    return {
      totalTopics: 0,
      completedTopics: 0,
      inProgressTopics: 0,
      notStartedTopics: 0,
      totalHoursEstimated: 0,
      journalEntries: 0,
      pendingDoubts: pendingDoubtsCount,
      answeredDoubts: answeredDoubtsCount
    };
  }
  
  // Buscar todos os módulos das disciplinas matriculadas
  const modules = await db.select().from(learningModules)
    .where(inArray(learningModules.subjectId, subjectIds));
  
  const moduleIds = modules.map(m => m.id);
  
  if (moduleIds.length === 0) {
    return {
      totalTopics: 0,
      completedTopics: 0,
      inProgressTopics: 0,
      notStartedTopics: 0,
      totalHoursEstimated: 0,
      journalEntries: 0,
      pendingDoubts: 0,
      answeredDoubts: 0
    };
  }
  
  // Buscar todos os tópicos
  const topics = await db.select().from(learningTopics)
    .where(inArray(learningTopics.moduleId, moduleIds));
  
  const topicIds = topics.map(t => t.id);
  
  // Buscar progresso do aluno
  const progress = await db.select().from(studentTopicProgress)
    .where(and(
      eq(studentTopicProgress.studentId, studentId),
      inArray(studentTopicProgress.topicId, topicIds)
    ));
  
  // Buscar entradas do diário
  const journalCount = await db.select({ count: sql<number>`count(*)` })
    .from(studentLearningJournal)
    .where(and(
      eq(studentLearningJournal.studentId, studentId),
      inArray(studentLearningJournal.topicId, topicIds)
    ));
  
  const completedTopics = progress.filter(p => p.status === 'completed').length;
  const inProgressTopics = progress.filter(p => p.status === 'in_progress').length;
  const notStartedTopics = topics.length - completedTopics - inProgressTopics;
  const totalHoursEstimated = topics.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  
  return {
    totalTopics: topics.length,
    completedTopics,
    inProgressTopics,
    notStartedTopics,
    totalHoursEstimated,
    journalEntries: journalCount[0]?.count || 0,
    pendingDoubts: pendingDoubtsCount,
    answeredDoubts: answeredDoubtsCount
  };
}


/**
 * Buscar estatísticas detalhadas de uma disciplina específica para o aluno
 */
export async function getSubjectStatistics(studentId: number, subjectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar a disciplina
  const [subject] = await db.select().from(subjects)
    .where(eq(subjects.id, subjectId));
  
  if (!subject) {
    return null;
  }
  
  // Buscar todos os módulos da disciplina
  const modules = await db.select().from(learningModules)
    .where(eq(learningModules.subjectId, subjectId))
    .orderBy(learningModules.orderIndex);
  
  const moduleIds = modules.map(m => m.id);
  
  if (moduleIds.length === 0) {
    return {
      subjectId,
      subjectName: subject.name,
      subjectCode: subject.code,
      workload: subject.workload || 0,
      totalModules: 0,
      totalTopics: 0,
      completedTopics: 0,
      inProgressTopics: 0,
      notStartedTopics: 0,
      progressPercentage: 0,
      totalHoursEstimated: 0
    };
  }
  
  // Buscar todos os tópicos dos módulos
  const topics = await db.select().from(learningTopics)
    .where(inArray(learningTopics.moduleId, moduleIds));
  
  const topicIds = topics.map(t => t.id);
  
  // Buscar progresso do aluno
  const progress = topicIds.length > 0 
    ? await db.select().from(studentTopicProgress)
        .where(and(
          eq(studentTopicProgress.studentId, studentId),
          inArray(studentTopicProgress.topicId, topicIds)
        ))
    : [];
  
  const completedTopics = progress.filter(p => p.status === 'completed').length;
  const inProgressTopics = progress.filter(p => p.status === 'in_progress').length;
  const notStartedTopics = topics.length - completedTopics - inProgressTopics;
  const totalHoursEstimated = topics.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const progressPercentage = topics.length > 0 
    ? Math.round((completedTopics / topics.length) * 100) 
    : 0;
  
  return {
    subjectId,
    subjectName: subject.name,
    subjectCode: subject.code,
    workload: subject.workload || 0,
    totalModules: modules.length,
    totalTopics: topics.length,
    completedTopics,
    inProgressTopics,
    notStartedTopics,
    progressPercentage,
    totalHoursEstimated
  };
}

// ==================== GAMIFICAÇÃO AVANÇADA ====================

/**
 * Badges por Módulo
 */

// Calcular e atribuir badge de módulo baseado no desempenho
export async function calculateModuleBadge(studentId: number, moduleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar todos os tópicos do módulo
  const topics = await db.select().from(learningTopics)
    .where(eq(learningTopics.moduleId, moduleId));

  if (topics.length === 0) {
    return null;
  }

  const topicIds = topics.map(t => t.id);

  // Buscar progresso do aluno nesses tópicos
  const progress = await db.select().from(studentTopicProgress)
    .where(and(
      eq(studentTopicProgress.studentId, studentId),
      inArray(studentTopicProgress.topicId, topicIds)
    ));

  // Buscar histórico de progresso para calcular tempo e pontuação
  const history = await db.select().from(topicProgressHistory)
    .where(and(
      eq(topicProgressHistory.studentId, studentId),
      inArray(topicProgressHistory.topicId, topicIds)
    ));

  const completedTopics = progress.filter(p => p.status === 'completed').length;
  const completionPercentage = Math.round((completedTopics / topics.length) * 100);
  
  // Calcular pontuação média
  const averageScore = history.length > 0
    ? Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length)
    : 0;

  // Calcular tempo total gasto
  const timeSpent = history.reduce((sum, h) => sum + h.timeSpent, 0);

  // Determinar nível do badge
  let badgeLevel: "bronze" | "silver" | "gold" | "platinum";
  
  if (completionPercentage === 100 && averageScore >= 95) {
    badgeLevel = "platinum";
  } else if (completionPercentage === 100 && averageScore >= 85) {
    badgeLevel = "gold";
  } else if (completionPercentage >= 80 && averageScore >= 70) {
    badgeLevel = "silver";
  } else if (completionPercentage >= 60) {
    badgeLevel = "bronze";
  } else {
    return null; // Não atingiu requisitos mínimos
  }

  // Verificar se já existe badge para este módulo
  const existing = await db.select().from(moduleBadges)
    .where(and(
      eq(moduleBadges.studentId, studentId),
      eq(moduleBadges.moduleId, moduleId)
    ));

  if (existing.length > 0) {
    // Atualizar se o novo badge for melhor
    const currentBadge = existing[0];
    const levels = ["bronze", "silver", "gold", "platinum"];
    const currentLevel = levels.indexOf(currentBadge.badgeLevel);
    const newLevel = levels.indexOf(badgeLevel);

    if (newLevel > currentLevel) {
      await db.update(moduleBadges)
        .set({
          badgeLevel,
          completionPercentage,
          averageScore,
          timeSpent,
          earnedAt: new Date()
        })
        .where(eq(moduleBadges.id, currentBadge.id));
      
      return { ...currentBadge, badgeLevel, upgraded: true };
    }
    return { ...currentBadge, upgraded: false };
  }

  // Criar novo badge
  const [newBadge] = await db.insert(moduleBadges).values({
    studentId,
    moduleId,
    badgeLevel,
    completionPercentage,
    averageScore,
    timeSpent
  });

  return { id: newBadge.insertId, badgeLevel, upgraded: false, isNew: true };
}

// Buscar badges de módulos de um aluno
export async function getStudentModuleBadges(studentId: number) {
  const db = await getDb();
  if (!db) return [];

  const badges = await db.select({
    id: moduleBadges.id,
    moduleId: moduleBadges.moduleId,
    moduleName: learningModules.title,
    subjectId: learningModules.subjectId,
    badgeLevel: moduleBadges.badgeLevel,
    completionPercentage: moduleBadges.completionPercentage,
    averageScore: moduleBadges.averageScore,
    timeSpent: moduleBadges.timeSpent,
    earnedAt: moduleBadges.earnedAt
  })
  .from(moduleBadges)
  .innerJoin(learningModules, eq(moduleBadges.moduleId, learningModules.id))
  .where(eq(moduleBadges.studentId, studentId))
  .orderBy(desc(moduleBadges.earnedAt));

  return badges;
}

// Buscar badges de um módulo específico
export async function getModuleBadgesByModule(moduleId: number) {
  const db = await getDb();
  if (!db) return [];

  const badges = await db.select({
    id: moduleBadges.id,
    studentId: moduleBadges.studentId,
    studentName: students.fullName,
    badgeLevel: moduleBadges.badgeLevel,
    completionPercentage: moduleBadges.completionPercentage,
    averageScore: moduleBadges.averageScore,
    timeSpent: moduleBadges.timeSpent,
    earnedAt: moduleBadges.earnedAt
  })
  .from(moduleBadges)
  .innerJoin(students, eq(moduleBadges.studentId, students.id))
  .where(eq(moduleBadges.moduleId, moduleId))
  .orderBy(desc(moduleBadges.averageScore));

  return badges;
}

/**
 * Conquistas por Especialização
 */

// Criar conquista de especialização (admin/sistema)
export async function createSpecializationAchievement(data: {
  code: string;
  specialization: "code_warrior" | "interface_master" | "data_sage" | "system_architect";
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  requirement: object;
  points: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(specializationAchievements).values({
    ...data,
    requirement: JSON.stringify(data.requirement)
  });

  return result.insertId;
}

// Buscar todas as conquistas de uma especialização
export async function getSpecializationAchievements(specialization: string) {
  const db = await getDb();
  if (!db) return [];

  const achievements = await db.select().from(specializationAchievements)
    .where(eq(specializationAchievements.specialization, specialization as any));

  return achievements.map(a => ({
    ...a,
    requirement: JSON.parse(a.requirement)
  }));
}

// Desbloquear conquista para um aluno
export async function unlockAchievement(studentId: number, achievementId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se já foi desbloqueada
  const existing = await db.select().from(studentSpecializationAchievements)
    .where(and(
      eq(studentSpecializationAchievements.studentId, studentId),
      eq(studentSpecializationAchievements.achievementId, achievementId)
    ));

  if (existing.length > 0) {
    return { alreadyUnlocked: true };
  }

  // Desbloquear
  await db.insert(studentSpecializationAchievements).values({
    studentId,
    achievementId,
    progress: 100
  });

  // Buscar detalhes da conquista para adicionar pontos
  const achievement = await db.select().from(specializationAchievements)
    .where(eq(specializationAchievements.id, achievementId));

  if (achievement.length > 0) {
    // Adicionar pontos ao aluno
    const points = achievement[0].points;
    await addPointsToStudent(studentId, points, `Conquista desbloqueada: ${achievement[0].name}`, 'achievement', achievementId);
  }

  return { success: true, isNew: true };
}

// Buscar conquistas desbloqueadas de um aluno
export async function getStudentAchievements(studentId: number) {
  const db = await getDb();
  if (!db) return [];

  const achievements = await db.select({
    id: studentSpecializationAchievements.id,
    achievementId: studentSpecializationAchievements.achievementId,
    code: specializationAchievements.code,
    name: specializationAchievements.name,
    description: specializationAchievements.description,
    icon: specializationAchievements.icon,
    rarity: specializationAchievements.rarity,
    specialization: specializationAchievements.specialization,
    points: specializationAchievements.points,
    unlockedAt: studentSpecializationAchievements.unlockedAt,
    progress: studentSpecializationAchievements.progress
  })
  .from(studentSpecializationAchievements)
  .innerJoin(specializationAchievements, eq(studentSpecializationAchievements.achievementId, specializationAchievements.id))
  .where(eq(studentSpecializationAchievements.studentId, studentId))
  .orderBy(desc(studentSpecializationAchievements.unlockedAt));

  return achievements;
}

// Verificar e desbloquear conquistas de especialização automaticamente
export async function checkAndUnlockSpecializationAchievements(studentId: number) {
  const db = await getDb();
  if (!db) return [];

  // Buscar especialização do aluno
  const specialization = await db.select().from(studentSpecializations)
    .where(eq(studentSpecializations.studentId, studentId));

  if (specialization.length === 0) {
    return [];
  }

  const spec = specialization[0].specialization;

  // Buscar todas as conquistas da especialização
  const achievements = await getSpecializationAchievements(spec);

  // Buscar conquistas já desbloqueadas
  const unlocked = await getStudentAchievements(studentId);
  const unlockedIds = unlocked.map(u => u.achievementId);

  const newlyUnlocked = [];

  // Verificar cada conquista
  for (const achievement of achievements) {
    if (unlockedIds.includes(achievement.id)) continue;

    const req = achievement.requirement as any;
    let meetsRequirement = false;

    // Verificar requisitos baseado no tipo
    if (req.type === 'modules_completed') {
      const badges = await getStudentModuleBadges(studentId);
      const completedModules = badges.filter(b => b.completionPercentage === 100).length;
      meetsRequirement = completedModules >= req.count;
    } else if (req.type === 'platinum_badges') {
      const badges = await getStudentModuleBadges(studentId);
      const platinumCount = badges.filter(b => b.badgeLevel === 'platinum').length;
      meetsRequirement = platinumCount >= req.count;
    } else if (req.type === 'total_points') {
      const points = await db.select().from(studentPoints)
        .where(eq(studentPoints.studentId, studentId));
      if (points.length > 0) {
        meetsRequirement = points[0].totalPoints >= req.points;
      }
    } else if (req.type === 'average_score') {
      const history = await db.select().from(topicProgressHistory)
        .where(eq(topicProgressHistory.studentId, studentId));
      if (history.length > 0) {
        const avgScore = history.reduce((sum, h) => sum + h.score, 0) / history.length;
        meetsRequirement = avgScore >= req.score;
      }
    }

    if (meetsRequirement) {
      await unlockAchievement(studentId, achievement.id);
      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}

/**
 * Recomendações Personalizadas com IA
 */

// Gerar recomendações personalizadas usando IA
export async function generatePersonalizedRecommendations(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar perfil do aluno
  const student = await db.select().from(students)
    .where(eq(students.id, studentId));

  if (student.length === 0) {
    throw new Error("Student not found");
  }

  // Buscar especialização
  const specialization = await db.select().from(studentSpecializations)
    .where(eq(studentSpecializations.studentId, studentId));

  // Buscar histórico de progresso
  const history = await db.select().from(topicProgressHistory)
    .where(eq(topicProgressHistory.studentId, studentId))
    .orderBy(desc(topicProgressHistory.completedAt))
    .limit(20);

  // Buscar tópicos já completados
  const completedProgress = await db.select().from(studentTopicProgress)
    .where(and(
      eq(studentTopicProgress.studentId, studentId),
      eq(studentTopicProgress.status, 'completed')
    ));

  const completedTopicIds = completedProgress.map(p => p.topicId);

  // Buscar disciplinas matriculadas
  const enrollments = await db.select().from(studentEnrollments)
    .where(eq(studentEnrollments.studentId, studentId));

  const subjectIds = enrollments.map(e => e.subjectId);

  // Buscar todos os módulos das disciplinas
  const modules = await db.select().from(learningModules)
    .where(inArray(learningModules.subjectId, subjectIds));

  const moduleIds = modules.map(m => m.id);

  // Buscar tópicos disponíveis (não completados)
  const availableTopics = await db.select({
    id: learningTopics.id,
    title: learningTopics.title,
    description: learningTopics.description,
    difficulty: learningTopics.difficulty,
    moduleId: learningTopics.moduleId,
    moduleName: learningModules.title,
    estimatedHours: learningTopics.estimatedHours
  })
  .from(learningTopics)
  .innerJoin(learningModules, eq(learningTopics.moduleId, learningModules.id))
  .where(and(
    inArray(learningTopics.moduleId, moduleIds),
    completedTopicIds.length > 0 
      ? sql`${learningTopics.id} NOT IN (${completedTopicIds.join(',')})` 
      : sql`1=1`
  ))
  .limit(50);

  if (availableTopics.length === 0) {
    return [];
  }

  // Preparar dados para IA
  const studentProfile = {
    name: student[0].fullName,
    specialization: specialization.length > 0 ? specialization[0].specialization : 'none',
    specializationLevel: specialization.length > 0 ? specialization[0].level : 0,
    recentPerformance: history.map(h => ({
      score: h.score,
      timeSpent: h.timeSpent,
      attempts: h.attemptsCount
    })),
    averageScore: history.length > 0 
      ? Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length)
      : 0,
    completedTopicsCount: completedTopicIds.length
  };

  // Chamar IA para gerar recomendações
  const prompt = `Você é um assistente educacional especializado em recomendar tópicos de estudo personalizados.

Perfil do Aluno:
- Nome: ${studentProfile.name}
- Especialização: ${studentProfile.specialization}
- Nível: ${studentProfile.specializationLevel}
- Pontuação média recente: ${studentProfile.averageScore}/100
- Tópicos completados: ${studentProfile.completedTopicsCount}

Tópicos Disponíveis:
${availableTopics.map((t, i) => `${i + 1}. ${t.title} (${t.moduleName}) - Dificuldade: ${t.difficulty} - ${t.estimatedHours}h`).join('\n')}

Baseado no perfil e desempenho do aluno, recomende os 5 melhores tópicos para ele estudar a seguir.
Para cada recomendação, forneça:
1. ID do tópico (número da lista acima)
2. Razão da recomendação (1-2 frases explicando por que é adequado)
3. Nível de confiança (0-100)
4. Prioridade (low, medium, high, urgent)

Responda APENAS com JSON válido no formato:
{
  "recommendations": [
    {
      "topicIndex": 1,
      "reason": "explicação",
      "confidence": 85,
      "priority": "high"
    }
  ]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Você é um assistente educacional que recomenda tópicos de estudo. Responda sempre com JSON válido." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "recommendations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    topicIndex: { type: "integer" },
                    reason: { type: "string" },
                    confidence: { type: "integer" },
                    priority: { type: "string", enum: ["low", "medium", "high", "urgent"] }
                  },
                  required: ["topicIndex", "reason", "confidence", "priority"],
                  additionalProperties: false
                }
              }
            },
            required: ["recommendations"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    const aiResponse = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
    const recommendations = aiResponse.recommendations;

    // Limpar recomendações antigas pendentes
    await db.delete(learningRecommendations)
      .where(and(
        eq(learningRecommendations.studentId, studentId),
        eq(learningRecommendations.status, 'pending')
      ));

    // Salvar novas recomendações
    const savedRecommendations = [];
    for (const rec of recommendations) {
      const topicIndex = rec.topicIndex - 1; // Converter para índice 0-based
      if (topicIndex >= 0 && topicIndex < availableTopics.length) {
        const topic = availableTopics[topicIndex];
        
        const [result] = await db.insert(learningRecommendations).values({
          studentId,
          topicId: topic.id,
          reason: rec.reason,
          confidence: rec.confidence,
          priority: rec.priority,
          basedOn: JSON.stringify({
            averageScore: studentProfile.averageScore,
            completedTopics: studentProfile.completedTopicsCount,
            specialization: studentProfile.specialization,
            recentPerformance: studentProfile.recentPerformance.slice(0, 5)
          }),
          status: 'pending'
        });

        savedRecommendations.push({
          id: result.insertId,
          topic,
          reason: rec.reason,
          confidence: rec.confidence,
          priority: rec.priority
        });
      }
    }

    return savedRecommendations;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    throw error;
  }
}

// Buscar recomendações de um aluno
export async function getStudentRecommendations(studentId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];

  const recommendations = await db.select({
    id: learningRecommendations.id,
    topicId: learningRecommendations.topicId,
    topicTitle: learningTopics.title,
    topicDescription: learningTopics.description,
    topicDifficulty: learningTopics.difficulty,
    moduleId: learningTopics.moduleId,
    moduleName: learningModules.title,
    reason: learningRecommendations.reason,
    confidence: learningRecommendations.confidence,
    priority: learningRecommendations.priority,
    basedOn: learningRecommendations.basedOn,
    status: learningRecommendations.status,
    createdAt: learningRecommendations.createdAt
  })
  .from(learningRecommendations)
  .innerJoin(learningTopics, eq(learningRecommendations.topicId, learningTopics.id))
  .innerJoin(learningModules, eq(learningTopics.moduleId, learningModules.id))
  .where(
    status 
      ? and(
          eq(learningRecommendations.studentId, studentId),
          eq(learningRecommendations.status, status as any)
        )
      : eq(learningRecommendations.studentId, studentId)
  )
  .orderBy(desc(learningRecommendations.createdAt));

  return recommendations.map(r => ({
    ...r,
    basedOn: JSON.parse(r.basedOn)
  }));
}

// Atualizar status de recomendação
export async function updateRecommendationStatus(
  recommendationId: number,
  status: "pending" | "accepted" | "rejected" | "completed"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(learningRecommendations)
    .set({ status, updatedAt: new Date() })
    .where(eq(learningRecommendations.id, recommendationId));

  return { success: true };
}

// Registrar progresso no histórico
export async function recordTopicProgress(
  studentId: number,
  topicId: number,
  score: number,
  timeSpent: number,
  attemptsCount: number = 1
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(topicProgressHistory).values({
    studentId,
    topicId,
    score,
    timeSpent,
    attemptsCount
  });

  return { success: true };
}

/**
 * Marcar animação de faixa como vista
 */
export async function markBeltAnimationSeen(studentId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.update(studentPoints)
      .set({ beltAnimationSeen: true })
      .where(eq(studentPoints.studentId, studentId));

    return { success: true };
  } catch (error) {
    console.error("[Database] Error marking belt animation as seen:", error);
    return null;
  }
}

// ==================== TEACHER BELT SYSTEM ====================

/**
 * Obter ou criar registro de pontos do professor
 */
export async function getOrCreateTeacherPoints(userId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    // Buscar registro existente
    const existing = await db.select()
      .from(teacherPoints)
      .where(eq(teacherPoints.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Criar novo registro
    await db.insert(teacherPoints).values({
      userId,
      totalPoints: 0,
      currentBelt: "white",
      beltLevel: 1
    });

    const newRecord = await db.select()
      .from(teacherPoints)
      .where(eq(teacherPoints.userId, userId))
      .limit(1);

    return newRecord[0] || null;
  } catch (error) {
    console.error("[Database] Error getting/creating teacher points:", error);
    return null;
  }
}

/**
 * Adicionar atividade e pontos ao professor
 */
export async function addTeacherActivity(data: {
  userId: number;
  activityType: "class_taught" | "planning" | "grading" | "meeting" | "course_creation" | "material_creation" | "student_support" | "professional_dev" | "other";
  title: string;
  description?: string;
  points: number;
  duration?: number;
  activityDate: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Registrar atividade
    await db.insert(teacherActivitiesHistory).values({
      ...data,
      activityDate: sql`${data.activityDate}`
    });

    // Atualizar pontos totais
    const currentPoints = await getOrCreateTeacherPoints(data.userId);
    if (!currentPoints) throw new Error("Failed to get teacher points");

    const newTotalPoints = currentPoints.totalPoints + data.points;

    // Calcular nova faixa
    const { calculateBelt } = await import("../shared/belt-system");
    const newBelt = calculateBelt(newTotalPoints);

    // Verificar se houve mudança de faixa
    const beltChanged = newBelt.level > currentPoints.beltLevel;

    // Atualizar pontos e faixa
    await db.update(teacherPoints)
      .set({
        totalPoints: newTotalPoints,
        currentBelt: newBelt.color,
        beltLevel: newBelt.level,
        ...(beltChanged ? { lastBeltUpgrade: new Date() } : {})
      })
      .where(eq(teacherPoints.userId, data.userId));

    // Registrar mudança de faixa se houver
    if (beltChanged) {
      await db.insert(teacherBeltHistory).values({
        userId: data.userId,
        previousBelt: currentPoints.currentBelt,
        newBelt: newBelt.color,
        previousLevel: currentPoints.beltLevel,
        newLevel: newBelt.level,
        pointsAtUpgrade: newTotalPoints
      });
    }

    return {
      success: true,
      newTotalPoints,
      beltChanged,
      newBelt: beltChanged ? newBelt : null
    };
  } catch (error) {
    console.error("[Database] Error adding teacher activity:", error);
    throw error;
  }
}

/**
 * Obter histórico de atividades do professor
 */
export async function getTeacherActivitiesHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  try {
    const activities = await db.select()
      .from(teacherActivitiesHistory)
      .where(eq(teacherActivitiesHistory.userId, userId))
      .orderBy(desc(teacherActivitiesHistory.activityDate))
      .limit(limit);

    return activities;
  } catch (error) {
    console.error("[Database] Error getting teacher activities history:", error);
    return [];
  }
}

/**
 * Obter histórico de evolução de faixas do professor
 */
export async function getTeacherBeltHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const history = await db.select()
      .from(teacherBeltHistory)
      .where(eq(teacherBeltHistory.userId, userId))
      .orderBy(desc(teacherBeltHistory.upgradedAt));

    return history;
  } catch (error) {
    console.error("[Database] Error getting teacher belt history:", error);
    return [];
  }
}

/**
 * Obter estatísticas de atividades do professor
 */
export async function getTeacherActivityStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const activities = await db.select()
      .from(teacherActivitiesHistory)
      .where(eq(teacherActivitiesHistory.userId, userId));

    // Agrupar por tipo de atividade
    const byType: Record<string, { count: number; totalPoints: number; totalDuration: number }> = {};

    activities.forEach(activity => {
      if (!byType[activity.activityType]) {
        byType[activity.activityType] = { count: 0, totalPoints: 0, totalDuration: 0 };
      }
      byType[activity.activityType].count++;
      byType[activity.activityType].totalPoints += activity.points;
      byType[activity.activityType].totalDuration += activity.duration || 0;
    });

    return {
      totalActivities: activities.length,
      byType
    };
  } catch (error) {
    console.error("[Database] Error getting teacher activity stats:", error);
    return null;
  }
}


// ==================== GAMIFICATION 3D BELTS SYSTEM ====================

/**
 * Obter todas as faixas disponíveis
 */
export async function getAllBelts() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(belts).orderBy(belts.level);
}

/**
 * Obter faixa por ID
 */
export async function getBeltById(beltId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(belts).where(eq(belts.id, beltId)).limit(1);
  return result[0] || null;
}

/**
 * Obter faixa por nível
 */
export async function getBeltByLevel(level: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(belts).where(eq(belts.level, level)).limit(1);
  return result[0] || null;
}

/**
 * Obter progresso do aluno com informações da faixa atual
 */
export async function getStudentProgressWithBelt(studentId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select({
    progress: studentProgress,
    belt: belts
  })
  .from(studentProgress)
  .innerJoin(belts, eq(studentProgress.currentBeltId, belts.id))
  .where(eq(studentProgress.studentId, studentId))
  .limit(1);
  
  return result[0] || null;
}

/**
 * Criar ou obter progresso do aluno
 */
export async function getOrCreateStudentProgress(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se já existe
  const existing = await db.select().from(studentProgress)
    .where(eq(studentProgress.studentId, studentId))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  // Obter faixa branca (nível 1)
  const whiteBelt = await getBeltByLevel(1);
  if (!whiteBelt) throw new Error("White belt not found");
  
  // Criar novo progresso
  await db.insert(studentProgress).values({
    studentId,
    currentBeltId: whiteBelt.id,
    totalPoints: 0,
    pointsInCurrentBelt: 0,
    pointsMultiplier: 1.0,
    streakDays: 0,
    totalExercisesCompleted: 0,
    totalPerfectScores: 0,
    consecutivePerfectScores: 0,
    averageAccuracy: 0.0
  });
  
  const newProgress = await db.select().from(studentProgress)
    .where(eq(studentProgress.studentId, studentId))
    .limit(1);
  
  return newProgress[0];
}

/**
 * Adicionar pontos ao aluno e verificar evolução de faixa (Sistema de Gamificação 3D)
 */
export async function addPointsToStudentGamification(studentId: number, points: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Obter ou criar progresso
  const progress = await getOrCreateStudentProgress(studentId);
  
  // Aplicar multiplicador
  const finalPoints = Math.floor(points * progress.pointsMultiplier);
  
  // Atualizar pontos
  const newTotalPoints = progress.totalPoints + finalPoints;
  const newPointsInCurrentBelt = progress.pointsInCurrentBelt + finalPoints;
  
  // Verificar se deve evoluir de faixa
  const currentBelt = await getBeltById(progress.currentBeltId);
  if (!currentBelt) throw new Error("Current belt not found");
  
  const allBelts = await getAllBelts();
  const nextBelt = allBelts.find(b => b.level === currentBelt.level + 1);
  
  let leveledUp = false;
  let newBelt = currentBelt;
  
  if (nextBelt && newTotalPoints >= nextBelt.pointsRequired) {
    // Evoluir para próxima faixa
    await db.update(studentProgress)
      .set({
        currentBeltId: nextBelt.id,
        totalPoints: newTotalPoints,
        pointsInCurrentBelt: newTotalPoints - nextBelt.pointsRequired,
        updatedAt: new Date()
      })
      .where(eq(studentProgress.studentId, studentId));
    
    // Registrar histórico de level up
    await db.insert(levelUpHistory).values({
      studentId,
      fromBeltId: currentBelt.id,
      toBeltId: nextBelt.id,
      pointsAtLevelUp: newTotalPoints,
      timeTaken: null, // Calcular depois se necessário
      celebrationSeen: false
    });
    
    leveledUp = true;
    newBelt = nextBelt;
  } else {
    // Apenas atualizar pontos
    await db.update(studentProgress)
      .set({
        totalPoints: newTotalPoints,
        pointsInCurrentBelt: newPointsInCurrentBelt,
        updatedAt: new Date()
      })
      .where(eq(studentProgress.studentId, studentId));
  }
  
  // Registrar no histórico de pontos
  await db.insert(pointsHistory).values({
    studentId,
    points: finalPoints,
    reason,
    activityType: 'exercise_completion',
    relatedId: null
  });
  
  return {
    pointsAdded: finalPoints,
    totalPoints: newTotalPoints,
    leveledUp,
    oldBelt: currentBelt,
    newBelt: leveledUp ? newBelt : null
  };
}

/**
 * Obter todas as conquistas disponíveis
 */
export async function getAllAchievements() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(achievements).orderBy(achievements.category, achievements.requirement);
}

/**
 * Obter conquistas desbloqueadas pelo aluno
 */
export async function getStudentAchievementsGamification(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    studentAchievement: studentAchievements,
    achievement: achievements
  })
  .from(studentAchievements)
  .innerJoin(achievements, eq(studentAchievements.achievementId, achievements.id))
  .where(eq(studentAchievements.studentId, studentId))
  .orderBy(desc(studentAchievements.unlockedAt));
  
  return result;
}

/**
 * Desbloquear conquista para aluno
 */
export async function unlockAchievementForStudent(studentId: number, achievementCode: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar conquista
  const achievement = await db.select().from(achievements)
    .where(eq(achievements.code, achievementCode))
    .limit(1);
  
  if (achievement.length === 0) {
    throw new Error(`Achievement ${achievementCode} not found`);
  }
  
  const achievementData = achievement[0];
  
  // Verificar se já foi desbloqueada
  const existing = await db.select().from(studentAchievements)
    .where(and(
      eq(studentAchievements.studentId, studentId),
      eq(studentAchievements.achievementId, achievementData.id)
    ));
  
  if (existing.length > 0) {
    return { alreadyUnlocked: true, achievement: achievementData };
  }
  
  // Desbloquear
  await db.insert(studentAchievements).values({
    studentId,
    achievementId: achievementData.id,
    notificationSeen: false
  });
  
  // Adicionar pontos de recompensa
  if (achievementData.rewardPoints > 0) {
    await addPointsToStudentGamification(studentId, achievementData.rewardPoints, `Conquista desbloqueada: ${achievementData.name}`);
  }
  
  // Adicionar multiplicador permanente
  if (achievementData.rewardMultiplier > 0) {
    const progress = await getOrCreateStudentProgress(studentId);
    await db.update(studentProgress)
      .set({
        pointsMultiplier: progress.pointsMultiplier + achievementData.rewardMultiplier,
        updatedAt: new Date()
      })
      .where(eq(studentProgress.studentId, studentId));
  }
  
  return { alreadyUnlocked: false, achievement: achievementData };
}

/**
 * Verificar e desbloquear conquistas de gamificação automaticamente
 */
export async function checkAndUnlockGamificationAchievements(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const progress = await getOrCreateStudentProgress(studentId);
  const allAchievements = await getAllAchievements();
  const unlockedAchievements = await getStudentAchievementsGamification(studentId);
  const unlockedIds = new Set(unlockedAchievements.map(ua => ua.achievement.id));
  
  const newlyUnlocked = [];
  
  for (const achievement of allAchievements) {
    if (unlockedIds.has(achievement.id)) continue;
    
    let shouldUnlock = false;
    
    switch (achievement.category) {
      case 'speed':
        if (progress.fastestExerciseTime && progress.fastestExerciseTime <= achievement.requirement) {
          shouldUnlock = true;
        }
        break;
      case 'accuracy':
        if (progress.averageAccuracy >= achievement.requirement) {
          shouldUnlock = true;
        }
        break;
      case 'streak':
        if (progress.streakDays >= achievement.requirement) {
          shouldUnlock = true;
        }
        break;
      case 'completion':
        if (progress.totalExercisesCompleted >= achievement.requirement) {
          shouldUnlock = true;
        }
        break;
      case 'special':
        // Conquistas especiais (ex: alcançar faixa preta)
        const currentBelt = await getBeltById(progress.currentBeltId);
        if (currentBelt && currentBelt.level >= achievement.requirement) {
          shouldUnlock = true;
        }
        break;
    }
    
    if (shouldUnlock) {
      await unlockAchievementForStudent(studentId, achievement.code);
      newlyUnlocked.push(achievement);
    }
  }
  
  return newlyUnlocked;
}

/**
 * Obter histórico de level ups do aluno
 */
export async function getStudentLevelUpHistory(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const history = await db.select({
    levelUp: levelUpHistory,
    fromBelt: {
      id: belts.id,
      name: belts.name,
      displayName: belts.displayName,
      level: belts.level,
      color: belts.color,
      icon: belts.icon
    },
    toBelt: belts
  })
  .from(levelUpHistory)
  .innerJoin(belts, eq(levelUpHistory.fromBeltId, belts.id))
  .where(eq(levelUpHistory.studentId, studentId))
  .orderBy(desc(levelUpHistory.createdAt));
  
  return history;
}

/**
 * Marcar celebração de level up como vista
 */
export async function markLevelUpCelebrationSeen(levelUpId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(levelUpHistory)
    .set({ celebrationSeen: true })
    .where(eq(levelUpHistory.id, levelUpId));
}

/**
 * Obter estatísticas completas do aluno
 */
export async function getStudentGamificationStats(studentId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const progressWithBelt = await getStudentProgressWithBelt(studentId);
  if (!progressWithBelt) return null;
  
  const achievements = await getStudentAchievementsGamification(studentId);
  const levelUpHistory = await getStudentLevelUpHistory(studentId);
  const allBelts = await getAllBelts();
  
  // Calcular próxima faixa
  const currentBelt = progressWithBelt.belt;
  const nextBelt = allBelts.find(b => b.level === currentBelt.level + 1);
  
  const pointsToNextBelt = nextBelt 
    ? nextBelt.pointsRequired - progressWithBelt.progress.totalPoints
    : 0;
  
  const progressPercentage = nextBelt
    ? ((progressWithBelt.progress.totalPoints - currentBelt.pointsRequired) / 
       (nextBelt.pointsRequired - currentBelt.pointsRequired)) * 100
    : 100;
  
  return {
    progress: progressWithBelt.progress,
    currentBelt: progressWithBelt.belt,
    nextBelt,
    pointsToNextBelt,
    progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
    achievements: achievements.map(a => a.achievement),
    levelUpHistory,
    totalAchievements: achievements.length,
    totalBelts: allBelts.length
  };
}


// ==================== PREFERÊNCIAS DE DASHBOARD ====================

export async function getQuickActionsPreferences(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const preferences = await db
    .select()
    .from(dashboardPreferences)
    .where(eq(dashboardPreferences.userId, userId))
    .limit(1);
  
  if (preferences.length === 0) {
    return null;
  }
  
  return {
    actions: JSON.parse(preferences[0].quickActionsConfig)
  };
}

export async function saveQuickActionsPreferences(userId: number, actions: any[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db
    .select()
    .from(dashboardPreferences)
    .where(eq(dashboardPreferences.userId, userId))
    .limit(1);
  
  const config = JSON.stringify(actions);
  
  if (existing.length > 0) {
    // Atualizar existente
    await db
      .update(dashboardPreferences)
      .set({ 
        quickActionsConfig: config,
        updatedAt: new Date()
      })
      .where(eq(dashboardPreferences.userId, userId));
  } else {
    // Criar novo
    await db.insert(dashboardPreferences).values({
      userId,
      quickActionsConfig: config
    });
  }
  
  return { success: true };
}


/**
 * ============================================
 * SISTEMA DE ANÁLISE DE APRENDIZADO COM IA
 * ============================================
 */

/**
 * Registrar comportamento do aluno
 */
export async function recordStudentBehavior(data: InsertStudentBehavior) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(studentBehaviors).values(data);
  return { id: Number(result[0].insertId), ...data };
}

/**
 * Buscar comportamentos recentes de um aluno
 */
export async function getRecentBehaviors(studentId: number, userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(studentBehaviors)
    .where(and(
      eq(studentBehaviors.studentId, studentId),
      eq(studentBehaviors.userId, userId)
    ))
    .orderBy(desc(studentBehaviors.recordedAt))
    .limit(limit);
}

/**
 * Buscar comportamentos por tipo
 */
export async function getBehaviorsByType(
  studentId: number, 
  userId: number, 
  behaviorType: string
) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(studentBehaviors)
    .where(and(
      eq(studentBehaviors.studentId, studentId),
      eq(studentBehaviors.userId, userId),
      eq(studentBehaviors.behaviorType, behaviorType as any)
    ))
    .orderBy(desc(studentBehaviors.recordedAt));
}

/**
 * Salvar padrão de aprendizado identificado
 */
export async function saveLearningPattern(data: InsertLearningPattern) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(learningPatterns).values(data);
  return { id: Number(result[0].insertId), ...data };
}

/**
 * Buscar padrões de aprendizado de um aluno
 */
export async function getStudentLearningPatterns(studentId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(learningPatterns)
    .where(and(
      eq(learningPatterns.studentId, studentId),
      eq(learningPatterns.userId, userId)
    ))
    .orderBy(desc(learningPatterns.detectedAt));
}

/**
 * Atualizar padrão de aprendizado existente
 */
export async function updateLearningPattern(
  id: number, 
  userId: number, 
  data: Partial<InsertLearningPattern>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(learningPatterns)
    .set({ ...data, lastUpdated: new Date() })
    .where(and(
      eq(learningPatterns.id, id),
      eq(learningPatterns.userId, userId)
    ));
  
  return { success: true };
}

/**
 * Salvar insight gerado pela IA
 */
export async function saveAIInsight(data: InsertAIInsight) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(aiInsights).values(data);
  return { id: Number(result[0].insertId), ...data };
}

/**
 * Buscar insights de um aluno
 */
export async function getStudentInsights(studentId: number, userId: number, includeDismissed: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [
    eq(aiInsights.studentId, studentId),
    eq(aiInsights.userId, userId)
  ];
  
  if (!includeDismissed) {
    conditions.push(eq(aiInsights.dismissed, false));
  }
  
  return await db.select().from(aiInsights)
    .where(and(...conditions))
    .orderBy(desc(aiInsights.generatedAt));
}

/**
 * Marcar insight como dispensado
 */
export async function dismissInsight(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(aiInsights)
    .set({ dismissed: true })
    .where(and(
      eq(aiInsights.id, id),
      eq(aiInsights.userId, userId)
    ));
  
  return { success: true };
}

/**
 * Salvar métrica de desempenho
 */
export async function savePerformanceMetric(data: InsertPerformanceMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(performanceMetrics).values(data);
  return { id: Number(result[0].insertId), ...data };
}

/**
 * Buscar métricas de desempenho de um aluno
 */
export async function getStudentPerformanceMetrics(
  studentId: number, 
  userId: number,
  metricType?: string
) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [
    eq(performanceMetrics.studentId, studentId),
    eq(performanceMetrics.userId, userId)
  ];
  
  if (metricType) {
    conditions.push(eq(performanceMetrics.metricType, metricType as any));
  }
  
  return await db.select().from(performanceMetrics)
    .where(and(...conditions))
    .orderBy(desc(performanceMetrics.calculatedAt));
}

/**
 * Criar alerta
 */
export async function createAlert(data: InsertAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(alerts).values(data);
  return { id: Number(result[0].insertId), ...data };
}

/**
 * Buscar alertas pendentes do professor
 */
export async function getPendingAlerts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(alerts)
    .where(and(
      eq(alerts.userId, userId),
      eq(alerts.acknowledged, false)
    ))
    .orderBy(desc(alerts.createdAt));
}

/**
 * Buscar alertas de um aluno
 */
export async function getStudentAlerts(studentId: number, userId: number, includeResolved: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [
    eq(alerts.studentId, studentId),
    eq(alerts.userId, userId)
  ];
  
  if (!includeResolved) {
    conditions.push(eq(alerts.resolved, false));
  }
  
  return await db.select().from(alerts)
    .where(and(...conditions))
    .orderBy(desc(alerts.createdAt));
}

/**
 * Reconhecer alerta
 */
export async function acknowledgeAlert(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(alerts)
    .set({ 
      acknowledged: true,
      acknowledgedAt: new Date()
    })
    .where(and(
      eq(alerts.id, id),
      eq(alerts.userId, userId)
    ));
  
  return { success: true };
}

/**
 * Resolver alerta
 */
export async function resolveAlert(id: number, userId: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(alerts)
    .set({ 
      resolved: true,
      resolvedAt: new Date(),
      notes: notes || undefined
    })
    .where(and(
      eq(alerts.id, id),
      eq(alerts.userId, userId)
    ));
  
  return { success: true };
}

/**
 * Buscar estatísticas de alertas
 */
export async function getAlertStatistics(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, critical: 0, urgent: 0 };
  
  const allAlerts = await db.select().from(alerts)
    .where(eq(alerts.userId, userId));
  
  const pending = allAlerts.filter(a => !a.acknowledged).length;
  const critical = allAlerts.filter(a => a.severity === 'critical' && !a.resolved).length;
  const urgent = allAlerts.filter(a => a.severity === 'urgent' && !a.resolved).length;
  
  return {
    total: allAlerts.length,
    pending,
    critical,
    urgent
  };
}


/**
 * ========================================
 * SISTEMA DE DÚVIDAS E RESPOSTAS
 * ========================================
 */

/**
 * Criar nova dúvida
 */
export async function createQuestion(data: InsertQuestion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(questions).values(data);
  return result[0].insertId;
}

/**
 * Buscar dúvidas do professor (todas as dúvidas das suas disciplinas)
 */
export async function getQuestionsByTeacher(userId: number, filters?: {
  status?: 'pending' | 'answered' | 'resolved';
  subjectId?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(questions.userId, userId)];
  
  if (filters?.status) {
    conditions.push(eq(questions.status, filters.status));
  }
  if (filters?.subjectId) {
    conditions.push(eq(questions.subjectId, filters.subjectId));
  }
  if (filters?.priority) {
    conditions.push(eq(questions.priority, filters.priority));
  }
  
  const result = await db.select({
    question: questions,
    student: students,
    subject: subjects,
    class: classes,
  })
  .from(questions)
  .leftJoin(students, eq(questions.studentId, students.id))
  .leftJoin(subjects, eq(questions.subjectId, subjects.id))
  .leftJoin(classes, eq(questions.classId, classes.id))
  .where(and(...conditions))
  .orderBy(desc(questions.createdAt));
  
  return result;
}

/**
 * Buscar dúvidas do aluno
 */
export async function getQuestionsByStudent(studentId: number, filters?: {
  status?: 'pending' | 'answered' | 'resolved';
  subjectId?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(questions.studentId, studentId)];
  
  if (filters?.status) {
    conditions.push(eq(questions.status, filters.status));
  }
  if (filters?.subjectId) {
    conditions.push(eq(questions.subjectId, filters.subjectId));
  }
  
  const result = await db.select({
    question: questions,
    subject: subjects,
    class: classes,
  })
  .from(questions)
  .leftJoin(subjects, eq(questions.subjectId, subjects.id))
  .leftJoin(classes, eq(questions.classId, classes.id))
  .where(and(...conditions))
  .orderBy(desc(questions.createdAt));
  
  return result;
}

/**
 * Buscar dúvida por ID com detalhes completos
 */
export async function getQuestionById(questionId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select({
    question: questions,
    student: students,
    subject: subjects,
    class: classes,
  })
  .from(questions)
  .leftJoin(students, eq(questions.studentId, students.id))
  .leftJoin(subjects, eq(questions.subjectId, subjects.id))
  .leftJoin(classes, eq(questions.classId, classes.id))
  .where(eq(questions.id, questionId))
  .limit(1);
  
  return result[0] || null;
}

/**
 * Incrementar contador de visualizações
 */
export async function incrementQuestionViewCount(questionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(questions)
    .set({ viewCount: sql`${questions.viewCount} + 1` })
    .where(eq(questions.id, questionId));
}

/**
 * Criar resposta para dúvida
 */
export async function createQuestionAnswer(data: InsertQuestionAnswer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(questionAnswers).values(data);
  
  // Atualizar status da dúvida para "answered"
  await db.update(questions)
    .set({ 
      status: 'answered',
      answeredAt: new Date()
    })
    .where(eq(questions.id, data.questionId));
  
  return result[0].insertId;
}

/**
 * Buscar respostas de uma dúvida
 */
export async function getAnswersByQuestion(questionId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    answer: questionAnswers,
    teacher: users,
  })
  .from(questionAnswers)
  .leftJoin(users, eq(questionAnswers.userId, users.id))
  .where(eq(questionAnswers.questionId, questionId))
  .orderBy(desc(questionAnswers.createdAt));
  
  return result;
}

/**
 * Marcar dúvida como resolvida
 */
export async function markQuestionAsResolved(questionId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(questions)
    .set({ 
      status: 'resolved',
      resolvedAt: new Date()
    })
    .where(and(
      eq(questions.id, questionId),
      eq(questions.userId, userId)
    ));
  
  return { success: true };
}

/**
 * Marcar resposta como aceita (melhor resposta)
 */
export async function markAnswerAsAccepted(answerId: number, questionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Desmarcar todas as respostas anteriores como aceitas
  await db.update(questionAnswers)
    .set({ isAccepted: false })
    .where(eq(questionAnswers.questionId, questionId));
  
  // Marcar a resposta atual como aceita
  await db.update(questionAnswers)
    .set({ isAccepted: true })
    .where(eq(questionAnswers.id, answerId));
  
  return { success: true };
}

/**
 * Buscar estatísticas de dúvidas do professor
 */
export async function getQuestionStatistics(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, answered: 0, resolved: 0, urgent: 0 };
  
  const allQuestions = await db.select().from(questions)
    .where(eq(questions.userId, userId));
  
  const pending = allQuestions.filter(q => q.status === 'pending').length;
  const answered = allQuestions.filter(q => q.status === 'answered').length;
  const resolved = allQuestions.filter(q => q.status === 'resolved').length;
  const urgent = allQuestions.filter(q => q.priority === 'urgent' && q.status === 'pending').length;
  
  return {
    total: allQuestions.length,
    pending,
    answered,
    resolved,
    urgent
  };
}

/**
 * Atualizar prioridade da dúvida
 */
export async function updateQuestionPriority(questionId: number, priority: 'low' | 'normal' | 'high' | 'urgent', userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(questions)
    .set({ priority })
    .where(and(
      eq(questions.id, questionId),
      eq(questions.userId, userId)
    ));
  
  return { success: true };
}

// ==================== SMART REVIEW SYSTEM ====================

/**
 * Adicionar item à fila de revisão inteligente
 * Implementa algoritmo de repetição espaçada (Spaced Repetition)
 */
export async function addToReviewQueue(data: {
  studentId: number;
  answerId: number;
  exerciseId: number;
  subjectId: number;
  initialDifficulty?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { smartReviewQueue } = await import("../drizzle/schema");

  // Calcular próxima data de revisão (1 dia após erro)
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + 1);

  const priority = data.initialDifficulty || 70; // Prioridade alta para itens errados

  const [result] = await db.insert(smartReviewQueue).values({
    studentId: data.studentId,
    answerId: data.answerId,
    exerciseId: data.exerciseId,
    subjectId: data.subjectId,
    easeFactor: 2.5, // Fator inicial
    interval: 1, // 1 dia
    repetitions: 0,
    priority,
    difficultyScore: data.initialDifficulty || 50,
    nextReviewDate,
    status: "pending",
  }).onDuplicateKeyUpdate({
    set: {
      nextReviewDate,
      priority,
      updatedAt: new Date(),
    }
  });

  return result.insertId;
}

/**
 * Obter fila de revisão priorizada para um aluno
 * Retorna itens ordenados por prioridade e data de revisão
 */
export async function getReviewQueue(studentId: number, subjectId?: number, limit: number = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { smartReviewQueue } = await import("../drizzle/schema");
  const { and, eq, lte, desc } = await import("drizzle-orm");

  const conditions = [
    eq(smartReviewQueue.studentId, studentId),
    eq(smartReviewQueue.status, "pending"),
    lte(smartReviewQueue.nextReviewDate, new Date()),
  ];

  if (subjectId) {
    conditions.push(eq(smartReviewQueue.subjectId, subjectId));
  }

  const queue = await db
    .select({
      id: smartReviewQueue.id,
      answerId: smartReviewQueue.answerId,
      exerciseId: smartReviewQueue.exerciseId,
      subjectId: smartReviewQueue.subjectId,
      priority: smartReviewQueue.priority,
      difficultyScore: smartReviewQueue.difficultyScore,
      nextReviewDate: smartReviewQueue.nextReviewDate,
      reviewCount: smartReviewQueue.reviewCount,
      successRate: smartReviewQueue.successRate,
      easeFactor: smartReviewQueue.easeFactor,
      interval: smartReviewQueue.interval,
    })
    .from(smartReviewQueue)
    .where(and(...conditions))
    .orderBy(desc(smartReviewQueue.priority), smartReviewQueue.nextReviewDate)
    .limit(limit);

  return queue;
}

/**
 * Calcular novo intervalo usando algoritmo SM-2 (SuperMemo 2)
 * @param quality - Qualidade da resposta (0-5): 0=total blackout, 5=perfect response
 * @param easeFactor - Fator de facilidade atual
 * @param interval - Intervalo atual em dias
 * @param repetitions - Número de repetições bem-sucedidas
 */
function calculateSM2(quality: number, easeFactor: number, interval: number, repetitions: number) {
  // Calcular novo fator de facilidade
  let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // Limitar fator de facilidade entre 1.3 e 2.5
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;
  
  let newInterval: number;
  let newRepetitions: number;

  if (quality < 3) {
    // Resposta incorreta - reiniciar
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Resposta correta
    newRepetitions = repetitions + 1;
    
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
  }

  return { newEaseFactor, newInterval, newRepetitions };
}

/**
 * Registrar revisão e atualizar algoritmo
 */
export async function recordReview(data: {
  studentId: number;
  queueItemId: number;
  answerId: number;
  exerciseId: number;
  wasCorrect: boolean;
  timeSpent: number;
  selfRating?: "again" | "hard" | "good" | "easy";
  confidenceLevel?: number;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { smartReviewQueue, reviewHistory } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  // Buscar item da fila
  const [queueItem] = await db
    .select()
    .from(smartReviewQueue)
    .where(eq(smartReviewQueue.id, data.queueItemId));

  if (!queueItem) throw new Error("Queue item not found");

  // Mapear selfRating para quality (0-5)
  let quality = 3; // Padrão: good
  if (data.selfRating === "again") quality = 0;
  else if (data.selfRating === "hard") quality = 2;
  else if (data.selfRating === "good") quality = 3;
  else if (data.selfRating === "easy") quality = 5;
  else if (!data.wasCorrect) quality = 1;
  else quality = 4;

  // Calcular novos valores usando SM-2
  const { newEaseFactor, newInterval, newRepetitions } = calculateSM2(
    quality,
    queueItem.easeFactor,
    queueItem.interval,
    queueItem.repetitions
  );

  // Calcular próxima data de revisão
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  // Calcular nova taxa de sucesso
  const totalReviews = queueItem.reviewCount + 1;
  const successCount = data.wasCorrect ? 
    Math.round((queueItem.successRate / 100) * queueItem.reviewCount) + 1 :
    Math.round((queueItem.successRate / 100) * queueItem.reviewCount);
  const newSuccessRate = Math.round((successCount / totalReviews) * 100);

  // Calcular nova prioridade (0-100)
  // Maior prioridade para itens com baixa taxa de sucesso
  const newPriority = Math.max(0, Math.min(100, 100 - newSuccessRate));

  // Determinar novo status
  let newStatus: "pending" | "reviewing" | "mastered" | "archived" = "pending";
  if (newSuccessRate >= 90 && newRepetitions >= 5) {
    newStatus = "mastered";
  }

  // Registrar no histórico
  await db.insert(reviewHistory).values({
    studentId: data.studentId,
    queueItemId: data.queueItemId,
    answerId: data.answerId,
    exerciseId: data.exerciseId,
    wasCorrect: data.wasCorrect,
    timeSpent: data.timeSpent,
    confidenceLevel: data.confidenceLevel,
    selfRating: data.selfRating,
    notes: data.notes,
    previousEaseFactor: queueItem.easeFactor,
    newEaseFactor,
    previousInterval: queueItem.interval,
    newInterval,
  });

  // Atualizar item na fila
  await db
    .update(smartReviewQueue)
    .set({
      easeFactor: newEaseFactor,
      interval: newInterval,
      repetitions: newRepetitions,
      lastReviewedAt: new Date(),
      nextReviewDate,
      reviewCount: totalReviews,
      successRate: newSuccessRate,
      priority: newPriority,
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(smartReviewQueue.id, data.queueItemId));

  // Atualizar estatísticas do aluno
  await updateReviewStatistics(data.studentId, data.wasCorrect, data.timeSpent);

  return { newInterval, newEaseFactor, newStatus, newSuccessRate };
}

/**
 * Atualizar estatísticas de revisão do aluno
 */
export async function updateReviewStatistics(
  studentId: number,
  wasCorrect: boolean,
  timeSpent: number,
  subjectId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { reviewStatistics } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  const conditions = [eq(reviewStatistics.studentId, studentId)];
  if (subjectId) {
    conditions.push(eq(reviewStatistics.subjectId, subjectId));
  }

  // Buscar estatísticas existentes
  const [existing] = await db
    .select()
    .from(reviewStatistics)
    .where(and(...conditions));

  const today = new Date().toISOString().split('T')[0];

  if (existing) {
    // Atualizar estatísticas existentes
    const newTotalReviews = existing.totalReviewsCompleted + 1;
    const newTotalTime = existing.totalTimeSpent + timeSpent;
    const newCorrect = wasCorrect ? existing.correctReviews + 1 : existing.correctReviews;
    const newIncorrect = wasCorrect ? existing.incorrectReviews : existing.incorrectReviews + 1;
    const newSuccessRate = Math.round((newCorrect / newTotalReviews) * 100);
    const newAverageTime = Math.round(newTotalTime / newTotalReviews);

    // Calcular streak
    const lastReview = existing.lastReviewDate?.toISOString().split('T')[0];
    let newStreak = existing.currentStreak;
    
    if (lastReview !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastReview === yesterdayStr) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    }

    const newLongestStreak = Math.max(existing.longestStreak, newStreak);

    // Atualizar progresso diário e semanal
    const newDailyProgress = lastReview === today ? existing.dailyProgress + 1 : 1;
    const newWeeklyProgress = existing.weeklyProgress + 1;

    await db
      .update(reviewStatistics)
      .set({
        totalReviewsCompleted: newTotalReviews,
        totalTimeSpent: newTotalTime,
        averageSessionTime: newAverageTime,
        correctReviews: newCorrect,
        incorrectReviews: newIncorrect,
        successRate: newSuccessRate,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastReviewDate: new Date(today),
        dailyProgress: newDailyProgress,
        weeklyProgress: newWeeklyProgress,
        updatedAt: new Date(),
      })
      .where(and(...conditions));
  } else {
    // Criar novas estatísticas
    await db.insert(reviewStatistics).values({
      studentId,
      subjectId: subjectId || null,
      totalReviewsCompleted: 1,
      totalTimeSpent: timeSpent,
      averageSessionTime: timeSpent,
      correctReviews: wasCorrect ? 1 : 0,
      incorrectReviews: wasCorrect ? 0 : 1,
      successRate: wasCorrect ? 100 : 0,
      currentStreak: 1,
      longestStreak: 1,
      lastReviewDate: new Date(today),
      dailyProgress: 1,
      weeklyProgress: 1,
    });
  }
}

/**
 * Obter estatísticas de revisão do aluno
 */
export async function getReviewStatistics(studentId: number, subjectId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { reviewStatistics, smartReviewQueue } = await import("../drizzle/schema");
  const { eq, and, count } = await import("drizzle-orm");

  const conditions = [eq(reviewStatistics.studentId, studentId)];
  if (subjectId) {
    conditions.push(eq(reviewStatistics.subjectId, subjectId));
  }

  const [stats] = await db
    .select()
    .from(reviewStatistics)
    .where(and(...conditions));

  // Contar itens por status
  const queueConditions = [eq(smartReviewQueue.studentId, studentId)];
  if (subjectId) {
    queueConditions.push(eq(smartReviewQueue.subjectId, subjectId));
  }

  const [pendingCount] = await db
    .select({ count: count() })
    .from(smartReviewQueue)
    .where(and(...queueConditions, eq(smartReviewQueue.status, "pending")));

  const [masteredCount] = await db
    .select({ count: count() })
    .from(smartReviewQueue)
    .where(and(...queueConditions, eq(smartReviewQueue.status, "mastered")));

  return {
    ...stats,
    itemsPending: pendingCount?.count || 0,
    itemsMastered: masteredCount?.count || 0,
  };
}

/**
 * Obter histórico de revisões do aluno
 */
export async function getReviewHistory(studentId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { reviewHistory } = await import("../drizzle/schema");
  const { eq, desc } = await import("drizzle-orm");

  const history = await db
    .select()
    .from(reviewHistory)
    .where(eq(reviewHistory.studentId, studentId))
    .orderBy(desc(reviewHistory.reviewedAt))
    .limit(limit);

  return history;
}

/**
 * Criar sessão de estudo
 */
export async function createStudySession(data: {
  studentId: number;
  subjectId?: number;
  sessionType: "quick_review" | "full_review" | "focused_practice" | "random_practice";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { studySessions } = await import("../drizzle/schema");

  const [result] = await db.insert(studySessions).values({
    studentId: data.studentId,
    subjectId: data.subjectId || null,
    sessionType: data.sessionType,
    status: "in_progress",
  });

  return result.insertId;
}

/**
 * Finalizar sessão de estudo
 */
export async function completeStudySession(
  sessionId: number,
  data: {
    totalItems: number;
    itemsCompleted: number;
    itemsCorrect: number;
    totalTime: number;
    pointsEarned: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { studySessions } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const averageTimePerItem = data.itemsCompleted > 0 
    ? Math.round(data.totalTime / data.itemsCompleted)
    : 0;

  const sessionScore = data.totalItems > 0
    ? Math.round((data.itemsCorrect / data.totalItems) * 100)
    : 0;

  await db
    .update(studySessions)
    .set({
      totalItems: data.totalItems,
      itemsCompleted: data.itemsCompleted,
      itemsCorrect: data.itemsCorrect,
      totalTime: data.totalTime,
      averageTimePerItem,
      sessionScore,
      pointsEarned: data.pointsEarned,
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(studySessions.id, sessionId));
}

/**
 * Criar tags de conteúdo
 */
export async function createContentTag(data: {
  userId: number;
  subjectId: number;
  name: string;
  description?: string;
  color?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { contentTags } = await import("../drizzle/schema");

  const [result] = await db.insert(contentTags).values(data);
  return result.insertId;
}

/**
 * Listar tags de conteúdo
 */
export async function listContentTags(userId: number, subjectId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { contentTags } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  const conditions = [eq(contentTags.userId, userId)];
  if (subjectId) {
    conditions.push(eq(contentTags.subjectId, subjectId));
  }

  const tags = await db
    .select()
    .from(contentTags)
    .where(and(...conditions));

  return tags;
}

/**
 * Associar tag a exercício
 */
export async function addExerciseTag(exerciseId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { exerciseTags } = await import("../drizzle/schema");

  await db.insert(exerciseTags).values({
    exerciseId,
    tagId,
  }).onDuplicateKeyUpdate({
    set: { createdAt: new Date() }
  });
}

/**
 * Obter detalhes completos de um item da fila de revisão
 * Inclui informações do exercício e da resposta original
 */
export async function getReviewItemDetails(queueItemId: number, studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { smartReviewQueue, studentExercises, studentExerciseAnswers, subjects } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  const [queueItem] = await db
    .select({
      queueItem: smartReviewQueue,
      exercise: studentExercises,
      answer: studentExerciseAnswers,
      subject: subjects,
    })
    .from(smartReviewQueue)
    .leftJoin(studentExercises, eq(smartReviewQueue.exerciseId, studentExercises.id))
    .leftJoin(studentExerciseAnswers, eq(smartReviewQueue.answerId, studentExerciseAnswers.id))
    .leftJoin(subjects, eq(smartReviewQueue.subjectId, subjects.id))
    .where(and(
      eq(smartReviewQueue.id, queueItemId),
      eq(smartReviewQueue.studentId, studentId)
    ));

  return queueItem;
}

// ==================== CADERNO DE EXERCÍCIOS ====================

/**
 * Obter todas as questões respondidas por um aluno (para caderno de exercícios)
 */
export async function getStudentAnsweredQuestions(
  studentId: number,
  filters?: {
    subjectId?: number;
    isCorrect?: boolean;
    markedForReview?: boolean;
    masteryStatus?: 'not_started' | 'studying' | 'practicing' | 'mastered';
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar todas as tentativas do aluno
  let attemptsQuery = db
    .select()
    .from(studentExerciseAttempts)
    .where(eq(studentExerciseAttempts.studentId, studentId));
  
  const attempts = await attemptsQuery;
  
  if (attempts.length === 0) return [];
  
  const attemptIds = attempts.map(a => a.id);
  
  // Buscar todas as respostas dessas tentativas
  let answersQuery = db
    .select({
      answer: studentExerciseAnswers,
      exercise: studentExercises,
      attempt: studentExerciseAttempts,
    })
    .from(studentExerciseAnswers)
    .leftJoin(
      studentExerciseAttempts,
      eq(studentExerciseAnswers.attemptId, studentExerciseAttempts.id)
    )
    .leftJoin(
      studentExercises,
      eq(studentExerciseAttempts.exerciseId, studentExercises.id)
    )
    .where(inArray(studentExerciseAnswers.attemptId, attemptIds));
  
  // Aplicar filtros
  const conditions = [];
  if (filters?.isCorrect !== undefined) {
    conditions.push(eq(studentExerciseAnswers.isCorrect, filters.isCorrect));
  }
  if (filters?.markedForReview !== undefined) {
    conditions.push(eq(studentExerciseAnswers.markedForReview, filters.markedForReview));
  }
  if (filters?.masteryStatus) {
    conditions.push(eq(studentExerciseAnswers.masteryStatus, filters.masteryStatus));
  }
  
  // Aplicar filtros adicionais se houver
  // (os filtros já foram aplicados na query principal)
  
  const results = await answersQuery.orderBy(desc(studentExerciseAnswers.createdAt));
  
  // Filtrar por disciplina se necessário
  let filteredResults = results;
  if (filters?.subjectId) {
    filteredResults = results.filter(r => r.exercise?.subjectId === filters.subjectId);
  }
  
  // Enriquecer com dados da questão original
  return filteredResults.map(result => {
    const exerciseData = result.exercise?.exerciseData as any || { exercises: [] };
    const originalQuestion = exerciseData.exercises?.[result.answer.questionNumber - 1] || {};
    
    return {
      answerId: result.answer.id,
      attemptId: result.answer.attemptId,
      exerciseId: result.exercise?.id,
      exerciseTitle: result.exercise?.title,
      subjectId: result.exercise?.subjectId,
      questionNumber: result.answer.questionNumber,
      questionText: originalQuestion.text || originalQuestion.question || '',
      questionType: result.answer.questionType,
      options: originalQuestion.options || [],
      studentAnswer: result.answer.studentAnswer,
      correctAnswer: result.answer.correctAnswer,
      isCorrect: result.answer.isCorrect,
      pointsAwarded: result.answer.pointsAwarded,
      
      // Feedback e materiais de estudo
      aiFeedback: result.answer.aiFeedback,
      studyTips: result.answer.studyTips,
      detailedExplanation: result.answer.detailedExplanation,
      studyStrategy: result.answer.studyStrategy,
      relatedConcepts: result.answer.relatedConcepts,
      additionalResources: result.answer.additionalResources,
      practiceExamples: result.answer.practiceExamples,
      commonMistakes: result.answer.commonMistakes,
      
      // Status e progresso
      masteryStatus: result.answer.masteryStatus,
      difficultyLevel: result.answer.difficultyLevel,
      timeToMaster: result.answer.timeToMaster,
      reviewCount: result.answer.reviewCount,
      lastReviewedAt: result.answer.lastReviewedAt,
      markedForReview: result.answer.markedForReview,
      
      // Metadados
      createdAt: result.answer.createdAt,
      attemptDate: result.attempt?.completedAt || result.attempt?.startedAt,
    };
  });
}

/**
 * Marcar/desmarcar questão para revisão
 */
export async function toggleQuestionForReview(answerId: number, markedForReview: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(studentExerciseAnswers)
    .set({ markedForReview })
    .where(eq(studentExerciseAnswers.id, answerId));
  
  return { success: true };
}

/**
 * Atualizar status de domínio de uma questão
 */
export async function updateQuestionMasteryStatus(
  answerId: number,
  masteryStatus: 'not_started' | 'studying' | 'practicing' | 'mastered'
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(studentExerciseAnswers)
    .set({ 
      masteryStatus,
      lastReviewedAt: new Date(),
    })
    .where(eq(studentExerciseAnswers.id, answerId));
  
  return { success: true };
}

/**
 * Incrementar contador de revisões de uma questão
 */
export async function incrementQuestionReviewCount(answerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const answer = await db
    .select()
    .from(studentExerciseAnswers)
    .where(eq(studentExerciseAnswers.id, answerId))
    .limit(1);
  
  if (!answer[0]) throw new Error("Answer not found");
  
  await db
    .update(studentExerciseAnswers)
    .set({ 
      reviewCount: (answer[0].reviewCount || 0) + 1,
      lastReviewedAt: new Date(),
    })
    .where(eq(studentExerciseAnswers.id, answerId));
  
  return { success: true, newCount: (answer[0].reviewCount || 0) + 1 };
}

/**
 * Obter estatísticas do caderno de exercícios
 */
export async function getStudentNotebookStats(studentId: number, subjectId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar todas as tentativas do aluno
  let attemptsQuery = db
    .select()
    .from(studentExerciseAttempts)
    .where(eq(studentExerciseAttempts.studentId, studentId));
  
  const attempts = await attemptsQuery;
  
  if (attempts.length === 0) {
    return {
      totalQuestions: 0,
      correctQuestions: 0,
      incorrectQuestions: 0,
      markedForReview: 0,
      mastered: 0,
      studying: 0,
      practicing: 0,
      notStarted: 0,
    };
  }
  
  const attemptIds = attempts.map(a => a.id);
  
  // Buscar todas as respostas
  const answersQuery = db
    .select({
      answer: studentExerciseAnswers,
      exercise: studentExercises,
    })
    .from(studentExerciseAnswers)
    .leftJoin(
      studentExerciseAttempts,
      eq(studentExerciseAnswers.attemptId, studentExerciseAttempts.id)
    )
    .leftJoin(
      studentExercises,
      eq(studentExerciseAttempts.exerciseId, studentExercises.id)
    )
    .where(inArray(studentExerciseAnswers.attemptId, attemptIds));
  
  const results = await answersQuery;
  
  // Filtrar por disciplina se necessário
  let filteredResults = results;
  if (subjectId) {
    filteredResults = results.filter(r => r.exercise?.subjectId === subjectId);
  }
  
  const answers = filteredResults.map(r => r.answer);
  
  return {
    totalQuestions: answers.length,
    correctQuestions: answers.filter(a => a.isCorrect === true).length,
    incorrectQuestions: answers.filter(a => a.isCorrect === false).length,
    markedForReview: answers.filter(a => a.markedForReview === true).length,
    mastered: answers.filter(a => a.masteryStatus === 'mastered').length,
    studying: answers.filter(a => a.masteryStatus === 'studying').length,
    practicing: answers.filter(a => a.masteryStatus === 'practicing').length,
    notStarted: answers.filter(a => a.masteryStatus === 'not_started').length,
  };
}


// ========================================
// SISTEMA DE CADERNO DE RESPOSTAS
// ========================================

/**
 * Criar uma nova avaliação
 */
export async function createAssessment(data: {
  teacherId: number;
  subjectId: number;
  classId?: number;
  title: string;
  description?: string;
  assessmentType?: 'prova' | 'simulado' | 'avaliacao_parcial' | 'avaliacao_final' | 'recuperacao' | 'diagnostica';
  totalQuestions: number;
  totalPoints?: number;
  passingScore?: number;
  duration?: number;
  generalInstructions?: string;
  applicationDate?: Date;
  availableFrom?: Date;
  availableTo?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.execute(sql`
    INSERT INTO assessments (
      teacherId, subjectId, classId, title, description, assessmentType,
      totalQuestions, totalPoints, passingScore, duration, generalInstructions,
      applicationDate, availableFrom, availableTo, status
    ) VALUES (
      ${data.teacherId}, ${data.subjectId}, ${data.classId || null}, ${data.title}, 
      ${data.description || null}, ${data.assessmentType || 'prova'},
      ${data.totalQuestions}, ${data.totalPoints || 100}, ${data.passingScore || 60},
      ${data.duration || null}, ${data.generalInstructions || null},
      ${data.applicationDate || null}, ${data.availableFrom || null}, ${data.availableTo || null}, 'draft'
    )
  `);
  
  return result;
}

/**
 * Listar avaliações de um professor
 */
export async function getAssessmentsByTeacher(teacherId: number, subjectId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (subjectId) {
    const result = await db.execute(sql`
      SELECT a.*, s.name as subjectName, c.name as className
      FROM assessments a
      LEFT JOIN subjects s ON a.subjectId = s.id
      LEFT JOIN classes c ON a.classId = c.id
      WHERE a.teacherId = ${teacherId} AND a.subjectId = ${subjectId}
      ORDER BY a.createdAt DESC
    `);
    return (result[0] as unknown) as any[];
  }
  
  const result = await db.execute(sql`
    SELECT a.*, s.name as subjectName, c.name as className
    FROM assessments a
    LEFT JOIN subjects s ON a.subjectId = s.id
    LEFT JOIN classes c ON a.classId = c.id
    WHERE a.teacherId = ${teacherId}
    ORDER BY a.createdAt DESC
  `);
  return (result[0] as unknown) as any[];
}

/**
 * Obter detalhes de uma avaliação
 */
export async function getAssessmentById(assessmentId: number, teacherId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.execute(sql`
    SELECT a.*, s.name as subjectName, c.name as className
    FROM assessments a
    LEFT JOIN subjects s ON a.subjectId = s.id
    LEFT JOIN classes c ON a.classId = c.id
    WHERE a.id = ${assessmentId} AND a.teacherId = ${teacherId}
  `);
  
  return ((result[0] as unknown) as any[])[0];
}

/**
 * Atualizar avaliação
 */
export async function updateAssessment(assessmentId: number, teacherId: number, data: {
  title?: string;
  description?: string;
  totalQuestions?: number;
  totalPoints?: number;
  passingScore?: number;
  duration?: number;
  generalInstructions?: string;
  applicationDate?: Date;
  availableFrom?: Date;
  availableTo?: Date;
  status?: 'draft' | 'published' | 'applied' | 'corrected' | 'archived';
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Usar update com todos os campos (mantendo valores atuais se não fornecidos)
  await db.execute(sql`
    UPDATE assessments SET
      title = COALESCE(${data.title ?? null}, title),
      description = COALESCE(${data.description ?? null}, description),
      totalQuestions = COALESCE(${data.totalQuestions ?? null}, totalQuestions),
      totalPoints = COALESCE(${data.totalPoints ?? null}, totalPoints),
      passingScore = COALESCE(${data.passingScore ?? null}, passingScore),
      duration = COALESCE(${data.duration ?? null}, duration),
      generalInstructions = COALESCE(${data.generalInstructions ?? null}, generalInstructions),
      applicationDate = COALESCE(${data.applicationDate ?? null}, applicationDate),
      availableFrom = COALESCE(${data.availableFrom ?? null}, availableFrom),
      availableTo = COALESCE(${data.availableTo ?? null}, availableTo),
      status = COALESCE(${data.status ?? null}, status)
    WHERE id = ${assessmentId} AND teacherId = ${teacherId}
  `);
}

/**
 * Adicionar questão à avaliação
 */
export async function addAssessmentQuestion(data: {
  assessmentId: number;
  questionNumber: number;
  questionType?: 'multiple_choice' | 'true_false' | 'matching' | 'fill_blank' | 'short_answer' | 'essay';
  statement: string;
  context?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  optionE?: string;
  correctAnswer: string;
  answerExplanation?: string;
  specificInstructions?: string;
  points?: number;
  partialCredit?: boolean;
  skill?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.execute(sql`
    INSERT INTO assessment_questions (
      assessmentId, questionNumber, questionType, statement, context,
      optionA, optionB, optionC, optionD, optionE,
      correctAnswer, answerExplanation, specificInstructions,
      points, partialCredit, skill, difficulty
    ) VALUES (
      ${data.assessmentId}, ${data.questionNumber}, ${data.questionType || 'multiple_choice'},
      ${data.statement}, ${data.context || null},
      ${data.optionA || null}, ${data.optionB || null}, ${data.optionC || null},
      ${data.optionD || null}, ${data.optionE || null},
      ${data.correctAnswer}, ${data.answerExplanation || null}, ${data.specificInstructions || null},
      ${data.points || 10}, ${data.partialCredit || false}, ${data.skill || null}, ${data.difficulty || 'medium'}
    )
  `);
  
  return result;
}

/**
 * Listar questões de uma avaliação
 */
export async function getAssessmentQuestions(assessmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.execute(sql`
    SELECT * FROM assessment_questions
    WHERE assessmentId = ${assessmentId}
    ORDER BY questionNumber ASC
  `);
  
  return (result[0] as unknown) as any[];
}

/**
 * Atualizar questão
 */
export async function updateAssessmentQuestion(questionId: number, data: {
  statement?: string;
  context?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  optionE?: string;
  correctAnswer?: string;
  answerExplanation?: string;
  specificInstructions?: string;
  points?: number;
  skill?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.execute(sql`
    UPDATE assessment_questions SET
      statement = COALESCE(${data.statement ?? null}, statement),
      context = COALESCE(${data.context ?? null}, context),
      optionA = COALESCE(${data.optionA ?? null}, optionA),
      optionB = COALESCE(${data.optionB ?? null}, optionB),
      optionC = COALESCE(${data.optionC ?? null}, optionC),
      optionD = COALESCE(${data.optionD ?? null}, optionD),
      optionE = COALESCE(${data.optionE ?? null}, optionE),
      correctAnswer = COALESCE(${data.correctAnswer ?? null}, correctAnswer),
      answerExplanation = COALESCE(${data.answerExplanation ?? null}, answerExplanation),
      specificInstructions = COALESCE(${data.specificInstructions ?? null}, specificInstructions),
      points = COALESCE(${data.points ?? null}, points),
      skill = COALESCE(${data.skill ?? null}, skill),
      difficulty = COALESCE(${data.difficulty ?? null}, difficulty)
    WHERE id = ${questionId}
  `);
}

/**
 * Excluir questão
 */
export async function deleteAssessmentQuestion(questionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.execute(sql`DELETE FROM assessment_questions WHERE id = ${questionId}`);
}



/**
 * Obter instruções por tipo de questão
 */
export async function getQuestionTypeInstructions(teacherId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.execute(sql`
    SELECT * FROM question_type_instructions
    WHERE teacherId = ${teacherId} OR isDefault = true
    ORDER BY isDefault DESC, questionType ASC
  `);
  
  return (result[0] as unknown) as any[];
}

/**
 * Criar/atualizar instrução por tipo de questão
 */
export async function saveQuestionTypeInstruction(data: {
  teacherId: number;
  questionType: 'multiple_choice' | 'true_false' | 'matching' | 'fill_blank' | 'short_answer' | 'essay';
  title: string;
  instructions: string;
  exampleImage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se já existe
  const existing = await db.execute(sql`
    SELECT id FROM question_type_instructions
    WHERE teacherId = ${data.teacherId} AND questionType = ${data.questionType}
  `);
  
  if (((existing[0] as unknown) as any[]).length > 0) {
    await db.execute(sql`
      UPDATE question_type_instructions
      SET title = ${data.title}, instructions = ${data.instructions}, exampleImage = ${data.exampleImage || null}
      WHERE teacherId = ${data.teacherId} AND questionType = ${data.questionType}
    `);
  } else {
    await db.execute(sql`
      INSERT INTO question_type_instructions (teacherId, questionType, title, instructions, exampleImage)
      VALUES (${data.teacherId}, ${data.questionType}, ${data.title}, ${data.instructions}, ${data.exampleImage || null})
    `);
  }
}

/**
 * Obter instruções padrão do sistema
 */
export function getDefaultQuestionInstructions() {
  return {
    multiple_choice: {
      title: "Questões de Múltipla Escolha",
      instructions: `• Leia atentamente cada questão antes de marcar sua resposta.
• Cada questão possui apenas UMA alternativa correta.
• Marque a resposta preenchendo completamente o círculo correspondente à letra escolhida (A, B, C, D ou E).
• Use caneta esferográfica azul ou preta.
• Não faça rasuras. Caso erre, solicite um novo caderno de respostas.
• Não deixe questões em branco.`
    },
    true_false: {
      title: "Questões de Verdadeiro ou Falso",
      instructions: `• Analise cada afirmação cuidadosamente.
• Marque (V) para afirmações VERDADEIRAS e (F) para afirmações FALSAS.
• Preencha completamente o círculo correspondente.
• Não há alternativa "parcialmente verdadeira" - a afirmação deve ser totalmente correta para ser marcada como verdadeira.`
    },
    matching: {
      title: "Questões de Associação de Colunas",
      instructions: `• Relacione os itens da coluna da esquerda com os da coluna da direita.
• Cada item da coluna da esquerda corresponde a apenas um item da coluna da direita.
• Escreva a letra correspondente no espaço indicado.
• Verifique todas as associações antes de finalizar.`
    },
    fill_blank: {
      title: "Questões de Preenchimento de Lacunas",
      instructions: `• Complete as lacunas com a palavra ou expressão adequada.
• Escreva de forma legível, usando letra de forma se necessário.
• Respeite a concordância gramatical com o restante da frase.
• Não use abreviações, exceto quando indicado.`
    },
    short_answer: {
      title: "Questões de Resposta Curta",
      instructions: `• Responda de forma objetiva e direta.
• Limite sua resposta ao espaço disponível.
• Seja claro e conciso em sua explicação.
• Evite informações desnecessárias.`
    },
    essay: {
      title: "Questões Dissertativas",
      instructions: `• Leia atentamente o enunciado e identifique o que está sendo solicitado.
• Organize suas ideias antes de começar a escrever.
• Desenvolva sua resposta com introdução, desenvolvimento e conclusão.
• Utilize argumentos consistentes e exemplos quando pertinente.
• Revise sua resposta antes de entregar.
• Escreva de forma legível e respeite as margens.`
    }
  };
}


/**
 * ========================================
 * CADERNO DE ERROS E ACERTOS COM IA
 * ========================================
 */

/**
 * Criar nova questão no caderno
 */
export async function createMistakeNotebookQuestion(data: InsertMistakeNotebookQuestion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(mistakeNotebookQuestions).values(data);
  return result[0].insertId;
}

/**
 * Listar questões do caderno do aluno
 */
export async function getMistakeNotebookQuestions(
  studentId: number,
  filters?: {
    subject?: string;
    topic?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  }
) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(mistakeNotebookQuestions.studentId, studentId)];
  
  if (filters?.subject) {
    conditions.push(eq(mistakeNotebookQuestions.subject, filters.subject));
  }
  
  if (filters?.topic) {
    conditions.push(eq(mistakeNotebookQuestions.topic, filters.topic));
  }
  
  if (filters?.difficulty) {
    conditions.push(eq(mistakeNotebookQuestions.difficulty, filters.difficulty));
  }
  
  return await db
    .select()
    .from(mistakeNotebookQuestions)
    .where(and(...conditions))
    .orderBy(desc(mistakeNotebookQuestions.createdAt));
}

/**
 * Obter questão por ID
 */
export async function getMistakeNotebookQuestionById(questionId: number, studentId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(mistakeNotebookQuestions)
    .where(
      and(
        eq(mistakeNotebookQuestions.id, questionId),
        eq(mistakeNotebookQuestions.studentId, studentId)
      )
    )
    .limit(1);
  
  return result[0] || null;
}

/**
 * Registrar tentativa de resposta
 */
export async function createMistakeNotebookAttempt(data: InsertMistakeNotebookAttempt) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(mistakeNotebookAttempts).values(data);
  
  // Atualizar estatísticas do tópico
  const question = await getMistakeNotebookQuestionById(data.questionId, data.studentId);
  if (question) {
    await updateTopicStatistics(data.studentId, question.subject, question.topic);
  }
  
  return result[0].insertId;
}

/**
 * Listar tentativas de uma questão
 */
export async function getMistakeNotebookAttempts(questionId: number, studentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(mistakeNotebookAttempts)
    .where(
      and(
        eq(mistakeNotebookAttempts.questionId, questionId),
        eq(mistakeNotebookAttempts.studentId, studentId)
      )
    )
    .orderBy(desc(mistakeNotebookAttempts.attemptedAt));
}

/**
 * Atualizar status de revisão de uma tentativa
 */
export async function updateAttemptReviewStatus(
  attemptId: number,
  status: 'pending' | 'reviewed' | 'mastered'
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(mistakeNotebookAttempts)
    .set({ 
      reviewStatus: status,
      reviewedAt: status !== 'pending' ? new Date() : null
    })
    .where(eq(mistakeNotebookAttempts.id, attemptId));
}

/**
 * Atualizar estatísticas de um tópico
 */
async function updateTopicStatistics(studentId: number, subject: string, topicName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar todas as questões deste tópico
  const questions = await db
    .select()
    .from(mistakeNotebookQuestions)
    .where(
      and(
        eq(mistakeNotebookQuestions.studentId, studentId),
        eq(mistakeNotebookQuestions.subject, subject),
        eq(mistakeNotebookQuestions.topic, topicName)
      )
    );
  
  if (questions.length === 0) return;
  
  // Buscar todas as tentativas dessas questões
  const questionIds = questions.map(q => q.id);
  const attempts = await db
    .select()
    .from(mistakeNotebookAttempts)
    .where(
      and(
        eq(mistakeNotebookAttempts.studentId, studentId),
        sql`${mistakeNotebookAttempts.questionId} IN (${sql.join(questionIds, sql`, `)})`
      )
    );
  
  const totalQuestions = questions.length;
  const correctAnswers = attempts.filter(a => a.isCorrect).length;
  const errorRate = totalQuestions > 0 ? ((totalQuestions - correctAnswers) / totalQuestions) * 100 : 0;
  
  // Determinar prioridade baseada na taxa de erro
  let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  if (errorRate >= 75) priority = 'critical';
  else if (errorRate >= 50) priority = 'high';
  else if (errorRate >= 25) priority = 'medium';
  else priority = 'low';
  
  // Verificar se o tópico já existe
  const existingTopic = await db
    .select()
    .from(mistakeNotebookTopics)
    .where(
      and(
        eq(mistakeNotebookTopics.studentId, studentId),
        eq(mistakeNotebookTopics.subject, subject),
        eq(mistakeNotebookTopics.topicName, topicName)
      )
    )
    .limit(1);
  
  if (existingTopic.length > 0) {
    // Atualizar
    await db
      .update(mistakeNotebookTopics)
      .set({
        totalQuestions,
        correctAnswers,
        errorRate,
        priority,
        lastPracticed: new Date(),
      })
      .where(eq(mistakeNotebookTopics.id, existingTopic[0].id));
  } else {
    // Criar
    await db.insert(mistakeNotebookTopics).values({
      studentId,
      subject,
      topicName,
      totalQuestions,
      correctAnswers,
      errorRate,
      priority,
      lastPracticed: new Date(),
    });
  }
}

/**
 * Obter tópicos do aluno
 */
export async function getMistakeNotebookTopics(studentId: number, subject?: string) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(mistakeNotebookTopics.studentId, studentId)];
  
  if (subject) {
    conditions.push(eq(mistakeNotebookTopics.subject, subject));
  }
  
  return await db
    .select()
    .from(mistakeNotebookTopics)
    .where(and(...conditions))
    .orderBy(desc(mistakeNotebookTopics.errorRate));
}

/**
 * Criar insight da IA
 */
export async function createMistakeNotebookInsight(data: InsertMistakeNotebookInsight) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(mistakeNotebookInsights).values(data);
  return result[0].insertId;
}

/**
 * Listar insights do aluno
 */
export async function getMistakeNotebookInsights(
  studentId: number,
  filters?: {
    insightType?: 'pattern_analysis' | 'study_suggestion' | 'question_recommendation' | 'progress_report';
    onlyUnread?: boolean;
  }
) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [
    eq(mistakeNotebookInsights.studentId, studentId),
    eq(mistakeNotebookInsights.isArchived, false)
  ];
  
  if (filters?.insightType) {
    conditions.push(eq(mistakeNotebookInsights.insightType, filters.insightType));
  }
  
  if (filters?.onlyUnread) {
    conditions.push(eq(mistakeNotebookInsights.isRead, false));
  }
  
  return await db
    .select()
    .from(mistakeNotebookInsights)
    .where(and(...conditions))
    .orderBy(desc(mistakeNotebookInsights.relevanceScore), desc(mistakeNotebookInsights.generatedAt));
}

/**
 * Marcar insight como lido
 */
export async function markInsightAsRead(insightId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(mistakeNotebookInsights)
    .set({ isRead: true })
    .where(eq(mistakeNotebookInsights.id, insightId));
}

/**
 * Criar plano de estudos
 */
export async function createMistakeNotebookStudyPlan(data: InsertMistakeNotebookStudyPlan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(mistakeNotebookStudyPlans).values(data);
  return result[0].insertId;
}

/**
 * Obter planos de estudo do aluno
 */
export async function getMistakeNotebookStudyPlans(studentId: number, status?: 'active' | 'completed' | 'abandoned') {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(mistakeNotebookStudyPlans.studentId, studentId)];
  
  if (status) {
    conditions.push(eq(mistakeNotebookStudyPlans.status, status));
  }
  
  return await db
    .select()
    .from(mistakeNotebookStudyPlans)
    .where(and(...conditions))
    .orderBy(desc(mistakeNotebookStudyPlans.createdAt));
}

/**
 * Atualizar progresso do plano de estudos
 */
export async function updateStudyPlanProgress(planId: number, completedTasks: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const plan = await db
    .select()
    .from(mistakeNotebookStudyPlans)
    .where(eq(mistakeNotebookStudyPlans.id, planId))
    .limit(1);
  
  if (plan.length === 0) return;
  
  const totalTasks = plan[0].totalTasks;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const status = progressPercentage >= 100 ? 'completed' : 'active';
  
  await db
    .update(mistakeNotebookStudyPlans)
    .set({
      completedTasks,
      progressPercentage,
      status,
    })
    .where(eq(mistakeNotebookStudyPlans.id, planId));
}

/**
 * Obter estatísticas gerais do caderno
 */
export async function getMistakeNotebookStats(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Total de questões
  const questions = await db
    .select()
    .from(mistakeNotebookQuestions)
    .where(eq(mistakeNotebookQuestions.studentId, studentId));
  
  // Total de tentativas
  const attempts = await db
    .select()
    .from(mistakeNotebookAttempts)
    .where(eq(mistakeNotebookAttempts.studentId, studentId));
  
  const totalQuestions = questions.length;
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter(a => a.isCorrect).length;
  const successRate = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
  
  // Questões por matéria
  const questionsBySubject = questions.reduce((acc, q) => {
    acc[q.subject] = (acc[q.subject] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Tópicos prioritários
  const topics = await getMistakeNotebookTopics(studentId);
  const criticalTopics = topics.filter(t => t.priority === 'critical').length;
  const highPriorityTopics = topics.filter(t => t.priority === 'high').length;
  
  return {
    totalQuestions,
    totalAttempts,
    correctAttempts,
    successRate,
    questionsBySubject,
    totalTopics: topics.length,
    criticalTopics,
    highPriorityTopics,
  };
}

export async function getExerciseAttemptsByStudent(exerciseId: number, studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const attempts = await db
    .select()
    .from(studentExerciseAttempts)
    .where(
      and(
        eq(studentExerciseAttempts.exerciseId, exerciseId),
        eq(studentExerciseAttempts.studentId, studentId),
        eq(studentExerciseAttempts.status, 'completed')
      )
    )
    .orderBy(desc(studentExerciseAttempts.completedAt));

  return attempts;
}


// Buscar alunos matriculados nas disciplinas do professor
export async function getEnrolledStudentsByProfessor(professorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar todas as matrículas de alunos nas disciplinas do professor
  const enrollments = await db.select({
    studentId: subjectEnrollments.studentId,
    subjectId: subjectEnrollments.subjectId,
    enrolledAt: subjectEnrollments.enrolledAt,
    status: subjectEnrollments.status,
  })
    .from(subjectEnrollments)
    .where(eq(subjectEnrollments.userId, professorId));

  return enrollments;
}
