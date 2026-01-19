-- ============================================
-- ÍNDICES DE PERFORMANCE PARA VPS
-- FlowEdu - Sistema de Gestão de Tempo para Professores
-- Data: 19/01/2026
-- ============================================

-- Índices para tabela users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approvalStatus);

-- Índices para tabela subjects (disciplinas)
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(userId);

-- Índices para tabela classes (turmas)
CREATE INDEX IF NOT EXISTS idx_classes_user_id ON classes(userId);

-- Índices para tabela shifts (turnos)
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(userId);

-- Índices para tabela time_slots (horários)
CREATE INDEX IF NOT EXISTS idx_time_slots_shift_id ON time_slots(shiftId);
CREATE INDEX IF NOT EXISTS idx_time_slots_user_id ON time_slots(userId);

-- Índices para tabela scheduled_classes (aulas agendadas)
CREATE INDEX IF NOT EXISTS idx_scheduled_classes_user_id ON scheduled_classes(userId);
CREATE INDEX IF NOT EXISTS idx_scheduled_classes_subject_id ON scheduled_classes(subjectId);
CREATE INDEX IF NOT EXISTS idx_scheduled_classes_class_id ON scheduled_classes(classId);
CREATE INDEX IF NOT EXISTS idx_scheduled_classes_time_slot_id ON scheduled_classes(timeSlotId);
CREATE INDEX IF NOT EXISTS idx_scheduled_classes_day_of_week ON scheduled_classes(dayOfWeek);

-- Índices para tabela learning_modules (módulos)
CREATE INDEX IF NOT EXISTS idx_learning_modules_subject_id ON learning_modules(subjectId);
CREATE INDEX IF NOT EXISTS idx_learning_modules_user_id ON learning_modules(userId);

-- Índices para tabela learning_topics (tópicos)
CREATE INDEX IF NOT EXISTS idx_learning_topics_module_id ON learning_topics(moduleId);
CREATE INDEX IF NOT EXISTS idx_learning_topics_user_id ON learning_topics(userId);

-- Índices para tabela students (alunos)
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(userId);
CREATE INDEX IF NOT EXISTS idx_students_registration_number ON students(registrationNumber);

-- Índices para tabela student_exercise_attempts (tentativas de exercícios)
CREATE INDEX IF NOT EXISTS idx_student_exercise_attempts_student_id ON student_exercise_attempts(studentId);
CREATE INDEX IF NOT EXISTS idx_student_exercise_attempts_exercise_id ON student_exercise_attempts(exerciseId);

-- Índices para tabela student_exercise_answers (respostas de exercícios)
CREATE INDEX IF NOT EXISTS idx_student_exercise_answers_attempt_id ON student_exercise_answers(attemptId);
CREATE INDEX IF NOT EXISTS idx_student_exercise_answers_student_id ON student_exercise_answers(studentId);

-- Índices para tabela tasks (tarefas)
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(userId);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(dueDate);

-- Índices para tabela calendar_events (eventos do calendário)
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(userId);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_date ON calendar_events(eventDate);

-- Índices para tabela announcements (comunicados)
CREATE INDEX IF NOT EXISTS idx_announcements_user_id ON announcements(userId);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(published);

-- Índices para tabela notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(`read`);

-- Índices para tabela student_topic_progress (progresso do aluno)
CREATE INDEX IF NOT EXISTS idx_student_topic_progress_student_id ON student_topic_progress(studentId);
CREATE INDEX IF NOT EXISTS idx_student_topic_progress_topic_id ON student_topic_progress(topicId);

-- Índices para tabela subject_enrollments (matrículas em disciplinas)
CREATE INDEX IF NOT EXISTS idx_subject_enrollments_student_id ON subject_enrollments(studentId);
CREATE INDEX IF NOT EXISTS idx_subject_enrollments_subject_id ON subject_enrollments(subjectId);

-- Índices para tabela questions (perguntas)
CREATE INDEX IF NOT EXISTS idx_questions_student_id ON questions(studentId);
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions(subjectId);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);

-- Índices compostos para queries frequentes
CREATE INDEX IF NOT EXISTS idx_scheduled_classes_user_day ON scheduled_classes(userId, dayOfWeek);
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON tasks(userId, completed);
CREATE INDEX IF NOT EXISTS idx_student_progress_student_topic ON student_topic_progress(studentId, topicId);

-- ============================================
-- FIM DOS ÍNDICES
-- ============================================
