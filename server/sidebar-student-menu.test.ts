import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

describe("Sidebar - Menu do Aluno", () => {
  let testUserId: number;
  let testStudentId: number;

  beforeAll(async () => {
    // Criar usuário de teste (professor)
    const openId = `openid-sidebar-${Date.now()}`;
    await db.upsertUser({
      openId,
      name: "Professor Teste Sidebar",
      email: `prof-sidebar-${Date.now()}@teste.com`,
      role: "user",
    });
    const user = await db.getUserByOpenId(openId);
    if (!user) throw new Error("Falha ao criar usuário de teste");
    testUserId = user.id;

    // Criar aluno de teste
    const student = await db.createStudent({
      userId: testUserId,
      registrationNumber: `REG-SIDEBAR-${Date.now()}`,
      fullName: "Aluno Teste Sidebar",
      email: `aluno-sidebar-${Date.now()}@teste.com`,
    });
    testStudentId = student.id;
  });

  it("deve retornar sessão de aluno quando há studentSession no contexto", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: null,
      studentSession: {
        userType: "student",
        studentId: testStudentId,
        registrationNumber: "REG-SIDEBAR-TEST",
        fullName: "Aluno Teste",
        professorId: testUserId,
      },
      userType: "student",
    } as TrpcContext);

    const session = await caller.auth.studentSession();

    expect(session).toBeDefined();
    expect(session?.userType).toBe("student");
    expect(session?.studentId).toBe(testStudentId);
  });

  it("deve retornar null quando não há sessão de aluno", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: { id: testUserId, name: "Professor", role: "user" },
      studentSession: null,
      userType: "teacher",
    } as TrpcContext);

    const session = await caller.auth.studentSession();

    expect(session).toBeNull();
  });

  it("deve permitir acesso às rotas do caderno de exercícios quando há sessão de aluno", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: null,
      studentSession: {
        userType: "student",
        studentId: testStudentId,
        registrationNumber: "REG-SIDEBAR-TEST",
        fullName: "Aluno Teste",
        professorId: testUserId,
      },
      userType: "student",
    } as TrpcContext);

    // Testar rota de estatísticas do caderno
    const stats = await caller.notebook.getStats({});

    expect(stats).toBeDefined();
    expect(stats.totalQuestions).toBeDefined();
    expect(stats.correctQuestions).toBeDefined();
    expect(stats.incorrectQuestions).toBeDefined();
  });

  it("deve bloquear acesso às rotas do caderno quando não há sessão de aluno", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: { id: testUserId, name: "Professor", role: "user" },
      studentSession: null,
      userType: "teacher",
    } as TrpcContext);

    // Tentar acessar rota protegida de aluno deve falhar
    await expect(caller.notebook.getStats({})).rejects.toThrow();
  });
});
