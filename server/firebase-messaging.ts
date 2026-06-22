/**
 * Firebase Cloud Messaging (FCM)
 * Sistema de notificações push para iOS, Android e navegadores desktop
 */

import admin from "firebase-admin";
import { getDb } from "./db";
import { fcmTokens, notificationPreferences, pushNotificationLog } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

let firebaseApp: any = null;

/**
 * Inicializa Firebase Admin SDK
 */
export function initializeFirebase() {
  if (firebaseApp) {
    console.log("[FCM] Firebase já inicializado");
    return;
  }

  try {
    // Tentar carregar credenciais do arquivo JSON
    const credentialsPath = path.join(process.cwd(), "firebase-service-account.json");
    
    if (!fs.existsSync(credentialsPath)) {
      console.warn("[FCM] Arquivo firebase-service-account.json não encontrado");
      console.warn("[FCM] Notificações Firebase não estarão disponíveis");
      return;
    }

    const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));

    firebaseApp = (admin as any).initializeApp({
      credential: (admin as any).credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log("[FCM] Firebase inicializado com sucesso");
  } catch (error) {
    console.error("[FCM] Erro ao inicializar Firebase:", error);
  }
}

/**
 * Salva um token FCM do usuário
 */
export async function saveFCMToken(
  userId: number,
  token: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se já existe
  const existing = await db.select()
    .from(fcmTokens)
    .where(
      and(
        eq(fcmTokens.userId, userId),
        eq(fcmTokens.token, token)
      )
    );

  if (existing.length > 0) {
    // Atualizar
    await db.update(fcmTokens)
      .set({
        userAgent: userAgent || null,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(fcmTokens.id, existing[0].id));
    return existing[0].id;
  }

  // Criar novo
  const [result] = await db.insert(fcmTokens).values({
    userId,
    token,
    userAgent: userAgent || null,
    isActive: true,
  });

  console.log(`[FCM] Token salvo para usuário ${userId}`);
  return result.insertId;
}

/**
 * Remove um token FCM
 */
export async function removeFCMToken(userId: number, token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(fcmTokens)
    .where(
      and(
        eq(fcmTokens.userId, userId),
        eq(fcmTokens.token, token)
      )
    );

  console.log(`[FCM] Token removido para usuário ${userId}`);
}

/**
 * Envia uma notificação via Firebase para um usuário
 */
export async function sendFCMNotification(
  userId: number,
  notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    url?: string;
    type?: string;
  }
) {
  if (!firebaseApp) {
    console.warn("[FCM] Firebase não inicializado");
    return false;
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Obter todos os tokens ativos do usuário
  const tokens = await db.select()
    .from(fcmTokens)
    .where(
      and(
        eq(fcmTokens.userId, userId),
        eq(fcmTokens.isActive, true)
      )
    );

  if (tokens.length === 0) {
    console.warn(`[FCM] Nenhum token ativo para usuário ${userId}`);
    return false;
  }

  const messaging = (admin as any).messaging(firebaseApp);
  let successCount = 0;

  // Enviar para cada token
  for (const tokenRecord of tokens) {
    try {
      const message: any = {
        token: tokenRecord.token,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.icon,
        },
        data: {
          url: notification.url || "/dashboard",
          type: notification.type || "notification",
          tag: notification.tag || `fcm-${Date.now()}`,
        },
        webpush: {
          notification: {
            title: notification.title,
            body: notification.body,
            icon: notification.icon || "/icon-192.png",
            badge: notification.badge || "/icon-192.png",
            tag: notification.tag || `fcm-${Date.now()}`,
            requireInteraction: false,
          },
          fcmOptions: {
            link: notification.url || "/dashboard",
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              badge: 1,
              sound: "default",
            },
          },
        },
      };

      const response = await messaging.send(message);
      console.log(`[FCM] Notificação enviada para ${tokenRecord.token.substring(0, 20)}...`);
      successCount++;

      // Registrar no log (nomes de colunas do schema)
      const logEntry: any = {
        userId,
        type: (notification.type as any) || "activity",
        title: notification.title,
        body: notification.body,
        delivered: true,
      };
      await db.insert(pushNotificationLog).values(logEntry);
    } catch (error: any) {
      console.error(`[FCM] Erro ao enviar para token:`, error.message);

      // Se o token é inválido, desativar
      if (error.code === "messaging/invalid-registration-token" ||
          error.code === "messaging/registration-token-not-registered") {
        await db.update(fcmTokens)
          .set({ isActive: false })
          .where(eq(fcmTokens.id, tokenRecord.id));
        console.log(`[FCM] Token desativado (inválido)`);
      }
    }
  }

  return successCount > 0;
}

/**
 * Envia notificação de teste
 */
export async function sendTestNotification(userId: number) {
  return await sendFCMNotification(userId, {
    title: "🧪 Notificação de Teste",
    body: "Se você vê isso, as notificações push estão funcionando!",
    url: "/dashboard",
    type: "test",
  });
}

/**
 * Obtém preferências de notificação do usuário
 */
export async function getNotificationPrefs(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const prefs = await db.select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));

  if (prefs.length === 0) {
    // Retornar preferências padrão
    return {
      classReminders: true,
      eventReminders: true,
      taskReminders: true,
      dailySummary: false,
      classReminderMinutes: 15,
      eventReminderMinutes: 30,
      dailySummaryTime: "07:00",
      activeDays: [1, 2, 3, 4, 5],
      quietHoursStart: "22:00",
      quietHoursEnd: "06:00",
    };
  }

  return prefs[0];
}

/**
 * Salva preferências de notificação
 */
export async function saveNotificationPrefs(userId: number, prefs: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));

  if (existing.length > 0) {
    await db.update(notificationPreferences)
      .set(prefs)
      .where(eq(notificationPreferences.userId, userId));
  } else {
    await db.insert(notificationPreferences).values({
      userId,
      ...prefs,
    });
  }

  return { success: true };
}
