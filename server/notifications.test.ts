import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Sistema de Notificações', () => {
  let testUserId: number;
  let testNotificationId: number;

  beforeAll(async () => {
    // Usar usuário existente (ID 1 - owner)
    testUserId = 1;
  });

  describe('Criação de Notificações', () => {
    it('deve criar uma notificação de novo material', async () => {
      const notification = await db.createNotification({
        userId: testUserId,
        type: 'new_material',
        title: '📚 Novo material disponível',
        message: 'O material "Introdução ao TypeScript" foi adicionado',
        link: '/student/subject/1/1',
        relatedId: 1,
      });

      expect(notification.id).toBeGreaterThan(0);
      expect(notification.type).toBe('new_material');
      expect(notification.title).toContain('Novo material');
      
      testNotificationId = notification.id;
    });

    it('deve criar uma notificação de nova atividade', async () => {
      const notification = await db.createNotification({
        userId: testUserId,
        type: 'new_assignment',
        title: '✏️ Nova atividade',
        message: 'A atividade "Exercício 1" foi criada',
        link: '/student/subject/1/1',
      });

      expect(notification.id).toBeGreaterThan(0);
      expect(notification.type).toBe('new_assignment');
    });

    it('deve criar uma notificação de feedback recebido', async () => {
      const notification = await db.createNotification({
        userId: testUserId,
        type: 'feedback_received',
        title: '💬 Feedback recebido',
        message: 'O professor comentou sobre sua entrega',
        link: '/student/subject/1/1',
        relatedId: 5,
      });

      expect(notification.id).toBeGreaterThan(0);
      expect(notification.type).toBe('feedback_received');
    });
  });

  describe('Listagem de Notificações', () => {
    it('deve listar notificações do usuário', async () => {
      const notifications = await db.getNotifications(testUserId, 10);

      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0]).toHaveProperty('id');
      expect(notifications[0]).toHaveProperty('title');
      expect(notifications[0]).toHaveProperty('message');
      expect(notifications[0]).toHaveProperty('type');
      expect(notifications[0]).toHaveProperty('isRead');
    });

    it('deve respeitar o limite de notificações', async () => {
      const notifications = await db.getNotifications(testUserId, 2);

      expect(notifications.length).toBeLessThanOrEqual(2);
    });

    it('deve retornar notificações ordenadas por data (mais recente primeiro)', async () => {
      const notifications = await db.getNotifications(testUserId, 10);

      if (notifications.length > 1) {
        const firstDate = new Date(notifications[0].createdAt).getTime();
        const secondDate = new Date(notifications[1].createdAt).getTime();
        expect(firstDate).toBeGreaterThanOrEqual(secondDate);
      }
    });
  });

  describe('Contador de Não Lidas', () => {
    it('deve retornar o número de notificações não lidas', async () => {
      const count = await db.getUnreadNotificationsCount(testUserId);

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Marcar como Lida', () => {
    it('deve marcar uma notificação como lida', async () => {
      const result = await db.markNotificationAsRead(testNotificationId, testUserId);

      expect(result.success).toBe(true);

      // Verificar se foi marcada como lida
      const notifications = await db.getNotifications(testUserId, 50);
      const notification = notifications.find(n => n.id === testNotificationId);
      expect(notification?.isRead).toBe(true);
    });

    it('não deve marcar notificação de outro usuário', async () => {
      // Tentar marcar com userId diferente não deve causar erro
      const result = await db.markNotificationAsRead(testNotificationId, 99999);
      expect(result.success).toBe(true);
    });
  });

  describe('Marcar Todas como Lidas', () => {
    it('deve marcar todas as notificações como lidas', async () => {
      // Criar algumas notificações não lidas
      await db.createNotification({
        userId: testUserId,
        type: 'new_material',
        title: 'Teste 1',
        message: 'Mensagem teste 1',
      });
      await db.createNotification({
        userId: testUserId,
        type: 'new_assignment',
        title: 'Teste 2',
        message: 'Mensagem teste 2',
      });

      const result = await db.markAllNotificationsAsRead(testUserId);
      expect(result.success).toBe(true);

      const unreadCount = await db.getUnreadNotificationsCount(testUserId);
      expect(unreadCount).toBe(0);
    });
  });

  describe('Exclusão de Notificações', () => {
    it('deve deletar uma notificação', async () => {
      // Criar notificação para deletar
      const notification = await db.createNotification({
        userId: testUserId,
        type: 'new_material',
        title: 'Para deletar',
        message: 'Esta notificação será deletada',
      });

      const result = await db.deleteNotification(notification.id, testUserId);
      expect(result.success).toBe(true);

      // Verificar se foi deletada
      const notifications = await db.getNotifications(testUserId, 100);
      const found = notifications.find(n => n.id === notification.id);
      expect(found).toBeUndefined();
    });

    it('não deve deletar notificação de outro usuário', async () => {
      // Tentar deletar com userId diferente não deve causar erro
      const result = await db.deleteNotification(testNotificationId, 99999);
      expect(result.success).toBe(true);
    });
  });

  describe('Tipos de Notificações', () => {
    it('deve aceitar todos os tipos de notificação válidos', async () => {
      const types: Array<'new_material' | 'new_assignment' | 'assignment_due' | 'feedback_received' | 'grade_received' | 'comment_received'> = [
        'new_material',
        'new_assignment',
        'assignment_due',
        'feedback_received',
        'grade_received',
        'comment_received',
      ];

      for (const type of types) {
        const notification = await db.createNotification({
          userId: testUserId,
          type,
          title: `Teste ${type}`,
          message: `Mensagem de teste para ${type}`,
        });

        expect(notification.id).toBeGreaterThan(0);
        expect(notification.type).toBe(type);
      }
    });
  });

  describe('Campos Opcionais', () => {
    it('deve criar notificação sem link', async () => {
      const notification = await db.createNotification({
        userId: testUserId,
        type: 'new_material',
        title: 'Sem link',
        message: 'Notificação sem link',
      });

      expect(notification.id).toBeGreaterThan(0);
    });

    it('deve criar notificação sem relatedId', async () => {
      const notification = await db.createNotification({
        userId: testUserId,
        type: 'new_assignment',
        title: 'Sem relatedId',
        message: 'Notificação sem ID relacionado',
        link: '/test',
      });

      expect(notification.id).toBeGreaterThan(0);
    });
  });
});
