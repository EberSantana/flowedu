import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Sistema de Especializações (Dojo Tech)', () => {
  let testStudentId: number;

  beforeAll(async () => {
    // Criar estudante de teste
    testStudentId = Math.floor(Math.random() * 1000000) + 100000;
  });

  describe('Escolha de Especialização', () => {
    it('deve permitir escolher uma especialização', async () => {
      const result = await db.chooseSpecialization(testStudentId, 'code_warrior');
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.specialization).toBe('code_warrior');
    });

    it('não deve permitir escolher segunda especialização', async () => {
      await expect(
        db.chooseSpecialization(testStudentId, 'data_sage')
      ).rejects.toThrow('Aluno já possui uma especialização');
    });
  });

  describe('Busca de Especialização', () => {
    it('deve retornar especialização do aluno', async () => {
      const spec = await db.getStudentSpecialization(testStudentId);
      
      expect(spec).toBeDefined();
      expect(spec?.specialization).toBe('code_warrior');
      expect(spec?.level).toBe(1);
    });

    it('deve retornar null para aluno sem especialização', async () => {
      const spec = await db.getStudentSpecialization(999999);
      expect(spec).toBeNull();
    });
  });

  describe('Árvore de Skills', () => {
    it('deve retornar skills da especialização', async () => {
      const skills = await db.getSkillTree('code_warrior');
      
      expect(skills).toBeDefined();
      expect(skills.length).toBeGreaterThan(0);
      expect(skills[0]).toHaveProperty('name');
      expect(skills[0]).toHaveProperty('tier');
      expect(skills[0]).toHaveProperty('bonusType');
    });

    it('deve ordenar skills por tier e nível', async () => {
      const skills = await db.getSkillTree('interface_master');
      
      for (let i = 1; i < skills.length; i++) {
        const current = skills[i];
        const previous = skills[i - 1];
        expect(current.tier >= previous.tier).toBe(true);
      }
    });
  });

  describe('Desbloqueio de Skills', () => {
    it('deve desbloquear skill básica', async () => {
      const skills = await db.getSkillTree('code_warrior');
      const basicSkill = skills.find(s => s.tier === 1);
      
      if (basicSkill) {
        const result = await db.unlockSkill(testStudentId, basicSkill.id);
        expect(result.success).toBe(true);
      }
    });

    it('não deve desbloquear skill já desbloqueada', async () => {
      const skills = await db.getSkillTree('code_warrior');
      const basicSkill = skills.find(s => s.tier === 1);
      
      if (basicSkill) {
        const result = await db.unlockSkill(testStudentId, basicSkill.id);
        expect(result.success).toBe(false);
        expect(result.message).toContain('já desbloqueada');
      }
    });
  });

  describe('Skills Desbloqueadas', () => {
    it('deve retornar skills desbloqueadas do aluno', async () => {
      const skills = await db.getStudentSkills(testStudentId);
      
      expect(skills).toBeDefined();
      expect(skills.length).toBeGreaterThan(0);
      expect(skills[0]).toHaveProperty('skillKey');
      expect(skills[0]).toHaveProperty('bonusValue');
    });
  });

  describe('Cálculo de Bônus', () => {
    it('deve calcular multiplicador de pontos', async () => {
      const multiplier = await db.calculateBonusMultiplier(testStudentId, 'points_multiplier');
      
      expect(multiplier).toBeGreaterThanOrEqual(1.0);
      expect(typeof multiplier).toBe('number');
    });

    it('deve retornar 1.0 para tipo de bônus sem skills', async () => {
      const multiplier = await db.calculateBonusMultiplier(testStudentId, 'nonexistent_bonus');
      expect(multiplier).toBe(1.0);
    });
  });

  describe('Títulos Honoríficos', () => {
    it('deve atribuir título honorífico', async () => {
      const result = await db.awardHonorificTitle(testStudentId, 'Mestre');
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.title).toBe('Mestre');
    });
  });

  describe('Atualização de Nível', () => {
    it('deve verificar atualização de nível', async () => {
      const result = await db.updateSpecializationLevel(testStudentId);
      
      expect(result).toBeDefined();
      // Pode ou não ter level up dependendo dos pontos
      expect(result).toHaveProperty('levelUp');
    });
  });
});
