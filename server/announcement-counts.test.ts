import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';
import { getDb } from './db';
import { users, subjects, announcements } from '../drizzle/schema';

describe('Announcement Counts by Subject', () => {
  let testUserId: number;
  let testSubject1Id: number;
  let testSubject2Id: number;
  let testSubject3Id: number;

  beforeAll(async () => {
    const database = await getDb();
    if (!database) throw new Error('Database not available');

    // Criar usuário de teste
    const userResult = await database.insert(users).values({
      openId: `test-announcement-counts-${Date.now()}`,
      name: 'Test User Announcements',
      email: `test-announcements-${Date.now()}@test.com`,
      role: 'user',
    });
    testUserId = Number(userResult[0].insertId);

    // Criar disciplinas de teste
    const subject1Result = await database.insert(subjects).values({
      name: 'Matemática',
      code: 'MAT001',
      userId: testUserId,
    });
    testSubject1Id = Number(subject1Result[0].insertId);

    const subject2Result = await database.insert(subjects).values({
      name: 'Português',
      code: 'POR001',
      userId: testUserId,
    });
    testSubject2Id = Number(subject2Result[0].insertId);

    const subject3Result = await database.insert(subjects).values({
      name: 'História',
      code: 'HIS001',
      userId: testUserId,
    });
    testSubject3Id = Number(subject3Result[0].insertId);
  });

  afterAll(async () => {
    // Limpar dados de teste
    const database = await getDb();
    if (database) {
      try {
        // Deletar avisos
        await database.execute(`DELETE FROM announcements WHERE userId = ${testUserId}`);
        // Deletar disciplinas
        await database.execute(`DELETE FROM subjects WHERE userId = ${testUserId}`);
        // Deletar usuário
        await database.execute(`DELETE FROM users WHERE id = ${testUserId}`);
      } catch (error) {
        console.error('Erro ao limpar dados de teste:', error);
      }
    }
  });

  it('deve retornar contadores vazios quando não há avisos', async () => {
    const counts = await db.getAnnouncementCountsBySubject(testUserId);
    
    expect(counts).toBeDefined();
    expect(typeof counts).toBe('object');
    expect(counts[testSubject1Id] || 0).toBe(0);
    expect(counts[testSubject2Id] || 0).toBe(0);
    expect(counts[testSubject3Id] || 0).toBe(0);
  });

  it('deve contar avisos corretamente por disciplina', async () => {
    const database = await getDb();
    if (!database) throw new Error('Database not available');

    // Criar avisos para diferentes disciplinas
    await database.insert(announcements).values({
      title: 'Aviso 1 - Matemática',
      message: 'Conteúdo do aviso 1',
      isImportant: false,
      subjectId: testSubject1Id,
      userId: testUserId,
    });

    await database.insert(announcements).values({
      title: 'Aviso 2 - Matemática',
      message: 'Conteúdo do aviso 2',
      isImportant: true,
      subjectId: testSubject1Id,
      userId: testUserId,
    });

    await database.insert(announcements).values({
      title: 'Aviso 3 - Matemática',
      message: 'Conteúdo do aviso 3',
      isImportant: false,
      subjectId: testSubject1Id,
      userId: testUserId,
    });

    await database.insert(announcements).values({
      title: 'Aviso 1 - Português',
      message: 'Conteúdo do aviso de português',
      isImportant: false,
      subjectId: testSubject2Id,
      userId: testUserId,
    });

    const counts = await db.getAnnouncementCountsBySubject(testUserId);
    
    expect(counts[testSubject1Id]).toBe(3);
    expect(counts[testSubject2Id]).toBe(1);
    expect(counts[testSubject3Id] || 0).toBe(0);
  });

  it('deve retornar apenas avisos do usuário correto', async () => {
    const database = await getDb();
    if (!database) throw new Error('Database not available');

    // Criar outro usuário
    const otherUserResult = await database.insert(users).values({
      openId: `test-other-user-${Date.now()}`,
      name: 'Other User',
      email: `other-${Date.now()}@test.com`,
      role: 'user',
    });
    const otherUserId = Number(otherUserResult[0].insertId);

    // Criar disciplina para outro usuário
    const otherSubjectResult = await database.insert(subjects).values({
      name: 'Física',
      code: 'FIS001',
      userId: otherUserId,
    });
    const otherSubjectId = Number(otherSubjectResult[0].insertId);

    // Criar aviso para outro usuário
    await database.insert(announcements).values({
      title: 'Aviso do outro usuário',
      message: 'Este aviso não deve ser contado',
      isImportant: false,
      subjectId: otherSubjectId,
      userId: otherUserId,
    });

    const counts = await db.getAnnouncementCountsBySubject(testUserId);
    
    // Verificar que o aviso do outro usuário não é contado
    expect(counts[otherSubjectId]).toBeUndefined();
    
    // Limpar dados do outro usuário
    if (database) {
      await database.execute(`DELETE FROM announcements WHERE userId = ${otherUserId}`);
      await database.execute(`DELETE FROM subjects WHERE userId = ${otherUserId}`);
      await database.execute(`DELETE FROM users WHERE id = ${otherUserId}`);
    }
  });

  it('deve retornar objeto vazio para usuário sem avisos', async () => {
    const database = await getDb();
    if (!database) throw new Error('Database not available');

    const newUserResult = await database.insert(users).values({
      openId: `test-no-announcements-${Date.now()}`,
      name: 'User Without Announcements',
      email: `no-announcements-${Date.now()}@test.com`,
      role: 'user',
    });
    const newUserId = Number(newUserResult[0].insertId);

    const counts = await db.getAnnouncementCountsBySubject(newUserId);
    
    expect(counts).toBeDefined();
    expect(typeof counts).toBe('object');
    expect(Object.keys(counts).length).toBe(0);

    // Limpar
    if (database) {
      await database.execute(`DELETE FROM users WHERE id = ${newUserId}`);
    }
  });
});
