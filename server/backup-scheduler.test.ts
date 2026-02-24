import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getNextExecution } from './backup-scheduler';

describe('Backup Scheduler', () => {
  describe('getNextExecution', () => {
    it('deve calcular próxima execução para agendamento diário', () => {
      const cronExpression = '0 3 * * *'; // 03:00 todos os dias
      const next = getNextExecution(cronExpression);
      
      expect(next).toBeTruthy();
      if (next) {
        expect(next.getHours()).toBe(3);
        expect(next.getMinutes()).toBe(0);
        expect(next.getTime()).toBeGreaterThan(Date.now());
      }
    });

    it('deve calcular próxima execução para agendamento semanal', () => {
      const cronExpression = '0 3 * * 0'; // 03:00 todo domingo
      const next = getNextExecution(cronExpression);
      
      expect(next).toBeTruthy();
      if (next) {
        expect(next.getHours()).toBe(3);
        expect(next.getMinutes()).toBe(0);
        expect(next.getTime()).toBeGreaterThan(Date.now());
      }
    });

    it('deve calcular próxima execução para agendamento mensal', () => {
      const cronExpression = '0 3 1 * *'; // 03:00 dia 1 de cada mês
      const next = getNextExecution(cronExpression);
      
      expect(next).toBeTruthy();
      if (next) {
        expect(next.getHours()).toBe(3);
        expect(next.getMinutes()).toBe(0);
        expect(next.getTime()).toBeGreaterThan(Date.now());
      }
    });

    it('deve retornar null para expressão cron inválida', () => {
      const cronExpression = 'invalid cron';
      const next = getNextExecution(cronExpression);
      
      expect(next).toBeNull();
    });
  });
});
