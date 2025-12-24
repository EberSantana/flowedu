import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import * as db from './db';

describe('Active Methodologies', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testUserId: number;
  let createdMethodologyId: number;

  beforeAll(async () => {
    // Buscar usuário de teste
    const users = await db.getAllUsers();
    const testUser = users.find(u => u.email === 'admin@test.com') || users[0];
    testUserId = testUser.id;

    // Criar caller autenticado
    caller = appRouter.createCaller({
      user: { id: testUserId, email: testUser.email, name: testUser.name, role: testUser.role },
      req: {} as any,
      res: {} as any,
    });
  });

  it('deve listar metodologias ativas', async () => {
    // Criar uma metodologia de teste primeiro
    const timestamp = Date.now();
    await caller.activeMethodologies.create({
      name: `Teste Listagem ${timestamp}`,
      description: 'Metodologia para teste de listagem',
      category: 'Teste',
      url: `https://test-${timestamp}.com`,
    });

    const methodologies = await caller.activeMethodologies.list();
    
    expect(Array.isArray(methodologies)).toBe(true);
    expect(methodologies.length).toBeGreaterThan(0);
    
    // Verificar estrutura de uma metodologia
    const methodology = methodologies[0];
    expect(methodology).toHaveProperty('id');
    expect(methodology).toHaveProperty('name');
    expect(methodology).toHaveProperty('description');
    expect(methodology).toHaveProperty('category');
    expect(methodology).toHaveProperty('url');
    expect(methodology).toHaveProperty('userId');
  });

  it('deve criar uma nova metodologia', async () => {
    const timestamp = Date.now();
    const newMethodology = {
      name: `Ferramenta Teste ${timestamp}`,
      description: 'Descrição de teste para metodologia ativa',
      category: 'Outros',
      url: `https://test-tool-${timestamp}.com`,
      tips: 'Dica de uso pedagógico para teste',
      isFavorite: false,
    };

    const result = await caller.activeMethodologies.create(newMethodology);
    
    expect(result).toBeDefined();
    createdMethodologyId = result.insertId;
    expect(createdMethodologyId).toBeGreaterThan(0);
  });

  it('deve atualizar uma metodologia existente', async () => {
    // Buscar metodologia criada
    const methodologies = await caller.activeMethodologies.list();
    const methodology = methodologies.find(m => m.id === createdMethodologyId);
    
    expect(methodology).toBeDefined();

    // Atualizar
    const updateData = {
      id: createdMethodologyId,
      name: 'Ferramenta Teste Atualizada',
      isFavorite: true,
    };

    const result = await caller.activeMethodologies.update(updateData);
    expect(result.success).toBe(true);

    // Verificar atualização
    const updatedMethodologies = await caller.activeMethodologies.list();
    const updatedMethodology = updatedMethodologies.find(m => m.id === createdMethodologyId);
    
    expect(updatedMethodology?.name).toBe('Ferramenta Teste Atualizada');
    expect(updatedMethodology?.isFavorite).toBe(true);
  });

  it('deve deletar uma metodologia', async () => {
    const result = await caller.activeMethodologies.delete({ id: createdMethodologyId });
    expect(result.success).toBe(true);

    // Verificar que foi deletada
    const methodologies = await caller.activeMethodologies.list();
    const deletedMethodology = methodologies.find(m => m.id === createdMethodologyId);
    
    expect(deletedMethodology).toBeUndefined();
  });

  it('deve validar campos obrigatórios ao criar', async () => {
    const invalidMethodology = {
      name: '',
      description: '',
      category: '',
      url: 'invalid-url',
    };

    await expect(
      caller.activeMethodologies.create(invalidMethodology as any)
    ).rejects.toThrow();
  });

  it('deve validar URL ao criar metodologia', async () => {
    const methodologyWithInvalidUrl = {
      name: 'Teste URL',
      description: 'Teste de validação de URL',
      category: 'Outros',
      url: 'not-a-valid-url',
    };

    await expect(
      caller.activeMethodologies.create(methodologyWithInvalidUrl)
    ).rejects.toThrow();
  });

  it('deve permitir campos opcionais vazios', async () => {
    const timestamp = Date.now();
    const methodologyWithoutOptionals = {
      name: `Ferramenta Sem Opcionais ${timestamp}`,
      description: 'Metodologia sem campos opcionais',
      category: 'Outros',
      url: `https://no-optionals-${timestamp}.com`,
    };

    const result = await caller.activeMethodologies.create(methodologyWithoutOptionals);
    expect(result).toBeDefined();
    expect(result.insertId).toBeGreaterThan(0);

    // Limpar
    await caller.activeMethodologies.delete({ id: result.insertId });
  });

  it('deve filtrar metodologias por usuário', async () => {
    const methodologies = await caller.activeMethodologies.list();
    
    // Todas as metodologias devem ser do usuário autenticado
    methodologies.forEach(methodology => {
      expect(methodology.userId).toBe(testUserId);
    });
  });
});
