import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Mistake Notebook - Caderno Inteligente', () => {
  let testStudentId: number;
  let testQuestionId: number;
  
  beforeAll(async () => {
    // Criar aluno de teste
    testStudentId = 999999; // ID fictício para testes
  });
  
  describe('Questões do Caderno', () => {
    it('deve criar uma nova questão no caderno', async () => {
      const questionId = await db.createMistakeNotebookQuestion({
        studentId: testStudentId,
        subject: 'Matemática',
        topic: 'Equações do 2º Grau',
        difficulty: 'medium',
        source: 'Livro Didático - Capítulo 5',
        questionText: 'Resolva a equação x² - 5x + 6 = 0',
        correctAnswer: 'x = 2 ou x = 3',
        explanation: 'Usando a fórmula de Bhaskara ou fatoração',
        tags: JSON.stringify(['álgebra', 'equações', 'bhaskara']),
      });
      
      expect(questionId).toBeGreaterThan(0);
      testQuestionId = questionId;
    });
    
    it('deve listar questões do aluno', async () => {
      const questions = await db.getMistakeNotebookQuestions(testStudentId);
      
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
      
      const question = questions[0];
      expect(question).toHaveProperty('id');
      expect(question).toHaveProperty('subject');
      expect(question).toHaveProperty('topic');
      expect(question).toHaveProperty('difficulty');
    });
    
    it('deve filtrar questões por matéria', async () => {
      const questions = await db.getMistakeNotebookQuestions(testStudentId, {
        subject: 'Matemática',
      });
      
      expect(Array.isArray(questions)).toBe(true);
      questions.forEach(q => {
        expect(q.subject).toBe('Matemática');
      });
    });
    
    it('deve obter questão por ID', async () => {
      const question = await db.getMistakeNotebookQuestionById(testQuestionId, testStudentId);
      
      expect(question).not.toBeNull();
      expect(question?.id).toBe(testQuestionId);
      expect(question?.subject).toBe('Matemática');
    });
  });
  
  describe('Tentativas de Resposta', () => {
    it('deve registrar tentativa de resposta correta', async () => {
      const attemptId = await db.createMistakeNotebookAttempt({
        questionId: testQuestionId,
        studentId: testStudentId,
        studentAnswer: 'x = 2 ou x = 3',
        isCorrect: true,
        timeSpent: 180, // 3 minutos
      });
      
      expect(attemptId).toBeGreaterThan(0);
    });
    
    it('deve registrar tentativa de resposta incorreta', async () => {
      const attemptId = await db.createMistakeNotebookAttempt({
        questionId: testQuestionId,
        studentId: testStudentId,
        studentAnswer: 'x = 1 ou x = 4',
        isCorrect: false,
        errorType: 'Erro de cálculo',
        studentNotes: 'Esqueci de verificar os sinais',
        timeSpent: 240,
      });
      
      expect(attemptId).toBeGreaterThan(0);
    });
    
    it('deve listar tentativas de uma questão', async () => {
      const attempts = await db.getMistakeNotebookAttempts(testQuestionId, testStudentId);
      
      expect(Array.isArray(attempts)).toBe(true);
      expect(attempts.length).toBeGreaterThanOrEqual(2); // Pelo menos as 2 tentativas criadas
      
      const attempt = attempts[0];
      expect(attempt).toHaveProperty('studentAnswer');
      expect(attempt).toHaveProperty('isCorrect');
      expect(attempt).toHaveProperty('reviewStatus');
    });
    
    it('deve atualizar status de revisão', async () => {
      const attempts = await db.getMistakeNotebookAttempts(testQuestionId, testStudentId);
      const attemptId = attempts[0].id;
      
      await db.updateAttemptReviewStatus(attemptId, 'reviewed');
      
      const updatedAttempts = await db.getMistakeNotebookAttempts(testQuestionId, testStudentId);
      const updatedAttempt = updatedAttempts.find(a => a.id === attemptId);
      
      expect(updatedAttempt?.reviewStatus).toBe('reviewed');
      expect(updatedAttempt?.reviewedAt).not.toBeNull();
    });
  });
  
  describe('Tópicos de Estudo', () => {
    it('deve listar tópicos do aluno', async () => {
      const topics = await db.getMistakeNotebookTopics(testStudentId);
      
      expect(Array.isArray(topics)).toBe(true);
      
      if (topics.length > 0) {
        const topic = topics[0];
        expect(topic).toHaveProperty('topicName');
        expect(topic).toHaveProperty('subject');
        expect(topic).toHaveProperty('errorRate');
        expect(topic).toHaveProperty('priority');
        expect(topic).toHaveProperty('totalQuestions');
      }
    });
    
    it('deve calcular taxa de erro corretamente', async () => {
      const topics = await db.getMistakeNotebookTopics(testStudentId, 'Matemática');
      
      topics.forEach(topic => {
        expect(topic.errorRate).toBeGreaterThanOrEqual(0);
        expect(topic.errorRate).toBeLessThanOrEqual(100);
      });
    });
    
    it('deve definir prioridade baseada na taxa de erro', async () => {
      const topics = await db.getMistakeNotebookTopics(testStudentId);
      
      topics.forEach(topic => {
        if (topic.errorRate >= 75) {
          expect(topic.priority).toBe('critical');
        } else if (topic.errorRate >= 50) {
          expect(topic.priority).toBe('high');
        } else if (topic.errorRate >= 25) {
          expect(topic.priority).toBe('medium');
        } else {
          expect(topic.priority).toBe('low');
        }
      });
    });
  });
  
  describe('Insights da IA', () => {
    it('deve criar insight de análise de padrões', async () => {
      const insightId = await db.createMistakeNotebookInsight({
        studentId: testStudentId,
        insightType: 'pattern_analysis',
        title: 'Análise de Padrões de Erro',
        content: 'Você tem dificuldade em questões que envolvem fatoração e uso da fórmula de Bhaskara.',
        data: JSON.stringify({ patterns: ['fatoração', 'bhaskara'] }),
        relevanceScore: 85,
      });
      
      expect(insightId).toBeGreaterThan(0);
    });
    
    it('deve criar insight de sugestão de estudo', async () => {
      const insightId = await db.createMistakeNotebookInsight({
        studentId: testStudentId,
        insightType: 'study_suggestion',
        title: 'Sugestões de Estudo',
        content: '1. Revise a fórmula de Bhaskara\n2. Pratique fatoração\n3. Resolva exercícios similares',
        relevanceScore: 90,
      });
      
      expect(insightId).toBeGreaterThan(0);
    });
    
    it('deve listar insights do aluno', async () => {
      const insights = await db.getMistakeNotebookInsights(testStudentId);
      
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThanOrEqual(2);
      
      const insight = insights[0];
      expect(insight).toHaveProperty('title');
      expect(insight).toHaveProperty('content');
      expect(insight).toHaveProperty('insightType');
      expect(insight).toHaveProperty('relevanceScore');
    });
    
    it('deve filtrar insights por tipo', async () => {
      const insights = await db.getMistakeNotebookInsights(testStudentId, {
        insightType: 'pattern_analysis',
      });
      
      insights.forEach(insight => {
        expect(insight.insightType).toBe('pattern_analysis');
      });
    });
    
    it('deve marcar insight como lido', async () => {
      const insights = await db.getMistakeNotebookInsights(testStudentId);
      const insightId = insights[0].id;
      
      await db.markInsightAsRead(insightId);
      
      const updatedInsights = await db.getMistakeNotebookInsights(testStudentId);
      const updatedInsight = updatedInsights.find(i => i.id === insightId);
      
      expect(updatedInsight?.isRead).toBe(true);
    });
  });
  
  describe('Planos de Estudo', () => {
    let testPlanId: number;
    
    it('deve criar plano de estudos', async () => {
      const planData = {
        tasks: [
          {
            date: '2024-01-15',
            topic: 'Equações do 2º Grau',
            description: 'Revisar fórmula de Bhaskara',
            duration: '30 minutos',
          },
          {
            date: '2024-01-16',
            topic: 'Fatoração',
            description: 'Praticar fatoração de polinômios',
            duration: '45 minutos',
          },
        ],
      };
      
      const planId = await db.createMistakeNotebookStudyPlan({
        studentId: testStudentId,
        title: 'Plano de Estudos - Janeiro 2024',
        description: 'Foco em álgebra',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-31'),
        planData: JSON.stringify(planData),
        totalTasks: planData.tasks.length,
        completedTasks: 0,
        progressPercentage: 0,
      });
      
      expect(planId).toBeGreaterThan(0);
      testPlanId = planId;
    });
    
    it('deve listar planos de estudo', async () => {
      const plans = await db.getMistakeNotebookStudyPlans(testStudentId);
      
      expect(Array.isArray(plans)).toBe(true);
      expect(plans.length).toBeGreaterThan(0);
      
      const plan = plans[0];
      expect(plan).toHaveProperty('title');
      expect(plan).toHaveProperty('startDate');
      expect(plan).toHaveProperty('endDate');
      expect(plan).toHaveProperty('totalTasks');
      expect(plan).toHaveProperty('progressPercentage');
    });
    
    it('deve atualizar progresso do plano', async () => {
      await db.updateStudyPlanProgress(testPlanId, 1);
      
      const plans = await db.getMistakeNotebookStudyPlans(testStudentId);
      const updatedPlan = plans.find(p => p.id === testPlanId);
      
      expect(updatedPlan?.completedTasks).toBe(1);
      expect(updatedPlan?.progressPercentage).toBeGreaterThan(0);
    });
    
    it('deve marcar plano como concluído ao completar todas as tarefas', async () => {
      const plans = await db.getMistakeNotebookStudyPlans(testStudentId);
      const plan = plans.find(p => p.id === testPlanId);
      
      if (plan) {
        await db.updateStudyPlanProgress(testPlanId, plan.totalTasks);
        
        const updatedPlans = await db.getMistakeNotebookStudyPlans(testStudentId);
        const completedPlan = updatedPlans.find(p => p.id === testPlanId);
        
        expect(completedPlan?.progressPercentage).toBe(100);
        expect(completedPlan?.status).toBe('completed');
      }
    });
  });
  
  describe('Estatísticas Gerais', () => {
    it('deve obter estatísticas gerais do caderno', async () => {
      const stats = await db.getMistakeNotebookStats(testStudentId);
      
      expect(stats).toHaveProperty('totalQuestions');
      expect(stats).toHaveProperty('totalAttempts');
      expect(stats).toHaveProperty('correctAttempts');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('questionsBySubject');
      expect(stats).toHaveProperty('totalTopics');
      expect(stats).toHaveProperty('criticalTopics');
      expect(stats).toHaveProperty('highPriorityTopics');
      
      expect(stats.totalQuestions).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeLessThanOrEqual(100);
    });
    
    it('deve calcular taxa de sucesso corretamente', async () => {
      const stats = await db.getMistakeNotebookStats(testStudentId);
      
      if (stats.totalAttempts > 0) {
        const expectedRate = (stats.correctAttempts / stats.totalAttempts) * 100;
        expect(Math.abs(stats.successRate - expectedRate)).toBeLessThan(0.01);
      }
    });
  });
});
