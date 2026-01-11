import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================================
  // Professional Bands procedures
  // ============================================================
  professionalBands: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllProfessionalBands();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProfessionalBandById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          weeklyHours: z.number().min(1),
          classHours: z.number().min(0),
          planningHours: z.number().min(0),
          otherActivitiesHours: z.number().min(0),
          description: z.string().optional(),
          color: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createProfessionalBand(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          weeklyHours: z.number().min(1).optional(),
          classHours: z.number().min(0).optional(),
          planningHours: z.number().min(0).optional(),
          otherActivitiesHours: z.number().min(0).optional(),
          description: z.string().optional(),
          color: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateProfessionalBand(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProfessionalBand(input.id);
        return { success: true };
      }),
  }),

  // ============================================================
  // Teachers procedures
  // ============================================================
  teachers: router({
    getCurrent: protectedProcedure.query(async ({ ctx }) => {
      const teacher = await db.getTeacherByUserId(ctx.user.id);
      return teacher ?? null;
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTeacherById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          userId: z.number(),
          professionalBandId: z.number().optional(),
          specialization: z.string().optional(),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createTeacher(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          professionalBandId: z.number().optional(),
          specialization: z.string().optional(),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateTeacher(id, data);
      }),
  }),

  // ============================================================
  // Subjects procedures
  // ============================================================
  subjects: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllSubjects();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getSubjectById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          code: z.string().optional(),
          color: z.string().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createSubject(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          code: z.string().optional(),
          color: z.string().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateSubject(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSubject(input.id);
        return { success: true };
      }),
  }),

  // ============================================================
  // Class Groups procedures
  // ============================================================
  classGroups: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllClassGroups();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getClassGroupById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          grade: z.string().optional(),
          shift: z.enum(["morning", "afternoon", "evening", "full"]).optional(),
          studentCount: z.number().optional(),
          academicYear: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createClassGroup(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          grade: z.string().optional(),
          shift: z.enum(["morning", "afternoon", "evening", "full"]).optional(),
          studentCount: z.number().optional(),
          academicYear: z.string().min(1).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateClassGroup(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteClassGroup(input.id);
        return { success: true };
      }),
  }),

  // ============================================================
  // Schedules procedures
  // ============================================================
  schedules: router({
    listByTeacher: protectedProcedure
      .input(z.object({ teacherId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSchedulesByTeacherId(input.teacherId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getScheduleById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          teacherId: z.number(),
          subjectId: z.number(),
          classGroupId: z.number(),
          dayOfWeek: z.number().min(0).max(6),
          startTime: z.string(),
          endTime: z.string(),
          location: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createSchedule(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          teacherId: z.number().optional(),
          subjectId: z.number().optional(),
          classGroupId: z.number().optional(),
          dayOfWeek: z.number().min(0).max(6).optional(),
          startTime: z.string().optional(),
          endTime: z.string().optional(),
          location: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateSchedule(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSchedule(input.id);
        return { success: true };
      }),
  }),

  // ============================================================
  // Activities procedures
  // ============================================================
  activities: router({
    listByTeacher: protectedProcedure
      .input(z.object({ teacherId: z.number() }))
      .query(async ({ input }) => {
        return await db.getActivitiesByTeacherId(input.teacherId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getActivityById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          teacherId: z.number(),
          title: z.string().min(1),
          description: z.string().optional(),
          type: z
            .enum(["planning", "grading", "meeting", "training", "other"])
            .optional(),
          status: z
            .enum(["pending", "in_progress", "completed", "cancelled"])
            .optional(),
          priority: z.enum(["low", "medium", "high"]).optional(),
          dueDate: z.date().optional(),
          estimatedHours: z.number().optional(),
          actualHours: z.number().optional(),
          classGroupId: z.number().optional(),
          subjectId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createActivity(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          type: z
            .enum(["planning", "grading", "meeting", "training", "other"])
            .optional(),
          status: z
            .enum(["pending", "in_progress", "completed", "cancelled"])
            .optional(),
          priority: z.enum(["low", "medium", "high"]).optional(),
          dueDate: z.date().optional(),
          estimatedHours: z.number().optional(),
          actualHours: z.number().optional(),
          classGroupId: z.number().optional(),
          subjectId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateActivity(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteActivity(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
