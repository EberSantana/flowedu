import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { eq } from "drizzle-orm";

describe("Sistema de Revisão Inteligente", () => {
  let testStudentId: number;
  let testExerciseId: number;
  let testAttemptId: number;
  let testAnswerId: number;
  const uniqueId = Date.now();

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar dados de teste
    const { students, studentExercises, studentExerciseAttempts, studentExerciseAnswers } = await import("../drizzle/schema");

    // Criar estudante de teste
    const studentResult = await db.insert(students).values({
      registrationNumber: `TEST-REV-${uniqueId}`,
      fullName: "Aluno Teste Revisão",
      userId: 1,
      createdAt: new Date(),
    });
    testStudentId = Number(studentResult[0].insertId);

    // Criar exercício de teste
    const exerciseResult = await db.insert(studentExercises).values({
      moduleId: 1,
      subjectId: 1,
      teacherId: 1,
      title: "Exercício de Teste - Revisão",
      description: "Exercício para testar sistema de revisão",
      exerciseData: JSON.stringify({
        questions: [
          {
            id: 1,
            text: "Qual é a capital do Brasil?",
            type: "multiple_choice",
            options: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
            correctAnswer: "Brasília",
          },
        ],
      }),
      totalQuestions: 1,
      totalPoints: 100,
      passingScore: 60,
      maxAttempts: 3,
      availableFrom: new Date(),
      status: "published",
      createdAt: new Date(),
    });
    testExerciseId = Number(exerciseResult[0].insertId);

    // Criar tentativa de teste
    const attemptResult = await db.insert(studentExerciseAttempts).values({
      exerciseId: testExerciseId,
      studentId: testStudentId,
      attemptNumber: 1,
      answers: JSON.stringify([{ questionId: 1, answer: "São Paulo" }]),
      status: "completed",
      score: 0,
      totalQuestions: 1,
      correctAnswers: 0,
      pointsEarned: 0,
      timeSpent: 300,
      startedAt: new Date(),
      completedAt: new Date(),
    });
    testAttemptId = Number(attemptResult[0].insertId);

    // Criar resposta errada de teste
    const answerResult = await db.insert(studentExerciseAnswers).values({
      attemptId: testAttemptId,
      questionNumber: 1,
      questionText: "Qual é a capital do Brasil?",
      questionType: "multiple_choice",
      studentAnswer: "São Paulo",
      correctAnswer: "Brasília",
      isCorrect: false,
      points: 0,
      maxPoints: 100,
      submittedAt: new Date(),
    });
    testAnswerId = Number(answerResult[0].insertId);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Limpar dados de teste
    const { students, studentExercises, studentExerciseAttempts, studentExerciseAnswers } = await import("../drizzle/schema");

    await db.delete(studentExerciseAnswers).where(eq(studentExerciseAnswers.attemptId, testAttemptId));
    await db.delete(studentExerciseAttempts).where(eq(studentExerciseAttempts.id, testAttemptId));
    await db.delete(studentExercises).where(eq(studentExercises.id, testExerciseId));
    await db.delete(students).where(eq(students.id, testStudentId));
  });

  describe("getWrongAnswers", () => {
    it("deve listar questões erradas do aluno", async () => {
      const caller = appRouter.createCaller({
        studentSession: {
          studentId: testStudentId,
          registrationNumber: "TEST-REV-001",
          fullName: "Aluno Teste Revisão",
          professorId: 1,
        },
      } as TrpcContext);

      const wrongAnswers = await caller.studentReview.getWrongAnswers({
        limit: 10,
      });

      expect(wrongAnswers).toBeDefined();
      expect(Array.isArray(wrongAnswers)).toBe(true);
      expect(wrongAnswers.length).toBeGreaterThan(0);
      expect(wrongAnswers[0]).toHaveProperty("id");
      expect(wrongAnswers[0]).toHaveProperty("studentAnswer");
      expect(wrongAnswers[0]).toHaveProperty("correctAnswer");
      expect(wrongAnswers[0].isCorrect).toBe(false);
    });

    it("deve filtrar questões por tipo", async () => {
      const caller = appRouter.createCaller({
        studentSession: {
          studentId: testStudentId,
          registrationNumber: "TEST-REV-001",
          fullName: "Aluno Teste Revisão",
          professorId: 1,
        },
      } as TrpcContext);

      const wrongAnswers = await caller.studentReview.getWrongAnswers({
        questionType: "multiple_choice",
        limit: 10,
      });

      expect(wrongAnswers).toBeDefined();
      expect(Array.isArray(wrongAnswers)).toBe(true);
      wrongAnswers.forEach((answer) => {
        expect(answer.questionType).toBe("multiple_choice");
      });
    });
  });

  describe("getStudyTips", () => {
    it("deve gerar dicas de estudo personalizadas", async () => {
      const caller = appRouter.createCaller({
        studentSession: {
          studentId: testStudentId,
          registrationNumber: "TEST-REV-001",
          fullName: "Aluno Teste Revisão",
          professorId: 1,
        },
      } as TrpcContext);

      const tips = await caller.studentReview.getStudyTips({
        answerId: testAnswerId,
        questionText: "Qual é a capital do Brasil?",
        studentAnswer: "São Paulo",
        correctAnswer: "Brasília",
        questionType: "multiple_choice",
      });

      expect(tips).toBeDefined();
      expect(tips).toHaveProperty("conceptExplanation");
      expect(tips).toHaveProperty("studyTips");
      expect(tips).toHaveProperty("suggestedMaterials");
      expect(tips).toHaveProperty("reviewStrategy");
      expect(Array.isArray(tips.studyTips)).toBe(true);
      expect(tips.studyTips.length).toBeGreaterThan(0);
    });
  });

  describe("getErrorPatterns", () => {
    it("deve analisar padrões de erro do aluno", async () => {
      const caller = appRouter.createCaller({
        studentSession: {
          studentId: testStudentId,
          registrationNumber: "TEST-REV-001",
          fullName: "Aluno Teste Revisão",
          professorId: 1,
        },
      } as TrpcContext);

      const patterns = await caller.studentReview.getErrorPatterns({});

      expect(patterns).toBeDefined();
      expect(patterns).toHaveProperty("errorsByType");
      expect(patterns).toHaveProperty("errorsByModule");
      expect(patterns).toHaveProperty("errorRate");
      expect(Array.isArray(patterns.errorsByType)).toBe(true);
      expect(Array.isArray(patterns.errorsByModule)).toBe(true);
    });
  });

  describe("markAsReviewed", () => {
    it("deve marcar questão como revisada", async () => {
      const caller = appRouter.createCaller({
        studentSession: {
          studentId: testStudentId,
          registrationNumber: "TEST-REV-001",
          fullName: "Aluno Teste Revisão",
          professorId: 1,
        },
      } as TrpcContext);

      const result = await caller.studentReview.markAsReviewed({
        answerId: testAnswerId,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
    });
  });

  describe("getStats", () => {
    it("deve retornar estatísticas de revisão do aluno", async () => {
      const caller = appRouter.createCaller({
        studentSession: {
          studentId: testStudentId,
          registrationNumber: "TEST-REV-001",
          fullName: "Aluno Teste Revisão",
          professorId: 1,
        },
      } as TrpcContext);

      const stats = await caller.studentReview.getStats({});

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("totalSessions");
      expect(stats).toHaveProperty("totalQuestionsReviewed");
      expect(stats).toHaveProperty("totalQuestionsRetaken");
      expect(stats).toHaveProperty("avgImprovementRate");
      expect(stats).toHaveProperty("totalStudyTime");
      expect(typeof stats.totalSessions).toBe("number");
      expect(typeof stats.avgImprovementRate).toBe("number");
    });
  });

  describe("createSession", () => {
    it("deve criar sessão de revisão", async () => {
      const caller = appRouter.createCaller({
        studentSession: {
          studentId: testStudentId,
          registrationNumber: "TEST-REV-001",
          fullName: "Aluno Teste Revisão",
          professorId: 1,
        },
      } as TrpcContext);

      const result = await caller.studentReview.createSession({
        totalQuestionsReviewed: 5,
        sessionDuration: 1800, // 30 minutos
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("sessionId");
      expect(typeof result.sessionId).toBe("number");
      expect(result.sessionId).toBeGreaterThan(0);
    });
  });
});
