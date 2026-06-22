import { describe, it, expect } from "vitest";

/**
 * Teste para validar se a chave Groq API é válida
 */
describe("Groq API Key Validation", () => {
  it("should validate Groq API key by making a test request", async () => {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error("GROQ_API_KEY não configurada");
    }

    try {
      const response = await fetch("https://api.groq.com/openai/v1/models", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        throw new Error("Chave Groq inválida (401 Unauthorized)");
      }

      if (!response.ok) {
        throw new Error(`Erro ao validar Groq: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data).toBeDefined();
      
      console.log("✅ Chave Groq validada com sucesso");
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Falha na validação Groq: ${error.message}`);
      }
      throw error;
    }
  });
});
