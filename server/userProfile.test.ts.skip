import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number, userOpenId: string, userName: string, userEmail: string): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: userOpenId,
    email: userEmail,
    name: userName,
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Sistema de Perfis de Usuário", () => {
  let testUserId: number;
  let testUser: any;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(async () => {
    // Criar usuário de teste
    const openId = `test-profile-${Date.now()}`;
    const email = `test-profile-${Date.now()}@example.com`;
    
    await db.upsertUser({
      openId,
      name: "Professor Teste",
      email,
      loginMethod: "test",
    });
    
    testUser = await db.getUserByOpenId(openId);
    if (!testUser) throw new Error("Failed to create test user");
    testUserId = testUser.id;

    // Criar caller autenticado
    const ctx = createAuthContext(
      testUserId,
      testUser.openId,
      testUser.name || "Professor Teste",
      testUser.email || ""
    );
    caller = appRouter.createCaller(ctx);
  });

  describe("Buscar perfil do usuário", () => {
    it("deve retornar perfil padrão 'enthusiast' para novo usuário", async () => {
      const result = await caller.userProfile.getProfile();
      expect(result.profile).toBe("enthusiast");
    });

    it("deve retornar perfil atualizado após mudança", async () => {
      // Atualizar para traditional
      await caller.userProfile.updateProfile({ profile: "traditional" });
      
      const result = await caller.userProfile.getProfile();
      expect(result.profile).toBe("traditional");
    });
  });

  describe("Atualizar perfil do usuário", () => {
    it("deve permitir trocar para perfil 'traditional'", async () => {
      const result = await caller.userProfile.updateProfile({ 
        profile: "traditional" 
      });

      expect(result.success).toBe(true);
      expect(result.profile).toBe("traditional");

      // Verificar no banco
      const profile = await db.getUserProfile(testUserId);
      expect(profile).toBe("traditional");
    });

    it("deve permitir trocar para perfil 'enthusiast'", async () => {
      const result = await caller.userProfile.updateProfile({ 
        profile: "enthusiast" 
      });

      expect(result.success).toBe(true);
      expect(result.profile).toBe("enthusiast");
    });

    it("deve permitir trocar para perfil 'interactive'", async () => {
      const result = await caller.userProfile.updateProfile({ 
        profile: "interactive" 
      });

      expect(result.success).toBe(true);
      expect(result.profile).toBe("interactive");
    });

    it("deve permitir trocar para perfil 'organizational'", async () => {
      const result = await caller.userProfile.updateProfile({ 
        profile: "organizational" 
      });

      expect(result.success).toBe(true);
      expect(result.profile).toBe("organizational");
    });
  });

  describe("Migração entre perfis", () => {
    it("deve manter dados ao trocar de 'enthusiast' para 'traditional'", async () => {
      // Criar disciplina como enthusiast
      const subject = await caller.subjects.create({
        name: "Matemática",
        code: `MAT-${Date.now()}`,
        description: "Disciplina de teste",
        color: "#3b82f6",
        workload: 60,
      });

      // Trocar para traditional
      await caller.userProfile.updateProfile({ profile: "traditional" });

      // Verificar que disciplina ainda existe
      const subjects = await caller.subjects.list();
      expect(subjects.length).toBeGreaterThan(0);
      expect(subjects.some(s => s.id === subject.id)).toBe(true);
    });

    it("deve manter dados ao trocar de 'traditional' para 'enthusiast'", async () => {
      // Trocar para traditional
      await caller.userProfile.updateProfile({ profile: "traditional" });

      // Criar turma como traditional
      const classData = await caller.classes.create({
        name: "Turma A",
        code: `TURMA-${Date.now()}`,
        description: "Turma de teste",
      });

      // Trocar de volta para enthusiast
      await caller.userProfile.updateProfile({ profile: "enthusiast" });

      // Verificar que turma ainda existe
      const classes = await caller.classes.list();
      expect(classes.length).toBeGreaterThan(0);
      expect(classes.some(c => c.id === classData.id)).toBe(true);
    });

    it("deve preservar horários ao trocar de perfil", async () => {
      // Criar turno
      const shift = await caller.shifts.create({
        name: "Matutino",
        color: "#3b82f6",
        displayOrder: 1,
      });

      // Trocar perfil
      await caller.userProfile.updateProfile({ profile: "traditional" });

      // Verificar que turno ainda existe
      const shifts = await caller.shifts.list();
      expect(shifts.length).toBeGreaterThan(0);
      expect(shifts.some(s => s.id === shift.id)).toBe(true);
    });
  });

  describe("Validação de perfis", () => {
    it("deve rejeitar perfil inválido", async () => {
      await expect(
        caller.userProfile.updateProfile({ profile: "invalid" as any })
      ).rejects.toThrow();
    });
  });
});
