/**
 * Utilitário centralizado para tratamento de erros
 * Garante consistência e logging adequado em toda a aplicação
 */

import { TRPCError } from "@trpc/server";

/**
 * Códigos de erro padronizados
 */
export const ErrorCodes = {
  // Erros de autenticação
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Erros de validação
  BAD_REQUEST: 'BAD_REQUEST',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  
  // Erros de servidor
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

/**
 * Mensagens de erro amigáveis para o usuário
 */
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Você precisa estar autenticado para realizar esta ação.',
  FORBIDDEN: 'Você não tem permissão para realizar esta ação.',
  NOT_FOUND: 'O recurso solicitado não foi encontrado.',
  CONFLICT: 'Esta operação conflita com dados existentes.',
  INTERNAL_SERVER_ERROR: 'Ocorreu um erro interno. Por favor, tente novamente.',
  SERVICE_UNAVAILABLE: 'O serviço está temporariamente indisponível. Tente novamente em alguns instantes.',
} as const;

/**
 * Interface para contexto adicional do erro
 */
interface ErrorContext {
  userId?: number;
  operation?: string;
  resource?: string;
  details?: Record<string, any>;
}

/**
 * Cria um erro TRPC padronizado com logging
 */
export function createError(
  code: keyof typeof ErrorCodes,
  message?: string,
  context?: ErrorContext
): TRPCError {
  // Log estruturado do erro
  console.error('[Error]', {
    code,
    message: message || ERROR_MESSAGES[code],
    context,
    timestamp: new Date().toISOString(),
  });

  return new TRPCError({
    code,
    message: message || ERROR_MESSAGES[code],
  });
}

/**
 * Wrapper para operações assíncronas com tratamento de erro automático
 */
export async function handleAsync<T>(
  operation: () => Promise<T>,
  context?: ErrorContext
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // Se já é um TRPCError, apenas re-lança
    if (error instanceof TRPCError) {
      throw error;
    }

    // Log do erro original
    console.error('[Unexpected Error]', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString(),
    });

    // Lança erro genérico para o usuário
    throw createError(
      'INTERNAL_SERVER_ERROR',
      'Ocorreu um erro inesperado. Por favor, tente novamente.',
      context
    );
  }
}

/**
 * Valida se o usuário tem permissão sobre um recurso
 */
export function validateOwnership(
  resourceOwnerId: number,
  currentUserId: number,
  resourceName: string = 'recurso'
): void {
  if (resourceOwnerId !== currentUserId) {
    throw createError(
      'FORBIDDEN',
      `Você não tem permissão para acessar este ${resourceName}.`,
      {
        userId: currentUserId,
        resource: resourceName,
      }
    );
  }
}

/**
 * Valida se um recurso existe
 */
export function validateExists<T>(
  resource: T | null | undefined,
  resourceName: string = 'recurso'
): asserts resource is T {
  if (!resource) {
    throw createError(
      'NOT_FOUND',
      `${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)} não encontrado(a).`,
      {
        resource: resourceName,
      }
    );
  }
}

/**
 * Wrapper para operações de IA com fallback
 */
export async function handleAIOperation<T>(
  operation: () => Promise<T>,
  fallback: T,
  context?: ErrorContext
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('[AI Operation Failed]', {
      error: error instanceof Error ? error.message : String(error),
      context,
      timestamp: new Date().toISOString(),
    });

    // Retorna fallback ao invés de falhar
    return fallback;
  }
}

/**
 * Valida entrada do usuário
 */
export function validateInput(
  condition: boolean,
  message: string,
  context?: ErrorContext
): void {
  if (!condition) {
    throw createError('BAD_REQUEST', message, context);
  }
}

/**
 * Wrapper para operações em lote com tratamento individual de erros
 */
export async function handleBatch<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  context?: ErrorContext
): Promise<{ results: R[]; errors: Array<{ item: T; error: string }> }> {
  const results: R[] = [];
  const errors: Array<{ item: T; error: string }> = [];

  for (const item of items) {
    try {
      const result = await operation(item);
      results.push(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({ item, error: errorMessage });

      console.error('[Batch Operation Error]', {
        item,
        error: errorMessage,
        context,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return { results, errors };
}

/**
 * Tipo helper para extrair tipo de retorno de operações assíncronas
 */
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = 
  T extends (...args: any) => Promise<infer R> ? R : never;
