import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, datetime, unique, date, json, float, double } from "drizzle-orm/mysql-core";
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
  profile: mysqlEnum("profile", ["traditional", "enthusiast", "interactive", "organizational"]).default("enthusiast").notNull(),
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
  contentType: mysqlEnum("contentType", ["text", "video", "exercise", "quiz", "project"]).default("text"), // Tipo de conteúdo pedagógico
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
  topicId: int("topicId").notNull(),
  professorId: int("professorId").notNull(),
  question: text("question").notNull(),
  context: text("context"), // Contexto adicional da dúvida
  status: mysqlEnum("status", ["pending", "answered", "resolved"]).default("pending").notNull(),
  answer: text("answer"), // Resposta do professor
  answeredAt: timestamp("answeredAt"),
  isPrivate: boolean("isPrivate").default(true).notNull(), // Dúvida privada ou pública para turma
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
  // Campos de customização do avatar de karatê
  avatarGender: mysqlEnum("avatarGender", ["male", "female"]).default("male").notNull(), // Gênero do avatar (male, female)
  avatarSkinTone: varchar("avatarSkinTone", { length: 20 }).default("light"), // Tom de pele (light, medium, tan, dark, darker, darkest)
  avatarKimonoColor: varchar("avatarKimonoColor", { length: 20 }).default("white"), // Cor do kimono (white, blue, red, black)
  avatarHairStyle: varchar("avatarHairStyle", { length: 20 }).default("short"), // Estilo de cabelo (short, medium, long, bald, ponytail, mohawk)
  avatarHairColor: varchar("avatarHairColor", { length: 20 }).default("black"), // Cor do cabelo (black, brown, blonde, red, colorful)
  avatarKimonoStyle: varchar("avatarKimonoStyle", { length: 20 }).default("traditional"), // Estilo do kimono (traditional, modern, competition)
  avatarHeadAccessory: varchar("avatarHeadAccessory", { length: 20 }).default("none"), // Acessório de cabeça (none, bandana, headband, cap, glasses)
  avatarExpression: varchar("avatarExpression", { length: 20 }).default("neutral"), // Expressão facial (neutral, happy, determined, focused, victorious)
  avatarPose: varchar("avatarPose", { length: 20 }).default("standing"), // Pose (standing, fighting, punch, kick)
  specialKimono: varchar("specialKimono", { length: 30 }).default("none"), // Kimono especial desbloqueável (none, golden, silver, patterned_dragon, patterned_tiger, patterned_sakura)
  avatarAccessories: text("avatarAccessories"), // JSON com acessórios desbloqueados
  // Campos HD-2D (Octopath Traveler II Style)
  hd2dCharacterId: int("hd2dCharacterId").default(1).notNull(), // ID do personagem HD-2D (1-8)
  hd2dUnlockedCharacters: text("hd2dUnlockedCharacters"), // JSON array de IDs desbloqueados
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
  activityType: varchar("activityType", { length: 100 }).notNull(), // exercise_objective, exercise_subjective, exam, etc
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
