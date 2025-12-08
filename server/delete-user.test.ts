import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("Delete User Tests", () => {
  let adminUserId: number;
  let regularUserId: number;
  let userToDeleteId: number;

  beforeAll(async () => {
    // Criar usuário admin de teste
    await db.upsertUser({
      openId: "test-admin-delete-openid",
      name: "Admin Delete Test",
      email: "admin-delete@test.com",
      role: "admin",
      loginMethod: "test",
      lastSignedIn: new Date(),
    });

    // Criar usuário regular de teste
    await db.upsertUser({
      openId: "test-regular-delete-openid",
      name: "Regular Delete Test",
      email: "regular-delete@test.com",
      role: "user",
      loginMethod: "test",
      lastSignedIn: new Date(),
    });

    // Criar usuário para ser deletado
    await db.upsertUser({
      openId: "test-user-to-delete-openid",
      name: "User To Delete",
      email: "todelete@test.com",
      role: "user",
      loginMethod: "test",
      lastSignedIn: new Date(),
    });

    // Buscar IDs dos usuários criados
    const allUsers = await db.getAllUsers();
    const adminUser = allUsers.find((u) => u.email === "admin-delete@test.com");
    const regularUser = allUsers.find((u) => u.email === "regular-delete@test.com");
    const userToDelete = allUsers.find((u) => u.email === "todelete@test.com");

    if (!adminUser || !regularUser || !userToDelete) {
      throw new Error("Failed to create test users");
    }

    adminUserId = adminUser.id;
    regularUserId = regularUser.id;
    userToDeleteId = userToDelete.id;
  });

  describe("Admin Delete User", () => {
    it("should allow admin to delete another user", async () => {
      // Criar usuário temporário para deletar
      await db.upsertUser({
        openId: "temp-delete-user",
        name: "Temp Delete User",
        email: "temp-delete@test.com",
        role: "user",
        loginMethod: "test",
        lastSignedIn: new Date(),
      });

      const allUsers = await db.getAllUsers();
      const tempUser = allUsers.find((u) => u.email === "temp-delete@test.com");

      if (!tempUser) {
        throw new Error("Failed to create temp user");
      }

      const caller = appRouter.createCaller({
        user: {
          id: adminUserId,
          openId: "test-admin-delete-openid",
          name: "Admin Delete Test",
          email: "admin-delete@test.com",
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

      // Verificar que usuário foi deletado
      const usersAfterDelete = await db.getAllUsers();
      const deletedUser = usersAfterDelete.find((u) => u.id === tempUser.id);
      expect(deletedUser).toBeUndefined();
    });

    it("should prevent admin from deleting themselves", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: adminUserId,
          openId: "test-admin-delete-openid",
          name: "Admin Delete Test",
          email: "admin-delete@test.com",
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
      ).rejects.toThrow("Você não pode deletar sua própria conta");
    });

    it("should deny regular user from deleting users", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: regularUserId,
          openId: "test-regular-delete-openid",
          name: "Regular Delete Test",
          email: "regular-delete@test.com",
          role: "user",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.admin.deleteUser({ userId: userToDeleteId })
      ).rejects.toThrow("Acesso negado: apenas administradores");
    });
  });

  describe("Delete User Data Integrity", () => {
    it("should successfully delete user and remove from database", async () => {
      // Criar usuário para teste de integridade
      await db.upsertUser({
        openId: "integrity-test-user",
        name: "Integrity Test User",
        email: "integrity@test.com",
        role: "user",
        loginMethod: "test",
        lastSignedIn: new Date(),
      });

      const allUsers = await db.getAllUsers();
      const integrityUser = allUsers.find((u) => u.email === "integrity@test.com");

      if (!integrityUser) {
        throw new Error("Failed to create integrity test user");
      }

      // Verificar que usuário existe
      const usersBefore = await db.getAllUsers();
      const userBefore = usersBefore.find((u) => u.id === integrityUser.id);
      expect(userBefore).toBeDefined();

      // Deletar usuário
      const caller = appRouter.createCaller({
        user: {
          id: adminUserId,
          openId: "test-admin-delete-openid",
          name: "Admin Delete Test",
          email: "admin-delete@test.com",
          role: "admin",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      await caller.admin.deleteUser({ userId: integrityUser.id });

      // Verificar que usuário não existe mais
      const usersAfter = await db.getAllUsers();
      const userAfter = usersAfter.find((u) => u.id === integrityUser.id);
      expect(userAfter).toBeUndefined();
    });
  });
});
