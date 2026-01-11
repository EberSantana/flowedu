import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Student Exercises by Module", () => {
  it("deve ter a função listExercisesByModule disponível", () => {
    expect(db.listExercisesByModule).toBeDefined();
    expect(typeof db.listExercisesByModule).toBe("function");
  });

  it("deve retornar array vazio quando aluno não tem matrículas", async () => {
    // Usar ID inexistente para simular aluno sem matrículas
    const exercises = await db.listExercisesByModule(999999, 1);
    expect(exercises).toBeDefined();
    expect(Array.isArray(exercises)).toBe(true);
    expect(exercises.length).toBe(0);
  });
});
