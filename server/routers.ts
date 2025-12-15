import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, studentProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { tasks } from "../drizzle/schema";
import { and, eq, sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";

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
        registrationNumber: z.string().min(1),
        password: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        // Buscar aluno pela matrícula
        const student = await db.getStudentByRegistration(input.registrationNumber);
        
        if (!student) {
          throw new Error("Matrícula não encontrada");
        }
        
        // Validar senha (senha = matrícula)
        if (input.password !== student.registrationNumber) {
          throw new Error("Senha incorreta");
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
  }),

  // Student Portal Routes
  student: router({
    getEnrolledSubjects: studentProcedure
      .query(async ({ ctx }) => {
        const enrollments = await db.getStudentEnrollments(ctx.studentSession.studentId);
        const subjectsWithDetails = await Promise.all(
          enrollments.map(async (enrollment) => {
            const subject = await db.getSubjectById(enrollment.subjectId, enrollment.professorId);
            const professor = await db.getUserById(enrollment.professorId);
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
    
    getTopicMaterials: protectedProcedure
      .input(z.object({ topicId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getTopicMaterials(input.topicId);
      }),
    
    getTopicAssignments: protectedProcedure
      .input(z.object({ topicId: z.number() }))
      .query(async ({ ctx, input }) => {
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
        const enrollments = await db.getEnrollmentsBySubject(input.subjectId, ctx.user.id);
        const enrollmentsWithStudents = await Promise.all(
          enrollments.map(async (enrollment) => {
            const student = await db.getUserById(enrollment.studentId);
            return {
              ...enrollment,
              student,
            };
          })
        );
        return enrollmentsWithStudents;
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
                        children: [new Paragraph({ text: "Matrícula", bold: true })],
                        shading: { fill: "4472C4" },
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: "Nome Completo", bold: true })],
                        shading: { fill: "4472C4" },
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: "Data de Cadastro", bold: true })],
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
                        new TableCell({ children: [new Paragraph(new Date(student.createdAt).toLocaleDateString('pt-BR'))] }),
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
        return await db.createAnnouncement({
          ...input,
          userId: ctx.user.id,
        });
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

});

export type AppRouter = typeof appRouter;
