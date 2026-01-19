import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';

describe('Teacher Email/Password Authentication', () => {
  const testEmail = `test-teacher-${Date.now()}@example.com`;
  const testPassword = 'test123456';
  const testName = 'Professor Teste Vitest';
  let createdUserId: number | null = null;

  afterAll(async () => {
    // Cleanup: delete test user if created
    if (createdUserId) {
      try {
        await db.permanentDeleteUser(createdUserId);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  describe('getUserByEmail', () => {
    it('should return null for non-existent email', async () => {
      const result = await db.getUserByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('createTeacherWithPassword', () => {
    it('should create a new teacher with email and password', async () => {
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash(testPassword, 10);
      
      const result = await db.createTeacherWithPassword({
        name: testName,
        email: testEmail,
        passwordHash,
      });

      expect(result).not.toBeNull();
      expect(result?.id).toBeGreaterThan(0);
      expect(result?.openId).toMatch(/^teacher-/);
      
      createdUserId = result?.id || null;
    });

    it('should be able to find the created teacher by email', async () => {
      const user = await db.getUserByEmail(testEmail);
      
      expect(user).not.toBeNull();
      expect(user?.name).toBe(testName);
      expect(user?.email).toBe(testEmail);
      expect(user?.loginMethod).toBe('email');
      expect(user?.role).toBe('user');
      expect(user?.active).toBe(true);
      expect(user?.approvalStatus).toBe('approved');
      expect(user?.passwordHash).toBeTruthy();
    });

    it('should verify password correctly', async () => {
      const user = await db.getUserByEmail(testEmail);
      expect(user).not.toBeNull();
      
      const bcrypt = await import('bcryptjs');
      const isValid = await bcrypt.compare(testPassword, user!.passwordHash!);
      expect(isValid).toBe(true);
      
      const isInvalid = await bcrypt.compare('wrongpassword', user!.passwordHash!);
      expect(isInvalid).toBe(false);
    });
  });

  describe('updateUserPassword', () => {
    it('should update user password', async () => {
      if (!createdUserId) {
        throw new Error('User not created');
      }

      const bcrypt = await import('bcryptjs');
      const newPassword = 'newpassword123';
      const newHash = await bcrypt.hash(newPassword, 10);
      
      const result = await db.updateUserPassword(createdUserId, newHash);
      expect(result).toBe(true);
      
      // Verify new password works
      const user = await db.getUserByEmail(testEmail);
      const isValid = await bcrypt.compare(newPassword, user!.passwordHash!);
      expect(isValid).toBe(true);
    });
  });
});
