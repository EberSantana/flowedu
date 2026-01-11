import { describe, it, expect } from "vitest";
import * as db from "./db";
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";
import { appRouter } from "./routers";

describe("Student Exercises - Verificar problema de visualização", () => {
  it("deve verificar se há exercícios publicados no banco", async () => {
    const db_instance = await db.getDb();
    if (!db_instance) throw new Error("Database not available");

    const { studentExercises } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const exercises = await db_instance
      .select()
      .from(studentExercises)
      .where(eq(studentExercises.status, "published"));

    console.log(`\n📊 Total de exercícios publicados: ${exercises.length}`);
    
    if (exercises.length > 0) {
      console.log("\n📝 Exercícios publicados:");
      exercises.forEach((ex) => {
        console.log(`   - ${ex.title} (ID: ${ex.id}, Disciplina: ${ex.subjectId})`);
      });
    }

    expect(exercises.length).toBeGreaterThan(0);
  });

  it("deve verificar se há alunos matriculados", async () => {
    const db_instance = await db.getDb();
    if (!db_instance) throw new Error("Database not available");

    const { subjectEnrollments } = await import("../drizzle/schema");

    const enrollments = await db_instance
      .select()
      .from(subjectEnrollments);

    console.log(`\n📚 Total de matrículas: ${enrollments.length}`);
    
    if (enrollments.length > 0) {
      console.log("\n📝 Primeiras 5 matrículas:");
      enrollments.slice(0, 5).forEach((enroll) => {
        console.log(`   - Aluno: ${enroll.studentId}, Disciplina: ${enroll.subjectId}`);
      });
    }

    expect(enrollments.length).toBeGreaterThan(0);
  });

  it("deve testar função listAvailableExercises com aluno real", async () => {
    // Usar studentId 60051 que sabemos que existe e está matriculado
    const studentId = 60051;
    
    console.log(`\n🔍 Testando listAvailableExercises para aluno ${studentId}...`);
    
    const exercises = await db.listAvailableExercises(studentId);

    console.log(`\n✅ Exercícios retornados: ${exercises.length}`);
    
    if (exercises.length > 0) {
      console.log("\n📝 Exercícios disponíveis:");
      exercises.forEach((ex) => {
        console.log(`   - ${ex.title} (ID: ${ex.id})`);
      });
    } else {
      console.log("\n⚠️  PROBLEMA: Nenhum exercício retornado!");
      console.log("   Isso explica por que o Portal do Aluno está vazio.");
    }

    expect(exercises).toBeDefined();
    expect(Array.isArray(exercises)).toBe(true);
  });

  it("deve testar rota tRPC studentExercises.listAvailable", async () => {
    // Criar token JWT para o aluno 60051
    const studentId = 60051;
    const studentToken = jwt.sign(
      {
        userType: "student",
        studentId: studentId,
        registrationNumber: "2023327800",
        fullName: "Aluno Teste",
        professorId: 1,
      },
      ENV.cookieSecret,
      { expiresIn: "7d" }
    );

    // Criar contexto mockado
    const mockContext = {
      req: {
        headers: {
          cookie: `app_session_id=${studentToken}`,
        },
      } as any,
      res: {} as any,
      user: null,
      studentSession: {
        userType: "student" as const,
        studentId: studentId,
        registrationNumber: "2023327800",
        fullName: "Aluno Teste",
        professorId: 1,
      },
      userType: "student" as const,
    };

    // Criar caller
    const caller = appRouter.createCaller(mockContext);

    console.log(`\n🔍 Chamando rota tRPC studentExercises.listAvailable...`);

    try {
      const exercises = await caller.studentExercises.listAvailable({
        subjectId: undefined,
      });

      console.log(`\n✅ Rota tRPC retornou: ${exercises.length} exercícios`);
      
      if (exercises.length > 0) {
        console.log("\n📝 Exercícios:");
        exercises.forEach((ex) => {
          console.log(`   - ${ex.title} (ID: ${ex.id})`);
        });
      } else {
        console.log("\n⚠️  PROBLEMA: Rota tRPC retornou array vazio!");
      }

      expect(exercises).toBeDefined();
      expect(Array.isArray(exercises)).toBe(true);
    } catch (error) {
      console.error("\n❌ Erro ao chamar rota tRPC:", error);
      throw error;
    }
  });
});
