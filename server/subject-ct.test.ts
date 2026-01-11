import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Sistema de Pensamento Computacional por Disciplina', () => {
  let testUserId: number;
  let testSubjectId: number;
  let testStudentId: number;

  beforeAll(async () => {
    // Criar usuário de teste
    await db.upsertUser({
      openId: 'test-pc-user-999999',
      name: 'Test PC User',
      email: 'test-pc@example.com',
      role: 'user',
    });
    
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error('Database not available');
    
    const { users } = await import('../drizzle/schema');
    const { eq } = await import('drizzle-orm');
    
    const [user] = await dbInstance.select().from(users).where(eq(users.openId, 'test-pc-user-999999'));
    testUserId = user.id;
    
    // Criar disciplina de teste
    const subject = await db.createSubject({
      name: 'Disciplina PC Test',
      code: 'PC-TEST-001',
      description: 'Disciplina para testar PC',
      userId: testUserId,
      computationalThinkingEnabled: false,
    });
    testSubjectId = subject.id;
    
    // Criar aluno de teste com timestamp único
    const timestamp = Date.now();
    const student = await db.createStudent({
      registrationNumber: `PC-STUDENT-${timestamp}`,
      fullName: 'Aluno PC Test',
      userId: testUserId,
    });
    testStudentId = student.id;
    
    // Matricular aluno na disciplina
    await db.enrollStudentInSubject(testStudentId, testSubjectId, testUserId);
  });

  it('deve habilitar Pensamento Computacional em uma disciplina', async () => {
    const updated = await db.toggleSubjectCT(testSubjectId, testUserId, true);
    
    expect(updated).toBeDefined();
    expect(updated.computationalThinkingEnabled).toBe(true);
  });

  it('deve desabilitar Pensamento Computacional em uma disciplina', async () => {
    const updated = await db.toggleSubjectCT(testSubjectId, testUserId, false);
    
    expect(updated).toBeDefined();
    expect(updated.computationalThinkingEnabled).toBe(false);
  });

  it('deve retornar estatísticas vazias quando não há pontuações', async () => {
    const stats = await db.getCTStatsBySubject(testUserId, testSubjectId);
    
    expect(stats).toBeDefined();
    expect(stats.students).toBeDefined();
    expect(Array.isArray(stats.students)).toBe(true);
    expect(stats.classAverage).toBeDefined();
    expect(stats.classAverage.decomposition).toBe(0);
    expect(stats.classAverage.pattern_recognition).toBe(0);
    expect(stats.classAverage.abstraction).toBe(0);
    expect(stats.classAverage.algorithms).toBe(0);
  });

  it('deve adicionar pontuação de PC para um aluno', async () => {
    await db.updateCTScore(testStudentId, testSubjectId, 'decomposition', 50);
    await db.updateCTScore(testStudentId, testSubjectId, 'pattern_recognition', 60);
    await db.updateCTScore(testStudentId, testSubjectId, 'abstraction', 70);
    await db.updateCTScore(testStudentId, testSubjectId, 'algorithms', 80);
    
    const profile = await db.getStudentCTProfile(testStudentId, testSubjectId);
    
    expect(profile).toBeDefined();
    expect(profile?.decomposition.score).toBe(50);
    expect(profile?.pattern_recognition.score).toBe(60);
    expect(profile?.abstraction.score).toBe(70);
    expect(profile?.algorithms.score).toBe(80);
  });

  it('deve retornar estatísticas da turma com pontuações', async () => {
    const stats = await db.getCTStatsBySubject(testUserId, testSubjectId);
    
    expect(stats).toBeDefined();
    expect(stats.students.length).toBeGreaterThan(0);
    
    const student = stats.students.find(s => s.studentId === testStudentId);
    expect(student).toBeDefined();
    expect(student?.decomposition).toBe(50);
    expect(student?.pattern_recognition).toBe(60);
    expect(student?.abstraction).toBe(70);
    expect(student?.algorithms).toBe(80);
    expect(student?.average).toBe(65); // (50+60+70+80)/4 = 65
  });

  it('deve calcular média da turma corretamente', async () => {
    const stats = await db.getCTStatsBySubject(testUserId, testSubjectId);
    
    expect(stats.classAverage).toBeDefined();
    expect(stats.classAverage.decomposition).toBe(50);
    expect(stats.classAverage.pattern_recognition).toBe(60);
    expect(stats.classAverage.abstraction).toBe(70);
    expect(stats.classAverage.algorithms).toBe(80);
  });

  it('deve retornar evolução vazia quando não há submissões', async () => {
    const evolution = await db.getStudentCTEvolution(testStudentId, testSubjectId);
    
    expect(evolution).toBeDefined();
    expect(evolution.totalSubmissions).toBe(0);
    expect(evolution.evolution).toBeDefined();
    expect(evolution.evolution.decomposition).toEqual([]);
    expect(evolution.evolution.pattern_recognition).toEqual([]);
    expect(evolution.evolution.abstraction).toEqual([]);
    expect(evolution.evolution.algorithms).toEqual([]);
    expect(evolution.currentProfile).toBeDefined();
  });

  it('deve retornar perfil atual na evolução', async () => {
    const evolution = await db.getStudentCTEvolution(testStudentId, testSubjectId);
    
    expect(evolution.currentProfile).toBeDefined();
    expect(evolution.currentProfile?.decomposition.score).toBe(50);
    expect(evolution.currentProfile?.pattern_recognition.score).toBe(60);
    expect(evolution.currentProfile?.abstraction.score).toBe(70);
    expect(evolution.currentProfile?.algorithms.score).toBe(80);
  });
});
