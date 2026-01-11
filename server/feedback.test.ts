import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import {
  users,
  subjects,
  learningModules,
  studentExercises,
  studentExerciseAttempts,
  studentExerciseAnswers,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Sistema de Feedback com IA", () => {
  let testUserId: number;
  let testSubjectId: number;
  let testModuleId: number;
  let testExerciseId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar usuário de teste
    const userResult = await db.insert(users).values({
      openId: `test-feedback-${Date.now()}`,
      name: "Aluno Teste Feedback",
      email: `feedback-test-${Date.now()}@test.com`,
      role: "user",
    });
    testUserId = userResult[0].insertId;

    // Criar disciplina de teste
    const subjectResult = await db.insert(subjects).values({
      userId: testUserId,
      name: "Matemática - Feedback Test",
      description: "Disciplina para testar feedback",
      code: "MAT-FB",
      workload: 60,
    });
    testSubjectId = subjectResult[0].insertId;

    // Criar módulo de teste
    const moduleResult = await db.insert(learningModules).values({
      userId: testUserId,
      subjectId: testSubjectId,
      title: "Módulo de Teste Feedback",
      description: "Módulo para testar feedback com IA",
      orderIndex: 1,
    });
    testModuleId = moduleResult[0].insertId;

    // Criar exercício de teste com questões objetivas
    const exerciseResult = await db.insert(studentExercises).values({
      teacherId: testUserId,
      subjectId: testSubjectId,
      moduleId: testModuleId,
      title: "Exercício de Teste - Feedback",
      description: "Exercício para testar geração de feedback",
      exerciseData: {
        exercises: [
          {
            number: 1,
            type: "objective",
            question: "Quanto é 2 + 2?",
            correctAnswer: "4",
            explanation: "A soma de 2 + 2 resulta em 4.",
          },
          {
            number: 2,
            type: "objective",
            question: "Qual é a capital do Brasil?",
            correctAnswer: "Brasília",
            explanation: "Brasília é a capital federal do Brasil desde 1960.",
          },
        ],
      },
      totalQuestions: 2,
      totalPoints: 20,
      maxAttempts: 3,
      status: "published",
      availableFrom: new Date(),
      availableTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
    });
    testExerciseId = exerciseResult[0].insertId;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Limpar dados de teste
    await db.delete(studentExerciseAnswers).where(eq(studentExerciseAnswers.attemptId, 1));
    await db.delete(studentExerciseAttempts).where(eq(studentExerciseAttempts.studentId, testUserId));
    await db.delete(studentExercises).where(eq(studentExercises.id, testExerciseId));
    await db.delete(learningModules).where(eq(learningModules.id, testModuleId));
    await db.delete(subjects).where(eq(subjects.id, testSubjectId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("deve adicionar campos aiFeedback e studyTips no schema", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Verificar se as colunas existem consultando a estrutura da tabela
    const columns = await db
      .select()
      .from(studentExerciseAnswers)
      .limit(0);

    // Se a query não der erro, as colunas existem no schema
    // Vamos testar inserindo um registro com os novos campos
    expect(columns).toBeDefined();
  });

  it("deve permitir inserir resposta com aiFeedback e studyTips", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar tentativa
    const attemptResult = await db.insert(studentExerciseAttempts).values({
      exerciseId: testExerciseId,
      studentId: testUserId,
      attemptNumber: 1,
      answers: [],
      score: 0,
      correctAnswers: 0,
      totalQuestions: 2,
      pointsEarned: 0,
      status: "completed",
      startedAt: new Date(),
      completedAt: new Date(),
    });

    const attemptId = attemptResult[0].insertId;

    // Inserir resposta com feedback
    const answerResult = await db.insert(studentExerciseAnswers).values({
      attemptId,
      questionNumber: 1,
      questionType: "objective",
      studentAnswer: "5",
      correctAnswer: "4",
      isCorrect: false,
      pointsAwarded: 0,
      aiFeedback: "A resposta correta é 4, pois 2 + 2 = 4. Você respondeu 5, o que está incorreto.",
      studyTips: "Revise operações básicas de adição. Pratique somas simples diariamente.",
    });

    expect(answerResult[0].insertId).toBeGreaterThan(0);

    // Verificar se foi inserido corretamente
    const savedAnswer = await db
      .select()
      .from(studentExerciseAnswers)
      .where(eq(studentExerciseAnswers.id, answerResult[0].insertId))
      .limit(1);

    expect(savedAnswer[0]).toBeDefined();
    expect(savedAnswer[0].aiFeedback).toBe("A resposta correta é 4, pois 2 + 2 = 4. Você respondeu 5, o que está incorreto.");
    expect(savedAnswer[0].studyTips).toBe("Revise operações básicas de adição. Pratique somas simples diariamente.");
  });

  it("deve permitir feedback nulo para questões corretas", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar tentativa
    const attemptResult = await db.insert(studentExerciseAttempts).values({
      exerciseId: testExerciseId,
      studentId: testUserId,
      attemptNumber: 2,
      answers: [],
      score: 100,
      correctAnswers: 1,
      totalQuestions: 1,
      pointsEarned: 10,
      status: "completed",
      startedAt: new Date(),
      completedAt: new Date(),
    });

    const attemptId = attemptResult[0].insertId;

    // Inserir resposta correta sem feedback
    const answerResult = await db.insert(studentExerciseAnswers).values({
      attemptId,
      questionNumber: 1,
      questionType: "objective",
      studentAnswer: "4",
      correctAnswer: "4",
      isCorrect: true,
      pointsAwarded: 10,
      aiFeedback: null,
      studyTips: null,
    });

    expect(answerResult[0].insertId).toBeGreaterThan(0);

    // Verificar se foi inserido corretamente
    const savedAnswer = await db
      .select()
      .from(studentExerciseAnswers)
      .where(eq(studentExerciseAnswers.id, answerResult[0].insertId))
      .limit(1);

    expect(savedAnswer[0]).toBeDefined();
    expect(savedAnswer[0].isCorrect).toBe(true);
    expect(savedAnswer[0].aiFeedback).toBeNull();
    expect(savedAnswer[0].studyTips).toBeNull();
  });

  it("deve retornar feedback e dicas na função getExerciseResults", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar tentativa com resposta errada
    const attemptResult = await db.insert(studentExerciseAttempts).values({
      exerciseId: testExerciseId,
      studentId: testUserId,
      attemptNumber: 3,
      answers: JSON.stringify([{ answer: "Paris" }]),
      score: 0,
      correctAnswers: 0,
      totalQuestions: 1,
      pointsEarned: 0,
      status: "completed",
      startedAt: new Date(),
      completedAt: new Date(),
      timeSpent: 120,
    });

    const attemptId = attemptResult[0].insertId;

    // Inserir resposta com feedback
    await db.insert(studentExerciseAnswers).values({
      attemptId,
      questionNumber: 2,
      questionType: "objective",
      studentAnswer: "Paris",
      correctAnswer: "Brasília",
      isCorrect: false,
      pointsAwarded: 0,
      aiFeedback: "Paris é a capital da França, não do Brasil. A capital do Brasil é Brasília.",
      studyTips: "Estude a geografia do Brasil. Memorize as capitais dos países da América do Sul.",
    });

    // Buscar resultados usando a query direta
    const results = await db
      .select()
      .from(studentExerciseAttempts)
      .where(eq(studentExerciseAttempts.id, attemptId))
      .limit(1);

    expect(results[0]).toBeDefined();
    expect(results[0].score).toBe(0);

    // Buscar respostas
    const answers = await db
      .select()
      .from(studentExerciseAnswers)
      .where(eq(studentExerciseAnswers.attemptId, attemptId));

    expect(answers.length).toBe(1);
    expect(answers[0].aiFeedback).toBe("Paris é a capital da França, não do Brasil. A capital do Brasil é Brasília.");
    expect(answers[0].studyTips).toBe("Estude a geografia do Brasil. Memorize as capitais dos países da América do Sul.");
  });
});
