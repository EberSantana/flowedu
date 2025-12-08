import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("System Improvements Tests", () => {
  let adminUserId: number;
  let regularUserId: number;

  beforeAll(async () => {
    // Criar usuários de teste
    await db.upsertUser({
      openId: "test-admin-improvements",
      name: "Admin Improvements Test",
      email: "admin-improvements@test.com",
      role: "admin",
      loginMethod: "test",
      lastSignedIn: new Date(),
    });

    await db.upsertUser({
      openId: "test-regular-improvements",
      name: "Regular Improvements Test",
      email: "regular-improvements@test.com",
      role: "user",
      loginMethod: "test",
      lastSignedIn: new Date(),
    });

    const allUsers = await db.getAllUsers();
    const adminUser = allUsers.find((u) => u.email === "admin-improvements@test.com");
    const regularUser = allUsers.find((u) => u.email === "regular-improvements@test.com");

    if (!adminUser || !regularUser) {
      throw new Error("Failed to create test users");
    }

    adminUserId = adminUser.id;
    regularUserId = regularUser.id;
  });

  describe("Email Invitations", () => {
    it("should create invitation and return email status", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: adminUserId,
          openId: "test-admin-improvements",
          name: "Admin Improvements Test",
          email: "admin-improvements@test.com",
          role: "admin",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.admin.createInvitation({
        email: "newinvite@test.com",
        role: "user",
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.inviteUrl).toBeDefined();
      expect(result.inviteUrl).toContain(result.token);
      // emailSent pode ser true ou false dependendo da configuração
      expect(typeof result.emailSent).toBe("boolean");
    });

    it("should prevent duplicate invitations", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: adminUserId,
          openId: "test-admin-improvements",
          name: "Admin Improvements Test",
          email: "admin-improvements@test.com",
          role: "admin",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      // Primeiro convite
      await caller.admin.createInvitation({
        email: "duplicate@test.com",
        role: "user",
      });

      // Tentar criar convite duplicado
      await expect(
        caller.admin.createInvitation({
          email: "duplicate@test.com",
          role: "user",
        })
      ).rejects.toThrow("Já existe um convite pendente para este e-mail");
    });
  });

  describe("Permanent Delete", () => {
    it("should allow admin to permanently delete user", async () => {
      // Criar usuário temporário
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
          openId: "test-admin-improvements",
          name: "Admin Improvements Test",
          email: "admin-improvements@test.com",
          role: "admin",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.admin.permanentDeleteUser({ userId: tempUser.id });
      expect(result.success).toBe(true);

      // Verificar que usuário foi removido
      const usersAfter = await db.getAllUsers();
      const deletedUser = usersAfter.find((u) => u.id === tempUser.id);
      expect(deletedUser).toBeUndefined();
    });

    it("should prevent admin from deleting themselves permanently", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: adminUserId,
          openId: "test-admin-improvements",
          name: "Admin Improvements Test",
          email: "admin-improvements@test.com",
          role: "admin",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.admin.permanentDeleteUser({ userId: adminUserId })
      ).rejects.toThrow("Você não pode deletar permanentemente sua própria conta");
    });

    it("should deny regular user from permanent delete", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: regularUserId,
          openId: "test-regular-improvements",
          name: "Regular Improvements Test",
          email: "regular-improvements@test.com",
          role: "user",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.admin.permanentDeleteUser({ userId: adminUserId })
      ).rejects.toThrow("Acesso negado: apenas administradores");
    });
  });

  describe("Audit Logs", () => {
    it("should create audit log", async () => {
      const result = await db.createAuditLog({
        adminId: adminUserId,
        adminName: "Admin Improvements Test",
        action: "TEST_ACTION",
        targetUserId: regularUserId,
        targetUserName: "Regular Improvements Test",
        oldData: JSON.stringify({ role: "user" }),
        newData: JSON.stringify({ role: "admin" }),
        ipAddress: "127.0.0.1",
      });

      expect(result.success).toBe(true);
    });

    it("should retrieve all audit logs", async () => {
      const logs = await db.getAllAuditLogs();
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
    });

    it("should retrieve audit logs by admin", async () => {
      const logs = await db.getAuditLogsByAdmin(adminUserId);
      expect(Array.isArray(logs)).toBe(true);
      logs.forEach((log) => {
        expect(log.adminId).toBe(adminUserId);
      });
    });

    it("should retrieve audit logs by target user", async () => {
      const logs = await db.getAuditLogsByUser(regularUserId);
      expect(Array.isArray(logs)).toBe(true);
      logs.forEach((log) => {
        expect(log.targetUserId).toBe(regularUserId);
      });
    });
  });
});
