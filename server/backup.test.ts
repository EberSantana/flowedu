import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import { createContext } from './_core/context';

describe('Backup Routes', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    // Criar contexto de teste com usuário admin
    const ctx = await createContext({
      req: {
        headers: {},
        cookies: {},
      } as any,
      res: {} as any,
    });

    // Mock de usuário admin
    (ctx as any).user = {
      id: 1,
      name: 'Admin Test',
      email: 'admin@test.com',
      role: 'admin',
    };

    caller = appRouter.createCaller(ctx);
  });

  it('deve listar backups', async () => {
    const result = await caller.backup.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it('deve obter configuração de agendamento', async () => {
    const result = await caller.backup.getSchedule();
    expect(result).toHaveProperty('isEnabled');
    expect(result).toHaveProperty('frequency');
  });

  it('deve validar permissões de admin', async () => {
    // Criar contexto sem usuário admin
    const ctx = await createContext({
      req: {
        headers: {},
        cookies: {},
      } as any,
      res: {} as any,
    });

    // Mock de usuário comum
    (ctx as any).user = {
      id: 2,
      name: 'User Test',
      email: 'user@test.com',
      role: 'user',
    };

    const userCaller = appRouter.createCaller(ctx);

    // Deve lançar erro de permissão
    await expect(userCaller.backup.list()).rejects.toThrow();
  });
});
