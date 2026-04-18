import { COOKIE_NAME, STUDENT_COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, studentProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import bcrypt from "bcryptjs";
import { tasks, studentExerciseAnswers, subjects, accessLogs, accessLogArchives, classes, studentClassEnrollments, subjectEnrollments, learningModules, students, pushNotificationQueue } from "../drizzle/schema";
import { and, eq, sql, gte, lt, lte, desc, inArray, ne, or, isNull, isNotNull, between } from "drizzle-orm";
import { getDb } from "./db";
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { createSessionToken as createStandaloneSession } from "./_core/auth-standalone";
import { TRPCError } from "@trpc/server";
import { invokeLLM, invalidateAISettingsCache } from './_core/llm';
import { sendPasswordResetEmail } from './_core/email';
import { emailRouter } from './email-router';
import { activitiesRouter } from './activities-router';
import { muralRouter } from './mural-router';
import { handleAsync, validateExists, validateOwnership } from "./errorHandler";
import { createCachedQuery } from "./queryOptimizer";
import * as pushNotif from './push-notifications';
import { 
  listBackups, 
  createBackupRecord, 
  updateBackupStatus, 
  deleteBackup, 
  getBackupSchedule, 
  upsertBackupSchedule,
  listVPSServers,
  createVPSServer,
  deleteVPSServer,
  getVPSServerByToken,
  insertVPSMetrics,
  getVPSMetrics,
  getVPSMetricsByPeriod,
  getLatestVPSMetric,
  updateVPSServerLastSeen,
  getVPSAlerts,
  createVPSAlert,
  deleteVPSAlert,
  updateVPSAlertTriggered,
} from './db';
// Importar pdfjs-dist para extração de texto do PDF
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

/**
 * Converte um Date (UTC ou qualquer) para o horário de Manaus (UTC-4).
 * Retorna um novo Date cujos métodos getUTC*() refletem a hora local de Manaus.
 * Manaus NÃO tem horário de verão — sempre UTC-4.
 */
function toManaus(date: Date): Date {
  return new Date(date.getTime() - 4 * 60 * 60 * 1000);
}

/**
 * Formata um Date UTC para string legível em horário de Manaus.
 * Ex: "2026-03-15 14:30:00"
 */
function formatManaus(date: Date): string {
  const m = toManaus(date);
  return m.toISOString().replace('T', ' ').slice(0, 19);
}

// Função auxiliar para nomear páginas do PDF por mês
function getMesNome(pageNum: number): string {
  // O calendário acadêmico geralmente tem 2-3 meses por página
  // Retornamos o número da página como referência
  return `PAGINA ${pageNum}`;
}

// Função auxiliar para extrair eventos com LLM (fallback)
async function extractEventsWithLLM(pdfText: string, calendarYear: number): Promise<Array<{title: string; description: string; eventDate: string; eventType: 'holiday' | 'commemorative' | 'school_event' | 'personal'}>> {
  const response = await invokeLLM({
    feature: 'extract_calendar_events',
    messages: [
      {
        role: "system",
        content: `Voce e um assistente especializado em extrair eventos de calendarios academicos brasileiros. Responda APENAS em JSON valido.
O texto esta organizado por MES (JANEIRO, FEVEREIRO, MARCO, etc). Cada evento tem um numero de dia seguido de traco e o nome.
A data do evento = DIA do texto + MES da secao + ANO do calendario (${calendarYear}).

REGRAS CRITICAS:
1. Preste MUITA ATENCAO ao mes de cada secao. Se esta na secao MAIO, o dia 01 = ${calendarYear}-05-01.
2. Feriados nacionais DEVEM estar nas datas corretas:
   - 01/01 Confraternizacao Universal, 21/04 Tiradentes, 01/05 Dia do Trabalhador
   - 07/09 Independencia, 12/10 N.S. Aparecida, 02/11 Finados
   - 15/11 Proclamacao da Republica, 20/11 Consciencia Negra, 25/12 Natal
3. Para periodos (ex: "02 a 13 - Ajuste"), crie UM evento com a data do PRIMEIRO dia.
4. NAO invente eventos. Extraia SOMENTE o que esta escrito no texto.
5. Classificacao: "holiday" = feriados/pontos facultativos, "commemorative" = datas comemorativas, "school_event" = eventos academicos
6. Ignore linhas de "Dias Letivos" e "Total semestre".
7. Formato eventDate: YYYY-MM-DD.`
      },
      {
        role: "user",
        content: `Extraia todos os eventos deste calendario academico de ${calendarYear}:\n\n${pdfText.slice(0, 15000)}`
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
  
  // Validar eventos do LLM
  return parsedResult.events.filter((event: any) => {
    if (!event.eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(event.eventDate)) return false;
    const eventYear = parseInt(event.eventDate.substring(0, 4));
    if (eventYear !== calendarYear) {
      event.eventDate = `${calendarYear}${event.eventDate.substring(4)}`;
    }
    const month = parseInt(event.eventDate.substring(5, 7));
    const day = parseInt(event.eventDate.substring(8, 10));
    return month >= 1 && month <= 12 && day >= 1 && day <= 31;
  });
}

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
      // Definir cookie de "logout explícito" para prevenir auto-login imediato
      ctx.res.cookie('EXPLICIT_LOGOUT', 'true', { ...cookieOptions, maxAge: 60 * 1000 }); // 1 minuto
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

          // Registrar log de acesso do aluno
          try {
            const database = await getDb();
            const ip = (ctx.req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || ctx.req.socket?.remoteAddress || 'desconhecido';
            await database!.insert(accessLogs).values({
              userType: 'student',
              studentId: student.id,
              userName: student.fullName,
              ipAddress: ip,
              userAgent: ctx.req.headers['user-agent'] || null,
              accessedAt: new Date(),
            });
          } catch (_logErr) {
            // Falha no log não deve impedir o login
          }

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
        // Registrar log de acesso do professor
        try {
          const database = await getDb();
          const ip = (ctx.req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || ctx.req.socket?.remoteAddress || 'desconhecido';
          await database!.insert(accessLogs).values({
            userType: 'teacher',
            userId: user.id,
            userName: user.name || user.email || 'Professor',
            ipAddress: ip,
            userAgent: ctx.req.headers['user-agent'] || null,
            accessedAt: new Date(),
          });
        } catch (_logErr) {
          // Falha no log não deve impedir o login
        }
        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };;
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

    // Definir senha para conta que usa login com Google
    setPasswordForGoogleAccount: protectedProcedure
      .input(z.object({
        newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
        confirmPassword: z.string().min(6, "Confirma\u00e7\u00e3o de senha deve ter pelo menos 6 caracteres"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Validar se as senhas coincidem
        if (input.newPassword !== input.confirmPassword) {
          throw new Error("As senhas n\u00e3o coincidem");
        }

        // Buscar usu\u00e1rio
        const users = await db.getAllUsers();
        const user = users.find(u => u.id === ctx.user.id);

        if (!user) {
          throw new Error("Usu\u00e1rio n\u00e3o encontrado");
        }

        // Verificar se \u00e9 conta Google
        if (user.loginMethod !== 'google') {
          throw new Error("Esta fun\u00e7\u00e3o \u00e9 apenas para contas que usam login com Google");
        }

        // Hash da nova senha
        const passwordHash = await bcrypt.hash(input.newPassword, 10);

        // Atualizar senha e mudar loginMethod para 'email'
        const updated = await db.migrateGoogleAccountToEmail(ctx.user.id, passwordHash);
        
        if (!updated) {
          throw new Error("Erro ao definir senha");
        }

        return { success: true, message: "Senha definida com sucesso! Agora voc\u00ea pode fazer login com email e senha." };
      }),
  }),

  subjects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getSubjectsByUserId(ctx.user.id);
    }),
    // Listar disciplinas com turmas vinculadas (via scheduledClasses)
    listWithClass: protectedProcedure.query(async ({ ctx }) => {
      const db_instance = await db.getDb();
      if (!db_instance) throw new Error('Database not available');
      const { subjects: subjectsTable, scheduledClasses, classes: classesTable } = await import('../drizzle/schema');
      // Buscar disciplinas do professor com turmas vinculadas via scheduledClasses
      const rows = await db_instance
        .select({
          subjectId: subjectsTable.id,
          subjectName: subjectsTable.name,
          subjectColor: subjectsTable.color,
          classId: classesTable.id,
          className: classesTable.name,
        })
        .from(subjectsTable)
        .leftJoin(scheduledClasses, eq(scheduledClasses.subjectId, subjectsTable.id))
        .leftJoin(classesTable, eq(classesTable.id, scheduledClasses.classId))
        .where(eq(subjectsTable.userId, ctx.user.id))
        .groupBy(subjectsTable.id, classesTable.id)
        .orderBy(subjectsTable.name, classesTable.name);
      // Retornar combinações únicas disciplina+turma
      return rows.map(r => ({
        id: r.subjectId,
        name: r.subjectName,
        color: r.subjectColor,
        classId: r.classId,
        className: r.className,
        // Label para exibição no filtro: "Disciplina — Turma" ou só "Disciplina" se sem turma
        label: r.className ? `${r.subjectName} — ${r.className}` : r.subjectName,
        // Chave única para o filtro (subjectId:classId ou só subjectId)
        filterKey: r.classId ? `${r.subjectId}:${r.classId}` : `${r.subjectId}`,
      }));
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
        try {
          console.log('[subjects.create] Usuário:', ctx.user.id, ctx.user.email);
          console.log('[subjects.create] Input recebido:', JSON.stringify(input, null, 2));
          
          // Gerar code único para evitar conflito UNIQUE
          const baseCode = (input.code || input.name).trim().substring(0, 150);
          const uniqueSuffix = Date.now().toString(36).toUpperCase();
          const uniqueCode = `${baseCode}-${uniqueSuffix}`;
          
          const result = await db.createSubject({
            ...input,
            code: uniqueCode,
            userId: ctx.user.id,
          });
          
          console.log('[subjects.create] Disciplina criada com sucesso:', result.id);
          return { success: true };
        } catch (error: any) {
          console.error('[subjects.create] Erro na criação:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Erro ao criar disciplina: ${error.message}`,
            cause: error,
          });
        }
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
        code: z.string().min(1).optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Gerar code único para evitar conflito UNIQUE
        const baseCode = (input.code || input.name).trim().substring(0, 150);
        const uniqueSuffix = Date.now().toString(36).toUpperCase();
        const uniqueCode = `${baseCode}-${uniqueSuffix}`;
        await db.createClass({
          name: input.name,
          code: uniqueCode,
          description: input.description,
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

      // Usar timezone do Brasil (GMT-3)
      const now = new Date();
      const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      const currentTime = `${String(brazilTime.getHours()).padStart(2, '0')}:${String(brazilTime.getMinutes()).padStart(2, '0')}`;
      const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      
      // Calcular aulas dos próximos 7 dias para garantir que sempre há uma próxima aula
      const upcomingClasses = [];
      
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(brazilTime);
        checkDate.setDate(brazilTime.getDate() + i);
        const dayOfWeek = checkDate.getDay();
        const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        
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
      const todayStr = `${brazilTime.getFullYear()}-${String(brazilTime.getMonth() + 1).padStart(2, '0')}-${String(brazilTime.getDate()).padStart(2, '0')}`;
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

      // Usar timezone do Brasil (GMT-3)
      const now = new Date();
      const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      const currentTime = `${String(brazilTime.getHours()).padStart(2, '0')}:${String(brazilTime.getMinutes()).padStart(2, '0')}`;
      const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      
      // Buscar apenas aulas do dia atual (todas, passadas e futuras)
      const todayClasses = [];
      const checkDate = new Date(brazilTime);
      const dayOfWeek = checkDate.getDay();
      const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      
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
        dayOfWeek: z.number().min(0).max(6), // 0=domingo, 1=segunda, ..., 6=sábado
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
    
    swap: protectedProcedure
      .input(z.object({
        classAId: z.number(),
        classBId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Buscar ambas as aulas
        const classA = await db.getScheduledClassById(input.classAId, ctx.user.id);
        const classB = await db.getScheduledClassById(input.classBId, ctx.user.id);
        
        if (!classA || !classB) {
          throw new Error("Uma ou ambas as aulas não foram encontradas");
        }
        
        // Trocar posições atomicamente (sem verificação de conflito entre elas)
        await Promise.all([
          db.updateScheduledClass(input.classAId, ctx.user.id, {
            timeSlotId: classB.timeSlotId,
            dayOfWeek: classB.dayOfWeek,
          }),
          db.updateScheduledClass(input.classBId, ctx.user.id, {
            timeSlotId: classA.timeSlotId,
            dayOfWeek: classA.dayOfWeek,
          }),
        ]);
        
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
        // Usar strings YYYY-MM-DD para comparação, evitando timezone issues
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const threeDaysLater = new Date(now);
        threeDaysLater.setDate(now.getDate() + 3);
        const threeDaysStr = `${threeDaysLater.getFullYear()}-${String(threeDaysLater.getMonth() + 1).padStart(2, '0')}-${String(threeDaysLater.getDate()).padStart(2, '0')}`;
        
        const allEvents = await db.getCalendarEventsByYear(ctx.user.id, now.getFullYear());
        
        return allEvents.filter((event: any) => {
          return event.eventDate >= todayStr && event.eventDate < threeDaysStr;
        }).sort((a: any, b: any) => a.eventDate.localeCompare(b.eventDate));
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
        const { parseCalendarText, detectCalendarYear, extractStructuredText } = await import('./calendar-parser.js');
        
        console.log('[importFromPDF] Iniciando extração de eventos do PDF (parser determinístico v2)...');
        
        try {
          // Converter base64 para buffer
          const pdfBuffer = Buffer.from(input.pdfBase64, 'base64');
          
          // Extrair texto do PDF usando pdfjs-dist com informação de posição
          console.log('[importFromPDF] Extraindo texto do PDF com posições...');
          const uint8Array = new Uint8Array(pdfBuffer.buffer, pdfBuffer.byteOffset, pdfBuffer.byteLength);
          const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
          const pdfDocument = await loadingTask.promise;
          
          // Coletar itens com posição para separação de colunas
          const pages: Array<{items: Array<{str: string; transform: number[]}>}> = [];
          let rawText = ''; // Texto bruto para detecção de ano
          
          for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
            const page = await pdfDocument.getPage(pageNum);
            const textContent = await page.getTextContent();
            const items = (textContent.items as any[]).map((item: any) => ({
              str: item.str,
              transform: item.transform,
            }));
            pages.push({ items });
            rawText += items.map((it: any) => it.str).join(' ') + '\n';
          }
          
          // Detectar o ano do calendário
          const calendarYear = detectCalendarYear(rawText);
          console.log('[importFromPDF] Ano detectado:', calendarYear);
          
          // Extrair texto estruturado com separação de colunas
          const structuredText = extractStructuredText(pages);
          console.log('[importFromPDF] Texto estruturado:', structuredText.length, 'caracteres');
          
          // Parser determinístico com texto estruturado
          let events = parseCalendarText(structuredText, calendarYear);
          console.log('[importFromPDF] Parser determinístico extraiu:', events.length, 'eventos');
          
          // Se o parser extraiu poucos eventos (< 20), tentar com LLM como complemento
          if (events.length < 20) {
            console.log('[importFromPDF] Poucos eventos extraídos, usando LLM como complemento...');
            try {
              const llmEvents = await extractEventsWithLLM(structuredText, calendarYear);
              console.log('[importFromPDF] LLM extraiu:', llmEvents.length, 'eventos adicionais');
              
              const existingDates = new Map<string, Set<string>>();
              for (const e of events) {
                if (!existingDates.has(e.eventDate)) {
                  existingDates.set(e.eventDate, new Set());
                }
                existingDates.get(e.eventDate)!.add(e.title.toLowerCase().substring(0, 30));
              }
              
              for (const llmEvent of llmEvents) {
                const dateSet = existingDates.get(llmEvent.eventDate);
                const titleNorm = llmEvent.title.toLowerCase().substring(0, 30);
                if (!dateSet || !dateSet.has(titleNorm)) {
                  events.push(llmEvent);
                  if (!existingDates.has(llmEvent.eventDate)) {
                    existingDates.set(llmEvent.eventDate, new Set());
                  }
                  existingDates.get(llmEvent.eventDate)!.add(titleNorm);
                }
              }
              
              console.log('[importFromPDF] Total após mesclagem:', events.length, 'eventos');
            } catch (llmError: any) {
              console.warn('[importFromPDF] LLM falhou, usando apenas parser determinístico:', llmError.message);
            }
          }
          
          // Ordenar por data
          events.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
          
          console.log('[importFromPDF] Eventos finais:', events.length);
          
          // Log de amostra para verificação
          const feriados = events.filter(e => e.eventType === 'holiday');
          console.log('[importFromPDF] Feriados encontrados:', feriados.length);
          feriados.forEach(f => console.log(`  ${f.eventDate}: ${f.title}`));
          
          return events;
        } catch (error: any) {
          console.error('[importFromPDF] Erro ao processar PDF:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Erro ao processar PDF: ${error.message}`,
          });
        }
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
      
    exportToICS: protectedProcedure
      .input(z.object({
        year: z.number(),
        includeSchedule: z.boolean().default(false),
        eventTypes: z.array(z.enum(["holiday", "commemorative", "school_event", "personal"])).optional(),
      }))
      .query(async ({ ctx, input }) => {
        const { generateICSContent } = await import("./ics-generator.js");
        
        const events = await db.getCalendarEventsByYear(ctx.user.id, input.year);
        const filteredEvents = input.eventTypes
          ? events.filter((e: any) => input.eventTypes!.includes(e.eventType))
          : events;
        
        const icsEvents: any[] = filteredEvents.map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          eventDate: e.eventDate,
          eventType: e.eventType,
        }));
        
        let scheduleCount = 0;
        
        if (input.includeSchedule) {
          const [scList, subList, clsList, tsList] = await Promise.all([
            db.getScheduledClassesByUserId(ctx.user.id),
            db.getSubjectsByUserId(ctx.user.id),
            db.getClassesByUserId(ctx.user.id),
            db.getTimeSlotsByUserId(ctx.user.id),
          ]);
          
          // Usar datas com T12:00:00 para evitar timezone shift
          const startDate = new Date(`${input.year}-01-01T12:00:00`);
          const endDate = new Date(`${input.year}-12-31T12:00:00`);
          // Helper para formatar data local como YYYY-MM-DD
          const formatLocalDate = (d: Date) => {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          };
          
          for (const sc of scList) {
            const subject = subList.find((s: any) => s.id === sc.subjectId);
            const cls = clsList.find((c: any) => c.id === sc.classId);
            const ts = tsList.find((t: any) => t.id === sc.timeSlotId);
            if (!subject || !ts) continue;
            
            // dayOfWeek no banco: 1=Segunda, 2=Terça, ..., 6=Sábado (coincide com JS getDay())
            const targetDay = sc.dayOfWeek;
            const current = new Date(startDate);
            while (current <= endDate) {
              if (current.getDay() === targetDay) {
                icsEvents.push({
                  title: `${subject.name}${cls ? ` - ${cls.name}` : ""}`,
                  description: sc.notes || `Aula de ${subject.name}${cls ? ` para turma ${cls.name}` : ""}`,
                  eventDate: formatLocalDate(current),
                  startTime: ts.startTime,
                  endTime: ts.endTime,
                  eventType: "schedule",
                });
                scheduleCount++;
              }
              current.setDate(current.getDate() + 1);
            }
          }
        }
        
        const icsContent = generateICSContent(icsEvents, input.year);
        
        return {
          icsContent,
          totalEvents: icsEvents.length,
          calendarEvents: filteredEvents.length,
          scheduleEvents: scheduleCount,
        };
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

    // Salvar tema de cores do usuário no banco de dados
    saveTheme: protectedProcedure
      .input(z.object({
        colorTheme: z.string().max(32),
        themeMode: z.string().max(16),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await database.execute(
          sql`UPDATE users SET colorTheme = ${input.colorTheme}, themeMode = ${input.themeMode} WHERE id = ${ctx.user.id}`
        );
        return { success: true };
      }),

    // Buscar tema de cores do usuário
    getTheme: protectedProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const result = await database.execute(
        sql`SELECT colorTheme, themeMode FROM users WHERE id = ${ctx.user.id} LIMIT 1`
      ) as any;
      const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : (Array.isArray(result) ? result : []);
      const row = rows[0];
      return {
        colorTheme: row?.colorTheme || 'default',
        themeMode: row?.themeMode || 'system',
      };
    }),
  }),

  admin: router({
    listUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Acesso negado: apenas administradores');
      }
      return db.getAllUsers();
    }),

    // Listagem paginada de usuários (otimização VPS)
    listUsersPaginated: protectedProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        return db.getUsersPaginated(input.page, input.limit, input.search);
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

    // ==================== CONFIGURAÇÕES DO SISTEMA ====================
    
    // Obter todas as configurações
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Acesso negado: apenas administradores');
      }
      return db.getAllSystemSettings();
    }),

    // Obter resumo de armazenamento de todos os professores
    getTeachersStorage: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Acesso negado: apenas administradores');
      }
      return db.getAllTeachersStorageUsage();
    }),

    // Atualizar limite de armazenamento de um professor específico
    updateTeacherStorageLimit: protectedProcedure
      .input(z.object({
        professorId: z.number(),
        limitMB: z.number().min(50).max(10000),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        return db.updateTeacherStorageLimit(input.professorId, input.limitMB);
      }),

    // Atualizar limite de armazenamento de TODOS os professores de uma vez
    updateAllTeachersStorageLimit: protectedProcedure
      .input(z.object({
        limitMB: z.number().min(50).max(10000),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Acesso negado: apenas administradores');
        }
        const allUsers = await db.getAllTeachersStorageUsage();
        for (const user of allUsers) {
          await db.updateTeacherStorageLimit(user.userId, input.limitMB);
        }
        return { success: true, updatedCount: allUsers.length, limitMB: input.limitMB };
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

    toggleFavorite: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.toggleActiveMethodologyFavorite(input.id, ctx.user.id);
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

  learningPath: router({
    getBySubject: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getLearningPathBySubject(input.subjectId, ctx.user.id);
      }),
    
    generateModulesFromEmenta: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const subject = await db.getSubjectById(input.subjectId, ctx.user.id);
        
        if (!subject) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Disciplina não encontrada' });
        }
        
        if (!subject.ementa || subject.ementa.trim().length < 50) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'A disciplina precisa ter uma ementa cadastrada com pelo menos 50 caracteres.' 
          });
        }
        
        const workload = subject.workload || 60;
        const { generateModulesFromEmenta } = await import('./generateModulesFromEmenta');
        
        const result = await generateModulesFromEmenta(subject.ementa, workload, subject.name);
        
        const createdModules = [];
        for (const module of result.modules) {
          const createdModule = await db.createLearningModule({
            subjectId: input.subjectId,
            title: module.title,
            description: module.description,
            userId: ctx.user.id,
          });
          
          for (const topicTitle of module.topics) {
            await db.createLearningTopic({
              moduleId: createdModule.id,
              title: topicTitle,
              description: `Tópico do módulo: ${module.title}`,
              estimatedHours: Math.round(module.suggestedHours / module.topics.length),
              userId: ctx.user.id,
            });
          }
          
          createdModules.push({
            ...createdModule,
            suggestedHours: module.suggestedHours,
            topicsCount: module.topics.length,
          });
        }
        
        return {
          modules: createdModules,
          totalHours: result.totalHours,
          suggestions: result.suggestions,
        };
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
        try {
        const { invokeLLM } = await import('./_core/llm');
        
        console.log('[generateFromAI] Starting generation for subjectId:', input.subjectId);
        
        // Buscar carga horária da disciplina se não foi fornecida
        const subject = await db.getSubjectById(input.subjectId, ctx.user.id);
        const totalWorkload = input.workload || subject?.workload || 60;
        console.log('[generateFromAI] Subject found:', subject?.name, 'Workload:', totalWorkload);
        
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
        
        console.log('[generateFromAI] Calling LLM...');
        const response = await invokeLLM({
          feature: 'generate_exercise',
          messages: [
            { role: 'system', content: 'Você é um especialista em design instrucional e pedagogia. Responda APENAS em JSON válido.' },
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
        
        console.log('[generateFromAI] LLM response received, finish_reason:', response.choices?.[0]?.finish_reason);
        const rawContent = response.choices?.[0]?.message?.content;
        console.log('[generateFromAI] Raw content type:', typeof rawContent, 'length:', String(rawContent || '').length);
        const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
        console.log('[generateFromAI] Content preview:', String(content || '').substring(0, 200));
        let result;
        try {
          result = JSON.parse(content || '{}');
        } catch (parseErr: any) {
          console.error('[generateFromAI] JSON parse error:', parseErr.message);
          console.error('[generateFromAI] Raw content:', content);
          throw new Error('Erro ao interpretar resposta da IA: ' + parseErr.message);
        }
        console.log('[generateFromAI] Parsed result, modules count:', result.modules?.length);
        
        // Calcular total de horas geradas pela IA
        let totalGeneratedHours = 0;
        for (const module of result.modules) {
          for (const topic of module.topics) {
            totalGeneratedHours += topic.estimatedHours || 0;
          }
        }
        
        // Se a soma não for igual à carga horária, redistribuir proporcionalmente
        if (totalGeneratedHours !== totalWorkload && totalGeneratedHours > 0) {
          const ratio = totalWorkload / totalGeneratedHours;
          let adjustedTotal = 0;
          const allTopics: any[] = [];
          
          // Coletar todos os tópicos e ajustar horas
          for (const module of result.modules) {
            for (const topic of module.topics) {
              const adjustedHours = Math.round(topic.estimatedHours * ratio);
              topic.estimatedHours = Math.max(1, adjustedHours); // Mínimo 1 hora
              
              // Redistribuir as horas internas proporcionalmente
              const internalTotal = topic.theoryHours + topic.practiceHours + topic.individualWorkHours + topic.teamWorkHours;
              if (internalTotal > 0) {
                const internalRatio = topic.estimatedHours / internalTotal;
                topic.theoryHours = Math.round(topic.theoryHours * internalRatio);
                topic.practiceHours = Math.round(topic.practiceHours * internalRatio);
                topic.individualWorkHours = Math.round(topic.individualWorkHours * internalRatio);
                topic.teamWorkHours = Math.round(topic.teamWorkHours * internalRatio);
                
                // Ajustar para garantir que a soma interna seja igual a estimatedHours
                const newInternalTotal = topic.theoryHours + topic.practiceHours + topic.individualWorkHours + topic.teamWorkHours;
                if (newInternalTotal !== topic.estimatedHours) {
                  topic.theoryHours += topic.estimatedHours - newInternalTotal;
                }
              } else {
                // Se não houver distribuição, colocar tudo em teoria
                topic.theoryHours = topic.estimatedHours;
                topic.practiceHours = 0;
                topic.individualWorkHours = 0;
                topic.teamWorkHours = 0;
              }
              
              adjustedTotal += topic.estimatedHours;
              allTopics.push(topic);
            }
          }
          
          // Ajuste final para garantir soma exata
          const diff = totalWorkload - adjustedTotal;
          if (diff !== 0 && allTopics.length > 0) {
            // Distribuir a diferença entre os tópicos
            const perTopic = Math.floor(Math.abs(diff) / allTopics.length);
            const remainder = Math.abs(diff) % allTopics.length;
            
            for (let i = 0; i < allTopics.length; i++) {
              const adjustment = perTopic + (i < remainder ? 1 : 0);
              if (diff > 0) {
                allTopics[i].estimatedHours += adjustment;
                allTopics[i].theoryHours += adjustment;
              } else if (allTopics[i].estimatedHours > adjustment + 1) {
                allTopics[i].estimatedHours -= adjustment;
                allTopics[i].theoryHours = Math.max(0, allTopics[i].theoryHours - adjustment);
              }
            }
          }
        }
        
        // Salvar workload correto na disciplina (caso tenha sido alterado pelo professor)
        if (input.workload && input.workload !== subject?.workload) {
          await db.updateSubject(input.subjectId, ctx.user.id, { workload: totalWorkload });
        }

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
        
        console.log('[generateFromAI] All modules and topics created successfully');
        return { success: true, modulesCreated: result.modules.length };
        } catch (err: any) {
          console.error('[generateFromAI] ERROR:', err.message);
          console.error('[generateFromAI] Stack:', err.stack);
          throw err;
        }
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
          feature: 'suggest_lesson_plans',
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
          feature: 'generate_assessment',
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
- CADA QUESTÃO DEVE SER ÚNICA E DIFERENTE DAS DEMAIS — NUNCA repita o mesmo enunciado, tema ou conteúdo em questões diferentes
- Distribua as questões entre os diferentes módulos e tópicos disponíveis para garantir variedade máxima
- Se houver múltiplos módulos, distribua as questões proporcionalmente entre eles
- Para provas com muitas questões (10+), explore subtópicos distintos dentro de cada módulo

REGRA DE PONTUAÇÃO OBRIGATÓRIA:
- O total da prova é SEMPRE 10 pontos
- Pontos por questão = 10 / número de questões
- Exemplo: 10 questões → cada uma vale 1,0 ponto
- Exemplo: 20 questões → cada uma vale 0,5 ponto
- Exemplo: 5 questões → cada uma vale 2,0 pontos
- Use exatamente esse cálculo: ${(10 / input.questionCount).toFixed(2)} pontos por questão

Retorne um JSON com a estrutura:
{
  "title": "Título da Prova",
  "instructions": "Instruções gerais",
  "totalPoints": 10,
  "questions": [
    {
      "number": 1,
      "type": "objective|subjective|case_study",
      "points": ${(10 / input.questionCount).toFixed(2)},
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
        const parsed = JSON.parse(content || '{}');
        
        // Remover questões duplicadas (mesmo enunciado ou enunciado muito similar)
        if (parsed.questions && Array.isArray(parsed.questions)) {
          const seenQuestions = new Set<string>();
          const uniqueQuestions: any[] = [];
          for (const q of parsed.questions) {
            // Normalizar o texto para comparação (minúsculas, sem espaços extras, primeiros 120 chars)
            const normalizedText = (q.question || '').toLowerCase().trim().replace(/\s+/g, ' ').substring(0, 120);
            if (!seenQuestions.has(normalizedText)) {
              seenQuestions.add(normalizedText);
              uniqueQuestions.push(q);
            }
          }
          // Renumerar questões após remoção de duplicatas
          parsed.questions = uniqueQuestions.map((q: any, idx: number) => ({ ...q, number: idx + 1 }));
        }
        
        return parsed;
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
          feature: 'generate_exercise',
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
        
        // Notificar alunos matriculados na disciplina sobre novos exercícios do módulo
        try {
          const enrolled = await db.getStudentsBySubject(module.subjectId, ctx.user.id);
          const activeStudents = enrolled.filter((s: any) => s.status === 'active' && s.userId);
          for (const student of activeStudents) {
            await db.createNotification({
              userId: (student as any).userId,
              type: 'new_assignment',
              title: '📚 Novos Exercícios Disponíveis',
              message: `Novos exercícios foram gerados para o módulo "${module.title}" da sua trilha de aprendizado.`,
              link: '/student/learning-path',
              relatedId: input.moduleId,
            });
          }
        } catch (e) {
          console.error('[generateModuleExercises] Erro ao notificar alunos:', e);
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
          feature: 'generate_mind_map',
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
          feature: 'generate_infographic',
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
          feature: 'generate_mind_map',
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

    // Dashboard de Desempenho - Resumo por disciplina
    getPerformanceSummary: protectedProcedure.query(async ({ ctx }) => {
      // Cache de 5 minutos para resumo de desempenho
      const getCachedSummary = createCachedQuery(
        async (userId: number) => {
          return await db.getSubjectProgressSummary(userId);
        },
        300
      );

      return handleAsync(
        async () => {
          return await getCachedSummary(ctx.user.id);
        },
        { operation: 'getPerformanceSummary', userId: ctx.user.id }
      );
    }),

    // Dashboard de Desempenho - Progresso dos alunos em uma disciplina
    getStudentsProgressBySubject: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Cache de 3 minutos para progresso dos alunos
        const getCachedProgress = createCachedQuery(
          async (subjectId: number, userId: number) => {
            return await db.getAllStudentsProgressBySubject(subjectId, userId);
          },
          180
        );

        return handleAsync(
          async () => {
            // Validar que o professor tem acesso à disciplina
            const subject = await db.getSubjectById(input.subjectId, ctx.user.id);
            validateExists(subject, 'disciplina');
            validateOwnership(subject.userId, ctx.user.id, 'disciplina');

            return await getCachedProgress(input.subjectId, ctx.user.id);
          },
          { 
            operation: 'getStudentsProgressBySubject', 
            userId: ctx.user.id,
            resource: 'subject',
            details: { subjectId: input.subjectId }
          }
        );
       }),

    // Salvar prova gerada pela IA no banco de dados e publicar para alunos
    saveAssessment: protectedProcedure
      .input(z.object({
        subjectId: z.number(),
        classId: z.number().optional(),
        title: z.string(),
        instructions: z.string().optional(),
        totalPoints: z.number().default(100),
        duration: z.number().optional(),
        applicationDate: z.string().optional(),
        availableFrom: z.string().optional(),
        availableTo: z.string().optional(),
        status: z.enum(['draft', 'published']).default('published'),
        shuffleQuestions: z.boolean().default(false),
        shuffleAlternatives: z.boolean().default(false),
        bimestre: z.number().min(1).max(4).default(1),
        questions: z.array(z.object({
          number: z.number(),
          type: z.string(),
          points: z.number(),
          difficulty: z.string(),
          module: z.string().optional(),
          question: z.string(),
          options: z.array(z.string()).optional(),
          correctAnswer: z.string(),
          expectedAnswer: z.string().optional(),
          caseContext: z.string().optional(),
          caseQuestions: z.array(z.string()).optional(),
        }))
      }))
      .mutation(async ({ ctx, input }) => {
        // Criar a avaliação
        const result = await db.createAssessment({
          teacherId: ctx.user.id,
          subjectId: input.subjectId,
          classId: input.classId,
          title: input.title,
          description: input.instructions,
          assessmentType: 'prova',
          totalQuestions: input.questions.length,
          totalPoints: input.totalPoints,
          passingScore: 60,
          duration: input.duration,
          generalInstructions: input.instructions,
          applicationDate: input.applicationDate ? new Date(input.applicationDate) : undefined,
          availableFrom: input.availableFrom ? new Date(input.availableFrom) : undefined,
          availableTo: input.availableTo ? new Date(input.availableTo) : undefined,
          shuffleQuestions: input.shuffleQuestions ?? false,
          shuffleAlternatives: input.shuffleAlternatives ?? false,
          bimestre: input.bimestre,
        });
        const assessmentId = (result as any)[0]?.insertId || (result as any).insertId;
        if (!assessmentId) throw new Error('Erro ao criar avaliação');
        
        // Publicar imediatamente se solicitado
        if (input.status === 'published') {
          await db.updateAssessment(assessmentId, ctx.user.id, { status: 'published' });

          // Notificar alunos automaticamente
          try {
            const dbConn = await getDb();
            if (dbConn) {
              let studentRows: any[] = [];
              if (input.classId) {
                const res = await dbConn.execute(sql`
                  SELECT DISTINCT s.userId FROM students s
                  JOIN student_class_enrollments sce ON sce.studentId = s.id
                  WHERE sce.classId = ${input.classId} AND s.userId IS NOT NULL
                `) as any[];
                studentRows = (res[0] as any[]) || [];
              } else if (input.subjectId) {
                const enrolled = await db.getStudentsBySubject(input.subjectId, ctx.user.id);
                studentRows = enrolled.filter((s: any) => s.status === 'active' && s.userId).map((s: any) => ({ userId: s.userId }));
              }
              const appDateMsg = input.applicationDate
                ? ` Data: ${new Date(input.applicationDate).toLocaleDateString('pt-BR')}.`
                : '';
              for (const s of studentRows) {
                await dbConn.execute(sql`
                  INSERT INTO notifications (userId, type, title, message, link, relatedId, relatedType, isRead, createdAt)
                  VALUES (
                    ${s.userId},
                    'assessment_published',
                    ${'📝 Nova Prova Disponível'},
                    ${`A prova "${input.title}" foi publicada e está disponível para você.${appDateMsg}`},
                    ${'/student/assessments'},
                    ${assessmentId},
                    'assessment',
                    0,
                    NOW()
                  )
                `);
              }
            }
          } catch (e) {
            console.error('[assessments.create] Erro ao notificar alunos:', e);
          }
        }
        
        // Salvar as questões
        for (const q of input.questions) {
          const options = q.options || [];
          await db.addAssessmentQuestion({
            assessmentId,
            questionNumber: q.number,
            questionType: q.type === 'objective' ? 'multiple_choice' : q.type === 'subjective' ? 'essay' : 'essay',
            statement: q.question,
            context: q.caseContext,
            optionA: options[0],
            optionB: options[1],
            optionC: options[2],
            optionD: options[3],
            correctAnswer: q.correctAnswer,
            answerExplanation: q.expectedAnswer,
            points: q.points,
            difficulty: (q.difficulty === 'easy' || q.difficulty === 'medium' || q.difficulty === 'hard') ? q.difficulty : 'medium',
          });
        }
        
        return { assessmentId, status: input.status };
      }),

    // Listar provas publicadas para o aluno ver na trilha
    getStudentAssessments: protectedProcedure
      .input(z.object({
        subjectId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const dbConn = await getDb();
        if (!dbConn) return [];
        const result = await dbConn.execute(sql`
          SELECT a.id, a.title, a.description, a.assessmentType, a.totalQuestions,
                 a.totalPoints, a.passingScore, a.duration, a.generalInstructions,
                 a.applicationDate, a.availableFrom, a.availableTo, a.status,
                 a.createdAt, u.name as teacherName
          FROM assessments a
          JOIN users u ON a.teacherId = u.id
          WHERE a.subjectId = ${input.subjectId}
            AND a.status = 'published'
          ORDER BY a.createdAt DESC
        `);
        return (result[0] as unknown) as any[];
      }),

    // Listar TODAS as provas publicadas para o aluno (sem filtro de disciplina)
    getAllStudentAssessments: studentProcedure
      .query(async ({ ctx }) => {
        const dbConn = await getDb();
        if (!dbConn) return [];
        const studentId = ctx.studentSession.studentId;

        // Buscar disciplinas do aluno
        const enrollResult = await dbConn.execute(
          sql`SELECT DISTINCT subjectId FROM subjectEnrollments WHERE studentId = ${studentId} AND status = 'active'`
        ) as any[];
        const subjectIds = ((enrollResult[0] as any[]) || []).map((r: any) => r.subjectId).filter(Boolean) as number[];

        if (subjectIds.length === 0) return [];

        // Buscar provas publicadas para as disciplinas do aluno (com status da tentativa)
        const result = await dbConn.execute(
          sql`SELECT a.id, a.title, a.description, a.assessmentType, a.totalQuestions,
                     a.totalPoints, a.passingScore, a.duration, a.generalInstructions,
                     a.applicationDate, a.availableFrom, a.availableTo, a.status,
                     a.releaseAnswerKey,
                     a.createdAt, u.name as teacherName, s.name as subjectName,
                     aa.status as attemptStatus, aa.score as attemptScore, aa.percentage as attemptPercentage,
                     aa.passed as attemptPassed, aa.id as attemptId,
                     CASE WHEN ap.studentId IS NOT NULL THEN 1 ELSE 0 END as hasPermission
              FROM assessments a
              JOIN users u ON a.teacherId = u.id
              LEFT JOIN subjects s ON a.subjectId = s.id
              LEFT JOIN assessment_attempts aa ON aa.assessmentId = a.id AND aa.studentId = ${studentId}
              LEFT JOIN assessment_permissions ap ON ap.assessmentId = a.id AND ap.studentId = ${studentId}
              WHERE a.subjectId IN (${sql.join(subjectIds.map(id => sql`${id}`), sql`, `)})
                AND a.status = 'published'
              ORDER BY a.createdAt DESC`
        ) as any[];
        // Adicionar campo isLocked: prova está bloqueada se availableTo expirou E não tem permissão
        const now = new Date();
        const rows = ((result[0] as unknown) as any[]) || [];
        return rows.map((r: any) => ({
          ...r,
          hasPermission: !!r.hasPermission,
          isLocked: !!(r.availableTo && new Date(r.availableTo) < now && !r.hasPermission),
        }));
      }),

    // Aluno busca questões de uma prova publicada
    getStudentAssessmentQuestions: studentProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const dbConn = await getDb();
        if (!dbConn) return [];
        const studentId = ctx.studentSession.studentId;

        // Verificar que a prova está publicada e o aluno tem acesso (via subjectEnrollments)
        const checkResult = await dbConn.execute(
          sql`SELECT a.id, a.shuffleQuestions, a.shuffleAlternatives, a.releaseAnswerKey, a.totalPoints FROM assessments a
              JOIN subjectEnrollments se ON se.subjectId = a.subjectId
              WHERE a.id = ${input.assessmentId}
                AND a.status = 'published'
                AND se.studentId = ${studentId}
                AND se.status = 'active'
              LIMIT 1`
        ) as any[];
        const checkRows = (checkResult[0] as any[]) || [];
        if (checkRows.length === 0) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Prova não encontrada ou sem permissão' });
        }
        const assessmentConfig = checkRows[0];
        const shouldShuffleQuestions = !!assessmentConfig.shuffleQuestions;
        const shouldShuffleAlternatives = !!assessmentConfig.shuffleAlternatives;
        const answerKeyReleased = !!assessmentConfig.releaseAnswerKey;
        const assessmentTotalPoints = assessmentConfig.totalPoints ?? 100;

        // Verificar se o aluno já realizou a prova (submitted) e buscar nota
        const attemptResult = await dbConn.execute(
          sql`SELECT id, score, percentage, passed FROM assessment_attempts
              WHERE assessmentId = ${input.assessmentId}
                AND studentId = ${studentId}
                AND status = 'submitted'
              ORDER BY id DESC
              LIMIT 1`
        ) as any[];
        const attemptRows = (attemptResult[0] as any[]) || [];
        const alreadySubmitted = attemptRows.length > 0;
        const attemptData = alreadySubmitted ? attemptRows[0] : null;

        // Buscar questões
        const result = await dbConn.execute(
          sql`SELECT id, questionNumber, questionType, statement, context,
                     optionA, optionB, optionC, optionD, optionE,
                     correctAnswer, answerExplanation, points, difficulty
              FROM assessment_questions
              WHERE assessmentId = ${input.assessmentId}
              ORDER BY questionNumber ASC`
        ) as any[];
        let questions = (result[0] as any[]) || [];

        // Função de embaralhamento determinístico (seeded) por aluno
        // Cada aluno recebe a mesma ordem sempre, mas diferente de outros alunos
        function seededShuffle<T>(arr: T[], seed: number): T[] {
          const shuffled = [...arr];
          let s = seed;
          for (let i = shuffled.length - 1; i > 0; i--) {
            s = (s * 1664525 + 1013904223) & 0x7fffffff; // LCG
            const j = s % (i + 1);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        }

        // Embaralhar ordem das questões
        if (shouldShuffleQuestions && questions.length > 1) {
          const seed = studentId * 31 + input.assessmentId * 7;
          questions = seededShuffle(questions, seed);
          // Renumerar questões após embaralhamento
          questions = questions.map((q: any, idx: number) => ({ ...q, questionNumber: idx + 1 }));
        }

        // Embaralhar alternativas de múltipla escolha
        if (shouldShuffleAlternatives) {
          questions = questions.map((q: any, qIdx: number) => {
            if (!q.optionA) return q; // Pular questões sem alternativas
            const options = [
              { key: 'A', text: q.optionA },
              { key: 'B', text: q.optionB },
              { key: 'C', text: q.optionC },
              { key: 'D', text: q.optionD },
              ...(q.optionE ? [{ key: 'E', text: q.optionE }] : []),
            ].filter(o => o.text); // Remover opções nulas
            const seed = studentId * 17 + input.assessmentId * 13 + (q.id || qIdx) * 3;
            const shuffledOptions = seededShuffle(options, seed);
            const newQ = { ...q };
            const letters = ['A', 'B', 'C', 'D', 'E'];
            shuffledOptions.forEach((opt, idx) => {
              newQ[`option${letters[idx]}`] = opt.text;
            });
            // Atualizar a resposta correta para a nova posição
            if (q.correctAnswer) {
              const correctOriginalKey = q.correctAnswer.trim().toUpperCase().charAt(0);
              const newIdx = shuffledOptions.findIndex(o => o.key === correctOriginalKey);
              if (newIdx >= 0) {
                newQ.correctAnswer = letters[newIdx];
              }
            }
            return newQ;
          });
        }

        // Se o aluno já realizou a prova:
        // - remover gabarito/justificativas EXCETO se o professor liberou o gabarito
        if (alreadySubmitted && !answerKeyReleased) {
          questions = questions.map((q: any) => {
            const { correctAnswer, answerExplanation, ...rest } = q;
            return rest;
          });
        }

        // Buscar respostas do aluno quando gabarito está liberado
        let studentAnswersMap: Record<number, string> = {};
        if (alreadySubmitted && answerKeyReleased && attemptData) {
          const answersResult = await dbConn.execute(
            sql`SELECT questionId, selectedAnswer FROM assessment_answers
                WHERE attemptId = ${attemptData.id}
                ORDER BY questionId ASC`
          ) as any[];
          const answersRows = (answersResult[0] as any[]) || [];
          for (const row of answersRows) {
            if (row.questionId && row.selectedAnswer) {
              studentAnswersMap[row.questionId] = row.selectedAnswer.trim().toUpperCase().charAt(0);
            }
          }
          // Adicionar resposta do aluno em cada questão
          questions = questions.map((q: any) => ({
            ...q,
            studentAnswer: studentAnswersMap[q.id] ?? null,
          }));
        }

        // Retornar junto com metadados da tentativa e status do gabarito
        return {
          questions: questions as any[],
          attempt: attemptData ? {
            score: attemptData.score,
            percentage: attemptData.percentage,
            passed: !!attemptData.passed,
            totalPoints: assessmentTotalPoints,
          } : null,
          answerKeyReleased,
          alreadySubmitted,
        };
      }),

    // Listar todas as provas do professor (para gestão)
    getTeacherAssessments: protectedProcedure
      .input(z.object({ subjectId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const dbConn = await getDb();
        if (!dbConn) return [];
        const subjectFilter = input.subjectId
          ? sql`AND a.subjectId = ${input.subjectId}`
          : sql``;
        const result = await dbConn.execute(sql`
          SELECT a.id, a.title, a.description, a.assessmentType, a.totalQuestions,
                 a.totalPoints, a.passingScore, a.duration, a.status,
                 a.applicationDate, a.createdAt, a.maxAttempts,
                 a.shuffleQuestions, a.shuffleAlternatives, a.releaseAnswerKey,
                 s.name as subjectName, s.color as subjectColor,
                 c.name as className
          FROM assessments a
          LEFT JOIN subjects s ON a.subjectId = s.id
          LEFT JOIN classes c ON a.classId = c.id
          WHERE a.teacherId = ${ctx.user.id}
          ${subjectFilter}
          ORDER BY a.createdAt DESC
        `);
        return (result[0] as unknown) as any[];
      }),

    // Deletar prova do professor
    deleteAssessment: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const dbConn = await getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        // Verificar propriedade
        const check = await dbConn.execute(sql`
          SELECT id FROM assessments WHERE id = ${input.assessmentId} AND teacherId = ${ctx.user.id}
        `);
        const rows = (check[0] as unknown) as any[];
        if (!rows || rows.length === 0) throw new TRPCError({ code: 'FORBIDDEN', message: 'Prova não encontrada ou sem permissão' });
        // Deletar questões relacionadas
        await dbConn.execute(sql`DELETE FROM assessment_questions WHERE assessmentId = ${input.assessmentId}`);
        // Deletar prova
        await dbConn.execute(sql`DELETE FROM assessments WHERE id = ${input.assessmentId}`);
        return { success: true };
      }),

    // Alterar status da prova (publicar/despublicar)
    toggleAssessmentStatus: protectedProcedure
      .input(z.object({ assessmentId: z.number(), status: z.enum(['draft', 'published']) }))
      .mutation(async ({ ctx, input }) => {
        const dbConn = await getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await dbConn.execute(sql`
          UPDATE assessments SET status = ${input.status}
          WHERE id = ${input.assessmentId} AND teacherId = ${ctx.user.id}
        `);
        // Se publicando, notificar alunos matriculados na disciplina
        if (input.status === 'published') {
          try {
            const assessmentRows = await dbConn.execute(sql`
              SELECT a.title, a.subjectId, a.classId FROM assessments a
              WHERE a.id = ${input.assessmentId} AND a.teacherId = ${ctx.user.id}
            `);
            const assessment = ((assessmentRows[0] as unknown) as any[])[0];
            if (assessment) {
              // Buscar alunos da disciplina/turma
              let studentQuery;
              if (assessment.classId) {
                studentQuery = dbConn.execute(sql`
                  SELECT DISTINCT s.userId FROM students s
                  JOIN student_class_enrollments sce ON sce.studentId = s.id
                  WHERE sce.classId = ${assessment.classId} AND s.userId IS NOT NULL
                `);
              } else {
                studentQuery = dbConn.execute(sql`
                  SELECT DISTINCT s.userId FROM students s
                  JOIN subjectEnrollments se ON se.studentId = s.id
                  WHERE se.subjectId = ${assessment.subjectId} AND se.status = 'active' AND s.userId IS NOT NULL
                `);
              }
              const studentRows = await studentQuery;
              const students = ((studentRows[0] as unknown) as any[]) || [];
              // Criar notificação para cada aluno
              for (const student of students) {
                await dbConn.execute(sql`
                  INSERT INTO notifications (userId, type, title, message, link, relatedId, relatedType, isRead, createdAt)
                  VALUES (
                    ${student.userId},
                    'assessment_published',
                    ${'📝 Nova Prova Disponível'},
                    ${`A prova "${assessment.title}" foi publicada e está disponível para você.`},
                    ${'/student/assessments'},
                    ${input.assessmentId},
                    'assessment',
                    0,
                    NOW()
                  )
                `);
              }
            }
          } catch(e) {
            // Não bloquear a publicação se a notificação falhar
            console.error('[toggleAssessmentStatus] Erro ao notificar alunos:', e);
          }
        }
        return { success: true };
      }),

    // Atualizar número máximo de tentativas de uma prova
    updateAssessmentMaxAttempts: protectedProcedure
      .input(z.object({
        assessmentId: z.number(),
        maxAttempts: z.number().min(1).max(99).nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbConn = await getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        // Verificar propriedade
        const check = await dbConn.execute(
          sql`SELECT id FROM assessments WHERE id = ${input.assessmentId} AND teacherId = ${ctx.user.id} LIMIT 1`
        ) as any[];
        const rows = (check[0] as any[]) || [];
        if (rows.length === 0) throw new TRPCError({ code: 'FORBIDDEN', message: 'Prova não encontrada' });
        await dbConn.execute(
          sql`UPDATE assessments SET maxAttempts = ${input.maxAttempts} WHERE id = ${input.assessmentId}`
        );
        return { success: true };
      }),

    // Atualizar configuração de embaralhamento de uma prova existente
    updateAssessmentShuffle: protectedProcedure
      .input(z.object({
        assessmentId: z.number(),
        shuffleQuestions: z.boolean(),
        shuffleAlternatives: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbConn = await getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const check = await dbConn.execute(
          sql`SELECT id FROM assessments WHERE id = ${input.assessmentId} AND teacherId = ${ctx.user.id} LIMIT 1`
        ) as any[];
        const rows = (check[0] as any[]) || [];
        if (rows.length === 0) throw new TRPCError({ code: 'FORBIDDEN', message: 'Prova não encontrada' });
        await dbConn.execute(
          sql`UPDATE assessments SET shuffleQuestions = ${input.shuffleQuestions ? 1 : 0}, shuffleAlternatives = ${input.shuffleAlternatives ? 1 : 0} WHERE id = ${input.assessmentId}`
        );
        return { success: true };
      }),

    // ==================== TENTATIVAS DE PROVA ONLINE ====================

    // Iniciar ou retomar uma tentativa de prova
    startAssessmentAttempt: studentProcedure
      .input(z.object({ assessmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const dbConn = await getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const studentId = ctx.studentSession.studentId;

        // Verificar que a prova está publicada e o aluno tem acesso
        const checkResult = await dbConn.execute(
          sql`SELECT a.id, a.title, a.totalQuestions, a.totalPoints, a.passingScore, a.duration, a.maxAttempts, a.availableTo
              FROM assessments a
              JOIN subjectEnrollments se ON se.subjectId = a.subjectId
              WHERE a.id = ${input.assessmentId}
                AND a.status = 'published'
                AND se.studentId = ${studentId}
                AND se.status = 'active'
              LIMIT 1`
        ) as any[];
        const checkRows = (checkResult[0] as any[]) || [];
        if (checkRows.length === 0) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Prova não encontrada ou sem permissão' });
        }

        // Verificar se a prova está dentro do prazo ou se o aluno tem permissão especial
        const assessmentData = checkRows[0];
        const availableTo = assessmentData.availableTo ? new Date(assessmentData.availableTo) : null;
        const now = new Date();
        if (availableTo && now > availableTo) {
          // Prova fora do prazo - verificar se o aluno tem permissão especial
          const permResult = await dbConn.execute(
            sql`SELECT id FROM assessment_permissions
                WHERE assessmentId = ${input.assessmentId}
                  AND studentId = ${studentId}
                  AND isActive = 1
                LIMIT 1`
          ) as any[];
          const permRows = (permResult[0] as any[]) || [];
          if (permRows.length === 0) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'O prazo desta prova encerrou. Solicite permissão ao professor para realizar a prova.' });
          }
        }
        const assessmentInfo = checkRows[0];
        const maxAttempts = (assessmentInfo.maxAttempts as number) ?? 1;

        // Verificar tentativas já realizadas
        const attemptsCountResult = await dbConn.execute(
          sql`SELECT id, status FROM assessment_attempts
              WHERE assessmentId = ${input.assessmentId} AND studentId = ${studentId}
              ORDER BY createdAt DESC`
        ) as any[];
        const allAttempts = (attemptsCountResult[0] as any[]) || [];

        // Retomar tentativa em andamento
        const inProgress = allAttempts.find((a: any) => a.status === 'in_progress');
        if (inProgress) {
          return { attemptId: inProgress.id as number, isNew: false };
        }

        // Verificar limite de tentativas
        const submittedCount = allAttempts.filter((a: any) => a.status === 'submitted' || a.status === 'graded').length;
        if (submittedCount >= maxAttempts) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Você já utilizou todas as ${maxAttempts} tentativa(s) permitida(s) para esta prova.` });
        }

        // Criar nova tentativa
        const insertResult = await dbConn.execute(
          sql`INSERT INTO assessment_attempts (assessmentId, studentId, status, startedAt, createdAt, updatedAt)
              VALUES (${input.assessmentId}, ${studentId}, 'in_progress', NOW(), NOW(), NOW())`
        ) as any;
        const attemptId = (insertResult[0] as any)?.insertId as number;
        return { attemptId, isNew: true };
      }),

    // Buscar tentativa em andamento com respostas já salvas
    getAttemptProgress: studentProcedure
      .input(z.object({ attemptId: z.number() }))
      .query(async ({ ctx, input }) => {
        const dbConn = await getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const studentId = ctx.studentSession.studentId;

        const attemptResult = await dbConn.execute(
          sql`SELECT * FROM assessment_attempts WHERE id = ${input.attemptId} AND studentId = ${studentId} LIMIT 1`
        ) as any[];
        const attempt = ((attemptResult[0] as any[]) || [])[0];
        if (!attempt) throw new TRPCError({ code: 'NOT_FOUND' });

        const answersResult = await dbConn.execute(
          sql`SELECT questionId, selectedAnswer FROM assessment_answers WHERE attemptId = ${input.attemptId}`
        ) as any[];
        const answers = (answersResult[0] as any[]) || [];

        const savedAnswers: Record<number, string> = {};
        for (const a of answers) {
          savedAnswers[a.questionId as number] = a.selectedAnswer as string;
        }
        return { attempt, savedAnswers };
      }),

    // Salvar resposta individual (auto-save)
    saveAssessmentAnswer: studentProcedure
      .input(z.object({
        attemptId: z.number(),
        questionId: z.number(),
        questionNumber: z.number(),
        selectedAnswer: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbConn = await getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const studentId = ctx.studentSession.studentId;

        // Verificar que a tentativa pertence ao aluno e está em andamento
        const check = await dbConn.execute(
          sql`SELECT id FROM assessment_attempts WHERE id = ${input.attemptId} AND studentId = ${studentId} AND status = 'in_progress' LIMIT 1`
        ) as any[];
        if (((check[0] as any[]) || []).length === 0) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }

        // Upsert da resposta
        await dbConn.execute(
          sql`INSERT INTO assessment_answers (attemptId, questionId, questionNumber, selectedAnswer, isCorrect, pointsEarned, createdAt)
              VALUES (${input.attemptId}, ${input.questionId}, ${input.questionNumber}, ${input.selectedAnswer}, 0, 0, NOW())
              ON DUPLICATE KEY UPDATE selectedAnswer = ${input.selectedAnswer}`
        );
        return { success: true };
      }),

    // Submeter prova (correção automática)
    submitAssessment: studentProcedure
      .input(z.object({
        attemptId: z.number(),
        timeSpentSeconds: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbConn = await getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const studentId = ctx.studentSession.studentId;

        // Verificar tentativa
        const attemptResult = await dbConn.execute(
          sql`SELECT aa.*, a.totalPoints, a.passingScore, aa.assessmentId
              FROM assessment_attempts aa
              JOIN assessments a ON a.id = aa.assessmentId
              WHERE aa.id = ${input.attemptId} AND aa.studentId = ${studentId} AND aa.status = 'in_progress'
              LIMIT 1`
        ) as any[];
        const attempt = ((attemptResult[0] as any[]) || [])[0];
        if (!attempt) throw new TRPCError({ code: 'NOT_FOUND', message: 'Tentativa não encontrada' });

        const assessmentId = attempt.assessmentId as number;
        const totalPoints = attempt.totalPoints as number;
        const passingScore = attempt.passingScore as number;

        // Buscar questões com gabarito completo (para gabarito comentado)
        const questionsResult = await dbConn.execute(
          sql`SELECT id, questionNumber, correctAnswer, points, statement, questionText,
                     optionA, optionB, optionC, optionD, optionE, answerExplanation, difficulty
              FROM assessment_questions
              WHERE assessmentId = ${assessmentId} ORDER BY questionNumber ASC`
        ) as any[];
        const questions = (questionsResult[0] as any[]) || [];

        // Buscar respostas do aluno
        const answersResult = await dbConn.execute(
          sql`SELECT questionId, selectedAnswer FROM assessment_answers WHERE attemptId = ${input.attemptId}`
        ) as any[];
        const studentAnswers = (answersResult[0] as any[]) || [];
        const answerMap: Record<number, string> = {};
        for (const a of studentAnswers) answerMap[a.questionId as number] = a.selectedAnswer as string;

        // Corrigir cada questão
        let totalCorrect = 0;
        let totalWrong = 0;
        let scoreEarned = 0;

        for (const q of questions) {
          const studentAns = (answerMap[q.id as number] || '').trim().toUpperCase();
          const correctAns = (q.correctAnswer as string || '').trim().toUpperCase();
          const isCorrect = studentAns === correctAns && studentAns !== '';
          const pts = isCorrect ? (q.points as number) : 0;
          if (isCorrect) totalCorrect++;
          else totalWrong++;
          scoreEarned += pts;

          // Atualizar resposta com resultado
          await dbConn.execute(
            sql`UPDATE assessment_answers SET isCorrect = ${isCorrect ? 1 : 0}, pointsEarned = ${pts}
                WHERE attemptId = ${input.attemptId} AND questionId = ${q.id}`
          );
        }

        const percentage = totalPoints > 0 ? (scoreEarned / totalPoints) * 100 : 0;
        const passed = percentage >= passingScore;

        // Atualizar tentativa como submetida
        await dbConn.execute(
          sql`UPDATE assessment_attempts
              SET status = 'submitted', totalCorrect = ${totalCorrect}, totalWrong = ${totalWrong},
                  score = ${scoreEarned}, percentage = ${percentage}, passed = ${passed ? 1 : 0},
                  submittedAt = NOW(), timeSpentSeconds = ${input.timeSpentSeconds || 0}, updatedAt = NOW()
              WHERE id = ${input.attemptId}`
        );

        // Montar gabarito comentado
        const reviewQuestions = questions.map((q: any) => {
          const studentAns = (answerMap[q.id as number] || '').trim().toUpperCase();
          const correctAns = (q.correctAnswer as string || '').trim().toUpperCase();
          const isCorrect = studentAns === correctAns && studentAns !== '';
          return {
            id: q.id,
            questionNumber: q.questionNumber,
            statement: q.statement || q.questionText || '',
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            optionE: q.optionE,
            correctAnswer: correctAns,
            studentAnswer: studentAns,
            isCorrect,
            explanation: q.answerExplanation || null,
            difficulty: q.difficulty,
            points: q.points,
          };
        });

        return {
          totalCorrect,
          totalWrong,
          score: scoreEarned,
          percentage: Math.round(percentage * 10) / 10,
          passed,
          totalPoints,
          passingScore,
          reviewQuestions,
        };
      }),

    // Buscar resultado de uma tentativa submetida
    getAssessmentResult: studentProcedure
      .input(z.object({ attemptId: z.number() }))
      .query(async ({ ctx, input }) => {
        const dbConn = await getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const studentId = ctx.studentSession.studentId;

        const attemptResult = await dbConn.execute(
          sql`SELECT aa.*, a.title, a.totalPoints, a.passingScore, a.totalQuestions
              FROM assessment_attempts aa
              JOIN assessments a ON a.id = aa.assessmentId
              WHERE aa.id = ${input.attemptId} AND aa.studentId = ${studentId}
              LIMIT 1`
        ) as any[];
        const attempt = ((attemptResult[0] as any[]) || [])[0];
        if (!attempt) throw new TRPCError({ code: 'NOT_FOUND' });

        // Buscar respostas com gabarito
        const answersResult = await dbConn.execute(
          sql`SELECT aans.questionId, aans.selectedAnswer, aans.isCorrect, aans.pointsEarned,
                     aq.questionNumber, aq.statement, aq.correctAnswer, aq.answerExplanation,
                     aq.optionA, aq.optionB, aq.optionC, aq.optionD, aq.optionE
              FROM assessment_answers aans
              JOIN assessment_questions aq ON aq.id = aans.questionId
              WHERE aans.attemptId = ${input.attemptId}
              ORDER BY aq.questionNumber ASC`
        ) as any[];
        const answers = (answersResult[0] as any[]) || [];

        return { attempt, answers };
      }),

    // Buscar notas de provas do aluno (para boletim)
    getStudentAssessmentGrades: studentProcedure
      .query(async ({ ctx }) => {
        const dbConn = await getDb();
        if (!dbConn) return [];
        const studentId = ctx.studentSession.studentId;

        const result = await dbConn.execute(
          sql`SELECT aa.id as attemptId, aa.assessmentId, aa.score, aa.percentage, aa.passed,
                     aa.totalCorrect, aa.totalWrong, aa.submittedAt,
                     a.title, a.totalPoints, a.passingScore, a.assessmentType, a.bimestre,
                     s.name as subjectName, s.color as subjectColor
              FROM assessment_attempts aa
              JOIN assessments a ON a.id = aa.assessmentId
              JOIN subjects s ON s.id = a.subjectId
              WHERE aa.studentId = ${studentId} AND aa.status = 'submitted'
              ORDER BY aa.submittedAt DESC`
        ) as any[];
        const allAttempts = (result[0] as any[]) || [];
        // Retornar apenas a nota mais alta por prova (assessmentId)
        const bestByAssessment = new Map<number, any>();
        for (const attempt of allAttempts) {
          const key = attempt.assessmentId;
          const existing = bestByAssessment.get(key);
          if (!existing || parseFloat(String(attempt.score ?? 0)) > parseFloat(String(existing.score ?? 0))) {
            bestByAssessment.set(key, attempt);
          }
        }
        return Array.from(bestByAssessment.values());
      }),

    // Buscar notas de provas dos alunos (para boletim do professor)
    getAssessmentGradesBySubject: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const dbConn = await getDb();
        if (!dbConn) return [];

        const result = await dbConn.execute(
          sql`SELECT st.id as studentId, st.fullName as studentName,
                     a.id as assessmentId, a.title as assessmentTitle, a.totalPoints,
                     aa.score, aa.percentage, aa.passed, aa.submittedAt
              FROM students st
              JOIN subjectEnrollments se ON se.studentId = st.id
              JOIN assessments a ON a.subjectId = se.subjectId
              LEFT JOIN assessment_attempts aa ON aa.assessmentId = a.id AND aa.studentId = st.id AND aa.status = 'submitted'
              WHERE se.subjectId = ${input.subjectId}
                AND a.teacherId = ${ctx.user.id}
                AND se.status = 'active'
              ORDER BY st.fullName, a.title`
        ) as any[];
        return (result[0] as any[]) || [];
      }),

    // Buscar histórico de provas do aluno (para o professor ver)
    getStudentAssessmentHistory: protectedProcedure
      .input(z.object({ studentId: z.number(), subjectId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const dbConn = await getDb();
        if (!dbConn) return [];

        const subjectFilter = input.subjectId
          ? sql`AND a.subjectId = ${input.subjectId}`
          : sql``;

        const result = await dbConn.execute(
          sql`SELECT aa.id as attemptId, aa.score, aa.percentage, aa.passed,
                     aa.totalCorrect, aa.totalWrong, aa.submittedAt,
                     a.title, a.totalPoints, a.passingScore, a.assessmentType
              FROM assessment_attempts aa
              JOIN assessments a ON a.id = aa.assessmentId
              WHERE aa.studentId = ${input.studentId}
                AND aa.status = 'submitted'
                AND a.teacherId = ${ctx.user.id}
                ${subjectFilter}
              ORDER BY aa.submittedAt DESC`
        ) as any[];
        return (result[0] as any[]) || [];
      }),

    // Buscar questões de uma prova (para visualização)
    getAssessmentQuestions: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const dbConn = await getDb();
        if (!dbConn) return [];
        // Verificar que o professor é dono da prova
        const check = await dbConn.execute(sql`
          SELECT id FROM assessments WHERE id = ${input.assessmentId} AND teacherId = ${ctx.user.id}
        `);
        const rows = (check[0] as unknown) as any[];
        if (!rows || rows.length === 0) throw new TRPCError({ code: 'FORBIDDEN', message: 'Prova não encontrada ou sem permissão' });
        // Buscar questões
        const result = await dbConn.execute(sql`
          SELECT * FROM assessment_questions
          WHERE assessmentId = ${input.assessmentId}
          ORDER BY questionNumber ASC
        `);
        return (result[0] as unknown) as any[];
      }),

    // Listar alunos pendentes e concluídos para uma prova
    getPendingStudentsForAssessment: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const dbConn = await getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        // Verificar que a prova pertence ao professor
        const checkResult = await dbConn.execute(
          sql`SELECT id, subjectId, classId FROM assessments WHERE id = ${input.assessmentId} AND teacherId = ${ctx.user.id} LIMIT 1`
        ) as any[];
        const checkRows = (checkResult[0] as any[]) || [];
        if (checkRows.length === 0) throw new TRPCError({ code: 'FORBIDDEN', message: 'Prova não encontrada' });
        const { subjectId, classId } = checkRows[0];
        // Buscar todos os alunos ativos com nome correto da tabela students.fullName
        let studentsResult: any[];
        if (classId) {
          studentsResult = await dbConn.execute(
            sql`SELECT s.id AS studentId, s.fullName AS name
                FROM students s
                INNER JOIN student_class_enrollments sce ON sce.studentId = s.id
                WHERE sce.classId = ${classId}
                ORDER BY s.fullName ASC`
          ) as any[];
        } else {
          studentsResult = await dbConn.execute(
            sql`SELECT s.id AS studentId, s.fullName AS name
                FROM students s
                INNER JOIN subjectEnrollments se ON se.studentId = s.id
                WHERE se.subjectId = ${subjectId} AND se.status = 'active'
                ORDER BY s.fullName ASC`
          ) as any[];
        }
        const allStudents: { studentId: number; name: string }[] = ((studentsResult[0] as any[]) || []).map((r: any) => ({
          studentId: r.studentId,
          name: r.name || `Aluno #${r.studentId}`,
        }));
        // Buscar alunos que já fizeram a prova (têm pelo menos uma tentativa)
        const doneResult = await dbConn.execute(
          sql`SELECT DISTINCT studentId FROM assessment_attempts WHERE assessmentId = ${input.assessmentId}`
        ) as any[];
        const doneIds = new Set(((doneResult[0] as any[]) || []).map((r: any) => r.studentId));
        const done = allStudents.filter(s => doneIds.has(s.studentId));
        const pending = allStudents.filter(s => !doneIds.has(s.studentId));
        // Buscar permissões já concedidas
        const permResult = await dbConn.execute(
          sql`SELECT studentId, expiresAt, note, used FROM assessment_permissions WHERE assessmentId = ${input.assessmentId}`
        ) as any[];
        const permMap = new Map(((permResult[0] as any[]) || []).map((r: any) => [r.studentId, r]));
        const pendingWithPerm = pending.map(s => ({
          ...s,
          hasPermission: permMap.has(s.studentId),
          permissionNote: permMap.get(s.studentId)?.note || null,
          permissionUsed: permMap.get(s.studentId)?.used || false,
        }));
        return { pending: pendingWithPerm, done, total: allStudents.length };
      }),

    // Conceder permissão de acesso a uma prova para um aluno específico
    grantAssessmentPermission: protectedProcedure
      .input(z.object({
        assessmentId: z.number(),
        studentId: z.number(),
        note: z.string().optional(),
        expiresAt: z.string().optional(), // ISO date string
      }))
      .mutation(async ({ ctx, input }) => {
        const dbConn = await getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        // Verificar que a prova pertence ao professor
        const check = await dbConn.execute(
          sql`SELECT id FROM assessments WHERE id = ${input.assessmentId} AND teacherId = ${ctx.user.id} LIMIT 1`
        ) as any[];
        if (((check[0] as any[]) || []).length === 0) throw new TRPCError({ code: 'FORBIDDEN', message: 'Prova não encontrada' });
        // Inserir ou atualizar permissão
        const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
        await dbConn.execute(
          sql`INSERT INTO assessment_permissions (assessmentId, studentId, grantedBy, expiresAt, note, used)
              VALUES (${input.assessmentId}, ${input.studentId}, ${ctx.user.id}, ${expiresAt}, ${input.note || null}, false)
              ON DUPLICATE KEY UPDATE expiresAt = ${expiresAt}, note = ${input.note || null}, used = false, grantedAt = NOW()`
        );
        // Notificar o aluno
        try {
          const studentResult = await dbConn.execute(
            sql`SELECT s.userId, a.title FROM students s JOIN assessments a ON a.id = ${input.assessmentId} WHERE s.id = ${input.studentId} LIMIT 1`
          ) as any[];
          const studentRow = ((studentResult[0] as any[]) || [])[0];
          if (studentRow?.userId) {
            await dbConn.execute(sql`
              INSERT INTO notifications (userId, type, title, message, link, relatedId, relatedType, isRead, createdAt)
              VALUES (
                ${studentRow.userId}, 'assessment_permission',
                ${'✅ Permissão de Prova Concedida'},
                ${`O professor liberou seu acesso à prova "${studentRow.title}". Você já pode realizá-la.`},
                ${'/student/assessments'}, ${input.assessmentId}, 'assessment', 0, NOW()
              )
            `);
          }
        } catch (e) { /* silencioso */ }
        return { success: true };
      }),

    // Revogar permissão de acesso a uma prova
    revokeAssessmentPermission: protectedProcedure
      .input(z.object({ assessmentId: z.number(), studentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const dbConn = await getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const check = await dbConn.execute(
          sql`SELECT id FROM assessments WHERE id = ${input.assessmentId} AND teacherId = ${ctx.user.id} LIMIT 1`
        ) as any[];
        if (((check[0] as any[]) || []).length === 0) throw new TRPCError({ code: 'FORBIDDEN', message: 'Prova não encontrada' });
        await dbConn.execute(
          sql`DELETE FROM assessment_permissions WHERE assessmentId = ${input.assessmentId} AND studentId = ${input.studentId}`
        );
        return { success: true };
      }),

    // Liberar ou bloquear gabarito de uma prova para os alunos que já realizaram
    releaseAssessmentAnswerKey: protectedProcedure
      .input(z.object({ assessmentId: z.number(), release: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const dbConn = await getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const check = await dbConn.execute(
          sql`SELECT id FROM assessments WHERE id = ${input.assessmentId} AND teacherId = ${ctx.user.id} LIMIT 1`
        ) as any[];
        if (((check[0] as any[]) || []).length === 0) throw new TRPCError({ code: 'FORBIDDEN', message: 'Prova não encontrada' });
        await dbConn.execute(
          sql`UPDATE assessments SET releaseAnswerKey = ${input.release ? 1 : 0} WHERE id = ${input.assessmentId}`
        );
        return { success: true, released: input.release };
      }),
  }),
  // Boletim de Atividades da Trilha por Turma
  learningPathReport: router({
    // Listar disciplinas que têm trilha de aprendizagem (módulos)
    // Retorna combinações únicas de disciplina+turma para o seletor único no boletim
    // Abordagem: vincular disciplina à turma pelo código (subjects.code = classes.code)
    // Cada disciplina já tem um código que corresponde à turma associada
    getSubjectClassCombinations: protectedProcedure
      .query(async ({ ctx }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        // Buscar disciplinas com trilha + turma correspondente pelo código
        const result = await database.execute(sql`
          SELECT DISTINCT
            s.id AS subjectId,
            s.name AS subjectName,
            s.code AS subjectCode,
            s.color AS subjectColor,
            c.id AS classId,
            c.name AS className,
            c.code AS classCode
          FROM subjects s
          INNER JOIN learning_modules lm ON lm.subjectId = s.id
          LEFT JOIN classes c ON c.code = s.code AND c.userId = s.userId
          WHERE s.userId = ${ctx.user.id}
          ORDER BY s.name, c.name
        `);
        const rows = Array.isArray(result) && Array.isArray(result[0]) 
          ? result[0] as any[] 
          : result as any[];
        
        return rows.map((r: any) => ({
          subjectId: r.subjectId as number,
          subjectName: r.subjectName as string,
          subjectCode: r.subjectCode as string | null,
          subjectColor: r.subjectColor as string | null,
          classId: (r.classId ?? 0) as number,
          className: (r.className ?? 'Sem turma vinculada') as string,
          classCode: (r.classCode ?? null) as string | null,
        }));
      }),
    getSubjectsForReport: protectedProcedure
      .query(async ({ ctx }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        // Buscar disciplinas que têm pelo menos um módulo de trilha
        const rows = await database
          .select({
            id: subjects.id,
            name: subjects.name,
            code: subjects.code,
            color: subjects.color,
          })
          .from(subjects)
          .innerJoin(learningModules, eq(learningModules.subjectId, subjects.id))
          .where(eq(subjects.userId, ctx.user.id))
          .groupBy(subjects.id, subjects.name, subjects.code, subjects.color);
        return rows;
      }),

    // Listar turmas que têm alunos matriculados em uma disciplina
    getClassesBySubject: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        // Buscar turmas com alunos matriculados nessa disciplina (via studentClassEnrollments + subjectEnrollments)
        const rows = await database
          .select({
            id: classes.id,
            name: classes.name,
            code: classes.code,
          })
          .from(classes)
          .innerJoin(studentClassEnrollments, and(
            eq(studentClassEnrollments.classId, classes.id),
            eq(studentClassEnrollments.userId, ctx.user.id)
          ))
          .innerJoin(subjectEnrollments, and(
            eq(subjectEnrollments.studentId, studentClassEnrollments.studentId),
            eq(subjectEnrollments.subjectId, input.subjectId)
          ))
          .where(eq(classes.userId, ctx.user.id))
          .groupBy(classes.id, classes.name, classes.code);
        return rows;
      }),

    getClassReport: protectedProcedure
      .input(z.object({
        subjectId: z.number(),
        classId: z.number().nullable().optional(),
      }))
      .query(async ({ ctx, input }) => {
        // classId=0 significa "Todos os alunos" (sem filtro de turma)
        const effectiveClassId = input.classId && input.classId > 0 ? input.classId : null;
        return await db.getLearningPathClassReport(
          input.subjectId,
          effectiveClassId,
          ctx.user.id
        );
      }),
  }),

  // Access Logs Routes
  accessLogs: router({
    // Resumo geral de acessos (admin only)
    getSummary: protectedProcedure
      .input(z.object({
        days: z.number().min(1).max(365).default(30),
        dateFrom: z.string().optional(), // ISO date string ex: "2025-01-01"
        dateTo: z.string().optional(),   // ISO date string ex: "2025-01-31"
      }))
      .query(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        // Determinar intervalo: período personalizado ou últimos N dias
        let since: Date;
        let until: Date | undefined;
        if (input.dateFrom) {
          since = new Date(input.dateFrom);
          since.setHours(0, 0, 0, 0);
          if (input.dateTo) {
            until = new Date(input.dateTo);
            until.setHours(23, 59, 59, 999);
          }
        } else {
          since = new Date();
          since.setDate(since.getDate() - input.days);
        }
        const { gte, lte, and: andOp } = await import('drizzle-orm');
        const whereClause = until
          ? andOp(gte(accessLogs.accessedAt, since), lte(accessLogs.accessedAt, until))
          : gte(accessLogs.accessedAt, since);
        const allLogs = await database
          .select()
          .from(accessLogs)
          .where(whereClause)
          .orderBy(sql`accessedAt DESC`);
        const teacherLogs = allLogs.filter(l => l.userType === 'teacher');
        const studentLogs = allLogs.filter(l => l.userType === 'student');

        // Contar por USUÁRIO ÚNICO POR DIA (não cada clique)
        // Professor: chave = userId + dia; Aluno: chave = studentId + dia
        // Usar timezone de Manaus (UTC-4) para agrupar por dia
        const toManausDate = (d: Date) => {
          const m = toManaus(new Date(d));
          return `${m.getUTCFullYear()}-${String(m.getUTCMonth()+1).padStart(2,'0')}-${String(m.getUTCDate()).padStart(2,'0')}`;
        };
        const teacherUniqueDays = new Set(
          teacherLogs.map(l => `${l.userId}::${toManausDate(l.accessedAt)}`)
        );
        const studentUniqueDays = new Set(
          studentLogs.map(l => `${l.studentId ?? l.userId}::${toManausDate(l.accessedAt)}`)
        );

        // Acessos por dia (contando usuários únicos por dia)
        const byDay: Record<string, { teachers: number; students: number }> = {};
        Array.from(teacherUniqueDays).forEach(key => {
          const day = key.split('::')[1];
          if (!byDay[day]) byDay[day] = { teachers: 0, students: 0 };
          byDay[day].teachers++;
        });
        Array.from(studentUniqueDays).forEach(key => {
          const day = key.split('::')[1];
          if (!byDay[day]) byDay[day] = { teachers: 0, students: 0 };
          byDay[day].students++;
        });

        // Contagem total: usuários únicos no período (não cliques)
        const uniqueTeachers = new Set(teacherLogs.map(l => l.userId)).size;
        const uniqueStudents = new Set(studentLogs.map(l => l.studentId ?? l.userId)).size;

        // Top usuários (por número de dias únicos de acesso)
        const teacherDaySet: Record<string, Set<string>> = {};
        for (const l of teacherLogs) {
          const name = l.userName || `Professor #${l.userId}`;
          if (!teacherDaySet[name]) teacherDaySet[name] = new Set();
          teacherDaySet[name].add(toManausDate(l.accessedAt));
        }
        const studentDaySet: Record<string, Set<string>> = {};
        for (const l of studentLogs) {
          const name = l.userName || `Aluno #${l.studentId}`;
          if (!studentDaySet[name]) studentDaySet[name] = new Set();
          studentDaySet[name].add(toManausDate(l.accessedAt));
        }

        // Acessos hoje em Manaus (UTC-4)
        const nowManaus = toManaus(new Date());
        const todayManaus = nowManaus.toISOString().slice(0, 10); // YYYY-MM-DD em Manaus
        const todayTeacherLogs = teacherLogs.filter(l => {
          const d = toManaus(new Date(l.accessedAt));
          const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
          return dateStr === todayManaus;
        });
        const todayStudentLogs = studentLogs.filter(l => {
          const d = toManaus(new Date(l.accessedAt));
          const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
          return dateStr === todayManaus;
        });
        // Usuários únicos hoje
        const todayTeachers = new Set(todayTeacherLogs.map(l => l.userId)).size;
        const todayStudents = new Set(todayStudentLogs.map(l => l.studentId ?? l.userId)).size;
        // Total de acessos (cliques) hoje - sem deduplicação
        const todayTeacherAccesses = todayTeacherLogs.length;
        const todayStudentAccesses = todayStudentLogs.length;

        // Função para parsear User-Agent
        const parseUA = (ua: string | null | undefined): { browser: string; os: string } => {
          if (!ua) return { browser: 'Desconhecido', os: 'Desconhecido' };
          let browser = 'Outro';
          let os = 'Outro';
          // Navegador
          if (ua.includes('Edg/') || ua.includes('Edge/')) browser = 'Microsoft Edge';
          else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';
          else if (ua.includes('Chrome/') && !ua.includes('Chromium/')) browser = 'Google Chrome';
          else if (ua.includes('Chromium/')) browser = 'Chromium';
          else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
          else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
          else if (ua.includes('MSIE') || ua.includes('Trident/')) browser = 'Internet Explorer';
          // Sistema Operacional
          if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
          else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
          else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
          else if (ua.includes('Windows')) os = 'Windows';
          else if (ua.includes('Android')) os = 'Android';
          else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
          else if (ua.includes('Mac OS X')) os = 'macOS';
          else if (ua.includes('Linux')) os = 'Linux';
          return { browser, os };
        };

        return {
          totalTeacher: uniqueTeachers,
          totalStudent: uniqueStudents,
          totalAll: uniqueTeachers + uniqueStudents,
          todayTeachers,
          todayStudents,
          todayTotal: todayTeachers + todayStudents,
          todayTeacherAccesses,
          todayStudentAccesses,
          todayTotalAccesses: todayTeacherAccesses + todayStudentAccesses,
          byDay: Object.entries(byDay)
            .map(([date, counts]) => ({ date, ...counts }))
            .sort((a, b) => a.date.localeCompare(b.date)),
          topTeachers: Object.entries(teacherDaySet)
            .map(([name, days]) => ({ name, count: days.size }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
          topStudents: Object.entries(studentDaySet)
            .map(([name, days]) => ({ name, count: days.size }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
          recentLogs: allLogs.slice(0, 100).map(l => {
            const { browser, os } = parseUA(l.userAgent);
            return {
              id: l.id,
              userType: l.userType,
              userName: l.userName,
              ipAddress: l.ipAddress,
              userAgent: l.userAgent,
              browser,
              os,
              accessedAt: l.accessedAt,
            };
          }),
        };
      }),

    // Mapa de calor: acessos por dia da semana x hora do dia
    getHeatmap: protectedProcedure
      .input(z.object({
        days: z.number().min(1).max(365).default(90),
        userType: z.enum(['all', 'teacher', 'student']).default('all'),
        timezoneOffset: z.number().min(-12).max(12).default(-4),
        dateFrom: z.string().optional(), // YYYY-MM-DD para período personalizado
        dateTo: z.string().optional(),   // YYYY-MM-DD para período personalizado
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { gte: gteOp2, lte: lteOp2, and: andOp2hm } = await import('drizzle-orm');
        let since2: Date;
        let until2: Date | undefined;
        if (input.dateFrom) {
          since2 = new Date(input.dateFrom + 'T00:00:00Z');
          until2 = input.dateTo ? new Date(input.dateTo + 'T23:59:59Z') : undefined;
        } else {
          since2 = new Date();
          since2.setDate(since2.getDate() - input.days);
        }
        const whereClause2 = until2
          ? andOp2hm(gteOp2(accessLogs.accessedAt, since2), lteOp2(accessLogs.accessedAt, until2))
          : gteOp2(accessLogs.accessedAt, since2);
        const allLogs2 = await database
          .select()
          .from(accessLogs)
          .where(whereClause2);
        const filtered = input.userType === 'all'
          ? allLogs2
          : allLogs2.filter(l => l.userType === input.userType);
        // Converter UTC para o fuso horário selecionado
        const toTz = (date: Date) => new Date(date.getTime() + input.timezoneOffset * 60 * 60 * 1000);
        const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
        for (const log of filtered) {
          const localDate = toTz(new Date(log.accessedAt));
          const dow = localDate.getUTCDay();
          const hour = localDate.getUTCHours();
          matrix[dow][hour]++;
        }
        return { matrix, total: filtered.length };
      }),

    // Mapa de calor filtrado por turma
    getHeatmapByClass: protectedProcedure
      .input(z.object({
        days: z.number().min(1).max(365).default(90),
        classId: z.number().optional(),
        timezoneOffset: z.number().min(-12).max(12).default(-4),
        dateFrom: z.string().optional(), // YYYY-MM-DD para período personalizado
        dateTo: z.string().optional(),   // YYYY-MM-DD para período personalizado
      }))
      .query(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const teacherId = ctx.user.id;
        const { gte: gteOp3, lte: lteOp3, and: andOp3 } = await import('drizzle-orm');
        let since3: Date;
        let until3: Date | undefined;
        if (input.dateFrom) {
          since3 = new Date(input.dateFrom + 'T00:00:00Z');
          until3 = input.dateTo ? new Date(input.dateTo + 'T23:59:59Z') : undefined;
        } else {
          since3 = new Date();
          since3.setDate(since3.getDate() - input.days);
        }

        // Buscar alunos da turma selecionada (se classId fornecido)
        let studentIds: number[] | undefined;
        if (input.classId) {
          const { studentClassEnrollments: sce } = await import('../drizzle/schema');
          const enrollRows = await database
            .select({ studentId: sce.studentId })
            .from(sce)
            .where(eq(sce.classId, input.classId));
          studentIds = enrollRows.map(r => r.studentId);
          if (studentIds.length === 0) return { matrix: Array.from({ length: 7 }, () => Array(24).fill(0)), total: 0, className: '' };
        }

        // Buscar nome da turma
        let className = 'Todas as turmas';
        if (input.classId) {
          const classRow = await database.select({ name: classes.name }).from(classes).where(eq(classes.id, input.classId)).limit(1);
          className = classRow[0]?.name ?? `Turma ${input.classId}`;
        }

        // Buscar logs de alunos no período, filtrados pela turma se necessário
        const dateWhereByClass = until3
          ? andOp3(gteOp3(accessLogs.accessedAt, since3), lteOp3(accessLogs.accessedAt, until3))
          : gteOp3(accessLogs.accessedAt, since3);
        let logsQuery = database
          .select({ accessedAt: accessLogs.accessedAt })
          .from(accessLogs)
          .where(andOp3(
            dateWhereByClass,
            eq(accessLogs.userType, 'student'),
            eq(accessLogs.teacherId, teacherId),
          ));

        const allStudentLogs = await logsQuery;

        // Filtrar por alunos da turma se necessário
        const filteredLogs = studentIds
          ? allStudentLogs.filter(l => {
              // Precisamos do studentId — buscar novamente com studentId
              return true; // placeholder, será substituído abaixo
            })
          : allStudentLogs;

        // Se filtro por turma, buscar com studentId
        let finalLogs: { accessedAt: Date }[];
        if (studentIds && studentIds.length > 0) {
          const logsWithStudentId = await database
            .select({ accessedAt: accessLogs.accessedAt, studentId: accessLogs.studentId })
            .from(accessLogs)
            .where(andOp3(
              dateWhereByClass,
              eq(accessLogs.userType, 'student'),
              eq(accessLogs.teacherId, teacherId),
            ));
          finalLogs = logsWithStudentId.filter(l => l.studentId !== null && studentIds!.includes(l.studentId!));
        } else {
          finalLogs = allStudentLogs;
        }

        const toTzByClass = (date: Date) => new Date(date.getTime() + input.timezoneOffset * 60 * 60 * 1000);
        const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
        for (const log of finalLogs) {
          const localDate = toTzByClass(new Date(log.accessedAt));
          const dow = localDate.getUTCDay();
          const hour = localDate.getUTCHours();
          matrix[dow][hour]++;
        }
        return { matrix, total: finalLogs.length, className };
      }),

    // Comparativo de dois períodos no mapa de calor
    getHeatmapCompare: protectedProcedure
      .input(z.object({
        // Período A
        daysA: z.number().min(1).max(365).default(7),
        dateFromA: z.string().optional(),
        dateToA: z.string().optional(),
        // Período B
        daysB: z.number().min(1).max(365).default(7),
        dateFromB: z.string().optional(),
        dateToB: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const teacherId = ctx.user.id;

        const buildRange = (days: number, dateFrom?: string, dateTo?: string) => {
          if (dateFrom) {
            const from = new Date(dateFrom);
            from.setUTCHours(0, 0, 0, 0);
            const to = dateTo ? new Date(dateTo) : new Date(from);
            to.setUTCHours(23, 59, 59, 999);
            return { from, to };
          }
          const to = new Date();
          const from = new Date();
          from.setDate(from.getDate() - days);
          return { from, to };
        };

        const rangeA = buildRange(input.daysA, input.dateFromA, input.dateToA);
        const rangeB = buildRange(input.daysB, input.dateFromB, input.dateToB);

        const fetchMatrix = async (from: Date, to: Date) => {
          const logs = await database
            .select({ accessedAt: accessLogs.accessedAt })
            .from(accessLogs)
            .where(and(
              eq(accessLogs.userType, 'student'),
              eq(accessLogs.teacherId, teacherId),
              gte(accessLogs.accessedAt, from),
              lte(accessLogs.accessedAt, to),
            ));
          const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
          for (const log of logs) {
            const manausDate = toManaus(new Date(log.accessedAt));
            matrix[manausDate.getUTCDay()][manausDate.getUTCHours()]++;
          }
          return { matrix, total: logs.length };
        };

        const [resultA, resultB] = await Promise.all([
          fetchMatrix(rangeA.from, rangeA.to),
          fetchMatrix(rangeB.from, rangeB.to),
        ]);

        // Calcular delta: positivo = mais acessos no período B, negativo = menos
        const delta: number[][] = Array.from({ length: 7 }, (_, d) =>
          Array.from({ length: 24 }, (_, h) => resultB.matrix[d][h] - resultA.matrix[d][h])
        );

        return {
          matrixA: resultA.matrix,
          matrixB: resultB.matrix,
          delta,
          totalA: resultA.total,
          totalB: resultB.total,
          labelA: input.dateFromA ? `${input.dateFromA}${input.dateToA ? ' a ' + input.dateToA : ''}` : `Últimos ${input.daysA} dias`,
          labelB: input.dateFromB ? `${input.dateFromB}${input.dateToB ? ' a ' + input.dateToB : ''}` : `Últimos ${input.daysB} dias`,
        };
      }),

    // Calendário anual: mapa de calor com acessos por dia (estilo GitHub contributions)
    getYearlyCalendar: protectedProcedure
      .input(z.object({
        year: z.number().min(2020).max(2030).default(new Date().getFullYear()),
        userType: z.enum(['all', 'teacher', 'student']).default('all'),
      }))
      .query(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const yearStart = new Date(`${input.year}-01-01T00:00:00Z`);
        const yearEnd = new Date(`${input.year}-12-31T23:59:59Z`);
        // Buscar todos os logs do ano (sem filtrar por teacherId, igual ao getSummary)
        const whereConditions = [
          gte(accessLogs.accessedAt, yearStart),
          lte(accessLogs.accessedAt, yearEnd),
        ];
        if (input.userType !== 'all') {
          whereConditions.push(eq(accessLogs.userType, input.userType));
        }
        const allLogs = await database
          .select({ accessedAt: accessLogs.accessedAt, userType: accessLogs.userType })
          .from(accessLogs)
          .where(and(...whereConditions));
        // Agrupar por data (YYYY-MM-DD) com offset Manaus (UTC-4)
        const dailyCounts: Record<string, number> = {};
        for (const log of allLogs) {
          const d = new Date(log.accessedAt.getTime() - 4 * 60 * 60 * 1000);
          const key = d.toISOString().slice(0, 10);
          dailyCounts[key] = (dailyCounts[key] || 0) + 1;
        }
        return { year: input.year, dailyCounts, total: allLogs.length };
      }),

    // Exportar todos os logs em CSV
    exportCSV: protectedProcedure
      .input(z.object({
        days: z.number().default(30),
        userType: z.enum(['all', 'teacher', 'student']).default('all'),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        // Determinar intervalo
        let since: Date;
        let until: Date | undefined;
        if (input.dateFrom) {
          since = new Date(input.dateFrom);
          since.setHours(0, 0, 0, 0);
          if (input.dateTo) {
            until = new Date(input.dateTo);
            until.setHours(23, 59, 59, 999);
          }
        } else {
          since = new Date();
          since.setDate(since.getDate() - input.days);
        }
        const rangeWhere = until
          ? and(gte(accessLogs.accessedAt, since), lt(accessLogs.accessedAt, until))
          : gte(accessLogs.accessedAt, since);
        let logs;
        if (input.userType !== 'all') {
          logs = await database
            .select()
            .from(accessLogs)
            .where(and(rangeWhere, eq(accessLogs.userType, input.userType)))
            .orderBy(accessLogs.accessedAt);
        } else {
          logs = await database
            .select()
            .from(accessLogs)
            .where(rangeWhere)
            .orderBy(accessLogs.accessedAt);
        }
        // Função para parsear User-Agent (reutilizada no CSV)
        const parseUAcsv = (ua: string | null | undefined): { browser: string; os: string } => {
          if (!ua) return { browser: 'Desconhecido', os: 'Desconhecido' };
          let browser = 'Outro', os = 'Outro';
          if (ua.includes('Edg/') || ua.includes('Edge/')) browser = 'Microsoft Edge';
          else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';
          else if (ua.includes('Chrome/') && !ua.includes('Chromium/')) browser = 'Google Chrome';
          else if (ua.includes('Chromium/')) browser = 'Chromium';
          else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
          else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
          else if (ua.includes('MSIE') || ua.includes('Trident/')) browser = 'Internet Explorer';
          if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
          else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
          else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
          else if (ua.includes('Windows')) os = 'Windows';
          else if (ua.includes('Android')) os = 'Android';
          else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
          else if (ua.includes('Mac OS X')) os = 'macOS';
          else if (ua.includes('Linux')) os = 'Linux';
          return { browser, os };
        };
        // Gerar CSV com Navegador e Sistema Operacional
        const header = ['Data/Hora (Manaus)', 'Tipo', 'Nome', 'IP', 'Navegador', 'Sistema Operacional', 'User-Agent', 'ID'];
        const rows = logs.map(l => {
          const manausDate = toManaus(new Date(l.accessedAt));
          const { browser, os } = parseUAcsv(l.userAgent);
          return [
            manausDate.toLocaleString('pt-BR', { timeZone: 'UTC' }),
            l.userType === 'teacher' ? 'Professor' : 'Aluno',
            l.userName ?? '',
            l.ipAddress ?? '',
            browser,
            os,
            l.userAgent ?? '',
            String(l.userId ?? ''),
          ];
        });
        const csvLines = [header, ...rows].map(r =>
          r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        );
        return { csv: csvLines.join('\n'), total: logs.length };
      }),

    // Acessos agrupados por turma
    getLogsByClass: protectedProcedure
      .input(z.object({
        days: z.number().min(1).max(365).default(30),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        classId: z.number().optional(),
        subjectId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const teacherId = ctx.user.id;
        const { gte: gteOp, lte: lteOp, and: andOp } = await import('drizzle-orm');
        // Determinar intervalo
        let since: Date;
        let until: Date | undefined;
        if (input.dateFrom) {
          since = new Date(input.dateFrom);
          since.setHours(0, 0, 0, 0);
          if (input.dateTo) {
            until = new Date(input.dateTo);
            until.setHours(23, 59, 59, 999);
          }
        } else {
          since = new Date();
          since.setDate(since.getDate() - input.days);
        }
        const rangeWhere = until
          ? andOp(gteOp(accessLogs.accessedAt, since), lteOp(accessLogs.accessedAt, until))
          : gteOp(accessLogs.accessedAt, since);

        // Buscar todos os logs de alunos no período
        const studentLogs = await database
          .select()
          .from(accessLogs)
          .where(andOp(rangeWhere, eq(accessLogs.userType, 'student')))
          .orderBy(sql`accessedAt DESC`);

        const { students: studentsTable, scheduledClasses, subjectEnrollments } = await import('../drizzle/schema');

        // Relação correta: subjectEnrollments -> scheduled_classes -> classes
        // subjectEnrollments.studentId + subjectEnrollments.subjectId
        // scheduled_classes.subjectId = subjectEnrollments.subjectId AND scheduled_classes.userId = teacherId
        // classes.id = scheduled_classes.classId
        let enrollQuery = database
          .select({
            classId: classes.id,
            className: classes.name,
            classCode: classes.code,
            studentId: subjectEnrollments.studentId,
            studentName: studentsTable.fullName,
            subjectId: subjectEnrollments.subjectId,
            subjectName: subjects.name,
          })
          .from(subjectEnrollments)
          .innerJoin(scheduledClasses, andOp(
            eq(scheduledClasses.subjectId, subjectEnrollments.subjectId),
            eq(scheduledClasses.userId, teacherId)
          ))
          .innerJoin(classes, eq(classes.id, scheduledClasses.classId))
          .innerJoin(subjects, eq(subjects.id, subjectEnrollments.subjectId))
          .leftJoin(studentsTable, eq(studentsTable.id, subjectEnrollments.studentId))
          .where(eq(subjectEnrollments.userId, teacherId));

        const allEnrollments = await enrollQuery;

        // Remover duplicatas (scheduled_classes pode ter múltiplos registros por disciplina)
        const seenKeys = new Set<string>();
        const uniqueEnrollments = allEnrollments.filter(e => {
          const key = `${e.studentId}::${e.classId}`;
          if (seenKeys.has(key)) return false;
          seenKeys.add(key);
          return true;
        });

        // Filtrar por disciplina se solicitado
        const filteredEnrollments = input.subjectId
          ? uniqueEnrollments.filter(e => e.subjectId === input.subjectId)
          : uniqueEnrollments;

        // Mapear studentId -> turmas e classId -> todos os alunos matriculados
        const studentToClasses: Record<number, { classId: number; className: string; classCode: string; subjectName?: string }[]> = {};
        const classAllStudents: Record<number, { id: number; name: string }[]> = {};
        // Mapear classId -> subjectName (primeira disciplina vinculada)
        const classSubjectMap: Record<number, string> = {};
        for (const row of filteredEnrollments) {
          if (!row.studentId) continue;
          if (!studentToClasses[row.studentId]) studentToClasses[row.studentId] = [];
          // Evitar duplicar turma para o mesmo aluno
          const alreadyHasClass = studentToClasses[row.studentId].some(c => c.classId === row.classId);
          if (!alreadyHasClass) {
            studentToClasses[row.studentId].push({ classId: row.classId, className: row.className, classCode: row.classCode, subjectName: row.subjectName ?? undefined });
          }
          // Registrar disciplina vinculada à turma
          if (!classSubjectMap[row.classId] && row.subjectName) {
            classSubjectMap[row.classId] = row.subjectName;
          }
          if (!classAllStudents[row.classId]) classAllStudents[row.classId] = [];
          const alreadyInClass = classAllStudents[row.classId].some(s => s.id === row.studentId);
          if (!alreadyInClass) {
            classAllStudents[row.classId].push({ id: row.studentId, name: row.studentName || `Aluno #${row.studentId}` });
          }
        }

        // Agrupar logs por turma
        const classSummary: Record<number, {
          classId: number;
          className: string;
          classCode: string;
          subjectName?: string;
          totalAccesses: number;
          uniqueStudents: Set<number>;
          students: Record<number, { studentId: number; name: string; count: number; lastAccess: Date }>;
          byDay: Record<string, number>;
        }> = {};

        let noClassCount = 0;
        const noClassStudents: Map<number, { studentId: number; name: string; lastAccess: Date; accessCount: number }> = new Map();

        for (const log of studentLogs) {
          if (!log.studentId) {
            noClassCount++;
            const existing = noClassStudents.get(-1);
            if (!existing) noClassStudents.set(-1, { studentId: -1, name: log.userName || 'Desconhecido', lastAccess: log.accessedAt, accessCount: 1 });
            else { existing.accessCount++; if (log.accessedAt > existing.lastAccess) existing.lastAccess = log.accessedAt; }
            continue;
          }
          const logClasses = studentToClasses[log.studentId] || [];
          if (logClasses.length === 0) {
            noClassCount++;
            const existing = noClassStudents.get(log.studentId);
            if (!existing) noClassStudents.set(log.studentId, { studentId: log.studentId, name: log.userName || `Aluno #${log.studentId}`, lastAccess: log.accessedAt, accessCount: 1 });
            else { existing.accessCount++; if (log.accessedAt > existing.lastAccess) existing.lastAccess = log.accessedAt; }
            continue;
          }

          for (const cls of logClasses) {
            if (input.classId && cls.classId !== input.classId) continue;

            if (!classSummary[cls.classId]) {
              classSummary[cls.classId] = {
                classId: cls.classId,
                className: cls.className,
                classCode: cls.classCode,
                subjectName: classSubjectMap[cls.classId],
                totalAccesses: 0,
                uniqueStudents: new Set(),
                students: {},
                byDay: {},
              };
            }
            const cs = classSummary[cls.classId];
            cs.totalAccesses++;
            cs.uniqueStudents.add(log.studentId);
            const sName = log.userName || `Aluno #${log.studentId}`;
            if (!cs.students[log.studentId]) cs.students[log.studentId] = { studentId: log.studentId, name: sName, count: 0, lastAccess: log.accessedAt };
            cs.students[log.studentId].count++;
            if (log.accessedAt > cs.students[log.studentId].lastAccess) cs.students[log.studentId].lastAccess = log.accessedAt;
            const day = log.accessedAt.toISOString().slice(0, 10);
            cs.byDay[day] = (cs.byDay[day] || 0) + 1;
          }
        }

        // Serializar resultado incluindo alunos sem acesso
        const result = Object.values(classSummary).map(cs => {
          const studentsWithAccess = new Set(Object.keys(cs.students).map(Number));
          const allInClass = classAllStudents[cs.classId] || [];
          const studentsWithoutAccess = allInClass.filter(s => !studentsWithAccess.has(s.id));
          return {
            classId: cs.classId,
            className: cs.className,
            classCode: cs.classCode,
            subjectName: cs.subjectName,
            totalAccesses: cs.totalAccesses,
            uniqueStudents: cs.uniqueStudents.size,
            totalEnrolled: allInClass.length,
            students: Object.values(cs.students).sort((a: any, b: any) => b.count - a.count),
            studentsWithoutAccess: studentsWithoutAccess.map(s => s.name),
            byDay: Object.entries(cs.byDay).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
          };
        }).sort((a, b) => b.totalAccesses - a.totalAccesses);

        // Incluir turma sem acesso quando filtro de classId especificado
        if (input.classId && !classSummary[input.classId]) {
          const cls = filteredEnrollments.find(e => e.classId === input.classId);
          if (cls) {
            const allInClass = classAllStudents[input.classId] || [];
            result.push({
              classId: cls.classId,
              className: cls.className,
              classCode: cls.classCode,
              subjectName: classSubjectMap[cls.classId],
              totalAccesses: 0,
              uniqueStudents: 0,
              totalEnrolled: allInClass.length,
              students: [],
              studentsWithoutAccess: allInClass.map(s => s.name),
              byDay: [],
            });
          }
        }

        return {
          classes: result,
          noClassCount,
          noClassStudents: Array.from(noClassStudents.values()).sort((a, b) => b.accessCount - a.accessCount),
          total: studentLogs.length,
        };
      }),

    // Lista de turmas para seletor de filtro (apenas turmas do professor logado)
    // Usa classes.userId = teacherId (relação direta: cada turma tem um professor dono)
    getClassList: protectedProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const teacherId = ctx.user.id;
      const classRows = await database
        .select({ id: classes.id, name: classes.name, code: classes.code })
        .from(classes)
        .where(eq(classes.userId, teacherId))
        .orderBy(classes.name);
      return classRows;
    }),

    // Lista de disciplinas do professor logado com turma vinculada via scheduled_classes
    getSubjectList: protectedProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const teacherId = ctx.user.id;
      const { scheduledClasses } = await import('../drizzle/schema');
      // Buscar disciplinas com a turma vinculada
      const rows = await database
        .select({
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
          classId: scheduledClasses.classId,
          className: classes.name,
          classCode: classes.code,
        })
        .from(subjects)
        .leftJoin(scheduledClasses, and(eq(scheduledClasses.subjectId, subjects.id), eq(scheduledClasses.userId, teacherId)))
        .leftJoin(classes, eq(classes.id, scheduledClasses.classId))
        .where(eq(subjects.userId, teacherId))
        .orderBy(subjects.name);
      // Remover duplicatas por disciplina (pegar primeira turma vinculada)
      const seen = new Set<number>();
      return rows.filter(r => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });
    }),

    // Exportar CSV de uma turma específica
    exportClassCSV: protectedProcedure
      .input(z.object({
        classId: z.number(),
        days: z.number().min(1).max(365).default(30),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { gte: gteOp, lte: lteOp, and: andOp } = await import('drizzle-orm');
        let since: Date;
        let until: Date | undefined;
        if (input.dateFrom) {
          since = new Date(input.dateFrom); since.setHours(0,0,0,0);
          if (input.dateTo) { until = new Date(input.dateTo); until.setHours(23,59,59,999); }
        } else {
          since = new Date(); since.setDate(since.getDate() - input.days);
        }
        const rangeWhere = until
          ? andOp(gteOp(accessLogs.accessedAt, since), lteOp(accessLogs.accessedAt, until))
          : gteOp(accessLogs.accessedAt, since);

        const { students: studentsTable, scheduledClasses, subjectEnrollments } = await import('../drizzle/schema');
        const { and: andOp2 } = await import('drizzle-orm');
        const teacherId = ctx.user.id;
        // Buscar alunos matriculados na turma via subjectEnrollments -> scheduled_classes -> classes
        const enrolledRaw = await database
          .select({ studentId: subjectEnrollments.studentId, studentName: studentsTable.fullName })
          .from(subjectEnrollments)
          .innerJoin(scheduledClasses, andOp2(
            eq(scheduledClasses.subjectId, subjectEnrollments.subjectId),
            eq(scheduledClasses.userId, teacherId)
          ))
          .innerJoin(classes, eq(classes.id, scheduledClasses.classId))
          .leftJoin(studentsTable, eq(studentsTable.id, subjectEnrollments.studentId))
          .where(andOp2(eq(subjectEnrollments.userId, teacherId), eq(classes.id, input.classId)));
        // Remover duplicatas
        const seenIds = new Set<number>();
        const enrolled = enrolledRaw.filter(e => {
          if (!e.studentId || seenIds.has(e.studentId)) return false;
          seenIds.add(e.studentId);
          return true;
        });

        // Buscar logs dos alunos da turma no período
        const enrolledIds = enrolled.map(e => e.studentId).filter(Boolean) as number[];
        const logs = enrolledIds.length > 0
          ? await database.select().from(accessLogs)
              .where(andOp(rangeWhere, eq(accessLogs.userType, 'student')))
              .orderBy(sql`accessedAt DESC`)
          : [];

        // Filtrar apenas logs dos alunos da turma
        const enrolledSet = new Set(enrolledIds);
        const classLogs = logs.filter(l => l.studentId && enrolledSet.has(l.studentId));

        // Montar mapa de contagem por aluno
        const studentMap: Record<number, { name: string; count: number; lastAccess: Date | null }> = {};
        for (const e of enrolled) {
          if (e.studentId) studentMap[e.studentId] = { name: e.studentName || `Aluno #${e.studentId}`, count: 0, lastAccess: null };
        }
        for (const log of classLogs) {
          if (log.studentId && studentMap[log.studentId]) {
            studentMap[log.studentId].count++;
            if (!studentMap[log.studentId].lastAccess || log.accessedAt > studentMap[log.studentId].lastAccess!) {
              studentMap[log.studentId].lastAccess = log.accessedAt;
            }
          }
        }

        // Gerar CSV
        const header = ['Aluno', 'Total de Acessos', 'Último Acesso', 'Status'];
        const rows = Object.values(studentMap).sort((a, b) => b.count - a.count).map(s => [
          s.name,
          s.count.toString(),
          s.lastAccess ? s.lastAccess.toLocaleDateString('pt-BR') : 'Sem acesso',
          s.count === 0 ? 'Sem acesso' : 'Ativo',
        ]);
        const csvLines = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','));
        return { csv: csvLines.join('\n'), total: enrolled.length, withAccess: Object.values(studentMap).filter(s => s.count > 0).length };
      }),

    // Limpar registros anteriores a uma data
    clearLogs: protectedProcedure
      .input(z.object({
        beforeDate: z.string().optional(),          // ISO date string ex: "2025-01-01" — inclui o dia selecionado
        clearAll: z.boolean().optional(),            // true = apaga TODOS os registros
        archiveBeforeDelete: z.boolean().optional(), // true = arquiva CSV no S3 antes de deletar
        archiveLabel: z.string().optional(),         // Nome descritivo do arquivo (ex: "Março 2026")
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const teacherId = ctx.user.id;
        let archiveResult: { fileName: string; url: string; recordCount: number } | null = null;

        // --- ARQUIVAMENTO AUTOMÁTICO ANTES DE DELETAR ---
        if (input.archiveBeforeDelete) {
          let logsToArchive: any[];
          if (input.clearAll) {
            logsToArchive = await database.select().from(accessLogs).orderBy(desc(accessLogs.accessedAt));
          } else if (input.beforeDate) {
            const cutoff = new Date(input.beforeDate + 'T23:59:59.999Z');
            logsToArchive = await database.select().from(accessLogs)
              .where(lte(accessLogs.accessedAt, cutoff)).orderBy(desc(accessLogs.accessedAt));
          } else {
            logsToArchive = [];
          }
          if (logsToArchive.length > 0) {
            // Converter para horário de Manaus (UTC-4)
            const csvHeader = 'ID,Tipo,Nome,IP,Navegador,Sistema,Data/Hora (Manaus)';
            const csvRows = logsToArchive.map((log: any) => {
              const ua = log.userAgent || '';
              let browser = 'Desconhecido';
              if (ua.includes('Edg/')) browser = 'Microsoft Edge';
              else if (ua.includes('Chrome/') && !ua.includes('Chromium')) browser = 'Google Chrome';
              else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
              else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
              else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';
              let os = 'Desconhecido';
              if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
              else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
              else if (ua.includes('Android')) os = 'Android';
              else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
              else if (ua.includes('Mac OS X')) os = 'macOS';
              else if (ua.includes('Linux')) os = 'Linux';
              const manausDate = toManaus(new Date(log.accessedAt));
              const dateStr = manausDate.toISOString().replace('T', ' ').slice(0, 19);
              return [log.id, log.userType === 'teacher' ? 'Professor' : 'Aluno',
                `"${(log.userName || '').replace(/"/g, '""')}"`,
                log.ipAddress || '', browser, os, dateStr].join(',');
            });
            const csvContent = [csvHeader, ...csvRows].join('\n');
            const { storagePut } = await import('./storage');
            const label = input.archiveLabel || `logs-${new Date().toISOString().slice(0, 10)}`;
            const fileName = `${label.replace(/[^a-zA-Z0-9-]/g, '_')}_${Date.now()}.csv`;
            const fileKey = `access-log-archives/teacher-${teacherId}/${fileName}`;
            const csvBuffer = Buffer.from(csvContent, 'utf-8');
            const { url } = await storagePut(fileKey, csvBuffer, 'text/csv');
            const periodStart = logsToArchive[logsToArchive.length - 1]?.accessedAt;
            const periodEnd = logsToArchive[0]?.accessedAt;
            await database.insert(accessLogArchives).values({
              teacherId, fileName, fileUrl: url, fileKey,
              recordCount: logsToArchive.length,
              periodStart: periodStart ? new Date(periodStart) : null,
              periodEnd: periodEnd ? new Date(periodEnd) : null,
              fileSizeBytes: csvBuffer.length,
            });
            archiveResult = { fileName, url, recordCount: logsToArchive.length };
          }
        }

        // --- DELEÇÃO ---
        let deletedCount = 0;
        if (input.clearAll) {
          const countResult = await database.select({ count: sql<number>`COUNT(*)` }).from(accessLogs);
          deletedCount = Number(countResult[0]?.count ?? 0);
          await database.delete(accessLogs);
        } else if (input.beforeDate) {
          const cutoff = new Date(input.beforeDate + 'T23:59:59.999Z');
          const countResult = await database.select({ count: sql<number>`COUNT(*)` })
            .from(accessLogs).where(lte(accessLogs.accessedAt, cutoff));
          deletedCount = Number(countResult[0]?.count ?? 0);
          await database.delete(accessLogs).where(lte(accessLogs.accessedAt, cutoff));
        } else {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Informe uma data ou use a opção Limpar Tudo' });
        }
        return { success: true, deletedCount, archiveResult };
      }),

    // Arquivar logs em CSV no S3 antes de limpar (salva histórico para análise futura)
    archiveLogs: protectedProcedure
      .input(z.object({
        label: z.string().optional(), // Nome descritivo do arquivo (ex: "Março 2026")
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const teacherId = ctx.user.id;

        // Buscar todos os registros do professor
        const logs = await database.select().from(accessLogs)
          .where(eq(accessLogs.userId, teacherId))
          .orderBy(desc(accessLogs.accessedAt));

        if (logs.length === 0) {
          return { success: false, message: 'Nenhum registro para arquivar.' };
        }

        // Converter para horário de Manaus (UTC-4)
        const csvHeader = 'ID,Tipo,Nome,IP,Navegador,Sistema,Data/Hora (Manaus)';
        const csvRows = logs.map(log => {
          const ua = log.userAgent || '';
          let browser = 'Desconhecido';
          if (ua.includes('Edg/')) browser = 'Microsoft Edge';
          else if (ua.includes('Chrome/') && !ua.includes('Chromium')) browser = 'Google Chrome';
          else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
          else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
          else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';
          let os = 'Desconhecido';
          if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
          else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
          else if (ua.includes('Android')) os = 'Android';
          else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
          else if (ua.includes('Mac OS X')) os = 'macOS';
          else if (ua.includes('Linux')) os = 'Linux';
          const manausDate = toManaus(new Date(log.accessedAt));
          const dateStr = manausDate.toISOString().replace('T', ' ').slice(0, 19);
          return [
            log.id,
            log.userType === 'teacher' ? 'Professor' : 'Aluno',
            `"${(log.userName || '').replace(/"/g, '""')}"`,
            log.ipAddress || '',
            browser,
            os,
            dateStr,
          ].join(',');
        });
        const csvContent = [csvHeader, ...csvRows].join('\n');

        // Upload para S3
        const { storagePut } = await import('./storage');
        const label = input.label || `logs-${new Date().toISOString().slice(0, 10)}`;
        const fileName = `${label.replace(/[^a-zA-Z0-9-]/g, '_')}_${Date.now()}.csv`;
        const fileKey = `access-log-archives/teacher-${teacherId}/${fileName}`;
        const csvBuffer = Buffer.from(csvContent, 'utf-8');
        const { url } = await storagePut(fileKey, csvBuffer, 'text/csv');

        // Salvar registro na tabela
        const periodStart = logs[logs.length - 1]?.accessedAt;
        const periodEnd = logs[0]?.accessedAt;
        await database.insert(accessLogArchives).values({
          teacherId,
          fileName,
          fileUrl: url,
          fileKey,
          recordCount: logs.length,
          periodStart: periodStart ? new Date(periodStart) : null,
          periodEnd: periodEnd ? new Date(periodEnd) : null,
          fileSizeBytes: csvBuffer.length,
        });

        return { success: true, fileName, url, recordCount: logs.length };
      }),

    // Listar arquivos históricos de logs
    listArchives: protectedProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) return [];
      const archives = await database.select().from(accessLogArchives)
        .where(eq(accessLogArchives.teacherId, ctx.user.id))
        .orderBy(desc(accessLogArchives.createdAt))
        .limit(50);
      return archives;
    }),

    // Deletar um arquivo histórico
    // Histórico de acessos de um aluno específico
    getStudentAccessHistory: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        days: z.number().optional().default(30),
      }))
      .query(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const teacherId = ctx.user.id;
        // Converter para horário de Manaus (UTC-4)
        const cutoff = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
        // Buscar nome do aluno
        const studentRows = await database
          .select({ id: students.id, name: students.fullName, registrationNumber: students.registrationNumber })
          .from(students)
          .where(and(eq(students.id, input.studentId), eq(students.userId, teacherId)))
          .limit(1);
        if (!studentRows.length) throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        const student = studentRows[0];
        // Buscar logs de acesso
        const logs = await database
          .select({
            id: accessLogs.id,
            accessedAt: accessLogs.accessedAt,
            userAgent: accessLogs.userAgent,
            browser: accessLogs.browser,
            os: accessLogs.os,
          })
          .from(accessLogs)
          .where(and(
            eq(accessLogs.studentId, input.studentId),
            eq(accessLogs.teacherId, teacherId),
            gte(accessLogs.accessedAt, cutoff),
          ))
          .orderBy(desc(accessLogs.accessedAt))
          .limit(200);
        return {
          student: {
            id: student.id,
            name: student.name,
            registrationNumber: student.registrationNumber,
          },
          logs: logs.map(l => {
            const manausDate = toManaus(new Date(l.accessedAt));
            return {
              id: l.id,
              accessedAt: l.accessedAt,
              accessedAtBRT: manausDate.toISOString(),
              browser: l.browser || 'Desconhecido',
              os: l.os || 'Desconhecido',
              userAgent: l.userAgent || '',
            };
          }),
          totalAccesses: logs.length,
        };
      }),
    deleteArchive: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await database.delete(accessLogArchives)
          .where(and(eq(accessLogArchives.id, input.id), eq(accessLogArchives.teacherId, ctx.user.id)));
        return { success: true };
      }),

    // Acessos suspeitos: fora do horário habitual (22h-6h) ou dispositivo nunca visto antes
    getSuspiciousAccess: protectedProcedure
      .input(z.object({
        days: z.number().min(1).max(90).default(30),
        nightStart: z.number().min(0).max(23).default(22), // hora de início do período noturno
        nightEnd: z.number().min(0).max(23).default(6),   // hora de fim do período noturno
      }))
      .query(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const teacherId = ctx.user.id;
        const cutoff = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

        // Buscar todos os logs de alunos no período
        const allLogs = await database
          .select({
            id: accessLogs.id,
            studentId: accessLogs.studentId,
            userName: accessLogs.userName,
            accessedAt: accessLogs.accessedAt,
            browser: accessLogs.browser,
            os: accessLogs.os,
            userAgent: accessLogs.userAgent,
          })
          .from(accessLogs)
          .where(and(
            eq(accessLogs.userType, 'student'),
            eq(accessLogs.teacherId, teacherId),
            gte(accessLogs.accessedAt, cutoff),
          ))
          .orderBy(desc(accessLogs.accessedAt));

        // Construir perfil de dispositivos por aluno (histórico antes do período atual)
        // Para detectar dispositivo novo, comparamos com logs mais antigos
        const deviceProfileByStudent: Record<number, Set<string>> = {};
        const historicCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 dias de histórico
        const historicLogs = await database
          .select({ studentId: accessLogs.studentId, browser: accessLogs.browser, os: accessLogs.os })
          .from(accessLogs)
          .where(and(
            eq(accessLogs.userType, 'student'),
            eq(accessLogs.teacherId, teacherId),
            gte(accessLogs.accessedAt, historicCutoff),
          ));
        for (const log of historicLogs) {
          if (!log.studentId) continue;
          if (!deviceProfileByStudent[log.studentId]) deviceProfileByStudent[log.studentId] = new Set();
          const deviceKey = `${log.browser ?? 'Desconhecido'}|${log.os ?? 'Desconhecido'}`;
          deviceProfileByStudent[log.studentId].add(deviceKey);
        }

        // Identificar acessos suspeitos
        const suspicious: Array<{
          id: number;
          studentId: number | null;
          studentName: string;
          accessedAt: Date;
          hour: number;
          browser: string;
          os: string;
          reason: string[];
        }> = [];

        // Rastrear dispositivos já vistos no período atual (para não alertar duas vezes)
        const newDeviceAlerted: Record<number, Set<string>> = {};

        for (const log of allLogs) {
          const reasons: string[] = [];
          const d = toManaus(new Date(log.accessedAt));
          const hour = d.getUTCHours(); // convertido para Manaus (UTC-4)

          // Verificar acesso noturno
          const isNight = input.nightStart > input.nightEnd
            ? hour >= input.nightStart || hour < input.nightEnd
            : hour >= input.nightStart && hour < input.nightEnd;
          if (isNight) reasons.push(`Acesso às ${hour}h (horário noturno)`);

          // Verificar dispositivo novo
          if (log.studentId) {
            const deviceKey = `${log.browser ?? 'Desconhecido'}|${log.os ?? 'Desconhecido'}`;
            if (!newDeviceAlerted[log.studentId]) newDeviceAlerted[log.studentId] = new Set();
            // Dispositivo novo = não estava no histórico de 90 dias E ainda não alertado
            const historicBeforePeriod = historicLogs
              .filter(h => h.studentId === log.studentId)
              .some(h => `${h.browser ?? 'Desconhecido'}|${h.os ?? 'Desconhecido'}` === deviceKey);
            if (!historicBeforePeriod && !newDeviceAlerted[log.studentId].has(deviceKey)) {
              reasons.push(`Dispositivo novo: ${log.browser ?? 'Desconhecido'} / ${log.os ?? 'Desconhecido'}`);
              newDeviceAlerted[log.studentId].add(deviceKey);
            }
          }

          if (reasons.length > 0) {
            suspicious.push({
              id: log.id,
              studentId: log.studentId,
              studentName: log.userName ?? 'Aluno desconhecido',
              accessedAt: log.accessedAt,
              hour,
              browser: log.browser ?? 'Desconhecido',
              os: log.os ?? 'Desconhecido',
              reason: reasons,
            });
          }
        }

        return {
          alerts: suspicious.slice(0, 100), // limitar a 100 alertas
          total: suspicious.length,
          nightAccesses: suspicious.filter(s => s.reason.some(r => r.includes('noturno'))).length,
          newDeviceAccesses: suspicious.filter(s => s.reason.some(r => r.includes('Dispositivo novo'))).length,
        };
      }),

    // Métricas de engajamento acadêmico para artigo científico
    getEngagementMetrics: protectedProcedure
      .input(z.object({
        days: z.number().min(1).max(365).default(90),
      }))
      .query(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const teacherId = ctx.user.id;
        const cutoff = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

        // Buscar todos os logs de alunos no período
        const logs = await database
          .select()
          .from(accessLogs)
          .where(and(
            eq(accessLogs.userType, 'student'),
            eq(accessLogs.teacherId, teacherId),
            gte(accessLogs.accessedAt, cutoff),
          ))
          .orderBy(desc(accessLogs.accessedAt));

        // Taxa de retorno: alunos que acessaram em mais de 1 semana distinta
        const studentWeeks: Record<number, Set<string>> = {};
        for (const log of logs) {
          if (!log.studentId) continue;
          const d = log.accessedAt;
          const week = `${d.getUTCFullYear()}-W${Math.ceil(d.getUTCDate() / 7)}`;
          if (!studentWeeks[log.studentId]) studentWeeks[log.studentId] = new Set();
          studentWeeks[log.studentId].add(week);
        }
        const totalStudents = Object.keys(studentWeeks).length;
        const returningStudents = Object.values(studentWeeks).filter(w => w.size > 1).length;
        const returnRate = totalStudents > 0 ? Math.round((returningStudents / totalStudents) * 100) : 0;

        // Frequência média de acesso por aluno (acessos por semana)
        const studentAccessCount: Record<number, number> = {};
        for (const log of logs) {
          if (!log.studentId) continue;
          studentAccessCount[log.studentId] = (studentAccessCount[log.studentId] ?? 0) + 1;
        }
        const weeksInPeriod = Math.max(1, Math.ceil(input.days / 7));
        const avgAccessesPerStudentPerWeek = totalStudents > 0
          ? Math.round((Object.values(studentAccessCount).reduce((a, b) => a + b, 0) / totalStudents / weeksInPeriod) * 10) / 10
          : 0;

        // Distribuição por dia da semana (0=Dom, 1=Seg, ..., 6=Sáb)
        const byDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
        for (const log of logs) {
          byDayOfWeek[log.accessedAt.getUTCDay()]++;
        }

        // Distribuição por hora do dia (0-23)
        const byHour = Array(24).fill(0);
        for (const log of logs) {
          byHour[log.accessedAt.getUTCHours()]++;
        }

        // Pico de acesso (dia e hora mais comuns)
        const peakDayIndex = byDayOfWeek.indexOf(Math.max(...byDayOfWeek));
        const peakHour = byHour.indexOf(Math.max(...byHour));
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

        // Consistência: alunos que acessaram em pelo menos 75% das semanas do período
        const consistentStudents = Object.values(studentWeeks).filter(w => w.size >= weeksInPeriod * 0.75).length;
        const consistencyRate = totalStudents > 0 ? Math.round((consistentStudents / totalStudents) * 100) : 0;

        // Distribuição por dispositivo
        const deviceDist: Record<string, number> = {};
        for (const log of logs) {
          const device = log.os ?? 'Desconhecido';
          deviceDist[device] = (deviceDist[device] ?? 0) + 1;
        }

        // Distribuição por navegador
        const browserDist: Record<string, number> = {};
        for (const log of logs) {
          const browser = log.browser ?? 'Desconhecido';
          browserDist[browser] = (browserDist[browser] ?? 0) + 1;
        }

        // Tendência semanal: acessos por semana
        const weeklyTrend: Record<string, number> = {};
        for (const log of logs) {
          const d = log.accessedAt;
          const year = d.getUTCFullYear();
          const weekNum = Math.ceil((d.getUTCDate() + new Date(year, d.getUTCMonth(), 1).getDay()) / 7);
          const weekKey = `${year}-S${String(weekNum).padStart(2, '0')}`;
          weeklyTrend[weekKey] = (weeklyTrend[weekKey] ?? 0) + 1;
        }

        return {
          totalLogs: logs.length,
          totalStudents,
          returningStudents,
          returnRate,
          consistentStudents,
          consistencyRate,
          avgAccessesPerStudentPerWeek,
          peakDay: dayNames[peakDayIndex],
          peakHour,
          byDayOfWeek: byDayOfWeek.map((count, i) => ({ day: dayNames[i], count })),
          byHour: byHour.map((count, h) => ({ hour: h, count })),
          deviceDistribution: Object.entries(deviceDist)
            .map(([device, count]) => ({ device, count, pct: Math.round(count / logs.length * 100) }))
            .sort((a, b) => b.count - a.count),
          browserDistribution: Object.entries(browserDist)
            .map(([browser, count]) => ({ browser, count, pct: Math.round(count / logs.length * 100) }))
            .sort((a, b) => b.count - a.count),
          weeklyTrend: Object.entries(weeklyTrend)
            .map(([week, count]) => ({ week, count }))
            .sort((a, b) => a.week.localeCompare(b.week)),
        };
      }),

    // Análise acadêmica com IA para apoiar escrita de artigo científico
    getAcademicInsights: protectedProcedure
      .input(z.object({
        days: z.number().min(1).max(365).default(90),
        focus: z.enum(['engagement', 'behavior', 'technology', 'full']).default('full'),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const teacherId = ctx.user.id;
        const cutoff = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

        // Coletar métricas resumidas para enviar à IA
        const logs = await database
          .select()
          .from(accessLogs)
          .where(and(
            eq(accessLogs.userType, 'student'),
            eq(accessLogs.teacherId, teacherId),
            gte(accessLogs.accessedAt, cutoff),
          ));

        const totalStudents = new Set(logs.map(l => l.studentId).filter(Boolean)).size;
        const byDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
        const byHour = Array(24).fill(0);
        const deviceDist: Record<string, number> = {};
        const browserDist: Record<string, number> = {};
        const studentWeeks: Record<number, Set<string>> = {};

        for (const log of logs) {
          byDayOfWeek[log.accessedAt.getUTCDay()]++;
          byHour[log.accessedAt.getUTCHours()]++;
          const device = log.os ?? 'Desconhecido';
          deviceDist[device] = (deviceDist[device] ?? 0) + 1;
          const browser = log.browser ?? 'Desconhecido';
          browserDist[browser] = (browserDist[browser] ?? 0) + 1;
          if (log.studentId) {
            const d = log.accessedAt;
            const week = `${d.getUTCFullYear()}-W${Math.ceil(d.getUTCDate() / 7)}`;
            if (!studentWeeks[log.studentId]) studentWeeks[log.studentId] = new Set();
            studentWeeks[log.studentId].add(week);
          }
        }

        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const peakDayIndex = byDayOfWeek.indexOf(Math.max(...byDayOfWeek));
        const peakHour = byHour.indexOf(Math.max(...byHour));
        const returningStudents = Object.values(studentWeeks).filter(w => w.size > 1).length;
        const returnRate = totalStudents > 0 ? Math.round((returningStudents / totalStudents) * 100) : 0;
        const nightAccesses = logs.filter(l => { const h = l.accessedAt.getUTCHours(); return h >= 22 || h < 6; }).length;
        const nightPct = logs.length > 0 ? Math.round((nightAccesses / logs.length) * 100) : 0;
        const topDevice = Object.entries(deviceDist).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Desconhecido';
        const topBrowser = Object.entries(browserDist).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Desconhecido';

        const dataContext = `
Dados coletados do sistema FlowEdu no período de ${input.days} dias:
- Total de acessos de alunos: ${logs.length}
- Total de alunos únicos: ${totalStudents}
- Taxa de retorno (alunos que acessaram em mais de 1 semana): ${returnRate}%
- Dia da semana com mais acessos: ${dayNames[peakDayIndex]} (${byDayOfWeek[peakDayIndex]} acessos)
- Horário de pico: ${peakHour}h (${byHour[peakHour]} acessos)
- Acessos no horário noturno (22h-6h): ${nightAccesses} (${nightPct}%)
- Dispositivo mais usado: ${topDevice}
- Navegador mais usado: ${topBrowser}
- Distribuição por dia da semana: ${dayNames.map((d, i) => `${d}: ${byDayOfWeek[i]}`).join(', ')}
- Distribuição por dispositivo: ${Object.entries(deviceDist).map(([d, c]) => `${d}: ${c}`).join(', ')}
`;

        const focusPrompt = {
          engagement: 'Foque na análise de engajamento e frequência de acesso dos alunos.',
          behavior: 'Foque nos padrões comportamentais: horários, consistência, acessos noturnos.',
          technology: 'Foque no perfil tecnológico: dispositivos, navegadores e implicações para design.',
          full: 'Faça uma análise completa cobrindo engajamento, comportamento e tecnologia.',
        }[input.focus];

        const response = await invokeLLM({
          feature: 'learning_analytics',
          messages: [
            {
              role: 'system',
              content: `Você é um especialista em Tecnologia Educacional e Análise de Dados Acadêmicos. 
Sua tarefa é analisar dados de acesso de um sistema educacional digital e gerar insights acadêmicos 
que possam embasar um artigo científico sobre o uso de tecnologia e IA na educação. 
Responda em português brasileiro, com linguagem acadêmica, citando implicações pedagógicas, 
possíveis hipóteses de pesquisa e sugestões de análise qualitativa. 
Estruture sua resposta em seções: Observações, Hipóteses, Implicações Pedagógicas e Sugestões para o Artigo.`,
            },
            {
              role: 'user',
              content: `${dataContext}\n\n${focusPrompt}\n\nGere insights acadêmicos detalhados para apoiar a escrita de um artigo científico sobre como educadores podem usar sistemas tecnológicos com auxílio de IA para melhorar o desenvolvimento de alunos e professores.`,
            },
          ],
        });

        const content = response?.choices?.[0]?.message?.content ?? 'Não foi possível gerar insights no momento.';
        return { insights: content, dataContext, generatedAt: new Date().toISOString() };
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

    // Obter perfil completo do aluno (com campos demográficos)
    getMyProfile: studentProcedure.query(async ({ ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error('Database not available');
      const result = await dbInstance.select().from(students)
        .where(eq(students.id, ctx.studentSession.studentId))
        .limit(1);
      if (!result[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
      return result[0];
    }),

    // Atualizar perfil do aluno (campos demográficos)
    updateMyProfile: studentProcedure
      .input(z.object({
        email: z.string().email('E-mail inválido').optional().or(z.literal('')),
        birthDate: z.string().optional(),
        gender: z.enum(['masculino', 'feminino', 'nao_binario', 'personalizar', 'prefiro_nao_informar']).optional(),
        genderCustom: z.string().max(100).optional(),
        pronoun: z.enum(['ele_dele', 'ela_dela', 'elu_delu', 'prefiro_nao_informar']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error('Database not available');
        await dbInstance.update(students)
          .set({
            email: input.email || null,
            birthDate: input.birthDate || null,
            gender: input.gender,
            genderCustom: input.genderCustom || null,
            pronoun: input.pronoun,
          })
          .where(eq(students.id, ctx.studentSession.studentId));
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
        const result = await db.updateStudentTopicProgress({
          studentId: ctx.studentSession.studentId,
          ...input,
        });
        
        // Registro automático de comportamento
        try {
          if (input.status === 'completed') {
            await db.recordStudentBehavior({
              studentId: ctx.studentSession.studentId,
              userId: ctx.studentSession.professorId,
              behaviorType: 'topic_access',
              score: input.selfAssessment === 'understood' ? 100 : input.selfAssessment === 'have_doubts' ? 60 : 30,
              metadata: JSON.stringify({ topicId: input.topicId, status: 'completed', selfAssessment: input.selfAssessment }),
            });
          } else if (input.status === 'in_progress') {
            await db.recordStudentBehavior({
              studentId: ctx.studentSession.studentId,
              userId: ctx.studentSession.professorId,
              behaviorType: 'topic_access',
              metadata: JSON.stringify({ topicId: input.topicId, status: 'in_progress' }),
            });
          }
        } catch (e) {
          console.error('Erro ao registrar comportamento:', e);
        }
        
        return result;
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
    
    // Sistema de Dúvidas movido para studentDoubts router
    
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

    // ─── PRÓXIMOS PRAZOS ──────────────────────────────────────────────
    getUpcomingDeadlines: studentProcedure
      .query(async ({ ctx }) => {
        const dbConn = await db.getDb();
        if (!dbConn) return [];
        const studentId = ctx.studentSession.studentId;

        // Buscar disciplinas e turmas do aluno
        const enrollResult = await dbConn.execute(
          sql`SELECT DISTINCT subjectId FROM subjectEnrollments WHERE studentId = ${studentId} AND status = 'active'`
        ) as any[];
        const subjectIds = ((enrollResult[0] as any[]) || []).map((r: any) => r.subjectId).filter(Boolean) as number[];

        const classResult = await dbConn.execute(
          sql`SELECT DISTINCT classId FROM student_class_enrollments WHERE studentId = ${studentId}`
        ) as any[];
        const classIds = ((classResult[0] as any[]) || []).map((r: any) => r.classId).filter(Boolean) as number[];

        if (subjectIds.length === 0 && classIds.length === 0) return [];

        const deadlines: Array<{
          id: number;
          title: string;
          type: 'activity' | 'assignment' | 'assessment';
          dueDate: string;
          subjectName: string | null;
          className: string | null;
          submitted: boolean;
        }> = [];

        // Prazos: de 2 dias atrás até 30 dias no futuro
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
        const subjectPlaceholders = subjectIds.length > 0 ? subjectIds.map(id => sql`${id}`) : [sql`NULL`];
        const classPlaceholders = classIds.length > 0 ? classIds.map(id => sql`${id}`) : [sql`NULL`];

        // 1) Atividades (activities) com dueDate
        try {
          const actResult = await dbConn.execute(
            sql`SELECT a.id, a.title, a.dueDate, s.name AS subjectName, c.name AS className,
                       (SELECT COUNT(*) FROM activity_submissions asub WHERE asub.activityId = a.id AND asub.studentId = ${studentId}) AS submitted
                FROM activities a
                LEFT JOIN subjects s ON a.subjectId = s.id
                LEFT JOIN classes c ON a.classId = c.id
                WHERE a.status = 'published'
                  AND a.dueDate IS NOT NULL
                  AND a.dueDate >= ${twoDaysAgo}
                  AND (
                    a.subjectId IN (${sql.join(subjectPlaceholders, sql`, `)})
                    OR a.classId IN (${sql.join(classPlaceholders, sql`, `)})
                  )
                ORDER BY a.dueDate ASC
                LIMIT 20`
          ) as any[];
          for (const row of (actResult[0] || []) as any[]) {
            deadlines.push({
              id: row.id,
              title: row.title,
              type: 'activity',
              dueDate: row.dueDate ? new Date(row.dueDate).toISOString() : '',
              subjectName: row.subjectName || null,
              className: row.className || null,
              submitted: Number(row.submitted) > 0,
            });
          }
        } catch (e) { /* ignore */ }

        // 2) Exercícios de tópico (topic_assignments) com dueDate
        try {
          const assignResult = await dbConn.execute(
            sql`SELECT ta.id, ta.title, ta.dueDate, s.name AS subjectName
                FROM topic_assignments ta
                JOIN ct_topics ct ON ta.topicId = ct.id
                JOIN ct_modules cm ON ct.moduleId = cm.id
                JOIN subjects s ON cm.subjectId = s.id
                WHERE ta.dueDate IS NOT NULL
                  AND ta.dueDate >= ${twoDaysAgo}
                  AND s.id IN (${sql.join(subjectPlaceholders, sql`, `)})
                ORDER BY ta.dueDate ASC
                LIMIT 20`
          ) as any[];
          for (const row of (assignResult[0] || []) as any[]) {
            deadlines.push({
              id: row.id,
              title: row.title,
              type: 'assignment',
              dueDate: row.dueDate ? new Date(row.dueDate).toISOString() : '',
              subjectName: row.subjectName || null,
              className: null,
              submitted: false,
            });
          }
        } catch (e) { /* ignore */ }

        // 3) Provas (assessments) com availableTo
        try {
          const assessResult = await dbConn.execute(
            sql`SELECT a.id, a.title, a.availableTo AS dueDate, s.name AS subjectName,
                       (SELECT COUNT(*) FROM assessment_attempts aa WHERE aa.assessmentId = a.id AND aa.studentId = ${studentId}) AS attempted
                FROM assessments a
                LEFT JOIN subjects s ON a.subjectId = s.id
                WHERE a.status = 'published'
                  AND a.availableTo IS NOT NULL
                  AND a.availableTo >= ${twoDaysAgo}
                  AND a.subjectId IN (${sql.join(subjectPlaceholders, sql`, `)})
                ORDER BY a.availableTo ASC
                LIMIT 10`
          ) as any[];
          for (const row of (assessResult[0] || []) as any[]) {
            deadlines.push({
              id: row.id,
              title: row.title,
              type: 'assessment',
              dueDate: row.dueDate ? new Date(row.dueDate).toISOString() : '',
              subjectName: row.subjectName || null,
              className: null,
              submitted: Number(row.attempted) > 0,
            });
          }
        } catch (e) { /* ignore */ }

        // Ordenar por data mais próxima
        deadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        return deadlines.slice(0, 15);
      }),

    // Salvar tema de cores do aluno (independente do professor)
    saveTheme: studentProcedure
      .input(z.object({
        colorTheme: z.string().max(32),
        themeMode: z.string().max(16),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const studentId = ctx.studentSession.studentId;
        await database.execute(
          sql`UPDATE students SET colorTheme = ${input.colorTheme}, themeMode = ${input.themeMode} WHERE id = ${studentId}`
        );
        return { success: true };
      }),

    // Buscar tema de cores do aluno
    getTheme: studentProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const studentId = ctx.studentSession.studentId;
      const result = await database.execute(
        sql`SELECT colorTheme, themeMode FROM students WHERE id = ${studentId} LIMIT 1`
      ) as any;
      const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : (Array.isArray(result) ? result : []);
      const row = rows[0];
      return {
        colorTheme: row?.colorTheme || 'default',
        themeMode: row?.themeMode || 'system',
      };
    }),
  }),

  // Professor Materials Management
  materials: router({
    create: protectedProcedure
      .input(z.object({
        topicId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        type: z.enum(['pdf', 'video', 'link', 'presentation', 'document', 'audio', 'image', 'other']),
        url: z.string(),
        fileSize: z.number().optional(),
        isRequired: z.boolean().optional(),
        folderId: z.number().nullable().optional(),
        subjectId: z.number().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const material = await db.createTopicMaterial({
          ...input,
          professorId: ctx.user.id,
        });
        // Notificar alunos quando material obrigatório é adicionado
        if (input.isRequired && input.subjectId) {
          try {
            const database = await getDb();
            if (database) {
              const enrolled = await database.select({ studentId: subjectEnrollments.studentId })
                .from(subjectEnrollments)
                .where(eq(subjectEnrollments.subjectId, input.subjectId));
              for (const e of enrolled) {
                if (e.studentId) {
                  await db.createNotification({
                    userId: e.studentId,
                    type: 'new_material',
                    title: 'Novo Material Obrigatório',
                    message: `O professor adicionou um novo material obrigatório: "${input.title}". Acesse para baixar.`,
                    link: '/student/materials',
                    relatedId: material.id,
                  });
                }
              }
              console.log(`[Materials] Notificação enviada para ${enrolled.length} alunos`);
            }
          } catch (err: any) { console.error(`[Materials] Erro notificação: ${err.message}`); }
        }
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
        const result = await db.deleteTopicMaterial(input.id, ctx.user.id);
        
        // Apagar arquivo físico do disco se for armazenamento local
        if (result.deletedUrl && result.deletedUrl.startsWith('/uploads/')) {
          try {
            const fs = await import('fs');
            const path = await import('path');
            const filePath = path.default.join(process.cwd(), result.deletedUrl);
            if (fs.default.existsSync(filePath)) {
              fs.default.unlinkSync(filePath);
              console.log(`[Materials] Arquivo deletado do disco: ${filePath}`);
            }
          } catch (fileErr: any) {
            console.error(`[Materials] Erro ao deletar arquivo: ${fileErr.message}`);
            // Não falhar a operação se o arquivo não puder ser deletado
          }
        }
        
        return { success: true };
      }),
    
    getByTopic: protectedProcedure
      .input(z.object({ topicId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getTopicMaterials(input.topicId);
      }),

    createForModule: protectedProcedure
      .input(z.object({
        moduleId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        type: z.enum(['pdf', 'video', 'link', 'presentation', 'document', 'other']),
        url: z.string(),
        fileSize: z.number().optional(),
        isRequired: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const material = await db.createModuleMaterial({
          ...input,
          professorId: ctx.user.id,
        });
        return material;
      }),

    getByModule: protectedProcedure
      .input(z.object({ moduleId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getModuleMaterials(input.moduleId);
      }),

    // Listar todos os materiais do professor (visão centralizada)
    listAll: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAllMaterialsByProfessor(ctx.user.id);
    }),
    // Listar materiais disponíveis para o aluno (das disciplinas matriculadas)
    listForStudent: studentProcedure.query(async ({ ctx }) => {
      return await db.getMaterialsForStudent(ctx.studentSession.studentId);
    }),
    // Atualizar subjectId de um material
    updateSubject: protectedProcedure
      .input(z.object({ materialId: z.number(), subjectId: z.number().nullable() }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        const { topicMaterials } = await import("../drizzle/schema");
        await database.update(topicMaterials)
          .set({ subjectId: input.subjectId })
          .where(and(eq(topicMaterials.id, input.materialId), eq(topicMaterials.professorId, ctx.user.id)));
        return { success: true };
      }),
    // Registrar download de material
    trackDownload: studentProcedure
      .input(z.object({ materialId: z.number() }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        const { topicMaterials } = await import("../drizzle/schema");
        await database.update(topicMaterials)
          .set({ downloadCount: sql`downloadCount + 1` })
          .where(eq(topicMaterials.id, input.materialId));
        return { success: true };
      }),
    // Listar pastas do professor
    listFolders: protectedProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");
      const { materialFolders } = await import("../drizzle/schema");
      return await database.select().from(materialFolders)
        .where(eq(materialFolders.professorId, ctx.user.id))
        .orderBy(materialFolders.orderIndex);
    }),
    createFolder: protectedProcedure
      .input(z.object({ name: z.string(), description: z.string().optional(), color: z.string().optional(), subjectId: z.number().nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        const { materialFolders } = await import("../drizzle/schema");
        const [result]: any = await database.insert(materialFolders).values({ professorId: ctx.user.id, name: input.name, description: input.description || null, color: input.color || '#0d9488', subjectId: input.subjectId || null });
        return { id: Number(result.insertId || 0), ...input };
      }),
    updateFolder: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), description: z.string().optional(), color: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        const { materialFolders } = await import("../drizzle/schema");
        const { id, ...data } = input;
        await database.update(materialFolders).set(data as any).where(and(eq(materialFolders.id, id), eq(materialFolders.professorId, ctx.user.id)));
        return { success: true };
      }),
    deleteFolder: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        const { materialFolders, topicMaterials } = await import("../drizzle/schema");
        await database.update(topicMaterials).set({ folderId: null }).where(and(eq(topicMaterials.folderId, input.id), eq(topicMaterials.professorId, ctx.user.id)));
        await database.delete(materialFolders).where(and(eq(materialFolders.id, input.id), eq(materialFolders.professorId, ctx.user.id)));
        return { success: true };
      }),
    moveToFolder: protectedProcedure
      .input(z.object({ materialId: z.number(), folderId: z.number().nullable() }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        const { topicMaterials } = await import("../drizzle/schema");
        await database.update(topicMaterials).set({ folderId: input.folderId }).where(and(eq(topicMaterials.id, input.materialId), eq(topicMaterials.professorId, ctx.user.id)));
        return { success: true };
      }),
    // Obter uso e limite de armazenamento individual do professor logado
    getMyStorageInfo: protectedProcedure.query(async ({ ctx }) => {
      const usage = await db.getTeacherStorageUsage(ctx.user.id);
      const limitMB = await db.getTeacherStorageLimit(ctx.user.id);
      return { ...usage, limitMB };
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
        
        // Notificar alunos matriculados sobre nova atividade de trilha
        try {
          // Buscar o módulo via tópico para obter o subjectId
          const topic = await db.getLearningTopicsByModule(input.topicId, ctx.user.id);
          const topicData = topic?.find((t: any) => t.id === input.topicId);
          if (topicData) {
            const moduleData = await db.getLearningModuleById(topicData.moduleId, ctx.user.id);
            if (moduleData) {
              const enrolled = await db.getStudentsBySubject(moduleData.subjectId, ctx.user.id);
              const activeStudents = enrolled.filter((s: any) => s.status === 'active' && s.userId);
              const dueMsg = input.dueDate
                ? ` Prazo: ${new Date(input.dueDate).toLocaleDateString('pt-BR')}.`
                : '';
              for (const student of activeStudents) {
                await db.createNotification({
                  userId: (student as any).userId,
                  type: 'new_assignment',
                  title: '📋 Nova Atividade Disponível',
                  message: `A atividade "${input.title}" foi adicionada à trilha de aprendizado.${dueMsg}`,
                  link: '/student/learning-path',
                  relatedId: assignment.id,
                });
              }
            }
          }
        } catch (e) {
          console.error('[assignments.create] Erro ao notificar alunos:', e);
        }
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
        email: z.string().email("E-mail inválido").optional().or(z.literal('')),
        birthDate: z.string().optional().or(z.literal('')),
        gender: z.enum(["masculino", "feminino", "nao_binario", "personalizar", "prefiro_nao_informar"]).optional(),
        genderCustom: z.string().max(100).optional().or(z.literal('')),
        pronoun: z.enum(["ele_dele", "ela_dela", "elu_delu", "prefiro_nao_informar"]).optional(),
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
        email: z.string().email("E-mail inválido").optional().or(z.literal('')).or(z.null()),
        birthDate: z.string().optional().or(z.literal('')).or(z.null()),
        gender: z.enum(["masculino", "feminino", "nao_binario", "personalizar", "prefiro_nao_informar"]).optional(),
        genderCustom: z.string().max(100).optional().or(z.literal('')).or(z.null()),
        pronoun: z.enum(["ele_dele", "ela_dela", "elu_delu", "prefiro_nao_informar"]).optional(),
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
        isUrgent: z.boolean().optional().default(false),
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
        
        // Criar notificação interna + push para cada aluno matriculado
        const urgentPrefix = input.isUrgent ? '⚠️ URGENTE: ' : '';
        const pushTitle = input.isImportant 
          ? `🚨 ${urgentPrefix}Aviso Importante: ${input.title}` 
          : `📢 ${urgentPrefix}Novo Aviso: ${input.title}`;
        const pushBody = `${subject?.name || 'Disciplina'}: ${input.message.substring(0, 100)}${input.message.length > 100 ? '...' : ''}`;
        for (const student of enrolledStudents) {
          if (!student.userId) continue; // Pular alunos sem conta de usuário
          try {
            // Notificação interna (aparece dentro do app)
            await db.createNotification({
              userId: student.userId,
              type: 'new_announcement',
              title: pushTitle,
              message: pushBody,
              link: '/student-announcements',
              relatedId: announcement.id,
            });
            // Push notification (chega mesmo com app fechado)
            // Se urgente, ignora horário silencioso
            pushNotif.sendPushNotification(student.userId, {
              title: pushTitle,
              body: pushBody,
              tag: `announcement-${announcement.id}`,
              url: '/student-announcements',
              type: 'announcement',
              referenceId: String(announcement.id),
              urgent: input.isUrgent,
            }).catch(err => console.error('[Push] Erro ao enviar push de aviso para aluno', student.userId, err));
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

        // Registro automático de comportamento - exercício CT completado
        try {
          await db.recordStudentBehavior({
            studentId: ctx.studentSession.studentId,
            userId: ctx.studentSession.professorId,
            subjectId: input.subjectId,
            behaviorType: 'exercise_completion',
            score: analysis.score,
            metadata: JSON.stringify({
              exerciseId: input.exerciseId,
              dimension: exercise.dimension,
              type: 'computational_thinking',
            }),
          });
        } catch (e) {
          console.error('Erro ao registrar comportamento CT:', e);
        }

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
        
        // Registro automático de comportamento - exercício completado
        try {
          await db.recordStudentBehavior({
            studentId,
            userId: ctx.studentSession.professorId,
            behaviorType: 'exercise_completion',
            score: result.score || 0,
            metadata: JSON.stringify({
              exerciseId: input.exerciseId,
              correctAnswers: result.correctAnswers,
              totalQuestions: result.totalQuestions,
              score: result.score,
            }),
          });
        } catch (e) {
          console.error('Erro ao registrar comportamento de exercício:', e);
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
              // correctAnswers e totalQuestions não existem na tabela de tentativas;
              // usar os valores calculados a partir das respostas detalhadas
              correctAnswers: results?.correctCount ?? 0,
              totalQuestions: results?.totalQuestions ?? 0,
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

    // Boletim do aluno: histórico de notas por disciplina
    getGradeBook: studentProcedure
      .query(async ({ ctx }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error("Database not available");

        const { studentExercises, studentExerciseAttempts, subjects, subjectEnrollments } = await import("../drizzle/schema");

        // Buscar matrículas do aluno
        const enrollments = await db.getStudentEnrollments(ctx.studentSession.studentId);
        const subjectIds = enrollments.map((e: any) => e.subjectId);

        if (subjectIds.length === 0) return [];

        // Buscar todas as tentativas do aluno com dados do exercício e disciplina
        const attempts = await dbInstance
          .select({
            attemptId: studentExerciseAttempts.id,
            exerciseId: studentExercises.id,
            exerciseTitle: studentExercises.title,
            subjectId: studentExercises.subjectId,
            subjectName: subjects.name,
            bimestre: studentExercises.bimestre,
            score: studentExerciseAttempts.score,
            passingScore: studentExercises.passingScore,
            totalQuestions: studentExercises.totalQuestions,
            completedAt: studentExerciseAttempts.completedAt,
            status: studentExerciseAttempts.status,
          })
          .from(studentExerciseAttempts)
          .innerJoin(studentExercises, eq(studentExerciseAttempts.exerciseId, studentExercises.id))
          .innerJoin(subjects, eq(studentExercises.subjectId, subjects.id))
          .where(
            and(
              eq(studentExerciseAttempts.studentId, ctx.studentSession.studentId),
              eq(studentExerciseAttempts.status, "completed"),
              inArray(studentExercises.subjectId, subjectIds)
            )
          )
          .orderBy(desc(studentExerciseAttempts.completedAt));

        // Agrupar por disciplina
        const bySubject: Record<number, {
          subjectId: number;
          subjectName: string;
          grades: Array<{
            attemptId: number;
            exerciseId: number;
            exerciseTitle: string;
            bimestre: number;
            grade: number;
            passingGrade: number;
            totalQuestions: number;
            pointsPerQuestion: number;
            approved: boolean;
            completedAt: Date | null;
          }>;
          average: number;
          totalAttempts: number;
          approvedCount: number;
        }> = {};

        for (const a of attempts) {
          if (!bySubject[a.subjectId]) {
            bySubject[a.subjectId] = {
              subjectId: a.subjectId,
              subjectName: a.subjectName,
              grades: [],
              average: 0,
              totalAttempts: 0,
              approvedCount: 0,
            };
          }
          const grade = parseFloat(((a.score ?? 0) / 10).toFixed(2));
          const passingGrade = parseFloat(((a.passingScore ?? 60) / 10).toFixed(1));
          const approved = (a.score ?? 0) >= (a.passingScore ?? 60);
          const pointsPerQuestion = a.totalQuestions > 0
            ? parseFloat((10 / a.totalQuestions).toFixed(2))
            : 0;

          bySubject[a.subjectId].grades.push({
            attemptId: a.attemptId,
            exerciseId: a.exerciseId,
            exerciseTitle: a.exerciseTitle,
            bimestre: a.bimestre ?? 1,
            grade,
            passingGrade,
            totalQuestions: a.totalQuestions,
            pointsPerQuestion,
            approved,
            completedAt: a.completedAt,
          });
          bySubject[a.subjectId].totalAttempts++;
          if (approved) bySubject[a.subjectId].approvedCount++;
        }

        // Calcular média por disciplina — usando nota mais alta por exercício
        for (const s of Object.values(bySubject)) {
          if (s.grades.length > 0) {
            // Agrupar por exerciseId e pegar a nota mais alta de cada
            const bestByExercise = new Map<number, typeof s.grades[0]>();
            for (const g of s.grades) {
              const existing = bestByExercise.get(g.exerciseId);
              if (!existing || g.grade > existing.grade) {
                bestByExercise.set(g.exerciseId, g);
              }
            }
            const bestGrades = Array.from(bestByExercise.values());
            s.grades = bestGrades; // Substituir grades pelas melhores notas
            s.average = parseFloat(
              (bestGrades.reduce((sum, g) => sum + g.grade, 0) / bestGrades.length).toFixed(2)
            );
            s.approvedCount = bestGrades.filter(g => g.approved).length;
          }
        }

        return Object.values(bySubject).sort((a, b) => a.subjectName.localeCompare(b.subjectName));
      }),

    // Buscar notas de atividades em sala (avaliadas pelo professor)
    getActivityGrades: studentProcedure
      .query(async ({ ctx }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error("Database not available");

        const { activities, activitySubmissions, subjects } = await import("../drizzle/schema");

        // Buscar todas as submissões avaliadas do aluno com dados da atividade e disciplina
        const gradedSubmissions = await dbInstance
          .select({
            submissionId: activitySubmissions.id,
            activityId: activities.id,
            activityTitle: activities.title,
            subjectId: activities.subjectId,
            subjectName: subjects.name,
            bimestre: activities.bimestre,
            maxScore: activities.maxScore,
            score: activitySubmissions.score,
            feedback: activitySubmissions.feedback,
            status: activitySubmissions.status,
            gradedAt: activitySubmissions.gradedAt,
            submittedAt: activitySubmissions.submittedAt,
          })
          .from(activitySubmissions)
          .innerJoin(activities, eq(activitySubmissions.activityId, activities.id))
          .innerJoin(subjects, eq(activities.subjectId, subjects.id))
          .where(
            and(
              eq(activitySubmissions.studentId, ctx.studentSession.studentId),
              eq(activitySubmissions.status, "graded")
            )
          )
          .orderBy(desc(activitySubmissions.gradedAt));

        // Agrupar por disciplina
        const bySubject: Record<number, {
          subjectId: number;
          subjectName: string;
          grades: Array<{
            submissionId: number;
            activityId: number;
            activityTitle: string;
            bimestre: number;
            score: number;
            maxScore: number;
            grade10: number; // Nota convertida para escala 0-10
            feedback: string | null;
            gradedAt: Date | null;
            submittedAt: Date | null;
          }>;
          average: number;
          totalGraded: number;
          approvedCount: number;
        }> = {};

        for (const s of gradedSubmissions) {
          const subId = s.subjectId ?? 0;
          if (!bySubject[subId]) {
            bySubject[subId] = {
              subjectId: subId,
              subjectName: s.subjectName ?? "Sem disciplina",
              grades: [],
              average: 0,
              totalGraded: 0,
              approvedCount: 0,
            };
          }
          const scoreNum = parseFloat(String(s.score ?? 0));
          const maxScoreNum = parseFloat(String(s.maxScore ?? 10));
          const grade10 = maxScoreNum > 0 ? parseFloat(((scoreNum / maxScoreNum) * 10).toFixed(2)) : 0;
          const approved = grade10 >= 6;

          bySubject[subId].grades.push({
            submissionId: s.submissionId,
            activityId: s.activityId,
            activityTitle: s.activityTitle,
            bimestre: s.bimestre ?? 1,
            score: scoreNum,
            maxScore: maxScoreNum,
            grade10,
            feedback: s.feedback,
            gradedAt: s.gradedAt,
            submittedAt: s.submittedAt,
          });
          bySubject[subId].totalGraded++;
          if (approved) bySubject[subId].approvedCount++;
        }

        // Calcular média por disciplina — usando nota mais alta por atividade
        for (const sub of Object.values(bySubject)) {
          if (sub.grades.length > 0) {
            // Agrupar por activityId e pegar a nota mais alta de cada
            const bestByActivity = new Map<number, typeof sub.grades[0]>();
            for (const g of sub.grades) {
              const existing = bestByActivity.get(g.activityId);
              if (!existing || g.grade10 > existing.grade10) {
                bestByActivity.set(g.activityId, g);
              }
            }
            const bestGrades = Array.from(bestByActivity.values());
            sub.grades = bestGrades;
            sub.average = parseFloat(
              (bestGrades.reduce((sum, g) => sum + g.grade10, 0) / bestGrades.length).toFixed(2)
            );
            sub.totalGraded = bestGrades.length;
            sub.approvedCount = bestGrades.filter(g => g.grade10 >= 6).length;
          }
        }

        return Object.values(bySubject).sort((a, b) => a.subjectName.localeCompare(b.subjectName));
      }),
    // Contar exercícios pendentes (não tentados) para tela de boas-vindas
    getPendingCount: studentProcedure.query(async ({ ctx }) => {
      const studentId = ctx.studentSession.studentId;
      const exercises = await db.listAvailableExercises(studentId);
      const pending = exercises.filter((e: any) => e.attempts === 0);
      return { pendingCount: pending.length, totalExercises: exercises.length };
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
        shuffleQuestions: z.boolean().default(false),
        availableFrom: z.date(),
        availableTo: z.date().optional(),
        bimestre: z.number().min(1).max(4).default(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createStudentExercise({
          ...input,
          teacherId: ctx.user.id,
          status: "published",
        });
        const exerciseId = result[0].insertId;

        // Notificar alunos matriculados na disciplina
        try {
          const enrolled = await db.getStudentsBySubject(input.subjectId, ctx.user.id);
          const activeStudents = enrolled.filter((s: any) => s.status === 'active' && s.userId);
          const availableMsg = input.availableTo
            ? ` Disponível até ${new Date(input.availableTo).toLocaleDateString('pt-BR')}.`
            : '';
          for (const student of activeStudents) {
            await db.createNotification({
              userId: (student as any).userId,
              type: 'new_assignment',
              title: '📚 Novo Exercício Disponível',
              message: `O exercício "${input.title}" foi publicado.${availableMsg}`,
              link: '/student/exercises',
              relatedId: exerciseId,
            });
          }
        } catch (e) {
          console.error('[teacherExercises.publish] Erro ao notificar alunos:', e);
        }

        return { success: true, exerciseId };
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

    // Obter exercício para edição
    getForEdit: protectedProcedure
      .input(z.object({ exerciseId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getExerciseForEdit(input.exerciseId, ctx.user.id);
      }),

    // Atualizar exercício
    update: protectedProcedure
      .input(z.object({
        exerciseId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        exerciseData: z.any().optional(),
        totalQuestions: z.number().optional(),
        totalPoints: z.number().optional(),
        passingScore: z.number().optional(),
        exerciseType: z.enum(["multiple_choice", "true_false", "fill_blank", "matching", "ordering", "essay", "short_answer"]).optional(),
        difficulty: z.enum(["easy", "medium", "hard", "expert"]).optional(),
        points: z.number().optional(),
        timeLimit: z.number().nullable().optional(),
        maxAttempts: z.number().optional(),
        showAnswersAfter: z.boolean().optional(),
        availableFrom: z.date().nullable().optional(),
        availableTo: z.date().nullable().optional(),
        isActive: z.boolean().optional(),
        status: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { exerciseId, ...data } = input;
        return await db.updateStudentExercise(exerciseId, ctx.user.id, data);
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
        dateFrom: z.string().optional(), // ISO date string ex: "2025-01-01"
        dateTo: z.string().optional(),   // ISO date string ex: "2025-03-31"
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
        
        // Evolução temporal — período personalizado ou últimos 30 dias
        let periodStart: Date;
        let periodEnd: Date;
        if (input.dateFrom) {
          periodStart = new Date(input.dateFrom);
          periodStart.setHours(0, 0, 0, 0);
          periodEnd = input.dateTo ? new Date(input.dateTo) : new Date();
          periodEnd.setHours(23, 59, 59, 999);
        } else {
          periodEnd = new Date();
          periodStart = new Date();
          periodStart.setDate(periodStart.getDate() - 30);
        }
        
        const temporalData = new Map<string, { scores: number[], total: number, completed: number }>();
        
        // Contar todas as tentativas por data dentro do período selecionado
        attempts.forEach(attempt => {
          let dateStr: string;
          if (attempt.completedAt) {
            const d = new Date(attempt.completedAt);
            if (d < periodStart || d > periodEnd) return;
            dateStr = d.toISOString().split('T')[0];
          } else {
            return; // Sem data, ignorar
          }
          if (!temporalData.has(dateStr)) {
            temporalData.set(dateStr, { scores: [], total: 0, completed: 0 });
          }
          const data = temporalData.get(dateStr)!;
          data.total++;
          if (attempt.status === 'completed') {
            data.scores.push(attempt.score || 0);
            data.completed++;
          }
        });
        
        const temporalEvolution = Array.from(temporalData.entries())
          .map(([date, data]) => ({
            date,
            averageScore: data.scores.length > 0 
              ? Math.round((data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length) * 10) / 10 
              : 0,
            completionRate: data.total > 0 
              ? Math.round((data.completed / data.total) * 100 * 10) / 10 
              : 0,
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

    // Dashboard de estatísticas de desempenho
    getDashboardStats: protectedProcedure
      .query(async ({ ctx }) => {
        const teacherId = ctx.user.id;

        // Buscar estatísticas gerais
        const overallStats = await db.getOverallStats(teacherId);

        // Buscar exercícios mais difíceis (top 5)
        const hardestExercises = await db.getHardestExercises(teacherId, 5);

        // Buscar top alunos (top 5)
        const topStudents = await db.getTopStudents(teacherId, 5);

        return {
          overallStats,
          hardestExercises,
          topStudents,
        };
      }),
    // Contador de conclusão por exercício: quantos alunos fizeram e quantos faltam
    getCompletionStats: protectedProcedure
      .input(z.object({
        subjectId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const db_instance = await db.getDb();
        if (!db_instance) throw new Error("Database not available");

        const { studentExercises: seTable, studentExerciseAttempts: seaTable, subjectEnrollments: seEnroll } = await import("../drizzle/schema");

        // Buscar exercícios do professor
        const exerciseConditions: any[] = [eq(seTable.teacherId, ctx.user.id)];
        if (input.subjectId) {
          exerciseConditions.push(eq(seTable.subjectId, input.subjectId));
        }

        const exercises = await db_instance
          .select({ id: seTable.id, subjectId: seTable.subjectId })
          .from(seTable)
          .where(and(...exerciseConditions));

        if (exercises.length === 0) return {};

        const exerciseIds = exercises.map(e => e.id);

        // Buscar tentativas completadas (distinct studentId por exercício)
        const completedRows = await db_instance
          .select({
            exerciseId: seaTable.exerciseId,
            studentId: seaTable.studentId,
          })
          .from(seaTable)
          .where(
            and(
              sql`${seaTable.exerciseId} IN (${sql.join(exerciseIds.map(id => sql`${id}`), sql`, `)})`,
              eq(seaTable.status, 'completed')
            )
          );

        // Agrupar por exercício: set de studentIds únicos que completaram
        const completedByExercise = new Map<number, Set<number>>();
        completedRows.forEach(row => {
          if (!completedByExercise.has(row.exerciseId)) {
            completedByExercise.set(row.exerciseId, new Set());
          }
          completedByExercise.get(row.exerciseId)!.add(row.studentId);
        });

        // Para cada disciplina única, contar alunos matriculados ativos
        const uniqueSubjectIds = Array.from(new Set(exercises.map(e => e.subjectId)));
        const enrollmentCounts = new Map<number, number>();
        for (const subjectId of uniqueSubjectIds) {
          const enrolled = await db_instance
            .select({ studentId: seEnroll.studentId })
            .from(seEnroll)
            .where(
              and(
                eq(seEnroll.subjectId, subjectId),
                eq(seEnroll.userId, ctx.user.id),
                eq(seEnroll.status, 'active')
              )
            );
          enrollmentCounts.set(subjectId, enrolled.length);
        }

        // Montar resultado: { [exerciseId]: { done: number, total: number, pending: number } }
        const result: Record<number, { done: number; total: number; pending: number }> = {};
        for (const exercise of exercises) {
          const done = completedByExercise.get(exercise.id)?.size ?? 0;
          const total = enrollmentCounts.get(exercise.subjectId) ?? 0;
          result[exercise.id] = {
            done,
            total,
            pending: Math.max(0, total - done),
          };
        }

        return result;
      }),

    // Listar alunos que fizeram tentativas no exercício (para modal de reset)
    getStudentAttemptsList: protectedProcedure
      .input(z.object({ exerciseId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db_instance = await db.getDb();
        if (!db_instance) throw new Error('Database not available');
        const { studentExercises: seTable } = await import('../drizzle/schema');
        // Buscar o exercício - aceitar admin ou dono do exercício
        const [exercise] = await db_instance
          .select({ id: seTable.id, teacherId: seTable.teacherId, maxAttempts: seTable.maxAttempts })
          .from(seTable)
          .where(eq(seTable.id, input.exerciseId))
          .limit(1);
        if (!exercise) throw new TRPCError({ code: 'NOT_FOUND', message: 'Exercício não encontrado' });
        // Verificar permissão: dono do exercício ou admin
        if (exercise.teacherId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão para ver este exercício' });
        }
        // Buscar tentativas agrupadas por aluno
        const attemptsRaw = await db_instance.execute(
          sql`SELECT sea.studentId, COUNT(*) as attemptCount, MAX(sea.createdAt) as lastAttempt, MAX(sea.status) as lastStatus
              FROM student_exercise_attempts sea
              WHERE sea.exerciseId = ${input.exerciseId}
              GROUP BY sea.studentId`
        ) as any[];
        console.log('[getStudentAttemptsList] exerciseId:', input.exerciseId, 'userId:', ctx.user.id, 'attemptsRaw type:', typeof attemptsRaw, 'isArray:', Array.isArray(attemptsRaw), 'length:', attemptsRaw?.length, 'raw[0] length:', (attemptsRaw[0] as any[])?.length);
        const attempts = (attemptsRaw[0] as any[]) || [];
        if (attempts.length === 0) return { students: [], maxAttempts: exercise.maxAttempts };
        const studentIds = attempts.map((a: any) => Number(a.studentId));
        // Buscar cada aluno individualmente para compatibilidade com TiDB/MySQL2
        const individualResults = await Promise.all(
          studentIds.map(async (sid: number) => {
            const res = await db_instance.execute(
              sql`SELECT id, fullName as name, fullName, registrationNumber FROM students WHERE id = ${sid} LIMIT 1`
            ) as any[];
            return ((res[0] as any[]) || [])[0];
          })
        );
        const studentInfos = individualResults.filter(Boolean);
        const nameMap = new Map(studentInfos.map((s: any) => [s.id, s.fullName || s.name?.trim() || `Aluno #${s.id}`]));
        return {
          maxAttempts: exercise.maxAttempts,
          students: attempts.map((a: any) => ({
            studentId: Number(a.studentId),
            name: nameMap.get(Number(a.studentId)) ?? `Aluno #${a.studentId}`,
            attemptCount: Number(a.attemptCount),
            lastAttempt: a.lastAttempt,
            status: a.lastStatus,
          }))
        };
      }),

    // Resetar tentativas de um aluno específico em um exercício
    resetStudentAttempts: protectedProcedure
      .input(z.object({ exerciseId: z.number(), studentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db_instance = await db.getDb();
        if (!db_instance) throw new Error('Database not available');
        const { studentExercises: seTable, studentExerciseAttempts: seaTable } = await import('../drizzle/schema');
        // Verificar se o exercício pertence ao professor
        const [exercise] = await db_instance
          .select({ id: seTable.id })
          .from(seTable)
          .where(and(eq(seTable.id, input.exerciseId), eq(seTable.teacherId, ctx.user.id)))
          .limit(1);
        if (!exercise) throw new TRPCError({ code: 'NOT_FOUND', message: 'Exercício não encontrado ou sem permissão' });
        // Buscar tentativas do aluno
        const studentAttempts = await db_instance
          .select({ id: seaTable.id })
          .from(seaTable)
          .where(and(eq(seaTable.exerciseId, input.exerciseId), eq(seaTable.studentId, input.studentId)));
        if (studentAttempts.length === 0) return { success: true, deleted: 0 };
        const attemptIds = studentAttempts.map(a => a.id);
        // Deletar respostas das tentativas
        await db_instance.execute(
          sql`DELETE FROM student_exercise_answers WHERE attemptId IN (${sql.join(attemptIds.map(id => sql`${id}`), sql`, `)})`
        );
        // Deletar as tentativas
        await db_instance.delete(seaTable)
          .where(and(eq(seaTable.exerciseId, input.exerciseId), eq(seaTable.studentId, input.studentId)));
        return { success: true, deleted: attemptIds.length };
      }),

    // Atualizar maxAttempts de um exercício
    updateExerciseMaxAttempts: protectedProcedure
      .input(z.object({ exerciseId: z.number(), maxAttempts: z.number().min(1).max(99) }))
      .mutation(async ({ ctx, input }) => {
        const db_instance = await db.getDb();
        if (!db_instance) throw new Error('Database not available');
        const { studentExercises: seTable } = await import('../drizzle/schema');
        const [exercise] = await db_instance
          .select({ id: seTable.id })
          .from(seTable)
          .where(and(eq(seTable.id, input.exerciseId), eq(seTable.teacherId, ctx.user.id)))
          .limit(1);
        if (!exercise) throw new TRPCError({ code: 'NOT_FOUND', message: 'Exercício não encontrado ou sem permissão' });
        await db_instance.update(seTable)
          .set({ maxAttempts: input.maxAttempts })
          .where(eq(seTable.id, input.exerciseId));
        return { success: true };
      }),
    // Listar alunos que ainda NÃO fizeram o exercício (pendentes)
    getPendingStudents: protectedProcedure
      .input(z.object({ exerciseId: z.number() }))
      .query(async ({ ctx, input }) => {
        const dbConn = await getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        // Verificar que o exercício pertence ao professor
        const exResult = await dbConn.execute(
          sql`SELECT id, subjectId, title FROM student_exercises WHERE id = ${input.exerciseId} AND teacherId = ${ctx.user.id} LIMIT 1`
        ) as any[];
        const exRows = (exResult[0] as any[]) || [];
        if (exRows.length === 0) throw new TRPCError({ code: 'NOT_FOUND', message: 'Exercício não encontrado' });
        const { subjectId, title } = exRows[0];
        // Buscar todos os alunos matriculados na disciplina (com nome correto da tabela students)
        const allStudentsResult = await dbConn.execute(
          sql`SELECT s.id AS studentId, s.fullName AS name
              FROM students s
              INNER JOIN subjectEnrollments se ON se.studentId = s.id
              WHERE se.subjectId = ${subjectId} AND se.status = 'active'
              ORDER BY s.fullName ASC`
        ) as any[];
        const allStudents: { studentId: number; name: string }[] = ((allStudentsResult[0] as any[]) || []).map((r: any) => ({
          studentId: r.studentId,
          name: r.name || `Aluno #${r.studentId}`,
        }));
        if (allStudents.length === 0) return { pending: [], done: [], total: 0, exerciseTitle: title };
        // Buscar alunos que já completaram o exercício
        const doneResult = await dbConn.execute(
          sql`SELECT DISTINCT studentId FROM student_exercise_attempts WHERE exerciseId = ${input.exerciseId} AND status = 'completed'`
        ) as any[];
        const doneIds = new Set(((doneResult[0] as any[]) || []).map((r: any) => r.studentId));
        const done = allStudents.filter(s => doneIds.has(s.studentId));
        const pending = allStudents.filter(s => !doneIds.has(s.studentId));
        return {
          pending,
          done,
          total: allStudents.length,
          exerciseTitle: title,
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
            feature: 'student_study_tips',
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
            feature: 'student_study_material',
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
        // Buscar dados do aluno
        const student = await db.getStudentById(input.studentId, ctx.user.id);
        if (!student) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }

        // ===== COLETAR DADOS EXISTENTES DO SISTEMA =====
        
        // 1. Buscar disciplinas do aluno
        const studentSubjects = await db.getSubjectsByStudent(input.studentId, ctx.user.id);
        
        // 2. Buscar nome da disciplina selecionada (se houver)
        let subjectName = 'Todas as disciplinas';
        if (input.subjectId) {
          const subject = await db.getSubjectById(input.subjectId, ctx.user.id);
          subjectName = subject?.name || 'Disciplina';
        }
        
        // 3. Buscar trilha de aprendizagem (módulos e tópicos)
        const subjectsToAnalyze = input.subjectId 
          ? [input.subjectId] 
          : studentSubjects.map(s => s.subjectId);
        
        let totalModules = 0;
        let totalTopics = 0;
        const learningPathInfo: Array<{ subjectName: string; modules: Array<{ title: string; topics: Array<{ title: string }> }> }> = [];
        
        for (const subId of subjectsToAnalyze) {
          try {
            const modules = await db.getLearningPathBySubject(subId, ctx.user.id);
            const subjectInfo = await db.getSubjectById(subId, ctx.user.id);
            if (modules.length > 0) {
              totalModules += modules.length;
              const moduleInfo = modules.map(m => {
                totalTopics += m.topics?.length || 0;
                return {
                  title: m.title,
                  topics: (m.topics || []).map(t => ({ title: t.title })),
                };
              });
              learningPathInfo.push({
                subjectName: subjectInfo?.name || 'Disciplina',
                modules: moduleInfo,
              });
            }
          } catch (e) {
            // Ignorar erros ao buscar trilha
          }
        }
        
        // 4. Buscar progresso do aluno nos tópicos
        let completedTopics = 0;
        let inProgressTopics = 0;
        const progressDetails: Array<{ subject: string; completed: number; inProgress: number; total: number }> = [];
        
        for (const subId of subjectsToAnalyze) {
          try {
            const progress = await db.getStudentProgressBySubject(input.studentId, subId);
            const subjectInfo = await db.getSubjectById(subId, ctx.user.id);
            const modules = await db.getLearningPathBySubject(subId, ctx.user.id);
            const subjectTotalTopics = modules.reduce((sum, m) => sum + (m.topics?.length || 0), 0);
            const completed = progress.filter(p => p.status === 'completed').length;
            const inProg = progress.filter(p => p.status === 'in_progress').length;
            completedTopics += completed;
            inProgressTopics += inProg;
            progressDetails.push({
              subject: subjectInfo?.name || 'Disciplina',
              completed,
              inProgress: inProg,
              total: subjectTotalTopics,
            });
          } catch (e) {
            // Ignorar erros
          }
        }
        
        // 5. Buscar exercícios recentes (se houver)
        let exerciseInfo = 'Nenhum exercício respondido ainda';
        try {
          const recentExercises = await db.getStudentExerciseHistory(input.studentId, input.subjectId);
          if (recentExercises.length > 0) {
            const avgScore = recentExercises.reduce((sum, e) => sum + (e.attempt.score || 0), 0) / recentExercises.length;
            exerciseInfo = `${recentExercises.length} exercícios respondidos, média de ${avgScore.toFixed(1)}%`;
          }
        } catch (e) {
          // Ignorar
        }
        
        // 6. Buscar comportamentos recentes (se houver)
        let behaviorInfo = 'Sem registros de comportamento';
        try {
          const recentBehaviors = await db.getRecentBehaviors(input.studentId, ctx.user.id, 30);
          if (recentBehaviors.length > 0) {
            behaviorInfo = recentBehaviors.map(b => `${b.behaviorType} em ${new Date(b.recordedAt).toLocaleDateString('pt-BR')}`).join('; ');
          }
        } catch (e) {
          // Ignorar
        }
        
        // ===== MONTAR PROMPT RICO PARA A IA =====
        const progressPercentage = totalTopics > 0 ? ((completedTopics / totalTopics) * 100).toFixed(1) : '0';
        
        const prompt = `Você é um especialista em pedagogia e análise de aprendizado. Analise os dados do aluno abaixo e forneça uma análise detalhada com recomendações práticas para o professor.

IMPORTANTE: Você DEVE sempre retornar arrays não-vazios para strengths, weaknesses, recommendations e patterns. Mesmo que os dados sejam limitados, gere análises e recomendações baseadas na estrutura da trilha, no progresso do aluno e nas boas práticas pedagógicas. NUNCA retorne arrays vazios — sempre forneça pelo menos 2-3 itens em cada campo.

**DADOS DO ALUNO:**
- Nome: ${student.fullName}
- Matrícula: ${student.registrationNumber}
- Disciplina analisada: ${subjectName}
- Disciplinas matriculadas: ${studentSubjects.map(s => s.subjectName).join(', ') || 'Nenhuma matrícula encontrada'}

**TRILHA DE APRENDIZAGEM:**
- Total de módulos disponíveis: ${totalModules}
- Total de tópicos disponíveis: ${totalTopics}
- Tópicos concluídos: ${completedTopics} (${progressPercentage}%)
- Tópicos em andamento: ${inProgressTopics}
- Tópicos não iniciados: ${totalTopics - completedTopics - inProgressTopics}

**PROGRESSO POR DISCIPLINA:**
${progressDetails.length > 0 ? progressDetails.map(p => `- ${p.subject}: ${p.completed}/${p.total} concluídos (${p.total > 0 ? ((p.completed/p.total)*100).toFixed(0) : 0}%), ${p.inProgress} em andamento`).join('\n') : 'Sem dados de progresso registrados — recomende que o professor registre o progresso'}

**ESTRUTURA DA TRILHA:**
${learningPathInfo.length > 0 ? learningPathInfo.map(lp => `Disciplina: ${lp.subjectName}\n${lp.modules.map(m => `  Módulo: ${m.title} (${m.topics.length} tópicos: ${m.topics.map(t => t.title).join(', ')})`).join('\n')}`).join('\n\n') : 'Nenhuma trilha configurada — recomende que o professor configure a trilha de aprendizagem'}

**EXERCÍCIOS:** ${exerciseInfo}

**COMPORTAMENTOS REGISTRADOS:** ${behaviorInfo}

Com base nesses dados, forneça uma análise estruturada em JSON. Lembre-se: SEMPRE preencha todos os arrays com pelo menos 2-3 itens relevantes e práticos.`;

        // ===== CHAMAR IA =====
        const response = await invokeLLM({
          feature: 'student_analysis',
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em pedagogia e análise de aprendizado. Analise os dados do aluno e forneça insights práticos. Sempre responda em JSON válido. REGRA OBRIGATÓRIA: Os campos strengths, weaknesses, recommendations e patterns NUNCA podem ser arrays vazios. Mesmo com dados limitados, gere pelo menos 2-3 itens em cada campo baseados nas boas práticas pedagógicas, na estrutura da trilha e no contexto do aluno. Se não há dados históricos, recomende ações para o professor coletar esses dados.'
            },
            { role: 'user', content: prompt }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'student_analysis',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  overallAssessment: { type: 'string', description: 'Avaliação geral do aluno' },
                  strengths: { type: 'array', items: { type: 'string' }, description: 'Pontos fortes identificados' },
                  weaknesses: { type: 'array', items: { type: 'string' }, description: 'Áreas que precisam de atenção' },
                  patterns: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        type: { type: 'string' },
                        description: { type: 'string' },
                        confidence: { type: 'number' }
                      },
                      required: ['type', 'description', 'confidence'],
                      additionalProperties: false
                    },
                    description: 'Padrões de aprendizado detectados'
                  },
                  recommendations: { type: 'array', items: { type: 'string' }, description: 'Recomendações práticas para o professor' },
                  alerts: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        type: { type: 'string' },
                        severity: { type: 'string', enum: ['info', 'warning', 'urgent', 'critical'] },
                        message: { type: 'string' }
                      },
                      required: ['type', 'severity', 'message'],
                      additionalProperties: false
                    },
                    description: 'Alertas importantes'
                  },
                  confidence: { type: 'number', description: 'Nível de confiança da análise (0-1)' }
                },
                required: ['overallAssessment', 'strengths', 'weaknesses', 'patterns', 'recommendations', 'alerts', 'confidence'],
                additionalProperties: false
              }
            }
          }
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Resposta inválida da IA' });
        }

        let analysis: any;
        try {
          analysis = JSON.parse(content);
        } catch (parseErr) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Resposta da IA não é JSON válido' });
        }

        // Garantir que todos os campos sejam arrays (fallback para resposta incompleta do Groq)
        const safeAnalysis = {
          overallAssessment: analysis.overallAssessment || analysis.overall_assessment || 'Análise gerada com dados limitados.',
          strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
          weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
          patterns: Array.isArray(analysis.patterns) ? analysis.patterns : [],
          recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
          alerts: Array.isArray(analysis.alerts) ? analysis.alerts : [],
          confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.5,
        };

        // Salvar insight geral no histórico
        try {
          await db.saveAIInsight({
            studentId: input.studentId,
            userId: ctx.user.id,
            subjectId: input.subjectId,
            insightType: 'recommendation',
            title: 'Análise de Aprendizado',
            description: safeAnalysis.overallAssessment,
            content: safeAnalysis.overallAssessment,
            actionable: true,
            actionSuggestion: safeAnalysis.recommendations.length > 0 ? safeAnalysis.recommendations.join('\n') : 'Nenhuma recomendação específica gerada.',
            priority: safeAnalysis.alerts.length > 0 ? 'high' : 'medium',
            confidence: safeAnalysis.confidence,
            relatedData: JSON.stringify({
              strengths: safeAnalysis.strengths,
              weaknesses: safeAnalysis.weaknesses,
              patterns: safeAnalysis.patterns,
              alerts: safeAnalysis.alerts,
              progressPercentage,
              totalTopics,
              completedTopics,
            }),
          });

          // Salvar insights adicionais para pontos fortes e fracos
          if (safeAnalysis.strengths.length > 0) {
            await db.saveAIInsight({
              studentId: input.studentId,
              userId: ctx.user.id,
              subjectId: input.subjectId,
              insightType: 'strength',
              title: 'Pontos Fortes Identificados',
              description: safeAnalysis.strengths.join(' | '),
              content: safeAnalysis.strengths.join(' | '),
              actionable: false,
              priority: 'low',
              confidence: safeAnalysis.confidence,
              relatedData: JSON.stringify({ strengths: safeAnalysis.strengths }),
            });
          }

          if (safeAnalysis.weaknesses.length > 0) {
            await db.saveAIInsight({
              studentId: input.studentId,
              userId: ctx.user.id,
              subjectId: input.subjectId,
              insightType: 'weakness',
              title: 'Áreas que Precisam de Atenção',
              description: safeAnalysis.weaknesses.join(' | '),
              content: safeAnalysis.weaknesses.join(' | '),
              actionable: true,
              actionSuggestion: safeAnalysis.recommendations.length > 0 ? safeAnalysis.recommendations[0] : undefined,
              priority: 'medium',
              confidence: safeAnalysis.confidence,
              relatedData: JSON.stringify({ weaknesses: safeAnalysis.weaknesses }),
            });
          }
        } catch (e) {
          console.error('Erro ao salvar insight:', e);
        }

        return safeAnalysis;
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
          filteredAlerts = allAlerts.filter(a => a.studentId && studentIdsInSubject.has(a.studentId));
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
        subjectId: z.number(),
        professorId: z.number(),
        question: z.string().min(1, "Pergunta é obrigatória"),
        context: z.string().optional(),
        isPrivate: z.boolean().optional().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.submitDoubt({
          studentId: ctx.studentSession.studentId,
          subjectId: input.subjectId,
          professorId: input.professorId,
          question: input.question,
          context: input.context,
          isPrivate: input.isPrivate,
        });
      }),

    // Buscar minhas dúvidas
    getMyDoubts: studentProcedure
      .input(z.object({
        subjectId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getStudentDoubts(ctx.studentSession.studentId, input.subjectId);
      }),

    // Deletar dúvida
    deleteDoubt: studentProcedure
      .input(z.object({
        doubtId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteStudentDoubt(input.doubtId, ctx.studentSession.studentId);
      }),

    // Buscar TODAS as dúvidas do professor (com filtros)
    getAllDoubts: protectedProcedure
      .input(z.object({
        subjectId: z.number().optional(),
        status: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return db.getAllTeacherDoubts(ctx.user.id, input.subjectId, input.status);
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

    // Deletar dúvida (professor)
    deleteTeacherDoubt: protectedProcedure
      .input(z.object({
        doubtId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteTeacherDoubt(input.doubtId, ctx.user.id);
      }),

    // Contar dúvidas pendentes não vistas pelo professor
    getPendingDoubtsCount: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getPendingDoubtsCount(ctx.user.id);
      }),

    // Marcar dúvidas como vistas pelo professor
    markDoubtsSeenByProfessor: protectedProcedure
      .mutation(async ({ ctx }) => {
        return db.markDoubtsSeenByProfessor(ctx.user.id);
      }),

    // Contar respostas não vistas pelo aluno
    getUnseenAnswersCount: studentProcedure
      .query(async ({ ctx }) => {
        return db.getUnseenAnswersCount(ctx.studentSession.studentId);
      }),

    // Marcar respostas como vistas pelo aluno
    markAnswersSeenByStudent: studentProcedure
      .mutation(async ({ ctx }) => {
        return db.markAnswersSeenByStudent(ctx.studentSession.studentId);
      }),

    // Obter dicas da IA para resolver a dúvida
    getAIHints: studentProcedure
      .input(z.object({
        doubtId: z.number(),
        question: z.string(),
        context: z.string().optional(),
        subjectName: z.string().optional(),
        topicName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const disciplineName = input.subjectName || "Não especificada";
          const topicContext = input.topicName ? `Tópico específico: ${input.topicName}` : "";
          
          const response = await invokeLLM({
            feature: 'student_ai_hints',
            messages: [
              {
                role: "system",
                content: `Você é um tutor educacional especializado EXCLUSIVAMENTE na disciplina "${disciplineName}". Seu papel é ajudar o aluno a entender conceitos desta disciplina, NÃO dar respostas diretas.

REGRA FUNDAMENTAL - RESTRIÇÃO DE ESCOPO:
- Você SOMENTE pode responder sobre assuntos relacionados à disciplina "${disciplineName}".
- Se a pergunta do aluno NÃO for sobre a disciplina "${disciplineName}" ou seus tópicos, você DEVE recusar educadamente e orientar o aluno a fazer perguntas sobre a disciplina.
- Exemplo de recusa: "Essa pergunta não está relacionada à disciplina ${disciplineName}. Por favor, faça perguntas sobre os conteúdos da sua disciplina para que eu possa te ajudar!"

Regras de resposta (quando a pergunta for sobre a disciplina):
1. Forneça DICAS e SUGESTÕES para guiar o raciocínio do aluno
2. Use analogias e exemplos do dia a dia quando possível
3. Divida o problema em passos menores
4. Incentive o aluno a pensar criticamente
5. Seja encorajador e positivo
6. Responda em português brasileiro
7. Limite sua resposta a 3-4 dicas principais
8. Contextualize com a disciplina e o tópico específico

Formato da resposta:
- Use emojis para tornar mais amigável
- Estruture em tópicos claros
- Termine com uma pergunta reflexiva para o aluno`
              },
              {
                role: "user",
                content: `Disciplina: ${disciplineName}
${topicContext}

Dúvida do aluno: ${input.question}

${input.context ? `Contexto adicional: ${input.context}` : ""}

Se a dúvida for sobre a disciplina ${disciplineName}, forneça dicas e sugestões. Caso contrário, recuse educadamente.`
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
            feature: 'student_study_material',
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
          
          // Armazenar material de estudo como JSON no campo feedback
          const feedbackData = JSON.stringify({
            type: 'study_material',
            detailedExplanation: material.detailedExplanation,
            studyStrategy: material.studyStrategy,
            relatedConcepts: material.relatedConcepts,
            additionalResources: material.additionalResources,
            practiceExamples: material.practiceExamples,
            commonMistakes: material.commonMistakes,
            timeToMaster: material.timeToMaster,
            difficultyLevel: material.difficultyLevel,
          });
          await db_instance
            .update(studentExerciseAnswers)
            .set({
              feedback: feedbackData,
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
            feature: 'student_pattern_analysis',
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
            feature: 'student_study_suggestions',
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
            feature: 'student_study_plan',
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

  // ==================== PUSH NOTIFICATIONS ====================
  pushNotifications: router({
    // Obter chave pública VAPID
    getVapidKey: protectedProcedure
      .query(() => {
        return { key: pushNotif.getVapidPublicKey() };
      }),

    // Registrar subscription push
    subscribe: protectedProcedure
      .input(z.object({
        endpoint: z.string(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string(),
        }),
        userAgent: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await pushNotif.savePushSubscription(
          ctx.user.id,
          { endpoint: input.endpoint, keys: input.keys },
          input.userAgent
        );
        return { success: true, subscriptionId: id };
      }),

    // Remover subscription push
    unsubscribe: protectedProcedure
      .input(z.object({ endpoint: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await pushNotif.removePushSubscription(ctx.user.id, input.endpoint);
        return { success: true };
      }),

    // Obter preferências de notificação
    getPreferences: protectedProcedure
      .query(async ({ ctx }) => {
        return await pushNotif.getNotificationPrefs(ctx.user.id);
      }),

    // Salvar preferências de notificação
    savePreferences: protectedProcedure
      .input(z.object({
        classReminders: z.boolean().optional(),
        eventReminders: z.boolean().optional(),
        taskReminders: z.boolean().optional(),
        dailySummary: z.boolean().optional(),
        classReminderMinutes: z.number().min(5).max(60).optional(),
        eventReminderMinutes: z.number().min(15).max(1440).optional(),
        dailySummaryTime: z.string().optional(),
        activeDays: z.array(z.number().min(0).max(6)).optional(),
        quietHoursStart: z.string().optional(),
        quietHoursEnd: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await pushNotif.saveNotificationPrefs(ctx.user.id, input);
      }),

    // Enviar notificação de teste
    sendTest: protectedProcedure
      .mutation(async ({ ctx }) => {
        return await pushNotif.sendTestNotification(ctx.user.id);
      }),

    // Obter estatísticas
    getStats: protectedProcedure
      .query(async ({ ctx }) => {
        return await pushNotif.getNotificationStats(ctx.user.id);
      }),

    // Obter estatísticas da fila de notificações adiadas
    getQueueStats: protectedProcedure
      .query(async ({ ctx }) => {
        const database = await getDb();
        if (!database) return { pending: 0, sent: 0, failed: 0, items: [] };
        
        // Contar por status
        const counts = await database.select({
          status: pushNotificationQueue.status,
          count: sql<number>`count(*)`
        })
          .from(pushNotificationQueue)
          .groupBy(pushNotificationQueue.status);
        
        const pending = counts.find(c => c.status === 'pending')?.count || 0;
        const sent = counts.find(c => c.status === 'sent')?.count || 0;
        const failed = counts.find(c => c.status === 'failed')?.count || 0;
        
        return { pending, sent, failed };
      }),

    // Listar itens da fila com detalhes
    getQueueItems: protectedProcedure
      .input(z.object({
        status: z.enum(['pending', 'sent', 'failed']).optional(),
        limit: z.number().min(1).max(50).default(20),
      }))
      .query(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) return [];
        
        const conditions = [];
        if (input.status) {
          conditions.push(eq(pushNotificationQueue.status, input.status));
        }
        
        const items = await database.select()
          .from(pushNotificationQueue)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(pushNotificationQueue.queuedAt))
          .limit(input.limit);
        
        return items;
      }),

    // Reenviar notificação que falhou
    retryFailed: protectedProcedure
      .input(z.object({ queueItemId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await pushNotif.retryFailedNotification(input.queueItemId);
      }),

    // Reenviar TODAS as notificações que falharam
    retryAllFailed: protectedProcedure
      .mutation(async ({ ctx }) => {
        const database = await getDb();
        if (!database) return { retried: 0, success: 0, failed: 0 };
        
        const failedItems = await database.select()
          .from(pushNotificationQueue)
          .where(eq(pushNotificationQueue.status, 'failed'));
        
        let success = 0;
        let failed = 0;
        for (const item of failedItems) {
          const result = await pushNotif.retryFailedNotification(item.id);
          if (result.success) success++;
          else failed++;
        }
        
        return { retried: failedItems.length, success, failed };
      }),

    // Limpar registros antigos da fila (sent/failed com +30 dias)
    cleanOldItems: protectedProcedure
      .mutation(async ({ ctx }) => {
        return await pushNotif.cleanOldQueueItems();
      }),
  }),

  /**
   * ============================================
   * ROTAS DE BACKUP
   * ============================================
   */
  backup: router({
    // Listar todos os backups
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas administradores podem listar backups' });
      }
      return await listBackups();
    }),

    // Criar backup manual
    create: protectedProcedure.mutation(async ({ ctx }) => {
      // Verificar se usuário é admin
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas administradores podem criar backups' });
      }

      const timestamp = Date.now();
      const filename = `backup_${timestamp}.sql.gz`;
      const filepath = `/root/flowedu/backups/${filename}`;

      const backupRecord = await createBackupRecord({
        filename,
        filepath,
        filesize: 0,
        backupType: 'manual',
        status: 'pending',
        createdBy: ctx.user.id,
      });

      // Executar backup em background (não aguardar)
      const { executeBackup } = await import('./backup-executor');
      executeBackup(backupRecord.id).catch((error) => {
        console.error('[Backup] Erro ao executar backup:', error);
      });

      return { success: true, backupId: backupRecord.id };
    }),

    // Restaurar backup
    restore: protectedProcedure
      .input(z.object({ backupId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas administradores podem restaurar backups' });
        }

        await updateBackupStatus(input.backupId, 'restoring');
        
        // Executar restauração em background
        const { executeRestore } = await import('./backup-executor');
        executeRestore(input.backupId).catch((error) => {
          console.error('[Backup] Erro ao restaurar backup:', error);
        });

        return { success: true };
      }),

    // Deletar backup
    delete: protectedProcedure
      .input(z.object({ backupId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas administradores podem deletar backups' });
        }

        // Buscar backup para obter filepath
        const backupsList = await listBackups();
        const backup = backupsList.find(b => b.id === input.backupId);

        if (backup) {
          // Deletar arquivo físico
          const { deleteBackupFile } = await import('./backup-executor');
          await deleteBackupFile(backup.filepath);
        }

        // Deletar registro do banco
        await deleteBackup(input.backupId);
        return { success: true };
      }),

    // Obter configuração de agendamento
    getSchedule: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return await getBackupSchedule();
    }),

    // Atualizar configuração de agendamento
    updateSchedule: protectedProcedure
      .input(z.object({
        isEnabled: z.boolean(),
        frequency: z.enum(['daily', 'weekly', 'monthly']),
        scheduleTime: z.string(),
        dayOfWeek: z.number().optional(),
        dayOfMonth: z.number().optional(),
        retentionDays: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas administradores podem configurar agendamento' });
        }

        await upsertBackupSchedule({
          ...input,
          createdBy: ctx.user.id,
        });
        
        // Atualizar scheduler em tempo real
        const { updateBackupScheduler } = await import('./backup-scheduler');
        await updateBackupScheduler();

        return { success: true };
      }),
  }),

  // ==================== E-MAIL INSTITUCIONAL ====================
  email: emailRouter,
  // ==================== ATIVIDADES EM SALA ====================
  activities: activitiesRouter,
  mural: muralRouter,
  // ==================== VPS MONITORING ====================
  vps: router({
    // Listar todos os servidores VPS
    listServers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas administradores podem acessar monitoramento de VPS' });
      }
      return await listVPSServers();
    }),

    // Criar novo servidor VPS
    createServer: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        ipAddress: z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, 'IP inválido'),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas administradores podem adicionar servidores' });
        }

        // Gerar token de autenticação único
        const crypto = await import('crypto');
        const authToken = crypto.randomBytes(32).toString('hex');

        const serverId = await createVPSServer({
          ...input,
          authToken,
        });

        return { serverId, authToken };
      }),

    // Deletar servidor VPS
    deleteServer: protectedProcedure
      .input(z.object({ serverId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        await deleteVPSServer(input.serverId);
        return { success: true };
      }),

    // Buscar métricas de um servidor
    getMetrics: protectedProcedure
      .input(z.object({
        serverId: z.number(),
        period: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }

        const now = new Date();
        const startDate = new Date();

        switch (input.period) {
          case '1h':
            startDate.setHours(now.getHours() - 1);
            break;
          case '24h':
            startDate.setHours(now.getHours() - 24);
            break;
          case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(now.getDate() - 30);
            break;
        }

        return await getVPSMetricsByPeriod(input.serverId, startDate, now);
      }),

    // Buscar última métrica de um servidor
    getLatestMetric: protectedProcedure
      .input(z.object({ serverId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await getLatestVPSMetric(input.serverId);
      }),

    // Listar alertas de um servidor
    getAlerts: protectedProcedure
      .input(z.object({ serverId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await getVPSAlerts(input.serverId);
      }),

    // Criar alerta
    createAlert: protectedProcedure
      .input(z.object({
        serverId: z.number(),
        metricType: z.enum(['cpu', 'memory', 'disk', 'network']),
        threshold: z.number().min(0).max(100),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const alertId = await createVPSAlert({
          ...input,
          threshold: input.threshold.toString(),
        });
        return { alertId };
      }),

    // Deletar alerta
    deleteAlert: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        await deleteVPSAlert(input.alertId);
        return { success: true };
      }),

    // Endpoint público para receber métricas do agente (autenticado por token)
    submitMetrics: publicProcedure
      .input(z.object({
        token: z.string(),
        cpu: z.number(),
        memoryTotal: z.number(),
        memoryUsed: z.number(),
        memoryPercent: z.number(),
        diskTotal: z.number(),
        diskUsed: z.number(),
        diskPercent: z.number(),
        networkSent: z.number(),
        networkRecv: z.number(),
        loadAverage1: z.number().optional(),
        loadAverage5: z.number().optional(),
        loadAverage15: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        // Buscar servidor por token
        const server = await getVPSServerByToken(input.token);
        if (!server) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Token inválido' });
        }

        if (!server.isActive) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Servidor desativado' });
        }

        // Inserir métricas
        await insertVPSMetrics({
          serverId: server.id,
          cpuPercent: input.cpu.toString(),
          memoryTotal: input.memoryTotal,
          memoryUsed: input.memoryUsed,
          memoryPercent: input.memoryPercent.toString(),
          diskTotal: input.diskTotal,
          diskUsed: input.diskUsed,
          diskPercent: input.diskPercent.toString(),
          networkSent: input.networkSent,
          networkRecv: input.networkRecv,
          loadAverage1: input.loadAverage1?.toString(),
          loadAverage5: input.loadAverage5?.toString(),
          loadAverage15: input.loadAverage15?.toString(),
        });

        // Atualizar último acesso
        await updateVPSServerLastSeen(server.id);

        // Verificar alertas
        const alerts = await getVPSAlerts(server.id);
        for (const alert of alerts) {
          if (!alert.isActive) continue;

          let shouldTrigger = false;
          const threshold = parseFloat(alert.threshold);

          switch (alert.metricType) {
            case 'cpu':
              shouldTrigger = input.cpu > threshold;
              break;
            case 'memory':
              shouldTrigger = input.memoryPercent > threshold;
              break;
            case 'disk':
              shouldTrigger = input.diskPercent > threshold;
              break;
          }

          if (shouldTrigger) {
            await updateVPSAlertTriggered(alert.id);
            // TODO: Enviar notificação ao administrador
            console.log(`[VPS Alert] ${server.name} - ${alert.metricType} ultrapassou ${threshold}%`);
          }
        }

        return { success: true };
      }),
  }),
  // ==================== CONFIGURAÇÕES DE IA ====================
  aiSettings: router({
    // Buscar configurações atuais de IA
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas administradores podem acessar configurações de IA' });
      }
      const dbConn = await getDb();
      if (!dbConn) return { id: null, provider: 'groq', model: 'llama-3.3-70b-versatile', isActive: true, groqApiKeyPreview: null, geminiApiKeyPreview: null, openaiApiKeyPreview: null, anthropicApiKeyPreview: null, hasGroqKey: false, hasGeminiKey: false, hasOpenaiKey: false, hasAnthropicKey: false };
      const rows = await dbConn.execute(sql`SELECT id, provider, model, isActive, updatedAt,
        CASE WHEN groqApiKey IS NOT NULL AND groqApiKey != '' THEN LEFT(groqApiKey, 8) ELSE NULL END as groqApiKeyPreview,
        CASE WHEN geminiApiKey IS NOT NULL AND geminiApiKey != '' THEN LEFT(geminiApiKey, 8) ELSE NULL END as geminiApiKeyPreview,
        CASE WHEN openaiApiKey IS NOT NULL AND openaiApiKey != '' THEN LEFT(openaiApiKey, 8) ELSE NULL END as openaiApiKeyPreview,
        CASE WHEN anthropicApiKey IS NOT NULL AND anthropicApiKey != '' THEN LEFT(anthropicApiKey, 8) ELSE NULL END as anthropicApiKeyPreview
        FROM ai_settings LIMIT 1`) as any[];
      const rowList = (rows[0] as any[]) || [];
      if (!rowList || rowList.length === 0) {
        return { id: null, provider: 'groq', model: 'llama-3.3-70b-versatile', isActive: true, groqApiKeyPreview: null, geminiApiKeyPreview: null, openaiApiKeyPreview: null, anthropicApiKeyPreview: null, hasGroqKey: false, hasGeminiKey: false, hasOpenaiKey: false, hasAnthropicKey: false };
      }
      const row = rowList[0];
      return { ...row, hasGroqKey: !!row.groqApiKeyPreview, hasGeminiKey: !!row.geminiApiKeyPreview, hasOpenaiKey: !!row.openaiApiKeyPreview, hasAnthropicKey: !!row.anthropicApiKeyPreview };
    }),
    // Salvar configurações de IA
    saveSettings: protectedProcedure
      .input(z.object({
        provider: z.enum(['groq', 'gemini', 'openai', 'anthropic', 'manus']),
        model: z.string().min(1),
        groqApiKey: z.string().optional(),
        geminiApiKey: z.string().optional(),
        openaiApiKey: z.string().optional(),
        anthropicApiKey: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas administradores podem alterar configurações de IA' });
        }
        const dbConn = await getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados não disponível' });
        const existingRows = await dbConn.execute(sql`SELECT id FROM ai_settings LIMIT 1`) as any[];
        const existing = (existingRows[0] as any[]) || [];
        // Monta SET dinâmico: sempre atualiza provider e model; só atualiza chaves se fornecidas
        if (existing && existing.length > 0) {
          const existingId = existing[0].id;
          await dbConn.execute(sql`UPDATE ai_settings SET
            provider = ${input.provider},
            model = ${input.model},
            groqApiKey = CASE WHEN ${input.groqApiKey || ''} != '' THEN ${input.groqApiKey || null} ELSE groqApiKey END,
            geminiApiKey = CASE WHEN ${input.geminiApiKey || ''} != '' THEN ${input.geminiApiKey || null} ELSE geminiApiKey END,
            openaiApiKey = CASE WHEN ${input.openaiApiKey || ''} != '' THEN ${input.openaiApiKey || null} ELSE openaiApiKey END,
            anthropicApiKey = CASE WHEN ${input.anthropicApiKey || ''} != '' THEN ${input.anthropicApiKey || null} ELSE anthropicApiKey END,
            updatedBy = ${ctx.user.id}
            WHERE id = ${existingId}`);
        } else {
          await dbConn.execute(sql`INSERT INTO ai_settings (provider, model, groqApiKey, geminiApiKey, openaiApiKey, anthropicApiKey, updatedBy)
            VALUES (${input.provider}, ${input.model}, ${input.groqApiKey || null}, ${input.geminiApiKey || null}, ${input.openaiApiKey || null}, ${input.anthropicApiKey || null}, ${ctx.user.id})`);
        }
        invalidateAISettingsCache();
        return { success: true };
      }),
    // Testar conexão com a API de IA
    testConnection: protectedProcedure
      .input(z.object({
        provider: z.enum(['groq', 'gemini', 'openai', 'anthropic', 'manus']),
        apiKey: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas administradores podem testar conexões de IA' });
        }
        try {
          if (input.provider === 'groq') {
            const apiKey = input.apiKey || process.env.GROQ_API_KEY;
            if (!apiKey) throw new Error('Chave API Groq não configurada');
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'Responda apenas: OK' }], max_tokens: 5 }),
            });
            if (!response.ok) {
              const err = await response.json().catch(() => ({})) as any;
              throw new Error((err as any)?.error?.message || `HTTP ${response.status}`);
            }
            const data = await response.json() as any;
            return { success: true, message: 'Conexão com Groq estabelecida com sucesso!', model: (data as any).model || 'llama-3.3-70b-versatile' };
          } else if (input.provider === 'openai') {
            const apiKey = input.apiKey;
            if (!apiKey) throw new Error('Chave API OpenAI não configurada');
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'Responda apenas: OK' }], max_tokens: 5 }),
            });
            if (!response.ok) {
              const err = await response.json().catch(() => ({})) as any;
              throw new Error((err as any)?.error?.message || `HTTP ${response.status}`);
            }
            return { success: true, message: 'Conexão com OpenAI estabelecida com sucesso!', model: 'gpt-4o-mini' };
          } else if (input.provider === 'anthropic') {
            const apiKey = input.apiKey;
            if (!apiKey) throw new Error('Chave API Anthropic não configurada');
            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: 'claude-3-haiku-20240307', messages: [{ role: 'user', content: 'Responda apenas: OK' }], max_tokens: 5 }),
            });
            if (!response.ok) {
              const err = await response.json().catch(() => ({})) as any;
              throw new Error((err as any)?.error?.message || `HTTP ${response.status}`);
            }
            return { success: true, message: 'Conexão com Anthropic (Claude) estabelecida com sucesso!', model: 'claude-3-haiku' };
          } else if (input.provider === 'gemini') {
            const apiKey = input.apiKey;
            if (!apiKey) throw new Error('Chave API Gemini não configurada');
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: 'Responda apenas: OK' }] }] }),
            });
            if (!response.ok) {
              const err = await response.json().catch(() => ({})) as any;
              throw new Error((err as any)?.error?.message || `HTTP ${response.status}`);
            }
            return { success: true, message: 'Conexão com Google Gemini estabelecida com sucesso!', model: 'gemini-1.5-flash' };
          } else if (input.provider === 'manus') {
            await invokeLLM({ messages: [{ role: 'user', content: 'Responda apenas: OK' }] });
            return { success: true, message: 'Conexão com Manus AI estabelecida com sucesso!', model: 'manus-default' };
          } else {
            throw new Error('Provedor não reconhecido');
          }
        } catch (error: any) {
          return { success: false, message: (error as any).message || 'Erro ao testar conexão', model: null };
        }
      }),
    // Buscar estatísticas de uso de IA
    getUsageStats: protectedProcedure
      .input(z.object({
        period: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas administradores podem ver estatísticas de IA' });
        }
        const dbConn = await getDb();
        if (!dbConn) return { totalCalls: 0, totalTokens: 0, promptTokens: 0, completionTokens: 0, successCalls: 0, errorCalls: 0, estimatedCost: 0, byFeature: [], byProvider: [], daily: [], recent: [] };
        const days = input.period === '7d' ? 7 : input.period === '30d' ? 30 : input.period === '90d' ? 90 : null;
        const totalsRes = days
          ? await dbConn.execute(sql`SELECT COUNT(*) as totalCalls, SUM(total_tokens) as totalTokens, SUM(prompt_tokens) as promptTokens, SUM(completion_tokens) as completionTokens, SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successCalls, SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as errorCalls FROM ai_usage_logs WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`) as any[]
          : await dbConn.execute(sql`SELECT COUNT(*) as totalCalls, SUM(total_tokens) as totalTokens, SUM(prompt_tokens) as promptTokens, SUM(completion_tokens) as completionTokens, SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successCalls, SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as errorCalls FROM ai_usage_logs`) as any[];
        const byFeatureRes = days
          ? await dbConn.execute(sql`SELECT feature, COUNT(*) as calls, SUM(total_tokens) as tokens FROM ai_usage_logs WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ${days} DAY) GROUP BY feature ORDER BY calls DESC LIMIT 10`) as any[]
          : await dbConn.execute(sql`SELECT feature, COUNT(*) as calls, SUM(total_tokens) as tokens FROM ai_usage_logs GROUP BY feature ORDER BY calls DESC LIMIT 10`) as any[];
        const byProviderRes = days
          ? await dbConn.execute(sql`SELECT provider, COUNT(*) as calls, SUM(prompt_tokens) as promptTokens, SUM(completion_tokens) as completionTokens, SUM(total_tokens) as tokens FROM ai_usage_logs WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ${days} DAY) GROUP BY provider`) as any[]
          : await dbConn.execute(sql`SELECT provider, COUNT(*) as calls, SUM(prompt_tokens) as promptTokens, SUM(completion_tokens) as completionTokens, SUM(total_tokens) as tokens FROM ai_usage_logs GROUP BY provider`) as any[];
        const dailyRes = days
          ? await dbConn.execute(sql`SELECT DATE(createdAt) as date, COUNT(*) as calls, SUM(total_tokens) as tokens FROM ai_usage_logs WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ${days} DAY) GROUP BY DATE(createdAt) ORDER BY date ASC`) as any[]
          : await dbConn.execute(sql`SELECT DATE(createdAt) as date, COUNT(*) as calls, SUM(total_tokens) as tokens FROM ai_usage_logs GROUP BY DATE(createdAt) ORDER BY date ASC`) as any[];
        const recentRes = await dbConn.execute(sql`SELECT id, provider, model, feature, prompt_tokens as promptTokens, completion_tokens as completionTokens, total_tokens as totalTokens, success, error_message as errorMessage, createdAt FROM ai_usage_logs ORDER BY createdAt DESC LIMIT 20`) as any[];
        const total = ((totalsRes[0] as any[])[0]) || {};
        // Tabela de preços por provedor (USD por 1M tokens)
        const PRICING: Record<string, { input: number; output: number; label: string }> = {
          groq:      { input: 0.59,  output: 0.79,  label: 'Groq (Llama 3.3 70B)' },
          openai:    { input: 2.50,  output: 10.00, label: 'OpenAI (GPT-4o)' },
          anthropic: { input: 3.00,  output: 15.00, label: 'Anthropic (Claude 3.5 Sonnet)' },
          gemini:    { input: 1.25,  output: 5.00,  label: 'Google Gemini (1.5 Pro)' },
          manus:     { input: 0.00,  output: 0.00,  label: 'Manus AI (incluído)' },
        };
        const calcCost = (provider: string, promptTok: number, completionTok: number): number => {
          const p = PRICING[provider] || PRICING.groq;
          return ((promptTok || 0) * p.input / 1_000_000) + ((completionTok || 0) * p.output / 1_000_000);
        };
        const byProviderRaw = (byProviderRes[0] as any[]) || [];
        const byProviderWithCost = byProviderRaw.map((row: any) => ({
          ...row,
          estimatedCost: parseFloat(calcCost(row.provider, row.promptTokens || 0, row.completionTokens || 0).toFixed(6)),
          pricingLabel: (PRICING[row.provider] || PRICING.groq).label,
          inputPricePerM: (PRICING[row.provider] || PRICING.groq).input,
          outputPricePerM: (PRICING[row.provider] || PRICING.groq).output,
        }));
        const totalCost = byProviderWithCost.reduce((acc: number, row: any) => acc + (row.estimatedCost || 0), 0);
        return {
          totalCalls: total.totalCalls || 0,
          totalTokens: total.totalTokens || 0,
          promptTokens: total.promptTokens || 0,
          completionTokens: total.completionTokens || 0,
          successCalls: total.successCalls || 0,
          errorCalls: total.errorCalls || 0,
          estimatedCost: parseFloat(totalCost.toFixed(6)),
          byFeature: (byFeatureRes[0] as any[]) || [],
          byProvider: byProviderWithCost,
          daily: (dailyRes[0] as any[]) || [],
          recent: (recentRes[0] as any[]) || [],
        };
      }),
    // Limpar logs de uso
    clearUsageLogs: protectedProcedure
      .input(z.object({ olderThanDays: z.number().min(1).default(90) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas administradores podem limpar logs de IA' });
        }
        const dbConn = await getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados não disponível' });
        const days = input.olderThanDays;
        await dbConn.execute(sql`DELETE FROM ai_usage_logs WHERE createdAt < DATE_SUB(NOW(), INTERVAL ${days} DAY)`);
        return { success: true };
      }),
    // Verificar chaves de API manualmente
    checkApiKeys: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas administradores podem verificar chaves de API' });
        }
        const dbConn2 = await getDb();
        if (!dbConn2) return { results: [] as { provider: string; valid: boolean; message: string }[] };
        let settings2: any = null;
        try {
          const rows2 = await dbConn2.execute(sql`SELECT groqApiKey, geminiApiKey, openaiApiKey, anthropicApiKey FROM ai_settings LIMIT 1`) as any[];
          const rowList2 = (rows2[0] as any[]) || [];
          if (rowList2.length > 0) settings2 = rowList2[0];
        } catch { return { results: [] as { provider: string; valid: boolean; message: string }[] }; }
        if (!settings2) return { results: [] as { provider: string; valid: boolean; message: string }[] };
        const results2: { provider: string; valid: boolean; message: string }[] = [];
        const testFetch2 = async (provider: string, url: string, opts: RequestInit): Promise<{ provider: string; valid: boolean; message: string }> => {
          try {
            const r = await fetch(url, opts);
            if (r.ok) return { provider, valid: true, message: 'OK' };
            const errData = await r.json().catch(() => ({})) as any;
            return { provider, valid: false, message: errData?.error?.message || errData?.message || `HTTP ${r.status}` };
          } catch (e: any) { return { provider, valid: false, message: e.message || 'Erro de rede' }; }
        };
        if (settings2.groqApiKey) results2.push(await testFetch2('groq', 'https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Authorization': `Bearer ${settings2.groqApiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'OK' }], max_tokens: 3 }) }));
        if (settings2.openaiApiKey) results2.push(await testFetch2('openai', 'https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Authorization': `Bearer ${settings2.openaiApiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'OK' }], max_tokens: 3 }) }));
        if (settings2.anthropicApiKey) results2.push(await testFetch2('anthropic', 'https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': settings2.anthropicApiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-3-haiku-20240307', messages: [{ role: 'user', content: 'OK' }], max_tokens: 3 }) }));
        if (settings2.geminiApiKey) results2.push(await testFetch2('gemini', `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${settings2.geminiApiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: 'OK' }] }] }) }));
        return { results: results2 };
      }),
  }),

  // ============================================================
  // FÓRUM DE DISCUSSÃO POR DISCIPLINA
  // ============================================================
  forum: router({
    // Listar tópicos de uma disciplina
    listTopics: publicProcedure
      .input(z.object({ subjectId: z.number(), classId: z.number().optional() }))
      .query(async ({ input }) => {
        return db.listForumTopics(input.subjectId, input.classId);
      }),

    // ── Procedures para o portal do professor ────────────────────────────

    /** Listar fóruns de uma disciplina (visão do professor) */
    listForums: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ input }) => {
        return db.listForumsForSubject(input.subjectId);
      }),

    /** Listar tópicos de um fórum (visão do professor) */
    listTopicsByForum: protectedProcedure
      .input(z.object({ forumId: z.number() }))
      .query(async ({ input }) => {
        return db.listTopicsByForum(input.forumId);
      }),

    /** Obter notas de um fórum (professor) */
    getForumGrades: protectedProcedure
      .input(z.object({ forumId: z.number() }))
      .query(async ({ input }) => {
        return db.getForumGradesByForum(input.forumId);
      }),

    /** Obter estatísticas de participação de um fórum */
    getForumParticipationStats: protectedProcedure
      .input(z.object({ forumId: z.number() }))
      .query(async ({ input }) => {
        return db.getForumParticipationStats(input.forumId);
      }),

    /** Criar fórum (professor) */
    createForum: protectedProcedure
      .input(z.object({
        subjectId: z.number(),
        classId: z.number().optional(),
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        forumType: z.enum(["general", "single_topic", "qa"]).default("general"),
        requireSubscription: z.boolean().default(false),
        monitorReading: z.boolean().default(false),
        maxAttachmentSizeKb: z.number().default(512),
        gradeEnabled: z.boolean().default(false),
        gradeMax: z.string().optional(),
        gradeAggregation: z.enum(["max", "avg", "sum", "first", "last"]).default("max"),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createForum({ ...input, createdBy: ctx.user.id });
      }),

    /** Excluir fórum (professor) */
    deleteForum: protectedProcedure
      .input(z.object({ forumId: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteForum(input.forumId);
      }),

    /** Criar tópico em um fórum (professor) */
    createTopicInForum: protectedProcedure
      .input(z.object({
        forumId: z.number(),
        title: z.string().min(1).max(255),
        content: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const forum = await db.getForumById(input.forumId);
        if (!forum) throw new TRPCError({ code: 'NOT_FOUND', message: 'Fórum não encontrado' });
        return db.createForumTopic({
          subjectId: forum.subjectId,
          classId: forum.classId ?? undefined,
          forumId: input.forumId,
          title: input.title,
          content: input.content,
          authorType: 'teacher',
          authorUserId: ctx.user.id,
        });
      }),

    /** Responder a um tópico (professor, com suporte a anexo) */
    replyWithAttachmentAsTeacher: protectedProcedure
      .input(z.object({
        topicId: z.number(),
        content: z.string().min(1),
        attachmentUrl: z.string().optional(),
        attachmentKey: z.string().optional(),
        attachmentName: z.string().optional(),
        attachmentMime: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const topic = await db.getForumTopic(input.topicId);
        if (!topic) throw new TRPCError({ code: 'NOT_FOUND', message: 'Tópico não encontrado' });
        return db.createForumReply({
          topicId: input.topicId,
          content: input.content,
          authorType: 'teacher',
          authorUserId: ctx.user.id,
          attachmentUrl: input.attachmentUrl,
          attachmentKey: input.attachmentKey,
          attachmentName: input.attachmentName,
          attachmentMime: input.attachmentMime,
        });
      }),

    /** Atribuir/atualizar nota de aluno em fórum (professor) */
    setForumGrade: protectedProcedure
      .input(z.object({
        forumId: z.number(),
        studentId: z.number(),
        grade: z.number(),
        feedback: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.setForumGrade({
          forumId: input.forumId,
          studentId: input.studentId,
          gradedBy: ctx.user.id,
          grade: input.grade,
          feedback: input.feedback,
        });
      }),

    // ── Procedures para o portal do aluno ─────────────────────────────────

    /** Listar fóruns de uma disciplina (visão do aluno) */
    listForumsForStudent: studentProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ input }) => {
        return db.listForumsForSubject(input.subjectId);
      }),

    /** Listar tópicos de um fórum específico (visão do aluno) */
    listTopicsByForumForStudent: studentProcedure
      .input(z.object({ forumId: z.number() }))
      .query(async ({ input }) => {
        return db.listTopicsByForum(input.forumId);
      }),

    /** Obter notas do aluno nos fóruns de uma disciplina */
    getStudentForumGrades: studentProcedure
      .input(z.object({ subjectId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getStudentForumGrades(ctx.studentSession.studentId, input.subjectId);
      }),

    /** Criar tópico em um fórum (como aluno) */
    createTopicInForumAsStudent: studentProcedure
      .input(z.object({
        forumId: z.number(),
        title: z.string().min(1).max(255),
        content: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const forum = await db.getForumById(input.forumId);
        if (!forum) throw new TRPCError({ code: 'NOT_FOUND', message: 'Fórum não encontrado' });
        if (!forum.isOpen) throw new TRPCError({ code: 'FORBIDDEN', message: 'Este fórum está fechado' });
        return db.createForumTopic({
          subjectId: forum.subjectId,
          classId: forum.classId ?? undefined,
          forumId: input.forumId,
          title: input.title,
          content: input.content,
          authorType: 'student',
          authorStudentId: ctx.studentSession.studentId,
        });
      }),

    /** Responder a um tópico (como aluno, com suporte a anexo) */
    replyWithAttachmentAsStudent: studentProcedure
      .input(z.object({
        topicId: z.number(),
        content: z.string().min(1),
        attachmentUrl: z.string().optional(),
        attachmentKey: z.string().optional(),
        attachmentName: z.string().optional(),
        attachmentMime: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const topic = await db.getForumTopic(input.topicId);
        if (!topic) throw new TRPCError({ code: 'NOT_FOUND', message: 'Tópico não encontrado' });
        if (topic.isClosed) throw new TRPCError({ code: 'FORBIDDEN', message: 'Este tópico está fechado' });
        return db.createForumReply({
          topicId: input.topicId,
          content: input.content,
          authorType: 'student',
          authorStudentId: ctx.studentSession.studentId,
          attachmentUrl: input.attachmentUrl,
          attachmentKey: input.attachmentKey,
          attachmentName: input.attachmentName,
          attachmentMime: input.attachmentMime,
        });
      }),

    // Buscar tópico com respostas
    getTopic: publicProcedure
      .input(z.object({ topicId: z.number() }))
      .query(async ({ input }) => {
        const topic = await db.getForumTopic(input.topicId);
        if (!topic) throw new TRPCError({ code: 'NOT_FOUND', message: 'Tópico não encontrado' });
        await db.incrementForumTopicView(input.topicId);
        const replies = await db.listForumReplies(input.topicId);
        return { topic, replies };
      }),

    // Criar tópico (professor)
    createTopicAsTeacher: protectedProcedure
      .input(z.object({
        subjectId: z.number(),
        classId: z.number().optional(),
        title: z.string().min(3).max(255),
        content: z.string().min(10),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createForumTopic({
          ...input,
          authorType: 'teacher',
          authorUserId: ctx.user.id,
        });
      }),

    // Criar tópico (aluno)
    createTopicAsStudent: studentProcedure
      .input(z.object({
        subjectId: z.number(),
        classId: z.number().optional(),
        title: z.string().min(3).max(255),
        content: z.string().min(10),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createForumTopic({
          ...input,
          authorType: 'student',
          authorStudentId: ctx.studentSession.studentId,
        });
        // Notificar professor
        try {
          const subject = await db.getSubjectById(input.subjectId, 0);
          if (subject?.userId) {
            await db.createNotification({
              userId: subject.userId,
              type: 'new_announcement',
              title: 'Nova dúvida no Fórum',
              message: `Um aluno criou um novo tópico em ${subject.name}: "${input.title}"`,
              link: `/forum/${input.subjectId}/${(result as any).insertId}`,
            });
          }
        } catch {}
        return result;
      }),

    // Responder tópico (professor)
    replyAsTeacher: protectedProcedure
      .input(z.object({
        topicId: z.number(),
        content: z.string().min(1),
        parentReplyId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createForumReply({
          ...input,
          authorType: 'teacher',
          authorUserId: ctx.user.id,
        });
      }),

    // Responder tópico (aluno)
    replyAsStudent: studentProcedure
      .input(z.object({
        topicId: z.number(),
        content: z.string().min(1),
        parentReplyId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createForumReply({
          ...input,
          authorType: 'student',
          authorStudentId: ctx.studentSession.studentId,
        });
      }),

    // Fixar/desafixar tópico (professor)
    pinTopic: protectedProcedure
      .input(z.object({ topicId: z.number(), isPinned: z.boolean() }))
      .mutation(async ({ input }) => {
        await db.pinForumTopic(input.topicId, input.isPinned);
        return { success: true };
      }),

    // Fechar/abrir tópico (professor)
    closeTopic: protectedProcedure
      .input(z.object({ topicId: z.number(), isClosed: z.boolean() }))
      .mutation(async ({ input }) => {
        await db.closeForumTopic(input.topicId, input.isClosed);
        return { success: true };
      }),

    // Marcar melhor resposta (professor)
    markBestAnswer: protectedProcedure
      .input(z.object({ topicId: z.number(), replyId: z.number() }))
      .mutation(async ({ input }) => {
        await db.markBestAnswer(input.topicId, input.replyId);
        return { success: true };
      }),

    // Deletar tópico (professor)
    deleteTopic: protectedProcedure
      .input(z.object({ topicId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteForumTopic(input.topicId);
        return { success: true };
      }),

    // Deletar resposta (professor)
    deleteReply: protectedProcedure
      .input(z.object({ replyId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteForumReply(input.replyId);
        return { success: true };
      }),
  }),

  // ============================================================
  // MURAL DE AVISOS
  // ============================================================
  murals: router({
    // Listar avisos do professor
    listForTeacher: protectedProcedure.query(async ({ ctx }) => {
      return db.listAnnouncementsForTeacher(ctx.user.id);
    }),

    // Criar aviso (professor)
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(3).max(255),
        message: z.string().min(1),
        subjectId: z.number(),
        isImportant: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const db2 = await import('./db').then(m => m.getDb());
        if (!db2) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { announcements: ann } = await import('../drizzle/schema');
        const [result] = await db2.insert(ann).values({ ...input, userId: ctx.user.id });
        return result;
      }),

    // Deletar aviso (professor)
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db2 = await import('./db').then(m => m.getDb());
        if (!db2) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { announcements: ann } = await import('../drizzle/schema');
        const { eq: eqFn } = await import('drizzle-orm');
        await db2.delete(ann).where(eqFn(ann.id, input.id));
        return { success: true };
      }),

    // Listar avisos para aluno
    listForStudent: studentProcedure.query(async ({ ctx }) => {
      const studentId = ctx.studentSession.studentId;
      // Buscar disciplinas do aluno
      const enrollments = await db.getStudentEnrollments(studentId);
      const subjectIds = enrollments.map((e: any) => e.subjectId).filter(Boolean) as number[];
      return db.listAnnouncementsForStudent(studentId, subjectIds);
    }),

    // Marcar aviso como lido (aluno)
    markRead: studentProcedure
      .input(z.object({ announcementId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.markAnnouncementRead(input.announcementId, ctx.studentSession.studentId);
        return { success: true };
      }),
  }),

  // ==================== GLOSSÁRIO COLABORATIVO ====================
  glossary: router({
    // Listar glossários do professor
    list: protectedProcedure.query(async ({ ctx }) => {
      const db2 = await import('./db').then(m => m.getDb());
      if (!db2) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { glossaries, subjects, classes } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const result = await db2
        .select({
          id: glossaries.id,
          title: glossaries.title,
          description: glossaries.description,
          subjectId: glossaries.subjectId,
          classId: glossaries.classId,
          allowStudentContributions: glossaries.allowStudentContributions,
          requireApproval: glossaries.requireApproval,
          isActive: glossaries.isActive,
          createdAt: glossaries.createdAt,
          subjectName: subjects.name,
          className: classes.name,
        })
        .from(glossaries)
        .leftJoin(subjects, eq(glossaries.subjectId, subjects.id))
        .leftJoin(classes, eq(glossaries.classId, classes.id))
        .where(eq(glossaries.createdByUserId, ctx.user.id))
        .orderBy(glossaries.createdAt);
      return result;
    }),

    // Listar glossários para aluno
    listForStudent: studentProcedure.query(async ({ ctx }) => {
      const db2 = await import('./db').then(m => m.getDb());
      if (!db2) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { glossaries, subjects, classes, subjectEnrollments } = await import('../drizzle/schema');
      const { eq, inArray } = await import('drizzle-orm');
      const studentId = ctx.studentSession.studentId;
      // Buscar disciplinas do aluno
      const enrollments = await db2.select({ subjectId: subjectEnrollments.subjectId })
        .from(subjectEnrollments)
        .where(eq(subjectEnrollments.studentId, studentId));
      const subjectIds = enrollments.map((e: any) => e.subjectId).filter(Boolean) as number[];
      if (subjectIds.length === 0) return [];
      const result = await db2
        .select({
          id: glossaries.id,
          title: glossaries.title,
          description: glossaries.description,
          subjectId: glossaries.subjectId,
          classId: glossaries.classId,
          allowStudentContributions: glossaries.allowStudentContributions,
          requireApproval: glossaries.requireApproval,
          isActive: glossaries.isActive,
          createdAt: glossaries.createdAt,
          subjectName: subjects.name,
          className: classes.name,
        })
        .from(glossaries)
        .leftJoin(subjects, eq(glossaries.subjectId, subjects.id))
        .leftJoin(classes, eq(glossaries.classId, classes.id))
        .where(inArray(glossaries.subjectId, subjectIds))
        .orderBy(glossaries.createdAt);
      return result;
    }),

    // Criar glossário
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(3).max(255),
        description: z.string().optional(),
        subjectId: z.number(),
        classId: z.number().optional(),
        allowStudentContributions: z.boolean().default(true),
        requireApproval: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const db2 = await import('./db').then(m => m.getDb());
        if (!db2) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { glossaries } = await import('../drizzle/schema');
        const [result] = await db2.insert(glossaries).values({
          ...input,
          createdByUserId: ctx.user.id,
        });
        return result;
      }),

    // Deletar glossário
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db2 = await import('./db').then(m => m.getDb());
        if (!db2) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { glossaries, glossaryEntries, glossaryComments } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        // Deletar comentários das entradas
        const entries = await db2.select({ id: glossaryEntries.id }).from(glossaryEntries).where(eq(glossaryEntries.glossaryId, input.id));
        for (const entry of entries) {
          await db2.delete(glossaryComments).where(eq(glossaryComments.entryId, entry.id));
        }
        await db2.delete(glossaryEntries).where(eq(glossaryEntries.glossaryId, input.id));
        await db2.delete(glossaries).where(eq(glossaries.id, input.id));
        return { success: true };
      }),

    // Listar entradas de um glossário
    listEntries: publicProcedure
      .input(z.object({ glossaryId: z.number() }))
      .query(async ({ input }) => {
        const db2 = await import('./db').then(m => m.getDb());
        if (!db2) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { glossaryEntries, users, students } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const entries = await db2
          .select()
          .from(glossaryEntries)
          .where(eq(glossaryEntries.glossaryId, input.glossaryId))
          .orderBy(glossaryEntries.term);
        return entries;
      }),

    // Adicionar entrada ao glossário (professor)
    addEntry: protectedProcedure
      .input(z.object({
        glossaryId: z.number(),
        term: z.string().min(1).max(255),
        definition: z.string().min(1),
        example: z.string().optional(),
        category: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db2 = await import('./db').then(m => m.getDb());
        if (!db2) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { glossaryEntries } = await import('../drizzle/schema');
        const [result] = await db2.insert(glossaryEntries).values({
          ...input,
          authorType: 'teacher',
          authorUserId: ctx.user.id,
          isApproved: true,
        });
        return result;
      }),

    // Adicionar entrada ao glossário (aluno)
    addEntryStudent: studentProcedure
      .input(z.object({
        glossaryId: z.number(),
        term: z.string().min(1).max(255),
        definition: z.string().min(1),
        example: z.string().optional(),
        category: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db2 = await import('./db').then(m => m.getDb());
        if (!db2) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { glossaryEntries, glossaries, students, notifications } = await import('../drizzle/schema');
        const { eq, sql } = await import('drizzle-orm');
        // Verificar se aluno pode contribuir
        const [glossary] = await db2.select().from(glossaries).where(eq(glossaries.id, input.glossaryId));
        if (!glossary || !glossary.allowStudentContributions) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Contribuições de alunos não permitidas neste glossário' });
        }
        const [result] = await db2.insert(glossaryEntries).values({
          ...input,
          authorType: 'student',
          authorStudentId: ctx.studentSession.studentId,
          isApproved: !glossary.requireApproval,
        });

        // Notificar o professor (dono do glossário) sobre a nova contribuição
        try {
          // Buscar nome do aluno
          const [student] = await db2.select().from(students).where(eq(students.id, ctx.studentSession.studentId));
          const studentName = student?.fullName || 'Aluno';
          const statusText = glossary.requireApproval ? ' (aguardando aprovação)' : '';

          // Criar notificação no banco para o professor
          if (glossary.createdByUserId) {
            await db2.execute(sql`
              INSERT INTO notifications (userId, type, title, message, link, relatedId, relatedType, isRead, createdAt)
              VALUES (
                ${glossary.createdByUserId},
                'glossary_contribution',
                ${'📖 Nova contribuição no Glossário'},
                ${`${studentName} adicionou o termo "${input.term}" no glossário "${glossary.title}"${statusText}`},
                ${'/glossary'},
                ${glossary.id},
                'glossary',
                0,
                NOW()
              )
            `);
          }

          // Enviar push notification ao professor
          try {
            if (glossary.createdByUserId) {
              await pushNotif.sendPushNotification(
                glossary.createdByUserId,
                {
                  title: '📖 Nova contribuição no Glossário',
                  body: `${studentName} adicionou "${input.term}" no glossário "${glossary.title}"${statusText}`,
                  url: '/glossary',
                  type: 'task_reminder' as const,
                }
              );
            }
          } catch (pushErr) {
            console.error('[Glossary] Erro ao enviar push notification:', pushErr);
          }

          // Notificar via notifyOwner (Manus)
          try {
            const { notifyOwner } = await import('./_core/notification');
            await notifyOwner({
              title: `📖 Nova Contribuição no Glossário`,
              content: `**${studentName}** adicionou o termo **"${input.term}"** no glossário **"${glossary.title}"**${statusText}\n\n**Definição:** ${input.definition.substring(0, 200)}${input.definition.length > 200 ? '...' : ''}`,
            });
          } catch (ownerErr) {
            console.error('[Glossary] Erro ao notificar owner:', ownerErr);
          }
        } catch (notifErr) {
          console.error('[Glossary] Erro ao criar notificação:', notifErr);
          // Não bloquear a operação se a notificação falhar
        }

        return result;
      }),

    // Deletar entrada
    deleteEntry: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db2 = await import('./db').then(m => m.getDb());
        if (!db2) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { glossaryEntries, glossaryComments } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        await db2.delete(glossaryComments).where(eq(glossaryComments.entryId, input.id));
        await db2.delete(glossaryEntries).where(eq(glossaryEntries.id, input.id));
        return { success: true };
      }),

    // Aprovar entrada (professor)
    approveEntry: protectedProcedure
      .input(z.object({ id: z.number(), approved: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const db2 = await import('./db').then(m => m.getDb());
        if (!db2) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { glossaryEntries } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        await db2.update(glossaryEntries).set({ isApproved: input.approved }).where(eq(glossaryEntries.id, input.id));
        return { success: true };
      }),

    // Listar comentários de uma entrada
    listComments: publicProcedure
      .input(z.object({ entryId: z.number() }))
      .query(async ({ input }) => {
        const db2 = await import('./db').then(m => m.getDb());
        if (!db2) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { glossaryComments } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        return db2.select().from(glossaryComments).where(eq(glossaryComments.entryId, input.entryId)).orderBy(glossaryComments.createdAt);
      }),

    // Adicionar comentário (professor)
    addComment: protectedProcedure
      .input(z.object({ entryId: z.number(), comment: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const db2 = await import('./db').then(m => m.getDb());
        if (!db2) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { glossaryComments } = await import('../drizzle/schema');
        const [result] = await db2.insert(glossaryComments).values({
          ...input,
          authorType: 'teacher',
          authorUserId: ctx.user.id,
        });
        return result;
      }),

    // Adicionar comentário (aluno)
    addCommentStudent: studentProcedure
      .input(z.object({ entryId: z.number(), comment: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const db2 = await import('./db').then(m => m.getDb());
        if (!db2) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { glossaryComments } = await import('../drizzle/schema');
        const [result] = await db2.insert(glossaryComments).values({
          ...input,
          authorType: 'student',
          authorStudentId: ctx.studentSession.studentId,
        });
        return result;
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
      feature: 'ct_answer_evaluation',
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
