/**
 * Funções de gerenciamento de exercícios (editar e deletar)
 * Para ser importado em db.ts
 */

import { getDb } from "./db";
import { studentExercises } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Atualizar exercício existente
 */
export async function updateStudentExercise(
  exerciseId: number,
  teacherId: number,
  data: {
    title?: string;
    description?: string;
    exerciseData?: any;
    totalQuestions?: number;
    totalPoints?: number;
    passingScore?: number;
    exerciseType?: "multiple_choice" | "true_false" | "fill_blank" | "matching" | "ordering" | "essay" | "short_answer";
    difficulty?: "easy" | "medium" | "hard" | "expert";
    points?: number;
    timeLimit?: number | null;
    maxAttempts?: number;
    showAnswersAfter?: boolean;
    availableFrom?: Date | null;
    availableTo?: Date | null;
    isActive?: boolean;
    status?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se o exercício existe e pertence ao professor
  const [exercise] = await db
    .select()
    .from(studentExercises)
    .where(
      and(
        eq(studentExercises.id, exerciseId),
        eq(studentExercises.teacherId, teacherId)
      )
    );

  if (!exercise) {
    throw new Error("Exercício não encontrado ou você não tem permissão para editá-lo");
  }

  // Atualizar exercício
  await db
    .update(studentExercises)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(studentExercises.id, exerciseId));

  // Retornar exercício atualizado
  const [updated] = await db
    .select()
    .from(studentExercises)
    .where(eq(studentExercises.id, exerciseId));

  return updated;
}

/**
 * Deletar exercício
 */
export async function deleteStudentExercise(exerciseId: number, teacherId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se o exercício existe e pertence ao professor
  const [exercise] = await db
    .select()
    .from(studentExercises)
    .where(
      and(
        eq(studentExercises.id, exerciseId),
        eq(studentExercises.teacherId, teacherId)
      )
    );

  if (!exercise) {
    throw new Error("Exercício não encontrado ou você não tem permissão para excluí-lo");
  }

  // Deletar exercício (as tentativas e respostas serão deletadas em cascata se configurado)
  await db
    .delete(studentExercises)
    .where(eq(studentExercises.id, exerciseId));

  return { success: true, message: "Exercício excluído com sucesso" };
}

/**
 * Obter detalhes completos de um exercício para edição
 */
export async function getExerciseForEdit(exerciseId: number, teacherId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [exercise] = await db
    .select()
    .from(studentExercises)
    .where(
      and(
        eq(studentExercises.id, exerciseId),
        eq(studentExercises.teacherId, teacherId)
      )
    );

  if (!exercise) {
    throw new Error("Exercício não encontrado ou você não tem permissão para visualizá-lo");
  }

  return exercise;
}
