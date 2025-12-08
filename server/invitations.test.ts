import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("Invitation System Tests", () => {
  let adminUserId: number;
  let regularUserId: number;

  beforeAll(async () => {
    // Criar usuário admin de teste
    await db.upsertUser({
      openId: "test-admin-invite-openid",
      name: "Admin Invite Test",
      email: "admin-invite@test.com",
      role: "admin",
      loginMethod: "test",
      lastSignedIn: new Date(),
    });

    // Criar usuário regular de teste
    await db.upsertUser({
      openId: "test-regular-invite-openid",
      name: "Regular Invite Test",
      email: "regular-invite@test.com",
      role: "user",
      loginMethod: "test",
      lastSignedIn: new Date(),
    });

    // Buscar IDs dos usuários criados
    const allUsers = await db.getAllUsers();
    const adminUser = allUsers.find((u) => u.email === "admin-invite@test.com");
    const regularUser = allUsers.find((u) => u.email === "regular-invite@test.com");

    if (!adminUser || !regularUser) {
      throw new Error("Failed to create test users");
    }

    adminUserId = adminUser.id;
    regularUserId = regularUser.id;
  });

  describe("Admin Invitation Creation", () => {
    it("should allow admin to create invitation", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: adminUserId,
          openId: "test-admin-invite-openid",
          name: "Admin Invite Test",
          email: "admin-invite@test.com",
          role: "admin",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.admin.createInvitation({
        email: "newteacher@test.com",
        role: "user",
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.inviteUrl).toContain(result.token);
    });

    it("should deny regular user from creating invitation", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: regularUserId,
          openId: "test-regular-invite-openid",
          name: "Regular Invite Test",
          email: "regular-invite@test.com",
          role: "user",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.admin.createInvitation({
          email: "another@test.com",
          role: "user",
        })
      ).rejects.toThrow("Acesso negado: apenas administradores");
    });

    it("should prevent duplicate invitations for same email", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: adminUserId,
          openId: "test-admin-invite-openid",
          name: "Admin Invite Test",
          email: "admin-invite@test.com",
          role: "admin",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      // Criar primeiro convite
      await caller.admin.createInvitation({
        email: "duplicate@test.com",
        role: "user",
      });

      // Tentar criar segundo convite para o mesmo email
      await expect(
        caller.admin.createInvitation({
          email: "duplicate@test.com",
          role: "user",
        })
      ).rejects.toThrow("Já existe um convite pendente para este e-mail");
    });

    it("should prevent invitation for already registered email", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: adminUserId,
          openId: "test-admin-invite-openid",
          name: "Admin Invite Test",
          email: "admin-invite@test.com",
          role: "admin",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.admin.createInvitation({
          email: "admin-invite@test.com", // Email já cadastrado
          role: "user",
        })
      ).rejects.toThrow("Este e-mail já está cadastrado no sistema");
    });
  });

  describe("Invitation Listing and Management", () => {
    it("should allow admin to list all invitations", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: adminUserId,
          openId: "test-admin-invite-openid",
          name: "Admin Invite Test",
          email: "admin-invite@test.com",
          role: "admin",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      const invitations = await caller.admin.listInvitations();
      expect(Array.isArray(invitations)).toBe(true);
      expect(invitations.length).toBeGreaterThan(0);
    });

    it("should deny regular user from listing invitations", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: regularUserId,
          openId: "test-regular-invite-openid",
          name: "Regular Invite Test",
          email: "regular-invite@test.com",
          role: "user",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      await expect(caller.admin.listInvitations()).rejects.toThrow(
        "Acesso negado: apenas administradores"
      );
    });

    it("should allow admin to cancel invitation", async () => {
      const caller = appRouter.createCaller({
        user: {
          id: adminUserId,
          openId: "test-admin-invite-openid",
          name: "Admin Invite Test",
          email: "admin-invite@test.com",
          role: "admin",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      // Criar convite
      await caller.admin.createInvitation({
        email: "tocancel@test.com",
        role: "user",
      });

      // Buscar o convite criado
      const invitations = await caller.admin.listInvitations();
      const invitation = invitations.find((inv) => inv.email === "tocancel@test.com");

      expect(invitation).toBeDefined();

      // Cancelar o convite
      if (invitation) {
        const result = await caller.admin.cancelInvitation({ id: invitation.id });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("Invitation Token Validation", () => {
    it("should validate valid pending invitation token", async () => {
      const adminCaller = appRouter.createCaller({
        user: {
          id: adminUserId,
          openId: "test-admin-invite-openid",
          name: "Admin Invite Test",
          email: "admin-invite@test.com",
          role: "admin",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      // Criar convite
      const { token } = await adminCaller.admin.createInvitation({
        email: "validate@test.com",
        role: "user",
      });

      // Validar token
      const publicCaller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const validation = await publicCaller.invitations.validateToken({ token });
      expect(validation.valid).toBe(true);
      expect(validation.invitation?.email).toBe("validate@test.com");
    });

    it("should reject invalid token", async () => {
      const publicCaller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const validation = await publicCaller.invitations.validateToken({
        token: "invalid-token-12345",
      });
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe("Convite não encontrado");
    });
  });

  describe("Invitation Acceptance", () => {
    it("should allow user to accept valid invitation", async () => {
      const adminCaller = appRouter.createCaller({
        user: {
          id: adminUserId,
          openId: "test-admin-invite-openid",
          name: "Admin Invite Test",
          email: "admin-invite@test.com",
          role: "admin",
          loginMethod: "test",
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {} as any,
        res: {} as any,
      });

      // Criar convite
      const { token } = await adminCaller.admin.createInvitation({
        email: "accept@test.com",
        role: "user",
      });

      // Aceitar convite
      const publicCaller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await publicCaller.invitations.acceptInvite({
        token,
        name: "New Teacher",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("sucesso");

      // Verificar se usuário foi criado
      const emailRegistered = await db.checkEmailAlreadyRegistered("accept@test.com");
      expect(emailRegistered).toBe(true);
    });

    it("should reject acceptance of invalid token", async () => {
      const publicCaller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      await expect(
        publicCaller.invitations.acceptInvite({
          token: "invalid-token",
          name: "Test User",
        })
      ).rejects.toThrow("Convite não encontrado");
    });
  });
});
