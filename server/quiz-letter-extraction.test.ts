import { describe, it, expect } from "vitest";

// Função de extração de letra (mesma lógica do db.ts)
const extractLetter = (text: string): string => {
  if (!text) return "";
  const match = text.match(/^([A-Za-z])\)/); // Captura "A)", "B)", "C)", etc.
  return match ? match[1].toUpperCase() : text.toUpperCase();
};

describe("Extração de Letra de Respostas", () => {
  it("deve extrair letra de resposta com formato 'C) Texto'", () => {
    expect(extractLetter("C) Disponibilidade")).toBe("C");
    expect(extractLetter("A) Primeira opção")).toBe("A");
    expect(extractLetter("B) Segunda opção")).toBe("B");
    expect(extractLetter("D) Quarta opção")).toBe("D");
  });

  it("deve retornar letra maiúscula quando resposta é apenas a letra", () => {
    expect(extractLetter("C")).toBe("C");
    expect(extractLetter("c")).toBe("C");
    expect(extractLetter("A")).toBe("A");
    expect(extractLetter("a")).toBe("A");
  });

  it("deve retornar string vazia para input vazio", () => {
    expect(extractLetter("")).toBe("");
    expect(extractLetter(null as any)).toBe("");
    expect(extractLetter(undefined as any)).toBe("");
  });

  it("deve comparar corretamente respostas do aluno com gabarito", () => {
    // Cenário real do bug: aluno responde "C) Disponibilidade", gabarito é "C"
    const studentAns = "C) Disponibilidade";
    const correctAns = "C";
    
    const studentLetter = extractLetter(studentAns);
    const correctLetter = extractLetter(correctAns);
    
    expect(studentLetter).toBe("C");
    expect(correctLetter).toBe("C");
    expect(studentLetter === correctLetter).toBe(true);
  });

  it("deve identificar respostas incorretas", () => {
    const studentAns = "C) Disponibilidade";
    const correctAns = "B";
    
    const studentLetter = extractLetter(studentAns);
    const correctLetter = extractLetter(correctAns);
    
    expect(studentLetter).toBe("C");
    expect(correctLetter).toBe("B");
    expect(studentLetter === correctLetter).toBe(false);
  });

  it("deve lidar com respostas em minúsculo", () => {
    const studentAns = "c) disponibilidade";
    const correctAns = "C";
    
    const studentLetter = extractLetter(studentAns);
    const correctLetter = extractLetter(correctAns);
    
    expect(studentLetter === correctLetter).toBe(true);
  });
});
