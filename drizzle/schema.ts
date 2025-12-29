import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, datetime, unique, date, json } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

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
  active: boolean("active").default(true).notNull(),
  approvalStatus: mysqlEnum("approvalStatus", ["approved", "pending", "rejected"]).default("approved").notNull(),
  inviteCode: varchar("inviteCode", { length: 20 }), // Código de convite usado no cadastro
  passwordHash: varchar("passwordHash", { length: 255 }), // Hash da senha para login direto
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de códigos de convite para professores
 */
export const inviteCodes = mysqlTable("invite_codes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  createdBy: int("createdBy").notNull(), // ID do admin que criou
  usedBy: int("usedBy"), // ID do usuário que usou (null se não usado)
  maxUses: int("maxUses").default(1).notNull(), // Número máximo de usos
  currentUses: int("currentUses").default(0).notNull(), // Número atual de usos
  expiresAt: timestamp("expiresAt"), // Data de expiração (null = sem expiração)
  isActive: boolean("isActive").default(true).notNull(),
  description: varchar("description", { length: 255 }), // Descrição opcional do convite
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InviteCode = typeof inviteCodes.$inferSelect;
export type InsertInviteCode = typeof inviteCodes.$inferInsert;

/**
 * Tabela de logs de auditoria
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  timestamp: datetime("timestamp").notNull().default(sql`CURRENT_TIMESTAMP`),
  adminId: int("admin_id").notNull(),
  adminName: varchar("admin_name", { length: 255 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  targetUserId: int("target_user_id"),
  targetUserName: varchar("target_user_name", { length: 255 }),
  oldData: text("old_data"),
  newData: text("new_data"),
  ipAddress: varchar("ip_address", { length: 45 }),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Tabela de tokens de recuperação de senha
 */
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

/**
 * Tabela de eventos do calendário (datas comemorativas e observações)
 */
export const calendarEvents = mysqlTable("calendar_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventDate: varchar("eventDate", { length: 10 }).notNull(), // Formato: YYYY-MM-DD
  eventType: mysqlEnum("eventType", ["holiday", "commemorative", "school_event", "personal"]).notNull(),
  isRecurring: int("isRecurring").default(0).notNull(), // 0 = não recorrente, 1 = recorrente anualmente
  color: varchar("color", { length: 7 }).default("#3b82f6"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

// TODO: Add your tables here*/
export const subjects = mysqlTable("subjects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3b82f6"),
  userId: int("userId").notNull(),
  // Campos do Plano de Curso
  ementa: text("ementa"), // Ementa da disciplina
  generalObjective: text("generalObjective"), // Objetivo geral
  specificObjectives: text("specificObjectives"), // Objetivos específicos
  programContent: text("programContent"), // Conteúdo programático
  basicBibliography: text("basicBibliography"), // Bibliografia básica
  complementaryBibliography: text("complementaryBibliography"), // Bibliografia complementar
  coursePlanPdfUrl: text("coursePlanPdfUrl"), // URL do PDF do plano de curso
  googleDriveUrl: text("googleDriveUrl"), // URL da pasta do Google Drive
  googleClassroomUrl: text("googleClassroomUrl"), // URL da turma do Google Classroom
  workload: int("workload").default(60), // Carga horária total em horas
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = typeof subjects.$inferInsert;

/**
 * Turmas
 */
export const classes = mysqlTable("classes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  description: text("description"),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;

/**
 * Turnos (Matutino, Vespertino, Noturno)
 */
export const shifts = mysqlTable("shifts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(),
  displayOrder: int("displayOrder").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = typeof shifts.$inferInsert;

/**
 * Horários/Tempos (períodos dentro de cada turno)
 */
export const timeSlots = mysqlTable("time_slots", {
  id: int("id").autoincrement().primaryKey(),
  shiftId: int("shiftId").notNull(),
  slotNumber: int("slotNumber").notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TimeSlot = typeof timeSlots.$inferSelect;
export type InsertTimeSlot = typeof timeSlots.$inferInsert;

/**
 * Aulas agendadas
 */
export const scheduledClasses = mysqlTable("scheduled_classes", {
  id: int("id").autoincrement().primaryKey(),
  subjectId: int("subjectId").notNull(),
  classId: int("classId").notNull(),
  timeSlotId: int("timeSlotId").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(),
  notes: text("notes"),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledClass = typeof scheduledClasses.$inferSelect;
export type InsertScheduledClass = typeof scheduledClasses.$inferInsert;

/**
 * Metodologias Ativas - Ferramentas pedagógicas
 */
export const activeMethodologies = mysqlTable("active_methodologies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(), // Quiz, Colaboração, Apresentação, etc.
  url: text("url").notNull(),
  tips: text("tips"), // Dicas de uso pedagógico
  logoUrl: text("logoUrl"), // URL do logo/ícone da ferramenta
  isFavorite: boolean("isFavorite").default(false).notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ActiveMethodology = typeof activeMethodologies.$inferSelect;
export type InsertActiveMethodology = typeof activeMethodologies.$inferInsert;

/**
 * Status de aulas (para controle de aulas dadas, não dadas, canceladas)
 */
export const classStatuses = mysqlTable("class_statuses", {
  id: int("id").autoincrement().primaryKey(),
  scheduledClassId: int("scheduledClassId").notNull(),
  weekNumber: int("weekNumber").notNull(), // Semana do ano (1-53)
  year: int("year").notNull(),
  status: mysqlEnum("status", ["given", "not_given", "cancelled"]).notNull(),
  reason: text("reason"), // Motivo opcional (falta, evento pessoal, etc.)
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClassStatus = typeof classStatuses.$inferSelect;
export type InsertClassStatus = typeof classStatuses.$inferInsert;

/**
 * Tarefas (To-Do List estilo Todoist)
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  category: varchar("category", { length: 100 }),
  dueDate: varchar("dueDate", { length: 10 }), // Formato: YYYY-MM-DD
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  orderIndex: int("orderIndex").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Módulos da Trilha de Aprendizagem (Unidades de uma disciplina)
 */
export const learningModules = mysqlTable("learning_modules", {
  id: int("id").autoincrement().primaryKey(),
  subjectId: int("subjectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  orderIndex: int("orderIndex").default(0).notNull(),
  userId: int("userId").notNull(),
  infographicUrl: text("infographic_url"), // URL do infográfico gerado para este módulo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearningModule = typeof learningModules.$inferSelect;
export type InsertLearningModule = typeof learningModules.$inferInsert;

/**
 * Tópicos da Trilha de Aprendizagem (Conteúdos dentro de cada módulo)
 */
export const learningTopics = mysqlTable("learning_topics", {
  id: int("id").autoincrement().primaryKey(),
  moduleId: int("moduleId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed"]).default("not_started").notNull(),
  estimatedHours: int("estimatedHours").default(0), // Horas estimadas para cobrir o tópico
  theoryHours: int("theoryHours").default(0), // Horas de atividades teóricas
  practiceHours: int("practiceHours").default(0), // Horas de atividades práticas
  individualWorkHours: int("individualWorkHours").default(0), // Horas de trabalhos individuais
  teamWorkHours: int("teamWorkHours").default(0), // Horas de trabalhos em equipe
  orderIndex: int("orderIndex").default(0).notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearningTopic = typeof learningTopics.$inferSelect;
export type InsertLearningTopic = typeof learningTopics.$inferInsert;

/**
 * Vinculação entre Tópicos e Aulas Agendadas
 */
export const topicClassLinks = mysqlTable("topic_class_links", {
  id: int("id").autoincrement().primaryKey(),
  topicId: int("topicId").notNull(),
  scheduledClassId: int("scheduledClassId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TopicClassLink = typeof topicClassLinks.$inferSelect;
export type InsertTopicClassLink = typeof topicClassLinks.$inferInsert;

/**
 * Matrícula de Alunos em Disciplinas
 */
export const studentEnrollments = mysqlTable("student_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // ID do usuário com role 'user' (aluno)
  subjectId: int("subjectId").notNull(),
  classId: int("classId"), // Turma específica (opcional)
  professorId: int("professorId").notNull(), // Professor responsável
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["active", "completed", "dropped"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentEnrollment = typeof studentEnrollments.$inferSelect;
export type InsertStudentEnrollment = typeof studentEnrollments.$inferInsert;

/**
 * Progresso Individual do Aluno em Tópicos
 */
export const studentTopicProgress = mysqlTable("student_topic_progress", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  topicId: int("topicId").notNull(),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed"]).default("not_started").notNull(),
  completedAt: timestamp("completedAt"),
  selfAssessment: mysqlEnum("selfAssessment", ["understood", "have_doubts", "need_help"]),
  notes: text("notes"), // Anotações pessoais do aluno
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentTopicProgress = typeof studentTopicProgress.$inferSelect;
export type InsertStudentTopicProgress = typeof studentTopicProgress.$inferInsert;

/**
 * Materiais Didáticos por Tópico
 */
export const topicMaterials = mysqlTable("topic_materials", {
  id: int("id").autoincrement().primaryKey(),
  topicId: int("topicId").notNull(),
  professorId: int("professorId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["pdf", "video", "link", "presentation", "document", "other"]).notNull(),
  url: text("url").notNull(), // URL do arquivo ou link externo
  fileSize: int("fileSize"), // Tamanho em bytes (para uploads)
  orderIndex: int("orderIndex").default(0).notNull(),
  isRequired: boolean("isRequired").default(false).notNull(), // Material obrigatório
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TopicMaterial = typeof topicMaterials.$inferSelect;
export type InsertTopicMaterial = typeof topicMaterials.$inferInsert;

/**
 * Atividades/Exercícios por Tópico
 */
export const topicAssignments = mysqlTable("topic_assignments", {
  id: int("id").autoincrement().primaryKey(),
  topicId: int("topicId").notNull(),
  professorId: int("professorId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  type: mysqlEnum("type", ["exercise", "essay", "project", "quiz", "practical"]).notNull(),
  dueDate: timestamp("dueDate"),
  maxScore: int("maxScore").default(100).notNull(),
  isRequired: boolean("isRequired").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TopicAssignment = typeof topicAssignments.$inferSelect;
export type InsertTopicAssignment = typeof topicAssignments.$inferInsert;

/**
 * Entregas de Atividades pelos Alunos
 */
export const assignmentSubmissions = mysqlTable("assignment_submissions", {
  id: int("id").autoincrement().primaryKey(),
  assignmentId: int("assignmentId").notNull(),
  studentId: int("studentId").notNull(),
  content: text("content"), // Texto da resposta
  fileUrl: text("fileUrl"), // URL do arquivo enviado
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  score: int("score"), // Nota atribuída
  feedback: text("feedback"), // Feedback do professor
  status: mysqlEnum("status", ["pending", "graded", "late"]).default("pending").notNull(),
  gradedAt: timestamp("gradedAt"),
  gradedBy: int("gradedBy"), // ID do professor que corrigiu
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type InsertAssignmentSubmission = typeof assignmentSubmissions.$inferInsert;

/**
 * Comentários e Feedback Professor-Aluno
 */
export const topicComments = mysqlTable("topic_comments", {
  id: int("id").autoincrement().primaryKey(),
  topicId: int("topicId").notNull(),
  studentId: int("studentId").notNull(),
  professorId: int("professorId").notNull(),
  authorId: int("authorId").notNull(), // Quem escreveu (professor ou aluno)
  authorType: mysqlEnum("authorType", ["professor", "student"]).notNull(),
  content: text("content").notNull(),
  isPrivate: boolean("isPrivate").default(true).notNull(), // Comentário privado (apenas aluno e professor)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TopicComment = typeof topicComments.$inferSelect;
export type InsertTopicComment = typeof topicComments.$inferInsert;

/**
 * Notificações para Alunos
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // ID do aluno que receberá a notificação
  type: mysqlEnum("type", [
    "new_material",      // Novo material adicionado
    "new_assignment",    // Nova atividade criada
    "new_announcement",  // Novo aviso postado
    "assignment_due",    // Prazo de atividade próximo
    "feedback_received", // Feedback do professor recebido
    "grade_received",    // Nota recebida
    "comment_received",  // Comentário do professor
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  link: varchar("link", { length: 500 }), // Link para o recurso relacionado
  relatedId: int("relatedId"), // ID do recurso relacionado (material, atividade, etc)
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Tabela de Alunos (Matrículas)
 */
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Professor responsável
  registrationNumber: varchar("registrationNumber", { length: 50 }).notNull(), // Matrícula do aluno
  fullName: varchar("fullName", { length: 255 }).notNull(), // Nome completo do aluno
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // Índice único: mesma matrícula não pode ser cadastrada duas vezes pelo mesmo professor
  uniqueRegistration: sql`UNIQUE KEY unique_registration_per_user (userId, registrationNumber)`,
}));

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

/**
 * Tabela de matrículas de alunos em turmas
 */
export const studentClassEnrollments = mysqlTable("student_class_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  classId: int("classId").notNull(), // FK para classes
  userId: int("userId").notNull(), // Professor responsável
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
}, (table) => ({
  // Índice único: aluno não pode estar matriculado duas vezes na mesma turma
  uniqueEnrollment: sql`UNIQUE KEY unique_student_class (studentId, classId)`,
}));

export type StudentClassEnrollment = typeof studentClassEnrollments.$inferSelect;
export type InsertStudentClassEnrollment = typeof studentClassEnrollments.$inferInsert;

/**
 * Tabela de registro de frequência dos alunos
 */
export const studentAttendance = mysqlTable("student_attendance", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  classId: int("classId").notNull(), // FK para classes
  scheduleId: int("scheduleId").notNull(), // FK para schedules (aula específica)
  userId: int("userId").notNull(), // Professor responsável
  date: varchar("date", { length: 10 }).notNull(), // Formato: YYYY-MM-DD
  status: mysqlEnum("status", ["present", "absent", "justified"]).notNull(), // Presente, Falta, Falta Justificada
  notes: text("notes"), // Observações opcionais
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  // Índice único: um aluno não pode ter dois registros de frequência para a mesma aula
  uniqueAttendance: sql`UNIQUE KEY unique_student_schedule (studentId, scheduleId, date)`,
}));

export type StudentAttendance = typeof studentAttendance.$inferSelect;
export type InsertStudentAttendance = typeof studentAttendance.$inferInsert;

/**
 * Matrícula de Alunos em Disciplinas (Subject Enrollments)
 */
export const subjectEnrollments = mysqlTable("subjectEnrollments", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  subjectId: int("subjectId").notNull(),
  enrolledAt: timestamp("enrolledAt").defaultNow(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["active", "completed", "dropped"]).default("active").notNull(),
});


/**
 * Avisos/Anúncios (Announcements)
 * Professores postam avisos para alunos de disciplinas específicas
 */
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isImportant: boolean("isImportant").default(false).notNull(),
  subjectId: int("subjectId").notNull(), // Disciplina relacionada
  userId: int("userId").notNull(), // Professor que criou
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

/**
 * Leitura de Avisos (Announcement Reads)
 * Rastreia quais alunos leram quais avisos
 */
export const announcementReads = mysqlTable("announcementReads", {
  id: int("id").autoincrement().primaryKey(),
  announcementId: int("announcementId").notNull(),
  studentId: int("studentId").notNull(),
  readAt: timestamp("readAt").defaultNow().notNull(),
}, (table) => ({
  // Índice único: aluno não pode marcar o mesmo aviso como lido duas vezes
  uniqueRead: sql`UNIQUE KEY unique_announcement_read (announcementId, studentId)`,
}));

export type AnnouncementRead = typeof announcementReads.$inferSelect;
export type InsertAnnouncementRead = typeof announcementReads.$inferInsert;

// ==================== GAMIFICATION TABLES ====================

/**
 * Pontuação dos Alunos (Student Points)
 * Armazena pontos totais, faixa atual e streak
 */
export const studentPoints = mysqlTable("student_points", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().unique(), // FK para students
  totalPoints: int("totalPoints").default(0).notNull(),
  currentBelt: varchar("currentBelt", { length: 50 }).default("white").notNull(), // white, yellow, orange, green, blue, purple, brown, black
  streakDays: int("streakDays").default(0).notNull(),
  lastActivityDate: timestamp("lastActivityDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentPoints = typeof studentPoints.$inferSelect;
export type InsertStudentPoints = typeof studentPoints.$inferInsert;

/**
 * Histórico de Pontos (Points History)
 * Registra todas as atividades que geraram pontos
 */
export const pointsHistory = mysqlTable("points_history", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  points: int("points").notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  activityType: varchar("activityType", { length: 100 }).notNull(), // exercise_objective, exercise_subjective, exam, etc
  relatedId: int("relatedId"), // ID da atividade relacionada (exercício, prova, etc)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PointsHistory = typeof pointsHistory.$inferSelect;
export type InsertPointsHistory = typeof pointsHistory.$inferInsert;

/**
 * Badges Disponíveis (Badges)
 * Catálogo de todas as conquistas disponíveis
 */
export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  category: mysqlEnum("category", ["streak", "accuracy", "speed", "completion", "special"]).notNull(),
  requirement: int("requirement").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

/**
 * Badges Conquistados pelos Alunos (Student Badges)
 * Relaciona alunos com badges que conquistaram
 */
export const studentBadges = mysqlTable("student_badges", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  badgeId: int("badgeId").notNull(), // FK para badges
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
}, (table) => ({
  // Índice único: aluno não pode ganhar o mesmo badge duas vezes
  uniqueBadge: sql`UNIQUE KEY unique_student_badge (studentId, badgeId)`,
}));

export type StudentBadge = typeof studentBadges.$inferSelect;
export type InsertStudentBadge = typeof studentBadges.$inferInsert;

/**
 * Notificações de Gamificação (Gamification Notifications)
 * Notificações sobre conquistas, subida de faixa, etc
 */
export const gamificationNotifications = mysqlTable("gamification_notifications", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  type: varchar("type", { length: 50 }).notNull(), // badge_earned, belt_upgrade, streak_milestone
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GamificationNotification = typeof gamificationNotifications.$inferSelect;
export type InsertGamificationNotification = typeof gamificationNotifications.$inferInsert;


/**
 * ==================== PENSAMENTO COMPUTACIONAL ====================
 * Sistema de avaliação de Pensamento Computacional
 * 4 dimensões: Decomposição, Reconhecimento de Padrões, Abstração, Algoritmos
 */

/**
 * Pontuações de Pensamento Computacional por Dimensão
 * Armazena a pontuação atual do aluno em cada uma das 4 dimensões
 */
export const computationalThinkingScores = mysqlTable("computational_thinking_scores", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  dimension: mysqlEnum("dimension", ["decomposition", "pattern_recognition", "abstraction", "algorithms"]).notNull(),
  score: int("score").default(0).notNull(), // Pontuação de 0-100
  exercisesCompleted: int("exercisesCompleted").default(0).notNull(), // Quantidade de exercícios completados
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  uniqueStudentDimension: unique().on(table.studentId, table.dimension), // Um registro por aluno por dimensão
}));

export type ComputationalThinkingScore = typeof computationalThinkingScores.$inferSelect;
export type InsertComputationalThinkingScore = typeof computationalThinkingScores.$inferInsert;

/**
 * Exercícios de Pensamento Computacional
 * Banco de exercícios específicos para cada dimensão
 */
export const ctExercises = mysqlTable("ct_exercises", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  dimension: mysqlEnum("dimension", ["decomposition", "pattern_recognition", "abstraction", "algorithms"]).notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).notNull(),
  content: text("content").notNull(), // JSON com estrutura do exercício
  expectedAnswer: text("expectedAnswer"), // Resposta esperada ou critérios de avaliação
  points: int("points").default(10).notNull(), // Pontos ao completar
  createdBy: int("createdBy").notNull(), // FK para users (professor que criou)
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CTExercise = typeof ctExercises.$inferSelect;
export type InsertCTExercise = typeof ctExercises.$inferInsert;

/**
 * Submissões de Exercícios de Pensamento Computacional
 * Histórico de respostas dos alunos
 */
export const ctSubmissions = mysqlTable("ct_submissions", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  exerciseId: int("exerciseId").notNull(), // FK para ct_exercises
  answer: text("answer").notNull(), // Resposta do aluno
  score: int("score").notNull(), // Pontuação obtida (0-100)
  feedback: text("feedback"), // Feedback automático da IA
  timeSpent: int("timeSpent"), // Tempo gasto em segundos
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
});

export type CTSubmission = typeof ctSubmissions.$inferSelect;
export type InsertCTSubmission = typeof ctSubmissions.$inferInsert;

/**
 * Badges de Pensamento Computacional
 * Conquistas especiais relacionadas às dimensões do PC
 */
export const ctBadges = mysqlTable("ct_badges", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description").notNull(),
  dimension: mysqlEnum("dimension", ["decomposition", "pattern_recognition", "abstraction", "algorithms", "all"]).notNull(),
  requirement: text("requirement").notNull(), // JSON com critérios para conquistar
  icon: varchar("icon", { length: 50 }).notNull(), // Nome do ícone
  color: varchar("color", { length: 50 }).notNull(), // Cor do badge
  points: int("points").default(0).notNull(), // Pontos de gamificação ao conquistar
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CTBadge = typeof ctBadges.$inferSelect;
export type InsertCTBadge = typeof ctBadges.$inferInsert;

/**
 * Badges de PC Conquistados pelos Alunos
 * Relacionamento entre alunos e badges de PC
 */
export const studentCTBadges = mysqlTable("student_ct_badges", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  badgeId: int("badgeId").notNull(), // FK para ct_badges
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
}, (table) => ({
  uniqueStudentBadge: unique().on(table.studentId, table.badgeId), // Um badge por aluno apenas uma vez
}));

export type StudentCTBadge = typeof studentCTBadges.$inferSelect;
export type InsertStudentCTBadge = typeof studentCTBadges.$inferInsert;

/**
 * Pontos de Gamificação por Disciplina
 * Cada aluno tem pontos separados para cada disciplina
 */
export const studentSubjectPoints = mysqlTable("student_subject_points", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  subjectId: int("subjectId").notNull(),
  totalPoints: int("totalPoints").default(0).notNull(),
  currentBelt: varchar("currentBelt", { length: 50 }).default("white").notNull(),
  streakDays: int("streakDays").default(0).notNull(),
  lastActivityDate: datetime("lastActivityDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentSubjectPoints = typeof studentSubjectPoints.$inferSelect;
export type InsertStudentSubjectPoints = typeof studentSubjectPoints.$inferInsert;

/**
 * Histórico de Pontos por Disciplina
 */
export const subjectPointsHistory = mysqlTable("subject_points_history", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  subjectId: int("subjectId").notNull(),
  points: int("points").notNull(),
  activityType: varchar("activityType", { length: 50 }).notNull(),
  activityId: int("activityId"),
  description: text("description"),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});

export type SubjectPointsHistory = typeof subjectPointsHistory.$inferSelect;
export type InsertSubjectPointsHistory = typeof subjectPointsHistory.$inferInsert;

/**
 * Badges por Disciplina
 */
export const subjectBadges = mysqlTable("subject_badges", {
  id: int("id").autoincrement().primaryKey(),
  subjectId: int("subjectId").notNull(),
  badgeKey: varchar("badgeKey", { length: 50 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  iconUrl: varchar("iconUrl", { length: 255 }),
  requiredPoints: int("requiredPoints").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SubjectBadge = typeof subjectBadges.$inferSelect;
export type InsertSubjectBadge = typeof subjectBadges.$inferInsert;

/**
 * Badges Conquistados por Aluno em cada Disciplina
 */
export const studentSubjectBadges = mysqlTable("student_subject_badges", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  subjectId: int("subjectId").notNull(),
  badgeId: int("badgeId").notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});

export type StudentSubjectBadge = typeof studentSubjectBadges.$inferSelect;
export type InsertStudentSubjectBadge = typeof studentSubjectBadges.$inferInsert;

/**
 * Exercícios publicados pelos professores para os alunos
 */
export const studentExercises = mysqlTable("student_exercises", {
  id: int("id").autoincrement().primaryKey(),
  moduleId: int("moduleId").notNull(), // Módulo da trilha de aprendizagem
  subjectId: int("subjectId").notNull(), // Disciplina
  teacherId: int("teacherId").notNull(), // Professor que criou
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  exerciseData: json("exerciseData").notNull(), // JSON com as questões geradas
  totalQuestions: int("totalQuestions").notNull(),
  totalPoints: int("totalPoints").notNull(),
  passingScore: int("passingScore").default(60).notNull(), // Nota mínima para passar (%)
  maxAttempts: int("maxAttempts").default(3).notNull(), // Número máximo de tentativas (0 = ilimitado)
  timeLimit: int("timeLimit"), // Tempo limite em minutos (null = sem limite)
  showAnswersAfter: boolean("showAnswersAfter").default(true).notNull(), // Mostrar gabarito após conclusão
  availableFrom: timestamp("availableFrom").notNull(),
  availableTo: timestamp("availableTo"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentExercise = typeof studentExercises.$inferSelect;
export type InsertStudentExercise = typeof studentExercises.$inferInsert;

/**
 * Tentativas de resolução de exercícios pelos alunos
 */
export const studentExerciseAttempts = mysqlTable("student_exercise_attempts", {
  id: int("id").autoincrement().primaryKey(),
  exerciseId: int("exerciseId").notNull(),
  studentId: int("studentId").notNull(),
  attemptNumber: int("attemptNumber").notNull(), // 1, 2, 3...
  answers: json("answers").notNull(), // Array de respostas do aluno
  score: int("score").notNull(), // Pontuação obtida (0-100)
  correctAnswers: int("correctAnswers").notNull(),
  totalQuestions: int("totalQuestions").notNull(),
  pointsEarned: int("pointsEarned").notNull(), // Pontos de gamificação ganhos
  timeSpent: int("timeSpent"), // Tempo gasto em segundos
  status: mysqlEnum("status", ["in_progress", "completed", "abandoned"]).default("in_progress").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentExerciseAttempt = typeof studentExerciseAttempts.$inferSelect;
export type InsertStudentExerciseAttempt = typeof studentExerciseAttempts.$inferInsert;

/**
 * Respostas individuais por questão (para análise detalhada)
 */
export const studentExerciseAnswers = mysqlTable("student_exercise_answers", {
  id: int("id").autoincrement().primaryKey(),
  attemptId: int("attemptId").notNull(),
  questionNumber: int("questionNumber").notNull(),
  questionType: varchar("questionType", { length: 50 }).notNull(), // objective, subjective, case_study
  studentAnswer: text("studentAnswer").notNull(),
  correctAnswer: text("correctAnswer"),
  isCorrect: boolean("isCorrect"),
  pointsAwarded: int("pointsAwarded").default(0).notNull(),
  teacherFeedback: text("teacherFeedback"), // Feedback manual do professor (para subjetivas)
  aiFeedback: text("aiFeedback"), // Feedback automático gerado por IA para questões erradas
  studyTips: text("studyTips"), // Dicas de estudo personalizadas geradas por IA
  // Campos de validação inteligente de respostas abertas
  aiScore: int("aiScore"), // Nota automática da IA (0-100) para questões abertas
  aiConfidence: int("aiConfidence"), // Confiança da IA na avaliação (0-100)
  aiAnalysis: text("aiAnalysis"), // Análise completa da IA em JSON (strengths, weaknesses, reasoning)
  needsReview: boolean("needsReview").default(false), // true se confiança < 70% ou professor solicitou revisão
  reviewedBy: int("reviewedBy"), // ID do professor que revisou manualmente
  reviewedAt: timestamp("reviewedAt"), // Data da revisão manual
  finalScore: int("finalScore"), // Nota final após revisão manual (se houver)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StudentExerciseAnswer = typeof studentExerciseAnswers.$inferSelect;
export type InsertStudentExerciseAnswer = typeof studentExerciseAnswers.$inferInsert;
