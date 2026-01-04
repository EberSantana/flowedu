import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from './routers';
import * as db from './db';
import type { User } from '../drizzle/schema';

describe('Avatar Customization System', () => {
  let testUser: User;
  let testStudentId: number;
  let studentSession: any;

  beforeAll(async () => {
    // Criar contexto de usuário de teste (professor)
    testUser = {
      id: 1000010,
      openId: `test-avatar-${Date.now()}`,
      name: 'Professor Teste Avatar',
      email: `avatar-test-${Date.now()}@test.com`,
      role: 'user' as const,
      loginMethod: 'test',
      active: true,
      approvalStatus: 'approved' as const,
      inviteCode: null,
      passwordHash: null,
      lastSignedIn: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Criar aluno de teste
    const student = await db.createStudent({
      userId: testUser.id,
      registrationNumber: `AVATAR-${Date.now()}`,
      fullName: 'Aluno Teste Avatar',
    });

    if (!student) throw new Error('Failed to create test student');
    testStudentId = student.id;

    // Criar sessão de aluno simulada
    studentSession = {
      studentId: testStudentId,
      registrationNumber: student.registrationNumber,
      fullName: student.fullName,
    };
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (testStudentId) {
      await db.deleteStudent(testStudentId, testUser.id);
    }
    // Nota: não deletamos o usuário para evitar problemas com constraints
  });

  describe('Avatar Retrieval', () => {
    it('deve buscar avatar do aluno com valores padrão', async () => {
      const caller = appRouter.createCaller({
        user: testUser,
        studentSession,
        req: {} as any,
        res: {} as any,
      });

      const avatar = await caller.studentAvatar.getMyAvatar();

      expect(avatar).toBeDefined();
      expect(avatar.id).toBe(testStudentId);
      expect(avatar.avatarSkinTone).toBe('light'); // Valor padrão
      expect(avatar.avatarKimonoColor).toBe('white'); // Valor padrão
      expect(avatar.avatarHairStyle).toBe('short'); // Valor padrão
    });

    it('deve retornar erro se aluno não existir', async () => {
      const caller = appRouter.createCaller({
        user: testUser,
        studentSession: {
          studentId: 999999,
          registrationNumber: 'INVALID',
          fullName: 'Invalid',
        },
        req: {} as any,
        res: {} as any,
      });

      await expect(caller.studentAvatar.getMyAvatar()).rejects.toThrow();
    });
  });

  describe('Avatar Customization', () => {
    it('deve atualizar tom de pele do avatar', async () => {
      const caller = appRouter.createCaller({
        user: testUser,
        studentSession,
        req: {} as any,
        res: {} as any,
      });

      const updated = await caller.studentAvatar.updateMyAvatar({
        avatarSkinTone: 'dark',
      });

      expect(updated).toBeDefined();
      expect(updated.avatarSkinTone).toBe('dark');
    });

    it('deve atualizar estilo de cabelo do avatar', async () => {
      const caller = appRouter.createCaller({
        user: testUser,
        studentSession,
        req: {} as any,
        res: {} as any,
      });

      const updated = await caller.studentAvatar.updateMyAvatar({
        avatarHairStyle: 'ponytail',
      });

      expect(updated).toBeDefined();
      expect(updated.avatarHairStyle).toBe('ponytail');
    });

    it('deve atualizar cor do kimono do avatar', async () => {
      const caller = appRouter.createCaller({
        user: testUser,
        studentSession,
        req: {} as any,
        res: {} as any,
      });

      const updated = await caller.studentAvatar.updateMyAvatar({
        avatarKimonoColor: 'blue',
      });

      expect(updated).toBeDefined();
      expect(updated.avatarKimonoColor).toBe('blue');
    });

    it('deve atualizar múltiplas propriedades do avatar de uma vez', async () => {
      const caller = appRouter.createCaller({
        user: testUser,
        studentSession,
        req: {} as any,
        res: {} as any,
      });

      const updated = await caller.studentAvatar.updateMyAvatar({
        avatarSkinTone: 'medium',
        avatarHairStyle: 'long',
        avatarKimonoColor: 'red',
      });

      expect(updated).toBeDefined();
      expect(updated.avatarSkinTone).toBe('medium');
      expect(updated.avatarHairStyle).toBe('long');
      expect(updated.avatarKimonoColor).toBe('red');
    });

    it('deve manter valores não atualizados', async () => {
      const caller = appRouter.createCaller({
        user: testUser,
        studentSession,
        req: {} as any,
        res: {} as any,
      });

      // Primeiro, definir valores conhecidos
      await caller.studentAvatar.updateMyAvatar({
        avatarSkinTone: 'tan',
        avatarHairStyle: 'bald',
        avatarKimonoColor: 'black',
      });

      // Atualizar apenas um campo
      const updated = await caller.studentAvatar.updateMyAvatar({
        avatarSkinTone: 'darkest',
      });

      expect(updated.avatarSkinTone).toBe('darkest');
      expect(updated.avatarHairStyle).toBe('bald'); // Deve manter
      expect(updated.avatarKimonoColor).toBe('black'); // Deve manter
    });
  });

  describe('Gamification Integration', () => {
    it('deve calcular faixa corretamente baseado em pontos', async () => {
      // Criar pontos para o aluno
      await db.addPointsToStudent(
        testStudentId,
        250, // 250 pontos = Faixa Amarela
        'Teste de integração',
        'test',
        null
      );

      const caller = appRouter.createCaller({
        user: testUser,
        studentSession,
        req: {} as any,
        res: {} as any,
      });

      const stats = await caller.gamification.getStudentStats();

      expect(stats).toBeDefined();
      expect(stats.totalPoints).toBeGreaterThanOrEqual(250);
      expect(stats.currentBelt).toBe('yellow'); // Faixa amarela (200-399 pontos)
    });

    it('deve atualizar faixa automaticamente ao ganhar pontos', async () => {
      const caller = appRouter.createCaller({
        user: testUser,
        studentSession,
        req: {} as any,
        res: {} as any,
      });

      // Buscar pontos atuais
      const statsBefore = await caller.gamification.getStudentStats();
      const pointsBefore = statsBefore.totalPoints;

      // Adicionar pontos suficientes para subir de faixa
      const pointsToAdd = 400 - pointsBefore; // Garantir que chegue em 400 (Faixa Laranja)
      
      if (pointsToAdd > 0) {
        await db.addPointsToStudent(
          testStudentId,
          pointsToAdd,
          'Teste de upgrade de faixa',
          'test',
          null
        );
      }

      const statsAfter = await caller.gamification.getStudentStats();

      expect(statsAfter.totalPoints).toBeGreaterThanOrEqual(400);
      expect(statsAfter.currentBelt).toBe('orange'); // Faixa laranja (400-599 pontos)
    });
  });
});
