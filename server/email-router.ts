/**
 * Router de E-mail Institucional
 * Permite configurar SMTP e enviar e-mails para grupos de alunos
 */
import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { emailConfigs, emailCampaigns, classes, subjects, students, studentClassEnrollments, subjectEnrollments } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
// nodemailer é importado dinamicamente para não ser incluído no bundle do cliente

// ==================== HELPERS ====================

/**
 * Criptografia simples para senhas SMTP (XOR com chave fixa)
 * Em produção, usar variável de ambiente como chave
 */
function encryptPassword(password: string): string {
  const key = process.env.JWT_SECRET || "flowedu-smtp-key";
  const buf = Buffer.from(password, "utf8");
  const keyBuf = Buffer.from(key, "utf8");
  for (let i = 0; i < buf.length; i++) {
    buf[i] ^= keyBuf[i % keyBuf.length];
  }
  return buf.toString("base64");
}

function decryptPassword(encrypted: string): string {
  const key = process.env.JWT_SECRET || "flowedu-smtp-key";
  const buf = Buffer.from(encrypted, "base64");
  const keyBuf = Buffer.from(key, "utf8");
  for (let i = 0; i < buf.length; i++) {
    buf[i] ^= keyBuf[i % keyBuf.length];
  }
  return buf.toString("utf8");
}

/**
 * Criar transporter nodemailer a partir da configuração (import dinâmico)
 */
async function createTransporter(config: {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
}) {
  const nodemailer = await import("nodemailer");
  return nodemailer.default.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: decryptPassword(config.smtpPassword),
    },
    tls: {
      rejectUnauthorized: false, // Aceitar certificados auto-assinados (comum em servidores institucionais)
    },
  });
}

// ==================== ROUTER ====================

export const emailRouter = router({
  // ---- Configurações SMTP ----

  /**
   * Obter configuração de e-mail do professor atual
   */
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados indisponível' });
    const configs = await db
      .select()
      .from(emailConfigs)
      .where(eq(emailConfigs.userId, ctx.user.id))
      .limit(1);

    if (configs.length === 0) return null;

    const config = configs[0];
    // Não retornar a senha descriptografada
    return {
      id: config.id,
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      smtpSecure: config.smtpSecure,
      smtpUser: config.smtpUser,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      isActive: config.isActive,
      lastTestedAt: config.lastTestedAt,
      lastTestStatus: config.lastTestStatus,
      lastTestError: config.lastTestError,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      // Indicar se tem senha configurada (sem expor o valor)
      hasPassword: config.smtpPassword.length > 0,
    };
  }),

  /**
   * Salvar/atualizar configuração SMTP
   */
  saveConfig: protectedProcedure
    .input(
      z.object({
        smtpHost: z.string().min(1, "Host SMTP é obrigatório"),
        smtpPort: z.number().int().min(1).max(65535).default(587),
        smtpSecure: z.boolean().default(false),
        smtpUser: z.string().email("Usuário SMTP deve ser um e-mail válido"),
        smtpPassword: z.string().optional(), // Opcional: se não informado, mantém a senha atual
        fromEmail: z.string().email("E-mail remetente inválido"),
        fromName: z.string().min(1).default("FlowEdu"),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados indisponível' });
      const existing = await db
        .select({ id: emailConfigs.id, smtpPassword: emailConfigs.smtpPassword })
        .from(emailConfigs)
        .where(eq(emailConfigs.userId, ctx.user.id))
        .limit(1);

      // Determinar a senha a usar
      let passwordToSave: string;
      if (input.smtpPassword && input.smtpPassword.length > 0) {
        passwordToSave = encryptPassword(input.smtpPassword);
      } else if (existing.length > 0) {
        passwordToSave = existing[0].smtpPassword; // Manter senha atual
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Senha SMTP é obrigatória na primeira configuração",
        });
      }

      if (existing.length > 0) {
        // Atualizar configuração existente
        await db
          .update(emailConfigs)
          .set({
            smtpHost: input.smtpHost,
            smtpPort: input.smtpPort,
            smtpSecure: input.smtpSecure,
            smtpUser: input.smtpUser,
            smtpPassword: passwordToSave,
            fromEmail: input.fromEmail,
            fromName: input.fromName,
            isActive: input.isActive,
          })
          .where(eq(emailConfigs.id, existing[0].id));
        return { success: true, action: "updated" };
      } else {
        // Criar nova configuração
        await db.insert(emailConfigs).values({
          userId: ctx.user.id,
          smtpHost: input.smtpHost,
          smtpPort: input.smtpPort,
          smtpSecure: input.smtpSecure,
          smtpUser: input.smtpUser,
          smtpPassword: passwordToSave,
          fromEmail: input.fromEmail,
          fromName: input.fromName,
          isActive: input.isActive,
        });
        return { success: true, action: "created" };
      }
    }),

  /**
   * Testar configuração SMTP enviando e-mail de teste
   */
  testConfig: protectedProcedure
    .input(
      z.object({
        testEmail: z.string().email("E-mail de teste inválido"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados indisponível' });
      const configs = await db
        .select()
        .from(emailConfigs)
        .where(and(eq(emailConfigs.userId, ctx.user.id), eq(emailConfigs.isActive, true)))
        .limit(1);

      if (configs.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nenhuma configuração de e-mail encontrada. Configure o SMTP primeiro.",
        });
      }

      const config = configs[0];

      try {
        const transporter = await createTransporter(config);

        // Verificar conexão
        await transporter.verify();

        // Enviar e-mail de teste
        await transporter.sendMail({
          from: `${config.fromName} <${config.fromEmail}>`,
          to: input.testEmail,
          subject: "✅ Teste de Configuração SMTP - FlowEdu",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">✅ Configuração SMTP Funcionando!</h2>
              <p>Este é um e-mail de teste enviado pelo <strong>FlowEdu</strong> para confirmar que sua configuração SMTP está correta.</p>
              <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
              <p><strong>Servidor SMTP:</strong> ${config.smtpHost}:${config.smtpPort}</p>
              <p><strong>Usuário:</strong> ${config.smtpUser}</p>
              <p><strong>Remetente:</strong> ${config.fromName} &lt;${config.fromEmail}&gt;</p>
              <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 12px;">Enviado em ${new Date().toLocaleString("pt-BR")} via FlowEdu</p>
            </div>
          `,
        });

        // Atualizar status do teste
        await db
          .update(emailConfigs)
          .set({
            lastTestedAt: new Date(),
            lastTestStatus: "success",
            lastTestError: null,
          })
          .where(eq(emailConfigs.id, config.id));

        return { success: true, message: `E-mail de teste enviado para ${input.testEmail}` };
      } catch (error: any) {
        const errorMsg = error.message || "Erro desconhecido";

        // Atualizar status do teste com erro
        await db
          .update(emailConfigs)
          .set({
            lastTestedAt: new Date(),
            lastTestStatus: "failed",
            lastTestError: errorMsg,
          })
          .where(eq(emailConfigs.id, config.id));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Falha no teste SMTP: ${errorMsg}`,
        });
      }
    }),

  /**
   * Deletar configuração SMTP
   */
  deleteConfig: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados indisponível' });
    await db.delete(emailConfigs).where(eq(emailConfigs.userId, ctx.user.id));
    return { success: true };
  }),

  // ---- Destinatários ----

  /**
   * Listar grupos disponíveis para envio (turmas e disciplinas)
   */
  getRecipientGroups: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados indisponível' });

    // Buscar turmas do professor
    const teacherClasses = await db
      .select({ id: classes.id, name: classes.name, code: classes.code })
      .from(classes)
      .where(eq(classes.userId, ctx.user.id));

    // Buscar disciplinas do professor
    const teacherSubjects = await db
      .select({ id: subjects.id, name: subjects.name, code: subjects.code })
      .from(subjects)
      .where(eq(subjects.userId, ctx.user.id));

    return {
      classes: teacherClasses,
      subjects: teacherSubjects,
    };
  }),

  /**
   * Buscar alunos de uma turma com seus e-mails
   */
  getStudentsByClass: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados indisponível' });

      // Verificar que a turma pertence ao professor
      const classData = await db
        .select()
        .from(classes)
        .where(and(eq(classes.id, input.classId), eq(classes.userId, ctx.user.id)))
        .limit(1);

      if (classData.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Turma não encontrada" });
      }

      // Buscar alunos matriculados na turma com e-mail
      const enrollments = await db
        .select({
          studentId: students.id,
          name: students.fullName,
          registration: students.registrationNumber,
          email: students.email,
        })
        .from(studentClassEnrollments)
        .innerJoin(students, eq(studentClassEnrollments.studentId, students.id))
        .where(
          and(
            eq(studentClassEnrollments.classId, input.classId),
            eq(studentClassEnrollments.userId, ctx.user.id)
          )
        );

      return enrollments;
    }),

  /**
   * Buscar alunos de uma disciplina com seus e-mails
   */
  getStudentsBySubject: protectedProcedure
    .input(z.object({ subjectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados indisponível' });

      // Verificar que a disciplina pertence ao professor
      const subjectData = await db
        .select()
        .from(subjects)
        .where(and(eq(subjects.id, input.subjectId), eq(subjects.userId, ctx.user.id)))
        .limit(1);

      if (subjectData.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Disciplina não encontrada" });
      }

      // Buscar alunos matriculados na disciplina
      const enrollments = await db
        .select({
          studentId: students.id,
          name: students.fullName,
          registration: students.registrationNumber,
          email: students.email,
        })
        .from(subjectEnrollments)
        .innerJoin(students, eq(subjectEnrollments.studentId, students.id))
        .where(
          and(
            eq(subjectEnrollments.subjectId, input.subjectId),
            eq(subjectEnrollments.userId, ctx.user.id)
          )
        );

      return enrollments;
    }),

  /**
   * Buscar todos os alunos do professor
   */
  getAllStudents: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados indisponível' });
    return await db
      .select({
        id: students.id,
        name: students.fullName,
        registration: students.registrationNumber,
        email: students.email,
      })
      .from(students)
      .where(eq(students.userId, ctx.user.id));
  }),

  // ---- Envio de E-mails ----

  /**
   * Enviar e-mail para um grupo de destinatários
   * Os destinatários são identificados por matrícula + e-mail manual
   */
  sendEmail: protectedProcedure
    .input(
      z.object({
        subject: z.string().min(1, "Assunto é obrigatório"),
        bodyHtml: z.string().min(1, "Corpo do e-mail é obrigatório"),
        bodyText: z.string().optional(),
        recipientType: z.enum(["class", "subject", "manual", "all"]),
        recipientGroupId: z.number().optional(),
        recipientGroupName: z.string().optional(),
        // Lista de destinatários: { name, email }
        recipients: z.array(
          z.object({
            name: z.string(),
            email: z.string().email(),
          })
        ).min(1, "Pelo menos um destinatário é necessário"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados indisponível' });

      // Buscar configuração SMTP ativa
      const configs = await db
        .select()
        .from(emailConfigs)
        .where(and(eq(emailConfigs.userId, ctx.user.id), eq(emailConfigs.isActive, true)))
        .limit(1);

      if (configs.length === 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Configure o SMTP antes de enviar e-mails. Acesse Administração > Configuração de E-mail.",
        });
      }

      const config = configs[0];
      const recipientEmails = input.recipients.map((r) => r.email);

      // Criar registro da campanha
      const [campaign] = await db
        .insert(emailCampaigns)
        .values({
          userId: ctx.user.id,
          emailConfigId: config.id,
          subject: input.subject,
          bodyHtml: input.bodyHtml,
          bodyText: input.bodyText || "",
          recipientType: input.recipientType,
          recipientGroupId: input.recipientGroupId,
          recipientGroupName: input.recipientGroupName || "",
          recipientEmails: JSON.stringify(recipientEmails),
          totalRecipients: input.recipients.length,
          status: "sending",
        })
        .$returningId();

      const campaignId = campaign.id;

      // Enviar e-mails
      const transporter = await createTransporter(config);
      let sentCount = 0;
      let failedCount = 0;
      const errors: { email: string; error: string }[] = [];

      for (const recipient of input.recipients) {
        try {
          await transporter.sendMail({
            from: `${config.fromName} <${config.fromEmail}>`,
            to: `${recipient.name} <${recipient.email}>`,
            subject: input.subject,
            html: input.bodyHtml,
            text: input.bodyText,
          });
          sentCount++;
        } catch (error: any) {
          failedCount++;
          errors.push({ email: recipient.email, error: error.message });
          console.error(`[EmailRouter] Falha ao enviar para ${recipient.email}:`, error.message);
        }
      }

      // Atualizar status da campanha
      const finalStatus =
        failedCount === 0 ? "completed" : sentCount === 0 ? "failed" : "partial";

      await db
        .update(emailCampaigns)
        .set({
          status: finalStatus,
          sentCount,
          failedCount,
          errorLog: errors.length > 0 ? JSON.stringify(errors) : null,
          sentAt: new Date(),
        })
        .where(eq(emailCampaigns.id, campaignId));

      return {
        success: sentCount > 0,
        sentCount,
        failedCount,
        totalRecipients: input.recipients.length,
        status: finalStatus,
        errors: errors.length > 0 ? errors : undefined,
      };
    }),

  // ---- Histórico de Campanhas ----

  /**
   * Listar histórico de campanhas de e-mail
   */
  getCampaigns: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados indisponível' });
      const campaigns = await db
        .select()
        .from(emailCampaigns)
        .where(eq(emailCampaigns.userId, ctx.user.id))
        .orderBy(desc(emailCampaigns.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return campaigns.map((c) => ({
        ...c,
        recipientEmails: JSON.parse(c.recipientEmails || "[]") as string[],
        errorLog: c.errorLog ? (JSON.parse(c.errorLog) as { email: string; error: string }[]) : null,
      }));
    }),

  /**
   * Deletar uma campanha do histórico
   */
  deleteCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados indisponível' });
      await db
        .delete(emailCampaigns)
        .where(
          and(eq(emailCampaigns.id, input.campaignId), eq(emailCampaigns.userId, ctx.user.id))
        );
      return { success: true };
    }),
});
