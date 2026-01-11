import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type CookieCall = {
  name: string;
  value: string;
  options: any;
};

describe("Student Authentication", () => {
  let testStudentId: number;
  let testProfessorId: number;

  beforeAll(async () => {
    // Criar professor de teste
    const testOpenId = "test-professor-student-auth";
    await db.upsertUser({
      openId: testOpenId,
      name: "Professor Teste",
      email: "professor@test.com",
      role: "user",
    });
    
    const professor = await db.getUserByOpenId(testOpenId);
    if (!professor) throw new Error("Failed to create test professor");
    testProfessorId = professor.id;

    // Criar aluno de teste
    const student = await db.createStudent({
      userId: testProfessorId,
      registrationNumber: "2024001",
      fullName: "Aluno Teste",
    });
    testStudentId = student.id;
  });

  it("should login student with valid registration number", async () => {
    const cookies: CookieCall[] = [];

    const mockContext: TrpcContext = {
      req: {
        headers: {},
        protocol: "https",
      } as any,
      res: {
        cookie: (name: string, value: string, options: any) => {
          cookies.push({ name, value, options });
        },
      } as any,
      user: null,
      studentSession: null,
      userType: null,
    };

    const caller = appRouter.createCaller(mockContext);

    const result = await caller.auth.loginStudent({
      registrationNumber: "2024001",
      password: "2024001",
    });

    expect(result.success).toBe(true);
    expect(result.student).toBeDefined();
    expect(result.student?.registrationNumber).toBe("2024001");
    expect(result.student?.fullName).toBe("Aluno Teste");
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.name).toBe(COOKIE_NAME);
  });

  it("should reject login with invalid registration number", async () => {
    const mockContext: TrpcContext = {
      req: {
        headers: {},
        protocol: "https",
      } as any,
      res: {
        cookie: () => {},
      } as any,
      user: null,
      studentSession: null,
      userType: null,
    };

    const caller = appRouter.createCaller(mockContext);

    await expect(
      caller.auth.loginStudent({
        registrationNumber: "9999999",
        password: "9999999",
      })
    ).rejects.toThrow("Matrícula não encontrada");
  });

  it("should reject login with incorrect password", async () => {
    const mockContext: TrpcContext = {
      req: {
        headers: {},
        protocol: "https",
      } as any,
      res: {
        cookie: () => {},
      } as any,
      user: null,
      studentSession: null,
      userType: null,
    };

    const caller = appRouter.createCaller(mockContext);

    await expect(
      caller.auth.loginStudent({
        registrationNumber: "2024001",
        password: "wrongpassword",
      })
    ).rejects.toThrow("Senha incorreta");
  });

  it("should allow student to access student routes", async () => {
    const mockContext: TrpcContext = {
      req: {} as any,
      res: {} as any,
      user: null,
      studentSession: {
        userType: 'student',
        studentId: testStudentId,
        registrationNumber: "2024001",
        fullName: "Aluno Teste",
        professorId: testProfessorId,
      },
      userType: 'student',
    };

    const caller = appRouter.createCaller(mockContext);

    const result = await caller.student.getEnrolledSubjects();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should reject teacher access to student routes", async () => {
    const mockContext: TrpcContext = {
      req: {} as any,
      res: {} as any,
      user: {
        id: testProfessorId,
        openId: "test-professor",
        name: "Professor Teste",
        email: "professor@test.com",
        role: "user",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        loginMethod: null,
      },
      studentSession: null,
      userType: 'teacher',
    };

    const caller = appRouter.createCaller(mockContext);

    await expect(
      caller.student.getEnrolledSubjects()
    ).rejects.toThrow("Acesso restrito a alunos");
  });
});
