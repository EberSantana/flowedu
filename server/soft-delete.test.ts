import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("Soft Delete Tests", () => {
  let adminUserId: number;
  let regularUserId: number;
  let testUserId: number;

  beforeAll(async () => {
    // Criar usuário admin de teste
    await db.upsertUser({
      openId: "test-admin-soft-delete",
      name: "Admin Soft Delete Test",
      email: "admin-soft@test.com",
      role: "admin",
      loginMethod: "test",
      lastSignedIn: new Date(),
    });

    // Criar usuário regular de teste
    await db.upsertUser({
      openId: "test-regular-soft-delete",
      name: "Regular Soft Delete Test",
      email: "regular-soft@test.com",
      role: "user",
      loginMethod: "test",
      lastSignedIn: new Date(),
    });

    // Criar usuário para testes
    await db.upsertUser({
      openId: "test-user-soft-delete",
      name: "Test User Soft Delete",
      email: "testuser-soft@test.com",
      role: "user",
      loginMethod: "test",
      lastSignedIn: new Date(),
    });

    // Buscar IDs dos usuários criados
    const allUsers = await db.getAllUsers();
    const adminUser = allUsers.find((u) => u.email === "admin-soft@test.com");
    const regularUser = allUsers.find((u) => u.email === "regular-soft@test.com");
    const testUser = allUsers.find((u) => u.email === "testuser-soft@test.com");

    if (!adminUser || !regularUser || !testUser) {
      throw new Error("Failed to create test users");
    }

    adminUserId = adminUser.id;
    regularUserId = regularUser.id;
    testUserId = testUser.id;
  });

  describe("Deactivate User (Soft Delete)", () => {
    it("should allow admin to deactivate user", async () => {
      // Criar usuário temporário para desativar
      await db.upsertUser({
        openId: "temp-deactivate-user",
        name: "Temp Deactivate User",
        email: "temp-deactivate@test.com",
        role: "user",
        loginMethod: "test",
        lastSignedIn: new Date(),
      });

      const allUsers = await db.getAllUsers();
      const tempUser = allUsers.find((u) => u.email === "temp-deactivate@test.com");

      if (!tempUser) {
        throw new Error("Failed to create temp user");
      }

      const caller = appRouter.createCaller({
        user: {
          id: adminUserId,
          openId: "test-admin-soft-delete",
          name: "Admin Soft Delete Test",
          email: "admin-soft@test.com",
          role: "admin",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.admin.deleteUser({ userId: tempUser.id });
      expect(result.success).toBe(true);

      // Verificar que usuário ainda existe no banco mas está inativo
      const allUsersAfter = await db.getAllUsers();
      const deactivatedUser = allUsersAfter.find((u) => u.id === tempUser.id);
      expect(deactivatedUser).toBeDefined();
      expect(deactivatedUser?.active).toBe(false);

      // Verificar que não aparece na lista de ativos
      const activeUsers = await db.getActiveUsers();
      const userInActive = activeUsers.find((u) => u.id === tempUser.id);
      expect(userInActive).toBeUndefined();

      // Verificar que aparece na lista de inativos
      const inactiveUsers = await db.getInactiveUsers();
      const userInInactive = inactiveUsers.find((u) => u.id === tempUser.id);
      expect(userInInactive).toBeDefined();
    });

    it("should prevent admin from deactivating themselves", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: adminUserId,
          openId: "test-admin-soft-delete",
          name: "Admin Soft Delete Test",
          email: "admin-soft@test.com",
          role: "admin",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.admin.deleteUser({ userId: adminUserId })
      ).rejects.toThrow("Você não pode desativar sua própria conta");
    });

    it("should deny regular user from deactivating users", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: regularUserId,
          openId: "test-regular-soft-delete",
          name: "Regular Soft Delete Test",
          email: "regular-soft@test.com",
          role: "user",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.admin.deleteUser({ userId: testUserId })
      ).rejects.toThrow("Acesso negado: apenas administradores");
    });
  });

  describe("Reactivate User", () => {
    it("should allow admin to reactivate deactivated user", async () => {
      // Criar e desativar usuário
      await db.upsertUser({
        openId: "temp-reactivate-user",
        name: "Temp Reactivate User",
        email: "temp-reactivate@test.com",
        role: "user",
        loginMethod: "test",
        lastSignedIn: new Date(),
      });

      const allUsers = await db.getAllUsers();
      const tempUser = allUsers.find((u) => u.email === "temp-reactivate@test.com");

      if (!tempUser) {
        throw new Error("Failed to create temp user");
      }

      // Desativar usuário
      await db.deactivateUser(tempUser.id);

      // Verificar que está inativo
      const inactiveUsers = await db.getInactiveUsers();
      const deactivatedUser = inactiveUsers.find((u) => u.id === tempUser.id);
      expect(deactivatedUser).toBeDefined();

      // Reativar usuário
      const caller = appRouter.createCaller({
        user: {
          id: adminUserId,
          openId: "test-admin-soft-delete",
          name: "Admin Soft Delete Test",
          email: "admin-soft@test.com",
          role: "admin",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.admin.reactivateUser({ userId: tempUser.id });
      expect(result.success).toBe(true);

      // Verificar que está ativo novamente
      const activeUsers = await db.getActiveUsers();
      const reactivatedUser = activeUsers.find((u) => u.id === tempUser.id);
      expect(reactivatedUser).toBeDefined();
      expect(reactivatedUser?.active).toBe(true);

      // Verificar que não está mais na lista de inativos
      const inactiveUsersAfter = await db.getInactiveUsers();
      const userInInactive = inactiveUsersAfter.find((u) => u.id === tempUser.id);
      expect(userInInactive).toBeUndefined();
    });

    it("should deny regular user from reactivating users", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: regularUserId,
          openId: "test-regular-soft-delete",
          name: "Regular Soft Delete Test",
          email: "regular-soft@test.com",
          role: "user",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.admin.reactivateUser({ userId: testUserId })
      ).rejects.toThrow("Acesso negado: apenas administradores");
    });
  });

  describe("Data Preservation", () => {
    it("should preserve user data after deactivation", async () => {
      // Criar usuário com dados
      await db.upsertUser({
        openId: "preserve-data-user",
        name: "Preserve Data User",
        email: "preserve@test.com",
        role: "user",
        loginMethod: "test",
        lastSignedIn: new Date(),
      });

      const allUsers = await db.getAllUsers();
      const testUser = allUsers.find((u) => u.email === "preserve@test.com");

      if (!testUser) {
        throw new Error("Failed to create test user");
      }

      const originalName = testUser.name;
      const originalEmail = testUser.email;
      const originalRole = testUser.role;

      // Desativar usuário
      await db.deactivateUser(testUser.id);

      // Verificar que dados foram preservados
      const allUsersAfter = await db.getAllUsers();
      const deactivatedUser = allUsersAfter.find((u) => u.id === testUser.id);

      expect(deactivatedUser).toBeDefined();
      expect(deactivatedUser?.name).toBe(originalName);
      expect(deactivatedUser?.email).toBe(originalEmail);
      expect(deactivatedUser?.role).toBe(originalRole);
      expect(deactivatedUser?.active).toBe(false);
    });
  });

  describe("List Users by Status", () => {
    it("should list only active users", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: adminUserId,
          openId: "test-admin-soft-delete",
          name: "Admin Soft Delete Test",
          email: "admin-soft@test.com",
          role: "admin",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      const activeUsers = await caller.admin.listActiveUsers();
      
      // Todos os usuários retornados devem estar ativos
      activeUsers.forEach((user) => {
        expect(user.active).toBe(true);
      });
    });

    it("should list only inactive users", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: adminUserId,
          openId: "test-admin-soft-delete",
          name: "Admin Soft Delete Test",
          email: "admin-soft@test.com",
          role: "admin",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      const inactiveUsers = await caller.admin.listInactiveUsers();
      
      // Todos os usuários retornados devem estar inativos
      inactiveUsers.forEach((user) => {
        expect(user.active).toBe(false);
      });
    });
  });
});
