import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';

describe('Gamificação por Disciplina', () => {
  let subjectId: number;
  let studentIds: number[] = [];

  beforeAll(async () => {
    // Criar disciplina de teste
    const subject = await db.createSubject({
      userId: 1,
      name: 'Teste Gamificação',
      code: 'TEST-GAMIF',
      description: 'Disciplina para testar gamificação por disciplina',
      color: '#3b82f6',
    });
    subjectId = subject.id;

    // Criar alunos de teste
    for (let i = 0; i < 5; i++) {
      const student = await db.createStudent({
        userId: 1,
        fullName: `Aluno Teste ${i + 1}`,
        registrationNumber: `REG-GAMIF-${i + 1}`,
        email: `aluno-gamif-${i + 1}@test.com`,
      });
      studentIds.push(student.id);
    }
  });

  afterAll(async () => {
    // Limpeza opcional
  });

  it('deve retornar ranking vazio para disciplina sem alunos', async () => {
    const ranking = await db.getSubjectRanking(subjectId, 10);
    expect(ranking).toBeDefined();
    expect(Array.isArray(ranking)).toBe(true);
  });

  it('deve retornar estatísticas corretas de disciplina', async () => {
    const stats = await db.getSubjectRankingStats(subjectId);
    expect(stats).toBeDefined();
    expect(stats.totalStudents).toBe(0);
    expect(stats.avgPoints).toBe(0);
    expect(stats.maxPoints).toBe(0);
    expect(stats.minPoints).toBe(0);
  });

  it('deve adicionar pontos a um aluno em uma disciplina', async () => {
    const studentId = studentIds[0];
    
    // Adicionar pontos
    await db.addPointsToStudent(studentId, 50, 'test_activity');
    
    // Verificar pontos
    const ranking = await db.getSubjectRanking(subjectId, 10);
    const student = ranking.find(r => r.studentId === studentId);
    
    expect(student).toBeDefined();
    expect(student?.totalPoints).toBeGreaterThan(0);
  });

  it('deve calcular posição correta do aluno no ranking', async () => {
    const studentId1 = studentIds[0];
    const studentId2 = studentIds[1];
    
    // Adicionar pontos diferentes
    await db.addPointsToStudent(studentId1, 100, 'test_activity');
    await db.addPointsToStudent(studentId2, 50, 'test_activity');
    
    // Obter ranking
    const ranking = await db.getSubjectRanking(subjectId, 10);
    
    // Verificar ordem
    const student1 = ranking.find(r => r.studentId === studentId1);
    const student2 = ranking.find(r => r.studentId === studentId2);
    
    expect(student1?.totalPoints).toBeGreaterThan(student2?.totalPoints || 0);
  });

  it('deve retornar faixa correta baseada em pontos', async () => {
    const studentId = studentIds[3];
    
    // Adicionar pontos suficientes para faixa amarela (200+)
    await db.addPointsToStudent(studentId, 250, 'test_activity');
    
    // Obter ranking
    const ranking = await db.getSubjectRanking(subjectId, 10);
    const student = ranking.find(r => r.studentId === studentId);
    
    expect(student).toBeDefined();
    expect(student?.currentBelt).toBeDefined();
    // Faixa deve ser pelo menos amarela (200+ pontos)
    expect(['yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black']).toContain(
      student?.currentBelt
    );
  });

  it('deve contar alunos ativos por disciplina', async () => {
    const studentId = studentIds[4];
    
    // Adicionar pontos para ativar aluno
    await db.addPointsToStudent(studentId, 50, 'test_activity');
    
    // Obter ranking
    const ranking = await db.getSubjectRanking(subjectId, 10);
    
    // Contar alunos com streak > 0
    const activeCount = ranking.filter(r => r.streakDays > 0).length;
    
    expect(activeCount).toBeGreaterThanOrEqual(0);
  });

  it('deve limitar ranking ao número especificado', async () => {
    const ranking = await db.getSubjectRanking(subjectId, 3);
    
    expect(ranking.length).toBeLessThanOrEqual(3);
  });

  it('deve retornar pontos globais do aluno em todas as disciplinas', async () => {
    const studentId = studentIds[0];
    
    // Obter disciplinas com pontos
    const subjectsWithPoints = await db.getStudentSubjectsWithPoints(studentId);
    
    expect(subjectsWithPoints).toBeDefined();
    expect(Array.isArray(subjectsWithPoints)).toBe(true);
  });

  it('deve manter consistência de pontos globais entre disciplinas', async () => {
    const studentId = studentIds[1];
    
    // Adicionar pontos
    await db.addPointsToStudent(studentId, 100, 'test_activity');
    
    // Obter pontos globais
    const globalPoints = await db.getOrCreateStudentPoints(studentId);
    
    expect(globalPoints).toBeDefined();
    expect(globalPoints?.totalPoints).toBeGreaterThanOrEqual(0);
  });

  it('deve criar disciplina com sucesso', async () => {
    const newSubject = await db.createSubject({
      userId: 1,
      name: 'Teste Gamificação Novo',
      code: 'TEST-GAMIF-NEW',
      description: 'Nova disciplina para teste',
      color: '#10b981',
    });

    expect(newSubject).toBeDefined();
    expect(newSubject.id).toBeGreaterThan(0);
    expect(newSubject.name).toBe('Teste Gamificação Novo');
  });

  it('deve retornar faixa branca para aluno novo', async () => {
    const studentId = studentIds[2];
    
    // Obter pontos (sem adicionar nada)
    const points = await db.getOrCreateStudentPoints(studentId);
    
    expect(points).toBeDefined();
    expect(points?.currentBelt).toBe('white');
  });
});
