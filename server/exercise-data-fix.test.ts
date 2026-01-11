import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';
import { getDb } from './db';
import { users, subjects, learningModules, studentExercises, studentExerciseAttempts } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Correção do Bug de exerciseData', () => {
  let testUserId: number;
  let testSubjectId: number;
  let testModuleId: number;
  let testExerciseId: number;

  beforeAll(async () => {
    const database = await getDb();
    if (!database) throw new Error('Database not available');

    // Criar usuário de teste
    const userResult = await database.insert(users).values({
      openId: `test-exercise-fix-${Date.now()}`,
      name: 'Professor Teste',
      email: `test-fix-${Date.now()}@example.com`,
      role: 'user',
      active: true,
      approvalStatus: 'approved',
    });
    testUserId = Number(userResult[0].insertId);

    // Criar disciplina de teste
    const subjectResult = await database.insert(subjects).values({
      userId: testUserId,
      name: 'Disciplina Teste',
      code: 'TEST-001',
      workload: 60,
    });
    testSubjectId = Number(subjectResult[0].insertId);

    // Criar módulo de teste
    const moduleResult = await database.insert(learningModules).values({
      subjectId: testSubjectId,
      userId: testUserId,
      title: 'Módulo Teste',
      description: 'Módulo para testar exercícios',
      orderIndex: 1,
    });
    testModuleId = Number(moduleResult[0].insertId);
  });

  afterAll(async () => {
    const database = await getDb();
    if (!database) return;

    // Limpar dados de teste
    if (testExerciseId) {
      await database.delete(studentExercises).where(eq(studentExercises.id, testExerciseId));
    }
    if (testModuleId) {
      await database.delete(learningModules).where(eq(learningModules.id, testModuleId));
    }
    if (testSubjectId) {
      await database.delete(subjects).where(eq(subjects.id, testSubjectId));
    }
    if (testUserId) {
      await database.delete(users).where(eq(users.id, testUserId));
    }
  });

  it('deve armazenar exerciseData com estrutura "exercises" (não "questions")', async () => {
    const exerciseData = {
      moduleTitle: "Módulo Teste",
      exercises: [
        {
          number: 1,
          type: "objective",
          question: "Qual é a capital do Brasil?",
          options: ["A) São Paulo", "B) Rio de Janeiro", "C) Brasília", "D) Salvador"],
          correctAnswer: "C) Brasília",
          explanation: "Brasília é a capital federal do Brasil desde 1960."
        },
        {
          number: 2,
          type: "subjective",
          question: "Explique o conceito de democracia.",
          correctAnswer: "Democracia é um sistema de governo onde o poder é exercido pelo povo.",
          explanation: "A democracia permite a participação popular nas decisões políticas."
        }
      ]
    };

    const result = await db.createStudentExercise({
      teacherId: testUserId,
      subjectId: testSubjectId,
      moduleId: testModuleId,
      title: "Exercício de Teste - Estrutura Correta",
      description: "Teste de armazenamento com estrutura 'exercises'",
      exerciseData: exerciseData,
      totalQuestions: 2,
      totalPoints: 100,
      passingScore: 60,
      maxAttempts: 3,
      status: "published",
      availableFrom: new Date(),
    });

    testExerciseId = Number(result[0].insertId);
    expect(testExerciseId).toBeGreaterThan(0);
  });

  it('deve recuperar exerciseData.exercises corretamente (não .questions)', async () => {
    const database = await getDb();
    if (!database) throw new Error('Database not available');

    const exercises = await database
      .select()
      .from(studentExercises)
      .where(eq(studentExercises.id, testExerciseId));

    expect(exercises).toHaveLength(1);
    
    const exerciseData = exercises[0].exerciseData as any;
    
    // Verificar que é um objeto e tem "exercises" (não "questions")
    expect(typeof exerciseData).toBe("object");
    expect(exerciseData).toHaveProperty("exercises");
    expect(exerciseData).toHaveProperty("moduleTitle");
    expect(Array.isArray(exerciseData.exercises)).toBe(true);
    expect(exerciseData.exercises).toHaveLength(2);
    
    // Verificar estrutura das questões
    const firstExercise = exerciseData.exercises[0];
    expect(firstExercise).toHaveProperty("number");
    expect(firstExercise).toHaveProperty("type");
    expect(firstExercise).toHaveProperty("question");
    expect(firstExercise).toHaveProperty("correctAnswer");
    expect(firstExercise).toHaveProperty("explanation");
  });

  it('getExerciseDetails deve retornar questions preenchido com exerciseData.exercises', async () => {
    // Criar um aluno para testar
    const database = await getDb();
    if (!database) throw new Error('Database not available');

    const studentResult = await database.insert(users).values({
      openId: `test-student-${Date.now()}`,
      name: 'Aluno Teste',
      email: `student-${Date.now()}@example.com`,
      role: 'user',
      active: true,
      approvalStatus: 'approved',
    });
    const studentId = Number(studentResult[0].insertId);

    // Buscar detalhes do exercício
    const details = await db.getExerciseDetails(testExerciseId, studentId);

    // Verificar que questions está preenchido
    expect(details).toHaveProperty("questions");
    expect(Array.isArray(details.questions)).toBe(true);
    expect(details.questions).toHaveLength(2);
    
    // Verificar que não está vazio (bug corrigido)
    expect(details.questions.length).toBeGreaterThan(0);
    
    // Verificar estrutura da primeira questão
    const firstQuestion = details.questions[0];
    expect(firstQuestion).toHaveProperty("number");
    expect(firstQuestion).toHaveProperty("type");
    expect(firstQuestion).toHaveProperty("question");
    expect(firstQuestion.question).toBe("Qual é a capital do Brasil?");

    // Limpar aluno de teste
    await database.delete(users).where(eq(users.id, studentId));
  });

  it('submitExerciseAttempt deve usar exerciseData.exercises para correção', async () => {
    const database = await getDb();
    if (!database) throw new Error('Database not available');

    // Criar aluno
    const studentResult = await database.insert(users).values({
      openId: `test-student-submit-${Date.now()}`,
      name: 'Aluno Teste Submit',
      email: `student-submit-${Date.now()}@example.com`,
      role: 'user',
      active: true,
      approvalStatus: 'approved',
    });
    const studentId = Number(studentResult[0].insertId);

    // Criar tentativa
    const attemptResult = await database.insert(studentExerciseAttempts).values({
      exerciseId: testExerciseId,
      studentId: studentId,
      attemptNumber: 1,
      answers: JSON.stringify([]),
      score: 0,
      correctAnswers: 0,
      totalQuestions: 2,
      pointsEarned: 0,
      timeSpent: 0,
      status: "in_progress",
      startedAt: new Date(),
    });
    const attemptId = Number(attemptResult[0].insertId);

    // Buscar exercício para pegar exerciseData
    const exercises = await database
      .select()
      .from(studentExercises)
      .where(eq(studentExercises.id, testExerciseId));

    const exerciseData = exercises[0].exerciseData;

    // Submeter respostas
    const answers = [
      { answer: "C) Brasília" }, // Correta
      { answer: "Democracia é um sistema onde o povo governa" }, // Subjetiva
    ];

    await db.submitExerciseAttempt(attemptId, answers, exerciseData);

    // Verificar que a tentativa foi atualizada
    const updatedAttempt = await database
      .select()
      .from(studentExerciseAttempts)
      .where(eq(studentExerciseAttempts.id, attemptId));

    expect(updatedAttempt[0].status).toBe("completed");
    expect(updatedAttempt[0].score).toBeGreaterThan(0);
    expect(updatedAttempt[0].correctAnswers).toBe(1); // Apenas a objetiva é corrigida automaticamente

    // Limpar dados
    await database.delete(studentExerciseAttempts).where(eq(studentExerciseAttempts.id, attemptId));
    await database.delete(users).where(eq(users.id, studentId));
  });

  it('deve contar questões corretamente a partir de exerciseData.exercises', async () => {
    const database = await getDb();
    if (!database) throw new Error('Database not available');

    const exercises = await database
      .select()
      .from(studentExercises)
      .where(eq(studentExercises.id, testExerciseId));

    const exerciseData = exercises[0].exerciseData as any;
    const questionCount = exerciseData.exercises?.length || 0;

    expect(questionCount).toBe(2);
    expect(questionCount).toBeGreaterThan(0); // Bug corrigido: não deve ser 0
  });
});
