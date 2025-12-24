import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";

describe("Invite Codes", () => {
  let testInviteCodeId: number | null = null;
  let testInviteCode: string | null = null;

  describe("createInviteCode", () => {
    it("should create an invite code successfully", async () => {
      const result = await db.createInviteCode({
        createdBy: 1,
        maxUses: 5,
        description: "Test invite code",
      });

      expect(result).not.toBeNull();
      expect(result?.code).toBeDefined();
      expect(result?.code.length).toBe(8);
      expect(result?.id).toBeGreaterThan(0);

      testInviteCodeId = result?.id || null;
      testInviteCode = result?.code || null;
    });

    it("should create invite code with expiration", async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const result = await db.createInviteCode({
        createdBy: 1,
        maxUses: 1,
        expiresAt,
        description: "Expiring invite code",
      });

      expect(result).not.toBeNull();
      expect(result?.code).toBeDefined();
    });
  });

  describe("validateInviteCode", () => {
    it("should validate a valid invite code", async () => {
      if (!testInviteCode) {
        console.log("Skipping test - no test invite code created");
        return;
      }

      const result = await db.validateInviteCode(testInviteCode);
      
      expect(result.valid).toBe(true);
      expect(result.message).toBe("Código válido");
      expect(result.inviteId).toBeDefined();
    });

    it("should reject an invalid invite code", async () => {
      const result = await db.validateInviteCode("INVALID123");
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe("Código de convite inválido");
    });
  });

  describe("getAllInviteCodes", () => {
    it("should list all invite codes", async () => {
      const codes = await db.getAllInviteCodes();
      
      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBeGreaterThan(0);
    });
  });

  describe("useInviteCode", () => {
    it("should increment usage count when code is used", async () => {
      if (!testInviteCode) {
        console.log("Skipping test - no test invite code created");
        return;
      }

      const result = await db.useInviteCode(testInviteCode, 999);
      expect(result).toBe(true);

      // Verify the usage was incremented
      const invite = await db.getInviteCodeByCode(testInviteCode);
      expect(invite?.currentUses).toBeGreaterThan(0);
    });
  });

  describe("deactivateInviteCode", () => {
    it("should deactivate an invite code", async () => {
      if (!testInviteCodeId) {
        console.log("Skipping test - no test invite code created");
        return;
      }

      const result = await db.deactivateInviteCode(testInviteCodeId);
      expect(result).toBe(true);

      // Verify the code is deactivated
      if (testInviteCode) {
        const validation = await db.validateInviteCode(testInviteCode);
        expect(validation.valid).toBe(false);
        expect(validation.message).toBe("Este código de convite foi desativado");
      }
    });
  });

  describe("reactivateInviteCode", () => {
    it("should reactivate an invite code", async () => {
      if (!testInviteCodeId) {
        console.log("Skipping test - no test invite code created");
        return;
      }

      const result = await db.reactivateInviteCode(testInviteCodeId);
      expect(result).toBe(true);
    });
  });

  describe("deleteInviteCode", () => {
    it("should delete an invite code", async () => {
      // Create a new code to delete
      const newCode = await db.createInviteCode({
        createdBy: 1,
        maxUses: 1,
        description: "Code to delete",
      });

      if (!newCode) {
        console.log("Skipping test - could not create code to delete");
        return;
      }

      const result = await db.deleteInviteCode(newCode.id);
      expect(result).toBe(true);

      // Verify the code is deleted
      const validation = await db.validateInviteCode(newCode.code);
      expect(validation.valid).toBe(false);
    });
  });
});

describe("User Approval", () => {
  describe("getPendingUsers", () => {
    it("should return an array of pending users", async () => {
      const pendingUsers = await db.getPendingUsers();
      
      expect(Array.isArray(pendingUsers)).toBe(true);
    });
  });

  describe("getUserWithApprovalStatus", () => {
    it("should return user with approval status", async () => {
      const user = await db.getUserWithApprovalStatus(1);
      
      // User may or may not exist, but function should not throw
      if (user) {
        expect(user.id).toBe(1);
        expect(user.approvalStatus).toBeDefined();
      }
    });
  });
});
