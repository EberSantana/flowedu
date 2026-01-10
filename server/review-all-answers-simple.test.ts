import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Revisão Inteligente - Teste Simplificado", () => {
  it("deve ter a função getAllAnswersForReview disponível", () => {
    expect(db.getAllAnswersForReview).toBeDefined();
    expect(typeof db.getAllAnswersForReview).toBe("function");
  });

  it("deve ter a função getWrongAnswers disponível (compatibilidade)", () => {
    expect(db.getWrongAnswers).toBeDefined();
    expect(typeof db.getWrongAnswers).toBe("function");
  });

  it("getAllAnswersForReview deve retornar um array", async () => {
    const result = await db.getAllAnswersForReview(99999, {}); // ID inexistente
    expect(Array.isArray(result)).toBe(true);
  });

  it("getAllAnswersForReview deve aceitar filtros opcionais", async () => {
    const result = await db.getAllAnswersForReview(99999, {
      subjectId: 1,
      moduleId: 1,
      questionType: "objective",
      limit: 10,
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("getWrongAnswers deve retornar um array (compatibilidade)", async () => {
    const result = await db.getWrongAnswers(99999, {}); // ID inexistente
    expect(Array.isArray(result)).toBe(true);
  });
});
