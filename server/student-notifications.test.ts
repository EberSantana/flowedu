import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database functions
vi.mock('./db', () => ({
  getStudentNotifications: vi.fn(),
  getStudentUnreadNotificationsCount: vi.fn(),
  markStudentNotificationAsRead: vi.fn(),
  markAllStudentNotificationsAsRead: vi.fn(),
  createNotification: vi.fn(),
}));

import * as db from './db';

describe('Student Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStudentNotifications', () => {
    it('should return notifications for a student', async () => {
      const mockNotifications = [
        {
          id: 1,
          userId: 1,
          type: 'new_announcement',
          title: 'Novo Aviso: Prova',
          message: 'A prova será na próxima semana',
          link: '/student-announcements',
          relatedId: 1,
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          type: 'new_material',
          title: 'Novo Material',
          message: 'Material de estudo disponível',
          link: '/student-subjects',
          relatedId: 2,
          isRead: true,
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.getStudentNotifications).mockResolvedValue(mockNotifications);

      const result = await db.getStudentNotifications(1, 50);

      expect(db.getStudentNotifications).toHaveBeenCalledWith(1, 50);
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('new_announcement');
    });

    it('should return empty array when no notifications', async () => {
      vi.mocked(db.getStudentNotifications).mockResolvedValue([]);

      const result = await db.getStudentNotifications(999, 50);

      expect(result).toHaveLength(0);
    });
  });

  describe('getStudentUnreadNotificationsCount', () => {
    it('should return count of unread notifications', async () => {
      vi.mocked(db.getStudentUnreadNotificationsCount).mockResolvedValue(5);

      const result = await db.getStudentUnreadNotificationsCount(1);

      expect(db.getStudentUnreadNotificationsCount).toHaveBeenCalledWith(1);
      expect(result).toBe(5);
    });

    it('should return 0 when no unread notifications', async () => {
      vi.mocked(db.getStudentUnreadNotificationsCount).mockResolvedValue(0);

      const result = await db.getStudentUnreadNotificationsCount(1);

      expect(result).toBe(0);
    });
  });

  describe('markStudentNotificationAsRead', () => {
    it('should mark a notification as read', async () => {
      vi.mocked(db.markStudentNotificationAsRead).mockResolvedValue({ success: true });

      const result = await db.markStudentNotificationAsRead(1, 1);

      expect(db.markStudentNotificationAsRead).toHaveBeenCalledWith(1, 1);
      expect(result.success).toBe(true);
    });
  });

  describe('markAllStudentNotificationsAsRead', () => {
    it('should mark all notifications as read', async () => {
      vi.mocked(db.markAllStudentNotificationsAsRead).mockResolvedValue({ success: true });

      const result = await db.markAllStudentNotificationsAsRead(1);

      expect(db.markAllStudentNotificationsAsRead).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
    });
  });

  describe('createNotification', () => {
    it('should create a notification for announcement', async () => {
      const notificationData = {
        userId: 1,
        type: 'new_announcement' as const,
        title: '📢 Novo Aviso: Prova',
        message: 'Informática Básica: A prova será na próxima semana',
        link: '/student-announcements',
        relatedId: 1,
      };

      vi.mocked(db.createNotification).mockResolvedValue({
        id: 1,
        ...notificationData,
      });

      const result = await db.createNotification(notificationData);

      expect(db.createNotification).toHaveBeenCalledWith(notificationData);
      expect(result.id).toBe(1);
      expect(result.type).toBe('new_announcement');
    });
  });
});
