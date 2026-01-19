import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Sistema de Dúvidas e Respostas', () => {
  let testUserId: number;
  let testStudentId: number;
  let testSubjectId: number;
  let testQuestionId: number;

  beforeAll(async () => {
    // Criar usuário de teste (professor)
    const openId = `test-questions-${Date.now()}`;
    await db.upsertUser({
      openId,
      name: 'Professor Teste Dúvidas',
      email: `test-questions-${Date.now()}@test.com`,
      role: 'user',
      profile: 'traditional',
      active: true,
      approvalStatus: 'approved',
    });
    
    const user = await db.getUserByOpenId(openId);
    testUserId = user!.id;

    // Criar disciplina de teste
    testSubjectId = await db.createSubject({
      name: 'Matemática Teste',
      code: `MAT-${Date.now()}`,
      description: 'Disciplina para testes de dúvidas',
      color: '#3b82f6',
      userId: testUserId,
      workload: 60,
      computationalThinkingEnabled: false,
    });

    // Criar aluno de teste
    testStudentId = await db.createStudent({
      userId: testUserId,
      registrationNumber: `REG-${Date.now()}`,
      fullName: 'Aluno Teste Dúvidas',
      email: `student-test-${Date.now()}@test.com`,
      birthDate: '2000-01-01',
      enrollmentDate: new Date().toISOString().split('T')[0],
      status: 'active',
    });
  });

  it('deve criar uma nova dúvida', async () => {
    testQuestionId = await db.createQuestion({
      studentId: testStudentId,
      userId: testUserId,
      subjectId: testSubjectId,
      title: 'Dúvida sobre equações',
      content: 'Como resolver equações de segundo grau?',
      priority: 'normal',
      isAnonymous: false,
      status: 'pending',
      viewCount: 0,
    });

    expect(testQuestionId).toBeGreaterThan(0);
  });

  it('deve listar dúvidas do professor', async () => {
    const questions = await db.getQuestionsByTeacher(testUserId);
    
    expect(questions).toBeDefined();
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0].question.title).toBe('Dúvida sobre equações');
  });

  it('deve listar dúvidas do aluno', async () => {
    const questions = await db.getQuestionsByStudent(testStudentId);
    
    expect(questions).toBeDefined();
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0].question.studentId).toBe(testStudentId);
  });

  it('deve buscar dúvida por ID', async () => {
    const question = await db.getQuestionById(testQuestionId);
    
    expect(question).toBeDefined();
    expect(question?.question.id).toBe(testQuestionId);
    expect(question?.question.title).toBe('Dúvida sobre equações');
  });

  it('deve incrementar contador de visualizações', async () => {
    const before = await db.getQuestionById(testQuestionId);
    const viewCountBefore = before?.question.viewCount || 0;

    await db.incrementQuestionViewCount(testQuestionId);

    const after = await db.getQuestionById(testQuestionId);
    const viewCountAfter = after?.question.viewCount || 0;

    expect(viewCountAfter).toBe(viewCountBefore + 1);
  });

  it('deve criar resposta para dúvida', async () => {
    const answerId = await db.createQuestionAnswer({
      questionId: testQuestionId,
      userId: testUserId,
      content: 'Para resolver equações de segundo grau, use a fórmula de Bhaskara.',
      isAccepted: false,
      helpful: 0,
    });

    expect(answerId).toBeGreaterThan(0);

    // Verificar se status da dúvida mudou para "answered"
    const question = await db.getQuestionById(testQuestionId);
    expect(question?.question.status).toBe('answered');
  });

  it('deve listar respostas de uma dúvida', async () => {
    const answers = await db.getAnswersByQuestion(testQuestionId);
    
    expect(answers).toBeDefined();
    expect(answers.length).toBeGreaterThan(0);
    expect(answers[0].answer.questionId).toBe(testQuestionId);
  });

  it('deve marcar dúvida como resolvida', async () => {
    const result = await db.markQuestionAsResolved(testQuestionId, testUserId);
    
    expect(result.success).toBe(true);

    const question = await db.getQuestionById(testQuestionId);
    expect(question?.question.status).toBe('resolved');
  });

  it('deve filtrar dúvidas por status', async () => {
    // Criar nova dúvida pendente
    const pendingQuestionId = await db.createQuestion({
      studentId: testStudentId,
      userId: testUserId,
      subjectId: testSubjectId,
      title: 'Outra dúvida',
      content: 'Conteúdo da dúvida',
      priority: 'normal',
      isAnonymous: false,
      status: 'pending',
      viewCount: 0,
    });

    const pendingQuestions = await db.getQuestionsByTeacher(testUserId, { status: 'pending' });
    const resolvedQuestions = await db.getQuestionsByTeacher(testUserId, { status: 'resolved' });

    expect(pendingQuestions.some(q => q.question.id === pendingQuestionId)).toBe(true);
    expect(resolvedQuestions.some(q => q.question.id === testQuestionId)).toBe(true);
  });

  it('deve filtrar dúvidas por prioridade', async () => {
    // Criar dúvida urgente
    const urgentQuestionId = await db.createQuestion({
      studentId: testStudentId,
      userId: testUserId,
      subjectId: testSubjectId,
      title: 'Dúvida urgente',
      content: 'Preciso de ajuda urgente!',
      priority: 'urgent',
      isAnonymous: false,
      status: 'pending',
      viewCount: 0,
    });

    const urgentQuestions = await db.getQuestionsByTeacher(testUserId, { priority: 'urgent' });

    expect(urgentQuestions.some(q => q.question.id === urgentQuestionId)).toBe(true);
    expect(urgentQuestions.every(q => q.question.priority === 'urgent')).toBe(true);
  });

  it('deve buscar estatísticas de dúvidas', async () => {
    const stats = await db.getQuestionStatistics(testUserId);

    expect(stats).toBeDefined();
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.pending).toBeGreaterThanOrEqual(0);
    expect(stats.answered).toBeGreaterThanOrEqual(0);
    expect(stats.resolved).toBeGreaterThanOrEqual(0);
    expect(stats.urgent).toBeGreaterThanOrEqual(0);
  });

  it('deve atualizar prioridade da dúvida', async () => {
    // Criar nova dúvida
    const questionId = await db.createQuestion({
      studentId: testStudentId,
      userId: testUserId,
      subjectId: testSubjectId,
      title: 'Dúvida para testar prioridade',
      content: 'Conteúdo',
      priority: 'normal',
      isAnonymous: false,
      status: 'pending',
      viewCount: 0,
    });

    // Atualizar prioridade
    await db.updateQuestionPriority(questionId, 'high', testUserId);

    // Verificar mudança
    const question = await db.getQuestionById(questionId);
    expect(question?.question.priority).toBe('high');
  });
});
