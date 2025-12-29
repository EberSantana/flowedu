/**
 * Funções de banco de dados para revisão de respostas abertas
 */

import { eq, and, isNull, desc } from "drizzle-orm";
import { getDb } from "./db";
import { studentExerciseAnswers, studentExercises, studentExerciseAttempts, users } from "../drizzle/schema";

/**
 * Buscar respostas que precisam de revisão manual
 */
export async function getPendingReviewAnswers(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db
    .select({
      id: studentExerciseAnswers.id,
      attemptId: studentExerciseAnswers.attemptId,
      questionNumber: studentExerciseAnswers.questionNumber,
      questionType: studentExerciseAnswers.questionType,
      studentAnswer: studentExerciseAnswers.studentAnswer,
      correctAnswer: studentExerciseAnswers.correctAnswer,
      aiScore: studentExerciseAnswers.aiScore,
      aiConfidence: studentExerciseAnswers.aiConfidence,
      aiAnalysis: studentExerciseAnswers.aiAnalysis,
      aiFeedback: studentExerciseAnswers.aiFeedback,
      needsReview: studentExerciseAnswers.needsReview,
      createdAt: studentExerciseAnswers.createdAt,
      // Dados do exercício
      exerciseId: studentExercises.id,
      exerciseTitle: studentExercises.title,
      // Dados do aluno
      studentName: users.name,
      studentEmail: users.email,
    })
    .from(studentExerciseAnswers)
    .innerJoin(
      studentExerciseAttempts,
      eq(studentExerciseAnswers.attemptId, studentExerciseAttempts.id)
    )
    .innerJoin(
      studentExercises,
      eq(studentExerciseAttempts.exerciseId, studentExercises.id)
    )
    .innerJoin(users, eq(studentExercises.teacherId, users.id))
    .where(
      and(
        eq(studentExerciseAnswers.needsReview, true),
        isNull(studentExerciseAnswers.reviewedBy),
        eq(studentExercises.teacherId, userId) // Apenas exercícios do professor
      )
    )
    .orderBy(desc(studentExerciseAnswers.createdAt));

  return results;
}

/**
 * Revisar e ajustar nota de uma resposta aberta
 */
export async function reviewAnswer(
  answerId: number,
  reviewerId: number,
  finalScore: number,
  teacherFeedback?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validar score
  if (finalScore < 0 || finalScore > 100) {
    throw new Error("Score must be between 0 and 100");
  }

  await db
    .update(studentExerciseAnswers)
    .set({
      finalScore,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      teacherFeedback: teacherFeedback || null,
      needsReview: false, // Marcar como revisado
    })
    .where(eq(studentExerciseAnswers.id, answerId));

  return { success: true };
}

/**
 * Buscar detalhes de uma resposta específica
 */
export async function getAnswerDetails(answerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(studentExerciseAnswers)
    .where(eq(studentExerciseAnswers.id, answerId))
    .limit(1);

  return result[0] || null;
}

/**
 * Contar respostas pendentes de revisão para um professor
 */
export async function countPendingReviews(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db
    .select({
      count: studentExerciseAnswers.id,
    })
    .from(studentExerciseAnswers)
    .innerJoin(
      studentExerciseAttempts,
      eq(studentExerciseAnswers.attemptId, studentExerciseAttempts.id)
    )
    .innerJoin(
      studentExercises,
      eq(studentExerciseAttempts.exerciseId, studentExercises.id)
    )
    .where(
      and(
        eq(studentExerciseAnswers.needsReview, true),
        isNull(studentExerciseAnswers.reviewedBy),
        eq(studentExercises.teacherId, userId)
      )
    );

  return results.length;
}
