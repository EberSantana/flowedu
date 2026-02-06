/**
 * Hook para tratamento padronizado de erros no frontend
 */

import { useToast } from "@/hooks/use-toast";
import { TRPCClientError } from "@trpc/client";
import { useCallback } from "react";

/**
 * Mensagens de erro amigáveis baseadas no código HTTP
 */
const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Você precisa estar autenticado para realizar esta ação.",
  FORBIDDEN: "Você não tem permissão para realizar esta ação.",
  NOT_FOUND: "O recurso solicitado não foi encontrado.",
  BAD_REQUEST: "Os dados fornecidos são inválidos.",
  CONFLICT: "Esta operação conflita com dados existentes.",
  INTERNAL_SERVER_ERROR: "Ocorreu um erro interno. Por favor, tente novamente.",
  SERVICE_UNAVAILABLE: "O serviço está temporariamente indisponível.",
  TIMEOUT: "A operação demorou muito tempo. Por favor, tente novamente.",
};

/**
 * Opções para o tratamento de erro
 */
interface ErrorHandlerOptions {
  /** Mensagem customizada para exibir ao usuário */
  customMessage?: string;
  /** Se deve mostrar toast de erro */
  showToast?: boolean;
  /** Callback adicional para executar após o erro */
  onError?: (error: Error) => void;
  /** Se deve fazer log do erro no console */
  logError?: boolean;
}

/**
 * Hook para tratamento padronizado de erros
 */
export function useErrorHandler() {
  const { toast } = useToast();

  /**
   * Extrai mensagem de erro amigável
   */
  const getErrorMessage = useCallback((error: unknown): string => {
    // Erro do tRPC
    if (error instanceof TRPCClientError) {
      const code = error.data?.code;
      return ERROR_MESSAGES[code] || error.message;
    }

    // Erro padrão do JavaScript
    if (error instanceof Error) {
      return error.message;
    }

    // Erro desconhecido
    return "Ocorreu um erro inesperado. Por favor, tente novamente.";
  }, []);

  /**
   * Trata um erro e exibe toast se necessário
   */
  const handleError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}) => {
      const {
        customMessage,
        showToast = true,
        onError,
        logError = true,
      } = options;

      // Log do erro
      if (logError) {
        console.error("[Error Handler]", {
          error,
          timestamp: new Date().toISOString(),
        });
      }

      // Mensagem para o usuário
      const message = customMessage || getErrorMessage(error);

      // Exibir toast
      if (showToast) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: message,
        });
      }

      // Callback customizado
      if (onError && error instanceof Error) {
        onError(error);
      }

      return message;
    },
    [toast, getErrorMessage]
  );

  /**
   * Wrapper para operações assíncronas com tratamento automático de erro
   */
  const withErrorHandling = useCallback(
    <T,>(
      operation: () => Promise<T>,
      options?: ErrorHandlerOptions
    ): Promise<T | null> => {
      return operation().catch((error) => {
        handleError(error, options);
        return null;
      });
    },
    [handleError]
  );

  /**
   * Verifica se um erro é de autenticação
   */
  const isAuthError = useCallback((error: unknown): boolean => {
    if (error instanceof TRPCClientError) {
      return error.data?.code === "UNAUTHORIZED";
    }
    return false;
  }, []);

  /**
   * Verifica se um erro é de permissão
   */
  const isForbiddenError = useCallback((error: unknown): boolean => {
    if (error instanceof TRPCClientError) {
      return error.data?.code === "FORBIDDEN";
    }
    return false;
  }, []);

  /**
   * Verifica se um erro é de recurso não encontrado
   */
  const isNotFoundError = useCallback((error: unknown): boolean => {
    if (error instanceof TRPCClientError) {
      return error.data?.code === "NOT_FOUND";
    }
    return false;
  }, []);

  return {
    handleError,
    withErrorHandling,
    getErrorMessage,
    isAuthError,
    isForbiddenError,
    isNotFoundError,
  };
}

/**
 * Hook para retry automático de operações falhadas
 */
export function useRetry() {
  const { handleError } = useErrorHandler();

  /**
   * Tenta executar uma operação com retry automático
   */
  const retry = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      options: {
        maxAttempts?: number;
        delay?: number;
        onRetry?: (attempt: number) => void;
      } = {}
    ): Promise<T | null> => {
      const { maxAttempts = 3, delay = 1000, onRetry } = options;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await operation();
        } catch (error) {
          // Última tentativa - lança o erro
          if (attempt === maxAttempts) {
            handleError(error, {
              customMessage: `Falha após ${maxAttempts} tentativas. Por favor, tente novamente mais tarde.`,
            });
            return null;
          }

          // Notifica sobre retry
          if (onRetry) {
            onRetry(attempt);
          }

          // Aguarda antes da próxima tentativa
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
      }

      return null;
    },
    [handleError]
  );

  return { retry };
}
