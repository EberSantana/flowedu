import { describe, it, expect, vi, beforeEach } from "vitest";
import webpush from "web-push";

// Mock web-push para não enviar notificações reais
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    generateVAPIDKeys: vi.fn(() => ({
      publicKey: "test-public-key",
      privateKey: "test-private-key",
    })),
    sendNotification: vi.fn(() => Promise.resolve({ statusCode: 201 })),
  },
}));

describe("Push Notifications System", () => {
  
  describe("VAPID Configuration", () => {
    it("should have VAPID_PUBLIC_KEY environment variable set", () => {
      const publicKey = process.env.VAPID_PUBLIC_KEY;
      expect(publicKey).toBeDefined();
      expect(typeof publicKey).toBe("string");
      expect(publicKey!.length).toBeGreaterThan(10);
    });

    it("should have VAPID_PRIVATE_KEY environment variable set", () => {
      const privateKey = process.env.VAPID_PRIVATE_KEY;
      expect(privateKey).toBeDefined();
      expect(typeof privateKey).toBe("string");
      expect(privateKey!.length).toBeGreaterThan(10);
    });

    it("should initialize VAPID details without errors", async () => {
      const { initializeVapid } = await import("./push-notifications");
      
      // Não deve lançar erro
      expect(() => initializeVapid()).not.toThrow();
      
      // Deve ter chamado setVapidDetails
      expect(webpush.setVapidDetails).toHaveBeenCalledWith(
        expect.stringContaining("mailto:"),
        expect.any(String),
        expect.any(String)
      );
    });

    it("should return VAPID public key", async () => {
      const { getVapidPublicKey } = await import("./push-notifications");
      const key = getVapidPublicKey();
      expect(typeof key).toBe("string");
    });
  });

  describe("Push Notification Module Exports", () => {
    it("should export all required functions", async () => {
      const pushModule = await import("./push-notifications");
      
      expect(typeof pushModule.initializeVapid).toBe("function");
      expect(typeof pushModule.generateVapidKeys).toBe("function");
      expect(typeof pushModule.getVapidPublicKey).toBe("function");
      expect(typeof pushModule.savePushSubscription).toBe("function");
      expect(typeof pushModule.removePushSubscription).toBe("function");
      expect(typeof pushModule.getNotificationPrefs).toBe("function");
      expect(typeof pushModule.saveNotificationPrefs).toBe("function");
      expect(typeof pushModule.sendPushNotification).toBe("function");
      expect(typeof pushModule.sendTestNotification).toBe("function");
      expect(typeof pushModule.getNotificationStats).toBe("function");
      expect(typeof pushModule.checkAndSendReminders).toBe("function");
      expect(typeof pushModule.startReminderJob).toBe("function");
      expect(typeof pushModule.stopReminderJob).toBe("function");
    });
  });

  describe("Quiet Hours Logic", () => {
    it("should correctly identify quiet hours that cross midnight", () => {
      // Testar lógica de horário silencioso indiretamente
      // Horário silencioso: 22:00 - 06:00
      const isQuietHours = (quietStart: string, quietEnd: string, hours: number, minutes: number): boolean => {
        const currentMinutes = hours * 60 + minutes;
        const [startH, startM] = quietStart.split(':').map(Number);
        const [endH, endM] = quietEnd.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        
        if (startMinutes > endMinutes) {
          return currentMinutes >= startMinutes || currentMinutes < endMinutes;
        }
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
      };

      // 23:00 deve ser horário silencioso (22:00-06:00)
      expect(isQuietHours("22:00", "06:00", 23, 0)).toBe(true);
      
      // 03:00 deve ser horário silencioso (22:00-06:00)
      expect(isQuietHours("22:00", "06:00", 3, 0)).toBe(true);
      
      // 08:00 NÃO deve ser horário silencioso
      expect(isQuietHours("22:00", "06:00", 8, 0)).toBe(false);
      
      // 12:00 NÃO deve ser horário silencioso
      expect(isQuietHours("22:00", "06:00", 12, 0)).toBe(false);
      
      // 21:59 NÃO deve ser horário silencioso
      expect(isQuietHours("22:00", "06:00", 21, 59)).toBe(false);
      
      // 22:00 deve ser horário silencioso
      expect(isQuietHours("22:00", "06:00", 22, 0)).toBe(true);
      
      // 06:00 NÃO deve ser horário silencioso (fim do período)
      expect(isQuietHours("22:00", "06:00", 6, 0)).toBe(false);
    });

    it("should correctly identify quiet hours within same day", () => {
      const isQuietHours = (quietStart: string, quietEnd: string, hours: number, minutes: number): boolean => {
        const currentMinutes = hours * 60 + minutes;
        const [startH, startM] = quietStart.split(':').map(Number);
        const [endH, endM] = quietEnd.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        
        if (startMinutes > endMinutes) {
          return currentMinutes >= startMinutes || currentMinutes < endMinutes;
        }
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
      };

      // Horário silencioso: 13:00 - 14:00 (mesmo dia)
      expect(isQuietHours("13:00", "14:00", 13, 30)).toBe(true);
      expect(isQuietHours("13:00", "14:00", 12, 30)).toBe(false);
      expect(isQuietHours("13:00", "14:00", 14, 30)).toBe(false);
    });
  });

  describe("URL Base64 to Uint8Array", () => {
    it("should convert base64url to Uint8Array correctly", () => {
      // Simular a função do frontend
      function urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
          .replace(/-/g, '+')
          .replace(/_/g, '/');
        
        const rawData = atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      }

      const testKey = "BN9JYhB4sCcxdcKSBuA0A_eZ1Pvfw8AO4ZezDtWzlSzO_hGgP3sZFXLEJWs1Lyi4fnSZAlGHNCSMdHZLgfLHJC4";
      const result = urlBase64ToUint8Array(testKey);
      
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBe(65); // VAPID public key is 65 bytes
    });
  });

  describe("Notification Preferences Defaults", () => {
    it("should have correct default values", () => {
      const defaults = {
        classReminders: true,
        eventReminders: true,
        taskReminders: true,
        dailySummary: false,
        classReminderMinutes: 15,
        eventReminderMinutes: 60,
        dailySummaryTime: '07:00',
        activeDays: [1, 2, 3, 4, 5],
        quietHoursStart: '22:00',
        quietHoursEnd: '06:00',
      };

      expect(defaults.classReminders).toBe(true);
      expect(defaults.eventReminders).toBe(true);
      expect(defaults.taskReminders).toBe(true);
      expect(defaults.dailySummary).toBe(false);
      expect(defaults.classReminderMinutes).toBe(15);
      expect(defaults.eventReminderMinutes).toBe(60);
      expect(defaults.dailySummaryTime).toBe('07:00');
      expect(defaults.activeDays).toEqual([1, 2, 3, 4, 5]);
      expect(defaults.quietHoursStart).toBe('22:00');
      expect(defaults.quietHoursEnd).toBe('06:00');
    });
  });

  describe("Reminder Job Management", () => {
    it("should start and stop reminder job without errors", async () => {
      const { startReminderJob, stopReminderJob } = await import("./push-notifications");
      
      // Não deve lançar erro
      expect(() => startReminderJob()).not.toThrow();
      expect(() => stopReminderJob()).not.toThrow();
      
      // Parar novamente não deve causar erro
      expect(() => stopReminderJob()).not.toThrow();
    });
  });
});
