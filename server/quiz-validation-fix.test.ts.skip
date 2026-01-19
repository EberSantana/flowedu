import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, subjects, learningModules, studentExercises, studentExerciseAttempts, studentExerciseAnswers } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Quiz Validation Fixes", () => {
  let testUserId: number;
  let testSubjectId: number;
  let testModuleId: number;
  let testExerciseId: number;

  beforeAll(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // Criar usuário de teste
    const userResult = await database.insert(users).values({
      openId: `test-quiz-${Date.now()}`,
      name: "Test Quiz Student",
      role: "user",
      active: true,
    });
    testUserId = Number(userResult[0].insertId);

    // Criar disciplina de teste
    const subjectResult = await database.insert(subjects).values({
      name: "Disciplina Teste Quiz",
      code: "QUIZ-TEST",
      userId: testUserId,
    });
    testSubjectId = Number(subjectResult[0].insertId);

    // Criar módulo de teste
    const moduleResult = await database.insert(learningModules).values({
      title: "Módulo Teste Quiz",
      subjectId: testSubjectId,
      userId: testUserId,
    });
    testModuleId = Number(moduleResult[0].insertId);

    // Criar exercício com diferentes formatos de resposta
    const exerciseResult = await database.insert(studentExercises).values({
      title: "Teste de Validação de Respostas",
      description: "Exercício para testar diferentes formatos de resposta",
      subjectId: testSubjectId,
      moduleId: testModuleId,
      teacherId: testUserId,
      totalQuestions: 3,
      totalPoints: 30,
      passingScore: 70,
      maxAttempts: 3,
      availableFrom: new Date(),
      exerciseData: {
        exercises: [
          {
            number: 1,
            type: "objective",
            question: "Qual é a capital do Brasil?",
            options: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
            correctAnswer: "Brasília",
            explanation: "Brasília é a capital federal do Brasil desde 1960.",
          },
          {
            number: 2,
            type: "objective",
            question: "Qual técnica garante a integridade de arquivos?",
            options: [
              "Criptografia simétrica",
              "Autenticação multifator",
              "Aplicação de hashes criptográficos (checksums) para verificar a imutabilidade de um arquivo.",
              "Backup incremental",
            ],
            correctAnswer: "C) Aplicação de hashes criptográficos (checksums) para verificar a imutabilidade de um arquivo.",
            explanation: "Hashes criptográficos garantem a integridade dos dados.",
          },
          {
            number: 3,
            type: "objective",
            question: "Quanto é 2 + 2?",
            options: ["A) 3", "B) 4", "C) 5", "D) 6"],
            correctAnswer: "B) 4",
            explanation: "2 + 2 = 4",
          },
        ],
      },
    });
    testExerciseId = Number(exerciseResult[0].insertId);
  });

  afterAll(async () => {
    const database = await getDb();
    if (!database) return;

    // Limpar dados de teste
    await database.delete(studentExerciseAnswers).where(eq(studentExerciseAnswers.attemptId, testExerciseId));
    await database.delete(studentExerciseAttempts).where(eq(studentExerciseAttempts.exerciseId, testExerciseId));
    await database.delete(studentExercises).where(eq(studentExercises.id, testExerciseId));
    await database.delete(learningModules).where(eq(learningModules.id, testModuleId));
    await database.delete(subjects).where(eq(subjects.id, testSubjectId));
    await database.delete(users).where(eq(users.id, testUserId));
  });

  it("deve validar resposta correta sem letra (formato texto completo)", async () => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // Criar tentativa
    const attemptResult = await database.insert(studentExerciseAttempts).values({
      exerciseId: testExerciseId,
      studentId: testUserId,
      attemptNumber: 1,
      answers: [],
      score: 0,
      correctAnswers: 0,
      totalQuestions: 3,
      pointsEarned: 0,
      status: "in_progress",
      startedAt: new Date(),
    });
    const attemptId = Number(attemptResult[0].insertId);

    // Submeter resposta sem letra (texto completo)
    const { submitExerciseAttempt } = await import("./db");
    
    // Buscar exercício para obter exerciseData
    const exercise = await database.select().from(studentExercises).where(eq(studentExercises.id, testExerciseId)).limit(1);
    
    const result = await submitExerciseAttempt(attemptId, [
      { questionNumber: 1, answer: "Brasília" },
      { questionNumber: 2, answer: "Aplicação de hashes criptográficos (checksums) para verificar a imutabilidade de um arquivo." },
      { questionNumber: 3, answer: "4" },
    ], exercise[0].exerciseData);

    // Verificar que todas as respostas foram consideradas corretas
    expect(result.correctAnswers).toBe(3);
    expect(result.score).toBe(100);
    expect(result.pointsEarned).toBe(30);

    // Limpar
    await database.delete(studentExerciseAnswers).where(eq(studentExerciseAnswers.attemptId, attemptId));
    await database.delete(studentExerciseAttempts).where(eq(studentExerciseAttempts.id, attemptId));
  });

  it("deve validar resposta correta com letra (formato 'C) Texto')", async () => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // Criar tentativa
    const attemptResult = await database.insert(studentExerciseAttempts).values({
      exerciseId: testExerciseId,
      studentId: testUserId,
      attemptNumber: 2,
      answers: [],
      score: 0,
      correctAnswers: 0,
      totalQuestions: 3,
      pointsEarned: 0,
      status: "in_progress",
      startedAt: new Date(),
    });
    const attemptId = Number(attemptResult[0].insertId);

    // Submeter resposta com letra completa
    const { submitExerciseAttempt } = await import("./db");
    
    // Buscar exercício para obter exerciseData
    const exercise = await database.select().from(studentExercises).where(eq(studentExercises.id, testExerciseId)).limit(1);
    
    const result = await submitExerciseAttempt(attemptId, [
      { questionNumber: 1, answer: "Brasília" },
      { questionNumber: 2, answer: "C) Aplicação de hashes criptográficos (checksums) para verificar a imutabilidade de um arquivo." },
      { questionNumber: 3, answer: "B) 4" },
    ], exercise[0].exerciseData);

    // Verificar que todas as respostas foram consideradas corretas
    expect(result.correctAnswers).toBe(3);
    expect(result.score).toBe(100);
    expect(result.pointsEarned).toBe(30);

    // Limpar
    await database.delete(studentExerciseAnswers).where(eq(studentExerciseAnswers.attemptId, attemptId));
    await database.delete(studentExerciseAttempts).where(eq(studentExerciseAttempts.id, attemptId));
  });

  it("deve validar resposta correta apenas com letra (formato 'C')", async () => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // Criar tentativa
    const attemptResult = await database.insert(studentExerciseAttempts).values({
      exerciseId: testExerciseId,
      studentId: testUserId,
      attemptNumber: 3,
      answers: [],
      score: 0,
      correctAnswers: 0,
      totalQuestions: 3,
      pointsEarned: 0,
      status: "in_progress",
      startedAt: new Date(),
    });
    const attemptId = Number(attemptResult[0].insertId);

    // Submeter resposta apenas com letra
    const { submitExerciseAttempt } = await import("./db");
    
    // Buscar exercício para obter exerciseData
    const exercise = await database.select().from(studentExercises).where(eq(studentExercises.id, testExerciseId)).limit(1);
    
    const result = await submitExerciseAttempt(attemptId, [
      { questionNumber: 1, answer: "Brasília" },
      { questionNumber: 2, answer: "C" },
      { questionNumber: 3, answer: "B" },
    ], exercise[0].exerciseData);

    // Verificar que todas as respostas foram consideradas corretas
    expect(result.correctAnswers).toBe(3);
    expect(result.score).toBe(100);
    expect(result.pointsEarned).toBe(30);

    // Limpar
    await database.delete(studentExerciseAnswers).where(eq(studentExerciseAnswers.attemptId, attemptId));
    await database.delete(studentExerciseAttempts).where(eq(studentExerciseAttempts.id, attemptId));
  });

  it("deve retornar enunciado das questões corretamente em getExerciseResults", async () => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // Criar tentativa
    const attemptResult = await database.insert(studentExerciseAttempts).values({
      exerciseId: testExerciseId,
      studentId: testUserId,
      attemptNumber: 4,
      answers: [],
      score: 0,
      correctAnswers: 0,
      totalQuestions: 3,
      pointsEarned: 0,
      status: "completed",
      startedAt: new Date(),
      completedAt: new Date(),
    });
    const attemptId = Number(attemptResult[0].insertId);

    // Inserir respostas
    await database.insert(studentExerciseAnswers).values([
      {
        attemptId,
        questionNumber: 1,
        questionType: "objective",
        studentAnswer: "Brasília",
        correctAnswer: "Brasília",
        isCorrect: true,
        pointsAwarded: 10,
      },
      {
        attemptId,
        questionNumber: 2,
        questionType: "objective",
        studentAnswer: "C",
        correctAnswer: "C) Aplicação de hashes criptográficos (checksums) para verificar a imutabilidade de um arquivo.",
        isCorrect: true,
        pointsAwarded: 10,
      },
      {
        attemptId,
        questionNumber: 3,
        questionType: "objective",
        studentAnswer: "B",
        correctAnswer: "B) 4",
        isCorrect: true,
        pointsAwarded: 10,
      },
    ]);

    // Buscar resultados
    const { getExerciseResults } = await import("./db");
    const results = await getExerciseResults(attemptId);

    // Verificar que os enunciados estão presentes
    expect(results).toBeDefined();
    expect(results?.questions).toHaveLength(3);
    expect(results?.questions[0].question).toBe("Qual é a capital do Brasil?");
    expect(results?.questions[0].text).toBe("Qual é a capital do Brasil?");
    expect(results?.questions[1].question).toBe("Qual técnica garante a integridade de arquivos?");
    expect(results?.questions[1].text).toBe("Qual técnica garante a integridade de arquivos?");
    expect(results?.questions[2].question).toBe("Quanto é 2 + 2?");
    expect(results?.questions[2].text).toBe("Quanto é 2 + 2?");

    // Verificar que as opções estão presentes
    expect(results?.questions[0].options).toHaveLength(4);
    expect(results?.questions[1].options).toHaveLength(4);
    expect(results?.questions[2].options).toHaveLength(4);

    // Limpar
    await database.delete(studentExerciseAnswers).where(eq(studentExerciseAnswers.attemptId, attemptId));
    await database.delete(studentExerciseAttempts).where(eq(studentExerciseAttempts.id, attemptId));
  });

  it("deve marcar resposta incorreta quando formato não corresponde", async () => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // Criar tentativa
    const attemptResult = await database.insert(studentExerciseAttempts).values({
      exerciseId: testExerciseId,
      studentId: testUserId,
      attemptNumber: 5,
      answers: [],
      score: 0,
      correctAnswers: 0,
      totalQuestions: 3,
      pointsEarned: 0,
      status: "in_progress",
      startedAt: new Date(),
    });
    const attemptId = Number(attemptResult[0].insertId);

    // Submeter respostas incorretas
    const { submitExerciseAttempt } = await import("./db");
    
    // Buscar exercício para obter exerciseData
    const exercise = await database.select().from(studentExercises).where(eq(studentExercises.id, testExerciseId)).limit(1);
    
    const result = await submitExerciseAttempt(attemptId, [
      { questionNumber: 1, answer: "São Paulo" },
      { questionNumber: 2, answer: "A" },
      { questionNumber: 3, answer: "3" },
    ], exercise[0].exerciseData);

    // Verificar que nenhuma resposta foi considerada correta
    expect(result.correctAnswers).toBe(0);
    expect(result.score).toBe(0);
    expect(result.pointsEarned).toBe(0);

    // Limpar
    await database.delete(studentExerciseAnswers).where(eq(studentExerciseAnswers.attemptId, attemptId));
    await database.delete(studentExerciseAttempts).where(eq(studentExerciseAttempts.id, attemptId));
  }, 30000); // Timeout de 30 segundos para geração de feedback com IA
});
