/**
 * Router tRPC para o Mural Colaborativo
 * Gerencia murais, colunas, cards e votos via HTTP (persistência)
 * Eventos em tempo real são enviados via WebSocket (mural-ws.ts)
 */
import { z } from "zod";
import { protectedProcedure, studentProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { murals, muralColumns, muralCards, muralVotes, subjects, classes, studentClassEnrollments } from "../drizzle/schema";
import { eq, and, desc, sql, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { broadcastMuralEvent } from "./mural-ws";
import { createNotification } from "./db";

// ── Configurações padrão de colunas ──────────────────────────────────────────
const DEFAULT_COLUMNS = [
  { title: "O que aprendi", icon: "💡", color: "green", position: 0 },
  { title: "Dúvidas", icon: "❓", color: "orange", position: 1 },
  { title: "Ideias", icon: "🚀", color: "purple", position: 2 },
  { title: "Respondido", icon: "✅", color: "blue", position: 3 },
];

export const muralRouter = router({
  // ── MURAIS ──────────────────────────────────────────────────────────────────

  /** Listar murais do professor (por disciplina/turma) */
  list: protectedProcedure
    .input(z.object({
      subjectId: z.number().optional(),
      classId: z.number().optional(),
      includeArchived: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const conditions = [eq(murals.createdBy, ctx.user.id)];
      if (input.subjectId) conditions.push(eq(murals.subjectId, input.subjectId));
      if (input.classId) conditions.push(eq(murals.classId, input.classId));
      if (!input.includeArchived) conditions.push(eq(murals.isActive, true));

      const rows = await db
        .select({
          id: murals.id,
          title: murals.title,
          description: murals.description,
          subjectId: murals.subjectId,
          classId: murals.classId,
          isLocked: murals.isLocked,
          isActive: murals.isActive,
          createdAt: murals.createdAt,
          subjectName: subjects.name,
          className: classes.name,
        })
        .from(murals)
        .leftJoin(subjects, eq(murals.subjectId, subjects.id))
        .leftJoin(classes, eq(murals.classId, classes.id))
        .where(and(...conditions))
        .orderBy(desc(murals.createdAt));

      return rows;
    }),

  /** Obter mural completo com colunas e cards */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [mural] = await db
        .select()
        .from(murals)
        .where(eq(murals.id, input.id))
        .limit(1);

      if (!mural) throw new TRPCError({ code: "NOT_FOUND", message: "Mural não encontrado" });

      const columns = await db
        .select()
        .from(muralColumns)
        .where(eq(muralColumns.muralId, input.id))
        .orderBy(muralColumns.position);

      const cards = await db
        .select()
        .from(muralCards)
        .where(and(eq(muralCards.muralId, input.id), eq(muralCards.isDeleted, false)))
        .orderBy(muralCards.createdAt);

      // Contar votos por card
      const votes = await db
        .select({
          cardId: muralVotes.cardId,
          count: sql<number>`count(*)`.as("count"),
        })
        .from(muralVotes)
        .where(sql`${muralVotes.cardId} IN (${cards.map(c => c.id).join(",") || "0"})`)
        .groupBy(muralVotes.cardId);

      const voteMap = new Map(votes.map(v => [v.cardId, Number(v.count)]));

      return {
        ...mural,
        columns,
        cards: cards.map(c => ({ ...c, voteCount: voteMap.get(c.id) || 0 })),
      };
    }),

  /** Obter mural para aluno (por subjectId + classId) */
  getForStudent: studentProcedure
    .input(z.object({ subjectId: z.number(), classId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      // Buscar mural ativo mais recente para essa disciplina/turma
      const [mural] = await db
        .select()
        .from(murals)
        .where(and(
          eq(murals.subjectId, input.subjectId),
          eq(murals.classId, input.classId),
          eq(murals.isActive, true),
        ))
        .orderBy(desc(murals.createdAt))
        .limit(1);

      if (!mural) return null;

      const columns = await db
        .select()
        .from(muralColumns)
        .where(eq(muralColumns.muralId, mural.id))
        .orderBy(muralColumns.position);

      const cards = await db
        .select()
        .from(muralCards)
        .where(and(eq(muralCards.muralId, mural.id), eq(muralCards.isDeleted, false)))
        .orderBy(muralCards.createdAt);

      const voteRows = cards.length > 0
        ? await db
            .select({
              cardId: muralVotes.cardId,
              count: sql<number>`count(*)`.as("count"),
            })
            .from(muralVotes)
            .where(sql`${muralVotes.cardId} IN (${cards.map(c => c.id).join(",")})`)
            .groupBy(muralVotes.cardId)
        : [];

      const voteMap = new Map(voteRows.map(v => [v.cardId, Number(v.count)]));

      // Verificar votos do aluno atual
      const myVotes = cards.length > 0
        ? await db
            .select({ cardId: muralVotes.cardId })
            .from(muralVotes)
            .where(and(
              sql`${muralVotes.cardId} IN (${cards.map(c => c.id).join(",")})`,
              eq(muralVotes.voterStudentId, ctx.studentSession.studentId),
            ))
        : [];

      const myVoteSet = new Set(myVotes.map(v => v.cardId));

      return {
        ...mural,
        columns,
        cards: cards.map(c => ({
          ...c,
          voteCount: voteMap.get(c.id) || 0,
          myVote: myVoteSet.has(c.id),
        })),
      };
    }),

  /** Criar novo mural */
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      subjectId: z.number(),
      classId: z.number(),
      columns: z.array(z.object({
        title: z.string(),
        icon: z.string(),
        color: z.string(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(murals).values({
        title: input.title,
        description: input.description,
        subjectId: input.subjectId,
        classId: input.classId,
        createdBy: ctx.user.id,
      });

      const muralId = (result as any).insertId;

      // Criar colunas (padrão ou customizadas)
      const cols = input.columns || DEFAULT_COLUMNS;
      await db.insert(muralColumns).values(
        cols.map((c, i) => ({
          muralId,
          title: c.title,
          icon: c.icon,
          color: c.color,
          position: i,
        }))
      );

      // ── Notificar alunos da turma ─────────────────────────────────────────────
      try {
        // Buscar nome da disciplina para a notificação
        const [subjectRow] = await db
          .select({ name: subjects.name })
          .from(subjects)
          .where(eq(subjects.id, input.subjectId))
          .limit(1);
        const subjectName = subjectRow?.name || 'Disciplina';

        // Buscar todos os alunos matriculados na turma
        const enrolledStudents = await db
          .select({ studentId: studentClassEnrollments.studentId })
          .from(studentClassEnrollments)
          .where(eq(studentClassEnrollments.classId, input.classId));

        // Criar notificação in-app para cada aluno (com deduplicação automática)
        for (const { studentId } of enrolledStudents) {
          try {
            await createNotification({
              userId: studentId,
              type: 'new_announcement',
              title: `🖼️ Novo Mural: ${input.title}`,
              message: `${subjectName}: Um novo mural colaborativo foi criado. Clique para participar!`,
              link: '/student/mural',
              relatedId: muralId,
            });
          } catch (err) {
            console.error('[Mural] Erro ao notificar aluno', studentId, err);
          }
        }
      } catch (err) {
        // Falha na notificação não deve impedir a criação do mural
        console.error('[Mural] Erro ao enviar notificações:', err);
      }

      return { id: muralId };
    }),

  /** Bloquear/desbloquear edição do mural */
  setLocked: protectedProcedure
    .input(z.object({ id: z.number(), locked: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db.update(murals)
        .set({ isLocked: input.locked })
        .where(and(eq(murals.id, input.id), eq(murals.createdBy, ctx.user.id)));

      broadcastMuralEvent(input.id, {
        type: input.locked ? "mural_locked" : "mural_unlocked",
        muralId: input.id,
        timestamp: Date.now(),
      });

      return { success: true };
    }),

  /** Arquivar mural */
  archive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db.update(murals)
        .set({ isActive: false })
        .where(and(eq(murals.id, input.id), eq(murals.createdBy, ctx.user.id)));
      return { success: true };
    }),

  /** Deletar mural permanentemente (professor dono) */
  deleteMural: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      // Verificar se o mural pertence ao professor
      const [mural] = await db
        .select({ id: murals.id, createdBy: murals.createdBy })
        .from(murals)
        .where(eq(murals.id, input.id))
        .limit(1);
      if (!mural) throw new TRPCError({ code: "NOT_FOUND", message: "Mural não encontrado" });
      if (mural.createdBy !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem permissão para excluir este mural" });
      // Deletar em cascata: votos → cards → colunas → mural
      const cards = await db
        .select({ id: muralCards.id })
        .from(muralCards)
        .where(eq(muralCards.muralId, input.id));
      for (const card of cards) {
        await db.delete(muralVotes).where(eq(muralVotes.cardId, card.id));
      }
      await db.delete(muralCards).where(eq(muralCards.muralId, input.id));
      await db.delete(muralColumns).where(eq(muralColumns.muralId, input.id));
      await db.delete(murals).where(eq(murals.id, input.id));
      return { success: true };
    }),

  // ── CARDS ───────────────────────────────────────────────────────────────────

  /** Adicionar card (professor) */
  addCard: protectedProcedure
    .input(z.object({
      muralId: z.number(),
      columnId: z.number(),
      text: z.string().min(1).max(2000),
      color: z.string().default("yellow"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(muralCards).values({
        muralId: input.muralId,
        columnId: input.columnId,
        text: input.text,
        color: input.color,
        authorType: "teacher",
        authorUserId: ctx.user.id,
        authorName: ctx.user.name || "Professor",
      });

      const cardId = (result as any).insertId;
      const [card] = await db.select().from(muralCards).where(eq(muralCards.id, cardId)).limit(1);

      broadcastMuralEvent(input.muralId, {
        type: "card_added",
        muralId: input.muralId,
        payload: { card: { ...card, voteCount: 0 } },
        userName: ctx.user.name || "Professor",
        userType: "teacher",
        timestamp: Date.now(),
      });

      return card;
    }),

  /** Adicionar card (aluno) */
  addCardStudent: studentProcedure
    .input(z.object({
      muralId: z.number(),
      columnId: z.number(),
      text: z.string().min(1).max(2000),
      color: z.string().default("yellow"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;

      // Verificar se mural não está bloqueado
      const [mural] = await db.select({ isLocked: murals.isLocked })
        .from(murals).where(eq(murals.id, input.muralId)).limit(1);
      if (mural?.isLocked) {
        throw new TRPCError({ code: "FORBIDDEN", message: "O mural está bloqueado pelo professor" });
      }

      const [result] = await db.insert(muralCards).values({
        muralId: input.muralId,
        columnId: input.columnId,
        text: input.text,
        color: input.color,
        authorType: "student",
        authorStudentId: ctx.studentSession.studentId,
        authorName: ctx.studentSession.fullName || "Aluno",
      });

      const cardId = (result as any).insertId;
      const [card] = await db.select().from(muralCards).where(eq(muralCards.id, cardId)).limit(1);

      broadcastMuralEvent(input.muralId, {
        type: "card_added",
        muralId: input.muralId,
        payload: { card: { ...card, voteCount: 0 } },
        userName: ctx.studentSession.fullName || "Aluno",
        userType: "student",
        timestamp: Date.now(),
      });

      return card;
    }),

  /** Responder card (professor) */
  replyCard: protectedProcedure
    .input(z.object({
      cardId: z.number(),
      reply: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [card] = await db.select().from(muralCards).where(eq(muralCards.id, input.cardId)).limit(1);
      if (!card) throw new TRPCError({ code: "NOT_FOUND" });

      await db.update(muralCards)
        .set({ teacherReply: input.reply, teacherReplyAt: new Date() })
        .where(eq(muralCards.id, input.cardId));

      broadcastMuralEvent(card.muralId, {
        type: "card_updated",
        muralId: card.muralId,
        payload: { cardId: input.cardId, teacherReply: input.reply },
        userType: "teacher",
        timestamp: Date.now(),
      });

      return { success: true };
    }),

  /** Mover card para outra coluna (professor) */
  moveCard: protectedProcedure
    .input(z.object({ cardId: z.number(), columnId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [card] = await db.select().from(muralCards).where(eq(muralCards.id, input.cardId)).limit(1);
      if (!card) throw new TRPCError({ code: "NOT_FOUND" });

      await db.update(muralCards)
        .set({ columnId: input.columnId })
        .where(eq(muralCards.id, input.cardId));

      broadcastMuralEvent(card.muralId, {
        type: "card_updated",
        muralId: card.muralId,
        payload: { cardId: input.cardId, columnId: input.columnId },
        timestamp: Date.now(),
      });

      return { success: true };
    }),

  /** Deletar card */
  deleteCard: protectedProcedure
    .input(z.object({ cardId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [card] = await db.select().from(muralCards).where(eq(muralCards.id, input.cardId)).limit(1);
      if (!card) throw new TRPCError({ code: "NOT_FOUND" });

      await db.update(muralCards)
        .set({ isDeleted: true })
        .where(eq(muralCards.id, input.cardId));

      broadcastMuralEvent(card.muralId, {
        type: "card_deleted",
        muralId: card.muralId,
        payload: { cardId: input.cardId },
        timestamp: Date.now(),
      });

      return { success: true };
    }),

  // ── VOTOS ───────────────────────────────────────────────────────────────────

  /** Votar/desvotar em um card (aluno) */
  toggleVoteStudent: studentProcedure
    .input(z.object({ cardId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [card] = await db.select().from(muralCards).where(eq(muralCards.id, input.cardId)).limit(1);
      if (!card) throw new TRPCError({ code: "NOT_FOUND" });

      const [existing] = await db
        .select()
        .from(muralVotes)
        .where(and(
          eq(muralVotes.cardId, input.cardId),
          eq(muralVotes.voterStudentId, ctx.studentSession.studentId),
        ))
        .limit(1);

      let voted: boolean;
      if (existing) {
        await db.delete(muralVotes).where(eq(muralVotes.id, existing.id));
        voted = false;
      } else {
        await db.insert(muralVotes).values({
          cardId: input.cardId,
          voterType: "student",
          voterStudentId: ctx.studentSession.studentId,
        });
        voted = true;
      }

      // Contar votos atuais
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(muralVotes)
        .where(eq(muralVotes.cardId, input.cardId));

      broadcastMuralEvent(card.muralId, {
        type: "vote_toggled",
        muralId: card.muralId,
        payload: { cardId: input.cardId, voteCount: Number(count), voted },
        userType: "student",
        timestamp: Date.now(),
      });

      return { voted, voteCount: Number(count) };
    }),

  /** Votar/desvotar em um card (professor) */
  toggleVoteTeacher: protectedProcedure
    .input(z.object({ cardId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [card] = await db.select().from(muralCards).where(eq(muralCards.id, input.cardId)).limit(1);
      if (!card) throw new TRPCError({ code: "NOT_FOUND" });

      const [existing] = await db
        .select()
        .from(muralVotes)
        .where(and(
          eq(muralVotes.cardId, input.cardId),
          eq(muralVotes.voterUserId, ctx.user.id),
        ))
        .limit(1);

      let voted: boolean;
      if (existing) {
        await db.delete(muralVotes).where(eq(muralVotes.id, existing.id));
        voted = false;
      } else {
        await db.insert(muralVotes).values({
          cardId: input.cardId,
          voterType: "teacher",
          voterUserId: ctx.user.id,
        });
        voted = true;
      }

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(muralVotes)
        .where(eq(muralVotes.cardId, input.cardId));

      broadcastMuralEvent(card.muralId, {
        type: "vote_toggled",
        muralId: card.muralId,
        payload: { cardId: input.cardId, voteCount: Number(count), voted },
        userType: "teacher",
        timestamp: Date.now(),
      });

      return { voted, voteCount: Number(count) };
    }),
});
