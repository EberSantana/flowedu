/**
 * Testes para o sistema de cache de análises de IA
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  getCachedAnalysis,
  setCachedAnalysis,
  invalidateCacheForUser,
  cleanExpiredCache,
} from "./aiCache";
import { getDb } from "./db";
import { aiAnalysisCache } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Sistema de Cache de Análises de IA", () => {
  const testUserId = 999999; // ID de teste que não conflita com dados reais
  const testAnalysisType = "test_analysis";
  const testData = { question: "Teste", answer: "Resposta teste" };
  const testResult = { score: 95, feedback: "Excelente!" };

  beforeEach(async () => {
    // Limpar cache de teste antes de cada teste
    const db = await getDb();
    if (db) {
      await db
        .delete(aiAnalysisCache)
        .where(eq(aiAnalysisCache.userId, testUserId));
    }
  });

  it("deve armazenar e recuperar análise do cache", async () => {
    // Armazenar no cache
    await setCachedAnalysis(
      {
        userId: testUserId,
        analysisType: testAnalysisType,
        data: testData,
        expiresInDays: 30,
      },
      testResult
    );

    // Recuperar do cache
    const cached = await getCachedAnalysis(
      testUserId,
      testAnalysisType,
      testData
    );

    expect(cached.found).toBe(true);
    expect(cached.data).toEqual(testResult);
    expect(cached.hitCount).toBe(1);
  });

  it("deve incrementar hitCount a cada acesso", async () => {
    // Armazenar no cache
    await setCachedAnalysis(
      {
        userId: testUserId,
        analysisType: testAnalysisType,
        data: testData,
        expiresInDays: 30,
      },
      testResult
    );

    // Acessar múltiplas vezes
    await getCachedAnalysis(testUserId, testAnalysisType, testData);
    await getCachedAnalysis(testUserId, testAnalysisType, testData);
    const cached = await getCachedAnalysis(
      testUserId,
      testAnalysisType,
      testData
    );

    expect(cached.hitCount).toBe(3);
  });

  it("deve retornar found=false para cache não existente", async () => {
    const cached = await getCachedAnalysis(
      testUserId,
      "nonexistent_type",
      { some: "data" }
    );

    expect(cached.found).toBe(false);
    // data e hitCount podem ser null ou undefined quando não encontrado
    expect(cached.data == null).toBe(true);
    expect(cached.hitCount == null || cached.hitCount === 0).toBe(true);
  });

  it("deve invalidar cache do usuário", async () => {
    // Armazenar múltiplas análises
    await setCachedAnalysis(
      {
        userId: testUserId,
        analysisType: "type1",
        data: { test: 1 },
        expiresInDays: 30,
      },
      { result: 1 }
    );

    await setCachedAnalysis(
      {
        userId: testUserId,
        analysisType: "type2",
        data: { test: 2 },
        expiresInDays: 30,
      },
      { result: 2 }
    );

    // Invalidar cache
    const deleted = await invalidateCacheForUser(testUserId);
    expect(deleted).toBeGreaterThan(0);

    // Verificar que não há mais cache
    const cached1 = await getCachedAnalysis(testUserId, "type1", { test: 1 });
    const cached2 = await getCachedAnalysis(testUserId, "type2", { test: 2 });

    expect(cached1.found).toBe(false);
    expect(cached2.found).toBe(false);
  });

  it("deve executar limpeza de cache expirado sem erros", async () => {
    // Apenas verificar que a função executa sem erros
    const deleted = await cleanExpiredCache();
    expect(deleted).toBeGreaterThanOrEqual(0);
  });

  it("deve diferenciar análises com dados diferentes", async () => {
    const data1 = { question: "Q1", answer: "A1" };
    const data2 = { question: "Q2", answer: "A2" };
    const result1 = { score: 90 };
    const result2 = { score: 80 };

    // Armazenar duas análises diferentes
    await setCachedAnalysis(
      {
        userId: testUserId,
        analysisType: testAnalysisType,
        data: data1,
        expiresInDays: 30,
      },
      result1
    );

    await setCachedAnalysis(
      {
        userId: testUserId,
        analysisType: testAnalysisType,
        data: data2,
        expiresInDays: 30,
      },
      result2
    );

    // Recuperar análises
    const cached1 = await getCachedAnalysis(
      testUserId,
      testAnalysisType,
      data1
    );
    const cached2 = await getCachedAnalysis(
      testUserId,
      testAnalysisType,
      data2
    );

    expect(cached1.data).toEqual(result1);
    expect(cached2.data).toEqual(result2);
  });

  it("deve permitir armazenar múltiplas vezes sem erros", async () => {
    const result1 = { score: 90, feedback: "Bom" };
    const result2 = { score: 95, feedback: "Excelente" };

    // Armazenar primeira vez
    const id1 = await setCachedAnalysis(
      {
        userId: testUserId,
        analysisType: testAnalysisType,
        data: testData,
        expiresInDays: 30,
      },
      result1
    );
    expect(id1).toBeDefined();

    // Armazenar novamente não deve gerar erro
    const id2 = await setCachedAnalysis(
      {
        userId: testUserId,
        analysisType: testAnalysisType,
        data: testData,
        expiresInDays: 30,
      },
      result2
    );
    expect(id2).toBeDefined();
  });
});
