import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("Admin System Tests", () => {
  let adminUserId: number;
  let regularUserId: number;

  beforeAll(async () => {
    // Criar usuário admin de teste
    await db.upsertUser({
      openId: "test-admin-openid",
      name: "Admin Test User",
      email: "admin@test.com",
      role: "admin",
      loginMethod: "test",
      lastSignedIn: new Date(),
    });

    // Criar usuário regular de teste
    await db.upsertUser({
      openId: "test-regular-openid",
      name: "Regular Test User",
      email: "regular@test.com",
      role: "user",
      loginMethod: "test",
      lastSignedIn: new Date(),
    });

    // Buscar IDs dos usuários criados
    const allUsers = await db.getAllUsers();
    const adminUser = allUsers.find((u) => u.email === "admin@test.com");
    const regularUser = allUsers.find((u) => u.email === "regular@test.com");

    if (!adminUser || !regularUser) {
      throw new Error("Failed to create test users");
    }

    adminUserId = adminUser.id;
    regularUserId = regularUser.id;
  });

  afterAll(async () => {
    // Limpar usuários de teste criados
    try {
      await db.permanentDeleteUser(adminUserId);
      await db.permanentDeleteUser(regularUserId);
    } catch (error) {
      console.warn('[Test Cleanup] Failed to delete test users:', error);
    }
  });

  describe("Admin Routes - Access Control", () => {
    it("should allow admin to list all users", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: adminUserId,
          openId: "test-admin-openid",
          name: "Admin Test User",
          email: "admin@test.com",
          role: "admin",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      const users = await caller.admin.listUsers();
      expect(users).toBeDefined();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
    });

    it("should deny regular user from listing all users", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: regularUserId,
          openId: "test-regular-openid",
          name: "Regular Test User",
          email: "regular@test.com",
          role: "user",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      await expect(caller.admin.listUsers()).rejects.toThrow(
        "Acesso negado: apenas administradores"
      );
    });

    it("should allow admin to update user role", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: adminUserId,
          openId: "test-admin-openid",
          name: "Admin Test User",
          email: "admin@test.com",
          role: "admin",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.admin.updateUserRole({
        userId: regularUserId,
        role: "admin",
      });

      expect(result.success).toBe(true);

      // Reverter mudança
      await caller.admin.updateUserRole({
        userId: regularUserId,
        role: "user",
      });
    });

    it("should deny regular user from updating user role", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: regularUserId,
          openId: "test-regular-openid",
          name: "Regular Test User",
          email: "regular@test.com",
          role: "user",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.admin.updateUserRole({
          userId: adminUserId,
          role: "user",
        })
      ).rejects.toThrow("Acesso negado: apenas administradores");
    });
  });

  describe("User Profile Routes", () => {
    it("should allow user to update their own profile", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: regularUserId,
          openId: "test-regular-openid",
          name: "Regular Test User",
          email: "regular@test.com",
          role: "user",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.user.updateProfile({
        name: "Updated Regular User",
        email: "updated@test.com",
      });

      expect(result.success).toBe(true);

      // Reverter mudança
      await caller.user.updateProfile({
        name: "Regular Test User",
        email: "regular@test.com",
      });
    });
  });

  describe("Data Isolation", () => {
    it("should isolate subjects by userId", async () => {
      // Criar disciplina como usuário regular
      const regularCaller = appRouter.createCaller({
        user: {
          id: regularUserId,
          openId: "test-regular-openid",
          name: "Regular Test User",
          email: "regular@test.com",
          role: "user",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      await regularCaller.subjects.create({
        name: "Test Subject Regular",
        code: `TST${Date.now()}`,
        description: "Test subject for regular user",
        color: "#3b82f6",
      });

      // Criar disciplina como admin
      const adminCaller = appRouter.createCaller({
        user: {
          id: adminUserId,
          openId: "test-admin-openid",
          name: "Admin Test User",
          email: "admin@test.com",
          role: "admin",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      await adminCaller.subjects.create({
        name: "Test Subject Admin",
        code: `TST${Date.now() + 1}`,
        description: "Test subject for admin user",
        color: "#ef4444",
      });

      // Verificar isolamento
      const regularSubjects = await regularCaller.subjects.list();
      const adminSubjects = await adminCaller.subjects.list();

      expect(regularSubjects.some((s) => s.name === "Test Subject Regular")).toBe(true);
      expect(regularSubjects.some((s) => s.name === "Test Subject Admin")).toBe(false);

      expect(adminSubjects.some((s) => s.name === "Test Subject Admin")).toBe(true);
      expect(adminSubjects.some((s) => s.name === "Test Subject Regular")).toBe(false);
    });
  });
});
