import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';

describe('Reports Router', () => {
  it('deve retornar estatísticas de aulas para um período válido', async () => {
    // Criar um caller com contexto de usuário mock
    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@test.com',
      role: 'user' as const,
    };

    const caller = appRouter.createCaller({
      user: mockUser,
      req: {} as any,
      res: {} as any,
    });

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const stats = await caller.reports.getStats({
      startDate,
      endDate,
    });

    // Verificar estrutura da resposta
    expect(stats).toBeDefined();
    expect(typeof stats.total).toBe('number');
    expect(typeof stats.given).toBe('number');
    expect(typeof stats.notGiven).toBe('number');
    expect(typeof stats.cancelled).toBe('number');
    expect(typeof stats.pending).toBe('number');
    expect(Array.isArray(stats.bySubject)).toBe(true);
    expect(Array.isArray(stats.byMonth)).toBe(true);

    // Verificar que a soma dos status é igual ao total
    expect(stats.given + stats.notGiven + stats.cancelled + stats.pending).toBe(stats.total);
  });

  it('deve aceitar filtro por disciplina', async () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@test.com',
      role: 'user' as const,
    };

    const caller = appRouter.createCaller({
      user: mockUser,
      req: {} as any,
      res: {} as any,
    });

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Testar com filtro de disciplina
    const stats = await caller.reports.getStats({
      startDate,
      endDate,
      subjectId: 1,
    });

    expect(stats).toBeDefined();
    expect(Array.isArray(stats.bySubject)).toBe(true);
  });

  it('deve retornar dados por mês quando o período for maior que um mês', async () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@test.com',
      role: 'user' as const,
    };

    const caller = appRouter.createCaller({
      user: mockUser,
      req: {} as any,
      res: {} as any,
    });

    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];

    const stats = await caller.reports.getStats({
      startDate,
      endDate,
    });

    expect(stats).toBeDefined();
    expect(Array.isArray(stats.byMonth)).toBe(true);
    
    // Verificar que cada mês tem a estrutura correta
    if (stats.byMonth.length > 0) {
      const firstMonth = stats.byMonth[0];
      expect(firstMonth).toHaveProperty('month');
      expect(firstMonth).toHaveProperty('given');
      expect(firstMonth).toHaveProperty('notGiven');
      expect(firstMonth).toHaveProperty('cancelled');
      expect(firstMonth).toHaveProperty('pending');
      expect(firstMonth).toHaveProperty('total');
    }
  });
});
