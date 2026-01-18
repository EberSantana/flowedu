import { COOKIE_NAME, STUDENT_COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, studentProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import bcrypt from "bcryptjs";
import { tasks, studentExerciseAnswers, subjects } from "../drizzle/schema";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { createSessionToken as createStandaloneSession } from "./_core/auth-standalone";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import { sendPasswordResetEmail } from "./_core/email";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    // Rota específica para verificar sessão de aluno
    studentSession: publicProcedure.query(opts => opts.ctx.studentSession),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      // Também limpar cookie de aluno ao fazer logout completo
      ctx.res.clearCookie(STUDENT_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    
    // Sair do modo aluno e voltar ao modo professor
    exitStudentMode: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      // Apenas limpar cookie de aluno, mantendo sessão de professor
      ctx.res.clearCookie(STUDENT_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
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
          
          // Configurar cookie de sessão DE ALUNO (cookie separado)
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(STUDENT_COOKIE_NAME, token, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
          });
          
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

        // Criar professor com status pendente (sempre aguarda aprovação do admin)
        const result = await db.createTeacherWithPassword({
          name: input.name,
          email: input.email,
          passwordHash,
        });

        if (!result) {
          throw new Error("Erro ao criar conta. Tente novamente.");
        }

        // Todos os cadastros agora ficam pendentes de aprovação
        return {
          success: true,
          pending: true,
          message: "Sua solicitação de cadastro foi enviada e está aguardando aprovação do administrador.",
        };
      }),

    // Login de Professor com E-mail/Senha
    loginTeacher: publicProcedure
      .input(z.object({
        email: z.string().email("E-mail inválido"),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Sanitizar e normalizar e-mail
        const normalizedEmail = input.email.trim().toLowerCase();
        
        // Rate limiting baseado em IP (em memória - para produção usar Redis)
        const clientIP = ctx.req.headers['x-forwarded-for'] || ctx.req.socket.remoteAddress || 'unknown';
        const ipKey = `login_attempts_${clientIP}`;
        const emailKey = `login_attempts_email_${normalizedEmail}`;
        
        // Verificar tentativas por IP (global)
        const ipAttempts = (global as any)[ipKey] || { count: 0, lastAttempt: 0 };
        const now = Date.now();
        
        // Reset após 15 minutos de inatividade
        if (now - ipAttempts.lastAttempt > 15 * 60 * 1000) {
          ipAttempts.count = 0;
        }
        
        // Bloquear após 10 tentativas por IP
        if (ipAttempts.count >= 10) {
          const timeRemaining = Math.ceil((15 * 60 * 1000 - (now - ipAttempts.lastAttempt)) / 1000 / 60);
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Muitas tentativas de login. Aguarde ${timeRemaining} minutos.`,
          });
        }
        
        // Buscar usuário pelo e-mail
        const user = await db.getUserByEmail(normalizedEmail);
        
        // Mensagem genérica para evitar enumeração de usuários
        const genericError = "Credenciais inválidas. Verifique seu e-mail e senha.";
        
        if (!user) {
          // Incrementar tentativas mesmo para usuário inexistente
          ipAttempts.count++;
          ipAttempts.lastAttempt = now;
          (global as any)[ipKey] = ipAttempts;
          
          // Delay artificial para prevenir timing attacks
          await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
          throw new Error(genericError);
        }

        // Verificar se usuário está ativo
        if (!user.active) {
          throw new Error("Conta desativada. Entre em contato com o administrador.");
        }

        // Verificar senha
        if (!user.passwordHash) {
          throw new Error("Esta conta usa login social. Use o botão 'Entrar com Google'.");
        }

        const validPassword = await bcrypt.compare(input.password, user.passwordHash);
        if (!validPassword) {
          // Incrementar tentativas
          ipAttempts.count++;
          ipAttempts.lastAttempt = now;
          (global as any)[ipKey] = ipAttempts;
          
          // Delay artificial para prevenir timing attacks
          await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
          throw new Error(genericError);
        }
        
        // Login bem-sucedido - resetar contadores
        (global as any)[ipKey] = { count: 0, lastAttempt: 0 };
        (global as any)[emailKey] = { count: 0, lastAttempt: 0 };

        // Atualizar último login
        await db.upsertUser({
          openId: user.openId,
          lastSignedIn: new Date(),
        });

        // Criar sessão JWT standalone (sem dependência do OAuth Manus)
        const token = await createStandaloneSession(user, {
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

        // Enviar e-mail com link de recuperação
        if (user.email) {
          await sendPasswordResetEmail(user.email, token, user.name || undefined);
        }

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

    // Alterar senha própria (usuário logado)
    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string().min(1, "Senha atual é obrigatória"),
        newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
        confirmPassword: z.string().min(6, "Confirmação de senha deve ter pelo menos 6 caracteres"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Validar se as senhas novas coincidem
        if (input.newPassword !== input.confirmPassword) {
          throw new Error("As senhas não coincidem");
        }

        // Validar se a nova senha é diferente da atual
        if (input.currentPassword === input.newPassword) {
          throw new Error("A nova senha deve ser diferente da senha atual");
        }

        // Buscar usuário
        const users = await db.getAllUsers();
        const user = users.find(u => u.id === ctx.user.id);

        if (!user || !user.passwordHash) {
          throw new Error("Usuário não encontrado ou não possui senha definida");
        }

        // Validar senha atual
        const passwordMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!passwordMatch) {
          throw new Error("Senha atual incorreta");
        }

        // Hash da nova senha
        const newPasswordHash = await bcrypt.hash(input.newPassword, 10);

        // Atualizar senha
        const updated = await db.updateUserPassword(ctx.user.id, newPasswordHash);
        
        if (!updated) {
          throw new Error("Erro ao atualizar senha");
        }

        return { success: true, message: "Senha alterada com sucesso!" };
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
    
    // Contar avisos por disciplina
    getAnnouncementCounts: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getAnnouncementCountsBySubject(ctx.user.id);
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
        // Validar formato de horário (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(input.startTime) || !timeRegex.test(input.endTime)) {
          throw new Error("Formato de horário inválido. Use HH:MM (ex: 08:00)");
        }
        
        // Validar que startTime < endTime
        const [startHour, startMin] = input.startTime.split(':').map(Number);
        const [endHour, endMin] = input.endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        if (startMinutes >= endMinutes) {
          throw new Error("Horário de início deve ser anterior ao horário de término");
        }
        
        // Verificar sobreposição com outros horários do mesmo turno
        const hasOverlap = await db.checkTimeSlotOverlap(
          input.shiftId,
          input.startTime,
          input.endTime,
          ctx.user.id
        );
        
        if (hasOverlap) {
          throw new Error("Este horário se sobrepõe a outro horário já cadastrado neste turno");
        }
        
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
        
        // Se está atualizando horários, validar
        if (data.startTime || data.endTime) {
          // Buscar horário atual
          const current = await db.getTimeSlotById(id, ctx.user.id);
          if (!current) {
            throw new Error("Horário não encontrado");
          }
          
          const startTime = data.startTime || current.startTime;
          const endTime = data.endTime || current.endTime;
          const shiftId = data.shiftId || current.shiftId;
          
          // Validar formato
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            throw new Error("Formato de horário inválido. Use HH:MM (ex: 08:00)");
          }
          
          // Validar que startTime < endTime
          const [startHour, startMin] = startTime.split(':').map(Number);
          const [endHour, endMin] = endTime.split(':').map(Number);
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          
          if (startMinutes >= endMinutes) {
            throw new Error("Horário de início deve ser anterior ao horário de término");
          }
          
          // Verificar sobreposição (excluindo o próprio registro)
          const hasOverlap = await db.checkTimeSlotOverlap(
            shiftId,
            startTime,
            endTime,
            ctx.user.id,
            id
          );
          
          if (hasOverlap) {
            throw new Error("Este horário se sobrepõe a outro horário já cadastrado neste turno");
          }
        }
        
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
    
    // Preferências de Ações Rápidas
    getQuickActionsPreferences: protectedProcedure.query(async ({ ctx }) => {
      return await db.getQuickActionsPreferences(ctx.user.id);
    }),
    
    saveQuickActionsPreferences: protectedProcedure
      .input(z.object({
        actions: z.array(z.object({
          id: z.string(),
          label: z.string(),
          icon: z.string(),
          href: z.string(),
          color: z.string(),
          enabled: z.boolean(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.saveQuickActionsPreferences(ctx.user.id, input.actions);
        return { success: true };
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

    // Cadastro manual de usuários (com senha definida pelo admin)
    createUser: protectedProcedure
      .input(z.object({
        name: z.string().min(1, 'Nome é obrigatório'),
        email: z.string().email('E-mail inválido'),
        password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
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

        // Gerar openId temporário
        const crypto = await import('crypto');
        const tempOpenId = `manual-${crypto.randomBytes(16).toString('hex')}`;
        
        // Hash da senha
        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.hash(input.password, 10);
        
        // Criar usuário com senha já definida
        await db.upsertUser({
          openId: tempOpenId,
          name: input.name,
          email: input.email,
          role: input.role,
          loginMethod: 'email',
          lastSignedIn: new Date(),
        });

        // Buscar usuário criado
        const users = await db.getAllUsers();
        const newUser = users.find(u => u.email === input.email);

        if (!newUser) {
          throw new Error('Erro ao criar usuário');
        }

        // Atualizar senha do usuário
        await db.updateUserPassword(newUser.id, passwordHash);

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
          user: newUser
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
        exerciseType: z.enum(['objective', 'subjective', 'case_study', 'pbl', 'mixed']),
        questionCount: z.number().min(1).max(20).default(5),
      }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Buscar dados do módulo
        const module = await db.getLearningModuleById(input.moduleId, ctx.user.id);
        if (!module) throw new Error('Módulo não encontrado');
        
        // Buscar tópicos do módulo com descrições completas
        const topics = await db.getLearningTopicsByModule(input.moduleId, ctx.user.id);
        const topicsList = topics?.map((t: any) => t.title).join(', ') || 'Não informados';
        
        // Criar contexto detalhado com descrições dos tópicos para a IA
        const topicsDetailed = topics?.map((t: any) => {
          const desc = t.description ? `: ${t.description}` : '';
          return `- ${t.title}${desc}`;
        }).join('\n') || 'Não informados';
        
        const exerciseTypeLabels = {
          objective: 'questões objetivas (múltipla escolha com 4 alternativas)',
          subjective: 'questões dissertativas reflexivas',
          case_study: 'estudos de caso práticos contextualizados',
          pbl: 'problemas complexos no modelo PBL (Problem-Based Learning - Aprendizagem Baseada em Problemas)',
          mixed: 'misto (objetivas, subjetivas reflexivas, estudos de caso e PBL)'
        };
        
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `Você é um professor especialista em pedagogia ativa e metodologias inovadoras (PBL, ABP, Aprendizagem Baseada em Problemas). 
Crie exercícios desafiadores, contextualizados e que estimulem o pensamento crítico.
Para estudos de caso, use o modelo PBL com problemas complexos, autênticos e multidimensionais.
Gere exercícios em português brasileiro. Retorne APENAS um JSON válido.`
            },
            {
              role: 'user',
              content: `Crie ${input.questionCount} exercícios do tipo ${exerciseTypeLabels[input.exerciseType]} para o módulo:

Título: ${module.title}
Descrição: ${module.description || 'Não informada'}

TÓPICOS DO MÓDULO (use este conteúdo como base para criar perguntas contextualizadas):
${topicsDetailed}

📌 IMPORTANTE: Use o conteúdo dos tópicos acima para criar perguntas ESPECÍFICAS sobre o conteúdo real do módulo.

⚠️ REGRAS OBRIGATÓRIAS PARA ESTUDOS DE CASO E PBL:

1. NUNCA crie perguntas genéricas como "Responda às perguntas do Estudo de Caso X" ou "Análise de Estoque"
2. SEMPRE inclua o contexto COMPLETO no campo "caseContext" com pelo menos 3 parágrafos
3. SEMPRE inclua dados CONCRETOS: números, nomes, datas, valores, percentuais
4. A pergunta no campo "question" deve ser ESPECÍFICA e diretamente relacionada ao contexto
5. Se usar "caseQuestions", cada sub-pergunta deve ser DETALHADA e CLARA

📝 EXEMPLO DE ESTUDO DE CASO BEM FEITO:

{
  "type": "case_study",
  "caseContext": "A empresa TechSolutions, com 150 funcionários, enfrenta uma crise de produtividade. Nos últimos 6 meses, o tempo médio de entrega de projetos aumentou de 45 para 78 dias, causando a perda de 3 clientes importantes (representação de 22% da receita anual). A equipe de desenvolvimento reclama de reuniões excessivas (média de 4h/dia), enquanto a gerência alega falta de comunicação entre departamentos. O CEO Maria Silva precisa decidir entre: (a) contratar um consultor externo por R$ 80.000, (b) implementar nova metodologia ágil internamente, ou (c) reestruturar as equipes. O orçamento disponível é de R$ 120.000 e a decisão deve ser tomada em 30 dias.",
  "question": "Baseado no cenário apresentado, qual estratégia você recomendaria para Maria Silva e por quê? Justifique sua resposta considerando custos, prazos e impacto organizacional.",
  "correctAnswer": "Resposta esperada: Análise comparativa das 3 opções considerando: (1) Custo-benefício, (2) Tempo de implementação, (3) Sustentabilidade da solução, (4) Impacto na cultura organizacional. Qualquer opção é válida se bem justificada.",
  "explanation": "Este caso exige análise de trade-offs. Opção A oferece expertise rápida mas dependência externa. Opção B desenvolve capacidade interna mas requer tempo. Opção C pode resolver comunicação mas gera resistência. Avalia-se: pensamento estratégico, análise de dados, consideração de múltiplas variáveis."
}

❌ EXEMPLO DE PERGUNTA RUIM (NUNCA FAÇA ISSO):
{
  "type": "case_study",
  "question": "Análise de Estoque",
  "caseContext": "",  // ERRO: Sem contexto!
  "correctAnswer": "Resposta sobre estoque"  // ERRO: Genérico!
}

=== DIRETRIZES POR TIPO ===

**QUESTÕES OBJETIVAS:**
- Contextualize a pergunta (evite questões soltas)
- 4 alternativas com distratores plausíveis
- Teste compreensão conceitual, não decoração
- correctAnswer: "A) [texto completo da alternativa correta]"

**QUESTÕES SUBJETIVAS:**
- Exija análise, comparação, avaliação ou síntese
- Evite perguntas que começam com "O que é..."
- Prefira: "Analise...", "Compare...", "Avalie...", "Justifique..."
- correctAnswer: Resposta modelo com estrutura esperada
- explanation: Critérios de avaliação claros

**ESTUDOS DE CASO / PBL:**
- caseContext: MÍNIMO 200 palavras com dados concretos
- Inclua: personagens, números, dilemas, restrições
- question: Pergunta específica que exige decisão/análise
- Se usar caseQuestions: 3-5 perguntas progressivas
- correctAnswer: Múltiplas soluções válidas com critérios
- explanation: Aspectos a avaliar na resposta do aluno

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
        
        const result = JSON.parse(content || '{}');
        
        // VALIDAÇÃO: Rejeitar perguntas sem contexto adequado
        if (result.exercises) {
          for (const exercise of result.exercises) {
            // Para estudos de caso e PBL, validar contexto mínimo
            if (exercise.type === 'case_study' || exercise.type === 'pbl') {
              if (!exercise.caseContext || exercise.caseContext.length < 100) {
                throw new Error(
                  `Pergunta ${exercise.number} foi rejeitada: Estudos de caso devem ter pelo menos 100 caracteres de contexto. ` +
                  `Recebido: "${exercise.question}". Por favor, gere novamente com um cenário completo e dados concretos.`
                );
              }
              
              // Validar que a pergunta não é genérica
              const genericPatterns = [
                /^responda.*estudo de caso \d+/i,
                /^análise de \w+$/i,
                /^planejamento de \w+$/i,
                /^estudo de caso \d+$/i
              ];
              
              const isGeneric = genericPatterns.some(pattern => pattern.test(exercise.question));
              if (isGeneric) {
                throw new Error(
                  `Pergunta ${exercise.number} foi rejeitada: "${exercise.question}" é muito genérica. ` +
                  `Crie uma pergunta específica baseada no contexto do caso.`
                );
              }
            }
          }
        }
        
        return result;
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

    // Buscar guia de animação do módulo (para aluno)
    getModuleGuide: publicProcedure
      .input(z.object({ moduleId: z.number() }))
      .query(async ({ input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error("Database not available");
        
        const { learningModules } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        const result = await dbInstance.query.learningModules.findFirst({
          where: (table: any) => eq(table.id, input.moduleId),
        });
        
        if (!result) {
          return null;
        }
        
        return {
          guideTitle: result.guideTitle,
          guideContent: result.guideContent,
          guideType: result.guideType,
        };
      }),

    // Salvar/Atualizar guia de animação (para professor)
    updateModuleGuide: protectedProcedure
      .input(z.object({
        moduleId: z.number(),
        guideTitle: z.string().min(1, "Título do guia é obrigatório"),
        guideContent: z.string().min(1, "Conteúdo do guia é obrigatório"),
        guideType: z.enum(["text", "video", "interactive", "mixed"]).default("text"),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateLearningModule(input.moduleId, {
          guideTitle: input.guideTitle,
          guideContent: input.guideContent,
          guideType: input.guideType,
        }, ctx.user.id);
      }),

    // Deletar guia de animação (para professor)
    deleteModuleGuide: protectedProcedure
      .input(z.object({ moduleId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateLearningModule(input.moduleId, {
          guideTitle: null,
          guideContent: null,
          guideType: "text",
        }, ctx.user.id);
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
      ctx.res.clearCookie(STUDENT_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
    
    // Obter detalhes de uma disciplina específica para o aluno
    getSubjectDetails: studentProcedure
      .input(z.object({ subjectId: z.number(), professorId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verificar se o aluno está matriculado nesta disciplina
        const enrollments = await db.getStudentEnrollments(ctx.studentSession.studentId);
        const enrollment = enrollments.find(e => e.subjectId === input.subjectId);
        
        if (!enrollment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Você não está matriculado nesta disciplina' });
        }
        
        // Buscar disciplina sem verificar userId (aluno pode ver qualquer disciplina em que está matriculado)
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error("Database not available");
        
        const subjectResult = await dbInstance.select().from(subjects).where(
          eq(subjects.id, input.subjectId)
        ).limit(1);
        
        const subject = subjectResult.length > 0 ? subjectResult[0] : null;
        
        if (!subject) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Disciplina não encontrada' });
        }
        
        const professor = await db.getUserById(input.professorId);
        
        return {
          ...subject,
          professor,
          enrollment,
        };
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
            // Buscar progresso da disciplina
            const progress = await db.getSubjectStatistics(
              ctx.studentSession.studentId,
              enrollment.subjectId
            );
            return {
              ...enrollment,
              subject,
              professor,
              progress,
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
    
    // ==================== ENHANCED LEARNING PATHS ====================
    
    // Buscar trilha completa com progresso e pré-requisitos
    getEnhancedLearningPath: studentProcedure
      .input(z.object({ subjectId: z.number(), professorId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getEnhancedLearningPath(
          ctx.studentSession.studentId,
          input.subjectId,
          input.professorId
        );
      }),
    
    // Atualizar progresso do tópico
    updateTopicProgressEnhanced: studentProcedure
      .input(z.object({
        topicId: z.number(),
        status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
        selfAssessment: z.enum(['understood', 'have_doubts', 'need_help']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateStudentTopicProgressEnhanced({
          studentId: ctx.studentSession.studentId,
          ...input,
        });
      }),
    
    // Diário de Aprendizagem
    addJournalEntry: studentProcedure
      .input(z.object({
        topicId: z.number(),
        content: z.string(),
        tags: z.string().optional(),
        mood: z.enum(['great', 'good', 'neutral', 'confused', 'frustrated']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.addJournalEntry({
          studentId: ctx.studentSession.studentId,
          topicId: input.topicId,
          content: input.content,
          tags: input.tags,
          mood: input.mood,
          entryDate: new Date(),
        } as any);
      }),
    
    getJournalEntriesByTopic: studentProcedure
      .input(z.object({ topicId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getJournalEntriesByTopic(
          ctx.studentSession.studentId,
          input.topicId
        );
      }),
    
    getAllJournalEntries: studentProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getAllJournalEntries(
          ctx.studentSession.studentId,
          input.limit || 50
        );
      }),
    
    // Sistema de Dúvidas
    submitDoubt: studentProcedure
      .input(z.object({
        topicId: z.number(),
        professorId: z.number(),
        question: z.string(),
        context: z.string().optional(),
        isPrivate: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.submitDoubt({
          studentId: ctx.studentSession.studentId,
          topicId: input.topicId,
          professorId: input.professorId,
          question: input.question,
          context: input.context,
          isPrivate: input.isPrivate ?? true,
          status: 'pending',
        } as any);
      }),
    
    getMyDoubts: studentProcedure
      .input(z.object({ topicId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getStudentDoubts(
          ctx.studentSession.studentId,
          input.topicId
        );
      }),
    
    // Estatísticas de Estudo
    getStudyStatistics: studentProcedure
      .input(z.object({ subjectId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getStudyStatistics(
          ctx.studentSession.studentId,
          input.subjectId
        );
      }),
    
    // Estatísticas detalhadas por disciplina
    getSubjectStatistics: studentProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getSubjectStatistics(
          ctx.studentSession.studentId,
          input.subjectId
        );
      }),

    // Estatísticas de todas as disciplinas de uma vez (evita hooks em loop)
    getAllSubjectsStatistics: studentProcedure
      .input(z.object({ subjectIds: z.array(z.number()) }))
      .query(async ({ ctx, input }) => {
        const results = await Promise.all(
          input.subjectIds.map(subjectId => 
            db.getSubjectStatistics(ctx.studentSession.studentId, subjectId)
          )
        );
        return results.filter(Boolean);
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
      .input(z.object({ subjectId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (input?.subjectId) {
          return await db.getStudentsBySubject(input.subjectId, ctx.user.id);
        }
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

    // ==================== HD-2D AVATAR SYSTEM ====================
    
    // Obter personagem HD-2D atual do aluno
    getHD2DCharacter: studentProcedure
      .query(async ({ ctx }) => {
        const student = await db.getStudentById(ctx.studentSession.studentId, ctx.studentSession.professorId);
        if (!student) throw new Error("Aluno não encontrado");
        
        return {
          characterId: student.hd2dCharacterId || 1,
          unlockedCharacters: student.hd2dUnlockedCharacters 
            ? JSON.parse(student.hd2dUnlockedCharacters) 
            : [1],
        };
      }),
    
    // Trocar personagem HD-2D
    changeHD2DCharacter: studentProcedure
      .input(z.object({ characterId: z.number().min(1).max(8) }))
      .mutation(async ({ ctx, input }) => {
        const student = await db.getStudentById(ctx.studentSession.studentId, ctx.studentSession.professorId);
        if (!student) throw new Error("Aluno não encontrado");
        
        const unlockedCharacters = student.hd2dUnlockedCharacters 
          ? JSON.parse(student.hd2dUnlockedCharacters)
          : [1];
        
        if (!unlockedCharacters.includes(input.characterId)) {
          throw new Error("Personagem não desbloqueado");
        }
        
        return await db.updateStudent(
          ctx.studentSession.studentId,
          { hd2dCharacterId: input.characterId },
          ctx.studentSession.professorId
        );
      }),
    
    // Desbloquear novo personagem HD-2D
    unlockHD2DCharacter: studentProcedure
      .input(z.object({ characterId: z.number().min(1).max(8) }))
      .mutation(async ({ ctx, input }) => {
        const student = await db.getStudentById(ctx.studentSession.studentId, ctx.studentSession.professorId);
        if (!student) throw new Error("Aluno não encontrado");
        
        const unlockedCharacters = student.hd2dUnlockedCharacters 
          ? JSON.parse(student.hd2dUnlockedCharacters)
          : [1];
        
        if (unlockedCharacters.includes(input.characterId)) {
          throw new Error("Personagem já desbloqueado");
        }
        
        unlockedCharacters.push(input.characterId);
        unlockedCharacters.sort((a: number, b: number) => a - b);
        
        return await db.updateStudent(
          ctx.studentSession.studentId,
          { hd2dUnlockedCharacters: JSON.stringify(unlockedCharacters) },
          ctx.studentSession.professorId
        );
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
      .input(z.object({
        subjectId: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getAnnouncementsForStudent(ctx.studentSession.studentId, input?.subjectId);
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
        const student = await db.getStudentById(ctx.studentSession.studentId, ctx.studentSession.professorId);
        const ranking = await db.getClassRanking(100);
        const studentRank = ranking.findIndex(r => r.studentId === ctx.studentSession.studentId) + 1;
        
        return {
          studentId: ctx.studentSession.studentId,
          totalPoints: points?.totalPoints || 0,
          currentBelt: points?.currentBelt || 'white',
          streakDays: points?.streakDays || 0,
          rank: studentRank || null,
          avatarSkinTone: student?.avatarSkinTone || 'light',
          avatarKimonoColor: student?.avatarKimonoColor || 'white',
          avatarHairStyle: student?.avatarHairStyle || 'short',
          // Campos de gamificação avançada
          beltAnimationSeen: points?.beltAnimationSeen || false,
          lastBeltUpgrade: points?.lastBeltUpgrade || null,
          pointsMultiplier: points?.pointsMultiplier || 1.0,
          consecutivePerfectScores: points?.consecutivePerfectScores || 0,
          totalExercisesCompleted: points?.totalExercisesCompleted || 0,
          totalPerfectScores: points?.totalPerfectScores || 0,
        };
      }),
    
    // Marcar animação de faixa como vista
    markBeltAnimationSeen: studentProcedure
      .mutation(async ({ ctx }) => {
        return await db.markBeltAnimationSeen(ctx.studentSession.studentId);
      }),
    
    // Obter estatísticas detalhadas de gamificação
    getDetailedStats: studentProcedure
      .query(async ({ ctx }) => {
        const points = await db.getOrCreateStudentPoints(ctx.studentSession.studentId);
        const history = await db.getStudentPointsHistory(ctx.studentSession.studentId, 50);
        const badges = await db.getStudentBadges(ctx.studentSession.studentId);
        
        // Calcular progresso para próxima faixa
        const beltThresholds = [
          { name: 'white', min: 0, max: 100 },
          { name: 'yellow', min: 100, max: 300 },
          { name: 'orange', min: 300, max: 600 },
          { name: 'green', min: 600, max: 1000 },
          { name: 'blue', min: 1000, max: 1500 },
          { name: 'purple', min: 1500, max: 2100 },
          { name: 'brown', min: 2100, max: 3000 },
          { name: 'black', min: 3000, max: Infinity },
        ];
        
        const currentBeltIndex = beltThresholds.findIndex(b => b.name === points?.currentBelt);
        const nextBelt = currentBeltIndex < beltThresholds.length - 1 ? beltThresholds[currentBeltIndex + 1] : null;
        const currentThreshold = beltThresholds[currentBeltIndex];
        
        const progressToNextBelt = nextBelt ? {
          current: (points?.totalPoints || 0) - currentThreshold.min,
          required: nextBelt.min - currentThreshold.min,
          percentage: Math.min(100, Math.round(((points?.totalPoints || 0) - currentThreshold.min) / (nextBelt.min - currentThreshold.min) * 100)),
          nextBeltName: nextBelt.name,
          pointsNeeded: Math.max(0, nextBelt.min - (points?.totalPoints || 0)),
        } : null;
        
        return {
          totalPoints: points?.totalPoints || 0,
          currentBelt: points?.currentBelt || 'white',
          streakDays: points?.streakDays || 0,
          pointsMultiplier: points?.pointsMultiplier || 1.0,
          consecutivePerfectScores: points?.consecutivePerfectScores || 0,
          totalExercisesCompleted: points?.totalExercisesCompleted || 0,
          totalPerfectScores: points?.totalPerfectScores || 0,
          lastBeltUpgrade: points?.lastBeltUpgrade || null,
          progressToNextBelt,
          recentActivity: history.slice(0, 10),
          badgesCount: badges.length,
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
    
    // ==================== TECH COINS (MOEDA VIRTUAL) ====================
    // Obter carteira do aluno
    getWallet: studentProcedure
      .query(async ({ ctx }) => {
        return await db.getStudentWallet(ctx.studentSession.studentId);
      }),
    
    // Obter histórico de transações
    getTransactionHistory: studentProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getCoinTransactionHistory(ctx.studentSession.studentId, input.limit || 20);
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
    
    // ==================== GAMIFICAÇÃO POR DISCIPLINA ====================
    // Obter ranking e estatísticas de gamificação de uma disciplina (professor)
    getSubjectGamificationDashboard: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ input }) => {
        const ranking = await db.getSubjectRanking(input.subjectId, 100);
        const stats = await db.getSubjectRankingStats(input.subjectId);
        
        // Calcular distribuição de faixas
        const BELT_CONFIG = [
          { name: 'white', label: 'Branca', emoji: '⚪' },
          { name: 'yellow', label: 'Amarela', emoji: '🟡' },
          { name: 'orange', label: 'Laranja', emoji: '🟠' },
          { name: 'green', label: 'Verde', emoji: '🟢' },
          { name: 'blue', label: 'Azul', emoji: '🔵' },
          { name: 'purple', label: 'Roxa', emoji: '🟣' },
          { name: 'brown', label: 'Marrom', emoji: '🟤' },
          { name: 'black', label: 'Preta', emoji: '⚫' },
        ];
        
        const beltDistribution = BELT_CONFIG.map(belt => {
          const count = ranking.filter(s => s.currentBelt === belt.name).length;
          const percentage = stats.totalStudents > 0 ? (count / stats.totalStudents) * 100 : 0;
          return { ...belt, count, percentage };
        });
        
        // Obter badges da disciplina
        const badges = await db.getAllBadges();
        
        return {
          ranking: ranking.map((r, index) => ({
            ...r,
            position: index + 1,
          })),
          stats,
          beltDistribution,
          badges: badges || [],
          totalStudents: stats.totalStudents,
          activeStudents: ranking.filter(s => s.streakDays > 0).length,
        };
      }),
    
    // Obter dados de gamificação de uma disciplina para aluno
    getSubjectGamificationStudent: studentProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const ranking = await db.getSubjectRanking(input.subjectId, 100);
        const stats = await db.getSubjectRankingStats(input.subjectId);
        const studentPosition = ranking.findIndex(r => r.studentId === ctx.studentSession.studentId) + 1;
        const studentData = ranking.find(r => r.studentId === ctx.studentSession.studentId);
        
        // Calcular distribuição de faixas
        const BELT_CONFIG = [
          { name: 'white', label: 'Branca', emoji: '⚪' },
          { name: 'yellow', label: 'Amarela', emoji: '🟡' },
          { name: 'orange', label: 'Laranja', emoji: '🟠' },
          { name: 'green', label: 'Verde', emoji: '🟢' },
          { name: 'blue', label: 'Azul', emoji: '🔵' },
          { name: 'purple', label: 'Roxa', emoji: '🟣' },
          { name: 'brown', label: 'Marrom', emoji: '🟤' },
          { name: 'black', label: 'Preta', emoji: '⚫' },
        ];
        
        const beltDistribution = BELT_CONFIG.map(belt => {
          const count = ranking.filter(s => s.currentBelt === belt.name).length;
          const percentage = stats.totalStudents > 0 ? (count / stats.totalStudents) * 100 : 0;
          return { ...belt, count, percentage };
        });
        
        // Obter badges da disciplina
        const badges = await db.getAllBadges();
        
        return {
          ranking: ranking.map((r, index) => ({
            ...r,
            position: index + 1,
          })),
          stats,
          beltDistribution,
          badges: badges || [],
          studentPosition: studentPosition || null,
          studentData: studentData || null,
          totalStudents: stats.totalStudents,
          activeStudents: ranking.filter(s => s.streakDays > 0).length,
        };
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
        
        // Gamificação removida - pontos não são mais adicionados
        // if (result.pointsEarned > 0) {
        //   await db.addExercisePoints(
        //     studentId,
        //     exercise.subjectId,
        //     result.pointsEarned,
        //     `Exercício: ${exercise.title} (${result.correctAnswers}/${result.totalQuestions} acertos)`
        //   );
        // }
        
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

    // Histórico de tentativas de um exercício específico
    getExerciseHistory: studentProcedure
      .input(z.object({ exerciseId: z.number() }))
      .query(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });
        
        // Buscar informações do exercício
        const exercise = await db.getExerciseDetails(input.exerciseId, studentId);
        if (!exercise) throw new TRPCError({ code: "NOT_FOUND", message: "Exercise not found" });
        
        // Buscar tentativas completas do aluno neste exercício
        const attempts = await db.getExerciseAttemptsByStudent(input.exerciseId, studentId);
        
        // Para cada tentativa, buscar as respostas detalhadas
        const attemptsWithResponses = await Promise.all(
          attempts.map(async (attempt: any) => {
            const results = await db.getExerciseResults(attempt.id);
            return {
              id: attempt.id,
              attemptNumber: attempt.attemptNumber,
              score: attempt.score,
              correctAnswers: attempt.correctAnswers,
              totalQuestions: attempt.totalQuestions,
              submittedAt: attempt.completedAt || attempt.startedAt,
              status: attempt.status,
              responses: results?.questions || []
            };
          })
        );
        
        return {
          exercise: {
            id: exercise.id,
            title: exercise.title,
            description: exercise.description,
            passingScore: exercise.passingScore,
            totalQuestions: exercise.totalQuestions
          },
          attempts: attemptsWithResponses
        };
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


    // Obter estatísticas de desempenho dos alunos
    getStatistics: protectedProcedure
      .input(z.object({
        subjectId: z.number(),
        exerciseId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const db_instance = await db.getDb();
        if (!db_instance) throw new Error("Database not available");
        
        const { studentExercises, studentExerciseAttempts, students } = await import("../drizzle/schema");
        
        // Construir condições de filtro
        const exerciseConditions = [
          eq(studentExercises.teacherId, ctx.user.id),
          eq(studentExercises.subjectId, input.subjectId),
        ];
        
        if (input.exerciseId) {
          exerciseConditions.push(eq(studentExercises.id, input.exerciseId));
        }
        
        // Buscar exercícios filtrados
        const exercises = await db_instance
          .select()
          .from(studentExercises)
          .where(and(...exerciseConditions));
        
        if (exercises.length === 0) {
          return null;
        }
        
        const exerciseIds = exercises.map(e => e.id);
        
        // Buscar todas as tentativas dos exercícios filtrados
        const attempts = await db_instance
          .select({
            id: studentExerciseAttempts.id,
            exerciseId: studentExerciseAttempts.exerciseId,
            studentId: studentExerciseAttempts.studentId,
            score: studentExerciseAttempts.score,
            status: studentExerciseAttempts.status,
            completedAt: studentExerciseAttempts.completedAt,
          })
          .from(studentExerciseAttempts)
          .where(
            sql`${studentExerciseAttempts.exerciseId} IN (${sql.join(exerciseIds.map(id => sql`${id}`), sql`, `)})`
          );
        
        // Buscar informações dos alunos
        const uniqueStudentIds = Array.from(new Set(attempts.map(a => a.studentId)));
        const studentsData = uniqueStudentIds.length > 0 ? await db_instance
          .select({
            id: students.id,
            fullName: students.fullName,
            registrationNumber: students.registrationNumber,
          })
          .from(students)
          .where(
            sql`${students.id} IN (${sql.join(uniqueStudentIds.map(id => sql`${id}`), sql`, `)})`
          ) : [];
        
        // Calcular estatísticas
        const totalStudents = uniqueStudentIds.length;
        const completedAttempts = attempts.filter(a => a.status === 'completed');
        const completionRate = totalStudents > 0 ? (completedAttempts.length / attempts.length) * 100 : 0;
        
        const scores = completedAttempts.map(a => a.score || 0);
        const averageScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
        
        // Distribuição de notas
        const scoreRanges = [
          { name: '0-20%', min: 0, max: 20, count: 0 },
          { name: '21-40%', min: 21, max: 40, count: 0 },
          { name: '41-60%', min: 41, max: 60, count: 0 },
          { name: '61-80%', min: 61, max: 80, count: 0 },
          { name: '81-100%', min: 81, max: 100, count: 0 },
        ];
        
        scores.forEach(score => {
          const range = scoreRanges.find(r => score >= r.min && score <= r.max);
          if (range) range.count++;
        });
        
        // Desempenho por exercício
        const exercisePerformance = exercises.map(exercise => {
          const exerciseAttempts = completedAttempts.filter(a => a.exerciseId === exercise.id);
          const exerciseScores = exerciseAttempts.map(a => a.score || 0);
          const exerciseAvg = exerciseScores.length > 0 
            ? exerciseScores.reduce((sum, s) => sum + s, 0) / exerciseScores.length 
            : 0;
          
          return {
            exerciseTitle: exercise.title,
            averageScore: Math.round(exerciseAvg * 10) / 10,
            attempts: exerciseAttempts.length,
          };
        });
        
        // Alunos com dificuldades (média < 60%)
        const studentPerformance = new Map<number, { scores: number[], attempts: number }>();
        
        completedAttempts.forEach(attempt => {
          if (!studentPerformance.has(attempt.studentId)) {
            studentPerformance.set(attempt.studentId, { scores: [], attempts: 0 });
          }
          const perf = studentPerformance.get(attempt.studentId)!;
          perf.scores.push(attempt.score || 0);
          perf.attempts++;
        });
        
        const studentsWithDifficultiesList = [];
        for (const [studentId, perf] of Array.from(studentPerformance.entries())) {
          const avgScore = perf.scores.reduce((sum: number, s: number) => sum + s, 0) / perf.scores.length;
          if (avgScore < 60) {
            const studentInfo = studentsData.find(s => s.id === studentId);
            studentsWithDifficultiesList.push({
              studentId,
              studentName: studentInfo?.fullName || 'Desconhecido',
              registrationNumber: studentInfo?.registrationNumber || 'N/A',
              averageScore: Math.round(avgScore * 10) / 10,
              attempts: perf.attempts,
            });
          }
        }
        
        // Evolução temporal (últimos 30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentAttempts = completedAttempts.filter(a => 
          a.completedAt && new Date(a.completedAt) >= thirtyDaysAgo
        );
        
        const temporalData = new Map<string, { scores: number[], total: number, completed: number }>();
        
        recentAttempts.forEach(attempt => {
          if (!attempt.completedAt) return;
          const date = new Date(attempt.completedAt).toISOString().split('T')[0];
          if (!temporalData.has(date)) {
            temporalData.set(date, { scores: [], total: 0, completed: 0 });
          }
          const data = temporalData.get(date)!;
          data.scores.push(attempt.score || 0);
          data.completed++;
        });
        
        const temporalEvolution = Array.from(temporalData.entries())
          .map(([date, data]) => ({
            date,
            averageScore: Math.round((data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length) * 10) / 10,
            completionRate: Math.round((data.completed / data.total) * 100 * 10) / 10,
          }))
          .sort((a, b) => a.date.localeCompare(b.date));
        
        // Desempenho de todos os alunos
        // Calcular exercícios únicos concluídos por aluno (não tentativas)
        const studentCompletedExercises = new Map<number, Set<number>>();
        completedAttempts.forEach(attempt => {
          if (!studentCompletedExercises.has(attempt.studentId)) {
            studentCompletedExercises.set(attempt.studentId, new Set());
          }
          studentCompletedExercises.get(attempt.studentId)!.add(attempt.exerciseId);
        });
        
        const allStudentsPerformance = [];
        for (const [studentId, perf] of Array.from(studentPerformance.entries())) {
          const avgScore = perf.scores.reduce((sum: number, s: number) => sum + s, 0) / perf.scores.length;
          const studentInfo = studentsData.find(s => s.id === studentId);
          const uniqueExercisesCompleted = studentCompletedExercises.get(studentId)?.size || 0;
          allStudentsPerformance.push({
            studentId,
            studentName: studentInfo?.fullName || 'Desconhecido',
            registrationNumber: studentInfo?.registrationNumber || 'N/A',
            averageScore: Math.round(avgScore * 10) / 10,
            completedExercises: uniqueExercisesCompleted,
            totalAttempts: perf.attempts,
          });
        }
        
        return {
          totalStudents,
          totalExercises: exercises.length,
          completionRate: Math.round(completionRate * 10) / 10,
          averageScore: Math.round(averageScore * 10) / 10,
          studentsWithDifficulties: studentsWithDifficultiesList.length,
          studentsWithDifficultiesList,
          scoreDistribution: scoreRanges,
          exercisePerformance,
          temporalEvolution,
          allStudentsPerformance,
        };
      }),
  }),

  // ==================== SISTEMA DE REVISÃO INTELIGENTE ====================
  smartReview: router({
    // Obter fila de revisão priorizada (algoritmo SM-2)
    getQueue: studentProcedure
      .input(z.object({
        subjectId: z.number().optional(),
        limit: z.number().optional().default(20),
      }))
      .query(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });

        const queue = await db.getReviewQueue(studentId, input.subjectId, input.limit);
        return queue;
      }),

    // Obter detalhes de um item da fila
    getItemDetails: studentProcedure
      .input(z.object({ queueItemId: z.number() }))
      .query(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });

        const details = await db.getReviewItemDetails(input.queueItemId, studentId);
        return details;
      }),

    // Registrar revisão e atualizar algoritmo
    recordReview: studentProcedure
      .input(z.object({
        queueItemId: z.number(),
        answerId: z.number(),
        exerciseId: z.number(),
        wasCorrect: z.boolean(),
        timeSpent: z.number(),
        selfRating: z.enum(["again", "hard", "good", "easy"]).optional(),
        confidenceLevel: z.number().min(1).max(5).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });

        const result = await db.recordReview({
          studentId,
          ...input,
        });

        return result;
      }),

    // Obter estatísticas de revisão
    getStatistics: studentProcedure
      .input(z.object({ subjectId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });

        const stats = await db.getReviewStatistics(studentId, input.subjectId);
        return stats;
      }),

    // Obter histórico de revisões
    getHistory: studentProcedure
      .input(z.object({ limit: z.number().optional().default(50) }))
      .query(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });

        const history = await db.getReviewHistory(studentId, input.limit);
        return history;
      }),

    // Criar sessão de estudo
    createSession: studentProcedure
      .input(z.object({
        subjectId: z.number().optional(),
        sessionType: z.enum(["quick_review", "full_review", "focused_practice", "random_practice"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });

        const sessionId = await db.createStudySession({
          studentId,
          ...input,
        });

        return { sessionId };
      }),

    // Finalizar sessão de estudo
    completeSession: studentProcedure
      .input(z.object({
        sessionId: z.number(),
        totalItems: z.number(),
        itemsCompleted: z.number(),
        itemsCorrect: z.number(),
        totalTime: z.number(),
        pointsEarned: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });

        await db.completeStudySession(input.sessionId, {
          totalItems: input.totalItems,
          itemsCompleted: input.itemsCompleted,
          itemsCorrect: input.itemsCorrect,
          totalTime: input.totalTime,
          pointsEarned: input.pointsEarned,
        });

        return { success: true };
      }),

    // Adicionar item à fila de revisão (quando aluno erra exercício)
    addToQueue: studentProcedure
      .input(z.object({
        answerId: z.number(),
        exerciseId: z.number(),
        subjectId: z.number(),
        initialDifficulty: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });

        const queueId = await db.addToReviewQueue({
          studentId,
          ...input,
        });

        return { queueId };
      }),
  }),

  // ==================== SISTEMA DE REVISÃO LEGADO ====================
  studentReview: router({
    // Listar TODAS as questões (acertos e erros) para revisão inteligente
    getAllAnswersForReview: studentProcedure
      .input(
        z.object({
          subjectId: z.number().optional(),
          moduleId: z.number().optional(),
          questionType: z.string().optional(),
          limit: z.number().optional().default(100),
        })
      )
      .query(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });

        const allAnswers = await db.getAllAnswersForReview(studentId, input);
        return allAnswers;
      }),

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
                content: `Você é um tutor educacional especializado em aprendizado contínuo.
Seu objetivo é ajudar o aluno a entender o conceito profundamente e fornecer recursos para estudo autônomo.
Seja empático, construtivo e focado em desenvolver autonomia de aprendizado.`,
              },
              {
                role: "user",
                content: `Analise a resposta do aluno e forneça recursos de aprendizado contínuo:

Questão: ${input.questionText}

Resposta correta: ${input.correctAnswer}

Resposta do aluno: ${input.studentAnswer}

Tipo de questão: ${input.questionType}

Forneça:
1. Uma explicação clara do conceito fundamental
2. ${input.questionType === 'open' ? 'Outras formas válidas de responder esta questão (2-3 alternativas)' : 'Conceitos relacionados que o aluno deve dominar'}
3. Dicas de COMO estudar este tópico de forma efetiva (3-5 dicas práticas focadas em métodos de estudo)
4. Sugestões de materiais complementares (tipos de recursos: vídeos, artigos, exercícios)
5. Uma estratégia de estudo recomendada para dominar este conceito

Foque em desenvolver autonomia de aprendizado e pensamento crítico, não apenas em corrigir o erro.`,
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
                      description: "Explicação clara do conceito fundamental",
                    },
                    alternativeAnswers: {
                      type: "array",
                      description: "Outras formas válidas de responder (para questões abertas) ou conceitos relacionados (para múltipla escolha)",
                      items: { type: "string" },
                    },
                    studyTips: {
                      type: "array",
                      description: "Lista de 3-5 dicas práticas de COMO estudar este tópico",
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
                      description: "Estratégia de estudo recomendada para dominar este conceito",
                    },
                  },
                  required: ["conceptExplanation", "alternativeAnswers", "studyTips", "suggestedMaterials", "reviewStrategy"],
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

    // Gerar material de estudo detalhado para uma questão (modelo de exercícios)
    generateDetailedStudyMaterial: studentProcedure
      .input(
        z.object({
          answerId: z.number(),
          questionText: z.string(),
          studentAnswer: z.string(),
          correctAnswer: z.string(),
          questionType: z.string(),
          subjectName: z.string().optional(),
          moduleName: z.string().optional(),
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
                content: `Você é um tutor educacional especializado em criar material de estudo completo e detalhado.
Seu objetivo é transformar cada questão em uma oportunidade de aprendizado profundo, fornecendo:
- Explicações detalhadas dos conceitos
- Estratégias personalizadas de estudo
- Recursos complementares
- Exemplos práticos
- Identificação de erros comuns

Seja didático, empático e focado em desenvolver autonomia de aprendizado.`,
              },
              {
                role: "user",
                content: `Crie um material de estudo COMPLETO e DETALHADO para esta questão:

Disciplina: ${input.subjectName || "Não especificada"}
Módulo: ${input.moduleName || "Não especificado"}

Questão: ${input.questionText}

Resposta correta: ${input.correctAnswer}

Resposta do aluno: ${input.studentAnswer}

Tipo de questão: ${input.questionType}

Forneça um material de estudo COMPLETO com:

1. **Explicação Detalhada do Conceito** (3-5 parágrafos explicando o conceito fundamental de forma clara e didática)

2. **Estratégia de Estudo Personalizada** (passo a passo de COMO estudar este tópico de forma efetiva, com 5-7 passos concretos)

3. **Conceitos Relacionados** (lista de 4-6 conceitos que o aluno deve dominar para entender completamente este tópico)

4. **Recursos Complementares** (5-7 sugestões de materiais: vídeos, artigos, exercícios, livros, etc. - seja específico sobre o tipo e conteúdo)

5. **Exemplos Práticos** (3-4 exemplos práticos que o aluno pode usar para praticar e fixar o conceito)

6. **Erros Comuns** (lista de 4-5 erros comuns que estudantes cometem neste tipo de questão e como evitá-los)

7. **Tempo Estimado para Domínio** (estimativa realista em minutos de quanto tempo o aluno precisa dedicar para dominar este conceito)

8. **Dicas de Memorização** (técnicas mnemônicas, associações, macetes para lembrar do conceito)

Seja DETALHADO e ESPECÍFICO. Este material será usado pelo aluno para estudo autônomo.`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "detailed_study_material",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    detailedExplanation: {
                      type: "string",
                      description: "Explicação detalhada do conceito (3-5 parágrafos)",
                    },
                    studyStrategy: {
                      type: "string",
                      description: "Estratégia personalizada de estudo (passo a passo com 5-7 passos)",
                    },
                    relatedConcepts: {
                      type: "array",
                      description: "Lista de 4-6 conceitos relacionados",
                      items: { type: "string" },
                    },
                    additionalResources: {
                      type: "array",
                      description: "Lista de 5-7 recursos complementares",
                      items: {
                        type: "object",
                        properties: {
                          type: {
                            type: "string",
                            description: "Tipo de recurso (vídeo, artigo, exercício, livro, etc)",
                          },
                          title: { type: "string", description: "Título ou descrição do recurso" },
                          description: { type: "string", description: "Detalhes sobre o conteúdo" },
                        },
                        required: ["type", "title", "description"],
                        additionalProperties: false,
                      },
                    },
                    practiceExamples: {
                      type: "array",
                      description: "Lista de 3-4 exemplos práticos",
                      items: { type: "string" },
                    },
                    commonMistakes: {
                      type: "array",
                      description: "Lista de 4-5 erros comuns e como evitá-los",
                      items: { type: "string" },
                    },
                    timeToMaster: {
                      type: "number",
                      description: "Tempo estimado em minutos para dominar o conceito",
                    },
                    memorizationTips: {
                      type: "array",
                      description: "Técnicas de memorização e macetes",
                      items: { type: "string" },
                    },
                  },
                  required: [
                    "detailedExplanation",
                    "studyStrategy",
                    "relatedConcepts",
                    "additionalResources",
                    "practiceExamples",
                    "commonMistakes",
                    "timeToMaster",
                    "memorizationTips",
                  ],
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

          // Salvar material de estudo no banco de dados
          await db.saveDetailedStudyMaterial(input.answerId, {
            detailedExplanation: result.detailedExplanation,
            studyStrategy: result.studyStrategy,
            relatedConcepts: JSON.stringify(result.relatedConcepts),
            additionalResources: JSON.stringify(result.additionalResources),
            practiceExamples: JSON.stringify(result.practiceExamples),
            commonMistakes: JSON.stringify(result.commonMistakes),
            timeToMaster: result.timeToMaster,
            memorizationTips: JSON.stringify(result.memorizationTips),
          });

          return result;
        } catch (error) {
          console.error("[Review] Error generating detailed study material:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao gerar material de estudo. Tente novamente.",
          });
        }
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
        avatarGender: z.enum(['male', 'female']).optional(),
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

  // ==================== ESPECIALIZAÇÕES (DOJO TECH) ====================
  specializations: router({
    // Escolher especialização
    choose: studentProcedure
      .input(z.object({
        specialization: z.enum(['code_warrior', 'interface_master', 'data_sage', 'system_architect'])
      }))
      .mutation(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });

        const result = await db.chooseSpecialization(studentId, input.specialization);
        return result;
      }),

    // Obter especialização do aluno
    getMy: studentProcedure
      .query(async ({ ctx }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });

        const spec = await db.getStudentSpecialization(studentId);
        return spec;
      }),

    // Obter árvore de skills da especialização
    getSkillTree: studentProcedure
      .input(z.object({
        specialization: z.string()
      }))
      .query(async ({ input }) => {
        const skills = await db.getSkillTree(input.specialization);
        return skills;
      }),

    // Obter skills desbloqueadas do aluno
    getMySkills: studentProcedure
      .query(async ({ ctx }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });

        const skills = await db.getStudentSkills(studentId);
        return skills;
      }),

    // Desbloquear skill
    unlockSkill: studentProcedure
      .input(z.object({
        skillId: z.number()
      }))
      .mutation(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });

        const result = await db.unlockSkill(studentId, input.skillId);
        return result;
      }),

    // Calcular multiplicador de bônus
    getBonusMultiplier: studentProcedure
      .input(z.object({
        bonusType: z.string()
      }))
      .query(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });

        const multiplier = await db.calculateBonusMultiplier(studentId, input.bonusType);
        return { multiplier };
      }),

    // Atualizar nível da especialização
    updateLevel: studentProcedure
      .mutation(async ({ ctx }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });

        const result = await db.updateSpecializationLevel(studentId);
        return result;
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

  // ==================== CONQUISTAS OCULTAS (EASTER EGGS) ====================
  hiddenAchievements: router({
    // Obter conquistas do aluno
    getMyAchievements: studentProcedure
      .query(async ({ ctx }) => {
        return db.getStudentHiddenAchievements(ctx.studentSession.studentId);
      }),

    // Obter todas as conquistas (para galeria)
    getAll: studentProcedure
      .query(async () => {
        return db.getAllHiddenAchievements();
      }),

    // Registrar ação do aluno
    trackAction: studentProcedure
      .input(z.object({
        actionType: z.string(),
        actionData: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.trackStudentAction(
          ctx.studentSession.studentId,
          input.actionType,
          input.actionData
        );
        
        // Verificar se desbloqueou alguma conquista
        const newAchievements = await db.checkAndUnlockAchievements(ctx.studentSession.studentId);
        
        return {
          success: true,
          newAchievements,
        };
      }),

    // Verificar conquistas (chamado após ações importantes)
    checkUnlocks: studentProcedure
      .mutation(async ({ ctx }) => {
        const newAchievements = await db.checkAndUnlockAchievements(ctx.studentSession.studentId);
        return newAchievements;
      }),
  }),

  // ==================== CARTEIRA DO ALUNO (TECH COINS) ====================
  studentWallet: router({
    // Obter carteira do aluno
    getWallet: studentProcedure
      .query(async ({ ctx }) => {
        return db.getStudentWallet(ctx.studentSession.studentId);
      }),

    // Obter histórico de transações
    getTransactionHistory: studentProcedure
      .query(async ({ ctx }) => {
        return db.getWalletTransactions(ctx.studentSession.studentId);
      }),

    // Obter estatísticas da carteira
    getWalletStats: studentProcedure
      .query(async ({ ctx }) => {
        const transactions = await db.getWalletTransactions(ctx.studentSession.studentId);
        
        if (transactions.length === 0) {
          return {
            averageDaily: 0,
            maxEarned: 0,
            maxSpent: 0,
            totalTransactions: 0,
          };
        }

        const earned = transactions.filter(t => t.type === 'earn' || t.type === 'bonus');
        const spent = transactions.filter(t => t.type === 'spend' || t.type === 'penalty');

        const maxEarned = earned.length > 0 ? Math.max(...earned.map(t => t.amount)) : 0;
        const maxSpent = spent.length > 0 ? Math.max(...spent.map(t => t.amount)) : 0;

        // Calcular média diária
        const firstTransaction = transactions[transactions.length - 1];
        const daysSinceFirst = Math.max(1, Math.ceil(
          (Date.now() - new Date(firstTransaction.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        ));
        const totalEarned = earned.reduce((sum, t) => sum + t.amount, 0);
        const averageDaily = totalEarned / daysSinceFirst;

        return {
          averageDaily,
          maxEarned,
          maxSpent,
          totalTransactions: transactions.length,
        };
      }),
  }),

  // ========== PERFIS DE USUÁRIO ==========
  userProfile: router({
    // Buscar perfil atual do usuário
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const profile = await db.getUserProfile(ctx.user.id);
      return { profile: profile || 'traditional' }; // Perfil único
    }),

    // Atualizar perfil do usuário
    updateProfile: protectedProcedure
      .input(z.object({
        profile: z.enum(['traditional', 'enthusiast', 'interactive', 'organizational']),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfileType(ctx.user.id, input.profile);
        return { success: true, profile: input.profile };
      }),
  }),

  // ==================== GAMIFICAÇÃO AVANÇADA ====================
  
  /**
   * Rotas para Badges por Módulo
   */
  moduleBadges: router({
    // Calcular e atribuir badge de módulo
    calculate: studentProcedure
      .input(z.object({
        moduleId: z.number().int().positive(),
      }))
      .mutation(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        const result = await db.calculateModuleBadge(studentId, input.moduleId);
        
        if (result && result.isNew) {
          // Criar notificação de novo badge
          await db.createGamificationNotification({
            studentId,
            type: 'badge_earned',
            title: `Badge ${result.badgeLevel.toUpperCase()} conquistado!`,
            message: `Você conquistou o badge ${result.badgeLevel} em um módulo!`
          });
        }
        
        return result;
      }),

    // Buscar badges do aluno
    getMyBadges: studentProcedure.query(async ({ ctx }) => {
      return db.getStudentModuleBadges(ctx.studentSession.studentId);
    }),

    // Buscar badges de um módulo (ranking)
    getByModule: protectedProcedure
      .input(z.object({
        moduleId: z.number().int().positive(),
      }))
      .query(async ({ input }) => {
        return db.getModuleBadgesByModule(input.moduleId);
      }),
  }),

  /**
   * Rotas para Conquistas por Especialização
   */
  specializationAchievements: router({
    // Criar conquista (admin)
    create: protectedProcedure
      .input(z.object({
        code: z.string().min(1),
        specialization: z.enum(["code_warrior", "interface_master", "data_sage", "system_architect"]),
        name: z.string().min(1),
        description: z.string(),
        icon: z.string(),
        rarity: z.enum(["common", "rare", "epic", "legendary"]),
        requirement: z.object({
          type: z.string(),
        }).passthrough(),
        points: z.number().int().positive().default(50),
      }))
      .mutation(async ({ input }) => {
        return db.createSpecializationAchievement(input);
      }),

    // Listar conquistas de uma especialização
    getBySpecialization: publicProcedure
      .input(z.object({
        specialization: z.enum(["code_warrior", "interface_master", "data_sage", "system_architect"]),
      }))
      .query(async ({ input }) => {
        return db.getSpecializationAchievements(input.specialization);
      }),

    // Buscar conquistas do aluno
    getMyAchievements: studentProcedure.query(async ({ ctx }) => {
      return db.getStudentAchievements(ctx.studentSession.studentId);
    }),

    // Verificar e desbloquear conquistas automaticamente
    checkAndUnlock: studentProcedure.mutation(async ({ ctx }) => {
      const studentId = ctx.studentSession.studentId;
      const newAchievements = await db.checkAndUnlockSpecializationAchievements(studentId);
      
      // Criar notificações para novas conquistas
      for (const achievement of newAchievements) {
        await db.createGamificationNotification({
          studentId,
          type: 'achievement_unlocked',
          title: `Conquista Desbloqueada: ${achievement.name}!`,
          message: `Você desbloqueou a conquista ${achievement.rarity}: "${achievement.name}"! +${achievement.points} pontos`
        });
      }
      
      return newAchievements;
    }),

    // Desbloquear conquista manualmente (para testes ou admin)
    unlock: protectedProcedure
      .input(z.object({
        studentId: z.number().int().positive(),
        achievementId: z.number().int().positive(),
      }))
      .mutation(async ({ input }) => {
        return db.unlockAchievement(input.studentId, input.achievementId);
      }),
  }),

  /**
   * Rotas para Recomendações Personalizadas com IA
   */
  learningRecommendations: router({
    // Gerar recomendações personalizadas
    generate: studentProcedure.mutation(async ({ ctx }) => {
      try {
        const recommendations = await db.generatePersonalizedRecommendations(ctx.studentSession.studentId);
        return {
          success: true,
          recommendations,
          count: recommendations.length
        };
      } catch (error) {
        console.error("Error generating recommendations:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao gerar recomendações. Tente novamente.',
        });
      }
    }),

    // Buscar recomendações do aluno
    getMyRecommendations: studentProcedure
      .input(z.object({
        status: z.enum(["pending", "accepted", "rejected", "completed"]).optional(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getStudentRecommendations(ctx.studentSession.studentId, input.status);
      }),

    // Atualizar status de recomendação
    updateStatus: studentProcedure
      .input(z.object({
        recommendationId: z.number().int().positive(),
        status: z.enum(["pending", "accepted", "rejected", "completed"]),
      }))
      .mutation(async ({ input }) => {
        return db.updateRecommendationStatus(input.recommendationId, input.status);
      }),

    // Registrar progresso em tópico (usado para alimentar IA)
    recordProgress: studentProcedure
      .input(z.object({
        topicId: z.number().int().positive(),
        score: z.number().int().min(0).max(100),
        timeSpent: z.number().int().positive(), // em minutos
        attemptsCount: z.number().int().positive().default(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        await db.recordTopicProgress(
          studentId,
          input.topicId,
          input.score,
          input.timeSpent,
          input.attemptsCount
        );

        // Após registrar progresso, verificar badges
        // (badges serão calculados em outro momento)

        return { success: true };
      }),
  }),

  /**
   * Rota combinada para inicializar dados de gamificação avançada
   */
  advancedGamification: router({
    // Buscar todos os dados de gamificação avançada do aluno
    getMyData: studentProcedure.query(async ({ ctx }) => {
      const studentId = ctx.studentSession.studentId;
      const [badges, achievements, recommendations] = await Promise.all([
        db.getStudentModuleBadges(studentId),
        db.getStudentAchievements(studentId),
        db.getStudentRecommendations(studentId, 'pending')
      ]);

      return {
        badges,
        achievements,
        recommendations,
        stats: {
          totalBadges: badges.length,
          platinumBadges: badges.filter(b => b.badgeLevel === 'platinum').length,
          goldBadges: badges.filter(b => b.badgeLevel === 'gold').length,
          totalAchievements: achievements.length,
          legendaryAchievements: achievements.filter(a => a.rarity === 'legendary').length,
          pendingRecommendations: recommendations.length
        }
      };
    }),

    // Inicializar conquistas padrão do sistema (executar uma vez)
    initializeDefaultAchievements: protectedProcedure.mutation(async () => {
      const achievements = [
        // Code Warrior
        {
          code: 'code_warrior_first_steps',
          specialization: 'code_warrior' as const,
          name: 'Primeiros Passos',
          description: 'Complete seu primeiro módulo de programação',
          icon: 'trophy',
          rarity: 'common' as const,
          requirement: { type: 'modules_completed', count: 1 },
          points: 50
        },
        {
          code: 'code_warrior_algorithm_master',
          specialization: 'code_warrior' as const,
          name: 'Mestre dos Algoritmos',
          description: 'Conquiste 5 badges Platinum em módulos de algoritmos',
          icon: 'crown',
          rarity: 'legendary' as const,
          requirement: { type: 'platinum_badges', count: 5 },
          points: 500
        },
        {
          code: 'code_warrior_perfectionist',
          specialization: 'code_warrior' as const,
          name: 'Perfeccionista',
          description: 'Mantenha média acima de 95% em todos os módulos',
          icon: 'star',
          rarity: 'epic' as const,
          requirement: { type: 'average_score', score: 95 },
          points: 300
        },

        // Interface Master
        {
          code: 'interface_master_first_design',
          specialization: 'interface_master' as const,
          name: 'Primeiro Design',
          description: 'Complete seu primeiro módulo de UI/UX',
          icon: 'palette',
          rarity: 'common' as const,
          requirement: { type: 'modules_completed', count: 1 },
          points: 50
        },
        {
          code: 'interface_master_ux_guru',
          specialization: 'interface_master' as const,
          name: 'Guru de UX',
          description: 'Conquiste 5 badges Platinum em módulos de interface',
          icon: 'sparkles',
          rarity: 'legendary' as const,
          requirement: { type: 'platinum_badges', count: 5 },
          points: 500
        },

        // Data Sage
        {
          code: 'data_sage_first_analysis',
          specialization: 'data_sage' as const,
          name: 'Primeira Análise',
          description: 'Complete seu primeiro módulo de análise de dados',
          icon: 'chart',
          rarity: 'common' as const,
          requirement: { type: 'modules_completed', count: 1 },
          points: 50
        },
        {
          code: 'data_sage_data_master',
          specialization: 'data_sage' as const,
          name: 'Mestre dos Dados',
          description: 'Conquiste 5 badges Platinum em módulos de dados',
          icon: 'database',
          rarity: 'legendary' as const,
          requirement: { type: 'platinum_badges', count: 5 },
          points: 500
        },

        // System Architect
        {
          code: 'system_architect_first_system',
          specialization: 'system_architect' as const,
          name: 'Primeiro Sistema',
          description: 'Complete seu primeiro módulo de arquitetura',
          icon: 'building',
          rarity: 'common' as const,
          requirement: { type: 'modules_completed', count: 1 },
          points: 50
        },
        {
          code: 'system_architect_cloud_master',
          specialization: 'system_architect' as const,
          name: 'Mestre da Nuvem',
          description: 'Conquiste 5 badges Platinum em módulos de sistemas',
          icon: 'cloud',
          rarity: 'legendary' as const,
          requirement: { type: 'platinum_badges', count: 5 },
          points: 500
        },
      ];

      const created = [];
      for (const achievement of achievements) {
        try {
          const id = await db.createSpecializationAchievement(achievement);
          created.push({ id, ...achievement });
        } catch (error) {
          // Ignorar erros de duplicação
          console.log(`Achievement ${achievement.code} already exists`);
        }
      }

      return {
        success: true,
        created: created.length,
        achievements: created
      };
    }),
  }),

  // ==================== TEACHER BELT SYSTEM ====================
  teacherBelt: router({
    // Obter pontos e faixa atual do professor
    getMyProgress: protectedProcedure.query(async ({ ctx }) => {
      const points = await db.getOrCreateTeacherPoints(ctx.user.id);
      if (!points) throw new Error("Failed to get teacher points");

      // Calcular progresso
      const { calculateProgress } = await import("../shared/belt-system");
      const progress = calculateProgress(points.totalPoints);

      return {
        ...points,
        progress
      };
    }),

    // Registrar nova atividade
    addActivity: protectedProcedure
      .input(z.object({
        activityType: z.enum([
          "class_taught",
          "planning",
          "grading",
          "meeting",
          "course_creation",
          "material_creation",
          "student_support",
          "professional_dev",
          "other"
        ]),
        title: z.string().min(1, "Título é obrigatório"),
        description: z.string().optional(),
        duration: z.number().optional(),
        activityDate: z.string()
      }))
      .mutation(async ({ ctx, input }) => {
        // Calcular pontos baseado no tipo de atividade
        const { ACTIVITY_POINTS } = await import("../shared/belt-system");
        const points = ACTIVITY_POINTS[input.activityType];

        const result = await db.addTeacherActivity({
          userId: ctx.user.id,
          activityType: input.activityType,
          title: input.title,
          description: input.description,
          points,
          duration: input.duration,
          activityDate: input.activityDate
        });

        return result;
      }),

    // Obter histórico de atividades
    getActivitiesHistory: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(50)
      }))
      .query(async ({ ctx, input }) => {
        const activities = await db.getTeacherActivitiesHistory(ctx.user.id, input.limit);
        return activities;
      }),

    // Obter histórico de evolução de faixas
    getBeltHistory: protectedProcedure.query(async ({ ctx }) => {
      const history = await db.getTeacherBeltHistory(ctx.user.id);
      return history;
    }),

    // Obter estatísticas de atividades
    getActivityStats: protectedProcedure.query(async ({ ctx }) => {
      const stats = await db.getTeacherActivityStats(ctx.user.id);
      return stats;
    }),
  }),

  // ==================== GAMIFICAÇÃO 3D - FAIXAS DE KARATÊ ====================
  gamification3D: router({
    // Obter todas as faixas disponíveis
    getAllBelts: publicProcedure.query(async () => {
      return db.getAllBelts();
    }),

    // Obter progresso do aluno com faixa atual
    getStudentProgress: studentProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ input }) => {
        return db.getStudentProgressWithBelt(input.studentId);
      }),

    // Obter estatísticas completas de gamificação do aluno
    getStudentStats: studentProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ input }) => {
        return db.getStudentGamificationStats(input.studentId);
      }),

    // Adicionar pontos ao aluno
    addPoints: studentProcedure
      .input(z.object({
        studentId: z.number(),
        points: z.number().positive(),
        reason: z.string()
      }))
      .mutation(async ({ input }) => {
        const result = await db.addPointsToStudentGamification(
          input.studentId,
          input.points,
          input.reason
        );
        
        // Verificar conquistas automaticamente
        await db.checkAndUnlockGamificationAchievements(input.studentId);
        
        return result;
      }),

    // Obter conquistas disponíveis
    getAllAchievements: publicProcedure.query(async () => {
      return db.getAllAchievements();
    }),

    // Obter conquistas do aluno
    getStudentAchievements: studentProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ input }) => {
        return db.getStudentAchievementsGamification(input.studentId);
      }),

    // Obter histórico de level ups
    getLevelUpHistory: studentProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ input }) => {
        return db.getStudentLevelUpHistory(input.studentId);
      }),

    // Marcar celebração de level up como vista
    markLevelUpSeen: studentProcedure
      .input(z.object({ levelUpId: z.number() }))
      .mutation(async ({ input }) => {
        await db.markLevelUpCelebrationSeen(input.levelUpId);
        return { success: true };
      }),
  }),

  /**
   * Sistema de Análise de Aprendizado com IA
   */
  analytics: router({
    // Registrar comportamento do aluno
    recordBehavior: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        subjectId: z.number().optional(),
        behaviorType: z.enum([
          'exercise_completion',
          'quiz_attempt',
          'topic_access',
          'material_download',
          'doubt_posted',
          'comment_posted',
          'assignment_submission',
          'attendance',
          'late_submission',
          'improvement_shown',
          'struggle_detected',
          'engagement_high',
          'engagement_low'
        ]),
        behaviorData: z.any().optional(),
        score: z.number().optional(),
        metadata: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.recordStudentBehavior({
          ...input,
          userId: ctx.user.id,
        });
      }),

    // Obter insights de um aluno
    getStudentInsights: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        includeDismissed: z.boolean().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getStudentInsights(
          input.studentId,
          ctx.user.id,
          input.includeDismissed
        );
      }),

    // Gerar análise completa de um aluno
    analyzeStudent: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        subjectId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { analyzeLearningBehavior } = await import('./learningAnalytics');
        
        // Buscar dados do aluno
        const student = await db.getStudentById(input.studentId, ctx.user.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }

        // Buscar comportamentos recentes
        const recentBehaviors = await db.getRecentBehaviors(input.studentId, ctx.user.id, 30);

        // Buscar exercícios recentes
        const recentExercises = await db.getStudentExerciseHistory(input.studentId, input.subjectId);

        // Preparar dados para análise
        const behaviorData = {
          studentId: student.id,
          studentName: student.fullName,
          subjectName: input.subjectId ? 'Disciplina' : undefined,
          recentBehaviors: recentBehaviors.map(b => ({
            type: b.behaviorType,
            date: b.recordedAt.toISOString(),
            score: b.score || undefined,
            metadata: b.metadata || undefined,
          })),
          recentExercises: recentExercises.slice(0, 10).map(e => ({
            title: 'Exercício',
            score: e.attempt.score || 0,
            completedAt: e.attempt.completedAt?.toISOString() || new Date().toISOString(),
            timeSpent: e.attempt.timeSpent || undefined,
          })),
        };

        // Analisar com IA
        const analysis = await analyzeLearningBehavior(behaviorData);

        // Salvar insights gerados
        for (const alert of analysis.alerts) {
          await db.createAlert({
            studentId: input.studentId,
            userId: ctx.user.id,
            subjectId: input.subjectId,
            alertType: 'needs_attention',
            severity: alert.severity,
            title: alert.type,
            message: alert.message,
            recommendedAction: analysis.recommendations.join('\n'),
          });
        }

        // Salvar padrões detectados
        for (const pattern of analysis.patterns) {
          await db.saveLearningPattern({
            studentId: input.studentId,
            userId: ctx.user.id,
            subjectId: input.subjectId,
            patternType: 'engagement_pattern',
            patternDescription: pattern.description,
            confidence: pattern.confidence,
            evidence: JSON.stringify([pattern.type]),
          });
        }

        // Salvar insight geral
        await db.saveAIInsight({
          studentId: input.studentId,
          userId: ctx.user.id,
          subjectId: input.subjectId,
          insightType: 'recommendation',
          title: 'Análise de Comportamento',
          description: analysis.overallAssessment,
          actionable: true,
          actionSuggestion: analysis.recommendations.join('\n'),
          priority: analysis.alerts.length > 0 ? 'high' : 'medium',
          confidence: analysis.confidence,
          relatedData: JSON.stringify({
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
          }),
        });

        return analysis;
      }),

    // Obter padrões de aprendizado
    getLearningPatterns: protectedProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getStudentLearningPatterns(input.studentId, ctx.user.id);
      }),

    // Obter alertas pendentes
    getAlerts: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getPendingAlerts(ctx.user.id);
      }),

    // Obter alertas de um aluno
    getStudentAlerts: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        includeResolved: z.boolean().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getStudentAlerts(
          input.studentId,
          ctx.user.id,
          input.includeResolved
        );
      }),

    // Reconhecer alerta
    acknowledgeAlert: protectedProcedure
      .input(z.object({
        alertId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.acknowledgeAlert(input.alertId, ctx.user.id);
      }),

    // Resolver alerta
    resolveAlert: protectedProcedure
      .input(z.object({
        alertId: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.resolveAlert(input.alertId, ctx.user.id, input.notes);
      }),

    // Obter estatísticas de alertas
    getAlertStatistics: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getAlertStatistics(ctx.user.id);
      }),

    // Obter métricas de desempenho
    getPerformanceMetrics: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        metricType: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getStudentPerformanceMetrics(
          input.studentId,
          ctx.user.id,
          input.metricType
        );
      }),

    // Dispensar insight
    dismissInsight: protectedProcedure
      .input(z.object({
        insightId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.dismissInsight(input.insightId, ctx.user.id);
      }),

    // Obter análise da turma
    getClassAnalytics: protectedProcedure
      .input(z.object({
        subjectId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        // Buscar alunos MATRICULADOS nas disciplinas do professor (via subjectEnrollments)
        // Isso conta apenas alunos que estão realmente matriculados, não todos os cadastrados
        const enrolledStudents = await db.getEnrolledStudentsByProfessor(ctx.user.id);
        
        // Filtrar por disciplina se selecionada
        let filteredEnrollments = enrolledStudents;
        if (input.subjectId) {
          filteredEnrollments = enrolledStudents.filter(e => e.subjectId === input.subjectId);
        }
        
        // Contar alunos únicos por studentId (evita duplicatas se o aluno estiver em várias disciplinas)
        const uniqueStudentIds = new Set<number>();
        const uniqueEnrollments = filteredEnrollments.filter(e => {
          if (uniqueStudentIds.has(e.studentId)) {
            return false;
          }
          uniqueStudentIds.add(e.studentId);
          return true;
        });
        
        // Buscar alertas críticos (filtrar por disciplina se selecionada)
        const allAlerts = await db.getPendingAlerts(ctx.user.id);
        let filteredAlerts = allAlerts;
        if (input.subjectId) {
          // Filtrar alertas apenas dos alunos matriculados na disciplina selecionada
          const studentIdsInSubject = new Set(filteredEnrollments.map(e => e.studentId));
          filteredAlerts = allAlerts.filter(a => studentIdsInSubject.has(a.studentId));
        }
        const criticalAlerts = filteredAlerts.filter(a => a.severity === 'critical' || a.severity === 'urgent');
        
        // Buscar insights recentes
        const recentInsights = [];
        for (const enrollment of uniqueEnrollments.slice(0, 10)) {
          const insights = await db.getStudentInsights(enrollment.studentId, ctx.user.id, false);
          recentInsights.push(...insights.slice(0, 2));
        }
        
        return {
          totalStudents: uniqueEnrollments.length,
          criticalAlerts: criticalAlerts.length,
          recentInsights: recentInsights.slice(0, 10),
          studentsNeedingAttention: criticalAlerts.map(a => a.studentId).filter((v, i, a) => a.indexOf(v) === i).length,
        };
      }),
  }),

  // Sistema de Dúvidas e Respostas
  questions: router({
    // Enviar nova dúvida (aluno)
    submit: studentProcedure
      .input(z.object({
        subjectId: z.number(),
        classId: z.number().optional(),
        title: z.string().min(5, "Título deve ter pelo menos 5 caracteres"),
        content: z.string().min(10, "Conteúdo deve ter pelo menos 10 caracteres"),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
        isAnonymous: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.studentSession) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sessão de aluno não encontrada' });
        }
        
        const studentId = ctx.studentSession.studentId;
        const userId = ctx.studentSession.professorId;
        
        // Criar dúvida
        const questionId = await db.createQuestion({
          studentId,
          userId,
          subjectId: input.subjectId,
          classId: input.classId,
          title: input.title,
          content: input.content,
          priority: input.priority,
          isAnonymous: input.isAnonymous,
          status: 'pending',
          viewCount: 0,
        });
        
        // Buscar informações para notificação
        const student = await db.getStudentById(studentId, userId);
        const subject = await db.getSubjectById(input.subjectId, userId);
        
        // Enviar notificação para o professor
        try {
          const studentName = input.isAnonymous ? 'Aluno Anônimo' : (student?.fullName || 'Aluno');
          const subjectName = subject?.name || 'Disciplina';
          
          const { notifyOwner } = await import('./_core/notification');
          await notifyOwner({
            title: `📝 Nova Dúvida - ${subjectName}`,
            content: `**${studentName}** enviou uma dúvida:\n\n**Assunto:** ${input.title}\n\n**Prévia:** ${input.content.substring(0, 150)}${input.content.length > 150 ? '...' : ''}\n\n[Responder Agora](${ENV.appUrl}/questions/${questionId})`,
          });
        } catch (error) {
          console.error('Erro ao enviar notificação:', error);
          // Não falhar a operação se a notificação falhar
        }
        
        return { questionId, success: true };
      }),
    
    // Listar dúvidas (professor)
    list: protectedProcedure
      .input(z.object({
        status: z.enum(['pending', 'answered', 'resolved']).optional(),
        subjectId: z.number().optional(),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getQuestionsByTeacher(ctx.user.id, input);
      }),
    
    // Listar dúvidas do aluno
    listByStudent: studentProcedure
      .input(z.object({
        status: z.enum(['pending', 'answered', 'resolved']).optional(),
        subjectId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.studentSession) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sessão de aluno não encontrada' });
        }
        
        return db.getQuestionsByStudent(ctx.studentSession.studentId, input);
      }),
    
    // Obter detalhes de uma dúvida
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        // Incrementar contador de visualizações
        await db.incrementQuestionViewCount(input.id);
        
        const question = await db.getQuestionById(input.id);
        const answers = await db.getAnswersByQuestion(input.id);
        
        return { question, answers };
      }),
    
    // Responder dúvida (professor)
    answer: protectedProcedure
      .input(z.object({
        questionId: z.number(),
        content: z.string().min(10, "Resposta deve ter pelo menos 10 caracteres"),
      }))
      .mutation(async ({ ctx, input }) => {
        const answerId = await db.createQuestionAnswer({
          questionId: input.questionId,
          userId: ctx.user.id,
          content: input.content,
          isAccepted: false,
          helpful: 0,
        });
        
        return { answerId, success: true };
      }),
    
    // Marcar dúvida como resolvida (professor)
    markResolved: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.markQuestionAsResolved(input.id, ctx.user.id);
      }),
    
    // Marcar resposta como aceita (professor)
    acceptAnswer: protectedProcedure
      .input(z.object({
        answerId: z.number(),
        questionId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.markAnswerAsAccepted(input.answerId, input.questionId);
      }),
    
    // Atualizar prioridade (professor)
    updatePriority: protectedProcedure
      .input(z.object({
        id: z.number(),
        priority: z.enum(['low', 'normal', 'high', 'urgent']),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.updateQuestionPriority(input.id, input.priority, ctx.user.id);
      }),
    
    // Estatísticas de dúvidas (professor)
    statistics: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getQuestionStatistics(ctx.user.id);
      }),
  }),

  // ==================== DIÁRIO DE APRENDIZAGEM ====================
  learningJournal: router({
    // Adicionar entrada no diário
    addEntry: studentProcedure
      .input(z.object({
        topicId: z.number(),
        content: z.string().min(1, "Conteúdo é obrigatório"),
        tags: z.string().optional(),
        mood: z.enum(["great", "good", "neutral", "confused", "frustrated"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.addJournalEntry({
          studentId: ctx.studentSession.studentId,
          topicId: input.topicId,
          content: input.content,
          tags: input.tags,
          mood: input.mood,
        });
      }),

    // Buscar todas as entradas do aluno
    getMyEntries: studentProcedure
      .input(z.object({
        limit: z.number().optional().default(50),
      }))
      .query(async ({ ctx, input }) => {
        return db.getAllJournalEntries(ctx.studentSession.studentId, input.limit);
      }),

    // Buscar entradas por tópico
    getEntriesByTopic: studentProcedure
      .input(z.object({
        topicId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getJournalEntriesByTopic(ctx.studentSession.studentId, input.topicId);
      }),
  }),

  // ==================== SISTEMA DE DÚVIDAS ====================
  studentDoubts: router({
    // Enviar dúvida
    submitDoubt: studentProcedure
      .input(z.object({
        topicId: z.number(),
        professorId: z.number(),
        question: z.string().min(1, "Pergunta é obrigatória"),
        context: z.string().optional(),
        isPrivate: z.boolean().optional().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.submitDoubt({
          studentId: ctx.studentSession.studentId,
          topicId: input.topicId,
          professorId: input.professorId,
          question: input.question,
          context: input.context,
          isPrivate: input.isPrivate,
        });
      }),

    // Buscar minhas dúvidas
    getMyDoubts: studentProcedure
      .input(z.object({
        topicId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getStudentDoubts(ctx.studentSession.studentId, input.topicId);
      }),

    // Deletar dúvida
    deleteDoubt: studentProcedure
      .input(z.object({
        doubtId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteStudentDoubt(input.doubtId, ctx.studentSession.studentId);
      }),

    // Buscar dúvidas pendentes (professor)
    getPendingDoubts: protectedProcedure
      .input(z.object({
        subjectId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getPendingDoubts(ctx.user.id, input.subjectId);
      }),

    // Responder dúvida (professor)
    respondDoubt: protectedProcedure
      .input(z.object({
        doubtId: z.number(),
        answer: z.string().min(1, "Resposta é obrigatória"),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.respondDoubt(input.doubtId, input.answer, ctx.user.id);
      }),

    // Obter dicas da IA para resolver a dúvida
    getAIHints: studentProcedure
      .input(z.object({
        doubtId: z.number(),
        question: z.string(),
        context: z.string().optional(),
        subjectName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Você é um tutor educacional amigável e paciente. Seu papel é ajudar o aluno a entender o conceito por trás da dúvida, NÃO dar a resposta direta.

Regras:
1. Forneça DICAS e SUGESTÕES para guiar o raciocínio do aluno
2. Use analogias e exemplos do dia a dia quando possível
3. Divida o problema em passos menores
4. Incentive o aluno a pensar criticamente
5. Seja encorajador e positivo
6. Responda em português brasileiro
7. Limite sua resposta a 3-4 dicas principais
8. Se a dúvida for sobre um tópico específico, contextualize com a disciplina

Formato da resposta:
- Use emojis para tornar mais amigável
- Estruture em tópicos claros
- Termine com uma pergunta reflexiva para o aluno`
              },
              {
                role: "user",
                content: `Disciplina: ${input.subjectName || "Não especificada"}

Dúvida do aluno: ${input.question}

${input.context ? `Contexto adicional: ${input.context}` : ""}

Por favor, forneça dicas e sugestões para ajudar o aluno a resolver essa dúvida por conta própria.`
              }
            ],
          });

          const hints = response.choices[0]?.message?.content || "Desculpe, não consegui gerar dicas no momento. Tente novamente.";
          
          return {
            success: true,
            hints,
            doubtId: input.doubtId,
          };
        } catch (error) {
          console.error("Erro ao gerar dicas da IA:", error);
          return {
            success: false,
            hints: "Desculpe, ocorreu um erro ao gerar as dicas. Por favor, tente novamente mais tarde ou aguarde a resposta do professor.",
            doubtId: input.doubtId,
          };
        }
      }),
  }),

  // ==================== CADERNO DE EXERCÍCIOS ====================
  notebook: router({
    // Listar todas as questões respondidas (com filtros)
    getQuestions: studentProcedure
      .input(z.object({
        subjectId: z.number().optional(),
        isCorrect: z.boolean().optional(),
        markedForReview: z.boolean().optional(),
        masteryStatus: z.enum(['not_started', 'studying', 'practicing', 'mastered']).optional(),
      }))
      .query(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });
        
        const questions = await db.getStudentAnsweredQuestions(studentId, input);
        return questions;
      }),

    // Obter estatísticas do caderno
    getStats: studentProcedure
      .input(z.object({
        subjectId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });
        
        const stats = await db.getStudentNotebookStats(studentId, input.subjectId);
        return stats;
      }),

    // Marcar/desmarcar questão para revisão
    toggleReview: studentProcedure
      .input(z.object({
        answerId: z.number(),
        markedForReview: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.toggleQuestionForReview(input.answerId, input.markedForReview);
        return result;
      }),

    // Atualizar status de domínio
    updateMastery: studentProcedure
      .input(z.object({
        answerId: z.number(),
        masteryStatus: z.enum(['not_started', 'studying', 'practicing', 'mastered']),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.updateQuestionMasteryStatus(input.answerId, input.masteryStatus);
        return result;
      }),

    // Incrementar contador de revisões
    incrementReview: studentProcedure
      .input(z.object({
        answerId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.incrementQuestionReviewCount(input.answerId);
        return result;
      }),

    // Obter caderno de respostas detalhado (perguntas + respostas corretas + respostas do aluno)
    getDetailedAnswerbook: studentProcedure
      .input(z.object({
        subjectId: z.number().optional(),
        exerciseId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const studentId = ctx.studentSession.studentId;
        if (!studentId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Student ID not found" });
        
        const questions = await db.getStudentAnsweredQuestions(studentId, { subjectId: input.subjectId });
        
        // Filtrar por exercício se especificado
        const filteredQuestions = input.exerciseId 
          ? questions.filter(q => q.exerciseId === input.exerciseId)
          : questions;
        
        // Agrupar por exercício
        const groupedByExercise = filteredQuestions.reduce((acc, question) => {
          const exerciseId = question.exerciseId || 0;
          if (!acc[exerciseId]) {
            acc[exerciseId] = {
              exerciseId,
              exerciseTitle: question.exerciseTitle || 'Exercício sem título',
              subjectId: question.subjectId,
              questions: [],
            };
          }
          acc[exerciseId].questions.push({
            answerId: question.answerId,
            questionNumber: question.questionNumber,
            questionText: question.questionText,
            questionType: question.questionType,
            options: question.options,
            studentAnswer: question.studentAnswer,
            correctAnswer: question.correctAnswer || null,
            isCorrect: question.isCorrect,
            pointsAwarded: question.pointsAwarded,
            attemptDate: question.attemptDate || question.createdAt,
          });
          return acc;
        }, {} as Record<number, any>);
        
        return Object.values(groupedByExercise);
      }),

    // Gerar feedback e sugestões de estudo com IA
    generateStudyMaterial: studentProcedure
      .input(z.object({
        answerId: z.number(),
        questionText: z.string(),
        studentAnswer: z.string(),
        correctAnswer: z.string(),
        questionType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Gerar materiais de estudo com IA
        const prompt = `Você é um tutor educacional especializado. Analise esta questão respondida incorretamente pelo aluno e forneça materiais de estudo personalizados.

Questão: ${input.questionText}
Resposta do aluno: ${input.studentAnswer}
Resposta correta: ${input.correctAnswer}
Tipo: ${input.questionType}

Forneça:
1. Explicação detalhada do conceito
2. Estratégia de como estudar este tópico
3. Conceitos relacionados (lista)
4. Recursos adicionais (links, vídeos, artigos)
5. Exemplos práticos para praticar
6. Erros comuns neste tipo de questão
7. Tempo estimado para dominar (em minutos)
8. Nível de dificuldade (1-5)`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: 'system', content: 'Você é um tutor educacional que cria materiais de estudo personalizados.' },
              { role: 'user', content: prompt },
            ],
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'study_material',
                strict: true,
                schema: {
                  type: 'object',
                  properties: {
                    detailedExplanation: { type: 'string' },
                    studyStrategy: { type: 'string' },
                    relatedConcepts: { 
                      type: 'array',
                      items: { type: 'string' }
                    },
                    additionalResources: { 
                      type: 'array',
                      items: { 
                        type: 'object',
                        properties: {
                          title: { type: 'string' },
                          url: { type: 'string' },
                          type: { type: 'string' }
                        },
                        required: ['title', 'url', 'type'],
                        additionalProperties: false
                      }
                    },
                    practiceExamples: { 
                      type: 'array',
                      items: { type: 'string' }
                    },
                    commonMistakes: { type: 'string' },
                    timeToMaster: { type: 'integer' },
                    difficultyLevel: { type: 'integer' },
                  },
                  required: ['detailedExplanation', 'studyStrategy', 'relatedConcepts', 'additionalResources', 'practiceExamples', 'commonMistakes', 'timeToMaster', 'difficultyLevel'],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = response.choices[0]?.message?.content;
          if (!content || typeof content !== 'string') {
            throw new Error('Resposta vazia da IA');
          }

          const material = JSON.parse(content);
          
          // Salvar no banco de dados
          const db_instance = await getDb();
          if (!db_instance) throw new Error("Database not available");
          
          await db_instance
            .update(studentExerciseAnswers)
            .set({
              detailedExplanation: material.detailedExplanation,
              studyStrategy: material.studyStrategy,
              relatedConcepts: JSON.stringify(material.relatedConcepts),
              additionalResources: JSON.stringify(material.additionalResources),
              practiceExamples: JSON.stringify(material.practiceExamples),
              commonMistakes: material.commonMistakes,
              timeToMaster: material.timeToMaster,
              difficultyLevel: material.difficultyLevel,
            })
            .where(eq(studentExerciseAnswers.id, input.answerId));
          
          return { success: true, material };
        } catch (error) {
          console.error('[Notebook] Error generating study material:', error);
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: 'Erro ao gerar materiais de estudo' 
          });
        }
      }),
  }),

  // Caderno de Erros e Acertos com IA
  mistakeNotebook: router({
    // Criar nova questão no caderno
    createQuestion: studentProcedure
      .input(z.object({
        subject: z.string(),
        topic: z.string(),
        difficulty: z.enum(['easy', 'medium', 'hard']),
        source: z.string().optional(),
        questionText: z.string(),
        questionImage: z.string().optional(),
        correctAnswer: z.string(),
        explanation: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.studentSession?.studentId) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const questionId = await db.createMistakeNotebookQuestion({
          studentId: ctx.studentSession.studentId,
          subject: input.subject,
          topic: input.topic,
          difficulty: input.difficulty,
          source: input.source,
          questionText: input.questionText,
          questionImage: input.questionImage,
          correctAnswer: input.correctAnswer,
          explanation: input.explanation,
          tags: input.tags ? JSON.stringify(input.tags) : null,
        });
        
        return { questionId };
      }),
    
    // Listar questões do caderno
    listQuestions: studentProcedure
      .input(z.object({
        subject: z.string().optional(),
        topic: z.string().optional(),
        difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.studentSession?.studentId) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const questions = await db.getMistakeNotebookQuestions(
          ctx.studentSession.studentId,
          input
        );
        
        return questions.map(q => ({
          ...q,
          tags: q.tags ? JSON.parse(q.tags) : [],
        }));
      }),
    
    // Obter questão por ID
    getQuestion: studentProcedure
      .input(z.object({ questionId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.studentSession?.studentId) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const question = await db.getMistakeNotebookQuestionById(
          input.questionId,
          ctx.studentSession.studentId
        );
        
        if (!question) throw new TRPCError({ code: 'NOT_FOUND' });
        
        return {
          ...question,
          tags: question.tags ? JSON.parse(question.tags) : [],
        };
      }),
    
    // Registrar tentativa de resposta
    createAttempt: studentProcedure
      .input(z.object({
        questionId: z.number(),
        studentAnswer: z.string(),
        isCorrect: z.boolean(),
        errorType: z.string().optional(),
        studentNotes: z.string().optional(),
        timeSpent: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.studentSession?.studentId) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const attemptId = await db.createMistakeNotebookAttempt({
          questionId: input.questionId,
          studentId: ctx.studentSession.studentId,
          studentAnswer: input.studentAnswer,
          isCorrect: input.isCorrect,
          errorType: input.errorType,
          studentNotes: input.studentNotes,
          timeSpent: input.timeSpent,
        });
        
        return { attemptId };
      }),
    
    // Listar tentativas de uma questão
    listAttempts: studentProcedure
      .input(z.object({ questionId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.studentSession?.studentId) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        return await db.getMistakeNotebookAttempts(
          input.questionId,
          ctx.studentSession.studentId
        );
      }),
    
    // Atualizar status de revisão
    updateReviewStatus: studentProcedure
      .input(z.object({
        attemptId: z.number(),
        status: z.enum(['pending', 'reviewed', 'mastered']),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.studentSession?.studentId) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        await db.updateAttemptReviewStatus(input.attemptId, input.status);
        return { success: true };
      }),
    
    // Obter tópicos
    listTopics: studentProcedure
      .input(z.object({ subject: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.studentSession?.studentId) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        return await db.getMistakeNotebookTopics(
          ctx.studentSession.studentId,
          input.subject
        );
      }),
    
    // Obter estatísticas gerais
    getStats: studentProcedure
      .query(async ({ ctx }) => {
        if (!ctx.studentSession?.studentId) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        return await db.getMistakeNotebookStats(ctx.studentSession.studentId);
      }),
    
    // Analisar padrões com IA
    analyzePatterns: studentProcedure
      .input(z.object({ subject: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.studentSession?.studentId) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const topics = await db.getMistakeNotebookTopics(
          ctx.studentSession.studentId,
          input.subject
        );
        
        if (topics.length === 0) {
          return {
            patterns: [],
            summary: 'Ainda não há dados suficientes para análise.',
          };
        }
        
        // Gerar análise com IA
        const prompt = `Analise os seguintes tópicos de estudo de um aluno e identifique padrões de erro:

${topics.map(t => `- ${t.topicName} (${t.subject}): ${t.errorRate.toFixed(1)}% de erro, ${t.totalQuestions} questões`).join('\n')}

Identifique:
1. Padrões de dificuldade (quais tipos de tópicos têm mais erros)
2. Áreas que precisam de mais atenção
3. Possíveis lacunas de conhecimento

Retorne uma análise clara e objetiva.`;
        
        try {
          const response = await invokeLLM({
            messages: [
              { role: 'system', content: 'Você é um tutor educacional especializado em identificar padrões de aprendizagem.' },
              { role: 'user', content: prompt },
            ],
          });
          
          const analysis = typeof response.choices[0]?.message?.content === 'string'
            ? response.choices[0].message.content
            : 'Análise não disponível.';
          
          // Salvar insight
          await db.createMistakeNotebookInsight({
            studentId: ctx.studentSession.studentId,
            insightType: 'pattern_analysis',
            title: 'Análise de Padrões de Erro',
            content: analysis,
            data: JSON.stringify({ topics }),
            relevanceScore: 85,
          });
          
          return {
            patterns: topics.filter(t => t.errorRate > 50),
            summary: analysis,
          };
        } catch (error) {
          console.error('Error analyzing patterns:', error);
          return {
            patterns: topics.filter(t => t.errorRate > 50),
            summary: 'Erro ao gerar análise. Por favor, tente novamente.',
          };
        }
      }),
    
    // Gerar sugestões personalizadas
    generateSuggestions: studentProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.studentSession?.studentId) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const stats = await db.getMistakeNotebookStats(ctx.studentSession.studentId);
        const topics = await db.getMistakeNotebookTopics(ctx.studentSession.studentId);
        
        if (topics.length === 0) {
          return {
            suggestions: ['Comece registrando suas primeiras questões no caderno!'],
          };
        }
        
        const criticalTopics = topics.filter(t => t.priority === 'critical' || t.priority === 'high');
        
        const prompt = `Com base no desempenho do aluno:

- Taxa de sucesso geral: ${stats.successRate.toFixed(1)}%
- Total de questões: ${stats.totalQuestions}
- Tópicos críticos: ${criticalTopics.map(t => t.topicName).join(', ')}

Gere 5 sugestões práticas e específicas de estudo para melhorar o desempenho. Seja objetivo e motivador.`;
        
        try {
          const response = await invokeLLM({
            messages: [
              { role: 'system', content: 'Você é um tutor educacional que cria sugestões de estudo personalizadas.' },
              { role: 'user', content: prompt },
            ],
          });
          
          const suggestionsText = typeof response.choices[0]?.message?.content === 'string' 
            ? response.choices[0].message.content 
            : '';
          const suggestions = suggestionsText.split('\n').filter(s => s.trim().length > 0);
          
          // Salvar insight
          await db.createMistakeNotebookInsight({
            studentId: ctx.studentSession.studentId,
            insightType: 'study_suggestion',
            title: 'Sugestões Personalizadas de Estudo',
            content: suggestionsText,
            data: JSON.stringify({ stats, criticalTopics }),
            relevanceScore: 90,
          });
          
          return { suggestions };
        } catch (error) {
          console.error('Error generating suggestions:', error);
          return {
            suggestions: [
              'Revise os tópicos com maior taxa de erro',
              'Pratique mais questões dos temas difíceis',
              'Faça revisões periódicas',
            ],
          };
        }
      }),
    
    // Criar plano de estudos
    createStudyPlan: studentProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
        focusSubjects: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.studentSession?.studentId) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const topics = await db.getMistakeNotebookTopics(ctx.studentSession.studentId);
        const priorityTopics = topics
          .filter(t => t.priority === 'critical' || t.priority === 'high')
          .sort((a, b) => b.errorRate - a.errorRate)
          .slice(0, 10);
        
        if (priorityTopics.length === 0) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Não há tópicos suficientes para criar um plano de estudos.' 
          });
        }
        
        const prompt = `Crie um plano de estudos detalhado de ${input.startDate} até ${input.endDate} focando nestes tópicos:

${priorityTopics.map((t, i) => `${i + 1}. ${t.topicName} (${t.subject}) - ${t.errorRate.toFixed(1)}% de erro`).join('\n')}

O plano deve:
- Distribuir os tópicos ao longo do período
- Incluir tempo para revisão
- Ser realista e executável
- Incluir tarefas específicas

Retorne em formato JSON com estrutura:
{
  "tasks": [
    { "date": "YYYY-MM-DD", "topic": "nome", "description": "o que fazer", "duration": "tempo em minutos" }
  ]
}`;
        
        try {
          const response = await invokeLLM({
            messages: [
              { role: 'system', content: 'Você é um planejador educacional especializado.' },
              { role: 'user', content: prompt },
            ],
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'study_plan',
                strict: true,
                schema: {
                  type: 'object',
                  properties: {
                    tasks: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          date: { type: 'string' },
                          topic: { type: 'string' },
                          description: { type: 'string' },
                          duration: { type: 'string' },
                        },
                        required: ['date', 'topic', 'description', 'duration'],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ['tasks'],
                  additionalProperties: false,
                },
              },
            },
          });
          
          const content = response.choices[0]?.message?.content;
          if (!content || typeof content !== 'string') throw new Error('Empty response');
          
          const planData = JSON.parse(content);
          
          const planId = await db.createMistakeNotebookStudyPlan({
            studentId: ctx.studentSession.studentId,
            title: `Plano de Estudos - ${input.startDate} a ${input.endDate}`,
            description: `Plano focado em ${priorityTopics.length} tópicos prioritários`,
            startDate: new Date(input.startDate),
            endDate: new Date(input.endDate),
            planData: JSON.stringify(planData),
            totalTasks: planData.tasks.length,
            completedTasks: 0,
            progressPercentage: 0,
          });
          
          return { planId, plan: planData };
        } catch (error) {
          console.error('Error creating study plan:', error);
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: 'Erro ao criar plano de estudos. Tente novamente.' 
          });
        }
      }),
    
    // Listar planos de estudo
    listStudyPlans: studentProcedure
      .input(z.object({ status: z.enum(['active', 'completed', 'abandoned']).optional() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.studentSession?.studentId) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const plans = await db.getMistakeNotebookStudyPlans(
          ctx.studentSession.studentId,
          input.status
        );
        
        return plans.map(p => ({
          ...p,
          planData: p.planData ? JSON.parse(p.planData) : null,
        }));
      }),
    
    // Atualizar progresso do plano
    updatePlanProgress: studentProcedure
      .input(z.object({
        planId: z.number(),
        completedTasks: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.studentSession?.studentId) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        await db.updateStudyPlanProgress(input.planId, input.completedTasks);
        return { success: true };
      }),
    
    // Listar insights
    listInsights: studentProcedure
      .input(z.object({
        insightType: z.enum(['pattern_analysis', 'study_suggestion', 'question_recommendation', 'progress_report']).optional(),
        onlyUnread: z.boolean().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.studentSession?.studentId) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        const insights = await db.getMistakeNotebookInsights(
          ctx.studentSession.studentId,
          input
        );
        
        return insights.map(i => ({
          ...i,
          data: i.data ? JSON.parse(i.data) : null,
        }));
      }),
    
    // Marcar insight como lido
    markInsightRead: studentProcedure
      .input(z.object({ insightId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.studentSession?.studentId) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        await db.markInsightAsRead(input.insightId);
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Analisar resposta de exercício de PC usando IA
 */
async function analyzeCTAnswer(params: {
  answer: string;
  expectedAnswer: string;
  dimension: string;
}): Promise<{ score: number; feedback: string }> {
  const { answer, expectedAnswer, dimension } = params;

  const prompts: Record<string, string> = {
    decomposition: `Avalie esta resposta sobre DECOMPOSIÇÃO (quebrar problemas em partes menores):

Resposta do aluno: "${answer}"
Resposta esperada: "${expectedAnswer}"

Critérios:
- Identificou corretamente as partes do problema?
- Organizou as partes de forma lógica?
- Demonstrou compreensão de como dividir complexidade?

Retorne JSON com:
- score: pontuação de 0-100
- feedback: texto explicativo (máximo 200 caracteres)`,

    pattern_recognition: `Avalie esta resposta sobre RECONHECIMENTO DE PADRÕES:

Resposta do aluno: "${answer}"
Resposta esperada: "${expectedAnswer}"

Critérios:
- Identificou padrões relevantes?
- Explicou as similaridades encontradas?
- Aplicou o padrão corretamente?

Retorne JSON com:
- score: pontuação de 0-100
- feedback: texto explicativo (máximo 200 caracteres)`,

    abstraction: `Avalie esta resposta sobre ABSTRAÇÃO (focar no essencial, ignorar detalhes):

Resposta do aluno: "${answer}"
Resposta esperada: "${expectedAnswer}"

Critérios:
- Identificou os elementos essenciais?
- Removeu detalhes irrelevantes?
- Criou uma representação simplificada?

Retorne JSON com:
- score: pontuação de 0-100
- feedback: texto explicativo (máximo 200 caracteres)`,

    algorithms: `Avalie esta resposta sobre ALGORITMOS (sequência de passos):

Resposta do aluno: "${answer}"
Resposta esperada: "${expectedAnswer}"

Critérios:
- Definiu passos claros e ordenados?
- A sequência resolve o problema?
- É eficiente e lógica?

Retorne JSON com:
- score: pontuação de 0-100
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
