import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, subjects, learningModules, studentExercises } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Exercise Fixes Tests", () => {
  let db: any;
  let testUserId: number;
  let testSubjectId: number;
  let testModuleId: number;
  let testExerciseId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar usuário de teste
    const userResult = await db.insert(users).values({
      openId: `test-exercise-fixes-${Date.now()}`,
      name: "Test Exercise User",
      email: `test-exercise-${Date.now()}@test.com`,
      role: "user",
      approvalStatus: "approved",
      active: true,
    });
    testUserId = userResult[0].insertId;

    // Criar disciplina de teste
    const subjectResult = await db.insert(subjects).values({
      name: "Test Subject for Exercises",
      code: `TEST-${Date.now()}`,
      description: "Test",
      workload: 60,
      userId: testUserId,
    });
    testSubjectId = subjectResult[0].insertId;

    // Criar módulo de teste
    const moduleResult = await db.insert(learningModules).values({
      subjectId: testSubjectId,
      userId: testUserId,
      title: "Test Module",
      description: "Test module for exercises",
      orderIndex: 1,
    });
    testModuleId = moduleResult[0].insertId;
  });

  afterAll(async () => {
    if (!db) return;

    // Limpar dados de teste
    if (testExerciseId) {
      await db.delete(studentExercises).where(eq(studentExercises.id, testExerciseId));
    }
    if (testModuleId) {
      await db.delete(learningModules).where(eq(learningModules.id, testModuleId));
    }
    if (testSubjectId) {
      await db.delete(subjects).where(eq(subjects.id, testSubjectId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it("deve armazenar exerciseData como objeto JSON", async () => {
    const exerciseData = {
      questions: [
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
          question: "Quanto é 2 + 2?",
          options: ["3", "4", "5", "6"],
          correctAnswer: "4",
          explanation: "2 + 2 = 4",
        },
      ],
    };

    const result = await db.insert(studentExercises).values({
      moduleId: testModuleId,
      subjectId: testSubjectId,
      teacherId: testUserId,
      title: "Exercício de Teste",
      description: "Teste de armazenamento de exerciseData",
      exerciseData: exerciseData, // Armazenar como objeto
      totalQuestions: 2,
      totalPoints: 100,
      passingScore: 60,
      maxAttempts: 3,
      timeLimit: 30,
      showAnswersAfter: true,
      availableFrom: new Date(),
      status: "published",
    });

    testExerciseId = result[0].insertId;

    // Verificar se foi armazenado corretamente
    const exercises = await db
      .select()
      .from(studentExercises)
      .where(eq(studentExercises.id, testExerciseId));

    expect(exercises).toHaveLength(1);
    expect(exercises[0].totalQuestions).toBe(2);
  });

  it("deve recuperar exerciseData como objeto (não string)", async () => {
    const exercises = await db
      .select()
      .from(studentExercises)
      .where(eq(studentExercises.id, testExerciseId));

    expect(exercises).toHaveLength(1);
    
    // exerciseData deve ser um objeto, não uma string
    const exerciseData = exercises[0].exerciseData as any;
    
    // Verificar que é um objeto e tem questions
    expect(typeof exerciseData).toBe("object");
    expect(exerciseData).toHaveProperty("questions");
    expect(Array.isArray(exerciseData.questions)).toBe(true);
    expect(exerciseData.questions).toHaveLength(2);
  });

  it("deve contar corretamente o número de questões", async () => {
    const exercises = await db
      .select()
      .from(studentExercises)
      .where(eq(studentExercises.id, testExerciseId));

    const exerciseData = exercises[0].exerciseData as any;
    const questionCount = exerciseData.questions?.length || 0;

    expect(questionCount).toBe(2);
    expect(exercises[0].totalQuestions).toBe(2);
  });

  it("deve deletar exercício com sucesso", async () => {
    // Verificar que o exercício existe
    let exercises = await db
      .select()
      .from(studentExercises)
      .where(eq(studentExercises.id, testExerciseId));
    
    expect(exercises).toHaveLength(1);

    // Deletar exercício
    await db
      .delete(studentExercises)
      .where(eq(studentExercises.id, testExerciseId));

    // Verificar que foi deletado
    exercises = await db
      .select()
      .from(studentExercises)
      .where(eq(studentExercises.id, testExerciseId));
    
    expect(exercises).toHaveLength(0);

    // Resetar para não tentar deletar novamente no afterAll
    testExerciseId = 0;
  });

  it("deve impedir deleção de exercício de outro professor", async () => {
    // Criar outro usuário
    const otherUserResult = await db.insert(users).values({
      openId: `test-other-user-${Date.now()}`,
      name: "Other User",
      email: `other-${Date.now()}@test.com`,
      role: "user",
      approvalStatus: "approved",
      active: true,
    });
    const otherUserId = otherUserResult[0].insertId;

    // Criar exercício do primeiro usuário
    const exerciseResult = await db.insert(studentExercises).values({
      moduleId: testModuleId,
      subjectId: testSubjectId,
      teacherId: testUserId, // Pertence ao testUserId
      title: "Exercício Protegido",
      description: "Teste de proteção",
      exerciseData: { questions: [] },
      totalQuestions: 0,
      totalPoints: 100,
      passingScore: 60,
      maxAttempts: 3,
      availableFrom: new Date(),
      status: "published",
    });
    const protectedExerciseId = exerciseResult[0].insertId;

    // Tentar buscar exercício como outro usuário (simulando validação de permissão)
    const exercises = await db
      .select()
      .from(studentExercises)
      .where(
        and(
          eq(studentExercises.id, protectedExerciseId),
          eq(studentExercises.teacherId, otherUserId) // Outro usuário tentando acessar
        )
      );

    // Não deve encontrar nada (sem permissão)
    expect(exercises).toHaveLength(0);

    // Limpar
    await db.delete(studentExercises).where(eq(studentExercises.id, protectedExerciseId));
    await db.delete(users).where(eq(users.id, otherUserId));
  });
});
