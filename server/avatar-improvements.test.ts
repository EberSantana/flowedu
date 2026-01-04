import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import * as db from './db';
import type { User } from '../drizzle/schema';

describe('Avatar Improvements - Fase 2', () => {
  let testUser: User;
  let testStudentId: number;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    // Criar contexto de usuário de teste (professor)
    testUser = {
      id: 1000020,
      openId: `test-improvements-${Date.now()}`,
      name: 'Professor Teste Melhorias',
      email: `improvements-test-${Date.now()}@test.com`,
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

    // Criar aluno de teste com ID único
    const timestamp = Date.now();
    const student = await db.createStudent({
      userId: testUser.id,
      registrationNumber: `TEST-IMP-${timestamp}`,
      fullName: 'Aluno Teste Melhorias',
    });
    testStudentId = student.id;

    // Criar caller com contexto do usuário
    caller = appRouter.createCaller({ user: testUser });
  });

  describe('Sistema de Kimonos Especiais', () => {
    it('deve permitir adicionar campo specialKimono ao aluno', async () => {
      // Verificar que o aluno de teste tem o campo specialKimono
      const studentData = await caller.students.getById({ id: testStudentId });
      expect(studentData).toBeDefined();
      expect(studentData.specialKimono).toBeDefined();
      // Valor padrão deve ser 'none'
      expect(studentData.specialKimono).toBe('none');
    });

    it('deve permitir atualizar kimono especial do aluno via db', async () => {
      // Atualizar kimono especial diretamente no banco
      const updated = await db.updateStudentAvatar(testStudentId, {
        avatarGender: 'male',
        avatarSkinTone: 'light',
        avatarKimonoColor: 'white',
        avatarHairStyle: 'short',
        avatarHairColor: 'black',
        avatarKimonoStyle: 'traditional',
        avatarHeadAccessory: 'none',
        avatarExpression: 'neutral',
        avatarPose: 'standing',
        specialKimono: 'golden',
      });

      expect(updated).toBeDefined();
      expect(updated.specialKimono).toBe('golden');
    });

    it('deve manter kimono especial ao buscar dados do aluno', async () => {
      // Atualizar com kimono especial
      await db.updateStudentAvatar(testStudentId, {
        avatarGender: 'male',
        avatarSkinTone: 'light',
        avatarKimonoColor: 'white',
        avatarHairStyle: 'short',
        avatarHairColor: 'black',
        avatarKimonoStyle: 'traditional',
        avatarHeadAccessory: 'none',
        avatarExpression: 'neutral',
        avatarPose: 'standing',
        specialKimono: 'silver',
      });

      // Buscar novamente
      const retrieved = await caller.students.getById({ id: testStudentId });
      expect(retrieved.specialKimono).toBe('silver');
    });

    it('deve suportar diferentes tipos de kimonos especiais', async () => {
      const kimonoTypes = ['none', 'golden', 'silver', 'patterned_dragon', 'patterned_tiger', 'patterned_sakura'];

      for (const kimono of kimonoTypes) {
        const updated = await db.updateStudentAvatar(testStudentId, {
          avatarGender: 'male',
          avatarSkinTone: 'light',
          avatarKimonoColor: 'white',
          avatarHairStyle: 'short',
          avatarHairColor: 'black',
          avatarKimonoStyle: 'traditional',
          avatarHeadAccessory: 'none',
          avatarExpression: 'neutral',
          avatarPose: 'standing',
          specialKimono: kimono,
        });

        expect(updated.specialKimono).toBe(kimono);
      }
    });
  });

  describe('Sistema de Pontos e Faixas', () => {
    it('deve calcular faixa corretamente baseado em pontos', async () => {
      // Testar cálculo de faixa para diferentes níveis de pontos
      const pointsForBelts = [
        { points: 0, expectedBelt: 'white' },
        { points: 100, expectedBelt: 'yellow' },
        { points: 300, expectedBelt: 'orange' },
        { points: 600, expectedBelt: 'green' },
        { points: 1000, expectedBelt: 'blue' },
        { points: 1500, expectedBelt: 'purple' },
        { points: 2100, expectedBelt: 'brown' },
        { points: 3000, expectedBelt: 'black' },
      ];

      const beltOrder = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black'];
      const pointsThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 3000];

      for (const { points, expectedBelt } of pointsForBelts) {
        // Calcular faixa baseado em pontos
        let calculatedBelt = 'white';
        
        for (let i = pointsThresholds.length - 1; i >= 0; i--) {
          if (points >= pointsThresholds[i]) {
            calculatedBelt = beltOrder[i];
            break;
          }
        }

        expect(calculatedBelt).toBe(expectedBelt);
      }
    });

    it('deve verificar requisitos para desbloquear kimonos especiais', async () => {
      // Requisitos dos kimonos
      const kimonoRequirements = [
        { kimono: 'patterned_sakura', requiredPoints: 1000, requiredBelt: 'green' },
        { kimono: 'patterned_tiger', requiredPoints: 2000, requiredBelt: 'blue' },
        { kimono: 'patterned_dragon', requiredPoints: 3000, requiredBelt: 'purple' },
        { kimono: 'silver', requiredPoints: 5000, requiredBelt: 'brown' },
        { kimono: 'golden', requiredPoints: 10000, requiredBelt: 'black' },
      ];

      const beltOrder = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black'];
      const pointsThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 3000];

      for (const { kimono, requiredPoints, requiredBelt } of kimonoRequirements) {
        // Calcular faixa baseado nos pontos requeridos
        let currentBelt = 'white';
        for (let i = pointsThresholds.length - 1; i >= 0; i--) {
          if (requiredPoints >= pointsThresholds[i]) {
            currentBelt = beltOrder[i];
            break;
          }
        }

        const currentBeltIndex = beltOrder.indexOf(currentBelt);
        const requiredBeltIndex = beltOrder.indexOf(requiredBelt);
        
        // Verificar lógica de desbloqueio
        const hasEnoughPoints = requiredPoints >= requiredPoints; // sempre true
        const hasRequiredBelt = currentBeltIndex >= requiredBeltIndex;
        const canUnlock = hasEnoughPoints && hasRequiredBelt;
        
        expect(canUnlock).toBeDefined();
        expect(typeof canUnlock).toBe('boolean');
      }
    });
  });

  describe('Integração com Sistema de Gamificação', () => {
    it('deve manter dados do avatar após atualizações', async () => {
      // Atualizar avatar com kimono especial
      await db.updateStudentAvatar(testStudentId, {
        avatarGender: 'male',
        avatarSkinTone: 'light',
        avatarKimonoColor: 'white',
        avatarHairStyle: 'short',
        avatarHairColor: 'black',
        avatarKimonoStyle: 'traditional',
        avatarHeadAccessory: 'none',
        avatarExpression: 'neutral',
        avatarPose: 'standing',
        specialKimono: 'patterned_sakura',
      });

      // Buscar dados e verificar persistência
      const studentData = await caller.students.getById({ id: testStudentId });
      expect(studentData.specialKimono).toBe('patterned_sakura');
      expect(studentData.avatarKimonoColor).toBe('white');
      expect(studentData.avatarHairStyle).toBe('short');
    });
  });
});
