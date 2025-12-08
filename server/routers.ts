import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

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
  }),

  subjects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getSubjectsByUserId(ctx.user.id);
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

      const today = new Date();
      const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      
      // Calcular próximas ocorrências das aulas (próximos 14 dias)
      const upcomingClasses = [];
      
      for (let i = 0; i < 14; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
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
            });
          }
        }
      }
      
      // Ordenar por data e horário
      upcomingClasses.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      });
      
      return upcomingClasses.slice(0, 10);
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
  }),

  user: router({    updateProfile: protectedProcedure
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

  }),


});

export type AppRouter = typeof appRouter;
