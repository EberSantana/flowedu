import { z } from "zod";
import { router, protectedProcedure, publicProcedure, studentProcedure } from "./_core/trpc";
import { getDb, createNotification } from "./db";
import { activities, activitySubmissions, students, subjects, classes, studentClassEnrollments, subjectEnrollments, studentExercises, studentExerciseAttempts } from "../drizzle/schema";
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
      });
      return { success: true, id: (result as any).insertId };
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

      return rows.map(r => ({
        ...r,
        maxScore: Number(r.maxScore),
        submissionCount: submissionCounts[r.id] ?? 0,
      }));
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
        .select({ id: activitySubmissions.id, activityId: activitySubmissions.activityId })
        .from(activitySubmissions)
        .where(eq(activitySubmissions.id, input.submissionId));
      if (!sub) throw new TRPCError({ code: "NOT_FOUND", message: "Submissão não encontrada" });

      const [activity] = await db
        .select({ userId: activities.userId })
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
            link: '/atividades-em-sala',
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
            link: '/atividades-em-sala',
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

  // Buscar alunos de uma turma com notas consolidadas (exercícios + atividades)
  getGradesByClass: protectedProcedure
    .input(z.object({
      classId: z.number(),
      subjectId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Buscar alunos matriculados na turma
      const enrolledStudents = await db
        .select({
          studentId: studentClassEnrollments.studentId,
          studentName: students.fullName,
          registrationNumber: students.registrationNumber,
        })
        .from(studentClassEnrollments)
        .innerJoin(students, eq(studentClassEnrollments.studentId, students.id))
        .where(
          and(
            eq(studentClassEnrollments.classId, input.classId),
            eq(studentClassEnrollments.userId, ctx.user.id)
          )
        )
        .orderBy(students.fullName);

      if (enrolledStudents.length === 0) return [];

      const studentIds = enrolledStudents.map(s => s.studentId);

      // Buscar notas de EXERCÍCIOS ONLINE
      const exerciseGrades = await db
        .select({
          studentId: studentExerciseAttempts.studentId,
          exerciseId: studentExercises.id,
          exerciseTitle: studentExercises.title,
          subjectId: studentExercises.subjectId,
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
            ...(input.subjectId ? [eq(studentExercises.subjectId, input.subjectId)] : [])
          )
        );

      // Buscar notas de ATIVIDADES EM SALA
      const activityGrades = await db
        .select({
          studentId: activitySubmissions.studentId,
          activityId: activities.id,
          activityTitle: activities.title,
          subjectId: activities.subjectId,
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
            ...(input.subjectId ? [eq(activities.subjectId, input.subjectId)] : [])
          )
        );

      // Montar resultado por aluno
      return enrolledStudents.map(student => {
        // Exercícios do aluno
        const studentExGrades = exerciseGrades.filter(g => g.studentId === student.studentId);
        const exerciseAvg = studentExGrades.length > 0
          ? studentExGrades.reduce((sum, g) => sum + ((g.score ?? 0) / 10), 0) / studentExGrades.length
          : null;

        // Atividades do aluno
        const studentActGrades = activityGrades.filter(g => g.studentId === student.studentId);
        const activityAvg = studentActGrades.length > 0
          ? studentActGrades.reduce((sum, g) => {
              const score = parseFloat(String(g.score ?? 0));
              const maxScore = parseFloat(String(g.maxScore ?? 10));
              return sum + (maxScore > 0 ? (score / maxScore) * 10 : 0);
            }, 0) / studentActGrades.length
          : null;

        // Média geral
        const allGrades: number[] = [];
        if (exerciseAvg !== null) allGrades.push(exerciseAvg);
        if (activityAvg !== null) allGrades.push(activityAvg);
        const overallAvg = allGrades.length > 0
          ? allGrades.reduce((a, b) => a + b, 0) / allGrades.length
          : null;

        return {
          studentId: student.studentId,
          studentName: student.studentName,
          registrationNumber: student.registrationNumber,
          exerciseCount: studentExGrades.length,
          exerciseAverage: exerciseAvg !== null ? parseFloat(exerciseAvg.toFixed(2)) : null,
          activityCount: studentActGrades.length,
          activityAverage: activityAvg !== null ? parseFloat(activityAvg.toFixed(2)) : null,
          overallAverage: overallAvg !== null ? parseFloat(overallAvg.toFixed(2)) : null,
          exercises: studentExGrades.map(g => ({
            exerciseId: g.exerciseId,
            title: g.exerciseTitle,
            grade: parseFloat(((g.score ?? 0) / 10).toFixed(2)),
            passingGrade: parseFloat(((g.passingScore ?? 60) / 10).toFixed(1)),
            approved: (g.score ?? 0) >= (g.passingScore ?? 60),
            completedAt: g.completedAt,
          })),
          activities: studentActGrades.map(g => ({
            activityId: g.activityId,
            title: g.activityTitle,
            score: parseFloat(String(g.score ?? 0)),
            maxScore: parseFloat(String(g.maxScore ?? 10)),
            grade10: parseFloat(String(g.maxScore ?? 10)) > 0
              ? parseFloat(((parseFloat(String(g.score ?? 0)) / parseFloat(String(g.maxScore ?? 10))) * 10).toFixed(2))
              : 0,
            feedback: g.feedback,
            gradedAt: g.gradedAt,
          })),
        };
      });
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

      return {
        student: {
          id: student.id,
          name: student.fullName,
          registrationNumber: student.registrationNumber,
          email: student.email,
        },
        exercises: exerciseResults.map(e => ({
          exerciseId: e.exerciseId,
          title: e.exerciseTitle,
          subjectName: e.subjectName,
          grade: parseFloat(((e.score ?? 0) / 10).toFixed(2)),
          passingGrade: parseFloat(((e.passingScore ?? 60) / 10).toFixed(1)),
          totalQuestions: e.totalQuestions,
          approved: (e.score ?? 0) >= (e.passingScore ?? 60),
          completedAt: e.completedAt,
        })),
        activities: activityResults.map(a => ({
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
      };
    }),
});
