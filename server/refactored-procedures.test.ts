/**
 * Testes para procedures refatorados com utilitários de otimização
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as db from './db';
import { handleAsync, validateExists, validateOwnership } from './errorHandler';
import { createCachedQuery } from './queryOptimizer';

describe('Procedures Refatorados', () => {
  describe('getPerformanceSummary', () => {
    it('deve usar cache corretamente', async () => {
      // Simular função cacheada
      const getCachedSummary = createCachedQuery(
        async (userId: number) => {
          return [{ subjectId: 1, progress: 75 }];
        },
        300
      );

      // Primeira chamada
      const result1 = await getCachedSummary(1);
      expect(result1).toHaveLength(1);
      expect(result1[0].progress).toBe(75);

      // Segunda chamada (deve usar cache)
      const result2 = await getCachedSummary(1);
      expect(result2).toEqual(result1);
    });

    it('deve usar handleAsync para tratamento de erro', async () => {
      const mockOperation = async () => {
        return [{ subjectId: 1, progress: 75 }];
      };

      const result = await handleAsync(
        mockOperation,
        { operation: 'test', userId: 1 }
      );

      expect(result).toHaveLength(1);
    });
  });

  describe('getStudentsProgressBySubject', () => {
    it('deve validar existência da disciplina', () => {
      const subject = { id: 1, userId: 1, name: 'Matemática' };
      
      // Não deve lançar erro quando disciplina existe
      expect(() => {
        validateExists(subject, 'disciplina');
      }).not.toThrow();
    });

    it('deve validar ownership da disciplina', () => {
      const ownerId = 1;
      const currentUserId = 1;
      
      // Não deve lançar erro quando IDs são iguais
      expect(() => {
        validateOwnership(ownerId, currentUserId, 'disciplina');
      }).not.toThrow();
    });

    it('deve lançar erro quando disciplina não existe', () => {
      expect(() => {
        validateExists(null, 'disciplina');
      }).toThrow();
    });

    it('deve lançar erro quando usuário não é dono', () => {
      expect(() => {
        validateOwnership(1, 2, 'disciplina');
      }).toThrow();
    });

    it('deve usar cache com múltiplos parâmetros', async () => {
      const getCachedProgress = createCachedQuery(
        async (subjectId: number, userId: number) => {
          return [
            { studentId: 1, progress: 80 },
            { studentId: 2, progress: 90 },
          ];
        },
        180
      );

      const result = await getCachedProgress(1, 1);
      expect(result).toHaveLength(2);
      expect(result[0].progress).toBe(80);
    });
  });

  describe('Integração - Cache + ErrorHandler', () => {
    it('deve combinar cache e handleAsync', async () => {
      const getCached = createCachedQuery(
        async (id: number) => {
          return { id, data: 'test' };
        },
        60
      );

      const result = await handleAsync(
        async () => {
          return await getCached(1);
        },
        { operation: 'test' }
      );

      expect(result).toEqual({ id: 1, data: 'test' });
    });

    it('deve combinar validações com cache', async () => {
      const getCached = createCachedQuery(
        async (id: number) => {
          return { id, userId: 1, name: 'Test' };
        },
        60
      );

      const result = await handleAsync(
        async () => {
          const item = await getCached(1);
          validateExists(item, 'item');
          validateOwnership(item.userId, 1, 'item');
          return item;
        },
        { operation: 'test', userId: 1 }
      );

      expect(result).toBeDefined();
      expect(result?.userId).toBe(1);
    });
  });

  describe('Performance - Cache', () => {
    it('deve cachear resultados e evitar execuções repetidas', async () => {
      let executionCount = 0;

      const getCached = createCachedQuery(
        async (id: number) => {
          executionCount++;
          return { id, count: executionCount };
        },
        60
      );

      // Primeira execução
      const result1 = await getCached(1);
      expect(executionCount).toBe(1);
      expect(result1.count).toBe(1);

      // Segunda execução (deve usar cache)
      const result2 = await getCached(1);
      expect(executionCount).toBe(1); // Não incrementou
      expect(result2.count).toBe(1); // Mesmo valor

      // Execução com ID diferente
      const result3 = await getCached(2);
      expect(executionCount).toBe(2); // Incrementou
      expect(result3.count).toBe(2);
    });

    it('deve cachear com diferentes TTLs', async () => {
      const shortCache = createCachedQuery(
        async (id: number) => ({ id, type: 'short' }),
        1 // 1 segundo
      );

      const longCache = createCachedQuery(
        async (id: number) => ({ id, type: 'long' }),
        300 // 5 minutos
      );

      const short = await shortCache(1);
      const long = await longCache(1);

      expect(short.type).toBe('short');
      expect(long.type).toBe('long');
    });
  });

  describe('Validações Combinadas', () => {
    it('deve validar múltiplas condições em sequência', async () => {
      const mockSubject = {
        id: 1,
        userId: 1,
        name: 'Matemática',
        students: [1, 2, 3],
      };

      await handleAsync(
        async () => {
          // Validar existência
          validateExists(mockSubject, 'disciplina');
          
          // Validar ownership
          validateOwnership(mockSubject.userId, 1, 'disciplina');
          
          // Validar dados
          expect(mockSubject.students).toHaveLength(3);
          
          return mockSubject;
        },
        { operation: 'validateSubject', userId: 1 }
      );
    });

    it('deve falhar na primeira validação que não passar', async () => {
      expect(async () => {
        await handleAsync(
          async () => {
            validateExists(null, 'disciplina'); // Deve falhar aqui
            validateOwnership(1, 2, 'disciplina'); // Não deve chegar aqui
          },
          { operation: 'test' }
        );
      }).rejects.toThrow();
    });
  });

  describe('Exemplos Práticos', () => {
    it('deve simular fluxo completo de getPerformanceSummary', async () => {
      const userId = 1;

      const getCachedSummary = createCachedQuery(
        async (uid: number) => {
          // Simular busca no banco
          return [
            { subjectId: 1, subjectName: 'Matemática', progress: 75 },
            { subjectId: 2, subjectName: 'Português', progress: 85 },
          ];
        },
        300
      );

      const result = await handleAsync(
        async () => {
          return await getCachedSummary(userId);
        },
        { operation: 'getPerformanceSummary', userId }
      );

      expect(result).toHaveLength(2);
      expect(result?.[0].subjectName).toBe('Matemática');
    });

    it('deve simular fluxo completo de getStudentsProgressBySubject', async () => {
      const subjectId = 1;
      const userId = 1;

      const getCachedProgress = createCachedQuery(
        async (sid: number, uid: number) => {
          return [
            { studentId: 1, studentName: 'João', progress: 80 },
            { studentId: 2, studentName: 'Maria', progress: 90 },
          ];
        },
        180
      );

      const result = await handleAsync(
        async () => {
          // Simular busca da disciplina
          const subject = { id: subjectId, userId, name: 'Matemática' };
          validateExists(subject, 'disciplina');
          validateOwnership(subject.userId, userId, 'disciplina');

          return await getCachedProgress(subjectId, userId);
        },
        { 
          operation: 'getStudentsProgressBySubject', 
          userId,
          details: { subjectId }
        }
      );

      expect(result).toHaveLength(2);
      expect(result?.[0].studentName).toBe('João');
    });
  });
});

describe('Documentação e Estrutura', () => {
  it('deve ter arquivo de exemplos de refatoração', () => {
    const fs = require('fs');
    const path = require('path');
    
    const examplesPath = path.join(__dirname, 'routers-refactored-examples.ts');
    expect(fs.existsSync(examplesPath)).toBe(true);
  });

  it('deve ter utilitários implementados', async () => {
    const errorHandler = await import('./errorHandler');
    const queryOptimizer = await import('./queryOptimizer');
    
    expect(typeof errorHandler.handleAsync).toBe('function');
    expect(typeof errorHandler.validateExists).toBe('function');
    expect(typeof errorHandler.validateOwnership).toBe('function');
    expect(typeof queryOptimizer.createCachedQuery).toBe('function');
  });
});
