import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const academicPeriodsRouter = router({
  // Listar períodos do professor para um ano letivo
  list: protectedProcedure
    .input(z.object({ schoolYear: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db2 = await import("./db").then((m) => m.getDb());
      if (!db2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { academicPeriods } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const year = input.schoolYear ?? new Date().getFullYear();
      const rows = await db2
        .select()
        .from(academicPeriods)
        .where(
          and(
            eq(academicPeriods.teacherId, ctx.user.id),
            eq(academicPeriods.schoolYear, year)
          )
        )
        .orderBy(academicPeriods.bimestre);
      return rows;
    }),

  // Salvar (criar ou atualizar) um período
  save: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(),
        schoolYear: z.number().min(2020).max(2099),
        bimestre: z.number().min(1).max(4),
        startDate: z.string(), // YYYY-MM-DD
        endDate: z.string(), // YYYY-MM-DD
        description: z.string().optional(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db2 = await import("./db").then((m) => m.getDb());
      if (!db2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { academicPeriods } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      if (input.id) {
        await db2
          .update(academicPeriods)
          .set({
            schoolYear: input.schoolYear,
            bimestre: input.bimestre,
            startDate: new Date(input.startDate) as any,
            endDate: new Date(input.endDate) as any,
            description: input.description,
            isActive: input.isActive,
          })
          .where(
            and(
              eq(academicPeriods.id, input.id),
              eq(academicPeriods.teacherId, ctx.user.id)
            )
          );
        return { success: true, id: input.id };
      } else {
        const [result] = await db2.insert(academicPeriods).values({
          teacherId: ctx.user.id,
          schoolYear: input.schoolYear,
          bimestre: input.bimestre,
          startDate: new Date(input.startDate) as any,
          endDate: new Date(input.endDate) as any,
          description: input.description,
          isActive: input.isActive,
        });
        return { success: true, id: (result as any).insertId };
      }
    }),

  // Deletar um período
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db2 = await import("./db").then((m) => m.getDb());
      if (!db2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { academicPeriods } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      await db2
        .delete(academicPeriods)
        .where(
          and(
            eq(academicPeriods.id, input.id),
            eq(academicPeriods.teacherId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  // Obter período atual (baseado na data de hoje)
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const db2 = await import("./db").then((m) => m.getDb());
    if (!db2) return null;
    const { academicPeriods } = await import("../drizzle/schema");
    const { eq, and, lte, gte } = await import("drizzle-orm");
    const today = new Date(); // hoje
    const year = today.getFullYear();
    const rows = await db2
      .select()
      .from(academicPeriods)
      .where(
        and(
          eq(academicPeriods.teacherId, ctx.user.id),
          eq(academicPeriods.schoolYear, year),
          eq(academicPeriods.isActive, true),
          lte(academicPeriods.startDate, today as any),
          gte(academicPeriods.endDate, today as any)
        )
      )
      .limit(1);
    return rows[0] ?? null;
  }),
});

export const assessmentSchedulesRouter = router({
  // Listar agendamentos do professor
  list: protectedProcedure
    .input(
      z.object({
        schoolYear: z.number().optional(),
        bimestre: z.number().min(1).max(4).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db2 = await import("./db").then((m) => m.getDb());
      if (!db2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { assessmentSchedules, assessments } = await import(
        "../drizzle/schema"
      );
      const { eq } = await import("drizzle-orm");
      const rows = await db2
        .select({
          id: assessmentSchedules.id,
          assessmentId: assessmentSchedules.assessmentId,
          academicPeriodId: assessmentSchedules.academicPeriodId,
          scheduledDate: assessmentSchedules.scheduledDate,
          location: assessmentSchedules.location,
          notes: assessmentSchedules.notes,
          notifyStudents: assessmentSchedules.notifyStudents,
          notifiedAt: assessmentSchedules.notifiedAt,
          createdAt: assessmentSchedules.createdAt,
          assessmentTitle: assessments.title,
          assessmentBimestre: assessments.bimestre,
          assessmentStatus: assessments.status,
          subjectId: assessments.subjectId,
        })
        .from(assessmentSchedules)
        .leftJoin(
          assessments,
          eq(assessmentSchedules.assessmentId, assessments.id)
        )
        .where(eq(assessmentSchedules.teacherId, ctx.user.id))
        .orderBy(assessmentSchedules.scheduledDate);
      return rows;
    }),

  // Criar agendamento
  create: protectedProcedure
    .input(
      z.object({
        assessmentId: z.number(),
        academicPeriodId: z.number().optional(),
        scheduledDate: z.string(), // ISO string
        location: z.string().optional(),
        notes: z.string().optional(),
        notifyStudents: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db2 = await import("./db").then((m) => m.getDb());
      if (!db2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { assessmentSchedules, assessments } = await import(
        "../drizzle/schema"
      );
      const { eq } = await import("drizzle-orm");
      const [result] = await db2.insert(assessmentSchedules).values({
        assessmentId: input.assessmentId,
        academicPeriodId: input.academicPeriodId,
        teacherId: ctx.user.id,
        scheduledDate: new Date(input.scheduledDate),
        location: input.location,
        notes: input.notes,
        notifyStudents: input.notifyStudents,
      });
      const scheduleId = (result as any).insertId;
      // Notificar alunos se solicitado
      if (input.notifyStudents) {
        try {
          const [assessment] = await db2
            .select()
            .from(assessments)
            .where(eq(assessments.id, input.assessmentId))
            .limit(1);
          if (assessment) {
            const enrolled = await db.getStudentsBySubject(
              assessment.subjectId,
              ctx.user.id
            );
            const activeStudents = enrolled.filter(
              (s: any) => s.status === "active" && s.userId
            );
            const dateStr = new Date(input.scheduledDate).toLocaleDateString(
              "pt-BR",
              {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            );
            const locationStr = input.location
              ? ` - Local: ${input.location}`
              : "";
            for (const student of activeStudents) {
              await db.createNotification({
                userId: (student as any).userId,
                type: "new_assignment",
                title: "📅 Prova Agendada",
                message: `A prova "${assessment.title}" foi agendada para ${dateStr}${locationStr}.`,
                link: "/student/assessments",
                relatedId: scheduleId,
              });
            }
            await db2
              .update(assessmentSchedules)
              .set({ notifiedAt: new Date() })
              .where(eq(assessmentSchedules.id, scheduleId));
          }
        } catch (e) {
          console.error("[assessmentSchedules.create] Erro ao notificar:", e);
        }
      }
      return { success: true, id: scheduleId };
    }),

  // Atualizar agendamento
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        scheduledDate: z.string().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
        academicPeriodId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db2 = await import("./db").then((m) => m.getDb());
      if (!db2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { assessmentSchedules } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const updateData: any = {};
      if (input.scheduledDate)
        updateData.scheduledDate = new Date(input.scheduledDate);
      if (input.location !== undefined) updateData.location = input.location;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.academicPeriodId !== undefined)
        updateData.academicPeriodId = input.academicPeriodId;
      await db2
        .update(assessmentSchedules)
        .set(updateData)
        .where(
          and(
            eq(assessmentSchedules.id, input.id),
            eq(assessmentSchedules.teacherId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  // Deletar agendamento
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db2 = await import("./db").then((m) => m.getDb());
      if (!db2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { assessmentSchedules } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      await db2
        .delete(assessmentSchedules)
        .where(
          and(
            eq(assessmentSchedules.id, input.id),
            eq(assessmentSchedules.teacherId, ctx.user.id)
          )
        );
      return { success: true };
    }),
});
