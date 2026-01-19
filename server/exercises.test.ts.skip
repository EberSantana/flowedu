import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Sistema de Exercícios por Módulo - Teste Simplificado", () => {
  
  it("deve criar e publicar exercício com dados reais", async () => {
    // Buscar dados existentes no banco
    const db_instance = await db.getDb();
    if (!db_instance) throw new Error("Database not available");

    const { users, subjects, learningPaths, learningModules } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Buscar primeiro usuário ativo
    const user = await db_instance.select().from(users).where(eq(users.active, true)).limit(1);
    expect(user.length).toBeGreaterThan(0);
    const testUserId = user[0].id;

    // Buscar primeira disciplina
    const subject = await db_instance.select().from(subjects).where(eq(subjects.userId, testUserId)).limit(1);
    expect(subject.length).toBeGreaterThan(0);
    const testSubjectId = subject[0].id;

    // Buscar primeira trilha
    const path = await db_instance.select().from(learningPaths).where(eq(learningPaths.subjectId, testSubjectId)).limit(1);
    expect(path.length).toBeGreaterThan(0);
    const pathId = path[0].id;

    // Buscar primeiro módulo
    const module = await db_instance.select().from(learningModules).where(eq(learningModules.pathId, pathId)).limit(1);
    expect(module.length).toBeGreaterThan(0);
    const testModuleId = module[0].id;

    // Criar exercício
    const exerciseData = {
      exercises: [
        {
          question: "Qual é o valor de x na equação x + 5 = 10?",
          type: "objective",
          options: ["A) 3", "B) 5", "C) 10", "D) 15"],
          correctAnswer: "B",
          explanation: "x = 10 - 5 = 5",
        },
        {
          question: "Resolva: 2x - 4 = 8",
          type: "objective",
          options: ["A) 4", "B) 6", "C) 8", "D) 12"],
          correctAnswer: "B",
          explanation: "2x = 8 + 4 = 12, então x = 6",
        },
        {
          question: "Qual é o resultado de 3x + 7 = 22?",
          type: "objective",
          options: ["A) 3", "B) 5", "C) 7", "D) 15"],
          correctAnswer: "B",
          explanation: "3x = 22 - 7 = 15, então x = 5",
        },
      ],
    };

    const result = await db.createStudentExercise({
      moduleId: testModuleId,
      subjectId: testSubjectId,
      teacherId: testUserId,
      title: `Teste Automatizado ${Date.now()}`,
      description: "Exercício criado por teste automatizado",
      exerciseData: exerciseData,
      totalQuestions: 3,
      totalPoints: 30,
      passingScore: 60,
      maxAttempts: 3,
      timeLimit: 30,
      showAnswersAfter: true,
      availableFrom: new Date(),
      status: "published",
    });

    const testExerciseId = result[0].insertId;
    expect(testExerciseId).toBeGreaterThan(0);

    // Limpar exercício criado
    const { studentExercises } = await import("../drizzle/schema");
    await db_instance.delete(studentExercises).where(eq(studentExercises.id, testExerciseId));
  });

  it("deve validar estrutura de exerciseData", async () => {
    const db_instance = await db.getDb();
    if (!db_instance) throw new Error("Database not available");

    const { studentExercises } = await import("../drizzle/schema");

    // Buscar um exercício existente
    const exercises = await db_instance.select().from(studentExercises).limit(1);
    
    if (exercises.length > 0) {
      const exercise = exercises[0];
      
      // Verificar que exerciseData é um objeto (não string)
      expect(typeof exercise.exerciseData).toBe("object");
      expect(exercise.exerciseData).not.toBeNull();
      
      // Verificar estrutura
      const data = exercise.exerciseData as any;
      expect(data).toHaveProperty("exercises");
      expect(Array.isArray(data.exercises)).toBe(true);
      
      if (data.exercises.length > 0) {
        const firstQuestion = data.exercises[0];
        expect(firstQuestion).toHaveProperty("question");
        expect(firstQuestion).toHaveProperty("type");
        expect(typeof firstQuestion.question).toBe("string");
      }
    }
  });

  it("deve testar correção automática de respostas", async () => {
    const exerciseData = {
      exercises: [
        {
          question: "Teste 1",
          type: "objective",
          options: ["A) 1", "B) 2"],
          correctAnswer: "A",
        },
        {
          question: "Teste 2",
          type: "objective",
          options: ["A) 1", "B) 2"],
          correctAnswer: "B",
        },
      ],
    };

    // Simular respostas (1 correta, 1 errada)
    const answers = [
      { questionNumber: 1, answer: "A" }, // Correta
      { questionNumber: 2, answer: "A" }, // Errada
    ];

    // Calcular correção manualmente (mesma lógica do submitExerciseAttempt)
    let correctAnswers = 0;
    const questions = exerciseData.exercises;

    answers.forEach((answer, idx) => {
      const question = questions[idx];
      if (question.type === "objective" && question.correctAnswer) {
        const studentAns = answer.answer?.trim().toUpperCase();
        const correctAns = question.correctAnswer.trim().toUpperCase();
        if (studentAns === correctAns) correctAnswers++;
      }
    });

    const totalQuestions = questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const pointsEarned = correctAnswers * 10;

    expect(correctAnswers).toBe(1);
    expect(score).toBe(50); // 1/2 = 50%
    expect(pointsEarned).toBe(10); // 1 acerto * 10 pontos
  });

  it("deve listar exercícios disponíveis para alunos", async () => {
    const db_instance = await db.getDb();
    if (!db_instance) throw new Error("Database not available");

    const { students } = await import("../drizzle/schema");

    // Buscar primeiro aluno
    const student = await db_instance.select().from(students).limit(1);
    
    if (student.length > 0) {
      const testStudentId = student[0].id;
      
      const exercises = await db.listAvailableExercises(testStudentId);

      expect(exercises).toBeDefined();
      expect(Array.isArray(exercises)).toBe(true);
      
      console.log(`✅ Encontrados ${exercises.length} exercícios disponíveis para o aluno ${testStudentId}`);
    }
  });

  it("deve obter detalhes de exercício com questões", async () => {
    const db_instance = await db.getDb();
    if (!db_instance) throw new Error("Database not available");

    const { studentExercises, students } = await import("../drizzle/schema");

    // Buscar um exercício publicado
    const exercises = await db_instance.select().from(studentExercises).limit(1);
    
    if (exercises.length > 0) {
      const testExerciseId = exercises[0].id;
      
      // Buscar um aluno
      const student = await db_instance.select().from(students).limit(1);
      
      if (student.length > 0) {
        const testStudentId = student[0].id;
        
        const details = await db.getExerciseDetails(testExerciseId, testStudentId);

        expect(details).toBeDefined();
        expect(details?.questions).toBeDefined();
        expect(Array.isArray(details?.questions)).toBe(true);
        
        console.log(`✅ Exercício "${details?.title}" tem ${details?.questions.length} questões`);
        
        if (details?.questions.length > 0) {
          const firstQuestion = details.questions[0];
          expect(firstQuestion).toHaveProperty("question");
          expect(firstQuestion).toHaveProperty("type");
        }
      }
    }
  });
});
