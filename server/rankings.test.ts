import { describe, it, expect } from 'vitest';
import * as db from './db';

describe('Sistema de Rankings (Leaderboard) - Validação de Funções', () => {
  describe('getSubjectRanking', () => {
    it('deve retornar array vazio para disciplina inexistente', async () => {
      const ranking = await db.getSubjectRanking(999999, 10);
      
      expect(ranking).toBeDefined();
      expect(Array.isArray(ranking)).toBe(true);
      expect(ranking.length).toBe(0);
    });

    it('deve aceitar parâmetro de limite', async () => {
      const ranking = await db.getSubjectRanking(1, 5);
      
      expect(ranking).toBeDefined();
      expect(Array.isArray(ranking)).toBe(true);
      expect(ranking.length).toBeLessThanOrEqual(5);
    });

    it('deve retornar dados estruturados corretamente', async () => {
      const ranking = await db.getSubjectRanking(1, 10);
      
      if (ranking.length > 0) {
        expect(ranking[0]).toHaveProperty('studentId');
        expect(ranking[0]).toHaveProperty('fullName');
        expect(ranking[0]).toHaveProperty('totalPoints');
        expect(ranking[0]).toHaveProperty('currentBelt');
        expect(ranking[0]).toHaveProperty('streakDays');
        expect(typeof ranking[0].totalPoints).toBe('number');
      }
    });

    it('deve retornar ranking ordenado por pontos (decrescente)', async () => {
      const ranking = await db.getSubjectRanking(1, 10);
      
      if (ranking.length >= 2) {
        // Verificar que está ordenado corretamente
        for (let i = 0; i < ranking.length - 1; i++) {
          expect(ranking[i].totalPoints).toBeGreaterThanOrEqual(ranking[i + 1].totalPoints);
        }
      }
    });
  });

  describe('getStudentRankPosition', () => {
    it('deve retornar posição 0 para aluno inexistente', async () => {
      const position = await db.getStudentRankPosition(999999, 1);
      
      expect(position).toBeDefined();
      expect(position.position).toBe(0);
      expect(position.totalStudents).toBeGreaterThanOrEqual(0);
      expect(position.studentData).toBeNull();
    });

    it('deve retornar estrutura correta', async () => {
      const position = await db.getStudentRankPosition(1, 1);
      
      expect(position).toBeDefined();
      expect(position).toHaveProperty('position');
      expect(position).toHaveProperty('totalStudents');
      expect(position).toHaveProperty('studentData');
      expect(typeof position.position).toBe('number');
      expect(typeof position.totalStudents).toBe('number');
    });
  });

  describe('getSubjectTopPerformers', () => {
    it('deve retornar no máximo 3 performers', async () => {
      const topPerformers = await db.getSubjectTopPerformers(1);
      
      expect(topPerformers).toBeDefined();
      expect(Array.isArray(topPerformers)).toBe(true);
      expect(topPerformers.length).toBeLessThanOrEqual(3);
    });

    it('deve incluir medalhas corretas', async () => {
      const topPerformers = await db.getSubjectTopPerformers(1);
      
      if (topPerformers.length >= 1) {
        expect(topPerformers[0].medal).toBe('🥇');
        expect(topPerformers[0].position).toBe(1);
      }
      
      if (topPerformers.length >= 2) {
        expect(topPerformers[1].medal).toBe('🥈');
        expect(topPerformers[1].position).toBe(2);
      }
      
      if (topPerformers.length >= 3) {
        expect(topPerformers[2].medal).toBe('🥉');
        expect(topPerformers[2].position).toBe(3);
      }
    });

    it('deve retornar dados estruturados corretamente', async () => {
      const topPerformers = await db.getSubjectTopPerformers(1);
      
      if (topPerformers.length > 0) {
        expect(topPerformers[0]).toHaveProperty('position');
        expect(topPerformers[0]).toHaveProperty('studentId');
        expect(topPerformers[0]).toHaveProperty('fullName');
        expect(topPerformers[0]).toHaveProperty('registrationNumber');
        expect(topPerformers[0]).toHaveProperty('totalPoints');
        expect(topPerformers[0]).toHaveProperty('currentBelt');
        expect(topPerformers[0]).toHaveProperty('medal');
      }
    });
  });

  describe('getSubjectRankingStats', () => {
    it('deve retornar estatísticas válidas', async () => {
      const stats = await db.getSubjectRankingStats(1);
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalStudents');
      expect(stats).toHaveProperty('avgPoints');
      expect(stats).toHaveProperty('maxPoints');
      expect(stats).toHaveProperty('minPoints');
      expect(typeof stats.totalStudents).toBe('number');
      expect(['number', 'object'].includes(typeof stats.avgPoints)).toBe(true); // Pode ser number ou null
      expect(['number', 'object'].includes(typeof stats.maxPoints)).toBe(true); // Pode ser number ou null
      expect(['number', 'object'].includes(typeof stats.minPoints)).toBe(true); // Pode ser number ou null
    });

    it('deve ter valores lógicos (max >= avg >= min)', async () => {
      const stats = await db.getSubjectRankingStats(1);
      
      if (stats.totalStudents > 0) {
        expect(stats.maxPoints).toBeGreaterThanOrEqual(stats.avgPoints);
        expect(stats.avgPoints).toBeGreaterThanOrEqual(stats.minPoints);
      }
    });

    it('deve retornar zeros para disciplina sem alunos', async () => {
      const stats = await db.getSubjectRankingStats(999999);
      
      expect(stats.totalStudents).toBe(0);
      expect(stats.avgPoints === 0 || stats.avgPoints === null).toBe(true);
      expect(stats.maxPoints === 0 || stats.maxPoints === null).toBe(true);
      expect(stats.minPoints === 0 || stats.minPoints === null).toBe(true);
    });
  });

  describe('getSubjectRankingByPeriod', () => {
    it('deve retornar array para período válido', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const ranking = await db.getSubjectRankingByPeriod(1, yesterday, tomorrow, 10);
      
      expect(ranking).toBeDefined();
      expect(Array.isArray(ranking)).toBe(true);
    });

    it('deve retornar array vazio para período futuro', async () => {
      const futureStart = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const futureEnd = new Date(Date.now() + 400 * 24 * 60 * 60 * 1000);
      
      const ranking = await db.getSubjectRankingByPeriod(1, futureStart, futureEnd, 10);
      
      expect(ranking).toBeDefined();
      expect(ranking.length).toBe(0);
    });

    it('deve respeitar limite de resultados', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      
      const ranking = await db.getSubjectRankingByPeriod(1, past, now, 3);
      
      expect(ranking.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getStudentRankHistory', () => {
    it('deve retornar array de histórico', async () => {
      const history = await db.getStudentRankHistory(1, 1, 30);
      
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    });

    it('deve retornar estrutura correta', async () => {
      const history = await db.getStudentRankHistory(1, 1, 30);
      
      if (history.length > 0) {
        expect(history[0]).toHaveProperty('date');
        expect(history[0]).toHaveProperty('cumulativePoints');
        expect(typeof history[0].cumulativePoints).toBe('number');
      }
    });

    it('deve retornar array vazio para aluno inexistente', async () => {
      const history = await db.getStudentRankHistory(999999, 1, 30);
      
      expect(history).toBeDefined();
      expect(history.length).toBe(0);
    });
  });

  describe('Consistência entre funções', () => {
    it('getSubjectRanking e getSubjectTopPerformers devem ser consistentes', async () => {
      const ranking = await db.getSubjectRanking(1, 10);
      const topPerformers = await db.getSubjectTopPerformers(1);
      
      if (ranking.length >= 3 && topPerformers.length >= 3) {
        // Top 3 do ranking deve corresponder aos top performers
        expect(topPerformers[0].studentId).toBe(ranking[0].studentId);
        expect(topPerformers[1].studentId).toBe(ranking[1].studentId);
        expect(topPerformers[2].studentId).toBe(ranking[2].studentId);
      }
    });

    it('getSubjectRankingStats deve refletir dados do ranking', async () => {
      const ranking = await db.getSubjectRanking(1, 100);
      const stats = await db.getSubjectRankingStats(1);
      
      if (ranking.length > 0) {
        // Total de alunos deve ser consistente
        expect(stats.totalStudents).toBeGreaterThanOrEqual(ranking.length);
        
        // Max points deve ser >= primeiro do ranking
        expect(stats.maxPoints).toBeGreaterThanOrEqual(ranking[0].totalPoints);
        
        // Min points deve ser <= último do ranking
        if (ranking.length > 0) {
          expect(stats.minPoints).toBeLessThanOrEqual(ranking[ranking.length - 1].totalPoints);
        }
      }
    });
  });

  describe('Validação de tipos e estruturas', () => {
    it('todas as funções devem retornar valores não-undefined', async () => {
      const ranking = await db.getSubjectRanking(1, 10);
      const position = await db.getStudentRankPosition(1, 1);
      const topPerformers = await db.getSubjectTopPerformers(1);
      const stats = await db.getSubjectRankingStats(1);
      const history = await db.getStudentRankHistory(1, 1, 30);
      
      expect(ranking).not.toBeUndefined();
      expect(position).not.toBeUndefined();
      expect(topPerformers).not.toBeUndefined();
      expect(stats).not.toBeUndefined();
      expect(history).not.toBeUndefined();
    });

    it('funções devem lidar com IDs inválidos sem erro', async () => {
      await expect(db.getSubjectRanking(-1, 10)).resolves.toBeDefined();
      await expect(db.getStudentRankPosition(-1, -1)).resolves.toBeDefined();
      await expect(db.getSubjectTopPerformers(-1)).resolves.toBeDefined();
      await expect(db.getSubjectRankingStats(-1)).resolves.toBeDefined();
      await expect(db.getStudentRankHistory(-1, -1, 30)).resolves.toBeDefined();
    });
  });
});
