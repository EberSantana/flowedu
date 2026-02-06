/**
 * Testes para os utilitários de otimização
 */

import { describe, it, expect, vi } from 'vitest';
import * as errorHandler from './errorHandler';
import * as queryOptimizer from './queryOptimizer';
import * as fs from 'fs';
import * as path from 'path';

describe('Error Handler', () => {
  describe('Estrutura', () => {
    it('deve exportar funções principais', () => {
      expect(errorHandler).toBeDefined();
      expect(typeof errorHandler.createError).toBe('function');
      expect(typeof errorHandler.handleAsync).toBe('function');
      expect(typeof errorHandler.validateOwnership).toBe('function');
      expect(typeof errorHandler.validateExists).toBe('function');
      expect(typeof errorHandler.handleAIOperation).toBe('function');
      expect(typeof errorHandler.validateInput).toBe('function');
      expect(typeof errorHandler.handleBatch).toBe('function');
    });

    it('deve ter códigos de erro padronizados', () => {
      const { ErrorCodes } = errorHandler;
      
      expect(ErrorCodes).toHaveProperty('UNAUTHORIZED');
      expect(ErrorCodes).toHaveProperty('FORBIDDEN');
      expect(ErrorCodes).toHaveProperty('NOT_FOUND');
      expect(ErrorCodes).toHaveProperty('BAD_REQUEST');
      expect(ErrorCodes).toHaveProperty('INTERNAL_SERVER_ERROR');
    });
  });

  describe('Validações', () => {
    it('deve validar ownership corretamente', () => {
      const { validateOwnership } = errorHandler;
      
      // Deve passar quando IDs são iguais
      expect(() => {
        validateOwnership(1, 1, 'recurso');
      }).not.toThrow();
      
      // Deve lançar erro quando IDs são diferentes
      expect(() => {
        validateOwnership(1, 2, 'recurso');
      }).toThrow();
    });

    it('deve validar existência corretamente', () => {
      const { validateExists } = errorHandler;
      
      // Deve passar quando recurso existe
      expect(() => {
        validateExists({ id: 1 }, 'recurso');
      }).not.toThrow();
      
      // Deve lançar erro quando recurso é null
      expect(() => {
        validateExists(null, 'recurso');
      }).toThrow();
      
      // Deve lançar erro quando recurso é undefined
      expect(() => {
        validateExists(undefined, 'recurso');
      }).toThrow();
    });

    it('deve validar input corretamente', () => {
      const { validateInput } = errorHandler;
      
      // Deve passar quando condição é true
      expect(() => {
        validateInput(true, 'Erro');
      }).not.toThrow();
      
      // Deve lançar erro quando condição é false
      expect(() => {
        validateInput(false, 'Erro');
      }).toThrow();
    });
  });
});

describe('Query Optimizer', () => {
  describe('Estrutura', () => {
    it('deve exportar funções principais', () => {
      const optimizer = queryOptimizer;
      
      expect(optimizer).toHaveProperty('batchQuery');
      expect(optimizer).toHaveProperty('groupBy');
      expect(optimizer).toHaveProperty('createCachedQuery');
      expect(optimizer).toHaveProperty('SimpleDataLoader');
      expect(optimizer).toHaveProperty('createPaginatedResult');
      expect(optimizer).toHaveProperty('getPaginationParams');
      expect(optimizer).toHaveProperty('debounce');
      expect(optimizer).toHaveProperty('throttle');
    });
  });

  describe('Batch Query', () => {
    it('deve executar queries em paralelo', async () => {
      const { batchQuery } = queryOptimizer;
      
      const items = [1, 2, 3];
      const results = await batchQuery(items, async (item) => item * 2);
      
      expect(results).toEqual([2, 4, 6]);
    });
  });

  describe('Group By', () => {
    it('deve agrupar itens por chave', () => {
      const { groupBy } = queryOptimizer;
      
      const items = [
        { id: 1, type: 'A' },
        { id: 2, type: 'B' },
        { id: 3, type: 'A' },
      ];
      
      const groups = groupBy(items, (item) => item.type);
      
      expect(groups.size).toBe(2);
      expect(groups.get('A')).toHaveLength(2);
      expect(groups.get('B')).toHaveLength(1);
    });
  });

  describe('Paginação', () => {
    it('deve calcular offset e limit corretamente', () => {
      const { getPaginationParams } = queryOptimizer;
      
      const page1 = getPaginationParams(1, 10);
      expect(page1).toEqual({ offset: 0, limit: 10 });
      
      const page2 = getPaginationParams(2, 10);
      expect(page2).toEqual({ offset: 10, limit: 10 });
      
      const page3 = getPaginationParams(3, 20);
      expect(page3).toEqual({ offset: 40, limit: 20 });
    });

    it('deve criar resultado paginado correto', () => {
      const { createPaginatedResult } = queryOptimizer;
      
      const data = [1, 2, 3, 4, 5];
      const result = createPaginatedResult(data, 50, { page: 1, pageSize: 5 });
      
      expect(result).toMatchObject({
        data,
        total: 50,
        page: 1,
        pageSize: 5,
        totalPages: 10,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('deve indicar corretamente última página', () => {
      const { createPaginatedResult } = queryOptimizer;
      
      const data = [1, 2, 3];
      const result = createPaginatedResult(data, 23, { page: 5, pageSize: 5 });
      
      expect(result).toMatchObject({
        totalPages: 5,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });
  });

  describe('Cache', () => {
    it('deve cachear resultados de queries', async () => {
      const { createCachedQuery } = queryOptimizer;
      
      let callCount = 0;
      const expensiveQuery = async (id: number) => {
        callCount++;
        return { id, data: 'result' };
      };
      
      const cachedQuery = createCachedQuery(expensiveQuery, 60);
      
      // Primeira chamada - executa query
      const result1 = await cachedQuery(1);
      expect(callCount).toBe(1);
      expect(result1).toEqual({ id: 1, data: 'result' });
      
      // Segunda chamada com mesmo ID - usa cache
      const result2 = await cachedQuery(1);
      expect(callCount).toBe(1); // Não incrementou
      expect(result2).toEqual({ id: 1, data: 'result' });
      
      // Chamada com ID diferente - executa query
      const result3 = await cachedQuery(2);
      expect(callCount).toBe(2);
      expect(result3).toEqual({ id: 2, data: 'result' });
    });
  });
});

describe('Integração - Otimizações', () => {
  it('deve ter documentação completa', () => {
    
    const analysisPath = path.join(__dirname, '../CODE_ANALYSIS.md');
    const guidePath = path.join(__dirname, '../OPTIMIZATION_GUIDE.md');
    
    expect(fs.existsSync(analysisPath)).toBe(true);
    expect(fs.existsSync(guidePath)).toBe(true);
  });

  it('deve ter todos os utilitários implementados', () => {
    
    // Verificar que funções principais existem
    expect(typeof errorHandler.createError).toBe('function');
    expect(typeof errorHandler.handleAsync).toBe('function');
    expect(typeof queryOptimizer.batchQuery).toBe('function');
    expect(typeof queryOptimizer.createCachedQuery).toBe('function');
  });

  it('deve seguir padrões de nomenclatura', () => {
    
    // Funções devem usar camelCase
    const errorFunctions = Object.keys(errorHandler);
    const optimizerFunctions = Object.keys(queryOptimizer);
    
    errorFunctions.forEach(fn => {
      // Aceitar camelCase ou PascalCase (para constantes como ErrorCodes)
      expect(fn).toMatch(/^[a-zA-Z][a-zA-Z0-9]*$/);
    });
    
    optimizerFunctions.forEach(fn => {
      // Aceitar camelCase ou PascalCase (para classes como SimpleDataLoader)
      expect(fn).toMatch(/^[a-zA-Z][a-zA-Z0-9]*$/);
    });
  });
});

describe('Documentação', () => {
  it('deve ter exemplos práticos no guia', () => {
    
    const guidePath = path.join(__dirname, '../OPTIMIZATION_GUIDE.md');
    const content = fs.readFileSync(guidePath, 'utf-8');
    
    // Verificar seções importantes
    expect(content).toContain('Error Handler (Backend)');
    expect(content).toContain('Error Handler (Frontend)');
    expect(content).toContain('Query Optimizer');
    expect(content).toContain('Exemplos Práticos');
    expect(content).toContain('Checklist de Otimização');
  });

  it('deve ter análise completa no relatório', () => {
    
    const analysisPath = path.join(__dirname, '../CODE_ANALYSIS.md');
    const content = fs.readFileSync(analysisPath, 'utf-8');
    
    // Verificar seções importantes
    expect(content).toContain('Pontos Positivos');
    expect(content).toContain('Problemas Identificados');
    expect(content).toContain('Plano de Ação');
    expect(content).toContain('Métricas de Qualidade');
  });
});
