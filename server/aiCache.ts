/**
 * Sistema de Cache de Análises de IA
 * 
 * Este módulo fornece funções para armazenar e recuperar resultados de análises de IA,
 * evitando reprocessamento desnecessário e reduzindo custos com chamadas à API.
 */

import { getDb } from "./db";
import { aiAnalysisCache } from "../drizzle/schema";
import { eq, and, lt, sql } from "drizzle-orm";
import crypto from "crypto";

/**
 * Gera uma chave de cache única baseada no conteúdo de entrada
 * Usa SHA-256 para criar um hash consistente e único
 */
export function generateCacheKey(input: unknown): string {
  const inputString = JSON.stringify(input);
  return crypto.createHash("sha256").update(inputString).digest("hex");
}

/**
 * Interface para dados de entrada do cache
 */
export interface CacheInput {
  userId: number;
  analysisType: string;
  data: unknown;
  expiresInDays?: number; // Opcional: número de dias até expiração (null = sem expiração)
}

/**
 * Interface para resultado do cache
 */
export interface CacheResult<T = unknown> {
  found: boolean;
  data?: T | null;
  createdAt?: Date | null;
  hitCount?: number;
}

/**
 * Busca um resultado de análise no cache
 * 
 * @param userId - ID do usuário dono da análise
 * @param analysisType - Tipo de análise (ex: 'open_answer', 'learning_analysis')
 * @param inputData - Dados de entrada para gerar a chave de cache
 * @returns Resultado do cache com dados se encontrado
 */
export async function getCachedAnalysis<T = unknown>(
  userId: number,
  analysisType: string,
  inputData: unknown
): Promise<CacheResult<T>> {
  const cacheKey = generateCacheKey(inputData);

  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    // Busca no cache
    const cached = await db
      .select()
      .from(aiAnalysisCache)
      .where(
        and(
          eq(aiAnalysisCache.userId, userId),
          eq(aiAnalysisCache.analysisType, analysisType),
          eq(aiAnalysisCache.cacheKey, cacheKey)
        )
      )
      .limit(1);

    if (cached.length === 0) {
      return { found: false, data: null, createdAt: null, hitCount: 0 };
    }

    const entry = cached[0];

    // Verifica se o cache expirou
    if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
      // Cache expirado, remove da base
      const dbDelete = await getDb();
      if (!dbDelete) throw new Error("Database connection failed");
      await dbDelete
        .delete(aiAnalysisCache)
        .where(eq(aiAnalysisCache.id, entry.id));
      return { found: false, data: null, createdAt: null, hitCount: 0 };
    }

    // Atualiza contador de hits e última data de acesso
    const dbUpdate = await getDb();
    if (!dbUpdate) throw new Error("Database connection failed");
    await dbUpdate
      .update(aiAnalysisCache)
      .set({
        hitCount: entry.hitCount + 1,
        lastAccessedAt: new Date(),
      })
      .where(eq(aiAnalysisCache.id, entry.id));

    // Retorna dados do cache
    return {
      found: true,
      data: JSON.parse(entry.resultData) as T,
      createdAt: entry.createdAt,
      hitCount: entry.hitCount + 1,
    };
  } catch (error) {
    console.error("Erro ao buscar cache de análise:", error);
    return { found: false, data: null, createdAt: null, hitCount: 0 };
  }
}

/**
 * Armazena um resultado de análise no cache
 * 
 * @param input - Dados de entrada do cache
 * @param resultData - Resultado da análise a ser armazenado
 * @returns ID do registro de cache criado ou null em caso de erro
 */
export async function setCachedAnalysis(
  input: CacheInput,
  resultData: unknown
): Promise<number | null> {
  const cacheKey = generateCacheKey(input.data);

  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    // Calcula data de expiração se especificada
    let expiresAt: Date | null = null;
    if (input.expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);
    }

    // Insere ou atualiza o cache
    const result = await db.insert(aiAnalysisCache).values({
      userId: input.userId,
      analysisType: input.analysisType,
      cacheKey,
      inputData: JSON.stringify(input.data),
      resultData: JSON.stringify(resultData),
      expiresAt,
      hitCount: 0,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    });

    return result[0].insertId;
  } catch (error: any) {
    // Se for erro de duplicação (cache já existe), tenta atualizar
    if (error.code === "ER_DUP_ENTRY") {
      try {
        const dbUpdate = await getDb();
        if (!dbUpdate) throw new Error("Database connection failed");
        await dbUpdate
          .update(aiAnalysisCache)
          .set({
            resultData: JSON.stringify(resultData),
            expiresAt: input.expiresInDays
              ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
              : null,
            lastAccessedAt: new Date(),
          })
          .where(
            and(
              eq(aiAnalysisCache.userId, input.userId),
              eq(aiAnalysisCache.analysisType, input.analysisType),
              eq(aiAnalysisCache.cacheKey, cacheKey)
            )
          );
        return 0; // Retorna 0 para indicar atualização
      } catch (updateError) {
        console.error("Erro ao atualizar cache existente:", updateError);
        return null;
      }
    }

    console.error("Erro ao armazenar cache de análise:", error);
    return null;
  }
}

/**
 * Remove entradas de cache expiradas
 * Deve ser executado periodicamente para limpeza
 * 
 * @returns Número de entradas removidas
 */
export async function cleanExpiredCache(): Promise<number> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    const result = await db
      .delete(aiAnalysisCache)
      .where(
        and(
          lt(aiAnalysisCache.expiresAt, new Date()),
          sql`${aiAnalysisCache.expiresAt} IS NOT NULL`
        )
      );

    return result[0].affectedRows;
  } catch (error) {
    console.error("Erro ao limpar cache expirado:", error);
    return 0;
  }
}

/**
 * Remove todo o cache de um usuário específico
 * 
 * @param userId - ID do usuário
 * @returns Número de entradas removidas
 */
export async function clearUserCache(userId: number): Promise<number> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    const result = await db
      .delete(aiAnalysisCache)
      .where(eq(aiAnalysisCache.userId, userId));

    return result[0].affectedRows;
  } catch (error) {
    console.error("Erro ao limpar cache do usuário:", error);
    return 0;
  }
}

/**
 * Remove cache de um tipo específico de análise
 * 
 * @param userId - ID do usuário
 * @param analysisType - Tipo de análise
 * @returns Número de entradas removidas
 */
export async function clearAnalysisTypeCache(
  userId: number,
  analysisType: string
): Promise<number> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    const result = await db
      .delete(aiAnalysisCache)
      .where(
        and(
          eq(aiAnalysisCache.userId, userId),
          eq(aiAnalysisCache.analysisType, analysisType)
        )
      );

    return result[0].affectedRows;
  } catch (error) {
    console.error("Erro ao limpar cache por tipo:", error);
    return 0;
  }
}

/**
 * Obtém estatísticas do cache para um usuário
 * 
 * @param userId - ID do usuário
 * @returns Estatísticas do cache
 */
// Alias para compatibilidade com testes
export const invalidateCacheForUser = clearUserCache;

export async function getCacheStats(userId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    const stats = await db
      .select({
        analysisType: aiAnalysisCache.analysisType,
        count: sql<number>`COUNT(*)`,
        totalHits: sql<number>`SUM(${aiAnalysisCache.hitCount})`,
        avgHits: sql<number>`AVG(${aiAnalysisCache.hitCount})`,
      })
      .from(aiAnalysisCache)
      .where(eq(aiAnalysisCache.userId, userId))
      .groupBy(aiAnalysisCache.analysisType);

    return stats;
  } catch (error) {
    console.error("Erro ao obter estatísticas do cache:", error);
    return [];
  }
}
