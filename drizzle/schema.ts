import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, datetime, unique, date, json, float, double, bigint, decimal } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  profile: mysqlEnum("profile", ["traditional", "enthusiast", "interactive", "organizational"]).default("traditional").notNull(), // Perfil profissional do professor
  active: boolean("active").default(true).notNull(),
  approvalStatus: mysqlEnum("approvalStatus", ["approved", "pending", "rejected"]).default("approved").notNull(),
  inviteCode: varchar("inviteCode", { length: 20 }), // Código de convite usado no cadastro
  passwordHash: varchar("passwordHash", { length: 255 }), // Hash da senha para login direto
  storageLimitMB: int("storageLimitMB").default(1024).notNull(), // Limite de armazenamento individual em MB (padrão 1GB)
  colorTheme: varchar("colorTheme", { length: 32 }).default("default"), // Tema de cores selecionado pelo usuário
  themeMode: varchar("themeMode", { length: 16 }).default("system"), // Modo claro/escuro/sistema
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
  code: varchar("code", { length: 50 }).notNull().unique(),
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

/**
 * Tabela de cache de análises de IA
 * Armazena resultados de análises para evitar reprocessamento
 */
export const aiAnalysisCache = mysqlTable("ai_analysis_cache", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Dono da análise
  cacheKey: varchar("cacheKey", { length: 255 }).notNull(), // Hash único do conteúdo analisado
  analysisType: varchar("analysisType", { length: 50 }).notNull(), // Tipo de análise (ex: 'open_answer', 'learning_analysis')
  inputData: text("inputData").notNull(), // Dados de entrada (JSON)
  resultData: text("resultData").notNull(), // Resultado da análise (JSON)
  expiresAt: timestamp("expiresAt"), // Data de expiração do cache (null = sem expiração)
  hitCount: int("hitCount").default(0).notNull(), // Número de vezes que o cache foi usado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastAccessedAt: timestamp("lastAccessedAt").defaultNow().notNull(),
}, (table) => ({
  // Índice único para busca rápida por tipo e chave
  uniqueCache: unique().on(table.userId, table.analysisType, table.cacheKey),
}));

export type AiAnalysisCache = typeof aiAnalysisCache.$inferSelect;
export type InsertAiAnalysisCache = typeof aiAnalysisCache.$inferInsert;

// TODO: Add your tables here*/

/**
 * Pontuação e Faixas dos Professores (Teacher Points & Belts)
 * Sistema de gamificação profissional para professores
 */
export const teacherPoints = mysqlTable("teacher_points", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // FK para users
  totalPoints: int("totalPoints").default(0).notNull(),
  currentBelt: varchar("currentBelt", { length: 50 }).default("white").notNull(), // white, yellow, orange, green, blue, purple, brown, black
  beltLevel: int("beltLevel").default(1).notNull(), // 1-8 (Branca a Preta)
  lastBeltUpgrade: timestamp("lastBeltUpgrade"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeacherPoints = typeof teacherPoints.$inferSelect;
export type InsertTeacherPoints = typeof teacherPoints.$inferInsert;

/**
 * Histórico de Atividades dos Professores (Teacher Activities History)
 * Registra todas as atividades que geraram pontos para professores
 */
export const teacherActivitiesHistory = mysqlTable("teacher_activities_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK para users
  activityType: mysqlEnum("activityType", [
    "class_taught",        // Aula ministrada
    "planning",            // Planejamento de aula
    "grading",             // Correção de atividades
    "meeting",             // Reunião pedagógica
    "course_creation",     // Criação de plano de curso
    "material_creation",   // Criação de material didático
    "student_support",     // Atendimento a alunos
    "professional_dev",    // Desenvolvimento profissional
    "other"                // Outras atividades
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  points: int("points").notNull(),
  duration: int("duration"), // Duração em minutos
  activityDate: date("activityDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TeacherActivitiesHistory = typeof teacherActivitiesHistory.$inferSelect;
export type InsertTeacherActivitiesHistory = typeof teacherActivitiesHistory.$inferInsert;

/**
 * Histórico de Evolução de Faixas dos Professores (Teacher Belt History)
 * Registra todas as mudanças de faixa
 */
export const teacherBeltHistory = mysqlTable("teacher_belt_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK para users
  previousBelt: varchar("previousBelt", { length: 50 }).notNull(),
  newBelt: varchar("newBelt", { length: 50 }).notNull(),
  previousLevel: int("previousLevel").notNull(),
  newLevel: int("newLevel").notNull(),
  pointsAtUpgrade: int("pointsAtUpgrade").notNull(),
  upgradedAt: timestamp("upgradedAt").defaultNow().notNull(),
});

export type TeacherBeltHistory = typeof teacherBeltHistory.$inferSelect;
export type InsertTeacherBeltHistory = typeof teacherBeltHistory.$inferInsert;

export const subjects = mysqlTable("subjects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  code: varchar("code", { length: 200 }).notNull().unique(),
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
  computationalThinkingEnabled: boolean("computationalThinkingEnabled").default(false).notNull(), // Habilitar avaliação de Pensamento Computacional
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
  name: varchar("name", { length: 200 }).notNull(),
  code: varchar("code", { length: 200 }).notNull().unique(),
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
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium"), // Nível de dificuldade
  prerequisiteTopicIds: text("prerequisiteTopicIds"), // JSON array de IDs de tópicos pré-requisitos
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
  studentId: int("studentId").notNull().references(() => students.id, { onDelete: "cascade" }), // ID do aluno na tabela students
  subjectId: int("subjectId").notNull().references(() => subjects.id, { onDelete: "cascade" }), // ID da disciplina
  classId: int("classId").references(() => classes.id, { onDelete: "set null" }), // Turma específica (opcional)
  professorId: int("professorId").notNull().references(() => users.id, { onDelete: "cascade" }), // Professor responsável
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
  topicId: int("topicId"),
  moduleId: int("moduleId"),
  professorId: int("professorId").notNull(),
  subjectId: int("subjectId"), // Disciplina associada ao material
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["pdf", "video", "link", "presentation", "document", "audio", "image", "other"]).notNull(),
  contentType: mysqlEnum("contentType", ["text", "video", "exercise", "quiz", "project"]).default("text"), // Tipo de conteúdo pedagógico
  url: text("url").notNull(), // URL do arquivo ou link externo
  fileSize: int("fileSize"), // Tamanho em bytes (para uploads)
  orderIndex: int("orderIndex").default(0).notNull(),
  isRequired: boolean("isRequired").default(false).notNull(), // Material obrigatório
  downloadCount: int("downloadCount").default(0).notNull(), // Contador de downloads
  folderId: int("folderId"), // Pasta/categoria do material
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TopicMaterial = typeof topicMaterials.$inferSelect;
export type InsertTopicMaterial = typeof topicMaterials.$inferInsert;

// Pastas/categorias para organizar materiais de estudo
export const materialFolders = mysqlTable("material_folders", {
  id: int("id").autoincrement().primaryKey(),
  professorId: int("professorId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }).default("#0d9488").notNull(),
  subjectId: int("subjectId"),
  orderIndex: int("orderIndex").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MaterialFolder = typeof materialFolders.$inferSelect;
export type InsertMaterialFolder = typeof materialFolders.$inferInsert;

/**
 * Diário de Aprendizagem do Aluno
 */
export const studentLearningJournal = mysqlTable("student_learning_journal", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  topicId: int("topicId").notNull(),
  entryDate: timestamp("entryDate").defaultNow().notNull(),
  content: text("content").notNull(), // Anotações do aluno
  tags: text("tags"), // JSON array de tags para organização
  mood: mysqlEnum("mood", ["great", "good", "neutral", "confused", "frustrated"]), // Estado emocional
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentLearningJournal = typeof studentLearningJournal.$inferSelect;
export type InsertStudentLearningJournal = typeof studentLearningJournal.$inferInsert;

/**
 * Sistema de Dúvidas dos Alunos
 */
export const studentTopicDoubts = mysqlTable("student_topic_doubts", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  topicId: int("topicId"),
  subjectId: int("subjectId"),
  professorId: int("professorId").notNull(),
  question: text("question").notNull(),
  context: text("context"), // Contexto adicional da dúvida
  status: mysqlEnum("status", ["pending", "answered", "resolved"]).default("pending").notNull(),
  answer: text("answer"), // Resposta do professor
  answeredAt: timestamp("answeredAt"),
  isPrivate: boolean("isPrivate").default(true).notNull(), // Dúvida privada ou pública para turma
  seenByProfessor: boolean("seenByProfessor").default(false).notNull(), // Professor visualizou a dúvida
  seenByStudent: boolean("seenByStudent").default(false).notNull(), // Aluno visualizou a resposta
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentTopicDoubt = typeof studentTopicDoubts.$inferSelect;
export type InsertStudentTopicDoubt = typeof studentTopicDoubts.$inferInsert;

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
    "new_material",          // Novo material adicionado
    "new_assignment",        // Nova atividade criada
    "new_announcement",      // Novo aviso postado
    "assignment_due",        // Prazo de atividade próximo
    "feedback_received",     // Feedback do professor recebido
    "grade_received",        // Nota recebida
    "comment_received",      // Comentário do professor
    "assessment_published",  // Nova prova publicada
    "activity_submission",   // Aluno enviou atividade
    "new_activity",          // Nova atividade criada
    "new_mural",             // Novo mural colaborativo criado
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  link: varchar("link", { length: 500 }), // Link para o recurso relacionado
  relatedId: int("relatedId"), // ID do recurso relacionado (material, atividade, etc)
  relatedType: varchar("relatedType", { length: 50 }), // Tipo do recurso relacionado
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
  registrationNumber: varchar("registrationNumber", { length: 100 }).notNull(), // Matrícula do aluno
  fullName: varchar("fullName", { length: 300 }).notNull(), // Nome completo do aluno
  email: varchar("email", { length: 255 }), // E-mail do aluno
  birthDate: varchar("birthDate", { length: 10 }), // Data de nascimento (YYYY-MM-DD)
  gender: mysqlEnum("gender", ["masculino", "feminino", "nao_binario", "personalizar", "prefiro_nao_informar"]).default("prefiro_nao_informar"), // Gênero
  genderCustom: varchar("genderCustom", { length: 100 }), // Gênero personalizado (quando gender = 'personalizar')
  pronoun: mysqlEnum("pronoun", ["ele_dele", "ela_dela", "elu_delu", "prefiro_nao_informar"]).default("prefiro_nao_informar"), // Pronome de tratamento
  // Campos de avatar HD-2D (gamificação)
  hd2dCharacterId: int("hd2dCharacterId").default(1),
  hd2dUnlockedCharacters: text("hd2dUnlockedCharacters"), // JSON array de IDs desbloqueados
  avatarGender: varchar("avatarGender", { length: 20 }).default("male"),
  avatarSkinTone: varchar("avatarSkinTone", { length: 30 }).default("light"),
  avatarKimonoColor: varchar("avatarKimonoColor", { length: 30 }).default("white"),
  avatarHairStyle: varchar("avatarHairStyle", { length: 30 }).default("short"),
  avatarHairColor: varchar("avatarHairColor", { length: 30 }).default("black"),
  avatarKimonoStyle: varchar("avatarKimonoStyle", { length: 30 }).default("traditional"),
  avatarHeadAccessory: varchar("avatarHeadAccessory", { length: 30 }).default("none"),
  avatarExpression: varchar("avatarExpression", { length: 30 }).default("neutral"),
  avatarPose: varchar("avatarPose", { length: 30 }).default("standing"),
  specialKimono: varchar("specialKimono", { length: 30 }).default("none"),
  avatarAccessories: varchar("avatarAccessories", { length: 255 }).default("none"),
  colorTheme: varchar("colorTheme", { length: 32 }).default("default"), // Tema de cores do aluno (independente do professor)
  themeMode: varchar("themeMode", { length: 16 }).default("system"), // Modo claro/escuro/sistema do aluno
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
  isUrgent: boolean("isUrgent").default(false).notNull(), // Ignora horário silencioso
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
  honorificTitle: varchar("honorificTitle", { length: 100 }), // Título honorífico (Sensei, Mestre, etc)
  // Campos de gamificação avançada
  beltAnimationSeen: boolean("beltAnimationSeen").default(false).notNull(), // Se já viu a animação da faixa atual
  lastBeltUpgrade: timestamp("lastBeltUpgrade"), // Data da última evolução de faixa
  pointsMultiplier: double("pointsMultiplier").default(1.0).notNull(), // Multiplicador de pontos (1.0 = normal, 1.5 = 50% bonus)
  consecutivePerfectScores: int("consecutivePerfectScores").default(0).notNull(), // Sequência de 100% de acerto
  totalExercisesCompleted: int("totalExercisesCompleted").default(0).notNull(), // Total de exercícios concluídos
  totalPerfectScores: int("totalPerfectScores").default(0).notNull(), // Total de 100% de acerto
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
  activityType: varchar("activityType", { length: 150 }).notNull(), // exercise_objective, exercise_subjective, exam, etc
  relatedId: int("relatedId"), // ID da atividade relacionada (exercício, prova, etc)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PointsHistory = typeof pointsHistory.$inferSelect;
export type InsertPointsHistory = typeof pointsHistory.$inferInsert;

/**
 * Especializações dos Alunos (Student Specializations)
 * Armazena a especialização escolhida pelo aluno
 */
export const studentSpecializations = mysqlTable("student_specializations", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().unique(), // FK para students
  specialization: mysqlEnum("specialization", [
    "code_warrior",    // Guerreiro do Código (Backend/Algoritmos)
    "interface_master", // Mestre das Interfaces (Frontend/UX)
    "data_sage",       // Sábio dos Dados (Data Science/Analytics)
    "system_architect" // Arquiteto de Sistemas (DevOps/Infraestrutura)
  ]).notNull(),
  chosenAt: timestamp("chosenAt").defaultNow().notNull(),
  level: int("level").default(1).notNull(), // Nível dentro da especialização
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentSpecialization = typeof studentSpecializations.$inferSelect;
export type InsertStudentSpecialization = typeof studentSpecializations.$inferInsert;

/**
 * Skills da Árvore de Especialização (Specialization Skills)
 * Define as skills disponíveis em cada especialização
 */
export const specializationSkills = mysqlTable("specialization_skills", {
  id: int("id").autoincrement().primaryKey(),
  specialization: mysqlEnum("specialization", [
    "code_warrior",
    "interface_master",
    "data_sage",
    "system_architect"
  ]).notNull(),
  skillKey: varchar("skillKey", { length: 100 }).notNull(), // Identificador único da skill
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  tier: int("tier").notNull(), // Nível da skill (1-5)
  requiredLevel: int("requiredLevel").notNull(), // Nível mínimo para desbloquear
  bonusType: varchar("bonusType", { length: 50 }).notNull(), // points_multiplier, speed_bonus, accuracy_bonus
  bonusValue: double("bonusValue").notNull(), // Valor do bônus (ex: 1.1 = +10%)
  prerequisiteSkills: text("prerequisiteSkills"), // JSON array de skillKeys necessárias
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SpecializationSkill = typeof specializationSkills.$inferSelect;
export type InsertSpecializationSkill = typeof specializationSkills.$inferInsert;

/**
 * Skills Desbloqueadas pelos Alunos (Student Skills)
 * Registra quais skills cada aluno desbloqueou
 */
export const studentSkills = mysqlTable("student_skills", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  skillId: int("skillId").notNull(), // FK para specialization_skills
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  isActive: boolean("isActive").default(true).notNull(), // Skill ativa
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StudentSkill = typeof studentSkills.$inferSelect;
export type InsertStudentSkill = typeof studentSkills.$inferInsert;

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
 * Histórico de Evolução de Faixas (Belt History)
 * Registra todas as conquistas de novas faixas pelos alunos
 */
export const beltHistory = mysqlTable("belt_history", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  belt: varchar("belt", { length: 50 }).notNull(), // white, yellow, orange, green, blue, purple, brown, black
  pointsAtAchievement: int("pointsAtAchievement").notNull(), // Pontos totais quando conquistou a faixa
  achievedAt: timestamp("achievedAt").defaultNow().notNull(),
});

export type BeltHistory = typeof beltHistory.$inferSelect;
export type InsertBeltHistory = typeof beltHistory.$inferInsert;

/**
 * Faixas de Karatê (Belts System)
 * Define todas as faixas disponíveis com requisitos de pontos
 */
export const belts = mysqlTable("belts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(), // white, yellow, orange, green, blue, purple, brown, black
  displayName: varchar("displayName", { length: 100 }).notNull(), // Nome em português
  level: int("level").notNull().unique(), // 1-8
  color: varchar("color", { length: 7 }).notNull(), // Cor hex
  pointsRequired: int("pointsRequired").notNull(), // Pontos necessários para alcançar
  description: text("description"), // Descrição da faixa
  icon: varchar("icon", { length: 50 }), // Ícone/emoji da faixa
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Belt = typeof belts.$inferSelect;
export type InsertBelt = typeof belts.$inferInsert;

/**
 * Progresso do Aluno (Student Progress)
 * Armazena progresso detalhado, multiplicadores e estatísticas
 */
export const studentProgress = mysqlTable("student_progress", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().unique(), // FK para students
  currentBeltId: int("currentBeltId").notNull(), // FK para belts
  totalPoints: int("totalPoints").default(0).notNull(),
  pointsInCurrentBelt: int("pointsInCurrentBelt").default(0).notNull(), // Pontos desde a última evolução
  pointsMultiplier: double("pointsMultiplier").default(1.0).notNull(), // Multiplicador ativo
  streakDays: int("streakDays").default(0).notNull(),
  lastActivityDate: date("lastActivityDate"),
  totalExercisesCompleted: int("totalExercisesCompleted").default(0).notNull(),
  totalPerfectScores: int("totalPerfectScores").default(0).notNull(),
  consecutivePerfectScores: int("consecutivePerfectScores").default(0).notNull(),
  fastestExerciseTime: int("fastestExerciseTime"), // Tempo em segundos
  averageAccuracy: double("averageAccuracy").default(0.0).notNull(), // 0-100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentProgress = typeof studentProgress.$inferSelect;
export type InsertStudentProgress = typeof studentProgress.$inferInsert;

/**
 * Conquistas Disponíveis (Achievements)
 * Catálogo de todas as conquistas desbloqueáveis
 */
export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(), // Emoji ou classe de ícone
  category: mysqlEnum("category", ["speed", "accuracy", "streak", "completion", "special"]).notNull(),
  requirement: int("requirement").notNull(), // Valor necessário para desbloquear
  rewardPoints: int("rewardPoints").default(0).notNull(), // Pontos bônus ao desbloquear
  rewardMultiplier: double("rewardMultiplier").default(0.0).notNull(), // Multiplicador bônus (ex: 0.1 = +10%)
  isHidden: boolean("isHidden").default(false).notNull(), // Conquista secreta
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

/**
 * Conquistas Desbloqueadas (Student Achievements)
 * Relaciona alunos com conquistas que desbloquearam
 */
export const studentAchievements = mysqlTable("student_achievements", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  achievementId: int("achievementId").notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  notificationSeen: boolean("notificationSeen").default(false).notNull(),
}, (table) => ({
  uniqueAchievement: sql`UNIQUE KEY unique_student_achievement (studentId, achievementId)`,
}));

export type StudentAchievement = typeof studentAchievements.$inferSelect;
export type InsertStudentAchievement = typeof studentAchievements.$inferInsert;

/**
 * Histórico de Level Up (Level Up History)
 * Registra todas as evoluções de faixa com detalhes
 */
export const levelUpHistory = mysqlTable("level_up_history", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  fromBeltId: int("fromBeltId").notNull(),
  toBeltId: int("toBeltId").notNull(),
  pointsAtLevelUp: int("pointsAtLevelUp").notNull(),
  timeTaken: int("timeTaken"), // Tempo em dias para evoluir
  celebrationSeen: boolean("celebrationSeen").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LevelUpHistory = typeof levelUpHistory.$inferSelect;
export type InsertLevelUpHistory = typeof levelUpHistory.$inferInsert;

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
  subjectId: int("subjectId").notNull(), // FK para subjects
  dimension: mysqlEnum("dimension", ["decomposition", "pattern_recognition", "abstraction", "algorithms"]).notNull(),
  score: int("score").default(0).notNull(), // Pontuação de 0-100
  exercisesCompleted: int("exercisesCompleted").default(0).notNull(), // Quantidade de exercícios completados
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  uniqueStudentSubjectDimension: unique().on(table.studentId, table.subjectId, table.dimension), // Um registro por aluno por disciplina por dimensão
}));

export type ComputationalThinkingScore = typeof computationalThinkingScores.$inferSelect;
export type InsertComputationalThinkingScore = typeof computationalThinkingScores.$inferInsert;

/**
 * Exercícios de Pensamento Computacional
 * Banco de exercícios específicos para cada dimensão
 */
export const ctExercises = mysqlTable("ct_exercises", {
  id: int("id").autoincrement().primaryKey(),
  subjectId: int("subjectId").notNull(), // FK para subjects
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
  subjectId: int("subjectId").notNull(), // FK para subjects
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
  moduleId: int("moduleId"), // Módulo da trilha de aprendizagem (pode ser null)
  subjectId: int("subjectId").notNull(), // Disciplina
  topicId: int("topicId"), // Tópico da trilha (pode ser null)
  teacherId: int("teacherId").notNull(), // Professor que criou
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  exerciseData: json("exerciseData"), // JSON com as questões geradas
  totalQuestions: int("totalQuestions").notNull().default(0),
  totalPoints: int("totalPoints").notNull().default(0),
  passingScore: int("passingScore").default(60).notNull(), // Nota mínima para passar (%)
  exerciseType: mysqlEnum("exerciseType", ["multiple_choice", "true_false", "fill_blank", "matching", "ordering", "essay", "short_answer"]).default("multiple_choice").notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard", "expert"]).default("medium").notNull(),
  points: int("points").default(10).notNull(),
  timeLimit: int("timeLimit"), // Tempo limite em minutos (null = sem limite)
  maxAttempts: int("maxAttempts").default(3), // Número máximo de tentativas
  showAnswersAfter: boolean("showAnswersAfter").default(true).notNull(), // Mostrar gabarito após conclusão
  shuffleQuestions: boolean("shuffleQuestions").default(false).notNull(), // Embaralhar questões por aluno (anti-cola)
  shuffleAlternatives: boolean("shuffleAlternatives").default(false).notNull(), // Embaralhar alternativas A,B,C,D (anti-cola)
  availableFrom: timestamp("availableFrom"),
  availableTo: timestamp("availableTo"),
  isActive: boolean("isActive").default(true).notNull(),
  tags: json("tags"),
  metadata: json("metadata"),
  status: varchar("status", { length: 50 }).default("draft").notNull(),
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
  studentId: int("studentId").notNull(),
  exerciseId: int("exerciseId").notNull(),
  score: int("score").notNull().default(0),
  maxScore: int("maxScore").notNull().default(100),
  timeSpent: int("timeSpent").notNull().default(0),
  attemptNumber: int("attemptNumber").notNull().default(1),
  status: mysqlEnum("status", ["in_progress", "completed", "abandoned"]).default("in_progress").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StudentExerciseAttempt = typeof studentExerciseAttempts.$inferSelect;
export type InsertStudentExerciseAttempt = typeof studentExerciseAttempts.$inferInsert;

/**
 * Respostas individuais por questão (para análise detalhada)
 */
export const studentExerciseAnswers = mysqlTable("student_exercise_answers", {
  id: int("id").autoincrement().primaryKey(),
  attemptId: int("attemptId").notNull(),
  exerciseId: int("exerciseId").notNull(),
  studentId: int("studentId").notNull(),
  questionText: text("questionText").notNull(),
  correctAnswer: text("correctAnswer").notNull(),
  studentAnswer: text("studentAnswer"),
  isCorrect: boolean("isCorrect").notNull().default(false),
  pointsEarned: int("pointsEarned").notNull().default(0),
  maxPoints: int("maxPoints").notNull().default(10),
  explanation: text("explanation"),
  feedback: text("feedback"),
  timeSpent: int("timeSpent").notNull().default(0),
  options: json("options"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StudentExerciseAnswer = typeof studentExerciseAnswers.$inferSelect;
export type InsertStudentExerciseAnswer = typeof studentExerciseAnswers.$inferInsert;

/**
 * Sessões de revisão de questões erradas
 */
export const reviewSessions = mysqlTable("review_sessions", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  subjectId: int("subjectId"),
  moduleId: int("moduleId"),
  totalQuestionsReviewed: int("totalQuestionsReviewed").default(0).notNull(),
  questionsRetaken: int("questionsRetaken").default(0).notNull(),
  improvementRate: int("improvementRate").default(0).notNull(), // Porcentagem de melhoria após revisão
  sessionDuration: int("sessionDuration").default(0).notNull(), // Duração em minutos
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReviewSession = typeof reviewSessions.$inferSelect;
export type InsertReviewSession = typeof reviewSessions.$inferInsert;


/**
 * Itens da loja (avatares, power-ups, certificados, etc)
 */
export const shopItems = mysqlTable("shop_items", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["hat", "glasses", "accessory", "background", "special", "power_up", "certificate", "unlock"]).notNull(),
  price: int("price").notNull(), // Preço em Tech Coins
  imageUrl: text("imageUrl"), // URL da imagem do item
  svgData: text("svgData"), // Dados SVG para renderização no avatar
  metadata: json("metadata"), // Configurações específicas do item
  requiredBelt: varchar("requiredBelt", { length: 20 }).default("white"), // Faixa mínima necessária
  requiredPoints: int("requiredPoints").default(0).notNull(), // Pontos mínimos necessários
  isActive: boolean("isActive").default(true).notNull(),
  rarity: mysqlEnum("rarity", ["common", "rare", "epic", "legendary"]).default("common").notNull(),
  stock: int("stock").default(-1).notNull(), // -1 = ilimitado
  sortOrder: int("sortOrder").default(0).notNull(), // Ordem de exibição
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShopItem = typeof shopItems.$inferSelect;
export type InsertShopItem = typeof shopItems.$inferInsert;

/**
 * Itens comprados pelos alunos
 */
export const studentPurchasedItems = mysqlTable("student_purchased_items", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  itemId: int("itemId").notNull(),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  isEquipped: boolean("isEquipped").default(false).notNull(),
}, (table) => ({
  uniquePurchase: unique().on(table.studentId, table.itemId),
}));

export type StudentPurchasedItem = typeof studentPurchasedItems.$inferSelect;
export type InsertStudentPurchasedItem = typeof studentPurchasedItems.$inferInsert;

/**
 * Itens equipados pelos alunos (atualmente em uso no avatar)
 */
export const studentEquippedItems = mysqlTable("student_equipped_items", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  itemId: int("itemId").notNull(),
  slot: mysqlEnum("slot", ["hat", "glasses", "accessory", "background"]).notNull(),
  equippedAt: timestamp("equippedAt").defaultNow().notNull(),
}, (table) => ({
  uniqueSlot: unique().on(table.studentId, table.slot),
}));

export type StudentEquippedItem = typeof studentEquippedItems.$inferSelect;
export type InsertStudentEquippedItem = typeof studentEquippedItems.$inferInsert;


/**
 * ===== SISTEMA DE TECH COINS (ECONOMIA VIRTUAL) =====
 */

/**
 * Carteira de moedas do aluno
 */
export const studentWallets = mysqlTable("student_wallets", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().unique(),
  techCoins: int("techCoins").default(0).notNull(),
  totalEarned: int("totalEarned").default(0).notNull(), // Total histórico ganho
  totalSpent: int("totalSpent").default(0).notNull(),  // Total histórico gasto
  lastTransactionAt: timestamp("lastTransactionAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StudentWallet = typeof studentWallets.$inferSelect;
export type InsertStudentWallet = typeof studentWallets.$inferInsert;

/**
 * Histórico de transações de moedas
 */
export const coinTransactions = mysqlTable("coin_transactions", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  amount: int("amount").notNull(), // Positivo = ganhou, Negativo = gastou
  transactionType: mysqlEnum("transactionType", ["earn", "spend", "bonus", "penalty"]).notNull(),
  source: varchar("source", { length: 100 }), // 'exercise_completion', 'daily_streak', 'shop_purchase', etc
  description: text("description"),
  metadata: json("metadata"), // Dados adicionais (exercise_id, item_id, etc)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoinTransaction = typeof coinTransactions.$inferSelect;
export type InsertCoinTransaction = typeof coinTransactions.$inferInsert;


/**
 * Conquistas Ocultas (Easter Eggs)
 */
export const hiddenAchievements = mysqlTable("hidden_achievements", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // Código único (ex: 'curious_clicker')
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(), // Emoji ou ícone
  rewardCoins: int("rewardCoins").default(0).notNull(),
  rarity: mysqlEnum("rarity", ["common", "rare", "epic", "legendary"]).default("common").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HiddenAchievement = typeof hiddenAchievements.$inferSelect;
export type InsertHiddenAchievement = typeof hiddenAchievements.$inferInsert;

/**
 * Conquistas Ocultas desbloqueadas pelos alunos
 */
export const studentHiddenAchievements = mysqlTable("student_hidden_achievements", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  achievementId: int("achievementId").notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  progress: int("progress").default(0), // Para conquistas com progresso (ex: 50/100 cliques)
});

export type StudentHiddenAchievement = typeof studentHiddenAchievements.$inferSelect;
export type InsertStudentHiddenAchievement = typeof studentHiddenAchievements.$inferInsert;

/**
 * Rastreamento de ações dos alunos (para conquistas ocultas)
 */
export const studentActions = mysqlTable("student_actions", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  actionType: varchar("actionType", { length: 50 }).notNull(), // 'avatar_click', 'page_visit', 'exercise_complete', etc
  actionData: json("actionData"), // Dados adicionais da ação
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StudentAction = typeof studentActions.$inferSelect;
export type InsertStudentAction = typeof studentActions.$inferInsert;


/**
 * Desafios Semanais CTF (Capture The Flag)
 */
export const weeklyChallenges = mysqlTable("weekly_challenges", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  challengeType: mysqlEnum("challengeType", ["code", "logic", "speed", "precision", "collaborative"]).notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard", "expert"]).default("medium").notNull(),
  coinMultiplier: float("coinMultiplier").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(), // Professor que criou
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeeklyChallenge = typeof weeklyChallenges.$inferSelect;
export type InsertWeeklyChallenge = typeof weeklyChallenges.$inferInsert;

/**
 * Submissões de desafios
 */
export const challengeSubmissions = mysqlTable("challenge_submissions", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  studentId: int("studentId").notNull(),
  score: int("score").default(0).notNull(),
  completionTime: int("completionTime"), // Tempo em segundos
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
});

export type ChallengeSubmission = typeof challengeSubmissions.$inferSelect;
export type InsertChallengeSubmission = typeof challengeSubmissions.$inferInsert;

/**
 * Ranking semanal de desafios
 */
export const challengeRankings = mysqlTable("challenge_rankings", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  studentId: int("studentId").notNull(),
  rank: int("rank").notNull(),
  totalScore: int("totalScore").notNull(),
  rewardCoins: int("rewardCoins").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChallengeRanking = typeof challengeRankings.$inferSelect;
export type InsertChallengeRanking = typeof challengeRankings.$inferInsert;

/**
 * Projetos Interdisciplinares (Perfil Interativo)
 */
export const interactiveProjects = mysqlTable("interactive_projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Professor criador
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  objectives: text("objectives"), // Objetivos pedagógicos
  subjects: text("subjects"), // Disciplinas envolvidas (JSON array)
  methodology: varchar("methodology", { length: 100 }), // PBL, Design Thinking, etc.
  startDate: date("startDate"),
  endDate: date("endDate"),
  status: mysqlEnum("status", ["planning", "active", "completed", "cancelled"]).default("planning").notNull(),
  deliverables: text("deliverables"), // Entregas esperadas (JSON array)
  resources: text("resources"), // Links de recursos (JSON array)
  color: varchar("color", { length: 7 }).default("#3b82f6"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InteractiveProject = typeof interactiveProjects.$inferSelect;
export type InsertInteractiveProject = typeof interactiveProjects.$inferInsert;

/**
 * Relação N:N entre Projetos e Alunos
 */
export const projectStudents = mysqlTable("project_students", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  studentId: int("studentId").notNull(),
  role: varchar("role", { length: 100 }), // Papel do aluno no projeto
  contribution: text("contribution"), // Descrição da contribuição
  engagementScore: int("engagementScore").default(0), // 0-100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectStudent = typeof projectStudents.$inferSelect;
export type InsertProjectStudent = typeof projectStudents.$inferInsert;

/**
 * Ferramentas Colaborativas (biblioteca expandida)
 */
export const collaborativeTools = mysqlTable("collaborative_tools", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(), // Quiz, Colaboração, Apresentação, Mapa Mental, etc.
  url: text("url").notNull(),
  logoUrl: text("logoUrl"),
  tips: text("tips"), // Dicas de uso pedagógico
  isPremium: boolean("isPremium").default(false).notNull(), // Ferramenta paga?
  isFavorite: boolean("isFavorite").default(false).notNull(),
  usageCount: int("usageCount").default(0).notNull(), // Contador de usos
  tags: text("tags"), // Tags para busca (JSON array)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CollaborativeTool = typeof collaborativeTools.$inferSelect;
export type InsertCollaborativeTool = typeof collaborativeTools.$inferInsert;

/**
 * Atividades de Projetos (tarefas dentro de projetos)
 */
export const projectActivities = mysqlTable("project_activities", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: date("dueDate"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  assignedStudents: text("assignedStudents"), // IDs dos alunos (JSON array)
  toolId: int("toolId"), // Ferramenta colaborativa usada (opcional)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectActivity = typeof projectActivities.$inferSelect;
export type InsertProjectActivity = typeof projectActivities.$inferInsert;


/**
 * ==================== GAMIFICAÇÃO AVANÇADA ====================
 * Sistema de badges por módulo, conquistas por especialização e recomendações personalizadas
 */

/**
 * Badges por Módulo (Module Badges)
 * Badges conquistados ao completar módulos com diferentes níveis de desempenho
 */
export const moduleBadges = mysqlTable("module_badges", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  moduleId: int("moduleId").notNull(), // FK para learning_modules
  badgeLevel: mysqlEnum("badgeLevel", ["bronze", "silver", "gold", "platinum"]).notNull(),
  completionPercentage: int("completionPercentage").notNull(), // 0-100
  averageScore: int("averageScore").notNull(), // 0-100
  timeSpent: int("timeSpent").notNull(), // Tempo total em minutos
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
}, (table) => ({
  uniqueStudentModule: unique().on(table.studentId, table.moduleId), // Um badge por aluno por módulo
}));

export type ModuleBadge = typeof moduleBadges.$inferSelect;
export type InsertModuleBadge = typeof moduleBadges.$inferInsert;

/**
 * Conquistas por Especialização (Specialization Achievements)
 * Conquistas únicas para cada especialização (Code Warrior, Interface Master, Data Sage, System Architect)
 */
export const specializationAchievements = mysqlTable("specialization_achievements", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(), // Ex: "code_warrior_algorithm_master"
  specialization: mysqlEnum("specialization", [
    "code_warrior",
    "interface_master",
    "data_sage",
    "system_architect"
  ]).notNull(),
  name: varchar("name", { length: 255 }).notNull(), // Ex: "Mestre Algoritmos"
  description: text("description").notNull(),
  icon: varchar("icon", { length: 100 }).notNull(), // Nome do ícone
  rarity: mysqlEnum("rarity", ["common", "rare", "epic", "legendary"]).notNull(),
  requirement: text("requirement").notNull(), // JSON com critérios de desbloqueio
  points: int("points").default(50).notNull(), // Pontos ganhos ao desbloquear
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SpecializationAchievement = typeof specializationAchievements.$inferSelect;
export type InsertSpecializationAchievement = typeof specializationAchievements.$inferInsert;

/**
 * Conquistas de Especialização Desbloqueadas pelos Alunos (Student Specialization Achievements)
 * Relaciona alunos com conquistas de especialização que desbloquearam
 */
export const studentSpecializationAchievements = mysqlTable("student_specialization_achievements", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  achievementId: int("achievementId").notNull(), // FK para specialization_achievements
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  progress: int("progress").default(100).notNull(), // 0-100 (100 = completo)
}, (table) => ({
  uniqueStudentAchievement: unique().on(table.studentId, table.achievementId),
}));

export type StudentSpecializationAchievement = typeof studentSpecializationAchievements.$inferSelect;
export type InsertStudentSpecializationAchievement = typeof studentSpecializationAchievements.$inferInsert;

/**
 * Recomendações Personalizadas de Aprendizagem (Learning Recommendations)
 * Sistema de IA que sugere próximos tópicos baseado no perfil do aluno
 */
export const learningRecommendations = mysqlTable("learning_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  topicId: int("topicId").notNull(), // FK para learning_topics
  reason: text("reason").notNull(), // Explicação da recomendação
  confidence: int("confidence").notNull(), // 0-100 (confiança da IA)
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).notNull(),
  basedOn: text("basedOn").notNull(), // JSON com fatores considerados
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "completed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearningRecommendation = typeof learningRecommendations.$inferSelect;
export type InsertLearningRecommendation = typeof learningRecommendations.$inferInsert;

/**
 * Histórico de Progresso por Tópico (Topic Progress History)
 * Armazena dados históricos de desempenho para análise de IA
 */
export const topicProgressHistory = mysqlTable("topic_progress_history", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  topicId: int("topicId").notNull(), // FK para learning_topics
  score: int("score").notNull(), // 0-100
  timeSpent: int("timeSpent").notNull(), // Tempo em minutos
  attemptsCount: int("attemptsCount").default(1).notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type TopicProgressHistory = typeof topicProgressHistory.$inferSelect;
export type InsertTopicProgressHistory = typeof topicProgressHistory.$inferInsert;

/**
 * Preferências de Dashboard do Professor
 */
export const dashboardPreferences = mysqlTable("dashboard_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // ID do professor
  quickActionsConfig: text("quickActionsConfig").notNull(), // JSON com configuração das ações rápidas
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DashboardPreference = typeof dashboardPreferences.$inferSelect;
export type InsertDashboardPreference = typeof dashboardPreferences.$inferInsert;

/**
 * Sistema de Análise de Aprendizado com IA
 * Monitora comportamento, padrões e evolução dos alunos
 */

/**
 * Comportamentos dos Alunos
 * Registra ações e comportamentos observados
 */
export const studentBehaviors = mysqlTable("student_behaviors", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  userId: int("userId").notNull(), // FK para users (professor)
  subjectId: int("subjectId"), // FK para subjects (opcional)
  behaviorType: mysqlEnum("behaviorType", [
    "exercise_completion",    // Conclusão de exercício
    "quiz_attempt",           // Tentativa de quiz
    "topic_access",           // Acesso a tópico
    "material_download",      // Download de material
    "doubt_posted",           // Dúvida postada
    "comment_posted",         // Comentário postado
    "assignment_submission",  // Submissão de tarefa
    "attendance",             // Presença em aula
    "late_submission",        // Submissão atrasada
    "improvement_shown",      // Melhoria demonstrada
    "struggle_detected",      // Dificuldade detectada
    "engagement_high",        // Alto engajamento
    "engagement_low"          // Baixo engajamento
  ]).notNull(),
  behaviorData: json("behaviorData"), // Dados adicionais do comportamento (JSON)
  score: float("score"), // Pontuação associada (se aplicável)
  metadata: text("metadata"), // Metadados adicionais
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type StudentBehavior = typeof studentBehaviors.$inferSelect;
export type InsertStudentBehavior = typeof studentBehaviors.$inferInsert;

/**
 * Padrões de Aprendizado Identificados
 * Armazena padrões detectados pela IA
 */
export const learningPatterns = mysqlTable("learning_patterns", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  userId: int("userId").notNull(), // FK para users (professor)
  subjectId: int("subjectId"), // FK para subjects (opcional)
  patternType: mysqlEnum("patternType", [
    "learning_pace",          // Ritmo de aprendizado
    "preferred_time",         // Horário preferido
    "difficulty_areas",       // Áreas de dificuldade
    "strength_areas",         // Áreas de força
    "engagement_pattern",     // Padrão de engajamento
    "submission_pattern",     // Padrão de submissão
    "improvement_trend",      // Tendência de melhoria
    "struggle_pattern",       // Padrão de dificuldade
    "consistency",            // Consistência
    "collaboration"           // Colaboração
  ]).notNull(),
  patternDescription: text("patternDescription").notNull(), // Descrição do padrão
  confidence: float("confidence").notNull(), // Confiança da IA (0-1)
  evidence: json("evidence"), // Evidências que suportam o padrão (JSON)
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});

export type LearningPattern = typeof learningPatterns.$inferSelect;
export type InsertLearningPattern = typeof learningPatterns.$inferInsert;

/**
 * Insights Gerados pela IA
 * Armazena insights e recomendações personalizadas
 */
export const aiInsights = mysqlTable("ai_insights", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId"), // FK para students
  teacherId: int("teacherId"), // FK para users (professor) - coluna legada
  userId: int("userId"), // FK para users (professor)
  subjectId: int("subjectId"), // FK para subjects (opcional)
  insightType: varchar("insightType", { length: 100 }).notNull().default("recommendation"),
  title: varchar("title", { length: 255 }).notNull(), // Título do insight
  description: text("description"), // Descrição detalhada
  actionable: boolean("actionable").default(false).notNull(), // Se requer ação
  actionSuggestion: text("actionSuggestion"), // Sugestão de ação
  confidence: float("confidence").notNull().default(0.5), // Confiança da IA (0-1)
  relatedData: json("relatedData"), // Dados relacionados (JSON)
  dismissed: boolean("dismissed").default(false).notNull(), // Se foi dispensado pelo professor
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  content: text("content"), // Conteúdo legado
  priority: varchar("priority", { length: 20 }).notNull().default("medium"),
  isRead: boolean("isRead").default(false).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AIInsight = typeof aiInsights.$inferSelect;
export type InsertAIInsight = typeof aiInsights.$inferInsert;

/**
 * Métricas de Desempenho
 * Armazena métricas calculadas periodicamente
 */
export const performanceMetrics = mysqlTable("performance_metrics", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  userId: int("userId").notNull(), // FK para users (professor)
  subjectId: int("subjectId"), // FK para subjects (opcional)
  metricType: mysqlEnum("metricType", [
    "overall_performance",    // Desempenho geral
    "exercise_accuracy",      // Precisão em exercícios
    "quiz_performance",       // Desempenho em quizzes
    "attendance_rate",        // Taxa de presença
    "submission_rate",        // Taxa de submissão
    "engagement_score",       // Pontuação de engajamento
    "improvement_rate",       // Taxa de melhoria
    "consistency_score",      // Pontuação de consistência
    "collaboration_score",    // Pontuação de colaboração
    "ct_skills"               // Habilidades de PC
  ]).notNull(),
  value: double("value").notNull(), // Valor da métrica
  previousValue: double("previousValue"), // Valor anterior (para comparação)
  trend: mysqlEnum("trend", ["improving", "stable", "declining"]), // Tendência
  percentile: float("percentile"), // Percentil em relação à turma
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
  periodStart: date("periodStart").notNull(), // Início do período
  periodEnd: date("periodEnd").notNull(), // Fim do período
});

export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;

/**
 * Alertas Automáticos
 * Sistema de alertas e notificações inteligentes
 */
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // FK para users (professor)
  studentId: int("studentId"), // FK para students
  subjectId: int("subjectId"), // FK para subjects (opcional)
  alertType: varchar("alertType", { length: 50 }).notNull().default("needs_attention"),
  title: varchar("title", { length: 255 }).notNull(), // Título do alerta
  message: text("message").notNull(), // Mensagem detalhada
  recommendedAction: text("recommendedAction"), // Ação recomendada
  relatedInsightId: int("relatedInsightId"), // FK para aiInsights (opcional)
  acknowledged: boolean("acknowledged").default(false).notNull(), // Se foi reconhecido
  acknowledgedAt: timestamp("acknowledgedAt"), // Quando foi reconhecido
  resolved: boolean("resolved").default(false).notNull(), // Se foi resolvido
  resolvedAt: timestamp("resolvedAt"), // Quando foi resolvido
  notes: text("notes"), // Notas do professor
  severity: varchar("severity", { length: 20 }).notNull().default("info"),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

/**
 * Dúvidas dos Alunos
 * Sistema de perguntas e respostas entre alunos e professores
 */
export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  userId: int("userId").notNull(), // FK para users (professor)
  subjectId: int("subjectId").notNull(), // FK para subjects
  classId: int("classId"), // FK para classes (opcional)
  title: varchar("title", { length: 255 }).notNull(), // Título/assunto da dúvida
  content: text("content").notNull(), // Conteúdo detalhado da dúvida
  status: mysqlEnum("status", ["pending", "answered", "resolved"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  isAnonymous: boolean("isAnonymous").default(false).notNull(), // Se a dúvida é anônima
  viewCount: int("viewCount").default(0).notNull(), // Número de visualizações
  answeredAt: timestamp("answeredAt"), // Quando foi respondida
  resolvedAt: timestamp("resolvedAt"), // Quando foi marcada como resolvida
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;

/**
 * Respostas às Dúvidas
 * Respostas dos professores às dúvidas dos alunos
 */
export const questionAnswers = mysqlTable("question_answers", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("questionId").notNull(), // FK para questions
  userId: int("userId").notNull(), // FK para users (professor que respondeu)
  content: text("content").notNull(), // Conteúdo da resposta
  isAccepted: boolean("isAccepted").default(false).notNull(), // Se foi marcada como resposta aceita
  helpful: int("helpful").default(0).notNull(), // Contador de "útil"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuestionAnswer = typeof questionAnswers.$inferSelect;
export type InsertQuestionAnswer = typeof questionAnswers.$inferInsert;

/**
 * ========================================
 * SISTEMA DE REVISÃO INTELIGENTE
 * ========================================
 * Implementa algoritmo de repetição espaçada (Spaced Repetition System)
 * para otimizar o aprendizado dos alunos através de revisões programadas
 */

/**
 * Fila de Revisão Inteligente
 * Armazena exercícios priorizados para cada aluno baseado em desempenho
 */
export const smartReviewQueue = mysqlTable("smart_review_queue", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  answerId: int("answerId").notNull(), // FK para student_exercise_answers
  exerciseId: int("exerciseId").notNull(), // FK para student_exercises
  subjectId: int("subjectId").notNull(), // FK para subjects
  
  // Algoritmo de Repetição Espaçada
  easeFactor: float("easeFactor").default(2.5).notNull(), // Fator de facilidade (1.3 - 2.5+)
  interval: int("interval").default(1).notNull(), // Intervalo até próxima revisão (em dias)
  repetitions: int("repetitions").default(0).notNull(), // Número de repetições bem-sucedidas
  
  // Priorização
  priority: int("priority").default(50).notNull(), // Prioridade 0-100 (maior = mais urgente)
  difficultyScore: int("difficultyScore").default(50).notNull(), // Dificuldade percebida 0-100
  
  // Datas de Controle
  lastReviewedAt: timestamp("lastReviewedAt"), // Última revisão
  nextReviewDate: timestamp("nextReviewDate").notNull(), // Próxima revisão programada
  addedToQueueAt: timestamp("addedToQueueAt").defaultNow().notNull(),
  
  // Metadados
  reviewCount: int("reviewCount").default(0).notNull(), // Total de revisões realizadas
  successRate: int("successRate").default(0).notNull(), // Taxa de acerto nas revisões (0-100)
  status: mysqlEnum("status", ["pending", "reviewing", "mastered", "archived"]).default("pending").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // Índice único: cada resposta aparece apenas uma vez na fila por aluno
  uniqueStudentAnswer: unique().on(table.studentId, table.answerId),
}));

export type SmartReviewQueue = typeof smartReviewQueue.$inferSelect;
export type InsertSmartReviewQueue = typeof smartReviewQueue.$inferInsert;

/**
 * Histórico de Revisões
 * Registra cada sessão de revisão do aluno
 */
export const reviewHistory = mysqlTable("review_history", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  queueItemId: int("queueItemId").notNull(), // FK para smart_review_queue
  answerId: int("answerId").notNull(), // FK para student_exercise_answers
  exerciseId: int("exerciseId").notNull(),
  
  // Resultado da Revisão
  wasCorrect: boolean("wasCorrect").notNull(), // Acertou na revisão?
  timeSpent: int("timeSpent").notNull(), // Tempo gasto em segundos
  confidenceLevel: int("confidenceLevel"), // Nível de confiança do aluno (1-5)
  
  // Feedback do Aluno
  selfRating: mysqlEnum("selfRating", ["again", "hard", "good", "easy"]), // Auto-avaliação (estilo Anki)
  notes: text("notes"), // Anotações do aluno durante revisão
  
  // Atualização do Algoritmo
  previousEaseFactor: float("previousEaseFactor"),
  newEaseFactor: float("newEaseFactor"),
  previousInterval: int("previousInterval"),
  newInterval: int("newInterval"),
  
  reviewedAt: timestamp("reviewedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReviewHistory = typeof reviewHistory.$inferSelect;
export type InsertReviewHistory = typeof reviewHistory.$inferInsert;

/**
 * Estatísticas de Revisão por Aluno
 * Agregação de métricas de desempenho em revisões
 */
export const reviewStatistics = mysqlTable("review_statistics", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().unique(),
  subjectId: int("subjectId"), // null = estatísticas gerais
  
  // Métricas Gerais
  totalReviewsCompleted: int("totalReviewsCompleted").default(0).notNull(),
  totalTimeSpent: int("totalTimeSpent").default(0).notNull(), // Em segundos
  averageSessionTime: int("averageSessionTime").default(0).notNull(), // Em segundos
  
  // Taxa de Sucesso
  correctReviews: int("correctReviews").default(0).notNull(),
  incorrectReviews: int("incorrectReviews").default(0).notNull(),
  successRate: int("successRate").default(0).notNull(), // Porcentagem 0-100
  
  // Streak e Consistência
  currentStreak: int("currentStreak").default(0).notNull(), // Dias consecutivos
  longestStreak: int("longestStreak").default(0).notNull(),
  lastReviewDate: date("lastReviewDate"),
  
  // Progresso
  itemsMastered: int("itemsMastered").default(0).notNull(), // Itens dominados
  itemsInProgress: int("itemsInProgress").default(0).notNull(),
  itemsPending: int("itemsPending").default(0).notNull(),
  
  // Metas e Desempenho
  dailyGoal: int("dailyGoal").default(10).notNull(), // Meta diária de revisões
  weeklyGoal: int("weeklyGoal").default(50).notNull(),
  dailyProgress: int("dailyProgress").default(0).notNull(), // Progresso do dia atual
  weeklyProgress: int("weeklyProgress").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReviewStatistics = typeof reviewStatistics.$inferSelect;
export type InsertReviewStatistics = typeof reviewStatistics.$inferInsert;

/**
 * Tags de Conteúdo para Organização
 * Permite categorizar exercícios e respostas para revisão temática
 */
export const contentTags = mysqlTable("content_tags", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Professor que criou a tag
  subjectId: int("subjectId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3b82f6"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  uniqueTag: unique().on(table.userId, table.subjectId, table.name),
}));

export type ContentTag = typeof contentTags.$inferSelect;
export type InsertContentTag = typeof contentTags.$inferInsert;

/**
 * Relacionamento entre Exercícios e Tags
 */
export const exerciseTags = mysqlTable("exercise_tags", {
  id: int("id").autoincrement().primaryKey(),
  exerciseId: int("exerciseId").notNull(), // FK para student_exercises
  tagId: int("tagId").notNull(), // FK para content_tags
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  uniqueExerciseTag: unique().on(table.exerciseId, table.tagId),
}));

export type ExerciseTag = typeof exerciseTags.$inferSelect;
export type InsertExerciseTag = typeof exerciseTags.$inferInsert;

/**
 * Sessões de Estudo do Aluno
 * Registra sessões completas de revisão para analytics
 */
export const studySessions = mysqlTable("study_sessions", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  subjectId: int("subjectId"),
  
  // Dados da Sessão
  sessionType: mysqlEnum("sessionType", ["quick_review", "full_review", "focused_practice", "random_practice"]).notNull(),
  totalItems: int("totalItems").default(0).notNull(),
  itemsCompleted: int("itemsCompleted").default(0).notNull(),
  itemsCorrect: int("itemsCorrect").default(0).notNull(),
  
  // Tempo
  totalTime: int("totalTime").default(0).notNull(), // Em segundos
  averageTimePerItem: int("averageTimePerItem").default(0).notNull(),
  
  // Resultado
  sessionScore: int("sessionScore").default(0).notNull(), // Porcentagem 0-100
  pointsEarned: int("pointsEarned").default(0).notNull(),
  
  // Controle
  status: mysqlEnum("status", ["in_progress", "completed", "abandoned"]).default("in_progress").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudySession = typeof studySessions.$inferSelect;
export type InsertStudySession = typeof studySessions.$inferInsert;

/**
 * Notificações de Revisão
 * Lembretes automáticos para o aluno revisar conteúdo
 */
export const reviewNotifications = mysqlTable("review_notifications", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  
  // Conteúdo da Notificação
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  notificationType: mysqlEnum("notificationType", [
    "daily_reminder",
    "overdue_items",
    "streak_milestone",
    "mastery_achieved",
    "goal_completed"
  ]).notNull(),
  
  // Dados Relacionados
  relatedSubjectId: int("relatedSubjectId"),
  relatedExerciseId: int("relatedExerciseId"),
  itemsCount: int("itemsCount").default(0), // Número de itens pendentes
  
  // Controle
  isRead: boolean("isRead").default(false).notNull(),
  isSent: boolean("isSent").default(false).notNull(),
  sentAt: timestamp("sentAt"),
  readAt: timestamp("readAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReviewNotification = typeof reviewNotifications.$inferSelect;
export type InsertReviewNotification = typeof reviewNotifications.$inferInsert;


/**
 * ========================================
 * SISTEMA DE CADERNO DE RESPOSTAS
 * ========================================
 * Caderno de respostas para avaliações formais
 * Compatível com leitura óptica e correção manual
 */

/**
 * Avaliações/Provas criadas pelo professor
 */
export const assessments = mysqlTable("assessments", {
  id: int("id").autoincrement().primaryKey(),
  teacherId: int("teacherId").notNull(), // FK para users (professor)
  subjectId: int("subjectId").notNull(), // FK para subjects
  classId: int("classId"), // FK para classes (opcional)
  
  // Informações da Avaliação
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  assessmentType: mysqlEnum("assessmentType", [
    "prova",           // Prova tradicional
    "simulado",        // Simulado
    "avaliacao_parcial", // Avaliação parcial
    "avaliacao_final", // Avaliação final
    "recuperacao",     // Recuperação
    "diagnostica"      // Avaliação diagnóstica
  ]).default("prova").notNull(),
  
  // Configurações
  totalQuestions: int("totalQuestions").notNull(),
  totalPoints: int("totalPoints").default(100).notNull(),
  passingScore: int("passingScore").default(60).notNull(), // Nota mínima para aprovação
  duration: int("duration"), // Duração em minutos
  
  // Instruções
  generalInstructions: text("generalInstructions"), // Instruções gerais do caderno
  
  // Datas
  applicationDate: timestamp("applicationDate"), // Data de aplicação
  availableFrom: timestamp("availableFrom"),
  availableTo: timestamp("availableTo"),
  
  // Tentativas
  maxAttempts: int("maxAttempts").default(1), // Número máximo de tentativas (null = ilimitado)
  
  // Embaralhamento de questões por aluno (anti-cola)
  shuffleQuestions: boolean("shuffleQuestions").default(false).notNull(),
  shuffleAlternatives: boolean("shuffleAlternatives").default(false).notNull(), // Embaralhar alternativas A,B,C,D
  // Statuss
  status: mysqlEnum("status", ["draft", "published", "applied", "corrected", "archived"]).default("draft").notNull(),
  
  // Controle
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = typeof assessments.$inferInsert;

/**
 * Questões da Avaliação
 */
export const assessmentQuestions = mysqlTable("assessment_questions", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull(), // FK para assessments
  
  // Numeração
  questionNumber: int("questionNumber").notNull(), // Número da questão (1, 2, 3...)
  
  // Tipo de Questão
  questionType: mysqlEnum("questionType", [
    "multiple_choice",    // Múltipla escolha (A, B, C, D, E)
    "true_false",         // Verdadeiro ou Falso
    "matching",           // Associação de colunas
    "fill_blank",         // Preencher lacunas
    "short_answer",       // Resposta curta
    "essay"               // Dissertativa
  ]).default("multiple_choice").notNull(),
  
  // Conteúdo da Questão
  statement: text("statement").notNull(), // Enunciado da questão
  context: text("context"), // Contexto adicional (texto de apoio, imagem, etc.)
  
  // Alternativas (para múltipla escolha)
  optionA: text("optionA"),
  optionB: text("optionB"),
  optionC: text("optionC"),
  optionD: text("optionD"),
  optionE: text("optionE"),
  
  // Gabarito
  correctAnswer: varchar("correctAnswer", { length: 500 }).notNull(), // A, B, C, D, E ou texto para outras
  answerExplanation: text("answerExplanation"), // Explicação da resposta correta
  
  // Instruções específicas
  specificInstructions: text("specificInstructions"), // Instruções específicas para este tipo de questão
  
  // Pontuação
  points: int("points").default(10).notNull(), // Pontos da questão
  partialCredit: boolean("partialCredit").default(false).notNull(), // Permite pontuação parcial
  
  // Habilidade/Competência avaliada
  skill: varchar("skill", { length: 255 }), // Habilidade avaliada (ex: "Interpretação de texto")
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium").notNull(),
  
  // Controle
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;
export type InsertAssessmentQuestion = typeof assessmentQuestions.$inferInsert;



/**
 * Instruções por Tipo de Questão
 * Instruções padrão para cada tipo de questão
 */
export const questionTypeInstructions = mysqlTable("question_type_instructions", {
  id: int("id").autoincrement().primaryKey(),
  teacherId: int("teacherId").notNull(), // FK para users (professor)
  
  questionType: mysqlEnum("questionType", [
    "multiple_choice",
    "true_false",
    "matching",
    "fill_blank",
    "short_answer",
    "essay"
  ]).notNull(),
  
  // Instruções
  title: varchar("title", { length: 255 }).notNull(), // Ex: "Questões de Múltipla Escolha"
  instructions: text("instructions").notNull(), // Instruções detalhadas
  
  // Exemplo visual
  exampleImage: text("exampleImage"), // URL de imagem de exemplo de preenchimento
  
  // Controle
  isDefault: boolean("isDefault").default(false).notNull(), // Se é a instrução padrão do sistema
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuestionTypeInstruction = typeof questionTypeInstructions.$inferSelect;
export type InsertQuestionTypeInstruction = typeof questionTypeInstructions.$inferInsert;

/**
 * Caderno de Erros e Acertos com Análise Inteligente
 * Sistema para alunos registrarem questões e receberem análises personalizadas
 */

/**
 * Questões do Caderno de Erros e Acertos
 */
export const mistakeNotebookQuestions = mysqlTable("mistake_notebook_questions", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  
  // Informações da Questão
  subject: varchar("subject", { length: 100 }).notNull(), // Matéria
  topic: varchar("topic", { length: 255 }).notNull(), // Tópico específico
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).notNull(),
  source: varchar("source", { length: 255 }), // Fonte da questão (livro, prova, etc)
  
  // Conteúdo
  questionText: text("questionText").notNull(), // Enunciado da questão
  questionImage: text("questionImage"), // URL da imagem da questão
  correctAnswer: text("correctAnswer").notNull(), // Resposta correta
  explanation: text("explanation"), // Explicação da resposta
  
  // Tags para organização
  tags: text("tags"), // JSON array de tags
  
  // Controle
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MistakeNotebookQuestion = typeof mistakeNotebookQuestions.$inferSelect;
export type InsertMistakeNotebookQuestion = typeof mistakeNotebookQuestions.$inferInsert;

/**
 * Tentativas de Resposta do Aluno
 */
export const mistakeNotebookAttempts = mysqlTable("mistake_notebook_attempts", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("questionId").notNull(), // FK para mistake_notebook_questions
  studentId: int("studentId").notNull(), // FK para students
  
  // Resposta do Aluno
  studentAnswer: text("studentAnswer").notNull(),
  isCorrect: boolean("isCorrect").notNull(),
  
  // Análise do Erro
  errorType: varchar("errorType", { length: 100 }), // Tipo de erro identificado
  studentNotes: text("studentNotes"), // Anotações do aluno sobre o erro
  
  // Status de Revisão
  reviewStatus: mysqlEnum("reviewStatus", ["pending", "reviewed", "mastered"]).default("pending").notNull(),
  reviewedAt: timestamp("reviewedAt"),
  
  // Tempo gasto
  timeSpent: int("timeSpent"), // Tempo em segundos
  
  // Controle
  attemptedAt: timestamp("attemptedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MistakeNotebookAttempt = typeof mistakeNotebookAttempts.$inferSelect;
export type InsertMistakeNotebookAttempt = typeof mistakeNotebookAttempts.$inferInsert;

/**
 * Tópicos de Estudo Identificados
 */
export const mistakeNotebookTopics = mysqlTable("mistake_notebook_topics", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  
  // Informações do Tópico
  subject: varchar("subject", { length: 100 }).notNull(),
  topicName: varchar("topicName", { length: 255 }).notNull(),
  
  // Estatísticas
  totalQuestions: int("totalQuestions").default(0).notNull(),
  correctAnswers: int("correctAnswers").default(0).notNull(),
  errorRate: float("errorRate").default(0).notNull(), // Taxa de erro (0-100)
  
  // Prioridade de Estudo
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  
  // Controle
  lastPracticed: timestamp("lastPracticed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueTopic: unique().on(table.studentId, table.subject, table.topicName),
}));

export type MistakeNotebookTopic = typeof mistakeNotebookTopics.$inferSelect;
export type InsertMistakeNotebookTopic = typeof mistakeNotebookTopics.$inferInsert;

/**
 * Insights Gerados pela IA
 */
export const mistakeNotebookInsights = mysqlTable("mistake_notebook_insights", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  
  // Tipo de Insight
  insightType: mysqlEnum("insightType", [
    "pattern_analysis",      // Análise de padrões de erro
    "study_suggestion",      // Sugestão de estudo
    "question_recommendation", // Recomendação de questões
    "progress_report"        // Relatório de progresso
  ]).notNull(),
  
  // Conteúdo do Insight
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(), // Conteúdo em markdown
  data: text("data"), // Dados estruturados em JSON
  
  // Relevância
  relevanceScore: float("relevanceScore").default(0).notNull(), // 0-100
  
  // Status
  isRead: boolean("isRead").default(false).notNull(),
  isArchived: boolean("isArchived").default(false).notNull(),
  
  // Controle
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // Insights podem expirar
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MistakeNotebookInsight = typeof mistakeNotebookInsights.$inferSelect;
export type InsertMistakeNotebookInsight = typeof mistakeNotebookInsights.$inferInsert;

/**
 * Planos de Estudo Gerados Automaticamente
 */
export const mistakeNotebookStudyPlans = mysqlTable("mistake_notebook_study_plans", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(), // FK para students
  
  // Informações do Plano
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Período do Plano
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  
  // Estrutura do Plano (JSON)
  planData: text("planData").notNull(), // JSON com estrutura detalhada
  
  // Progresso
  totalTasks: int("totalTasks").default(0).notNull(),
  completedTasks: int("completedTasks").default(0).notNull(),
  progressPercentage: float("progressPercentage").default(0).notNull(),
  
  // Status
  status: mysqlEnum("status", ["active", "completed", "abandoned"]).default("active").notNull(),
  
  // Controle
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MistakeNotebookStudyPlan = typeof mistakeNotebookStudyPlans.$inferSelect;
export type InsertMistakeNotebookStudyPlan = typeof mistakeNotebookStudyPlans.$inferInsert;


/**
 * ========================================
 * SISTEMA DE NOTIFICAÇÕES PUSH
 * ========================================
 * Web Push API para lembrar professores sobre aulas e eventos
 */

/**
 * Assinaturas Push do navegador
 * Armazena as subscriptions para enviar notificações push
 */
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("keys_p256dh").notNull(), // Public key
  auth: text("keys_auth").notNull(), // Auth secret
  userAgent: varchar("user_agent", { length: 500 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

/**
 * Preferências de Notificação do Professor
 * Configura quais tipos de lembretes o professor deseja receber
 */
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  
  // Tipos de notificação habilitados
  classReminders: boolean("class_reminders").default(true).notNull(), // Lembrete antes das aulas
  eventReminders: boolean("event_reminders").default(true).notNull(), // Lembrete de eventos do calendário
  taskReminders: boolean("task_reminders").default(true).notNull(), // Lembrete de tarefas com prazo
  dailySummary: boolean("daily_summary").default(false).notNull(), // Resumo diário das aulas
  
  // Tempo de antecedência para lembretes (em minutos)
  classReminderMinutes: int("class_reminder_minutes").default(15).notNull(), // 15 min antes da aula
  eventReminderMinutes: int("event_reminder_minutes").default(60).notNull(), // 1h antes do evento
  dailySummaryTime: varchar("daily_summary_time", { length: 5 }).default("07:00").notNull(), // Horário do resumo diário
  
  // Dias da semana para notificações (JSON array: [1,2,3,4,5] = seg-sex)
  activeDays: text("active_days").default("[1,2,3,4,5]").notNull(),
  
  // Horário silencioso (não enviar notificações)
  quietHoursStart: varchar("quiet_hours_start", { length: 5 }).default("22:00").notNull(),
  quietHoursEnd: varchar("quiet_hours_end", { length: 5 }).default("06:00").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/**
 * Histórico de Notificações Push Enviadas
 * Para evitar duplicatas e rastrear entregas
 */
export const pushNotificationLog = mysqlTable("push_notification_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  type: mysqlEnum("type", ["class_reminder", "event_reminder", "task_reminder", "daily_summary", "announcement", "activity", "mural"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  referenceId: json("data"), // ID do evento/aula referenciado (stored as JSON)
  referenceDate: varchar("status", { length: 10 }), // Data de referência YYYY-MM-DD
  delivered: boolean("delivered").default(false).notNull(),
  error: text("error_message"),
  sentAt: timestamp("created_at").defaultNow().notNull(),
});

export type PushNotificationLog = typeof pushNotificationLog.$inferSelect;
export type InsertPushNotificationLog = typeof pushNotificationLog.$inferInsert;

/**
 * Fila de notificações push adiadas (horário silencioso)
 * Pushes bloqueados entre 22:00-06:59 são enfileirados e enviados às 07:00
 */
export const pushNotificationQueue = mysqlTable("push_notification_queue", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  type: mysqlEnum("type", ["class_reminder", "event_reminder", "task_reminder", "daily_summary", "announcement", "activity", "mural"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  icon: varchar("icon", { length: 255 }),
  badge: varchar("badge", { length: 255 }),
  tag: varchar("tag", { length: 255 }),
  url: varchar("url", { length: 500 }),
  referenceId: varchar("reference_id", { length: 100 }),
  referenceDate: varchar("reference_date", { length: 10 }),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  error: text("error"),
  queuedAt: timestamp("queued_at").defaultNow().notNull(),
  sentAt: timestamp("sent_at"),
});

export type PushNotificationQueue = typeof pushNotificationQueue.$inferSelect;
export type InsertPushNotificationQueue = typeof pushNotificationQueue.$inferInsert;

/**
 * Configurações do Sistema (Admin)
 * Armazena configurações globais como limite de armazenamento
 */
export const systemSettings = mysqlTable("system_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("setting_key", { length: 100 }).notNull().unique(),
  settingValue: text("setting_value").notNull(),
  description: varchar("description", { length: 255 }),
  updatedBy: int("updated_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;

/**
 * Tabela de backups do sistema
 */
export const backups = mysqlTable("backups", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  filepath: varchar("filepath", { length: 500 }).notNull(),
  filesize: int("filesize").notNull(), // Tamanho em KB
  s3Key: varchar("s3_key", { length: 500 }), // Chave do arquivo no S3
  s3Url: varchar("s3_url", { length: 1000 }), // URL pública do arquivo no S3
  storageType: mysqlEnum("storage_type", ["local", "s3", "both"]).default("local").notNull(),
  backupType: mysqlEnum("backup_type", ["manual", "scheduled", "automatic"]).default("manual").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "restoring"]).default("pending").notNull(),
  createdBy: int("created_by").notNull(), // ID do usuário que criou
  errorMessage: text("error_message"), // Mensagem de erro se falhar
  restoredAt: timestamp("restored_at"), // Data de restauração (se foi restaurado)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type Backup = typeof backups.$inferSelect;
export type InsertBackup = typeof backups.$inferInsert;

/**
 * Tabela de configurações de agendamento de backups
 */
export const backupSchedules = mysqlTable("backup_schedules", {
  id: int("id").autoincrement().primaryKey(),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  frequency: mysqlEnum("frequency", ["daily", "weekly", "monthly"]).default("daily").notNull(),
  scheduleTime: varchar("schedule_time", { length: 5 }).default("03:00").notNull(), // Formato HH:MM
  dayOfWeek: int("day_of_week"), // 0-6 (Domingo-Sábado) para backup semanal
  dayOfMonth: int("day_of_month"), // 1-31 para backup mensal
  retentionDays: int("retention_days").default(7).notNull(), // Quantos dias manter backups
  lastRunAt: timestamp("last_run_at"), // Última execução
  nextRunAt: timestamp("next_run_at"), // Próxima execução programada
  createdBy: int("created_by").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type BackupSchedule = typeof backupSchedules.$inferSelect;
export type InsertBackupSchedule = typeof backupSchedules.$inferInsert;

/**
 * Tabela de servidores VPS monitorados
 */
export const vpsServers = mysqlTable("vps_servers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Nome amigável do servidor
  ipAddress: varchar("ip_address", { length: 45 }).notNull(), // IPv4 ou IPv6
  authToken: varchar("auth_token", { length: 64 }).notNull().unique(), // Token para autenticação do agente
  isActive: boolean("is_active").default(true).notNull(),
  lastSeenAt: timestamp("last_seen_at"), // Última vez que recebeu métricas
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type VPSServer = typeof vpsServers.$inferSelect;
export type InsertVPSServer = typeof vpsServers.$inferInsert;

/**
 * Tabela de métricas de VPS
 */
export const vpsMetrics = mysqlTable("vps_metrics", {
  id: int("id").autoincrement().primaryKey(),
  serverId: int("server_id").notNull().references(() => vpsServers.id, { onDelete: "cascade" }),
  cpuPercent: decimal("cpu_percent", { precision: 5, scale: 2 }).notNull(), // % de uso de CPU
  memoryTotal: bigint("memory_total", { mode: "number" }).notNull(), // Memória total em bytes
  memoryUsed: bigint("memory_used", { mode: "number" }).notNull(), // Memória usada em bytes
  memoryPercent: decimal("memory_percent", { precision: 5, scale: 2 }).notNull(), // % de uso de memória
  diskTotal: bigint("disk_total", { mode: "number" }).notNull(), // Disco total em bytes
  diskUsed: bigint("disk_used", { mode: "number" }).notNull(), // Disco usado em bytes
  diskPercent: decimal("disk_percent", { precision: 5, scale: 2 }).notNull(), // % de uso de disco
  networkSent: bigint("network_sent", { mode: "number" }).notNull(), // Bytes enviados
  networkRecv: bigint("network_recv", { mode: "number" }).notNull(), // Bytes recebidos
  loadAverage1: decimal("load_average_1", { precision: 5, scale: 2 }), // Load average 1 min
  loadAverage5: decimal("load_average_5", { precision: 5, scale: 2 }), // Load average 5 min
  loadAverage15: decimal("load_average_15", { precision: 5, scale: 2 }), // Load average 15 min
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type VPSMetric = typeof vpsMetrics.$inferSelect;
export type InsertVPSMetric = typeof vpsMetrics.$inferInsert;

/**
 * Tabela de configurações de alertas de VPS
 */
export const vpsAlerts = mysqlTable("vps_alerts", {
  id: int("id").autoincrement().primaryKey(),
  serverId: int("server_id").notNull().references(() => vpsServers.id, { onDelete: "cascade" }),
  metricType: mysqlEnum("metric_type", ["cpu", "memory", "disk", "network"]).notNull(),
  threshold: decimal("threshold", { precision: 5, scale: 2 }).notNull(), // Limite em %
  isActive: boolean("is_active").default(true).notNull(),
  lastTriggeredAt: timestamp("last_triggered_at"), // Última vez que o alerta foi disparado
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type VPSAlert = typeof vpsAlerts.$inferSelect;
export type InsertVPSAlert = typeof vpsAlerts.$inferInsert;

/**
 * Tabela de logs de acesso (professores e alunos)
 */
export const accessLogs = mysqlTable("access_logs", {
  id: int("id").autoincrement().primaryKey(),
  userType: mysqlEnum("userType", ["teacher", "student"]).notNull(), // Tipo de usuário
  userId: int("userId"), // ID do professor (users.id) — null se aluno
  studentId: int("studentId"), // ID do aluno (students.id) — null se professor
  userName: varchar("userName", { length: 255 }), // Nome snapshot para exibição rápida
  ipAddress: varchar("ipAddress", { length: 64 }), // Endereço IP do acesso
  userAgent: text("userAgent"), // User-agent do navegador
  browser: varchar("browser", { length: 100 }), // Navegador identificado (Chrome, Firefox, etc.)
  os: varchar("os", { length: 100 }), // Sistema operacional identificado
  teacherId: int("teacherId"), // ID do professor dono do registro
  accessedAt: timestamp("accessedAt").defaultNow().notNull(), // Data/hora do acesso
  pageVisited: varchar("pageVisited", { length: 255 }), // Página/recurso acessado (ex: 'trilha', 'exercicios', 'avisos')
  sessionDurationSec: int("sessionDurationSec"), // Duração da sessão em segundos (atualizado ao sair)
});
export type AccessLog = typeof accessLogs.$inferSelect;
export type InsertAccessLog = typeof accessLogs.$inferInsert;

// Tabela de arquivos históricos de logs de acesso
// Armazena os CSVs gerados antes de uma limpeza para consulta futura
export const accessLogArchives = mysqlTable("access_log_archives", {
  id: int("id").autoincrement().primaryKey(),
  teacherId: int("teacherId").notNull(), // Professor que gerou o arquivo
  fileName: varchar("fileName", { length: 255 }).notNull(), // Nome do arquivo CSV
  fileUrl: text("fileUrl").notNull(), // URL do arquivo no S3
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // Chave S3 para referência
  recordCount: int("recordCount").notNull().default(0), // Quantidade de registros no arquivo
  periodStart: timestamp("periodStart"), // Data mais antiga dos registros arquivados
  periodEnd: timestamp("periodEnd"), // Data mais recente dos registros arquivados
  fileSizeBytes: int("fileSizeBytes").default(0), // Tamanho do arquivo em bytes
  createdAt: timestamp("createdAt").defaultNow().notNull(), // Quando o arquivo foi criado
});
export type AccessLogArchive = typeof accessLogArchives.$inferSelect;
export type InsertAccessLogArchive = typeof accessLogArchives.$inferInsert;

/**
 * Tabela de configurações de e-mail por professor
 * Armazena as configurações SMTP institucionais para envio de e-mails
 */
export const emailConfigs = mysqlTable("email_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Professor dono da configuração
  smtpHost: varchar("smtp_host", { length: 255 }).notNull(),
  smtpPort: int("smtp_port").notNull().default(587),
  smtpSecure: boolean("smtp_secure").notNull().default(false),
  smtpUser: varchar("smtp_user", { length: 320 }).notNull(),
  smtpPassword: text("smtp_password").notNull(),
  fromEmail: varchar("from_email", { length: 320 }).notNull(),
  fromName: varchar("from_name", { length: 255 }).notNull().default("FlowEdu"),
  isActive: boolean("is_active").notNull().default(true),
  lastTestedAt: timestamp("last_tested_at"),
  lastTestStatus: varchar("last_test_status", { length: 50 }).default("untested"),
  lastTestError: text("last_test_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type EmailConfig = typeof emailConfigs.$inferSelect;
export type InsertEmailConfig = typeof emailConfigs.$inferInsert;

/**
 * Tabela de campanhas de e-mail (histórico de envios)
 */
export const emailCampaigns = mysqlTable("email_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  emailConfigId: int("email_config_id"),
  subject: varchar("subject", { length: 500 }).notNull(),
  bodyHtml: text("body_html").notNull(),
  bodyText: text("body_text"),
  recipientType: mysqlEnum("recipient_type", ["class", "subject", "manual", "all"]).notNull(),
  recipientGroupId: int("recipient_group_id"),
  recipientGroupName: varchar("recipient_group_name", { length: 255 }),
  recipientEmails: text("recipient_emails").notNull(),
  totalRecipients: int("total_recipients").notNull().default(0),
  status: mysqlEnum("status", ["pending", "sending", "completed", "failed", "partial"]).notNull().default("pending"),
  sentCount: int("sent_count").notNull().default(0),
  failedCount: int("failed_count").notNull().default(0),
  errorLog: text("error_log"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = typeof emailCampaigns.$inferInsert;

/**
 * Tabela de atividades criadas pelo professor
 */
export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Professor que criou
  subjectId: int("subjectId"), // Disciplina (null = todas as turmas do professor)
  classId: int("classId"), // Turma específica (null = todas)
  title: varchar("title", { length: 255 }).notNull(), // Título da atividade
  description: text("description"), // Enunciado/descrição da atividade
  dueDate: timestamp("dueDate"), // Prazo de entrega
  maxScore: decimal("maxScore", { precision: 5, scale: 2 }).default("10.00"), // Nota máxima
  allowedFormats: varchar("allowedFormats", { length: 100 }).default("pdf,doc,docx,ppt,pptx"), // Formatos permitidos
  maxFileSizeMB: int("maxFileSizeMB").default(20), // Tamanho máximo do arquivo em MB
  status: mysqlEnum("status", ["draft", "published", "closed"]).default("published").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

/**
 * Tabela de submissões de atividades pelos alunos
 */
export const activitySubmissions = mysqlTable("activity_submissions", {
  id: int("id").autoincrement().primaryKey(),
  activityId: int("activityId").notNull(), // Atividade referenciada
  studentId: int("studentId").notNull(), // Aluno que submeteu
  fileUrl: text("fileUrl").notNull(), // URL do arquivo no S3
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // Chave S3
  fileName: varchar("fileName", { length: 255 }).notNull(), // Nome original do arquivo
  fileMimeType: varchar("fileMimeType", { length: 100 }), // Tipo MIME do arquivo
  fileSizeBytes: int("fileSizeBytes").default(0), // Tamanho do arquivo
  comment: text("comment"), // Comentário do aluno ao submeter
  status: mysqlEnum("status", ["submitted", "graded", "returned"]).default("submitted").notNull(),
  score: decimal("score", { precision: 5, scale: 2 }), // Nota dada pelo professor
  feedback: text("feedback"), // Feedback/comentário do professor
  gradedAt: timestamp("gradedAt"), // Quando foi avaliado
  gradedBy: int("gradedBy"), // ID do professor que avaliou
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ActivitySubmission = typeof activitySubmissions.$inferSelect;
export type InsertActivitySubmission = typeof activitySubmissions.$inferInsert;

/**
 * Tentativas de Prova Online pelo Aluno
 * Registra cada vez que um aluno inicia/submete uma prova online
 */
export const assessmentAttempts = mysqlTable("assessment_attempts", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull(), // FK para assessments
  studentId: int("studentId").notNull(), // FK para students

  // Status da tentativa
  status: mysqlEnum("status", ["in_progress", "submitted", "graded"]).default("in_progress").notNull(),

  // Pontuação
  totalCorrect: int("totalCorrect").default(0).notNull(), // Número de acertos
  totalWrong: int("totalWrong").default(0).notNull(), // Número de erros
  score: float("score").default(0).notNull(), // Nota final (0-totalPoints)
  percentage: float("percentage").default(0).notNull(), // Percentual de acerto (0-100)
  passed: boolean("passed").default(false).notNull(), // Aprovado ou não

  // Tempo
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  submittedAt: timestamp("submittedAt"), // Quando o aluno submeteu
  timeSpentSeconds: int("timeSpentSeconds").default(0), // Tempo gasto em segundos

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssessmentAttempt = typeof assessmentAttempts.$inferSelect;
export type InsertAssessmentAttempt = typeof assessmentAttempts.$inferInsert;

/**
 * Respostas do Aluno por Questão
 * Cada linha = resposta do aluno para uma questão em uma tentativa
 */
export const assessmentAnswers = mysqlTable("assessment_answers", {
  id: int("id").autoincrement().primaryKey(),
  attemptId: int("attemptId").notNull(), // FK para assessment_attempts
  questionId: int("questionId").notNull(), // FK para assessment_questions
  questionNumber: int("questionNumber").notNull(),

  // Resposta do aluno
  selectedAnswer: varchar("selectedAnswer", { length: 500 }), // A, B, C, D, E ou texto

  // Resultado
  isCorrect: boolean("isCorrect").default(false).notNull(),
  pointsEarned: float("pointsEarned").default(0).notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AssessmentAnswer = typeof assessmentAnswers.$inferSelect;
export type InsertAssessmentAnswer = typeof assessmentAnswers.$inferInsert;

// ============================================================
// Tabela de logs de uso de IA (monitoramento de tokens e gastos)
// ============================================================
export const aiUsageLogs = mysqlTable("ai_usage_logs", {
  id: int("id").autoincrement().primaryKey(),
  provider: varchar("provider", { length: 50 }).notNull(), // groq, manus, gemini
  model: varchar("model", { length: 100 }).notNull(),
  feature: varchar("feature", { length: 100 }).notNull(), // ex: generate_exercise, analyze_student
  promptTokens: int("prompt_tokens").default(0).notNull(),
  completionTokens: int("completion_tokens").default(0).notNull(),
  totalTokens: int("total_tokens").default(0).notNull(),
  success: boolean("success").default(true).notNull(),
  errorMessage: text("error_message"),
  userId: int("user_id"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiUsageLog = typeof aiUsageLogs.$inferSelect;
export type InsertAiUsageLog = typeof aiUsageLogs.$inferInsert;

// ============================================================
// Tabela de configurações de IA (provedor, chave API, modelo)
// ============================================================
export const aiSettings = mysqlTable("ai_settings", {
  id: int("id").autoincrement().primaryKey(),
  provider: varchar("provider", { length: 50 }).default("groq").notNull(), // groq, gemini, openai, anthropic, manus
  groqApiKey: text("groqApiKey"),
  geminiApiKey: text("geminiApiKey"),
  openaiApiKey: text("openaiApiKey"),
  anthropicApiKey: text("anthropicApiKey"),
  model: varchar("model", { length: 100 }).default("llama-3.3-70b-versatile").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"),
});
export type AiSettings = typeof aiSettings.$inferSelect;
export type InsertAiSettings = typeof aiSettings.$inferInsert;

// ============================================================
// FÓRUM DE DISCUSSÃO POR DISCIPLINA
// ============================================================

/**
 * Tópicos do Fórum — criados por professor ou aluno dentro de uma disciplina
 */
export const forumTopics = mysqlTable("forum_topics", {
  id: int("id").autoincrement().primaryKey(),
  subjectId: int("subjectId").notNull(),        // FK para subjects
  classId: int("classId"),                       // FK para classes (opcional — pode ser por disciplina geral)
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  authorType: mysqlEnum("authorType", ["teacher", "student"]).notNull(),
  authorUserId: int("authorUserId"),             // FK para users (professor)
  authorStudentId: int("authorStudentId"),       // FK para students (aluno)
  isPinned: boolean("isPinned").default(false).notNull(),
  isClosed: boolean("isClosed").default(false).notNull(), // professor pode fechar tópico
  bestReplyId: int("bestReplyId"),               // FK para forum_replies (melhor resposta)
  viewCount: int("viewCount").default(0).notNull(),
  replyCount: int("replyCount").default(0).notNull(),
  likeCount: int("likeCount").default(0).notNull(),
  forumType: mysqlEnum("forumType", ["general", "qa", "single"]).default("general").notNull(),
  notifyOnReply: boolean("notifyOnReply").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ForumTopic = typeof forumTopics.$inferSelect;
export type InsertForumTopic = typeof forumTopics.$inferInsert;

/**
 * Respostas do Fórum — respostas a um tópico
 */
export const forumReplies = mysqlTable("forum_replies", {
  id: int("id").autoincrement().primaryKey(),
  topicId: int("topicId").notNull(),             // FK para forum_topics
  content: text("content").notNull(),
  authorType: mysqlEnum("authorType", ["teacher", "student"]).notNull(),
  authorUserId: int("authorUserId"),             // FK para users (professor)
  authorStudentId: int("authorStudentId"),       // FK para students (aluno)
  isBestAnswer: boolean("isBestAnswer").default(false).notNull(),
  parentReplyId: int("parentReplyId"),           // para respostas aninhadas (thread)
  likeCount: int("likeCount").default(0).notNull(),
  isEdited: boolean("isEdited").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ForumReply = typeof forumReplies.$inferSelect;
export type InsertForumReply = typeof forumReplies.$inferInsert;

/**
 * Curtidas do Fórum — professor ou aluno curte um tópico ou resposta
 */
export const forumLikes = mysqlTable("forum_likes", {
  id: int("id").autoincrement().primaryKey(),
  targetType: mysqlEnum("targetType", ["topic", "reply"]).notNull(),
  targetId: int("targetId").notNull(),
  authorType: mysqlEnum("authorType", ["teacher", "student"]).notNull(),
  authorUserId: int("authorUserId"),
  authorStudentId: int("authorStudentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ForumLike = typeof forumLikes.$inferSelect;

/**
 * Inscrições do Fórum — receber notificações por email de novos posts
 */
export const forumSubscriptions = mysqlTable("forum_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  topicId: int("topicId").notNull(),
  authorType: mysqlEnum("authorType", ["teacher", "student"]).notNull(),
  authorUserId: int("authorUserId"),
  authorStudentId: int("authorStudentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ForumSubscription = typeof forumSubscriptions.$inferSelect;

// ============================================================
// MURAL COLABORATIVO EM TEMPO REAL
// ============================================================

/**
 * Murais — criados pelo professor para uma disciplina/turma
 */
export const murals = mysqlTable("murals", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  subjectId: int("subjectId").notNull(),
  classId: int("classId").notNull(),
  createdBy: int("createdBy").notNull(),
  isLocked: boolean("isLocked").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Mural = typeof murals.$inferSelect;
export type InsertMural = typeof murals.$inferInsert;

/**
 * Colunas do Mural — ex: "O que aprendi", "Dúvidas", "Ideias"
 */
export const muralColumns = mysqlTable("mural_columns", {
  id: int("id").autoincrement().primaryKey(),
  muralId: int("muralId").notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 10 }).default("📌").notNull(),
  color: varchar("color", { length: 20 }).default("green").notNull(),
  position: int("position").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MuralColumn = typeof muralColumns.$inferSelect;
export type InsertMuralColumn = typeof muralColumns.$inferInsert;

/**
 * Cards (Post-its) do Mural
 */
export const muralCards = mysqlTable("mural_cards", {
  id: int("id").autoincrement().primaryKey(),
  muralId: int("muralId").notNull(),
  columnId: int("columnId").notNull(),
  text: text("text").notNull(),
  color: varchar("color", { length: 20 }).default("yellow").notNull(),
  authorType: mysqlEnum("authorType", ["teacher", "student"]).notNull(),
  authorUserId: int("authorUserId"),
  authorStudentId: int("authorStudentId"),
  authorName: varchar("authorName", { length: 100 }).notNull(),
  teacherReply: text("teacherReply"),
  teacherReplyAt: timestamp("teacherReplyAt"),
  isDeleted: boolean("isDeleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MuralCard = typeof muralCards.$inferSelect;
export type InsertMuralCard = typeof muralCards.$inferInsert;

/**
 * Votos nos Cards — alunos e professores podem votar 👍
 */
export const muralVotes = mysqlTable("mural_votes", {
  id: int("id").autoincrement().primaryKey(),
  cardId: int("cardId").notNull(),
  voterType: mysqlEnum("voterType", ["teacher", "student"]).notNull(),
  voterUserId: int("voterUserId"),
  voterStudentId: int("voterStudentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MuralVote = typeof muralVotes.$inferSelect;
export type InsertMuralVote = typeof muralVotes.$inferInsert;

// ==================== GLOSSÁRIO COLABORATIVO ====================
export const glossaries = mysqlTable("glossaries", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  subjectId: int("subjectId").notNull(),
  classId: int("classId"),
  createdByUserId: int("createdByUserId").notNull(),
  allowStudentContributions: boolean("allowStudentContributions").default(true).notNull(),
  requireApproval: boolean("requireApproval").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Glossary = typeof glossaries.$inferSelect;
export type InsertGlossary = typeof glossaries.$inferInsert;

export const glossaryEntries = mysqlTable("glossary_entries", {
  id: int("id").autoincrement().primaryKey(),
  glossaryId: int("glossaryId").notNull(),
  term: varchar("term", { length: 255 }).notNull(),
  definition: text("definition").notNull(),
  example: text("example"),
  category: varchar("category", { length: 100 }),
  authorType: mysqlEnum("authorType", ["teacher", "student"]).notNull(),
  authorUserId: int("authorUserId"),
  authorStudentId: int("authorStudentId"),
  isApproved: boolean("isApproved").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GlossaryEntry = typeof glossaryEntries.$inferSelect;
export type InsertGlossaryEntry = typeof glossaryEntries.$inferInsert;

export const glossaryComments = mysqlTable("glossary_comments", {
  id: int("id").autoincrement().primaryKey(),
  entryId: int("entryId").notNull(),
  comment: text("comment").notNull(),
  authorType: mysqlEnum("authorType", ["teacher", "student"]).notNull(),
  authorUserId: int("authorUserId"),
  authorStudentId: int("authorStudentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GlossaryComment = typeof glossaryComments.$inferSelect;
export type InsertGlossaryComment = typeof glossaryComments.$inferInsert;
