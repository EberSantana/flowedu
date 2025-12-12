import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { tasks } from "../drizzle/schema";
import { and, eq, sql } from "drizzle-orm";

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

Conteúdo:
${pathDescription}`;
        
        const result = await generateImage({ prompt });
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
  }),

});

export type AppRouter = typeof appRouter;
