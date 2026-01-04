import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

describe('Subject Details Routes', () => {
  let testUserId: number;
  let testSubjectId: number;
  let testStudentId: number;

  beforeAll(async () => {
    // Criar usuário de teste (professor)
    const openId = `test-subject-details-${Date.now()}`;
    await db.upsertUser({
      openId,
      name: 'Professor Teste Subject Details',
      email: `test-subject-details-${Date.now()}@test.com`,
      role: 'user',
    });
    const user = await db.getUserByOpenId(openId);
    if (!user) throw new Error('Failed to create test user');
    testUserId = user.id;

    // Criar disciplina de teste
    const subject = await db.createSubject({
      name: 'Disciplina Teste Details',
      code: 'TEST-DETAILS-001',
      description: 'Disciplina para testar visualização de detalhes',
      color: '#3B82F6',
      userId: testUserId,
      computationalThinkingEnabled: true,
    });
    testSubjectId = subject.id;

    // Criar aluno de teste
    const student = await db.createStudent({
      registrationNumber: `REG-DETAILS-${Date.now()}`,
      fullName: 'Aluno Teste Details',
      password: 'senha123',
      userId: testUserId,
    });
    testStudentId = student.id;

    // Matricular aluno na disciplina
    await db.enrollStudentInSubject(testStudentId, testSubjectId, testUserId);
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (testStudentId && testSubjectId) {
      const enrollments = await db.getStudentsBySubject(testSubjectId, testUserId);
      for (const enrollment of enrollments) {
        if (enrollment.studentId === testStudentId) {
          await db.unenrollStudentFromSubject(enrollment.id, testUserId);
        }
      }
    }
    if (testStudentId) {
      await db.deleteStudent(testStudentId, testUserId);
    }
    if (testSubjectId) {
      await db.deleteSubject(testSubjectId, testUserId);
    }
    if (testUserId) {
      await db.permanentDeleteUser(testUserId);
    }
  });

  describe('subjects.getById', () => {
    it('deve retornar disciplina existente', async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, name: 'Professor Teste', role: 'user' },
        studentSession: null,
      } as TrpcContext);

      const result = await caller.subjects.getById({ id: testSubjectId });

      expect(result).toBeDefined();
      expect(result.id).toBe(testSubjectId);
      expect(result.name).toBe('Disciplina Teste Details');
      expect(result.code).toBe('TEST-DETAILS-001');
      expect(result.computationalThinkingEnabled).toBe(true);
    });

    it('deve lançar erro NOT_FOUND para disciplina inexistente', async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, name: 'Professor Teste', role: 'user' },
        studentSession: null,
      } as TrpcContext);

      await expect(
        caller.subjects.getById({ id: 999999 })
      ).rejects.toThrow('Disciplina não encontrada');
    });

    it('não deve retornar disciplina de outro professor', async () => {
      // Criar outro usuário
      const otherOpenId = `test-other-user-${Date.now()}`;
      await db.upsertUser({
        openId: otherOpenId,
        name: 'Outro Professor',
        email: `other-${Date.now()}@test.com`,
        role: 'user',
      });
      const otherUser = await db.getUserByOpenId(otherOpenId);
      if (!otherUser) throw new Error('Failed to create other user');

      const caller = appRouter.createCaller({
        user: { id: otherUser.id, name: 'Outro Professor', role: 'user' },
        studentSession: null,
      } as TrpcContext);

      await expect(
        caller.subjects.getById({ id: testSubjectId })
      ).rejects.toThrow('Disciplina não encontrada');

      // Limpar
      await db.permanentDeleteUser(otherUser.id);
    });
  });

  describe('studentExercises.listBySubject', () => {
    it('deve retornar array vazio para disciplina sem exercícios', async () => {
      const caller = appRouter.createCaller({
        user: null,
        studentSession: {
          studentId: testStudentId,
          registrationNumber: `REG-DETAILS-${Date.now()}`,
          fullName: 'Aluno Teste Details',
          professorId: testUserId,
        },
      } as TrpcContext);

      const result = await caller.studentExercises.listBySubject({ 
        subjectId: testSubjectId 
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // Como não criamos exercícios, esperamos array vazio
      expect(result.length).toBe(0);
    });

    it('deve lançar erro UNAUTHORIZED se não houver sessão de aluno', async () => {
      const caller = appRouter.createCaller({
        user: null,
        studentSession: null,
      } as TrpcContext);

      await expect(
        caller.studentExercises.listBySubject({ subjectId: testSubjectId })
      ).rejects.toThrow('Acesso restrito a alunos');
    });
  });
});
