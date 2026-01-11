import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from './routers';
import * as db from './db';

describe('Tasks System', () => {
  const mockUser = {
    id: 999999, // ID numérico para testes
    name: 'Test User',
    email: 'test@example.com',
    role: 'user' as const,
  };

  const createCaller = () => {
    return appRouter.createCaller({
      user: mockUser,
    });
  };

  beforeEach(async () => {
    // Limpar tarefas do usuário de teste
    const tasks = await db.getAllTasks(mockUser.id);
    for (const task of tasks) {
      await db.deleteTask(task.id, mockUser.id);
    }
  });

  describe('Task Creation', () => {
    it('should create a task with all fields', async () => {
      const caller = createCaller();
      const result = await caller.tasks.create({
        title: 'Preparar aula de matemática',
        description: 'Revisar exercícios de álgebra',
        priority: 'high',
        category: 'Aulas',
        dueDate: '2025-12-31',
      });

      expect(result).toHaveProperty('id');
      expect(result.id).toBeGreaterThan(0);
    });

    it('should create a task with only required fields', async () => {
      const caller = createCaller();
      const result = await caller.tasks.create({
        title: 'Tarefa simples',
      });

      expect(result).toHaveProperty('id');
      expect(result.id).toBeGreaterThan(0);
    });

    it('should set default priority to medium', async () => {
      const caller = createCaller();
      const result = await caller.tasks.create({
        title: 'Tarefa sem prioridade',
      });

      const tasks = await caller.tasks.getAll();
      const createdTask = tasks.find((t) => t.id === result.id);
      expect(createdTask?.priority).toBe('medium');
    });
  });

  describe('Task Retrieval', () => {
    it('should retrieve all tasks for user', async () => {
      const caller = createCaller();
      
      await caller.tasks.create({ title: 'Tarefa 1' });
      await caller.tasks.create({ title: 'Tarefa 2' });
      await caller.tasks.create({ title: 'Tarefa 3' });

      const tasks = await caller.tasks.getAll();
      expect(tasks.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter tasks by completed status', async () => {
      const caller = createCaller();
      
      const task1 = await caller.tasks.create({ title: 'Tarefa Pendente' });
      const task2 = await caller.tasks.create({ title: 'Tarefa Completa' });
      
      await caller.tasks.toggleComplete({ id: task2.id });

      const completedTasks = await caller.tasks.getByFilter({ completed: true });
      const pendingTasks = await caller.tasks.getByFilter({ completed: false });

      expect(completedTasks.some((t) => t.id === task2.id)).toBe(true);
      expect(pendingTasks.some((t) => t.id === task1.id)).toBe(true);
    });

    it('should filter tasks by priority', async () => {
      const caller = createCaller();
      
      await caller.tasks.create({ title: 'Alta', priority: 'high' });
      await caller.tasks.create({ title: 'Média', priority: 'medium' });
      await caller.tasks.create({ title: 'Baixa', priority: 'low' });

      const highPriorityTasks = await caller.tasks.getByFilter({ priority: 'high' });
      expect(highPriorityTasks.every((t) => t.priority === 'high')).toBe(true);
    });

    it('should filter tasks by category', async () => {
      const caller = createCaller();
      
      await caller.tasks.create({ title: 'Aula 1', category: 'Aulas' });
      await caller.tasks.create({ title: 'Admin 1', category: 'Administrativo' });
      await caller.tasks.create({ title: 'Aula 2', category: 'Aulas' });

      const aulaTasks = await caller.tasks.getByFilter({ category: 'Aulas' });
      expect(aulaTasks.every((t) => t.category === 'Aulas')).toBe(true);
      expect(aulaTasks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Task Update', () => {
    it('should update task title', async () => {
      const caller = createCaller();
      
      const task = await caller.tasks.create({ title: 'Título Original' });
      await caller.tasks.update({ id: task.id, title: 'Título Atualizado' });

      const tasks = await caller.tasks.getAll();
      const updatedTask = tasks.find((t) => t.id === task.id);
      expect(updatedTask?.title).toBe('Título Atualizado');
    });

    it('should update task priority', async () => {
      const caller = createCaller();
      
      const task = await caller.tasks.create({ title: 'Tarefa', priority: 'low' });
      await caller.tasks.update({ id: task.id, priority: 'high' });

      const tasks = await caller.tasks.getAll();
      const updatedTask = tasks.find((t) => t.id === task.id);
      expect(updatedTask?.priority).toBe('high');
    });

    it('should update multiple fields at once', async () => {
      const caller = createCaller();
      
      const task = await caller.tasks.create({ title: 'Tarefa' });
      await caller.tasks.update({
        id: task.id,
        title: 'Novo Título',
        description: 'Nova Descrição',
        priority: 'high',
        category: 'Urgente',
      });

      const tasks = await caller.tasks.getAll();
      const updatedTask = tasks.find((t) => t.id === task.id);
      expect(updatedTask?.title).toBe('Novo Título');
      expect(updatedTask?.description).toBe('Nova Descrição');
      expect(updatedTask?.priority).toBe('high');
      expect(updatedTask?.category).toBe('Urgente');
    });
  });

  describe('Task Completion', () => {
    it('should toggle task completion status', async () => {
      const caller = createCaller();
      
      const task = await caller.tasks.create({ title: 'Tarefa' });
      
      // Marcar como completa
      const result1 = await caller.tasks.toggleComplete({ id: task.id });
      expect(result1.completed).toBe(true);

      // Desmarcar
      const result2 = await caller.tasks.toggleComplete({ id: task.id });
      expect(result2.completed).toBe(false);
    });

    it('should set completedAt when completing task', async () => {
      const caller = createCaller();
      
      const task = await caller.tasks.create({ title: 'Tarefa' });
      await caller.tasks.toggleComplete({ id: task.id });

      const tasks = await caller.tasks.getAll();
      const completedTask = tasks.find((t) => t.id === task.id);
      expect(completedTask?.completedAt).not.toBeNull();
    });

    it('should clear completedAt when uncompleting task', async () => {
      const caller = createCaller();
      
      const task = await caller.tasks.create({ title: 'Tarefa' });
      await caller.tasks.toggleComplete({ id: task.id });
      await caller.tasks.toggleComplete({ id: task.id });

      const tasks = await caller.tasks.getAll();
      const uncompletedTask = tasks.find((t) => t.id === task.id);
      expect(uncompletedTask?.completedAt).toBeNull();
    });
  });

  describe('Task Deletion', () => {
    it('should delete a task', async () => {
      const caller = createCaller();
      
      const task = await caller.tasks.create({ title: 'Tarefa para deletar' });
      await caller.tasks.delete({ id: task.id });

      const tasks = await caller.tasks.getAll();
      expect(tasks.find((t) => t.id === task.id)).toBeUndefined();
    });

    it('should not affect other user tasks', async () => {
      const caller = createCaller();
      
      const task1 = await caller.tasks.create({ title: 'Tarefa 1' });
      const task2 = await caller.tasks.create({ title: 'Tarefa 2' });
      
      await caller.tasks.delete({ id: task1.id });

      const tasks = await caller.tasks.getAll();
      expect(tasks.find((t) => t.id === task2.id)).toBeDefined();
    });
  });

  describe('Categories', () => {
    it('should retrieve unique categories', async () => {
      const caller = createCaller();
      
      await caller.tasks.create({ title: 'T1', category: 'Aulas' });
      await caller.tasks.create({ title: 'T2', category: 'Administrativo' });
      await caller.tasks.create({ title: 'T3', category: 'Aulas' });
      await caller.tasks.create({ title: 'T4', category: 'Pessoal' });

      const categories = await caller.tasks.getCategories();
      expect(categories).toContain('Aulas');
      expect(categories).toContain('Administrativo');
      expect(categories).toContain('Pessoal');
      expect(categories.length).toBe(3);
    });

    it('should not include null categories', async () => {
      const caller = createCaller();
      
      await caller.tasks.create({ title: 'Sem categoria' });
      await caller.tasks.create({ title: 'Com categoria', category: 'Teste' });

      const categories = await caller.tasks.getCategories();
      expect(categories).not.toContain(null);
      expect(categories).not.toContain(undefined);
    });
  });

  describe('Data Isolation', () => {
    it('should only show tasks for current user', async () => {
      const caller1 = createCaller();
      const caller2 = appRouter.createCaller({
        user: {
          id: 888888, // ID numérico diferente para outro usuário
          name: 'Other User',
          email: 'other@example.com',
          role: 'user' as const,
        },
      });

      await caller1.tasks.create({ title: 'Tarefa User 1' });
      await caller2.tasks.create({ title: 'Tarefa User 2' });

      const user1Tasks = await caller1.tasks.getAll();
      const user2Tasks = await caller2.tasks.getAll();

      expect(user1Tasks.every((t) => t.userId === mockUser.id)).toBe(true);
      expect(user2Tasks.every((t) => t.userId === 888888)).toBe(true);
      expect(user1Tasks.some((t) => t.title === 'Tarefa User 2')).toBe(false);
    });

    it('should not allow updating other user tasks', async () => {
      const caller1 = createCaller();
      const caller2 = appRouter.createCaller({
        user: {
          id: 888888, // ID numérico diferente para outro usuário
          name: 'Other User',
          email: 'other@example.com',
          role: 'user' as const,
        },
      });

      const task = await caller1.tasks.create({ title: 'Tarefa User 1' });
      await caller2.tasks.update({ id: task.id, title: 'Tentativa de Hack' });

      const user1Tasks = await caller1.tasks.getAll();
      const updatedTask = user1Tasks.find((t) => t.id === task.id);
      expect(updatedTask?.title).toBe('Tarefa User 1');
    });

    it('should not allow deleting other user tasks', async () => {
      const caller1 = createCaller();
      const caller2 = appRouter.createCaller({
        user: {
          id: 888888, // ID numérico diferente para outro usuário
          name: 'Other User',
          email: 'other@example.com',
          role: 'user' as const,
        },
      });

      const task = await caller1.tasks.create({ title: 'Tarefa User 1' });
      await caller2.tasks.delete({ id: task.id });

      const user1Tasks = await caller1.tasks.getAll();
      expect(user1Tasks.find((t) => t.id === task.id)).toBeDefined();
    });
  });
});
