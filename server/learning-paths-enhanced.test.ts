import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Enhanced Learning Paths', () => {
  let testStudentId: number;
  let testProfessorId: number;
  let testSubjectId: number;
  let testModuleId: number;
  let testTopicId: number;

  beforeAll(async () => {
    // Usar IDs existentes do sistema para testes
    testStudentId = 1;
    testProfessorId = 1;
    testSubjectId = 1;
  });

  describe('Student Learning Journal', () => {
    it('deve adicionar entrada no diário de aprendizagem', async () => {
      const result = await db.addJournalEntry({
        studentId: testStudentId,
        topicId: 1,
        content: 'Teste de entrada no diário',
        tags: JSON.stringify(['teste', 'aprendizagem']),
        mood: 'good',
        entryDate: new Date(),
      } as any);

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    it('deve buscar entradas do diário por tópico', async () => {
      const entries = await db.getJournalEntriesByTopic(testStudentId, 1);
      expect(Array.isArray(entries)).toBe(true);
    });

    it('deve buscar todas as entradas do diário do aluno', async () => {
      const entries = await db.getAllJournalEntries(testStudentId, 10);
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Student Doubts System', () => {
    it('deve enviar dúvida ao professor', async () => {
      const result = await db.submitDoubt({
        studentId: testStudentId,
        topicId: 1,
        professorId: testProfessorId,
        question: 'Teste de dúvida sobre o tópico',
        context: 'Contexto da dúvida',
        isPrivate: true,
        status: 'pending',
      } as any);

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    it('deve buscar dúvidas do aluno', async () => {
      const doubts = await db.getStudentDoubts(testStudentId);
      expect(Array.isArray(doubts)).toBe(true);
    });

    it('deve buscar dúvidas pendentes do professor', async () => {
      const doubts = await db.getPendingDoubts(testProfessorId);
      expect(Array.isArray(doubts)).toBe(true);
    });
  });

  describe('Enhanced Learning Path', () => {
    it('deve buscar trilha completa com progresso e pré-requisitos', async () => {
      const learningPath = await db.getEnhancedLearningPath(
        testStudentId,
        testSubjectId,
        testProfessorId
      );

      expect(Array.isArray(learningPath)).toBe(true);
      
      if (learningPath.length > 0) {
        const module = learningPath[0];
        expect(module).toHaveProperty('id');
        expect(module).toHaveProperty('title');
        expect(module).toHaveProperty('topics');
        
        if (module.topics && module.topics.length > 0) {
          const topic = module.topics[0];
          expect(topic).toHaveProperty('isUnlocked');
          expect(topic).toHaveProperty('progress');
          expect(topic).toHaveProperty('materials');
        }
      }
    });

    it('deve atualizar progresso do tópico', async () => {
      const result = await db.updateStudentTopicProgressEnhanced({
        studentId: testStudentId,
        topicId: 1,
        status: 'in_progress',
        selfAssessment: 'understood',
        notes: 'Teste de atualização de progresso',
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    it('deve marcar tópico como concluído', async () => {
      const result = await db.updateStudentTopicProgressEnhanced({
        studentId: testStudentId,
        topicId: 1,
        status: 'completed',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Study Statistics', () => {
    it('deve buscar estatísticas de estudo do aluno', async () => {
      const stats = await db.getStudyStatistics(testStudentId);

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalTopics');
      expect(stats).toHaveProperty('completedTopics');
      expect(stats).toHaveProperty('inProgressTopics');
      expect(stats).toHaveProperty('notStartedTopics');
      expect(stats).toHaveProperty('totalHoursEstimated');
      expect(stats).toHaveProperty('journalEntries');
      expect(stats).toHaveProperty('pendingDoubts');
      expect(stats).toHaveProperty('answeredDoubts');

      expect(typeof stats.totalTopics).toBe('number');
      expect(typeof stats.completedTopics).toBe('number');
      expect(typeof stats.journalEntries).toBe('number');
    });

    it('deve buscar estatísticas por disciplina específica', async () => {
      const stats = await db.getStudyStatistics(testStudentId, testSubjectId);

      expect(stats).toBeDefined();
      expect(typeof stats.totalTopics).toBe('number');
    });
  });

  describe('Topic Prerequisites', () => {
    it('deve verificar desbloqueio de tópicos com pré-requisitos', async () => {
      const learningPath = await db.getEnhancedLearningPath(
        testStudentId,
        testSubjectId,
        testProfessorId
      );

      if (learningPath.length > 0 && learningPath[0].topics) {
        const topics = learningPath[0].topics;
        
        // Verificar que tópicos têm propriedade isUnlocked
        topics.forEach((topic: any) => {
          expect(topic).toHaveProperty('isUnlocked');
          expect(typeof topic.isUnlocked).toBe('boolean');
        });
      }
    });
  });

  describe('Respond to Doubts', () => {
    it('deve responder dúvida do aluno', async () => {
      // Primeiro criar uma dúvida
      const doubtResult = await db.submitDoubt({
        studentId: testStudentId,
        topicId: 1,
        professorId: testProfessorId,
        question: 'Dúvida para teste de resposta',
        isPrivate: true,
        status: 'pending',
      } as any);

      expect(doubtResult.success).toBe(true);

      // Responder a dúvida
      const responseResult = await db.respondDoubt(
        doubtResult.id!,
        'Esta é uma resposta de teste',
        testProfessorId
      );

      expect(responseResult.success).toBe(true);
    });
  });
});
