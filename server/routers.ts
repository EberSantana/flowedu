import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, studentProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import bcrypt from "bcryptjs";
import { tasks } from "../drizzle/schema";
import { and, eq, sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
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
    
    // Login de Aluno (por matrícula)
    loginStudent: publicProcedure
      .input(z.object({
        registrationNumber: z.string().min(1, "Número de matrícula é obrigatório"),
        password: z.string().min(1, "Senha é obrigatória"),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Sanitizar entrada
          const registrationNumber = input.registrationNumber.trim();
          const password = input.password.trim();
          
          if (!registrationNumber || !password) {
            throw new Error("Matrícula e senha são obrigatórios");
          }
          
          // Buscar aluno pela matrícula
          const student = await db.getStudentByRegistration(registrationNumber);
          
          if (!student) {
            throw new Error("Matrícula não encontrada. Verifique se digitou corretamente.");
          }
          
          // Validar senha (senha = matrícula)
          if (password !== student.registrationNumber) {
            throw new Error("Senha incorreta. Lembre-se: sua senha é o mesmo número da matrícula.");
          }
          
          // Criar sessão JWT para aluno
          const token = jwt.sign(
            {
              userType: 'student',
              studentId: student.id,
              registrationNumber: student.registrationNumber,
              fullName: student.fullName,
              professorId: student.userId,
            },
            ENV.cookieSecret,
            { expiresIn: '7d' }
          );
          
          // Configurar cookie de sessão
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
          
          return {
            success: true,
            student: {
              id: student.id,
              registrationNumber: student.registrationNumber,
              fullName: student.fullName,
            },
          };
        } catch (error) {
          // Garantir que erros sejam tratados corretamente
          if (error instanceof Error) {
            throw error;
          }
          throw new Error("Erro ao processar login. Tente novamente.");
        }
      }),

    // Validar código de convite (público - para página de registro)
    validateInviteCode: publicProcedure
      .input(z.object({ code: z.string().min(1) }))
      .query(async ({ input }) => {
        return db.validateInviteCode(input.code);
      }),

    // Cadastro de Professor com E-mail/Senha
    registerTeacher: publicProcedure
      .input(z.object({
        name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
        email: z.string().email("E-mail inválido"),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar se e-mail já existe
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new Error("Este e-mail já está cadastrado. Use outro e-mail ou faça login.");
        }

        // Hash da senha
        const passwordHash = await bcrypt.hash(input.password, 10);

        // Criar professor
        const result = await db.createTeacherWithPassword({
          name: input.name,
          email: input.email,
          passwordHash,
        });

        if (!result) {
          throw new Error("Erro ao criar conta. Tente novamente.");
        }

        // Buscar usuário criado para criar sessão
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new Error("Erro ao criar sessão. Tente fazer login.");
        }

        // Criar sessão JWT usando o mesmo formato do OAuth
        const token = await sdk.createSessionToken(user.openId, {
          name: user.name || '',
          expiresInMs: 7 * 24 * 60 * 60 * 1000, // 7 dias
        });

        // Configurar cookie de sessão
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
        });

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        };
      }),

    // Login de Professor com E-mail/Senha
    loginTeacher: publicProcedure
      .input(z.object({
        email: z.string().email("E-mail inválido"),
        password: z.string().min(1, "Senha é obrigatória"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Buscar usuário pelo e-mail
        const user = await db.getUserByEmail(input.email);
        
        if (!user) {
          throw new Error("E-mail não encontrado. Verifique ou cadastre-se.");
        }

        // Verificar se usuário está ativo
        if (!user.active) {
          throw new Error("Conta desativada. Entre em contato com o administrador.");
        }

        // Verificar senha
        if (!user.passwordHash) {
          throw new Error("Esta conta usa login com Google/GitHub. Use o botão 'Entrar como Professor'.");
        }

        const validPassword = await bcrypt.compare(input.password, user.passwordHash);
        if (!validPassword) {
          throw new Error("Senha incorreta. Tente novamente.");
        }

        // Atualizar último login
        await db.upsertUser({
          openId: user.openId,
          lastSignedIn: new Date(),
        });

        // Criar sessão JWT usando o mesmo formato do OAuth
        const token = await sdk.createSessionToken(user.openId, {
          name: user.name || '',
          expiresInMs: 7 * 24 * 60 * 60 * 1000, // 7 dias
        });

        // Configurar cookie de sessão
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
        });

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      }),

    // Solicitar recuperação de senha
    requestPasswordReset: publicProcedure
      .input(z.object({
        email: z.string().email("E-mail inválido"),
      }))
      .mutation(async ({ input }) => {
        const user = await db.getUserByEmail(input.email);
        
        if (!user) {
          // Por segurança, não revelamos se o e-mail existe ou não
          return { success: true, message: "Se o e-mail existir, você receberá um link de recuperação." };
        }

        // Gerar token único
        const token = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        // Salvar token no banco
        await db.createPasswordResetToken(user.id, token, expiresAt);

        // TODO: Enviar e-mail com link de recuperação
        // const resetLink = `${process.env.FRONTEND_URL}/redefinir-senha?token=${token}`;
        // await sendPasswordResetEmail(user.email, resetLink);

        return { success: true, message: "Se o e-mail existir, você receberá um link de recuperação." };
      }),

    // Validar token de recuperação
    validateResetToken: publicProcedure
      .input(z.object({
        token: z.string().min(1),
      }))
      .query(async ({ input }) => {
        const tokenData = await db.getPasswordResetToken(input.token);
        return { valid: !!tokenData };
      }),

    // Redefinir senha com token
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string().min(1),
        newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
      }))
      .mutation(async ({ input }) => {
        // Validar token
        const tokenData = await db.getPasswordResetToken(input.token);
        
        if (!tokenData) {
          throw new Error("Token inválido ou expirado");
        }

        // Hash da nova senha
        const passwordHash = await bcrypt.hash(input.newPassword, 10);

        // Atualizar senha
        const updated = await db.updateUserPassword(tokenData.userId, passwordHash);
        
        if (!updated) {
          throw new Error("Erro ao atualizar senha");
        }

        // Marcar token como usado
        await db.markTokenAsUsed(input.token);

        return { success: true, message: "Senha redefinida com sucesso!" };
      }),
  }),

  subjects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getSubjectsByUserId(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const subjects = await db.getSubjectsByUserId(ctx.user.id);
        const subject = subjects.find(s => s.id === input.id);
        if (!subject) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Disciplina não encontrada' });
        }
        return subject;
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        code: z.string().min(1),
        description: z.string().optional(),
        color: z.string().default("#3b82f6"),
        ementa: z.string().optional(),
        generalObjective: z.string().optional(),
        specificObjectives: z.string().optional(),
        programContent: z.string().optional(),
        basicBibliography: z.string().optional(),
        complementaryBibliography: z.string().optional(),
        googleDriveUrl: z.string().optional(),
        googleClassroomUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createSubject({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        code: z.string().min(1).optional(),
        description: z.string().optional(),
        color: z.string().optional(),
        ementa: z.string().optional(),
        generalObjective: z.string().optional(),
        specificObjectives: z.string().optional(),
        programContent: z.string().optional(),
        basicBibliography: z.string().optional(),
        complementaryBibliography: z.string().optional(),
        googleDriveUrl: z.string().optional(),
        googleClassroomUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateSubject(id, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteSubject(input.id, ctx.user.id);
        return { success: true };
      }),
    
    toggleCT: protectedProcedure
      .input(z.object({ id: z.number(), enabled: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const updated = await db.toggleSubjectCT(input.id, ctx.user.id, input.enabled);
        return { success: true, subject: updated };
      }),
    
    // Subject Enrollments
    enrollStudent: protectedProcedure
      .input(z.object({ studentId: z.number(), subjectId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.enrollStudentInSubject(input.studentId, input.subjectId, ctx.user.id);
      }),
    
    unenrollStudent: protectedProcedure
      .input(z.object({ enrollmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.unenrollStudentFromSubject(input.enrollmentId, ctx.user.id);
      }),
    
    getEnrolledStudents: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getStudentsBySubject(input.subjectId, ctx.user.id);
      }),
    
    getEnrollmentCounts: protectedProcedure
      .query(async ({ ctx }) => {
        // Buscar todas as disciplinas do usuário
        const subjects = await db.getSubjectsByUserId(ctx.user.id);
        
        // Para cada disciplina, contar alunos matriculados
        const counts: Record<number, number> = {};
        
        for (const subject of subjects) {
          const students = await db.getStudentsBySubject(subject.id, ctx.user.id);
          counts[subject.id] = students.length;
        }
        
        return counts;
      }),
    
    // Buscar alunos matriculados com detalhes para todas as disciplinas
    getEnrollmentsWithStudents: protectedProcedure
      .query(async ({ ctx }) => {
        const subjects = await db.getSubjectsByUserId(ctx.user.id);
        const result: Record<number, Array<{ id: number; fullName: string; registrationNumber: string }>> = {};
        
        for (const subject of subjects) {
          const enrollments = await db.getStudentsBySubject(subject.id, ctx.user.id);
          result[subject.id] = enrollments.map(e => ({
            id: e.studentId,
            fullName: e.fullName || 'Aluno',
            registrationNumber: e.registrationNumber || '',
          }));
        }
        
        return result;
      }),
  }),

  classes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getClassesByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        code: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createClass({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        code: z.string().min(1).optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateClass(id, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteClass(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  shifts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getShiftsByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        color: z.string(),
        displayOrder: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createShift({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        color: z.string().optional(),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateShift(id, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteShift(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  timeSlots: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getTimeSlotsByUserId(ctx.user.id);
    }),
    
    listByShift: protectedProcedure
      .input(z.object({ shiftId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getTimeSlotsByShiftId(input.shiftId, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        shiftId: z.number(),
        slotNumber: z.number(),
        startTime: z.string(),
        endTime: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createTimeSlot({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        shiftId: z.number().optional(),
        slotNumber: z.number().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateTimeSlot(id, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteTimeSlot(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  dashboard: router({
    getUpcomingClasses: protectedProcedure.query(async ({ ctx }) => {
      const [scheduledClasses, subjects, classes, timeSlots, calendarEvents] = await Promise.all([
        db.getScheduledClassesByUserId(ctx.user.id),
        db.getSubjectsByUserId(ctx.user.id),
        db.getClassesByUserId(ctx.user.id),
        db.getTimeSlotsByUserId(ctx.user.id),
        db.getCalendarEventsByUser(ctx.user.id),
      ]);

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      
      // Calcular aulas dos próximos 7 dias para garantir que sempre há uma próxima aula
      const upcomingClasses = [];
      
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(now);
        checkDate.setDate(now.getDate() + i);
        const dayOfWeek = checkDate.getDay();
        const dateStr = checkDate.toISOString().split('T')[0];
        
        // Verificar se é feriado
        const holiday = calendarEvents.find(
          e => e.eventDate === dateStr && e.eventType === 'holiday'
        );
        
        // Buscar aulas agendadas para este dia da semana
        const dayClasses = scheduledClasses.filter(sc => sc.dayOfWeek === dayOfWeek);
        
        for (const sc of dayClasses) {
          const subject = subjects.find(s => s.id === sc.subjectId);
          const classInfo = classes.find(c => c.id === sc.classId);
          const timeSlot = timeSlots.find(ts => ts.id === sc.timeSlotId);
          
          if (subject && classInfo && timeSlot) {
            upcomingClasses.push({
              id: sc.id,
              date: dateStr,
              dayOfWeek: daysOfWeek[dayOfWeek],
              startTime: timeSlot.startTime,
              endTime: timeSlot.endTime,
              subjectName: subject.name,
              subjectColor: subject.color,
              className: classInfo.name,
              isHoliday: !!holiday,
              holidayName: holiday?.title || null,
              notes: sc.notes,
              googleClassroomUrl: subject.googleClassroomUrl,
              googleDriveUrl: subject.googleDriveUrl,
            });
          }
        }
      }
      
      // Ordenar por data e horário
      upcomingClasses.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      });
      
      // Filtrar apenas aulas futuras (após o horário atual)
      const todayStr = now.toISOString().split('T')[0];
      const futureClasses = upcomingClasses.filter(c => {
        // Se for dia futuro, incluir
        if (c.date > todayStr) return true;
        // Se for hoje, incluir apenas se ainda não começou
        if (c.date === todayStr) {
          return c.startTime > currentTime;
        }
        return false;
      });
      
      return futureClasses.slice(0, 10);
    }),
    
    getTodayClasses: protectedProcedure.query(async ({ ctx }) => {
      const [scheduledClasses, subjects, classes, timeSlots, calendarEvents] = await Promise.all([
        db.getScheduledClassesByUserId(ctx.user.id),
        db.getSubjectsByUserId(ctx.user.id),
        db.getClassesByUserId(ctx.user.id),
        db.getTimeSlotsByUserId(ctx.user.id),
        db.getCalendarEventsByUser(ctx.user.id),
      ]);

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      
      // Buscar apenas aulas do dia atual (todas, passadas e futuras)
      const todayClasses = [];
      const checkDate = new Date(now);
      const dayOfWeek = checkDate.getDay();
      const dateStr = checkDate.toISOString().split('T')[0];
      
      // Verificar se é feriado
      const holiday = calendarEvents.find(
        e => e.eventDate === dateStr && e.eventType === 'holiday'
      );
      
      // Buscar aulas agendadas para hoje
      const dayClasses = scheduledClasses.filter(sc => sc.dayOfWeek === dayOfWeek);
      
      for (const sc of dayClasses) {
        const subject = subjects.find(s => s.id === sc.subjectId);
        const classInfo = classes.find(c => c.id === sc.classId);
        const timeSlot = timeSlots.find(ts => ts.id === sc.timeSlotId);
        
        if (subject && classInfo && timeSlot) {
          todayClasses.push({
            id: sc.id,
            date: dateStr,
            dayOfWeek: daysOfWeek[dayOfWeek],
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            subjectName: subject.name,
            subjectColor: subject.color,
            className: classInfo.name,
            isHoliday: !!holiday,
            holidayName: holiday?.title || null,
            notes: sc.notes,
            googleClassroomUrl: subject.googleClassroomUrl,
            googleDriveUrl: subject.googleDriveUrl,
            isPast: timeSlot.endTime < currentTime, // Marcar se a aula já passou
          });
        }
      }
      
      // Ordenar por horário
      todayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      return todayClasses;
    }),
    
    getUpcomingEvents: protectedProcedure.query(async ({ ctx }) => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Buscar eventos dos próximos 60 dias
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 60);
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const events = await db.getCalendarEventsByUser(ctx.user.id);
      
      // Filtrar eventos futuros e ordenar por data
      const upcomingEvents = events
        .filter(e => e.eventDate >= todayStr && e.eventDate <= endDateStr)
        .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
        .slice(0, 8);
      
      return upcomingEvents;
    }),
  }),

  schedule: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getScheduledClassesByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        subjectId: z.number(),
        classId: z.number(),
        timeSlotId: z.number(),
        dayOfWeek: z.number().min(0).max(6),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar conflito
        const hasConflict = await db.checkScheduleConflict(
          input.timeSlotId,
          input.dayOfWeek,
          input.classId,
          ctx.user.id
        );
        
        if (hasConflict) {
          throw new Error("Já existe uma aula agendada neste horário para esta turma");
        }
        
        await db.createScheduledClass({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        subjectId: z.number().optional(),
        classId: z.number().optional(),
        timeSlotId: z.number().optional(),
        dayOfWeek: z.number().min(0).max(6).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        
        // Se estiver alterando horário, turma ou dia, verificar conflito
        if (data.timeSlotId || data.classId || data.dayOfWeek) {
          const current = await db.getScheduledClassById(id, ctx.user.id);
          if (!current) {
            throw new Error("Aula não encontrada");
          }
          
          const hasConflict = await db.checkScheduleConflict(
            data.timeSlotId ?? current.timeSlotId,
            data.dayOfWeek ?? current.dayOfWeek,
            data.classId ?? current.classId,
            ctx.user.id,
            id
          );
          
          if (hasConflict) {
            throw new Error("Já existe uma aula agendada neste horário para esta turma");
          }
        }
        
        await db.updateScheduledClass(id, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteScheduledClass(input.id, ctx.user.id);
        return { success: true };
      }),
    
    getFullSchedule: protectedProcedure.query(async ({ ctx }) => {
      const [shifts, timeSlots, scheduledClasses, subjects, classes] = await Promise.all([
        db.getShiftsByUserId(ctx.user.id),
        db.getTimeSlotsByUserId(ctx.user.id),
        db.getScheduledClassesByUserId(ctx.user.id),
        db.getSubjectsByUserId(ctx.user.id),
        db.getClassesByUserId(ctx.user.id),
      ]);
      
      return {
        shifts,
        timeSlots,
        scheduledClasses,
        subjects,
        classes,
      };
    }),
  }),
  
  calendar: router({
    listByYear: protectedProcedure
      .input(z.object({ year: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getCalendarEventsByYear(ctx.user.id, input.year);
      }),
    getUpcomingEvents: protectedProcedure
      .query(async ({ ctx }) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const threeDaysLater = new Date(today);
        threeDaysLater.setDate(today.getDate() + 3);
        
        const allEvents = await db.getCalendarEventsByYear(ctx.user.id, today.getFullYear());
        
        return allEvents.filter((event: any) => {
          const eventDate = new Date(event.eventDate);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= today && eventDate < threeDaysLater;
        }).sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
      }),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          eventType: z.enum(["holiday", "commemorative", "school_event", "personal"]),
          isRecurring: z.number().default(0),
          color: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createCalendarEvent({
          userId: ctx.user.id,
          ...input,
        });
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
          eventType: z.enum(["holiday", "commemorative", "school_event", "personal"]).optional(),
          isRecurring: z.number().optional(),
          color: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateCalendarEvent(id, ctx.user.id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteCalendarEvent(input.id, ctx.user.id);
      }),
    
    importFromPDF: protectedProcedure
      .input(z.object({
        pdfBase64: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const { PDFParse } = await import("pdf-parse");
        
        // Converter base64 para buffer
        const pdfBuffer = Buffer.from(input.pdfBase64, 'base64');
        
        // Extrair texto do PDF
        const parser = new PDFParse({ data: pdfBuffer });
        const textResult = await parser.getText();
        const pdfText = textResult.text;
        
        // Usar LLM para extrair eventos
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um assistente especializado em extrair eventos de calendários acadêmicos. 
Analise o texto fornecido e extraia TODOS os eventos com suas datas.
Retorne um JSON com array de eventos no formato:
{
  "events": [
    {
      "title": "Nome do evento",
      "description": "Descrição completa",
      "eventDate": "YYYY-MM-DD",
      "eventType": "holiday" | "commemorative" | "school_event" | "personal"
    }
  ]
}

Regras:
- Identifique feriados como "holiday"
- Datas comemorativas como "commemorative"
- Eventos escolares/acadêmicos como "school_event"
- Se houver períodos (ex: "01 a 18 - Férias"), crie evento para o primeiro dia
- Ignore informações de dias letivos/sábados letivos
- IMPORTANTE: Retorne APENAS o JSON, sem texto adicional`
            },
            {
              role: "user",
              content: `Extraia todos os eventos deste calendário escolar:\n\n${pdfText.slice(0, 15000)}`
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "calendar_events",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  events: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        eventDate: { type: "string" },
                        eventType: { type: "string", enum: ["holiday", "commemorative", "school_event", "personal"] }
                      },
                      required: ["title", "description", "eventDate", "eventType"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["events"],
                additionalProperties: false
              }
            }
          }
        });
        
        const content = response.choices[0].message.content;
        const parsedResult = JSON.parse(typeof content === 'string' ? content : '{ "events": [] }');
        return parsedResult.events;
      }),
    
    bulkCreate: protectedProcedure
      .input(z.object({
        events: z.array(z.object({
          title: z.string(),
          description: z.string(),
          eventDate: z.string(),
          eventType: z.enum(["holiday", "commemorative", "school_event", "personal"])
        }))
      }))
      .mutation(async ({ ctx, input }) => {
        const results = [];
        for (const event of input.events) {
          const created = await db.createCalendarEvent({
            userId: ctx.user.id,
            ...event,
            isRecurring: 0
          });
          results.push(created);
        }
        return { success: true, count: results.length };
      }),

    deleteEventsByYearAndType: protectedProcedure
      .input(z.object({
        year: z.number(),
        eventTypes: z.array(z.enum(["holiday", "commemorative", "school_event", "personal"]))
      }))
      .mutation(async ({ ctx, input }) => {
        const startDate = `${input.year}-01-01`;
        const endDate = `${input.year}-12-31`;
        
        const deletedCount = await db.deleteEventsByYearAndType(
          ctx.user.id,
          startDate,
          endDate,
          input.eventTypes
        );
        
        return { deletedCount };
      }),
      
    updateCalendarAnnually: protectedProcedure
      .input(z.object({
        year: z.number(),
        newEvents: z.array(z.object({
          title: z.string(),
          description: z.string(),
          eventDate: z.string(),
          eventType: z.enum(["holiday", "commemorative", "school_event", "personal"])
        }))
      }))
      .mutation(async ({ ctx, input }) => {
        const startDate = `${input.year}-01-01`;
        const endDate = `${input.year}-12-31`;
        
        // Deletar apenas eventos institucionais (não pessoais) do ano especificado
        const deletedCount = await db.deleteEventsByYearAndType(
          ctx.user.id,
          startDate,
          endDate,
          ["holiday", "commemorative", "school_event"]
        );
        
        // Importar novos eventos
        const results = [];
        for (const event of input.newEvents) {
          const created = await db.createCalendarEvent({
            userId: ctx.user.id,
            ...event,
            isRecurring: 0
          });
          results.push(created);
        }
        
        return {
          success: true,
          deletedCount,
          addedCount: results.length
        };
      }),
  }),

  user: router({
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.updateUserProfile(ctx.user.id, input);
      }),
  }),

  admin: router({
    listUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Acesso negado: apenas administradores');
      }
      return db.getAllUsers();
    }),

    updateUserRole: protectedProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(['admin', 'user']),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        return db.updateUserRole(input.userId, input.role);
      }),

    deleteUser: protectedProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        
        // Impedir que admin desative a si mesmo
        if (ctx.user.id === input.userId) {
          throw new Error('Você não pode desativar sua própria conta');
        }
        
        return db.deactivateUser(input.userId);
      }),

    reactivateUser: protectedProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        
        return db.reactivateUser(input.userId);
      }),

    permanentDeleteUser: protectedProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        
        // Impedir que admin delete permanentemente a si mesmo
        if (ctx.user.id === input.userId) {
          throw new Error('Você não pode deletar permanentemente sua própria conta');
        }
        
        return db.permanentDeleteUser(input.userId);
      }),

    listActiveUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Acesso negado: apenas administradores');
      }
      return db.getActiveUsers();
    }),

    listInactiveUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Acesso negado: apenas administradores');
      }
      return db.getInactiveUsers();
    }),

    // Cadastro manual de usuários
    createUser: protectedProcedure
      .input(z.object({
        name: z.string().min(1, 'Nome é obrigatório'),
        email: z.string().email('E-mail inválido'),
        role: z.enum(['admin', 'user']).default('user'),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }

        // Verificar se email já está registrado
        const alreadyRegistered = await db.checkEmailAlreadyRegistered(input.email);
        if (alreadyRegistered) {
          throw new Error('Este e-mail já está cadastrado no sistema');
        }

        // Gerar openId temporário (será substituído no primeiro login OAuth)
        const crypto = await import('crypto');
        const tempOpenId = `manual-${crypto.randomBytes(16).toString('hex')}`;
        
        // Criar usuário
        await db.upsertUser({
          openId: tempOpenId,
          name: input.name,
          email: input.email,
          role: input.role,
          loginMethod: 'manual',
          lastSignedIn: new Date(),
        });

        // Buscar usuário criado
        const users = await db.getAllUsers();
        const newUser = users.find(u => u.email === input.email);

        if (!newUser) {
          throw new Error('Erro ao criar usuário');
        }

        // Enviar e-mail de boas-vindas
        const { sendEmail, getManualRegistrationEmailTemplate } = await import('./_core/email');
        const emailHtml = getManualRegistrationEmailTemplate(input.name, input.role);
        
        const emailResult = await sendEmail({
          to: input.email,
          subject: 'Bem-vindo ao Sistema de Gestão de Tempo para Professores',
          html: emailHtml,
        });

        // Registrar log de auditoria
        await db.createAuditLog({
          adminId: ctx.user.id,
          adminName: ctx.user.name || 'Administrador',
          action: 'CREATE_USER',
          targetUserId: newUser.id,
          targetUserName: newUser.name || '',
          newData: JSON.stringify({ email: input.email, role: input.role }),
          ipAddress: ctx.req.ip || ctx.req.headers['x-forwarded-for'] as string || 'unknown',
        });

        return { 
          success: true, 
          user: newUser,
          emailSent: emailResult.success,
          emailError: emailResult.error 
        };
      }),

    // ==================== CÓDIGOS DE CONVITE ====================
    
    // Criar código de convite
    createInviteCode: protectedProcedure
      .input(z.object({
        maxUses: z.number().min(1).default(1),
        expiresInDays: z.number().min(1).optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        
        const expiresAt = input.expiresInDays 
          ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
          : undefined;
        
        const result = await db.createInviteCode({
          createdBy: ctx.user.id,
          maxUses: input.maxUses,
          expiresAt,
          description: input.description,
        });
        
        if (!result) {
          throw new Error('Erro ao criar código de convite');
        }
        
        return result;
      }),

    // Listar códigos de convite
    listInviteCodes: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Acesso negado: apenas administradores');
      }
      return db.getAllInviteCodes();
    }),

    // Desativar código de convite
    deactivateInviteCode: protectedProcedure
      .input(z.object({ codeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        return db.deactivateInviteCode(input.codeId);
      }),

    // Reativar código de convite
    reactivateInviteCode: protectedProcedure
      .input(z.object({ codeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        return db.reactivateInviteCode(input.codeId);
      }),

    // Deletar código de convite
    deleteInviteCode: protectedProcedure
      .input(z.object({ codeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        return db.deleteInviteCode(input.codeId);
      }),

    // ==================== APROVAÇÃO DE USUÁRIOS ====================
    
    // Listar usuários pendentes de aprovação
    listPendingUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Acesso negado: apenas administradores');
      }
      return db.getPendingUsers();
    }),

    // Aprovar usuário
    approveUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        
        const success = await db.approveUser(input.userId);
        
        if (success) {
          // Registrar log de auditoria
          const user = await db.getUserWithApprovalStatus(input.userId);
          await db.createAuditLog({
            adminId: ctx.user.id,
            adminName: ctx.user.name || 'Administrador',
            action: 'APPROVE_USER',
            targetUserId: input.userId,
            targetUserName: user?.name || '',
            newData: JSON.stringify({ approvalStatus: 'approved' }),
            ipAddress: ctx.req.ip || ctx.req.headers['x-forwarded-for'] as string || 'unknown',
          });
        }
        
        return success;
      }),

    // Rejeitar usuário
    rejectUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        
        const success = await db.rejectUser(input.userId);
        
        if (success) {
          // Registrar log de auditoria
          const user = await db.getUserWithApprovalStatus(input.userId);
          await db.createAuditLog({
            adminId: ctx.user.id,
            adminName: ctx.user.name || 'Administrador',
            action: 'REJECT_USER',
            targetUserId: input.userId,
            targetUserName: user?.name || '',
            newData: JSON.stringify({ approvalStatus: 'rejected' }),
            ipAddress: ctx.req.ip || ctx.req.headers['x-forwarded-for'] as string || 'unknown',
          });
        }
        
        return success;
      }),

    // Limpar usuários inválidos (sem nome e sem email)
    cleanInvalidUsers: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }

        const result = await db.cleanInvalidUsers();
        
        // Registrar log de auditoria
        await db.createAuditLog({
          adminId: ctx.user.id,
          adminName: ctx.user.name || 'Administrador',
          action: 'CLEAN_INVALID_USERS',
          targetUserId: undefined,
          targetUserName: '',
          newData: JSON.stringify({ deletedCount: result.deletedCount }),
          ipAddress: ctx.req.ip || ctx.req.headers['x-forwarded-for'] as string || 'unknown',
        });

        return result;
      }),

  }),

  // Metodologias Ativas
  activeMethodologies: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getActiveMethodologiesByUserId(ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        description: z.string().min(1, "Descrição é obrigatória"),
        category: z.string().min(1, "Categoria é obrigatória"),
        url: z.string().url("URL inválida"),
        tips: z.string().optional(),
        logoUrl: z.union([z.string().url(), z.literal("")]).optional(),
        isFavorite: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createActiveMethodology({
          ...input,
          userId: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        category: z.string().min(1).optional(),
        url: z.string().url().optional(),
        tips: z.string().optional(),
        logoUrl: z.union([z.string().url(), z.literal("")]).optional(),
        isFavorite: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await db.updateActiveMethodology(id, ctx.user.id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteActiveMethodology(input.id, ctx.user.id);
      }),
  }),

  classStatus: router({
    set: protectedProcedure
      .input(z.object({
        scheduledClassId: z.number(),
        weekNumber: z.number(),
        year: z.number(),
        status: z.enum(['given', 'not_given', 'cancelled']),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.setClassStatus(
          input.scheduledClassId,
          input.weekNumber,
          input.year,
          input.status,
          ctx.user.id,
          input.reason
        );
      }),

    get: protectedProcedure
      .input(z.object({
        scheduledClassId: z.number(),
        weekNumber: z.number(),
        year: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getClassStatus(
          input.scheduledClassId,
          input.weekNumber,
          input.year,
          ctx.user.id
        );
      }),

    getWeek: protectedProcedure
      .input(z.object({
        weekNumber: z.number(),
        year: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getWeekClassStatuses(
          input.weekNumber,
          input.year,
          ctx.user.id
        );
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteClassStatus(input.id, ctx.user.id);
      }),
  }),

  // ============================================
  // TASKS (TO-DO LIST)
  // ============================================
  tasks: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(500),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        category: z.string().max(100).optional(),
        dueDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createTask({ ...input, userId: ctx.user.id });
      }),

    getAll: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getAllTasks(ctx.user.id);
      }),

    getByFilter: protectedProcedure
      .input(z.object({
        completed: z.boolean().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        category: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getTasksByFilter(ctx.user.id, input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(500).optional(),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        category: z.string().max(100).optional(),
        dueDate: z.string().optional(),
        orderIndex: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await db.updateTask(id, ctx.user.id, data);
      }),

    toggleComplete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.toggleTaskComplete(input.id, ctx.user.id);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteTask(input.id, ctx.user.id);
      }),

    getCategories: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getTaskCategories(ctx.user.id);
      }),
  }),

  reports: router({
    getStats: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
        subjectId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const { startDate, endDate, subjectId } = input;
        
        const scheduledClasses = await db.getScheduledClassesByUserId(ctx.user.id);
        const subjects = await db.getSubjectsByUserId(ctx.user.id);
        const classes = await db.getClassesByUserId(ctx.user.id);
        const timeSlots = await db.getTimeSlotsByUserId(ctx.user.id);
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const allStatuses: any[] = [];
        for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
          for (let week = 1; week <= 53; week++) {
            const weekStatuses = await db.getWeekClassStatuses(week, year, ctx.user.id);
            allStatuses.push(...weekStatuses);
          }
        }
        
        const statusMap = new Map(
          allStatuses.map((s: any) => [s.scheduledClassId, s])
        );
        
        let given = 0;
        let notGiven = 0;
        let cancelled = 0;
        let pending = 0;
        
        const bySubject: Record<number, {
          subjectId: number;
          subjectName: string;
          subjectColor: string;
          given: number;
          notGiven: number;
          cancelled: number;
          pending: number;
          total: number;
        }> = {};
        
        const byMonth: Record<string, {
          month: string;
          given: number;
          notGiven: number;
          cancelled: number;
          pending: number;
          total: number;
        }> = {};
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dayOfWeek = d.getDay();
          const dateStr = d.toISOString().split('T')[0];
          const monthKey = dateStr.substring(0, 7);
          
          if (!byMonth[monthKey]) {
            byMonth[monthKey] = {
              month: monthKey,
              given: 0,
              notGiven: 0,
              cancelled: 0,
              pending: 0,
              total: 0,
            };
          }
          
          const dayClasses = scheduledClasses.filter(sc => {
            if (sc.dayOfWeek !== dayOfWeek) return false;
            if (subjectId && sc.subjectId !== subjectId) return false;
            return true;
          });
          
          for (const scheduledClass of dayClasses) {
            const subject = subjects.find(s => s.id === scheduledClass.subjectId);
            if (!subject) continue;
            
            if (!bySubject[scheduledClass.subjectId]) {
              bySubject[scheduledClass.subjectId] = {
                subjectId: scheduledClass.subjectId,
                subjectName: subject.name,
                subjectColor: subject.color || '#3b82f6',
                given: 0,
                notGiven: 0,
                cancelled: 0,
                pending: 0,
                total: 0,
              };
            }
            
            bySubject[scheduledClass.subjectId].total++;
            byMonth[monthKey].total++;
            
            const status = statusMap.get(scheduledClass.id) as any;
            
            if (status) {
              if (status.status === 'given') {
                given++;
                bySubject[scheduledClass.subjectId].given++;
                byMonth[monthKey].given++;
              } else if (status.status === 'not_given') {
                notGiven++;
                bySubject[scheduledClass.subjectId].notGiven++;
                byMonth[monthKey].notGiven++;
              } else if (status.status === 'cancelled') {
                cancelled++;
                bySubject[scheduledClass.subjectId].cancelled++;
                byMonth[monthKey].cancelled++;
              }
            } else {
              pending++;
              bySubject[scheduledClass.subjectId].pending++;
              byMonth[monthKey].pending++;
            }
          }
        }
        
        return {
          total: given + notGiven + cancelled + pending,
          given,
          notGiven,
          cancelled,
          pending,
          bySubject: Object.values(bySubject),
          byMonth: Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)),
        };
      }),
  }),

  learningPath: router({
    getBySubject: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getLearningPathBySubject(input.subjectId, ctx.user.id);
      }),
    
    createModule: protectedProcedure
      .input(z.object({
        subjectId: z.number(),
        title: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createLearningModule({ ...input, userId: ctx.user.id });
      }),
    
    updateModule: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await db.updateLearningModule(id, data, ctx.user.id);
      }),
    
    deleteModule: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteLearningModule(input.id, ctx.user.id);
      }),
    
    createTopic: protectedProcedure
      .input(z.object({
        moduleId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        estimatedHours: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createLearningTopic({ ...input, userId: ctx.user.id });
      }),
    
    updateTopic: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
        estimatedHours: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await db.updateLearningTopic(id, data, ctx.user.id);
      }),
    
    deleteTopic: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteLearningTopic(input.id, ctx.user.id);
      }),
    
    getProgress: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getLearningPathProgress(input.subjectId, ctx.user.id);
      }),
    
    generateFromAI: protectedProcedure
      .input(z.object({
        subjectId: z.number(),
        syllabusText: z.string(),
        workload: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Buscar carga horária da disciplina se não foi fornecida
        const subject = await db.getSubjectById(input.subjectId, ctx.user.id);
        const totalWorkload = input.workload || subject?.workload || 60;
        
        const prompt = `Você é um especialista em design instrucional e pedagogia. Analise a seguinte ementa de disciplina e crie uma trilha de aprendizagem estruturada.

EMENTA:
${input.syllabusText}

CARGA HORÁRIA TOTAL: ${totalWorkload} horas

Crie uma estrutura de módulos e tópicos seguindo este formato JSON:
{
  "modules": [
    {
      "title": "Nome do Módulo",
      "description": "Descrição breve",
      "topics": [
        {
          "title": "Nome do Tópico",
          "description": "Descrição detalhada",
          "estimatedHours": 2,
          "theoryHours": 1,
          "practiceHours": 1,
          "individualWorkHours": 0,
          "teamWorkHours": 0
        }
      ]
    }
  ]
}

Diretrizes OBRIGATÓRIAS:
1. A SOMA de todas as horas estimadas dos tópicos DEVE ser EXATAMENTE ${totalWorkload} horas
2. Crie entre 3-6 módulos
3. Cada módulo deve ter 3-8 tópicos
4. Organize de forma pedagógica (do básico ao avançado)
5. Para cada tópico, distribua as horas entre:
   - theoryHours: atividades teóricas (aulas expositivas, leituras, discussões)
   - practiceHours: atividades práticas (laboratórios, exercícios, projetos)
   - individualWorkHours: trabalhos individuais (pesquisas, relatórios, provas)
   - teamWorkHours: trabalhos em equipe (projetos colaborativos, seminários)
6. Analise o conteúdo da ementa para determinar se é mais teórica ou prática
7. A soma de theoryHours + practiceHours + individualWorkHours + teamWorkHours DEVE ser igual a estimatedHours
8. Use linguagem clara e objetiva`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'Você é um especialista em design instrucional e pedagogia.' },
            { role: 'user', content: prompt }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'learning_path',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  modules: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        topics: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              title: { type: 'string' },
                              description: { type: 'string' },
                              estimatedHours: { type: 'number' },
                              theoryHours: { type: 'number' },
                              practiceHours: { type: 'number' },
                              individualWorkHours: { type: 'number' },
                              teamWorkHours: { type: 'number' }
                            },
                            required: ['title', 'description', 'estimatedHours', 'theoryHours', 'practiceHours', 'individualWorkHours', 'teamWorkHours'],
                            additionalProperties: false
                          }
                        }
                      },
                      required: ['title', 'description', 'topics'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['modules'],
                additionalProperties: false
              }
            }
          }
        });
        
        const content = typeof response.choices[0].message.content === 'string' 
          ? response.choices[0].message.content 
          : JSON.stringify(response.choices[0].message.content);
        const result = JSON.parse(content || '{}');
        
        // Create modules and topics in database
        for (const [moduleIndex, module] of result.modules.entries()) {
          const createdModule = await db.createLearningModule({
            subjectId: input.subjectId,
            title: module.title,
            description: module.description,
            userId: ctx.user.id,
          });
          
          for (const topic of module.topics) {
            await db.createLearningTopic({
              moduleId: createdModule.id,
              title: topic.title,
              description: topic.description,
              estimatedHours: topic.estimatedHours,
              theoryHours: topic.theoryHours,
              practiceHours: topic.practiceHours,
              individualWorkHours: topic.individualWorkHours,
              teamWorkHours: topic.teamWorkHours,
              userId: ctx.user.id,
            });
          }
        }
        
        return { success: true, modulesCreated: result.modules.length };
      }),
    
    generateInfographic: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { generateImage } = await import('./_core/imageGeneration');
        const learningPath = await db.getLearningPathBySubject(input.subjectId, ctx.user.id);
        
        if (!learningPath || learningPath.length === 0) {
          throw new Error('Nenhuma trilha encontrada para esta disciplina');
        }
        
        const subject = await db.getSubjectById(input.subjectId, ctx.user.id);
        
        let pathDescription = `Disciplina: ${subject?.name}\n\n`;
        learningPath.forEach((module, idx) => {
          pathDescription += `Módulo ${idx + 1}: ${module.title}\n`;
          if (module.topics) {
            module.topics.forEach((topic: any, topicIdx: number) => {
              pathDescription += `  ${idx + 1}.${topicIdx + 1} ${topic.title}\n`;
            });
          }
        });
        
        const prompt = `Crie um infográfico visual moderno e profissional para uma trilha de aprendizagem educacional. O infográfico deve:

- Ter design limpo e colorido
- Mostrar a estrutura hierárquica de módulos e tópicos
- Usar ícones educacionais
- Ter fundo branco ou gradiente suave
- Incluir o título da disciplina no topo
- Organizar módulos verticalmente com conexões visuais
- Tamanho: 1400x1000 pixels

⚠️ **REGRA OBRIGATÓRIA - PORTUGUÊS BRASILEIRO PERFEITO:**
Todo o texto no infográfico DEVE estar em PORTUGUÊS BRASILEIRO 100% CORRETO:
- Revise TODA ortografia, acentuação e gramática ANTES de gerar
- Use acentuação correta: á, é, í, ó, ú, ã, õ, ç
- Garanta concordância verbal e nominal perfeita
- Use vocabulário educacional brasileiro adequado
- ZERO erros de português são tolerados - revise 3 vezes!

Conteúdo:
${pathDescription}

Lembre-se: PORTUGUÊS IMPECÁVEL é OBRIGATÓRIO!`;
        
        const result = await generateImage({ prompt });
        return { imageUrl: result.url };
      }),
    
    generateModuleInfographic: protectedProcedure
      .input(z.object({ moduleId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { generateImage } = await import('./_core/imageGeneration');
        const module = await db.getLearningModuleById(input.moduleId, ctx.user.id);
        
        if (!module) {
          throw new Error('Módulo não encontrado');
        }
        
        const topics = await db.getLearningTopicsByModule(input.moduleId, ctx.user.id);
        
        let moduleDescription = `Módulo: ${module.title}\n`;
        if (module.description) {
          moduleDescription += `Descrição: ${module.description}\n\n`;
        }
        moduleDescription += `Tópicos:\n`;
        topics.forEach((topic, idx) => {
          moduleDescription += `${idx + 1}. ${topic.title}\n`;
        });
        
        const prompt = `Crie um infográfico visual moderno, lúdico e educacional para um módulo de aprendizagem. O infográfico deve:

- Ter design colorido e atrativo para estudantes
- Usar ilustrações e ícones educacionais divertidos
- Ter fundo com gradiente suave ou textura sutil
- Incluir o título do módulo em destaque no topo
- Mostrar os tópicos de forma visual e organizada
- Usar elementos gráficos como setas, linhas conectoras, badges
- Ter aspecto lúdico e engajador
- Tamanho: 1200x800 pixels

🚨 **REGRA OBRIGATÓRIA INEGOCIÁVEL - PORTUGUÊS BRASILEIRO PERFEITO:**
Todo o texto no infográfico DEVE estar em PORTUGUÊS BRASILEIRO 100% CORRETO:
- Revise TODA ortografia, acentuação e gramática ANTES de gerar a imagem
- Use acentuação correta obrigatoriamente: á, é, í, ó, ú, ã, õ, ç
- Garanta concordância verbal e nominal perfeita (ex: "tópicos", não "topicos")
- Use vocabulário educacional brasileiro adequado
- Evite anglicismos e estrangeirismos desnecessários
- ZERO erros de português são aceitáveis - revise o texto 3 vezes antes de gerar!
- Exemplos de erros PROIBIDOS: "topico" (correto: "tópico"), "modulo" (correto: "módulo"), "grafico" (correto: "gráfico")

Conteúdo do módulo:
${moduleDescription}

Crie um infográfico que torne o aprendizado visual e divertido, com PORTUGUÊS IMPECÁVEL E SEM NENHUM ERRO!`;
        
        const result = await generateImage({ prompt });
        
        // Salvar URL do infográfico no módulo
        await db.updateLearningModule(input.moduleId, { infographicUrl: result.url }, ctx.user.id);
        
        return { imageUrl: result.url };
      }),
    
    suggestLessonPlans: protectedProcedure
      .input(z.object({ topicId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import('./_core/llm');
        const topic = await db.getLearningTopicById(input.topicId, ctx.user.id);
        
        if (!topic) {
          throw new Error('Tópico não encontrado');
        }
        
        const prompt = `Você é um especialista em pedagogia e metodologias ativas. Sugira um plano de aula detalhado para o seguinte tópico:

TÓPICO: ${topic.title}
DESCRIÇÃO: ${topic.description || 'Não informada'}
DURAÇÃO ESTIMADA: ${topic.estimatedHours || 2} horas

Crie sugestões no formato JSON:
{
  "objectives": ["objetivo 1", "objetivo 2"],
  "methodology": "Descrição da metodologia sugerida",
  "activities": [
    {
      "title": "Nome da atividade",
      "description": "Descrição detalhada",
      "duration": 30
    }
  ],
  "resources": ["recurso 1", "recurso 2"],
  "assessment": "Forma de avaliação sugerida"
}`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'Você é um especialista em pedagogia e metodologias ativas de ensino.' },
            { role: 'user', content: prompt }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'lesson_plan',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  objectives: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  methodology: { type: 'string' },
                  activities: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        duration: { type: 'number' }
                      },
                      required: ['title', 'description', 'duration'],
                      additionalProperties: false
                    }
                  },
                  resources: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  assessment: { type: 'string' }
                },
                required: ['objectives', 'methodology', 'activities', 'resources', 'assessment'],
                additionalProperties: false
              }
            }
          }
        });
        
        const content = typeof response.choices[0].message.content === 'string' 
          ? response.choices[0].message.content 
          : JSON.stringify(response.choices[0].message.content);
        return JSON.parse(content || '{}');
      }),

    // Gerar prova com IA
    generateExam: protectedProcedure
      .input(z.object({
        subjectId: z.number(),
        examType: z.enum(['objective', 'subjective', 'case_study', 'mixed']),
        moduleIds: z.array(z.number()).optional(), // Se vazio, usa todos os módulos
        questionCount: z.number().min(1).max(50).default(10),
        difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).default('mixed'),
      }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Buscar dados da disciplina e módulos
        const subject = await db.getSubjectById(input.subjectId, ctx.user.id);
        if (!subject) throw new Error('Disciplina não encontrada');
        
        const modules = await db.getLearningPathBySubject(input.subjectId, ctx.user.id) || [];
        
        // Filtrar módulos se especificados
        let filteredModules = modules;
        if (input.moduleIds && input.moduleIds.length > 0) {
          filteredModules = modules.filter((m: any) => input.moduleIds!.includes(m.id));
        }
        
        if (filteredModules.length === 0) {
          throw new Error('Nenhum módulo encontrado para gerar a prova');
        }
        
        // Preparar conteúdo dos módulos
        const modulesContent = filteredModules.map((m: any) => ({
          title: m.title,
          description: m.description,
          topics: m.topics?.map((t: any) => t.title).join(', ') || ''
        }));
        
        const examTypeLabels = {
          objective: 'questões objetivas (múltipla escolha com 4 alternativas, indicando a correta)',
          subjective: 'questões dissertativas/subjetivas',
          case_study: 'estudos de caso práticos com perguntas',
          mixed: 'misto (objetivas, subjetivas e estudos de caso)'
        };
        
        const difficultyLabels = {
          easy: 'fácil',
          medium: 'média',
          hard: 'difícil',
          mixed: 'variada (fácil, média e difícil)'
        };
        
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `Você é um professor especialista em criar provas e avaliações. Gere uma prova completa em português brasileiro com base no conteúdo fornecido. Retorne APENAS um JSON válido.`
            },
            {
              role: 'user',
              content: `Crie uma prova para a disciplina "${subject.name}" com as seguintes especificações:

- Tipo: ${examTypeLabels[input.examType]}
- Número de questões: ${input.questionCount}
- Dificuldade: ${difficultyLabels[input.difficulty]}

Conteúdo dos módulos:
${JSON.stringify(modulesContent, null, 2)}

IMPORTANTE:
- SEMPRE inclua "correctAnswer" com a resposta correta (para objetivas: a letra da alternativa; para subjetivas/casos: deixe como "N/A")
- SEMPRE inclua "expectedAnswer" com a justificativa detalhada ou resposta esperada (OBRIGATÓRIO para TODAS as questões)

Retorne um JSON com a estrutura:
{
  "title": "Título da Prova",
  "instructions": "Instruções gerais",
  "totalPoints": 100,
  "questions": [
    {
      "number": 1,
      "type": "objective|subjective|case_study",
      "points": 10,
      "difficulty": "easy|medium|hard",
      "module": "Nome do módulo relacionado",
      "question": "Texto da questão",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."], // apenas para objetivas
      "correctAnswer": "A) texto da alternativa correta" (para objetivas) ou "N/A" (para subjetivas),
      "expectedAnswer": "Justificativa detalhada ou resposta esperada" (OBRIGATÓRIO),
      "caseContext": "Contexto do caso", // apenas para estudos de caso
      "caseQuestions": ["Pergunta 1", "Pergunta 2"] // apenas para estudos de caso
    }
  ]
}`
            }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'exam_generation',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  instructions: { type: 'string' },
                  totalPoints: { type: 'number' },
                  questions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        number: { type: 'number' },
                        type: { type: 'string' },
                        points: { type: 'number' },
                        difficulty: { type: 'string' },
                        module: { type: 'string' },
                        question: { type: 'string' },
                        options: { type: 'array', items: { type: 'string' } },
                        correctAnswer: { type: 'string' },
                        expectedAnswer: { type: 'string' },
                        caseContext: { type: 'string' },
                        caseQuestions: { type: 'array', items: { type: 'string' } }
                      },
                      required: ['number', 'type', 'points', 'difficulty', 'module', 'question', 'correctAnswer', 'expectedAnswer'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['title', 'instructions', 'totalPoints', 'questions'],
                additionalProperties: false
              }
            }
          }
        });
        
        const content = typeof response.choices[0].message.content === 'string' 
          ? response.choices[0].message.content 
          : JSON.stringify(response.choices[0].message.content);
        return JSON.parse(content || '{}');
      }),

    // Gerar exercícios para um módulo específico
    generateModuleExercises: protectedProcedure
      .input(z.object({
        moduleId: z.number(),
        exerciseType: z.enum(['objective', 'subjective', 'case_study', 'mixed']),
        questionCount: z.number().min(1).max(20).default(5),
      }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Buscar dados do módulo
        const module = await db.getLearningModuleById(input.moduleId, ctx.user.id);
        if (!module) throw new Error('Módulo não encontrado');
        
        // Buscar tópicos do módulo
        const topics = await db.getLearningTopicsByModule(input.moduleId, ctx.user.id);
        const topicsList = topics?.map((t: any) => t.title).join(', ') || 'Não informados';
        
        const exerciseTypeLabels = {
          objective: 'questões objetivas (múltipla escolha com 4 alternativas)',
          subjective: 'questões dissertativas',
          case_study: 'estudos de caso práticos',
          mixed: 'misto (objetivas, subjetivas e estudos de caso)'
        };
        
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `Você é um professor especialista em criar exercícios didáticos. Gere exercícios em português brasileiro. Retorne APENAS um JSON válido.`
            },
            {
              role: 'user',
              content: `Crie ${input.questionCount} exercícios do tipo ${exerciseTypeLabels[input.exerciseType]} para o módulo:

Título: ${module.title}
Descrição: ${module.description || 'Não informada'}
Tópicos: ${topicsList}

IMPORTANTE:
- SEMPRE inclua "correctAnswer" com a resposta correta (para objetivas: a letra da alternativa; para subjetivas/casos: a resposta esperada completa)
- SEMPRE inclua "explanation" com uma justificativa detalhada explicando por que essa é a resposta correta

Retorne um JSON com a estrutura:
{
  "moduleTitle": "${module.title}",
  "exercises": [
    {
      "number": 1,
      "type": "objective|subjective|case_study",
      "question": "Texto da questão",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."], // apenas para objetivas
      "correctAnswer": "A) texto da alternativa correta" (para objetivas) ou "Resposta esperada completa" (para subjetivas),
      "explanation": "Justificativa detalhada da resposta" (OBRIGATÓRIO),
      "caseContext": "Contexto do caso", // apenas para estudos de caso
      "caseQuestions": ["Pergunta 1", "Pergunta 2"] // apenas para estudos de caso
    }
  ]
}`
            }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'exercises_generation',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  moduleTitle: { type: 'string' },
                  exercises: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        number: { type: 'number' },
                        type: { type: 'string' },
                        question: { type: 'string' },
                        options: { type: 'array', items: { type: 'string' } },
                        correctAnswer: { type: 'string' },
                        hint: { type: 'string' },
                        explanation: { type: 'string' },
                        caseContext: { type: 'string' },
                        caseQuestions: { type: 'array', items: { type: 'string' } }
                      },
                      required: ['number', 'type', 'question', 'correctAnswer', 'explanation'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['moduleTitle', 'exercises'],
                additionalProperties: false
              }
            }
          }
        });
        
        const content = typeof response.choices[0].message.content === 'string' 
          ? response.choices[0].message.content 
          : JSON.stringify(response.choices[0].message.content);
        return JSON.parse(content || '{}');
      }),

    // Gerar mapa mental dos módulos
    generateMindMap: protectedProcedure
      .input(z.object({
        subjectId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Buscar dados da disciplina e módulos
        const subject = await db.getSubjectById(input.subjectId, ctx.user.id);
        if (!subject) throw new Error('Disciplina não encontrada');
        
        const modules = await db.getLearningPathBySubject(input.subjectId, ctx.user.id) || [];
        
        if (modules.length === 0) {
          throw new Error('Nenhum módulo encontrado para gerar o mapa mental');
        }
        
        // LIMITAR DRASTICAMENTE: apenas 3 módulos
        const limitedModules = modules.slice(0, 3);
        
        // Simplificar conteúdo: títulos curtos
        const modulesContent = limitedModules.map((m: any) => ({
          title: m.title.substring(0, 50),
          topics: m.topics?.slice(0, 3).map((t: any) => t.title.substring(0, 40)) || []
        }));
        
        const response = await invokeLLM({
          max_tokens: 1500,
          messages: [
            {
              role: 'system',
              content: `Você é um especialista em criar mapas mentais educacionais. Gere uma estrutura de mapa mental em português brasileiro. Retorne APENAS um JSON válido.`
            },
            {
              role: 'user',
              content: `Mapa mental MINIMALISTA "${subject.name}":
${JSON.stringify(modulesContent)}

JSON (descrições MAX 20 chars):
{"title":"${subject.name}","description":"Visão geral","nodes":[{"id":"1","label":"Mod","description":"Desc","color":"#3b82f6","children":[{"id":"1.1","label":"Top","description":"D"}]}]}`
            }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'mindmap_generation',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  nodes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        label: { type: 'string' },
                        description: { type: 'string' },
                        color: { type: 'string' },
                        children: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              label: { type: 'string' },
                              description: { type: 'string' },
                              keywords: { type: 'array', items: { type: 'string' } }
                            },
                            required: ['id', 'label'],
                            additionalProperties: false
                          }
                        }
                      },
                      required: ['id', 'label'],
                      additionalProperties: false
                    }
                  },
                  connections: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        from: { type: 'string' },
                        to: { type: 'string' },
                        label: { type: 'string' }
                      },
                      required: ['from', 'to'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['title', 'description', 'nodes'],
                additionalProperties: false
              }
            }
          }
        });
        
        // Tratamento robusto da resposta da IA para mapa mental
        try {
          const content = typeof response.choices[0].message.content === 'string' 
            ? response.choices[0].message.content 
            : JSON.stringify(response.choices[0].message.content);
          
          if (!content || content.trim() === '') {
            throw new Error('Resposta vazia da IA');
          }
          
          // Tentar fazer parse do JSON
          const parsed = JSON.parse(content);
          
          // Validar estrutura mínima do mapa mental
          if (!parsed.title || !parsed.nodes || !Array.isArray(parsed.nodes)) {
            throw new Error('Estrutura de mapa mental inválida');
          }
          
          return parsed;
        } catch (error: any) {
          console.error('Erro ao processar resposta do mapa mental:', error);
          throw new Error(`Erro ao gerar mapa mental: ${error.message || 'JSON malformado'}. Tente novamente.`);
        }
      }),

    // Gerar infográfico visual com canvas
    generateVisualInfographic: protectedProcedure
      .input(z.object({
        subjectId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Buscar dados da disciplina e módulos
        const subject = await db.getSubjectById(input.subjectId, ctx.user.id);
        if (!subject) throw new Error('Disciplina não encontrada');
        
        const modules = await db.getLearningPathBySubject(input.subjectId, ctx.user.id) || [];
        
        if (modules.length === 0) {
          throw new Error('Nenhum módulo encontrado para gerar o infográfico');
        }
        
        // Limitar a 6 módulos
        const limitedModules = modules.slice(0, 6);
        
        const modulesContent = limitedModules.map((m: any) => ({
          title: m.title,
          topics: m.topics?.slice(0, 5).map((t: any) => t.title) || []
        }));
        
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `Você é um designer de infográficos educacionais. Gere dados para um infográfico visual em português brasileiro.`
            },
            {
              role: 'user',
              content: `Crie dados para infográfico da disciplina "${subject.name}" com ${limitedModules.length} módulos:

${JSON.stringify(modulesContent, null, 2)}

Para cada módulo:
- Descrição curta (máx 80 caracteres)
- Escolha 1 emoji representativo
- Cor hex (#rrggbb)

Retorne JSON:
{
  "title": "${subject.name}",
  "subtitle": "Visão Geral do Conteúdo Programático",
  "modules": [
    {
      "title": "Título do Módulo",
      "description": "Descrição breve",
      "topics": ["Tópico 1", "Tópico 2"],
      "color": "#3b82f6",
      "icon": "📚"
    }
  ],
  "stats": {
    "totalModules": ${limitedModules.length},
    "totalTopics": ${limitedModules.reduce((acc: number, m: any) => acc + (m.topics?.length || 0), 0)},
    "estimatedHours": ${limitedModules.length * 8}
  }
}`
            }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'infographic_generation',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  subtitle: { type: 'string' },
                  modules: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        topics: { type: 'array', items: { type: 'string' } },
                        color: { type: 'string' },
                        icon: { type: 'string' }
                      },
                      required: ['title', 'description', 'topics', 'color', 'icon'],
                      additionalProperties: false
                    }
                  },
                  stats: {
                    type: 'object',
                    properties: {
                      totalModules: { type: 'number' },
                      totalTopics: { type: 'number' },
                      estimatedHours: { type: 'number' }
                    },
                    required: ['totalModules', 'totalTopics', 'estimatedHours'],
                    additionalProperties: false
                  }
                },
                required: ['title', 'subtitle', 'modules', 'stats'],
                additionalProperties: false
              }
            }
          }
        });
        
        try {
          const content = typeof response.choices[0].message.content === 'string' 
            ? response.choices[0].message.content 
            : JSON.stringify(response.choices[0].message.content);
          
          if (!content || content.trim() === '') {
            throw new Error('Resposta vazia da IA');
          }
          
          const parsed = JSON.parse(content);
          
          if (!parsed.title || !parsed.modules || !Array.isArray(parsed.modules)) {
            throw new Error('Estrutura de infográfico inválida');
          }
          
          return parsed;
        } catch (error: any) {
          console.error('Erro ao processar resposta do infográfico:', error);
          throw new Error(`Erro ao gerar infográfico: ${error.message || 'JSON malformado'}. Tente novamente.`);
        }
      }),

    // Gerar mapa mental de um módulo específico
    generateModuleMindMap: protectedProcedure
      .input(z.object({
        moduleId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        const module = await db.getLearningModuleById(input.moduleId, ctx.user.id);
        if (!module) throw new Error('Módulo não encontrado');
        
        // Buscar tópicos do módulo usando getLearningPathBySubject
        const allModules = await db.getLearningPathBySubject(module.subjectId, ctx.user.id);
        const moduleWithTopics = allModules?.find((m: any) => m.id === input.moduleId);
        const topics = moduleWithTopics?.topics?.slice(0, 5) || [];
        
        const response = await invokeLLM({
          max_tokens: 1000,
          messages: [
            {
              role: 'system',
              content: 'Gere um mapa mental em JSON. Seja MUITO conciso.'
            },
            {
              role: 'user',
              content: `Mapa mental para "${module.title.substring(0, 40)}":
Tópicos: ${topics.map((t: any) => t.title.substring(0, 30)).join(', ')}

JSON (descrições MAX 15 chars):
{"title":"${module.title.substring(0, 40)}","description":"Visão geral","nodes":[{"id":"1","label":"Top","description":"D","color":"#3b82f6","children":[{"id":"1.1","label":"Sub","description":"D"}]}]}`
            }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'module_mindmap',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  nodes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        label: { type: 'string' },
                        description: { type: 'string' },
                        color: { type: 'string' },
                        children: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              label: { type: 'string' },
                              description: { type: 'string' }
                            },
                            required: ['id', 'label', 'description'],
                            additionalProperties: false
                          }
                        }
                      },
                      required: ['id', 'label', 'description', 'color'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['title', 'description', 'nodes'],
                additionalProperties: false
              }
            }
          }
        });
        
        try {
          const content = typeof response.choices[0].message.content === 'string' 
            ? response.choices[0].message.content 
            : JSON.stringify(response.choices[0].message.content);
          
          if (!content || content.trim() === '') {
            throw new Error('Resposta vazia da IA');
          }
          
          const parsed = JSON.parse(content);
          
          if (!parsed.title || !parsed.nodes) {
            throw new Error('Estrutura inválida');
          }
          
          return parsed;
        } catch (error: any) {
          console.error('Erro ao processar mapa mental do módulo:', error);
          throw new Error(`Erro ao gerar mapa mental: ${error.message || 'JSON malformado'}. Tente novamente.`);
        }
      }),
  }),

  // Student Portal Routes
  student: router({
    // Verificar sessão de aluno
    me: publicProcedure.query(({ ctx }) => {
      if (ctx.studentSession) {
        return {
          id: ctx.studentSession.studentId,
          registrationNumber: ctx.studentSession.registrationNumber,
          fullName: ctx.studentSession.fullName,
          professorId: ctx.studentSession.professorId,
        };
      }
      return null;
    }),
    
    // Logout de aluno
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
    
    getEnrolledSubjects: studentProcedure
      .query(async ({ ctx }) => {
        const enrollments = await db.getStudentEnrollments(ctx.studentSession.studentId);
        const subjectsWithDetails = await Promise.all(
          enrollments.map(async (enrollment) => {
            // userId é o professorId na tabela subjectEnrollments
            const professorId = enrollment.userId;
            const subject = await db.getSubjectById(enrollment.subjectId, professorId);
            const professor = await db.getUserById(professorId);
            return {
              ...enrollment,
              subject,
              professor,
            };
          })
        );
        return subjectsWithDetails;
      }),
    
    getSubjectLearningPath: studentProcedure
      .input(z.object({ subjectId: z.number(), professorId: z.number() }))
      .query(async ({ ctx, input }) => {
        const learningPath = await db.getLearningPathBySubject(input.subjectId, input.professorId);
        
        // Get student progress for each topic
        const pathWithProgress = await Promise.all(
          learningPath.map(async (module) => {
            const topicsWithProgress = await Promise.all(
              (module.topics || []).map(async (topic: any) => {
                const progress = await db.getStudentTopicProgress(ctx.studentSession.studentId, topic.id);
                return {
                  ...topic,
                  studentProgress: progress,
                };
              })
            );
            return {
              ...module,
              topics: topicsWithProgress,
            };
          })
        );
        
        return pathWithProgress;
      }),
    
    updateTopicProgress: studentProcedure
      .input(z.object({
        topicId: z.number(),
        status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
        selfAssessment: z.enum(['understood', 'have_doubts', 'need_help']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateStudentTopicProgress({
          studentId: ctx.studentSession.studentId,
          ...input,
        });
      }),
    
    getTopicMaterials: studentProcedure
      .input(z.object({ topicId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTopicMaterials(input.topicId);
      }),
    
    getTopicAssignments: studentProcedure
      .input(z.object({ topicId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTopicAssignments(input.topicId);
      }),
    
    submitAssignment: protectedProcedure
      .input(z.object({
        assignmentId: z.number(),
        content: z.string().optional(),
        fileUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createAssignmentSubmission({
          assignmentId: input.assignmentId,
          studentId: ctx.user.id,
          content: input.content,
          fileUrl: input.fileUrl,
        });
      }),
    
    getMySubmission: protectedProcedure
      .input(z.object({ assignmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getStudentSubmission(input.assignmentId, ctx.user.id);
      }),
    
    // Notificações do aluno
    getNotifications: studentProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getStudentNotifications(ctx.studentSession.studentId, input.limit || 50);
      }),
    
    getUnreadNotificationsCount: studentProcedure
      .query(async ({ ctx }) => {
        return await db.getStudentUnreadNotificationsCount(ctx.studentSession.studentId);
      }),
    
    markNotificationAsRead: studentProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.markStudentNotificationAsRead(input.id, ctx.studentSession.studentId);
      }),
    
    markAllNotificationsAsRead: studentProcedure
      .mutation(async ({ ctx }) => {
        return await db.markAllStudentNotificationsAsRead(ctx.studentSession.studentId);
      }),
  }),

  // Professor Materials Management
  materials: router({
    create: protectedProcedure
      .input(z.object({
        topicId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        type: z.enum(['pdf', 'video', 'link', 'presentation', 'document', 'other']),
        url: z.string(),
        fileSize: z.number().optional(),
        isRequired: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const material = await db.createTopicMaterial({
          ...input,
          professorId: ctx.user.id,
        });
        
        // Notificações serão implementadas em segundo plano
        // TODO: Adicionar worker para notificar alunos sobre novos materiais
        
        return material;
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        url: z.string().optional(),
        isRequired: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await db.updateTopicMaterial(id, data, ctx.user.id);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteTopicMaterial(input.id, ctx.user.id);
      }),
    
    getByTopic: protectedProcedure
      .input(z.object({ topicId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getTopicMaterials(input.topicId);
      }),
  }),

  // Professor Enrollment Management
  enrollments: router({
    create: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        subjectId: z.number(),
        classId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createStudentEnrollment({
          ...input,
          professorId: ctx.user.id,
        });
      }),
    
    getBySubject: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Usar a mesma tabela que o botão verde (subjectEnrollments)
        const enrollments = await db.getStudentsBySubject(input.subjectId, ctx.user.id);
        return enrollments.map(enrollment => ({
          id: enrollment.enrollmentId,
          studentId: enrollment.studentId,
          subjectId: input.subjectId,
          enrolledAt: enrollment.enrolledAt,
          status: enrollment.status || 'active',
          registrationNumber: enrollment.registrationNumber || '',
          student: {
            id: enrollment.studentId,
            name: enrollment.fullName || 'Aluno',
            email: null,
            registrationNumber: enrollment.registrationNumber,
          },
        }));
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['active', 'completed', 'dropped']),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateEnrollmentStatus(input.id, input.status, ctx.user.id);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteEnrollment(input.id, ctx.user.id);
      }),
  }),

  // Professor Assignment Management
  assignments: router({
    create: protectedProcedure
      .input(z.object({
        topicId: z.number(),
        title: z.string(),
        description: z.string(),
        type: z.enum(['exercise', 'essay', 'project', 'quiz', 'practical']),
        dueDate: z.date().optional(),
        maxScore: z.number().optional(),
        isRequired: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const assignment = await db.createTopicAssignment({
          ...input,
          professorId: ctx.user.id,
        });
        
        // Notificações serão implementadas em segundo plano
        // TODO: Adicionar worker para notificar alunos sobre novas atividades
        
        return assignment;
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        dueDate: z.date().optional(),
        maxScore: z.number().optional(),
        isRequired: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await db.updateTopicAssignment(id, data, ctx.user.id);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteTopicAssignment(input.id, ctx.user.id);
      }),
    
    getSubmissions: protectedProcedure
      .input(z.object({ assignmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getAssignmentSubmissions(input.assignmentId, ctx.user.id);
      }),
    
    gradeSubmission: protectedProcedure
      .input(z.object({
        submissionId: z.number(),
        score: z.number(),
        feedback: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.gradeSubmission(input.submissionId, {
          score: input.score,
          feedback: input.feedback,
          gradedBy: ctx.user.id,
        });
      }),
  }),

  // Students (Matrículas)
  students: router({
    create: protectedProcedure
      .input(z.object({
        registrationNumber: z.string().min(1, "Matrícula é obrigatória"),
        fullName: z.string().min(3, "Nome completo é obrigatório"),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createStudent({
          ...input,
          userId: ctx.user.id,
        });
      }),
    
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getStudentsByUser(ctx.user.id);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getStudentById(input.id, ctx.user.id);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        registrationNumber: z.string().optional(),
        fullName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await db.updateStudent(id, data, ctx.user.id);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteStudent(input.id, ctx.user.id);
      }),
    
    exportDOCX: protectedProcedure
      .query(async ({ ctx }) => {
        const students = await db.getStudentsByUser(ctx.user.id);
        
        // Importar biblioteca docx
        const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, BorderStyle } = await import('docx');
        
        // Criar documento
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Lista de Alunos Matriculados",
                    bold: true,
                    size: 32,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Data: ${new Date().toLocaleDateString('pt-BR')}`,
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  // Cabeçalho
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "Matrícula", bold: true })] })],
                        shading: { fill: "4472C4" },
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "Nome Completo", bold: true })] })],
                        shading: { fill: "4472C4" },
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "Data de Cadastro", bold: true })] })],
                        shading: { fill: "4472C4" },
                      }),
                    ],
                  }),
                  // Linhas de dados
                  ...students.map(student => 
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph(student.registrationNumber)] }),
                        new TableCell({ children: [new Paragraph(student.fullName)] }),
                        new TableCell({ children: [new Paragraph(student.createdAt ? new Date(student.createdAt).toLocaleDateString('pt-BR') : 'N/A')] }),
                      ],
                    })
                  ),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `\n\nTotal de alunos: ${students.length}`,
                    bold: true,
                  }),
                ],
                spacing: { before: 400 },
              }),
            ],
          }],
        });
        
        // Gerar buffer
        const buffer = await Packer.toBuffer(doc);
        
        // Converter para base64
        return {
          data: buffer.toString('base64'),
          filename: `lista-alunos-${new Date().toISOString().split('T')[0]}.docx`,
        };
      }),
    
    exportPDF: protectedProcedure
      .query(async ({ ctx }) => {
        const students = await db.getStudentsByUser(ctx.user.id);
        
        // Usar jsPDF para gerar PDF
        const { jsPDF } = await import('jspdf');
        await import('jspdf-autotable');
        
        const doc = new jsPDF();
        
        // Título
        doc.setFontSize(18);
        doc.text('Lista de Alunos Matriculados', 105, 20, { align: 'center' });
        
        // Data
        doc.setFontSize(12);
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 105, 30, { align: 'center' });
        
        // Tabela
        (doc as any).autoTable({
          startY: 40,
          head: [['Matrícula', 'Nome Completo', 'Data de Cadastro']],
          body: students.map(s => [
            s.registrationNumber,
            s.fullName,
            new Date(s.createdAt).toLocaleDateString('pt-BR'),
          ]),
          theme: 'grid',
          headStyles: { fillColor: [68, 114, 196] },
        });
        
        // Rodapé
        const finalY = (doc as any).lastAutoTable.finalY || 40;
        doc.setFontSize(12);
        doc.text(`Total de alunos: ${students.length}`, 14, finalY + 10);
        
        // Gerar buffer
        const buffer = Buffer.from(doc.output('arraybuffer'));
        
        return {
          data: buffer.toString('base64'),
          filename: `lista-alunos-${new Date().toISOString().split('T')[0]}.pdf`,
        };
      }),
    
    getProfile: protectedProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getStudentProfile(input.studentId, ctx.user.id);
      }),
    
    getAttendanceHistory: protectedProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getStudentAttendanceHistory(input.studentId, ctx.user.id);
      }),
    
    getStatistics: protectedProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getStudentStatistics(input.studentId, ctx.user.id);
      }),
    
    enrollInClass: protectedProcedure
      .input(z.object({ studentId: z.number(), classId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.enrollStudentInClass(input.studentId, input.classId, ctx.user.id);
      }),
    
    unenrollFromClass: protectedProcedure
      .input(z.object({ enrollmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.unenrollStudentFromClass(input.enrollmentId, ctx.user.id);
      }),
    
    // Importação em massa de alunos
    parseImportFile: protectedProcedure
      .input(z.object({
        fileData: z.string(), // base64
        filename: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { parseStudentFile } = await import('./fileParser');
        
        // Converter base64 para buffer
        const buffer = Buffer.from(input.fileData, 'base64');
        
        // Parse do arquivo
        const result = await parseStudentFile(buffer, input.filename);
        
        return result;
      }),
    
    confirmImport: protectedProcedure
      .input(z.object({
        students: z.array(z.object({
          registrationNumber: z.string(),
          fullName: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const results = {
          success: [] as string[],
          errors: [] as string[],
        };
        
        for (const student of input.students) {
          try {
            // Verificar se já existe
            const existing = await db.getStudentByRegistration(student.registrationNumber);
            
            if (existing) {
              results.errors.push(`Matrícula ${student.registrationNumber} já existe`);
              continue;
            }
            
            // Criar aluno
            await db.createStudent({
              registrationNumber: student.registrationNumber,
              fullName: student.fullName,
              userId: ctx.user.id,
            });
            
            results.success.push(`${student.fullName} (${student.registrationNumber})`);
          } catch (error: any) {
            results.errors.push(`Erro ao criar ${student.fullName}: ${error.message}`);
          }
        }
        
        return results;
      }),
    
    downloadTemplate: protectedProcedure
      .query(async () => {
        const XLSX = await import('xlsx');
        
        // Criar planilha de exemplo
        const data = [
          ['Matrícula', 'Nome Completo'],
          ['2024001', 'João Silva'],
          ['2024002', 'Maria Santos'],
          ['2024003', 'Pedro Oliveira'],
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Alunos');
        
        // Gerar buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        return {
          data: buffer.toString('base64'),
          filename: 'template-importacao-alunos.xlsx',
        };
      }),
    
    // Importação e matrícula direta em disciplina
    importAndEnrollInSubject: protectedProcedure
      .input(z.object({
        students: z.array(z.object({
          registrationNumber: z.string(),
          fullName: z.string(),
        })),
        subjectId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const results = {
          created: [] as string[],
          enrolled: [] as string[],
          errors: [] as string[],
        };
        
        for (const studentData of input.students) {
          try {
            // Verificar se aluno já existe
            let student = await db.getStudentByRegistration(studentData.registrationNumber);
            
            // Criar aluno se não existir
            if (!student) {
              student = await db.createStudent({
                registrationNumber: studentData.registrationNumber,
                fullName: studentData.fullName,
                userId: ctx.user.id,
              });
              results.created.push(`${studentData.fullName} (${studentData.registrationNumber})`);
            }
            
            // Verificar se já está matriculado na disciplina
            const enrolledStudents = await db.getStudentsBySubject(input.subjectId, ctx.user.id);
            const alreadyEnrolled = enrolledStudents.some(e => e.studentId === student!.id);
            
            if (alreadyEnrolled) {
              results.errors.push(`${studentData.fullName} já está matriculado nesta disciplina`);
              continue;
            }
            
            // Matricular na disciplina
            await db.enrollStudentInSubject(student.id, input.subjectId, ctx.user.id);
            results.enrolled.push(`${studentData.fullName} (${studentData.registrationNumber})`);
          } catch (error: any) {
            results.errors.push(`Erro com ${studentData.fullName}: ${error.message}`);
          }
        }
        
        return results;
      }),

    // Matrícula em massa em múltiplas disciplinas
    bulkEnrollInMultipleSubjects: protectedProcedure
      .input(z.object({
        registrationNumber: z.string(),
        fullName: z.string(),
        subjectIds: z.array(z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        const results = {
          studentCreated: false,
          enrolled: [] as string[],
          errors: [] as string[],
        };
        
        try {
          // Verificar se aluno já existe
          let student = await db.getStudentByRegistration(input.registrationNumber);
          
          // Criar aluno se não existir
          if (!student) {
            student = await db.createStudent({
              registrationNumber: input.registrationNumber,
              fullName: input.fullName,
              userId: ctx.user.id,
            });
            results.studentCreated = true;
          }
          
          // Matricular em cada disciplina
          for (const subjectId of input.subjectIds) {
            try {
              // Buscar nome da disciplina
              const subject = await db.getSubjectById(subjectId, ctx.user.id);
              if (!subject) {
                results.errors.push(`Disciplina ID ${subjectId} não encontrada`);
                continue;
              }
              
              // Verificar se já está matriculado
              const enrolledStudents = await db.getStudentsBySubject(subjectId, ctx.user.id);
              const alreadyEnrolled = enrolledStudents.some(e => e.studentId === student!.id);
              
              if (alreadyEnrolled) {
                results.errors.push(`Já matriculado em ${subject.name}`);
                continue;
              }
              
              // Matricular
              await db.enrollStudentInSubject(student.id, subjectId, ctx.user.id);
              results.enrolled.push(subject.name);
            } catch (error: any) {
              results.errors.push(`Erro em disciplina ID ${subjectId}: ${error.message}`);
            }
          }
        } catch (error: any) {
          results.errors.push(`Erro ao processar aluno: ${error.message}`);
        }
        
        return results;
      }),
  }),

  // Notifications
  notifications: router({
    getAll: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getNotifications(ctx.user.id, input.limit);
      }),
    
    getUnreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUnreadNotificationsCount(ctx.user.id);
      }),
    
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.markNotificationAsRead(input.id, ctx.user.id);
      }),
    
    markAllAsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        return await db.markAllNotificationsAsRead(ctx.user.id);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteNotification(input.id, ctx.user.id);
      }),
  }),

  // ==================== ANNOUNCEMENTS (AVISOS) ====================
  announcements: router({
    // Professor: Criar aviso
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        message: z.string().min(1),
        isImportant: z.boolean(),
        subjectId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Criar o aviso
        const announcement = await db.createAnnouncement({
          ...input,
          userId: ctx.user.id,
        });
        
        // Buscar alunos matriculados na disciplina e criar notificações
        const enrolledStudents = await db.getStudentsBySubject(input.subjectId, ctx.user.id);
        const subject = await db.getSubjectById(input.subjectId, ctx.user.id);
        
        // Criar notificação para cada aluno matriculado
        for (const student of enrolledStudents) {
          try {
            await db.createNotification({
              userId: student.studentId,
              type: 'new_announcement',
              title: input.isImportant ? `🚨 Aviso Importante: ${input.title}` : `📢 Novo Aviso: ${input.title}`,
              message: `${subject?.name || 'Disciplina'}: ${input.message.substring(0, 100)}${input.message.length > 100 ? '...' : ''}`,
              link: '/student-announcements',
              relatedId: announcement.id,
            });
          } catch (error) {
            console.error('Erro ao criar notificação para aluno:', student.studentId, error);
          }
        }
        
        return announcement;
      }),
    
    // Professor: Listar todos os avisos
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getAnnouncementsByUser(ctx.user.id);
      }),
    
    // Professor: Atualizar aviso
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        message: z.string().optional(),
        isImportant: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await db.updateAnnouncement(id, data, ctx.user.id);
      }),
    
    // Professor: Deletar aviso
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteAnnouncement(input.id, ctx.user.id);
      }),
    
    // Aluno: Listar avisos das disciplinas matriculadas
    getForStudent: studentProcedure
      .query(async ({ ctx }) => {
        return await db.getAnnouncementsForStudent(ctx.studentSession.studentId);
      }),
    
    // Aluno: Contar avisos não lidos
    getUnreadCount: studentProcedure
      .query(async ({ ctx }) => {
        return await db.getUnreadAnnouncementsCount(ctx.studentSession.studentId);
      }),
    
    // Aluno: Marcar aviso como lido
    markAsRead: studentProcedure
      .input(z.object({ announcementId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.markAnnouncementAsRead(input.announcementId, ctx.studentSession.studentId);
      }),
  }),

  // ==================== EXERCISE SUBMISSION (SUBMISSÃO DE EXERCÍCIOS) ====================
  exerciseSubmission: router({
    // Submeter exercício objetivo (múltipla escolha)
    submitObjective: studentProcedure
      .input(z.object({
        exerciseId: z.number(),
        selectedAnswer: z.string(),
        correctAnswer: z.string(),
        moduleId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const isCorrect = input.selectedAnswer === input.correctAnswer;
        const points = isCorrect ? 10 : 0;
        
        if (isCorrect) {
          await db.addPointsToStudent(
            ctx.studentSession.studentId,
            points,
            'Exercício objetivo correto',
            'exercise_objective',
            input.exerciseId
          );
        }
        
        return { isCorrect, points };
      }),
    
    // Submeter exercício subjetivo
    submitSubjective: studentProcedure
      .input(z.object({
        exerciseId: z.number(),
        answer: z.string(),
        moduleId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const points = 15;
        
        await db.addPointsToStudent(
          ctx.studentSession.studentId,
          points,
          'Exercício objetivo completado',
          'exercise_objective',
          input.exerciseId
        );
        
        // Verificar badges automáticos
        const exerciseCount = await db.getStudentExerciseCount(ctx.studentSession.studentId);
        
        if (exerciseCount === 1) {
          await db.awardBadgeToStudent(ctx.studentSession.studentId, 'first_exercise');
        } else if (exerciseCount === 10) {
          await db.awardBadgeToStudent(ctx.studentSession.studentId, 'exercise_10');
        }
        
        return { points };
      }),
    
    // Submeter estudo de caso
    submitCaseStudy: studentProcedure
      .input(z.object({
        exerciseId: z.number(),
        answer: z.string(),
        moduleId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const points = 20;
        
        await db.addPointsToStudent(
          ctx.studentSession.studentId,
          points,
          'Estudo de caso completado',
          'exercise_case_study',
          input.exerciseId
        );
        
        // Verificar badges automáticos
        const exerciseCount = await db.getStudentExerciseCount(ctx.studentSession.studentId);
        
        if (exerciseCount === 1) {
          await db.awardBadgeToStudent(ctx.studentSession.studentId, 'first_exercise');
        } else if (exerciseCount === 10) {
          await db.awardBadgeToStudent(ctx.studentSession.studentId, 'exercise_10');
        }
        
        return { points };
      }),
  }),

  // ==================== EXAM SUBMISSION (SUBMISSÃO DE PROVAS) ====================
  examSubmission: router({
    // Submeter prova completa
    submit: studentProcedure
      .input(z.object({
        examId: z.number(),
        answers: z.array(z.object({
          questionNumber: z.number(),
          answer: z.string(),
        })),
        correctAnswers: z.array(z.object({
          questionNumber: z.number(),
          correctAnswer: z.string(),
        })),
        totalQuestions: z.number(),
        timeSpent: z.number(), // em minutos
      }))
      .mutation(async ({ ctx, input }) => {
        // Calcular nota
        let correctCount = 0;
        input.answers.forEach((answer) => {
          const correct = input.correctAnswers.find(
            (ca) => ca.questionNumber === answer.questionNumber
          );
          if (correct && answer.answer === correct.correctAnswer) {
            correctCount++;
          }
        });
        
        const score = (correctCount / input.totalQuestions) * 10;
        
        // Calcular pontos baseado na nota
        let points = 0;
        if (score >= 6.0 && score < 7.1) {
          points = 30;
        } else if (score >= 7.1 && score < 8.6) {
          points = 50;
        } else if (score >= 8.6) {
          points = 80;
        }
        
        // Bonus por velocidade
        if (input.timeSpent < 15) {
          points += 10;
          await db.awardBadgeToStudent(ctx.studentSession.studentId, 'speedster_15');
        } else if (input.timeSpent < 30) {
          points += 5;
          await db.awardBadgeToStudent(ctx.studentSession.studentId, 'speedster_30');
        }
        
        if (points > 0) {
          await db.addPointsToStudent(
            ctx.studentSession.studentId,
            points,
            `Prova concluída - Nota: ${score.toFixed(1)}`,
            'exam',
            input.examId
          );
        }
        
        return { score, points, correctCount };
      }),
  }),

  // ==================== GAMIFICATION QUERIES (CONSULTAS DE GAMIFICAÇÃO) ====================
  gamification: router({
    // Obter estatísticas do aluno
    getStudentStats: studentProcedure
      .query(async ({ ctx }) => {
        const points = await db.getOrCreateStudentPoints(ctx.studentSession.studentId);
        const ranking = await db.getClassRanking(100);
        const studentRank = ranking.findIndex(r => r.studentId === ctx.studentSession.studentId) + 1;
        
        return {
          studentId: ctx.studentSession.studentId,
          totalPoints: points?.totalPoints || 0,
          currentBelt: points?.currentBelt || 'white',
          streakDays: points?.streakDays || 0,
          rank: studentRank || null,
        };
      }),
    
    // Obter histórico de pontos
    getPointsHistory: studentProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getStudentPointsHistory(ctx.studentSession.studentId, input.limit || 20);
      }),
    
    // Obter badges do aluno
    getStudentBadges: studentProcedure
      .query(async ({ ctx }) => {
        const earned = await db.getStudentBadges(ctx.studentSession.studentId);
        const all = await db.getAllBadges();
        
        return { earned, all, total: all.length };
      }),
    
    // Obter histórico de evolução de faixas
    getBeltHistory: studentProcedure
      .query(async ({ ctx }) => {
        return await db.getStudentBeltHistory(ctx.studentSession.studentId);
      }),
    
    // Obter ranking da turma
    getClassRanking: studentProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getClassRanking(input.limit || 10);
      }),
    
    // Obter ranking da turma (versão para professores)
    getClassRankingTeacher: protectedProcedure
      .input(z.object({ 
        limit: z.number().optional(),
        subjectId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getClassRanking(input.limit || 10, input.subjectId);
      }),
    
    // Obter notificações de gamificação
    getNotifications: studentProcedure
      .input(z.object({ onlyUnread: z.boolean().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getGamificationNotifications(ctx.studentSession.studentId, input.onlyUnread || false);
      }),
    
    // Marcar notificação como lida
    markNotificationAsRead: studentProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.markGamificationNotificationAsRead(input.notificationId);
      }),
    
    // ==================== TEACHER DASHBOARD (DASHBOARD DO PROFESSOR) ====================
    // Visão geral para o professor
    getTeacherOverview: protectedProcedure
      .input(z.object({ subjectId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const allBadges = await db.getAllBadges();
        const totalEarned = await db.getTotalStudentsWithBadges(input.subjectId);
        
        return {
          totalBadgesAvailable: allBadges.length,
          totalBadgesEarned: totalEarned,
        };
      }),
    
    // Estatísticas de badges
    getBadgeStats: protectedProcedure
      .input(z.object({ subjectId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getBadgeStatistics(input.subjectId);
      }),
    
    // Evolução temporal de pontos (4 semanas)
    getPointsEvolution: protectedProcedure
      .input(z.object({ subjectId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getPointsEvolutionData(input.subjectId);
      }),
    
    // Gerar relatório PDF
    generateReport: protectedProcedure
      .input(z.object({ subjectId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const { generateGamificationReport } = await import('./gamification-report');
        
        // Coletar todos os dados
        const allBadges = await db.getAllBadges();
        const totalEarned = await db.getTotalStudentsWithBadges(input.subjectId);
        const ranking = await db.getClassRanking(20, input.subjectId);
        const badgeStats = await db.getBadgeStatistics();
        const evolutionData = await db.getPointsEvolutionData();
        
        const totalStudents = ranking.length;
        const activeStudents = ranking.filter(s => s.streakDays > 0).length;
        const averagePoints = totalStudents > 0
          ? Math.round(ranking.reduce((sum, s) => sum + s.totalPoints, 0) / totalStudents)
          : 0;
        
        // Calcular distribuição de faixas
        const BELT_CONFIG = [
          { name: 'white', label: 'Branca' },
          { name: 'yellow', label: 'Amarela' },
          { name: 'orange', label: 'Laranja' },
          { name: 'green', label: 'Verde' },
          { name: 'blue', label: 'Azul' },
          { name: 'purple', label: 'Roxa' },
          { name: 'brown', label: 'Marrom' },
          { name: 'black', label: 'Preta' },
        ];
        
        const beltDistribution = BELT_CONFIG.map(belt => {
          const count = ranking.filter(s => s.currentBelt === belt.name).length;
          const percentage = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
          return { ...belt, count, percentage };
        });
        
        // Preparar dados de badges
        const badges = badgeStats.map(badge => ({
          name: badge.name,
          description: badge.description,
          earnedCount: badge.earnedCount,
          percentage: totalStudents > 0 ? (badge.earnedCount / totalStudents) * 100 : 0,
        }));
        
        // Gerar PDF
        const pdfStream = generateGamificationReport({
          totalStudents,
          activeStudents,
          averagePoints,
          totalBadgesEarned: totalEarned,
          totalBadgesAvailable: allBadges.length,
          beltDistribution,
          ranking,
          badges,
          evolutionData,
        });
        
        // Converter stream para buffer
        const chunks: Buffer[] = [];
        for await (const chunk of pdfStream) {
          chunks.push(Buffer.from(chunk));
        }
        const pdfBuffer = Buffer.concat(chunks);
        
        // Retornar como base64
        return {
          pdf: pdfBuffer.toString('base64'),
          filename: `relatorio-gamificacao-${new Date().toISOString().split('T')[0]}.pdf`,
        };
      }),
    
    // ==================== RANKINGS (LEADERBOARD) ====================
    // Obter ranking de uma disciplina (professor)
    getSubjectRanking: protectedProcedure
      .input(z.object({ 
        subjectId: z.number(),
        limit: z.number().optional()
      }))
      .query(async ({ input }) => {
        return await db.getSubjectRanking(input.subjectId, input.limit || 20);
      }),
    
    // Obter ranking de uma disciplina com filtro de período (professor)
    getSubjectRankingByPeriod: protectedProcedure
      .input(z.object({ 
        subjectId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
        limit: z.number().optional()
      }))
      .query(async ({ input }) => {
        return await db.getSubjectRankingByPeriod(
          input.subjectId, 
          input.startDate, 
          input.endDate, 
          input.limit || 20
        );
      }),
    
    // Obter ranking de um módulo (professor)
    getModuleRanking: protectedProcedure
      .input(z.object({ 
        moduleId: z.number(),
        limit: z.number().optional()
      }))
      .query(async ({ input }) => {
        return await db.getModuleRanking(input.moduleId, input.limit || 20);
      }),
    
    // Obter top 3 performers de uma disciplina (professor)
    getSubjectTopPerformers: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSubjectTopPerformers(input.subjectId);
      }),
    
    // Obter estatísticas de ranking de uma disciplina (professor)
    getSubjectRankingStats: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSubjectRankingStats(input.subjectId);
      }),
    
    // Obter posição do aluno no ranking (aluno)
    getMyPosition: studentProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getStudentRankPosition(ctx.studentSession.studentId, input.subjectId);
      }),
    
    // Obter histórico de posições do aluno (aluno)
    getMyRankHistory: studentProcedure
      .input(z.object({ 
        subjectId: z.number(),
        days: z.number().optional()
      }))
      .query(async ({ ctx, input }) => {
        return await db.getStudentRankHistory(
          ctx.studentSession.studentId, 
          input.subjectId, 
          input.days || 30
        );
      }),
  }),

  // ==================== PENSAMENTO COMPUTACIONAL ====================
  computationalThinking: router({
    // Buscar perfil de PC do aluno (4 dimensões) por disciplina
    getProfile: studentProcedure
      .input(z.object({
        subjectId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getStudentCTProfile(ctx.studentSession.studentId, input.subjectId);
        return profile;
      }),

    // Buscar média da turma (para professor) por disciplina
    getClassAverage: protectedProcedure
      .input(z.object({
        subjectId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const average = await db.getClassCTAverage(ctx.user.id, input.subjectId);
        return average;
      }),

    // Buscar exercícios disponíveis por disciplina
    getExercises: studentProcedure
      .input(z.object({
        subjectId: z.number(),
        dimension: z.enum(['decomposition', 'pattern_recognition', 'abstraction', 'algorithms']).optional(),
        difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
      }))
      .query(async ({ input }) => {
        const exercises = await db.getCTExercises(input);
        return exercises;
      }),

    // Submeter resposta de exercício
    submitExercise: studentProcedure
      .input(z.object({
        subjectId: z.number(),
        exerciseId: z.number(),
        answer: z.string(),
        timeSpent: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Buscar exercício
        const exercises = await db.getCTExercises({ subjectId: input.subjectId });
        const exercise = exercises.find(e => e.id === input.exerciseId);
        
        if (!exercise) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Exercício não encontrado' });
        }

        // Analisar resposta com IA
        const analysis = await analyzeCTAnswer({
          dimension: exercise.dimension,
          question: exercise.description,
          answer: input.answer,
          expectedAnswer: exercise.expectedAnswer || '',
        });

        // Submeter exercício
        await db.submitCTExercise({
          studentId: ctx.studentSession.studentId,
          subjectId: input.subjectId,
          exerciseId: input.exerciseId,
          answer: input.answer,
          score: analysis.score,
          feedback: analysis.feedback,
          timeSpent: input.timeSpent,
        });

        // Verificar e conceder badges automaticamente
        await db.checkAndAwardCTBadges(ctx.studentSession.studentId, input.subjectId);

        return {
          score: analysis.score,
          feedback: analysis.feedback,
          pointsEarned: exercise.points,
        };
      }),

    // Buscar histórico de submissões
    getSubmissions: studentProcedure
      .input(z.object({
        limit: z.number().optional().default(20),
      }))
      .query(async ({ input, ctx }) => {
        const submissions = await db.getStudentCTSubmissions(ctx.studentSession.studentId, input.limit);
        return submissions;
      }),

    // Buscar badges de PC do aluno
    getBadges: studentProcedure
      .query(async ({ ctx }) => {
        const badges = await db.getStudentCTBadges(ctx.studentSession.studentId);
        return badges;
      }),

    // Buscar todos os badges disponíveis
    getAllBadges: publicProcedure
      .query(async () => {
        const badges = await db.getAllCTBadges();
        return badges;
      }),

    // [PROFESSOR] Criar exercício de PC para uma disciplina
    createExercise: protectedProcedure
      .input(z.object({
        subjectId: z.number(),
        title: z.string(),
        description: z.string(),
        dimension: z.enum(['decomposition', 'pattern_recognition', 'abstraction', 'algorithms']),
        difficulty: z.enum(['easy', 'medium', 'hard']),
        content: z.string(),
        expectedAnswer: z.string().optional(),
        points: z.number().default(10),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.createCTExercise({
          ...input,
          createdBy: ctx.user.id,
        });
        return { success: true, exerciseId: result };
      }),

    // [PROFESSOR] Buscar estatísticas da turma por disciplina
    getClassStats: protectedProcedure
      .input(z.object({
        subjectId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        // Buscar todos os alunos do professor
        const teacherStudents = await db.getStudentsByUser(ctx.user.id);
        
        // Buscar perfil de cada aluno para a disciplina específica
        const profiles = await Promise.all(
          teacherStudents.map(async (student: any) => {
            const profile = await db.getStudentCTProfile(student.id, input.subjectId);
            return {
              studentId: student.id,
              studentName: student.name,
              profile,
            };
          })
        );

        // Calcular média da turma para a disciplina
        const average = await db.getClassCTAverage(ctx.user.id, input.subjectId);

        return {
          students: profiles,
          classAverage: average,
          totalStudents: teacherStudents.length,
        };
      }),
    
    // [PROFESSOR] Obter estatísticas completas de PC por disciplina
    getSubjectStats: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getCTStatsBySubject(ctx.user.id, input.subjectId);
      }),
    
    // [ALUNO] Obter evolução temporal do PC em uma disciplina
    getStudentEvolution: studentProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getStudentCTEvolution(ctx.studentSession.studentId, input.subjectId);
      }),
  }),

  // ==================== GAMIFICAÇÃO POR DISCIPLINA ====================
  subjectGamification: router({
    // Obter estatísticas do aluno em uma disciplina
    getStats: studentProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getStudentSubjectStats(ctx.studentSession.studentId, input.subjectId);
      }),

    // Obter todas as disciplinas com pontos do aluno
    getMySubjects: studentProcedure
      .query(async ({ ctx }) => {
        return await db.getStudentSubjectsWithPoints(ctx.studentSession.studentId);
      }),

    // Obter ranking de uma disciplina
    getRanking: protectedProcedure
      .input(z.object({ 
        subjectId: z.number(),
        limit: z.number().default(10)
      }))
      .query(async ({ input }) => {
        return await db.getSubjectRanking(input.subjectId, input.limit);
      }),

    // Obter histórico de pontos em uma disciplina
    getHistory: studentProcedure
      .input(z.object({ 
        subjectId: z.number(),
        limit: z.number().default(20)
      }))
      .query(async ({ ctx, input }) => {
        return await db.getSubjectPointsHistory(ctx.studentSession.studentId, input.subjectId, input.limit);
      }),

    // Adicionar pontos manualmente (professor)
    addPoints: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        subjectId: z.number(),
        points: z.number(),
        description: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.addSubjectPoints(
          input.studentId,
          input.subjectId,
          input.points,
          "manual",
          null,
          input.description
        );
      }),

    // Criar badges padrão para uma disciplina
    createDefaultBadges: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .mutation(async ({ input }) => {
        await db.createDefaultSubjectBadges(input.subjectId);
        return { success: true };
      }),
  }),

  // ==================== EXERCÍCIOS PARA ALUNOS ====================
  studentExercises: router({
    // Listar exercícios disponíveis
    listAvailable: studentProcedure
      .input(z.object({ subjectId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });
        
        const exercises = await db.listAvailableExercises(studentId, input.subjectId);
        return exercises;
      }),
    
    // Alias para listAvailable (compatibilidade)
    listBySubject: studentProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });
        
        const exercises = await db.listAvailableExercises(studentId, input.subjectId);
        return exercises;
      }),

    // Listar exercícios por módulo
    listByModule: studentProcedure
      .input(z.object({ moduleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });
        
        const exercises = await db.listExercisesByModule(studentId, input.moduleId);
        return exercises;
      }),

    // Obter detalhes de um exercício
    getDetails: studentProcedure
      .input(z.object({ exerciseId: z.number() }))
      .query(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });
        
        const exercise = await db.getExerciseDetails(input.exerciseId, studentId);
        if (!exercise) throw new TRPCError({ code: "NOT_FOUND", message: "Exercise not found" });
        
        return exercise;
      }),

    // Iniciar tentativa
    startAttempt: studentProcedure
      .input(z.object({ exerciseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });
        
        const result = await db.startExerciseAttempt(input.exerciseId, studentId);
        return result;
      }),

    // Submeter tentativa completa
    submitAttempt: studentProcedure
      .input(z.object({
        attemptId: z.number(),
        exerciseId: z.number(),
        answers: z.array(z.object({
          questionNumber: z.number(),
          answer: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });
        
        // Buscar dados do exercício
        const exercise = await db.getExerciseDetails(input.exerciseId, studentId);
        if (!exercise) throw new TRPCError({ code: "NOT_FOUND", message: "Exercise not found" });
        
        // Submeter e corrigir
        const result = await db.submitExerciseAttempt(
          input.attemptId,
          input.answers,
          exercise.exerciseData
        );
        
        // Adicionar pontos de gamificação
        if (result.pointsEarned > 0) {
          await db.addExercisePoints(
            studentId,
            exercise.subjectId,
            result.pointsEarned,
            `Exercício: ${exercise.title} (${result.correctAnswers}/${result.totalQuestions} acertos)`
          );
        }
        
        return result;
      }),

    // Ver resultados de uma tentativa
    getResults: studentProcedure
      .input(z.object({ attemptId: z.number() }))
      .query(async ({ ctx, input }) => {
        const results = await db.getExerciseResults(input.attemptId);
        if (!results) throw new TRPCError({ code: "NOT_FOUND", message: "Results not found" });
        
        return results;
      }),

    // Histórico de tentativas
    getHistory: studentProcedure
      .input(z.object({ subjectId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });
        
        const history = await db.getStudentExerciseHistory(studentId, input.subjectId);
        return history;
      }),
  }),

  // Rotas do professor para gerenciar exercícios
  teacherExercises: router({
    // Publicar exercício gerado para os alunos
    publish: protectedProcedure
      .input(z.object({
        moduleId: z.number(),
        subjectId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        exerciseData: z.any(), // JSON com as questões
        totalQuestions: z.number(),
        totalPoints: z.number(),
        passingScore: z.number().default(60),
        maxAttempts: z.number().default(3),
        timeLimit: z.number().optional(),
        showAnswersAfter: z.boolean().default(true),
        availableFrom: z.date(),
        availableTo: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createStudentExercise({
          ...input,
          teacherId: ctx.user.id,
          status: "published",
        });
        
        return { success: true, exerciseId: result[0].insertId };
      }),

    // Listar exercícios criados pelo professor
    list: protectedProcedure
      .input(z.object({ subjectId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const db_instance = await db.getDb();
        if (!db_instance) throw new Error("Database not available");
        
        const { studentExercises } = await import("../drizzle/schema");
        
        const conditions = [eq(studentExercises.teacherId, ctx.user.id)];
        
        if (input.subjectId) {
          conditions.push(eq(studentExercises.subjectId, input.subjectId));
        }
        
        const exercises = await db_instance
          .select()
          .from(studentExercises)
          .where(and(...conditions));
        
        return exercises;
      }),

    // Alias para compatibilidade
    listBySubject: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db_instance = await db.getDb();
        if (!db_instance) throw new Error("Database not available");
        
        const { studentExercises } = await import("../drizzle/schema");
        
        const exercises = await db_instance
          .select()
          .from(studentExercises)
          .where(
            and(
              eq(studentExercises.teacherId, ctx.user.id),
              eq(studentExercises.subjectId, input.subjectId)
            )
          );
        
        return exercises;
      }),

    // Deletar exercício criado pelo professor
    delete: protectedProcedure
      .input(z.object({ exerciseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db_instance = await db.getDb();
        if (!db_instance) throw new Error("Database not available");
        
        const { studentExercises, studentExerciseAttempts, studentExerciseAnswers } = await import("../drizzle/schema");
        
        // Verificar se o exercício pertence ao professor
        const exercise = await db_instance
          .select()
          .from(studentExercises)
          .where(
            and(
              eq(studentExercises.id, input.exerciseId),
              eq(studentExercises.teacherId, ctx.user.id)
            )
          )
          .limit(1);
        
        if (!exercise[0]) {
          throw new Error("Exercício não encontrado ou você não tem permissão para deletá-lo");
        }
        
        // Buscar todas as tentativas relacionadas ao exercício
        const attempts = await db_instance
          .select()
          .from(studentExerciseAttempts)
          .where(eq(studentExerciseAttempts.exerciseId, input.exerciseId));
        
        // Deletar respostas de cada tentativa
        for (const attempt of attempts) {
          await db_instance
            .delete(studentExerciseAnswers)
            .where(eq(studentExerciseAnswers.attemptId, attempt.id));
        }
        
        // Deletar tentativas
        await db_instance
          .delete(studentExerciseAttempts)
          .where(eq(studentExerciseAttempts.exerciseId, input.exerciseId));
        
        // Deletar exercício
        await db_instance
          .delete(studentExercises)
          .where(eq(studentExercises.id, input.exerciseId));
        
        return { success: true };
      }),

    // Listar respostas que precisam de revisão manual
    getPendingReviews: protectedProcedure
      .query(async ({ ctx }) => {
        const { getPendingReviewAnswers } = await import("./db-review-answers");
        const pendingReviews = await getPendingReviewAnswers(ctx.user.id);
        return pendingReviews;
      }),

    // Contar respostas pendentes de revisão
    countPendingReviews: protectedProcedure
      .query(async ({ ctx }) => {
        const { countPendingReviews } = await import("./db-review-answers");
        const count = await countPendingReviews(ctx.user.id);
        return { count };
      }),

    // Revisar e ajustar nota de uma resposta aberta
    reviewAnswer: protectedProcedure
      .input(z.object({
        answerId: z.number(),
        finalScore: z.number().min(0).max(100),
        teacherFeedback: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { reviewAnswer } = await import("./db-review-answers");
        const result = await reviewAnswer(
          input.answerId,
          ctx.user.id,
          input.finalScore,
          input.teacherFeedback
        );
        return result;
      }),

    // Buscar detalhes de uma resposta específica
    getAnswerDetails: protectedProcedure
      .input(z.object({ answerId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getAnswerDetails } = await import("./db-review-answers");
        const answer = await getAnswerDetails(input.answerId);
        return answer;
      }),
  }),

  // ==================== SISTEMA DE REVISÃO INTELIGENTE ====================
  studentReview: router({
    // Listar questões erradas com filtros
    getWrongAnswers: studentProcedure
      .input(
        z.object({
          subjectId: z.number().optional(),
          moduleId: z.number().optional(),
          questionType: z.string().optional(),
          limit: z.number().optional().default(50),
        })
      )
      .query(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });

        const wrongAnswers = await db.getWrongAnswers(studentId, input);
        return wrongAnswers;
      }),

    // Obter dicas de estudo personalizadas para uma questão
    getStudyTips: studentProcedure
      .input(
        z.object({
          answerId: z.number(),
          questionText: z.string(),
          studentAnswer: z.string(),
          correctAnswer: z.string(),
          questionType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });

        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Você é um tutor educacional especializado em criar dicas de estudo personalizadas.
Seu objetivo é ajudar o aluno a entender onde errou e como melhorar.
Seja empático, construtivo e específico nas suas orientações.`,
              },
              {
                role: "user",
                content: `Analise o erro do aluno e forneça dicas de estudo personalizadas:

Questão: ${input.questionText}

Resposta correta: ${input.correctAnswer}

Resposta do aluno: ${input.studentAnswer}

Tipo de questão: ${input.questionType}

Forneça:
1. Uma explicação clara do conceito que o aluno precisa revisar
2. Dicas específicas de estudo (3-5 dicas práticas)
3. Sugestões de materiais complementares (tipos de recursos: vídeos, artigos, exercícios)
4. Uma estratégia de revisão recomendada

Seja específico e prático. Foque em ajudar o aluno a realmente entender o conceito.`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "study_tips",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    conceptExplanation: {
                      type: "string",
                      description: "Explicação clara do conceito que precisa ser revisado",
                    },
                    studyTips: {
                      type: "array",
                      description: "Lista de 3-5 dicas práticas de estudo",
                      items: { type: "string" },
                    },
                    suggestedMaterials: {
                      type: "array",
                      description: "Sugestões de materiais complementares",
                      items: {
                        type: "object",
                        properties: {
                          type: {
                            type: "string",
                            description: "Tipo de material (vídeo, artigo, exercício, etc)",
                          },
                          description: { type: "string", description: "Descrição do material" },
                        },
                        required: ["type", "description"],
                        additionalProperties: false,
                      },
                    },
                    reviewStrategy: {
                      type: "string",
                      description: "Estratégia de revisão recomendada",
                    },
                  },
                  required: ["conceptExplanation", "studyTips", "suggestedMaterials", "reviewStrategy"],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = response.choices[0]?.message?.content;
          if (!content || typeof content !== "string") {
            throw new Error("Resposta vazia da IA");
          }

          const result = JSON.parse(content);
          return result;
        } catch (error) {
          console.error("[Review] Error generating study tips:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao gerar dicas de estudo. Tente novamente.",
          });
        }
      }),

    // Obter análise de padrões de erro
    getErrorPatterns: studentProcedure
      .input(z.object({ subjectId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });

        const patterns = await db.analyzeErrorPatterns(studentId, input.subjectId);
        return patterns;
      }),

    // Marcar questão como revisada
    markAsReviewed: studentProcedure
      .input(z.object({ answerId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });

        const success = await db.markQuestionAsReviewed(input.answerId);
        return { success };
      }),

    // Criar sessão de revisão
    createSession: studentProcedure
      .input(
        z.object({
          subjectId: z.number().optional(),
          moduleId: z.number().optional(),
          totalQuestionsReviewed: z.number(),
          sessionDuration: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });

        const sessionId = await db.createReviewSession({
          studentId,
          ...input,
        });

        return { sessionId };
      }),

    // Obter estatísticas de revisão
    getStats: studentProcedure
      .input(z.object({ subjectId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });

        const stats = await db.getReviewStats(studentId, input.subjectId);
        return stats;
      }),
  }),

  // ==================== STUDENT AVATAR CUSTOMIZATION ====================
  studentAvatar: router({
    // Obter avatar do aluno logado
    getMyAvatar: studentProcedure
      .query(async ({ ctx }) => {
        const avatar = await db.getStudentAvatarByStudentId(ctx.studentSession.studentId);
        if (!avatar) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Avatar não encontrado',
          });
        }
        return avatar;
      }),
    
    // Atualizar avatar do aluno logado
    updateMyAvatar: studentProcedure
      .input(z.object({
        avatarSkinTone: z.string().optional(),
        avatarKimonoColor: z.string().optional(),
        avatarHairStyle: z.string().optional(),
        avatarHairColor: z.string().optional(),
        avatarKimonoStyle: z.string().optional(),
        avatarHeadAccessory: z.string().optional(),
        avatarExpression: z.string().optional(),
        avatarPose: z.string().optional(),
        avatarAccessories: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const updated = await db.updateStudentAvatar(ctx.studentSession.studentId, input);
        if (!updated) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao atualizar avatar',
          });
        }
        return updated;
      }),
  }),

  // ==================== LOJA DE ITENS ====================
  shop: router({
    // Listar itens da loja
    getItems: studentProcedure
      .input(z.object({
        category: z.string().optional(),
        requiredBelt: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const items = await db.getShopItems(input);
        return items;
      }),

    // Buscar item específico
    getItem: studentProcedure
      .input(z.object({ itemId: z.number() }))
      .query(async ({ input }) => {
        const item = await db.getShopItemById(input.itemId);
        if (!item) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Item não encontrado',
          });
        }
        return item;
      }),

    // Comprar item
    purchase: studentProcedure
      .input(z.object({ itemId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.purchaseShopItem(ctx.studentSession.studentId, input.itemId);
        if (!result.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.message,
          });
        }
        return result;
      }),

    // Listar meus itens comprados
    getMyItems: studentProcedure
      .query(async ({ ctx }) => {
        return db.getStudentPurchasedItems(ctx.studentSession.studentId);
      }),

    // Listar itens equipados
    getEquippedItems: studentProcedure
      .query(async ({ ctx }) => {
        return db.getStudentEquippedItems(ctx.studentSession.studentId);
      }),

    // Equipar item
    equip: studentProcedure
      .input(z.object({ itemId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.equipItem(ctx.studentSession.studentId, input.itemId);
        if (!result.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.message,
          });
        }
        return result;
      }),

    // Desequipar item
    unequip: studentProcedure
      .input(z.object({ slot: z.enum(['hat', 'glasses', 'accessory', 'background']) }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.unequipItem(ctx.studentSession.studentId, input.slot);
        if (!result.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.message,
          });
        }
        return result;
      }),

    // Verificar se possui item
    ownsItem: studentProcedure
      .input(z.object({ itemId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.studentOwnsItem(ctx.studentSession.studentId, input.itemId);
      }),

    // Seed inicial de itens (admin)
    seedItems: protectedProcedure
      .mutation(async () => {
        await db.seedShopItems();
        return { success: true, message: 'Itens da loja criados com sucesso!' };
      }),

    // Admin: Criar item
    createItem: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(['hat', 'glasses', 'accessory', 'background', 'special']),
        price: z.number().min(1),
        imageUrl: z.string().optional(),
        svgData: z.string().optional(),
        requiredBelt: z.string().optional(),
        isRare: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createShopItem(input as any);
        return { success: true };
      }),

    // Admin: Atualizar item
    updateItem: protectedProcedure
      .input(z.object({
        itemId: z.number(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          category: z.enum(['hat', 'glasses', 'accessory', 'background', 'special']).optional(),
          price: z.number().optional(),
          imageUrl: z.string().optional(),
          svgData: z.string().optional(),
          requiredBelt: z.string().optional(),
          isActive: z.boolean().optional(),
          isRare: z.boolean().optional(),
          sortOrder: z.number().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.updateShopItem(input.itemId, input.data as any);
        return { success: true };
      }),

    // Admin: Deletar item
    deleteItem: protectedProcedure
      .input(z.object({ itemId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteShopItem(input.itemId);
        return { success: true };
      }),

    // Admin: Listar todos os itens (incluindo inativos)
    getAllItems: protectedProcedure
      .query(async () => {
        const dbInstance = await db.getDb();
        if (!dbInstance) return [];
        const { shopItems } = await import('../drizzle/schema');
        return dbInstance.select().from(shopItems).orderBy(shopItems.sortOrder);
      }),
  }),
});

export type AppRouter = typeof appRouter;
// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Analisar resposta de exercício de PC usando IA
 */
async function analyzeCTAnswer(params: {
  dimension: string;
  question: string;
  answer: string;
  expectedAnswer: string;
}) {
  const { dimension, question, answer, expectedAnswer } = params;

  // Mapear dimensões para português
  const dimensionNames: Record<string, string> = {
    decomposition: 'Decomposição',
    pattern_recognition: 'Reconhecimento de Padrões',
    abstraction: 'Abstração',
    algorithms: 'Algoritmos',
  };

  const dimensionName = dimensionNames[dimension] || dimension;

  // Prompt específico para cada dimensão
  const prompts: Record<string, string> = {
    decomposition: `Você está avaliando a habilidade de DECOMPOSIÇÃO (dividir problemas complexos em partes menores).

Questão: ${question}

Resposta esperada: ${expectedAnswer}

Resposta do aluno: ${answer}

Avalie a resposta considerando:
1. O aluno conseguiu identificar as partes principais do problema?
2. A divisão proposta é lógica e facilita a resolução?
3. As partes são independentes e bem definidas?

Retorne um JSON com:
- score: número de 0 a 100
- feedback: texto explicativo (máximo 200 caracteres)`,

    pattern_recognition: `Você está avaliando a habilidade de RECONHECIMENTO DE PADRÕES.

Questão: ${question}

Resposta esperada: ${expectedAnswer}

Resposta do aluno: ${answer}

Avalie a resposta considerando:
1. O aluno identificou padrões ou repetições?
2. Os padrões identificados são relevantes?
3. A explicação é clara?

Retorne um JSON com:
- score: número de 0 a 100
- feedback: texto explicativo (máximo 200 caracteres)`,

    abstraction: `Você está avaliando a habilidade de ABSTRAÇÃO (focar no essencial, ignorar detalhes irrelevantes).

Questão: ${question}

Resposta esperada: ${expectedAnswer}

Resposta do aluno: ${answer}

Avalie a resposta considerando:
1. O aluno focou nos aspectos essenciais?
2. Detalhes irrelevantes foram ignorados?
3. A abstração facilita o entendimento?

Retorne um JSON com:
- score: número de 0 a 100
- feedback: texto explicativo (máximo 200 caracteres)`,

    algorithms: `Você está avaliando a habilidade de criar ALGORITMOS (sequência lógica de passos).

Questão: ${question}

Resposta esperada: ${expectedAnswer}

Resposta do aluno: ${answer}

Avalie a resposta considerando:
1. Os passos estão em ordem lógica?
2. A sequência é completa e resolve o problema?
3. Os passos são claros e executáveis?

Retorne um JSON com:
- score: número de 0 a 100
- feedback: texto explicativo (máximo 200 caracteres)`,
  };

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'Você é um avaliador de Pensamento Computacional. Seja justo e construtivo.' },
        { role: 'user', content: prompts[dimension] || prompts.decomposition },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'ct_evaluation',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              score: { type: 'integer', description: 'Pontuação de 0 a 100' },
              feedback: { type: 'string', description: 'Feedback construtivo' },
            },
            required: ['score', 'feedback'],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('Resposta vazia da IA');
    }

    const result = JSON.parse(content);
    return {
      score: Math.min(100, Math.max(0, result.score)),
      feedback: result.feedback,
    };
  } catch (error) {
    console.error('[CT Analysis] Error analyzing answer:', error);
    // Fallback: pontuação baseada em comprimento da resposta
    const score = Math.min(100, Math.max(20, answer.length * 2));
    return {
      score,
      feedback: 'Resposta recebida. Continue praticando!',
    };
  }
}

