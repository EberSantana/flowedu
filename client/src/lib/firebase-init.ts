/**
 * Inicialização do Firebase Cloud Messaging
 * Executado uma única vez no carregamento da app
 */

import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { firebaseConfig, vapidPublicKey } from "./firebase-config";

let firebaseInitialized = false;

export async function initializeFirebase() {
  if (firebaseInitialized) {
    console.log("[Firebase] Já inicializado");
    return;
  }

  try {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    console.log("[Firebase] Inicializado com sucesso");

    // Obter instância de messaging
    const messaging = getMessaging(app);

    // Registrar service worker para FCM
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        console.log("[Firebase] Service Worker pronto para FCM");

        // Tentar obter token FCM
        if (Notification.permission === "granted") {
          const token = await getToken(messaging, {
            vapidKey: vapidPublicKey,
            serviceWorkerRegistration: registration,
          });

          if (token) {
            console.log("[Firebase] Token FCM obtido:", token.substring(0, 20) + "...");
            // Salvar token no backend (será feito via tRPC no hook useFirebaseNotifications)
          }
        }
      } catch (error) {
        console.warn("[Firebase] Erro ao registrar service worker:", error);
      }
    }

    // Listener para mensagens em foreground
    onMessage(messaging, (payload) => {
      console.log("[Firebase] Mensagem recebida em foreground:", payload);

      // A notificação será exibida pelo service worker
      // Aqui apenas logamos para debug
    });

    firebaseInitialized = true;
  } catch (error) {
    console.error("[Firebase] Erro ao inicializar:", error);
    throw error;
  }
}
