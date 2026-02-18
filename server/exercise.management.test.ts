/**
 * Testes para gerenciamento de exercícios (editar e deletar)
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import { getDb } from "./db";
import { studentExercises } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Gerenciamento de Exercícios", () => {
  let testExerciseId: number;
  const testTeacherId = 1; // ID do professor de teste
  const testSubjectId = 1; // ID da disciplina de teste

  beforeAll(async () => {
    // Criar um exercício de teste
    const result = await db.createStudentExercise({
      moduleId: null,
      subjectId: testSubjectId,
      teacherId: testTeacherId,
      title: "Exercício de Teste para Gerenciamento",
      description: "Descrição inicial do exercício",
      exerciseData: JSON.stringify([
        {
          number: 1,
          question: "Qual é a capital do Brasil?",
          options: ["A) São Paulo", "B) Rio de Janeiro", "C) Brasília", "D) Salvador"],
          correctAnswer: "C",
        },
      ]),
      totalQuestions: 1,
      totalPoints: 10,
      passingScore: 60,
      maxAttempts: 3,
      timeLimit: 30,
      showAnswersAfter: true,
      availableFrom: new Date(),
      status: "published",
    });

    testExerciseId = result[0].insertId;
  });

  describe("updateStudentExercise", () => {
    it("deve atualizar título e descrição do exercício", async () => {
      const updated = await db.updateStudentExercise(testExerciseId, testTeacherId, {
        title: "Exercício Atualizado",
        description: "Nova descrição do exercício",
      });

      expect(updated).toBeDefined();
      expect(updated.title).toBe("Exercício Atualizado");
      expect(updated.description).toBe("Nova descrição do exercício");
    });

    it("deve atualizar configurações do exercício (nota mínima, tentativas, tempo)", async () => {
      const updated = await db.updateStudentExercise(testExerciseId, testTeacherId, {
        passingScore: 70,
        maxAttempts: 5,
        timeLimit: 45,
      });

      expect(updated).toBeDefined();
      expect(updated.passingScore).toBe(70);
      expect(updated.maxAttempts).toBe(5);
      expect(updated.timeLimit).toBe(45);
    });

    it("deve permitir remover tempo limite (null)", async () => {
      const updated = await db.updateStudentExercise(testExerciseId, testTeacherId, {
        timeLimit: null,
      });

      expect(updated).toBeDefined();
      expect(updated.timeLimit).toBeNull();
    });

    it("deve lançar erro ao tentar atualizar exercício de outro professor", async () => {
      const wrongTeacherId = 9999;
      
      await expect(
        db.updateStudentExercise(testExerciseId, wrongTeacherId, {
          title: "Tentativa de Hack",
        })
      ).rejects.toThrow("Exercício não encontrado ou você não tem permissão para editá-lo");
    });

    it("deve lançar erro ao tentar atualizar exercício inexistente", async () => {
      const fakeExerciseId = 999999;
      
      await expect(
        db.updateStudentExercise(fakeExerciseId, testTeacherId, {
          title: "Exercício Fantasma",
        })
      ).rejects.toThrow("Exercício não encontrado ou você não tem permissão para editá-lo");
    });
  });

  describe("getExerciseForEdit", () => {
    it("deve retornar exercício completo para edição", async () => {
      const exercise = await db.getExerciseForEdit(testExerciseId, testTeacherId);

      expect(exercise).toBeDefined();
      expect(exercise.id).toBe(testExerciseId);
      expect(exercise.teacherId).toBe(testTeacherId);
      expect(exercise.title).toBeDefined();
      expect(exercise.description).toBeDefined();
      expect(exercise.exerciseData).toBeDefined();
    });

    it("deve lançar erro ao tentar obter exercício de outro professor", async () => {
      const wrongTeacherId = 9999;
      
      await expect(
        db.getExerciseForEdit(testExerciseId, wrongTeacherId)
      ).rejects.toThrow("Exercício não encontrado ou você não tem permissão para visualizá-lo");
    });
  });

  describe("deleteStudentExercise", () => {
    it("deve deletar exercício com sucesso", async () => {
      // Criar um novo exercício para deletar
      const result = await db.createStudentExercise({
        moduleId: null,
        subjectId: testSubjectId,
        teacherId: testTeacherId,
        title: "Exercício para Deletar",
        description: "Este exercício será deletado",
        exerciseData: JSON.stringify([]),
        totalQuestions: 0,
        totalPoints: 0,
        availableFrom: new Date(),
        status: "draft",
      });

      const exerciseToDeleteId = result[0].insertId;

      // Deletar o exercício
      const deleteResult = await db.deleteStudentExercise(exerciseToDeleteId, testTeacherId);

      expect(deleteResult).toBeDefined();
      expect(deleteResult.success).toBe(true);
      expect(deleteResult.message).toBe("Exercício excluído com sucesso");

      // Verificar que o exercício foi realmente deletado
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      const [deletedExercise] = await dbInstance
        .select()
        .from(studentExercises)
        .where(eq(studentExercises.id, exerciseToDeleteId));

      expect(deletedExercise).toBeUndefined();
    });

    it("deve lançar erro ao tentar deletar exercício de outro professor", async () => {
      const wrongTeacherId = 9999;
      
      await expect(
        db.deleteStudentExercise(testExerciseId, wrongTeacherId)
      ).rejects.toThrow("Exercício não encontrado ou você não tem permissão para excluí-lo");
    });

    it("deve lançar erro ao tentar deletar exercício inexistente", async () => {
      const fakeExerciseId = 999999;
      
      await expect(
        db.deleteStudentExercise(fakeExerciseId, testTeacherId)
      ).rejects.toThrow("Exercício não encontrado ou você não tem permissão para excluí-lo");
    });
  });
});
