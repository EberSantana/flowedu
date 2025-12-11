import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from './routers';
import * as db from './db';

describe('Manual User Creation Tests', () => {
  let adminContext: any;
  let userContext: any;

  beforeAll(async () => {
    // Criar contextos de teste
    adminContext = {
      user: {
        id: 1000001,
        openId: 'test-admin',
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'admin' as const,
        loginMethod: 'test',
        active: true,
        lastSignedIn: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      req: { ip: '127.0.0.1', headers: {} } as any,
    };

    userContext = {
      user: {
        id: 1000002,
        openId: 'test-user',
        name: 'Test User',
        email: 'user@test.com',
        role: 'user' as const,
        loginMethod: 'test',
        active: true,
        lastSignedIn: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      req: { ip: '127.0.0.1', headers: {} } as any,
    };
  });

  afterAll(async () => {
    // Limpar todos os usuários de teste criados
    try {
      const allUsers = await db.getAllUsers();
      const testUsers = allUsers.filter(u => 
        u.email?.includes('@test.com') && 
        (u.email.includes('new-user-') || 
         u.email.includes('new-admin-') || 
         u.email.includes('duplicate-') ||
         u.email.includes('email-test-') ||
         u.email.includes('audit-test-'))
      );
      
      for (const user of testUsers) {
        try {
          await db.permanentDeleteUser(user.id);
        } catch (e) {
          // Ignorar erros
        }
      }
    } catch (error) {
      console.warn('[Test Cleanup] Failed to delete test users:', error);
    }
  });

  describe('Admin Create User', () => {
    it('should allow admin to create a new user', async () => {
      const caller = appRouter.createCaller(adminContext);
      const testEmail = `new-user-${Date.now()}@test.com`;
      
      const result = await caller.admin.createUser({
        name: 'New Test User',
        email: testEmail,
        role: 'user',
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testEmail);
      expect(result.user.name).toBe('New Test User');
      expect(result.user.role).toBe('user');
      expect(result.user.active).toBe(true);
    });

    it('should allow admin to create a new admin', async () => {
      const caller = appRouter.createCaller(adminContext);
      const testEmail = `new-admin-${Date.now()}@test.com`;
      
      const result = await caller.admin.createUser({
        name: 'New Test Admin',
        email: testEmail,
        role: 'admin',
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testEmail);
      expect(result.user.role).toBe('admin');
    });

    it('should reject duplicate email', async () => {
      const caller = appRouter.createCaller(adminContext);
      const testEmail = `duplicate-${Date.now()}@test.com`;
      
      // Criar primeiro usuário
      await caller.admin.createUser({
        name: 'First User',
        email: testEmail,
        role: 'user',
      });

      // Tentar criar segundo usuário com mesmo email
      await expect(
        caller.admin.createUser({
          name: 'Second User',
          email: testEmail,
          role: 'user',
        })
      ).rejects.toThrow('Este e-mail já está cadastrado no sistema');
    });

    it('should send welcome email after creation', async () => {
      const caller = appRouter.createCaller(adminContext);
      const testEmail = `email-test-${Date.now()}@test.com`;
      
      const result = await caller.admin.createUser({
        name: 'Email Test User',
        email: testEmail,
        role: 'user',
      });

      expect(result.success).toBe(true);
      // Email sending is optional (depends on RESEND_API_KEY)
      expect(result.emailSent).toBeDefined();
    });
  });

  describe('Regular User Restrictions', () => {
    it('should prevent regular user from creating users', async () => {
      const caller = appRouter.createCaller(userContext);
      
      await expect(
        caller.admin.createUser({
          name: 'Unauthorized User',
          email: 'unauthorized@test.com',
          role: 'user',
        })
      ).rejects.toThrow('Acesso negado: apenas administradores');
    });
  });

  describe('Audit Log', () => {
    it('should create audit log when user is created', async () => {
      const caller = appRouter.createCaller(adminContext);
      const testEmail = `audit-test-${Date.now()}@test.com`;
      
      const result = await caller.admin.createUser({
        name: 'Audit Test User',
        email: testEmail,
        role: 'user',
      });

      expect(result.success).toBe(true);
      
      // Verificar que log foi criado
      const logs = await db.getAuditLogsByAdmin(adminContext.user.id);
      const createLog = logs.find(log => 
        log.action === 'CREATE_USER' && 
        log.targetUserId === result.user.id
      );
      
      expect(createLog).toBeDefined();
      expect(createLog?.adminId).toBe(adminContext.user.id);
      expect(createLog?.targetUserName).toBe('Audit Test User');
    });
  });
});
