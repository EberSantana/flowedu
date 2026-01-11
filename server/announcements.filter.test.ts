import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";
import { getDb } from "./db";
import { users, subjects, students, subjectEnrollments, announcements } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Filtro de Avisos por Disciplina", () => {
  let testProfessorId: number;
  let testStudentId: number;
  let testSubject1Id: number;
  let testSubject2Id: number;
  let testAnnouncement1Id: number;
  let testAnnouncement2Id: number;

  beforeAll(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // Criar professor de teste
    const [professor] = await database.insert(users).values({
      openId: `test-professor-filter-${Date.now()}`,
      name: "Professor Teste Filtro",
      email: `professor-filter-${Date.now()}@test.com`,
      role: "user",
    });
    testProfessorId = professor.insertId;

    // Criar aluno de teste
    const [student] = await database.insert(students).values({
      userId: testProfessorId,
      fullName: "Aluno Teste Filtro",
      registrationNumber: `REG-FILTER-${Date.now()}`,
      passwordHash: "hash123",
      email: `aluno-filter-${Date.now()}@test.com`,
    });
    testStudentId = student.insertId;

    // Criar duas disciplinas
    const [subject1] = await database.insert(subjects).values({
      userId: testProfessorId,
      name: "Matemática Teste",
      code: `MAT-${Date.now()}`,
      workload: 60,
    });
    testSubject1Id = subject1.insertId;

    const [subject2] = await database.insert(subjects).values({
      userId: testProfessorId,
      name: "Português Teste",
      code: `PORT-${Date.now()}`,
      workload: 60,
    });
    testSubject2Id = subject2.insertId;

    // Matricular aluno nas duas disciplinas
    await database.insert(subjectEnrollments).values({
      studentId: testStudentId,
      subjectId: testSubject1Id,
      userId: testProfessorId,
      status: "active",
    });

    await database.insert(subjectEnrollments).values({
      studentId: testStudentId,
      subjectId: testSubject2Id,
      userId: testProfessorId,
      status: "active",
    });

    // Criar avisos para cada disciplina
    const [announcement1] = await database.insert(announcements).values({
      title: "Aviso de Matemática",
      message: "Prova na próxima semana",
      isImportant: false,
      subjectId: testSubject1Id,
      userId: testProfessorId,
    });
    testAnnouncement1Id = announcement1.insertId;

    const [announcement2] = await database.insert(announcements).values({
      title: "Aviso de Português",
      message: "Trabalho para entregar",
      isImportant: true,
      subjectId: testSubject2Id,
      userId: testProfessorId,
    });
    testAnnouncement2Id = announcement2.insertId;
  });

  afterAll(async () => {
    const database = await getDb();
    if (!database) return;

    // Limpar dados de teste
    await database.delete(announcements).where(eq(announcements.id, testAnnouncement1Id));
    await database.delete(announcements).where(eq(announcements.id, testAnnouncement2Id));
    await database.delete(subjectEnrollments).where(eq(subjectEnrollments.studentId, testStudentId));
    await database.delete(subjects).where(eq(subjects.id, testSubject1Id));
    await database.delete(subjects).where(eq(subjects.id, testSubject2Id));
    await database.delete(students).where(eq(students.id, testStudentId));
    await database.delete(users).where(eq(users.id, testProfessorId));
  });

  it("deve retornar todos os avisos quando nenhum filtro é aplicado", async () => {
    const result = await db.getAnnouncementsForStudent(testStudentId);
    
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThanOrEqual(2);
    
    const mathAnnouncement = result.find(a => a.id === testAnnouncement1Id);
    const portugueseAnnouncement = result.find(a => a.id === testAnnouncement2Id);
    
    expect(mathAnnouncement).toBeDefined();
    expect(mathAnnouncement?.title).toBe("Aviso de Matemática");
    expect(portugueseAnnouncement).toBeDefined();
    expect(portugueseAnnouncement?.title).toBe("Aviso de Português");
  });

  it("deve retornar apenas avisos de Matemática quando filtrado", async () => {
    const result = await db.getAnnouncementsForStudent(testStudentId, testSubject1Id);
    
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThanOrEqual(1);
    
    // Todos os avisos devem ser da disciplina de Matemática
    const allFromMath = result.every(a => a.subjectId === testSubject1Id);
    expect(allFromMath).toBe(true);
    
    const mathAnnouncement = result.find(a => a.id === testAnnouncement1Id);
    expect(mathAnnouncement).toBeDefined();
    expect(mathAnnouncement?.title).toBe("Aviso de Matemática");
    
    // Não deve conter aviso de Português
    const portugueseAnnouncement = result.find(a => a.id === testAnnouncement2Id);
    expect(portugueseAnnouncement).toBeUndefined();
  });

  it("deve retornar apenas avisos de Português quando filtrado", async () => {
    const result = await db.getAnnouncementsForStudent(testStudentId, testSubject2Id);
    
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThanOrEqual(1);
    
    // Todos os avisos devem ser da disciplina de Português
    const allFromPortuguese = result.every(a => a.subjectId === testSubject2Id);
    expect(allFromPortuguese).toBe(true);
    
    const portugueseAnnouncement = result.find(a => a.id === testAnnouncement2Id);
    expect(portugueseAnnouncement).toBeDefined();
    expect(portugueseAnnouncement?.title).toBe("Aviso de Português");
    
    // Não deve conter aviso de Matemática
    const mathAnnouncement = result.find(a => a.id === testAnnouncement1Id);
    expect(mathAnnouncement).toBeUndefined();
  });

  it("deve retornar array vazio quando filtrado por disciplina sem avisos", async () => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // Criar uma disciplina sem avisos
    const [subject3] = await database.insert(subjects).values({
      userId: testProfessorId,
      name: "História Teste",
      code: `HIST-${Date.now()}`,
      workload: 60,
    });
    const testSubject3Id = subject3.insertId;

    // Matricular aluno
    await database.insert(subjectEnrollments).values({
      studentId: testStudentId,
      subjectId: testSubject3Id,
      userId: testProfessorId,
      status: "active",
    });

    const result = await db.getAnnouncementsForStudent(testStudentId, testSubject3Id);
    
    expect(result).toBeDefined();
    expect(result.length).toBe(0);

    // Limpar
    await database.delete(subjectEnrollments).where(and(
      eq(subjectEnrollments.studentId, testStudentId),
      eq(subjectEnrollments.subjectId, testSubject3Id)
    ));
    await database.delete(subjects).where(eq(subjects.id, testSubject3Id));
  });

  it("deve manter ordenação por importância e data quando filtrado", async () => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // Criar mais avisos para testar ordenação
    const [announcement3] = await database.insert(announcements).values({
      title: "Aviso Importante de Matemática",
      message: "Aviso urgente",
      isImportant: true,
      subjectId: testSubject1Id,
      userId: testProfessorId,
    });

    const result = await db.getAnnouncementsForStudent(testStudentId, testSubject1Id);
    
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThanOrEqual(2);
    
    // Verificar que avisos importantes vêm primeiro
    const firstImportantIndex = result.findIndex(a => a.isImportant);
    const firstNonImportantIndex = result.findIndex(a => !a.isImportant);
    
    if (firstImportantIndex !== -1 && firstNonImportantIndex !== -1) {
      expect(firstImportantIndex).toBeLessThan(firstNonImportantIndex);
    }

    // Limpar
    await database.delete(announcements).where(eq(announcements.id, announcement3.insertId));
  });
});
