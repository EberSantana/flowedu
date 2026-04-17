import { z } from "zod";
import { router, protectedProcedure, publicProcedure, studentProcedure } from "./_core/trpc";
import { getDb, createNotification, getStudentsBySubject } from "./db";
import * as pushNotif from './push-notifications';
import { activities, activitySubmissions, students, subjects, classes, studentClassEnrollments, subjectEnrollments, studentExercises, studentExerciseAttempts, scheduledClasses, assessments } from "../drizzle/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";

// ─── Helpers ────────────────────────────────────────────────────────────────

function randomSuffix() {
  return Math.random().toString(36).substring(2, 10);
}

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.oasis.opendocument.text": "odt",
  "application/vnd.oasis.opendocument.presentation": "odp",
};

// ─── Router ─────────────────────────────────────────────────────────────────

export const activitiesRouter = router({

  // ── Professor: criar atividade ──────────────────────────────────────────
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      subjectId: z.number().optional(),
      classId: z.number().optional(),
      dueDate: z.string().optional(), // ISO string
      maxScore: z.number().min(0).max(1000).default(10),
      status: z.enum(["draft", "published"]).default("published"),
      bimestre: z.number().min(1).max(4).default(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(activities).values({
        userId: ctx.user.id,
        title: input.title,
        description: input.description,
        subjectId: input.subjectId,
        classId: input.classId,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        maxScore: String(input.maxScore),
        status: input.status,
        bimestre: input.bimestre,
      });
      const activityId = (result as any).insertId;

      // Notificar alunos automaticamente se a atividade for publicada
      if (input.status === 'published') {
        try {
          let studentsToNotify: Array<{ userId: number }> = [];

          if (input.subjectId) {
            // Buscar alunos matriculados na disciplina
            const enrolled = await getStudentsBySubject(input.subjectId, ctx.user.id);
            studentsToNotify = enrolled
              .filter((s: any) => s.status === 'active' && s.userId)
              .map((s: any) => ({ userId: s.userId }));
          } else if (input.classId) {
            // Buscar alunos matriculados na turma
            const classStudents = await db.execute(
              sql`SELECT DISTINCT s.userId FROM students s
                  JOIN student_class_enrollments sce ON sce.studentId = s.id
                  WHERE sce.classId = ${input.classId} AND sce.status = 'active' AND s.userId IS NOT NULL`
            ) as any[];
            studentsToNotify = ((classStudents[0] as any[]) || []).map((r: any) => ({ userId: r.userId }));
          } else {
            // Sem disciplina/turma: notificar todos os alunos do professor
            const allStudents = await db.execute(
              sql`SELECT DISTINCT s.userId FROM students s WHERE s.userId IN (
                SELECT DISTINCT se.studentId FROM subjectEnrollments se
                JOIN subjects sub ON sub.id = se.subjectId
                WHERE sub.userId = ${ctx.user.id} AND se.status = 'active'
              ) AND s.userId IS NOT NULL`
            ) as any[];
            studentsToNotify = ((allStudents[0] as any[]) || []).map((r: any) => ({ userId: r.userId }));
          }

          const dueDateMsg = input.dueDate
            ? ` Prazo: ${new Date(input.dueDate).toLocaleDateString('pt-BR')}.`
            : '';

          const actTitle = '📋 Nova Atividade Disponível';
          const actBody = `A atividade "${input.title}" foi publicada.${dueDateMsg}`;
          for (const student of studentsToNotify) {
            await createNotification({
              userId: student.userId,
              type: 'new_activity',
              title: actTitle,
              message: actBody,
              link: '/student/activities',
              relatedId: activityId,
            });
            // Push notification (chega mesmo com app fechado)
            pushNotif.sendPushNotification(student.userId, {
              title: actTitle,
              body: actBody,
              tag: `activity-${activityId}`,
              url: '/student/activities',
              type: 'activity',
              referenceId: String(activityId),
            }).catch(err => console.error('[Push] Erro ao enviar push de atividade', student.userId, err));
          }
        } catch (e) {
          console.error('[activities.create] Erro ao notificar alunos:', e);
        }
      }

      return { success: true, id: activityId };
    }),

  // ── Professor: listar atividades criadas ────────────────────────────────
  listByProfessor: protectedProcedure
    .input(z.object({
      subjectId: z.number().optional(),
      classId: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const rows = await db
        .select({
          id: activities.id,
          title: activities.title,
          description: activities.description,
          subjectId: activities.subjectId,
          classId: activities.classId,
          dueDate: activities.dueDate,
          maxScore: activities.maxScore,
          status: activities.status,
          createdAt: activities.createdAt,
        })
        .from(activities)
        .where(
          and(
            eq(activities.userId, ctx.user.id),
            input?.subjectId ? eq(activities.subjectId, input.subjectId) : undefined,
            input?.classId ? eq(activities.classId, input.classId) : undefined,
          )
        )
        .orderBy(desc(activities.createdAt));

      // Para cada atividade, contar submissões
      const activityIds = rows.map(r => r.id);
      let submissionCounts: Record<number, number> = {};
      if (activityIds.length > 0) {
        const counts = await db
          .select({
            activityId: activitySubmissions.activityId,
            count: sql<number>`count(*)`,
          })
          .from(activitySubmissions)
          .where(inArray(activitySubmissions.activityId, activityIds))
          .groupBy(activitySubmissions.activityId);
        counts.forEach(c => { submissionCounts[c.activityId] = Number(c.count); });
      }

      // Para cada atividade, contar total de alunos matriculados (via turma ou disciplina)
      const classIds = Array.from(new Set(rows.map(r => r.classId).filter(Boolean) as number[]));
      const subjectIds = Array.from(new Set(rows.map(r => r.subjectId).filter(Boolean) as number[]));
      let classStudentCounts: Record<number, number> = {};
      let subjectStudentCounts: Record<number, number> = {};

      if (classIds.length > 0) {
        const classCounts = await db
          .select({
            classId: studentClassEnrollments.classId,
            count: sql<number>`count(*)`,
          })
          .from(studentClassEnrollments)
          .where(inArray(studentClassEnrollments.classId, classIds))
          .groupBy(studentClassEnrollments.classId);
        classCounts.forEach(c => { classStudentCounts[c.classId] = Number(c.count); });
      }

      if (subjectIds.length > 0) {
        const subjectCounts = await db
          .select({
            subjectId: subjectEnrollments.subjectId,
            count: sql<number>`count(*)`,
          })
          .from(subjectEnrollments)
          .where(and(
            inArray(subjectEnrollments.subjectId, subjectIds),
            eq(subjectEnrollments.status, 'active'),
          ))
          .groupBy(subjectEnrollments.subjectId);
        subjectCounts.forEach(c => { subjectStudentCounts[c.subjectId] = Number(c.count); });
      }

      return rows.map(r => {
        // Prioridade: usar classId se tiver alunos, senão usar subjectId
        // Isso resolve o caso onde a atividade tem classId e subjectId mas os alunos
        // estão matriculados via subjectEnrollments (não via studentClassEnrollments)
        const classCount = r.classId ? (classStudentCounts[r.classId] ?? 0) : 0;
        const subjectCount = r.subjectId ? (subjectStudentCounts[r.subjectId] ?? 0) : 0;
        const totalStudents = classCount > 0 ? classCount : subjectCount;
        return {
          ...r,
          maxScore: Number(r.maxScore),
          submissionCount: submissionCounts[r.id] ?? 0,
          totalStudents,
        };
      });
    }),

  // ── Professor: ver submissões de uma atividade ──────────────────────────
  getSubmissions: protectedProcedure
    .input(z.object({ activityId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      // Verificar que a atividade pertence ao professor
      const [activity] = await db
        .select()
        .from(activities)
        .where(and(eq(activities.id, input.activityId), eq(activities.userId, ctx.user.id)));
      if (!activity) throw new TRPCError({ code: "NOT_FOUND", message: "Atividade não encontrada" });

      const subs = await db
        .select({
          id: activitySubmissions.id,
          studentId: activitySubmissions.studentId,
          fileName: activitySubmissions.fileName,
          fileUrl: activitySubmissions.fileUrl,
          fileMimeType: activitySubmissions.fileMimeType,
          fileSizeBytes: activitySubmissions.fileSizeBytes,
          comment: activitySubmissions.comment,
          status: activitySubmissions.status,
          score: activitySubmissions.score,
          feedback: activitySubmissions.feedback,
          gradedAt: activitySubmissions.gradedAt,
          submittedAt: activitySubmissions.submittedAt,
          studentName: students.fullName,
          studentRegistration: students.registrationNumber,
        })
        .from(activitySubmissions)
        .leftJoin(students, eq(activitySubmissions.studentId, students.id))
        .where(eq(activitySubmissions.activityId, input.activityId))
        .orderBy(desc(activitySubmissions.submittedAt));

      return {
        activity: { ...activity, maxScore: Number(activity.maxScore) },
        submissions: subs.map(s => ({ ...s, score: s.score ? Number(s.score) : null })),
      };
    }),

  // ── Professor: avaliar submissão ────────────────────────────────────────
  gradeSubmission: protectedProcedure
    .input(z.object({
      submissionId: z.number(),
      score: z.number().min(0).max(1000),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      // Verificar que a submissão é de uma atividade do professor
      const [sub] = await db
        .select({ id: activitySubmissions.id, activityId: activitySubmissions.activityId, studentId: activitySubmissions.studentId })
        .from(activitySubmissions)
        .where(eq(activitySubmissions.id, input.submissionId));
      if (!sub) throw new TRPCError({ code: "NOT_FOUND", message: "Submissão não encontrada" });

      const [activity] = await db
        .select({ userId: activities.userId, title: activities.title, maxScore: activities.maxScore })
        .from(activities)
        .where(eq(activities.id, sub.activityId));
      if (!activity || activity.userId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão" });

      await db.update(activitySubmissions)
        .set({
          score: String(input.score),
          feedback: input.feedback,
          status: "graded",
          gradedAt: new Date(),
          gradedBy: ctx.user.id,
        })
        .where(eq(activitySubmissions.id, input.submissionId));

      // Notificar o aluno sobre a correção da atividade
      if (sub.studentId) {
        try {
          const [studentRow] = await db
            .select({ userId: students.userId })
            .from(students)
            .where(eq(students.id, sub.studentId));
          if (studentRow?.userId) {
            const maxScore = activity.maxScore ? Number(activity.maxScore) : 10;
            const nota = maxScore > 0 ? ((input.score / maxScore) * 10).toFixed(1) : input.score.toFixed(1);
            const feedbackMsg = input.feedback ? ` Feedback: "${input.feedback.slice(0, 80)}${input.feedback.length > 80 ? '...' : ''}"` : '';
            // Notificação in-app
            await createNotification({
              userId: studentRow.userId,
              type: 'grade_received',
              title: 'Atividade Corrigida',
              message: `Sua atividade "${activity.title}" foi corrigida. Nota: ${nota}/10.${feedbackMsg}`,
              link: '/student/activities',
              relatedId: sub.activityId,
            });
            // Push notification
            try {
              await pushNotif.sendPushNotification(studentRow.userId, {
                title: `✅ Nota lançada: ${activity.title}`,
                body: `Sua atividade foi corrigida. Nota: ${nota}/10.${input.feedback ? ' Veja o feedback!' : ''}`,
                url: '/student/activities',
                type: 'activity',
                tag: `grade-${sub.activityId}-${sub.id}`,
              });
            } catch (pushErr) {
              console.error('[Push] Erro ao enviar push de nota', pushErr);
            }
          }
        } catch (e) { /* notificação não deve bloquear correção */ }
      }

      return { success: true };
    }),

  // ── Professor: editar atividade ─────────────────────────────────────────
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      dueDate: z.string().nullable().optional(),
      maxScore: z.number().min(0).max(1000).optional(),
      status: z.enum(["draft", "published", "closed"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [activity] = await db
        .select({ userId: activities.userId })
        .from(activities)
        .where(eq(activities.id, input.id));
      if (!activity || activity.userId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão" });

      const { id, ...updateData } = input;
      await db.update(activities)
        .set({
          ...updateData,
          dueDate: updateData.dueDate ? new Date(updateData.dueDate) : updateData.dueDate === null ? null : undefined,
          maxScore: updateData.maxScore !== undefined ? String(updateData.maxScore) : undefined,
        })
        .where(eq(activities.id, id));

      return { success: true };
    }),

  // ── Professor: excluir atividade ────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [activity] = await db
        .select({ userId: activities.userId })
        .from(activities)
        .where(eq(activities.id, input.id));
      if (!activity || activity.userId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão" });

      await db.delete(activitySubmissions).where(eq(activitySubmissions.activityId, input.id));
      await db.delete(activities).where(eq(activities.id, input.id));
      return { success: true };
    }),

  // ── Upload de arquivo para S3 (professor ou aluno) ──────────────────────
    getUploadUrl: studentProcedure
    .input(z.object({
      fileName: z.string(),
      mimeType: z.string(),
      fileSizeBytes: z.number(),
      fileBase64: z.string(), // arquivo em base64
      activityId: z.number(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      // Validar tipo de arquivo
      if (!ALLOWED_MIME_TYPES[input.mimeType]) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Formato de arquivo não permitido. Use PDF, Word ou PowerPoint.",
        });
      }
      // Validar tamanho (20MB)
      if (input.fileSizeBytes > 20 * 1024 * 1024) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Arquivo muito grande. O limite é 20MB.",
        });
      }
      // Verificar que a atividade existe
      const [activity] = await db
        .select()
        .from(activities)
        .where(eq(activities.id, input.activityId));
      if (!activity) throw new TRPCError({ code: "NOT_FOUND", message: "Atividade não encontrada" });
      // Usar studentId da sessão de aluno
      const studentId = ctx.studentSession.studentId;

      // Upload para S3
      const ext = ALLOWED_MIME_TYPES[input.mimeType];
      const fileKey = `activities/${input.activityId}/student-${studentId}-${randomSuffix()}.${ext}`;
      const fileBuffer = Buffer.from(input.fileBase64, "base64");
      const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);

      // Verificar se já existe submissão (atualizar ou criar)
      const [existing] = await db
        .select({ id: activitySubmissions.id })
        .from(activitySubmissions)
        .where(and(
          eq(activitySubmissions.activityId, input.activityId),
          eq(activitySubmissions.studentId, studentId),
        ));

      if (existing) {
        await db.update(activitySubmissions)
          .set({
            fileUrl: url,
            fileKey,
            fileName: input.fileName,
            fileMimeType: input.mimeType,
            fileSizeBytes: input.fileSizeBytes,
            comment: input.comment,
            status: "submitted",
            score: null,
            feedback: null,
            gradedAt: null,
            gradedBy: null,
            submittedAt: new Date(),
          })
          .where(eq(activitySubmissions.id, existing.id));
        // Notificar professor sobre reenvio
        try {
          await createNotification({
            userId: activity.userId,
            type: 'new_assignment',
            title: 'Atividade Reenviada',
            message: `O aluno ${ctx.studentSession.fullName} reenviou a atividade "${activity.title}".`,
            link: '/student/activities',
              relatedId: input.activityId,
          });
        } catch (e) { /* notificação não deve bloquear envio */ }
        return { success: true, submissionId: existing.id, fileUrl: url };
      } else {
        const [result] = await db.insert(activitySubmissions).values({
          activityId: input.activityId,
          studentId,
          fileUrl: url,
          fileKey,
          fileName: input.fileName,
          fileMimeType: input.mimeType,
          fileSizeBytes: input.fileSizeBytes,
          comment: input.comment,
          status: "submitted",
        });
        // Notificar professor sobre novo envio
        try {
          await createNotification({
            userId: activity.userId,
            type: 'new_assignment',
            title: 'Nova Submissão de Atividade',
            message: `O aluno ${ctx.studentSession.fullName} enviou a atividade "${activity.title}".`,
            link: '/student/activities',
            relatedId: input.activityId,
          });
        } catch (e) { /* notificação não deve bloquear envio */ }
        return { success: true, submissionId: (result as any).insertId, fileUrl: url };
      }
    }),

  // ── Aluno: listar atividades da sua disciplina ──────────────────────────
  listForStudent: studentProcedure
    .query(async ({ ctx }) => {
      const db = (await getDb())!;
      // Usar studentId da sessão de aluno diretamente
      const studentId = ctx.studentSession.studentId;
      const student = { id: studentId };

      // Buscar matrículas do aluno para saber suas disciplinas (subjectEnrollments)
      const enrollResult = await db.execute(
        sql`SELECT DISTINCT se.subjectId FROM subjectEnrollments se WHERE se.studentId = ${student.id} AND se.status = 'active'`
      ) as any[];

      const seRows = enrollResult[0] as Array<{ subjectId: number }>;
      
      // Também buscar turmas do aluno (student_class_enrollments)
      const classResult = await db.execute(
        sql`SELECT DISTINCT sce.classId FROM student_class_enrollments sce WHERE sce.studentId = ${student.id}`
      ) as any[];
      const sceRows = classResult[0] as Array<{ classId: number }>;

      const subjectIds = Array.from(new Set((seRows || []).map((r: any) => r.subjectId).filter(Boolean))) as number[];
      const classIds = Array.from(new Set((sceRows || []).map((r: any) => r.classId).filter(Boolean))) as number[];

      // Se não tem nenhuma matrícula, retornar vazio
      if (subjectIds.length === 0 && classIds.length === 0) return [];

      // Buscar atividades publicadas para as disciplinas/turmas do aluno (com nome da disciplina e turma)
      const activityResult = await db.execute(
        sql`SELECT a.*, s.name AS subjectName, c.name AS className
            FROM activities a
            LEFT JOIN subjects s ON a.subjectId = s.id
            LEFT JOIN classes c ON a.classId = c.id
            WHERE a.status = 'published'
              AND (
                (a.subjectId IS NULL AND a.classId IS NULL)
                OR (a.subjectId IN (${sql.join(subjectIds.length > 0 ? subjectIds.map(id => sql`${id}`) : [sql`NULL`], sql`, `)}))
                OR (a.classId IN (${sql.join(classIds.length > 0 ? classIds.map(id => sql`${id}`) : [sql`NULL`], sql`, `)}))
              )
            ORDER BY a.createdAt DESC`
      ) as any[];
      const activityRows = (activityResult[0] || []) as any[];

      // Buscar submissões do aluno
      const activityIds = activityRows.map((a: any) => a.id as number);
      let mySubmissions: Record<number, any> = {};
      if (activityIds.length > 0) {
        const subsResult = await db.execute(
          sql`SELECT * FROM activity_submissions WHERE activityId IN (${sql.join(activityIds.map((id: number) => sql`${id}`), sql`, `)}) AND studentId = ${student.id}`
        ) as any[];
        const subsRows = subsResult[0] as any[];
        if (subsRows) subsRows.forEach((s: any) => { mySubmissions[s.activityId] = s; });
      }

      return activityRows.map((a: any) => ({
        ...a,
        maxScore: Number(a.maxScore),
        subjectName: a.subjectName || null,
        className: a.className || null,
        mySubmission: mySubmissions[a.id]
          ? { ...mySubmissions[a.id], score: mySubmissions[a.id].score ? Number(mySubmissions[a.id].score) : null }
          : null,
      }));
    }),

  // ─── PAINEL DE NOTAS DO PROFESSOR ──────────────────────────────────────────

  // Buscar disciplinas de uma turma (via scheduled_classes)
  getSubjectsByClass: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const result = await db
        .selectDistinct({
          subjectId: scheduledClasses.subjectId,
          subjectName: subjects.name,
        })
        .from(scheduledClasses)
        .innerJoin(subjects, eq(scheduledClasses.subjectId, subjects.id))
        .where(
          and(
            eq(scheduledClasses.classId, input.classId),
            eq(scheduledClasses.userId, ctx.user.id)
          )
        )
        .orderBy(subjects.name);

      return result;
    }),

  // Buscar todas as combinações Disciplina — Turma do professor (via scheduled_classes)
  getSubjectClassCombinations: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Buscar combinações reais de disciplina + turma via scheduled_classes
      const withClass = await db
        .selectDistinct({
          subjectId: subjects.id,
          subjectName: subjects.name,
          classId: classes.id,
          className: classes.name,
        })
        .from(scheduledClasses)
        .innerJoin(subjects, eq(scheduledClasses.subjectId, subjects.id))
        .innerJoin(classes, eq(scheduledClasses.classId, classes.id))
        .where(eq(scheduledClasses.userId, ctx.user.id))
        .orderBy(subjects.name, classes.name);

      // Fallback: disciplinas sem turma vinculada em scheduled_classes
      const subjectsWithClass = new Set(withClass.map(r => r.subjectId));
      const allSubjects = await db
        .select({ subjectId: subjects.id, subjectName: subjects.name })
        .from(subjects)
        .where(eq(subjects.userId, ctx.user.id))
        .orderBy(subjects.name);

      const withoutClass = allSubjects
        .filter(s => !subjectsWithClass.has(s.subjectId))
        .map(s => ({ subjectId: s.subjectId, subjectName: s.subjectName, classId: 0, className: null }));

      return [...withClass, ...withoutClass];
    }),

  // Buscar alunos de uma disciplina com notas consolidadas (exercícios + atividades)
  getGradesByClass: protectedProcedure
    .input(z.object({
      classId: z.number(), // classId agora é o subjectId (mantido por compatibilidade)
      subjectId: z.number().optional(),
      bimestre: z.number().min(1).max(4).optional(), // Filtro por bimestre (1-4)
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const subjectIds = input.subjectId
        ? [input.subjectId]
        : (input.classId > 0 ? [input.classId] : []);

      if (subjectIds.length === 0) return { students: [], bimestre: input.bimestre || 0 };

      // Buscar alunos matriculados
      const enrolledStudentsRaw = await db
        .select({
          studentId: subjectEnrollments.studentId,
          studentName: students.fullName,
          registrationNumber: students.registrationNumber,
        })
        .from(subjectEnrollments)
        .innerJoin(students, eq(subjectEnrollments.studentId, students.id))
        .where(
          and(
            inArray(subjectEnrollments.subjectId, subjectIds),
            eq(subjectEnrollments.userId, ctx.user.id)
          )
        )
        .orderBy(students.fullName);

      const seen = new Set<number>();
      const enrolledStudents = enrolledStudentsRaw.filter(s => {
        if (seen.has(s.studentId)) return false;
        seen.add(s.studentId);
        return true;
      });

      if (enrolledStudents.length === 0) return { students: [], bimestre: input.bimestre || 0 };

      const studentIds = enrolledStudents.map(s => s.studentId);

      // Buscar notas de EXERCÍCIOS ONLINE (Atividade da Trilha)
      const exerciseGrades = await db
        .select({
          studentId: studentExerciseAttempts.studentId,
          exerciseId: studentExercises.id,
          exerciseTitle: studentExercises.title,
          subjectId: studentExercises.subjectId,
          bimestre: studentExercises.bimestre,
          score: studentExerciseAttempts.score,
          passingScore: studentExercises.passingScore,
          status: studentExerciseAttempts.status,
          completedAt: studentExerciseAttempts.completedAt,
        })
        .from(studentExerciseAttempts)
        .innerJoin(studentExercises, eq(studentExerciseAttempts.exerciseId, studentExercises.id))
        .where(
          and(
            inArray(studentExerciseAttempts.studentId, studentIds),
            eq(studentExerciseAttempts.status, 'completed'),
            ...(input.subjectId ? [eq(studentExercises.subjectId, input.subjectId)] : []),
            ...(input.bimestre ? [eq(studentExercises.bimestre, input.bimestre)] : [])
          )
        );

      // Buscar notas de ATIVIDADES EM SALA
      const activityGrades = await db
        .select({
          studentId: activitySubmissions.studentId,
          activityId: activities.id,
          activityTitle: activities.title,
          subjectId: activities.subjectId,
          bimestre: activities.bimestre,
          score: activitySubmissions.score,
          maxScore: activities.maxScore,
          feedback: activitySubmissions.feedback,
          status: activitySubmissions.status,
          gradedAt: activitySubmissions.gradedAt,
        })
        .from(activitySubmissions)
        .innerJoin(activities, eq(activitySubmissions.activityId, activities.id))
        .where(
          and(
            inArray(activitySubmissions.studentId, studentIds),
            eq(activitySubmissions.status, 'graded'),
            eq(activities.userId, ctx.user.id),
            ...(input.subjectId ? [eq(activities.subjectId, input.subjectId)] : []),
            ...(input.bimestre ? [eq(activities.bimestre, input.bimestre)] : [])
          )
        );

      // Buscar notas de PROVAS (assessment_attempts)
      let assessmentGradesRaw: any[] = [];
      if (studentIds.length > 0) {
        const subjectFilter = input.subjectId ? input.subjectId : (input.classId > 0 ? input.classId : null);
        const bimestreFilter = input.bimestre;
        const result = await db.execute(
          sql`SELECT aa.studentId, aa.score, aa.percentage, aa.passed, aa.submittedAt,
                     a.title as assessmentTitle, a.totalPoints, a.id as assessmentId, a.subjectId, a.bimestre
              FROM assessment_attempts aa
              JOIN assessments a ON aa.assessmentId = a.id
              WHERE aa.studentId IN (${sql.join(studentIds.map(id => sql`${id}`), sql`, `)})
                AND aa.status = 'submitted'
                ${subjectFilter ? sql`AND a.subjectId = ${subjectFilter}` : sql``}
                ${bimestreFilter ? sql`AND a.bimestre = ${bimestreFilter}` : sql``}
              ORDER BY aa.submittedAt DESC`
        ) as any[];
        assessmentGradesRaw = (result[0] as any[]) || [];
      }

      // Helper: pegar nota mais alta por item (múltiplas tentativas)
      function bestByKey<T>(items: T[], keyFn: (item: T) => string | number, scoreFn: (item: T) => number): T[] {
        const best = new Map<string | number, T>();
        for (const item of items) {
          const key = keyFn(item);
          const existing = best.get(key);
          if (!existing || scoreFn(item) > scoreFn(existing)) {
            best.set(key, item);
          }
        }
        return Array.from(best.values());
      }

      // Montar resultado por aluno com fórmula de bimestre
      const studentsData = enrolledStudents.map(student => {
        // Exercícios do aluno (Atividade da Trilha) — nota mais alta por exercício
        const allStudentExGrades = exerciseGrades.filter(g => g.studentId === student.studentId);
        const studentExGrades = bestByKey(allStudentExGrades, g => g.exerciseId, g => g.score ?? 0);
        // Média dos exercícios normalizada para escala 0-10
        const exerciseAvg = studentExGrades.length > 0
          ? studentExGrades.reduce((sum, g) => sum + ((g.score ?? 0) / 10), 0) / studentExGrades.length
          : null;

        // Atividades do aluno (Atividade de Sala) — nota mais alta por atividade
        const allStudentActGrades = activityGrades.filter(g => g.studentId === student.studentId);
        const studentActGrades = bestByKey(allStudentActGrades, g => g.activityId, g => parseFloat(String(g.score ?? 0)));
        const activityAvg = studentActGrades.length > 0
          ? studentActGrades.reduce((sum, g) => {
              const score = parseFloat(String(g.score ?? 0));
              const maxScore = parseFloat(String(g.maxScore ?? 10));
              return sum + (maxScore > 0 ? (score / maxScore) * 10 : 0);
            }, 0) / studentActGrades.length
          : null;

        // Notas de provas do aluno — nota mais alta por prova
        const allStudentAssessGrades = assessmentGradesRaw.filter((g: any) => g.studentId === student.studentId);
        const studentAssessGrades = bestByKey(allStudentAssessGrades, (g: any) => g.assessmentId, (g: any) => parseFloat(String(g.score ?? 0)));
        const assessmentAvg = studentAssessGrades.length > 0
          ? studentAssessGrades.reduce((sum: number, g: any) => {
              const totalPoints = parseFloat(String(g.totalPoints ?? 10));
              const score = parseFloat(String(g.score ?? 0));
              return sum + (totalPoints > 0 ? (score / totalPoints) * 10 : 0);
            }, 0) / studentAssessGrades.length
          : null;

        // === FÓRMULA POR BIMESTRE ===
        // Bloco 1 = (Média Atividade Trilha + Média Atividade Sala) / 2
        // Bloco 2 = Nota da Prova
        // Média Bimestral = (Bloco1 + Bloco2) / 2
        // Bloco 1 só é calculado quando AMBAS Ativ. Trilha (exerciseAvg) e Ativ. Sala (activityAvg) têm nota
        const bloco1 = (exerciseAvg !== null && activityAvg !== null)
          ? (exerciseAvg + activityAvg) / 2
          : null;
        const bloco2 = assessmentAvg;
        // Média Bimestral só é calculada quando AMBOS Bloco 1 e Bloco 2 existem
        const mediaBimestral = (bloco1 !== null && bloco2 !== null)
          ? (bloco1 + bloco2) / 2
          : null;

        return {
          studentId: student.studentId,
          studentName: student.studentName,
          registrationNumber: student.registrationNumber,
          // Contagens
          exerciseCount: studentExGrades.length,
          activityCount: studentActGrades.length,
          assessmentCount: studentAssessGrades.length,
          // Médias individuais
          exerciseAverage: exerciseAvg !== null ? parseFloat(exerciseAvg.toFixed(2)) : null,
          activityAverage: activityAvg !== null ? parseFloat(activityAvg.toFixed(2)) : null,
          assessmentAverage: assessmentAvg !== null ? parseFloat(assessmentAvg.toFixed(2)) : null,
          // Blocos e média bimestral
          bloco1: bloco1 !== null ? parseFloat(bloco1.toFixed(2)) : null,
          bloco2: bloco2 !== null ? parseFloat(bloco2.toFixed(2)) : null,
          mediaBimestral: mediaBimestral !== null ? parseFloat(mediaBimestral.toFixed(2)) : null,
          // Compatibilidade
          overallAverage: mediaBimestral !== null ? parseFloat(mediaBimestral.toFixed(2)) : null,
          // Detalhes
          exercises: studentExGrades.map(g => ({
            exerciseId: g.exerciseId,
            title: g.exerciseTitle,
            bimestre: g.bimestre,
            grade: parseFloat(((g.score ?? 0) / 10).toFixed(2)),
            passingGrade: parseFloat(((g.passingScore ?? 60) / 10).toFixed(1)),
            approved: (g.score ?? 0) >= (g.passingScore ?? 60),
            completedAt: g.completedAt,
          })),
          activities: studentActGrades.map(g => ({
            activityId: g.activityId,
            title: g.activityTitle,
            bimestre: g.bimestre,
            score: parseFloat(String(g.score ?? 0)),
            maxScore: parseFloat(String(g.maxScore ?? 10)),
            grade10: parseFloat(String(g.maxScore ?? 10)) > 0
              ? parseFloat(((parseFloat(String(g.score ?? 0)) / parseFloat(String(g.maxScore ?? 10))) * 10).toFixed(2))
              : 0,
            feedback: g.feedback,
            gradedAt: g.gradedAt,
          })),
          assessments: studentAssessGrades.map((g: any) => ({
            assessmentId: g.assessmentId,
            title: g.assessmentTitle,
            bimestre: g.bimestre,
            score: parseFloat(String(g.score ?? 0)),
            totalPoints: parseFloat(String(g.totalPoints ?? 10)),
            grade10: parseFloat(String(g.totalPoints ?? 10)) > 0
              ? parseFloat(((parseFloat(String(g.score ?? 0)) / parseFloat(String(g.totalPoints ?? 10))) * 10).toFixed(2))
              : 0,
            percentage: parseFloat(String(g.percentage ?? 0)),
            passed: !!g.passed,
            submittedAt: g.submittedAt,
          })),
        };
      });

      return { students: studentsData, bimestre: input.bimestre || 0 };
    }),

  // Buscar relatório individual detalhado de um aluno
  getStudentReport: protectedProcedure
    .input(z.object({
      studentId: z.number(),
      subjectId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Buscar dados do aluno
      const [student] = await db
        .select()
        .from(students)
        .where(and(eq(students.id, input.studentId), eq(students.userId, ctx.user.id)))
        .limit(1);

      if (!student) throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });

      // Buscar exercícios
      const exerciseResults = await db
        .select({
          exerciseId: studentExercises.id,
          exerciseTitle: studentExercises.title,
          subjectId: studentExercises.subjectId,
          subjectName: subjects.name,
          score: studentExerciseAttempts.score,
          passingScore: studentExercises.passingScore,
          totalQuestions: studentExercises.totalQuestions,
          completedAt: studentExerciseAttempts.completedAt,
        })
        .from(studentExerciseAttempts)
        .innerJoin(studentExercises, eq(studentExerciseAttempts.exerciseId, studentExercises.id))
        .innerJoin(subjects, eq(studentExercises.subjectId, subjects.id))
        .where(
          and(
            eq(studentExerciseAttempts.studentId, input.studentId),
            eq(studentExerciseAttempts.status, 'completed'),
            ...(input.subjectId ? [eq(studentExercises.subjectId, input.subjectId)] : [])
          )
        )
        .orderBy(desc(studentExerciseAttempts.completedAt));

      // Buscar atividades em sala
      const activityResults = await db
        .select({
          activityId: activities.id,
          activityTitle: activities.title,
          subjectId: activities.subjectId,
          subjectName: subjects.name,
          score: activitySubmissions.score,
          maxScore: activities.maxScore,
          feedback: activitySubmissions.feedback,
          gradedAt: activitySubmissions.gradedAt,
          submittedAt: activitySubmissions.submittedAt,
        })
        .from(activitySubmissions)
        .innerJoin(activities, eq(activitySubmissions.activityId, activities.id))
        .innerJoin(subjects, eq(activities.subjectId, subjects.id))
        .where(
          and(
            eq(activitySubmissions.studentId, input.studentId),
            eq(activitySubmissions.status, 'graded'),
            eq(activities.userId, ctx.user.id),
            ...(input.subjectId ? [eq(activities.subjectId, input.subjectId)] : [])
          )
        )
        .orderBy(desc(activitySubmissions.gradedAt));

      // Buscar notas de PROVAS (assessment_attempts) do aluno
      const dbConn = await getDb();
      let assessmentResults: any[] = [];
      if (dbConn) {
        const subjectFilter = input.subjectId ? sql`AND a.subjectId = ${input.subjectId}` : sql``;
        const result = await dbConn.execute(
          sql`SELECT aa.id as attemptId, aa.score, aa.percentage, aa.passed,
                     aa.totalCorrect, aa.totalWrong, aa.submittedAt,
                     a.id as assessmentId, a.title as assessmentTitle,
                     a.totalPoints, a.passingScore, a.assessmentType,
                     s.name as subjectName
              FROM assessment_attempts aa
              JOIN assessments a ON a.id = aa.assessmentId
              JOIN subjects s ON s.id = a.subjectId
              WHERE aa.studentId = ${input.studentId}
                AND aa.status = 'submitted'
                AND a.teacherId = ${ctx.user.id}
                ${subjectFilter}
              ORDER BY aa.submittedAt DESC`
        ) as any[];
        assessmentResults = (result[0] as any[]) || [];
      }

      // Helper: pegar nota mais alta por item (múltiplas tentativas)
      function bestByKeyReport<T>(items: T[], keyFn: (item: T) => string | number, scoreFn: (item: T) => number): T[] {
        const best = new Map<string | number, T>();
        for (const item of items) {
          const key = keyFn(item);
          const existing = best.get(key);
          if (!existing || scoreFn(item) > scoreFn(existing)) {
            best.set(key, item);
          }
        }
        return Array.from(best.values());
      }

      // Nota mais alta por exercício
      const bestExercises = bestByKeyReport(exerciseResults, e => e.exerciseId, e => e.score ?? 0);
      // Nota mais alta por atividade
      const bestActivities = bestByKeyReport(activityResults, a => a.activityId, a => parseFloat(String(a.score ?? 0)));
      // Nota mais alta por prova
      const bestAssessments = bestByKeyReport(assessmentResults, (g: any) => g.assessmentId, (g: any) => parseFloat(String(g.score ?? 0)));

      return {
        student: {
          id: student.id,
          name: student.fullName,
          registrationNumber: student.registrationNumber,
          email: student.email,
        },
        exercises: bestExercises.map(e => ({
          exerciseId: e.exerciseId,
          title: e.exerciseTitle,
          subjectName: e.subjectName,
          grade: parseFloat(((e.score ?? 0) / 10).toFixed(2)),
          passingGrade: parseFloat(((e.passingScore ?? 60) / 10).toFixed(1)),
          totalQuestions: e.totalQuestions,
          approved: (e.score ?? 0) >= (e.passingScore ?? 60),
          completedAt: e.completedAt,
        })),
        activities: bestActivities.map(a => ({
          activityId: a.activityId,
          title: a.activityTitle,
          subjectName: a.subjectName,
          score: parseFloat(String(a.score ?? 0)),
          maxScore: parseFloat(String(a.maxScore ?? 10)),
          grade10: parseFloat(String(a.maxScore ?? 10)) > 0
            ? parseFloat(((parseFloat(String(a.score ?? 0)) / parseFloat(String(a.maxScore ?? 10))) * 10).toFixed(2))
            : 0,
          feedback: a.feedback,
          gradedAt: a.gradedAt,
          submittedAt: a.submittedAt,
         })),
        assessments: bestAssessments.map((g: any) => ({
          assessmentId: g.assessmentId,
          title: g.assessmentTitle,
          subjectName: g.subjectName,
          score: parseFloat(String(g.score ?? 0)),
          totalPoints: parseFloat(String(g.totalPoints ?? 10)),
          grade10: parseFloat(String(g.totalPoints ?? 10)) > 0
            ? parseFloat(((parseFloat(String(g.score ?? 0)) / parseFloat(String(g.totalPoints ?? 10))) * 10).toFixed(2))
            : 0,
          percentage: parseFloat(String(g.percentage ?? 0)),
          passed: !!g.passed,
          assessmentType: g.assessmentType,
          submittedAt: g.submittedAt,
        })),
      };
    }),

  // ── Professor: exportar lista de submissões de uma atividade ──────────────────────
  exportSubmissions: protectedProcedure
    .input(z.object({ activityId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      // Verificar que a atividade pertence ao professor
      const [activity] = await db
        .select()
        .from(activities)
        .where(and(eq(activities.id, input.activityId), eq(activities.userId, ctx.user.id)));
      if (!activity) throw new TRPCError({ code: 'NOT_FOUND', message: 'Atividade não encontrada' });

      // Buscar todas as submissões
      const subs = await db
        .select({
          studentId: activitySubmissions.studentId,
          studentName: students.fullName,
          studentRegistration: students.registrationNumber,
          submittedAt: activitySubmissions.submittedAt,
          score: activitySubmissions.score,
          feedback: activitySubmissions.feedback,
          status: activitySubmissions.status,
        })
        .from(activitySubmissions)
        .leftJoin(students, eq(activitySubmissions.studentId, students.id))
        .where(eq(activitySubmissions.activityId, input.activityId))
        .orderBy(students.fullName);

      const submittedIds = new Set(subs.map(s => s.studentId));

      // Buscar todos os alunos matriculados na turma ou disciplina da atividade
      let enrolledStudents: Array<{ studentId: number; studentName: string | null; studentRegistration: string | null }> = [];

      if (activity.classId) {
        // Buscar alunos via student_class_enrollments
        const classStudents = await db
          .select({
            studentId: studentClassEnrollments.studentId,
            studentName: students.fullName,
            studentRegistration: students.registrationNumber,
          })
          .from(studentClassEnrollments)
          .leftJoin(students, eq(studentClassEnrollments.studentId, students.id))
          .where(eq(studentClassEnrollments.classId, activity.classId))
          .orderBy(students.fullName);
        enrolledStudents = classStudents;
      } else if (activity.subjectId) {
        // Buscar alunos via subjectEnrollments
        const subjectStudents = await db
          .select({
            studentId: subjectEnrollments.studentId,
            studentName: students.fullName,
            studentRegistration: students.registrationNumber,
          })
          .from(subjectEnrollments)
          .leftJoin(students, eq(subjectEnrollments.studentId, students.id))
          .where(and(
            eq(subjectEnrollments.subjectId, activity.subjectId),
            eq(subjectEnrollments.status, 'active'),
          ))
          .orderBy(students.fullName);
        enrolledStudents = subjectStudents;
      }

      // Montar lista completa: enviaram + não enviaram
      const submissionMap = new Map(subs.map(s => [s.studentId, s]));

      const rows = enrolledStudents.map(e => {
        const sub = submissionMap.get(e.studentId);
        return {
          nome: e.studentName || `Aluno #${e.studentId}`,
          matricula: e.studentRegistration || '',
          status: sub ? 'Enviou' : 'Não enviou',
          dataEnvio: sub?.submittedAt ? new Date(sub.submittedAt).toLocaleString('pt-BR') : '',
          nota: sub?.score !== null && sub?.score !== undefined ? String(sub.score) : '',
          feedback: sub?.feedback || '',
        };
      });

      // Adicionar alunos que enviaram mas não estão na lista de matriculados
      subs.forEach(s => {
        if (!enrolledStudents.find(e => e.studentId === s.studentId)) {
          rows.push({
            nome: s.studentName || `Aluno #${s.studentId}`,
            matricula: s.studentRegistration || '',
            status: 'Enviou',
            dataEnvio: s.submittedAt ? new Date(s.submittedAt).toLocaleString('pt-BR') : '',
            nota: s.score !== null && s.score !== undefined ? String(s.score) : '',
            feedback: s.feedback || '',
          });
        }
      });

      return {
        activityTitle: activity.title,
        maxScore: Number(activity.maxScore),
        rows,
      };
    }),

  // Listar alunos pendentes e concluídos para uma atividade de sala
  getPendingStudentsForActivity: protectedProcedure
    .input(z.object({ activityId: z.number() }))
    .query(async ({ ctx, input }) => {
      const dbConn = await getDb();
      if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      // Verificar que a atividade pertence ao professor
      const actResult = await dbConn.execute(
        sql`SELECT id, subjectId, classId FROM activities WHERE id = ${input.activityId} AND userId = ${ctx.user.id} LIMIT 1`
      ) as any[];
      const actRows = (actResult[0] as any[]) || [];
      if (actRows.length === 0) throw new TRPCError({ code: 'FORBIDDEN', message: 'Atividade não encontrada' });
      const { subjectId, classId } = actRows[0];
      // Buscar todos os alunos ativos (por disciplina ou por turma) - usa students.fullName
      let studentsResult: any[];
      if (subjectId) {
        studentsResult = await dbConn.execute(
          sql`SELECT s.id AS studentId, s.fullName AS name
              FROM students s
              INNER JOIN subjectEnrollments se ON se.studentId = s.id
              WHERE se.subjectId = ${subjectId} AND se.status = 'active'
              ORDER BY s.fullName ASC`
        ) as any[];
      } else if (classId) {
        studentsResult = await dbConn.execute(
          sql`SELECT s.id AS studentId, s.fullName AS name
              FROM students s
              INNER JOIN studentClassEnrollments sce ON sce.studentId = s.id
              WHERE sce.classId = ${classId}
              ORDER BY s.fullName ASC`
        ) as any[];
      } else {
        studentsResult = await dbConn.execute(
          sql`SELECT s.id AS studentId, s.fullName AS name
              FROM students s
              WHERE s.userId = ${ctx.user.id}
              ORDER BY s.fullName ASC`
        ) as any[];
      }
      const allStudents: { studentId: number; name: string }[] = ((studentsResult[0] as any[]) || []).map((r: any) => ({
        studentId: r.studentId,
        name: r.name || `Aluno #${r.studentId}`,
      }));
      // Buscar alunos que já enviaram a atividade
      const doneResult = await dbConn.execute(
        sql`SELECT DISTINCT studentId FROM activity_submissions WHERE activityId = ${input.activityId}`
      ) as any[];
      const doneIds = new Set(((doneResult[0] as any[]) || []).map((r: any) => r.studentId));
      const done = allStudents.filter(s => doneIds.has(s.studentId));
      const pending = allStudents.filter(s => !doneIds.has(s.studentId));
      return { pending, done, total: allStudents.length };
    }),
});
