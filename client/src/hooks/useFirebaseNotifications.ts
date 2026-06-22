/**
 * Hook para inicializar Firebase Cloud Messaging (FCM)
 * Suporta notificações push em iOS, Android e navegadores desktop
 */

import { useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import { firebaseConfig, vapidPublicKey } from "@/lib/firebase-config";
import { toast } from "sonner";

let firebaseApp: any = null;
let messaging: Messaging | null = null;

/**
 * Inicializa Firebase uma única vez
 */
function initializeFirebase() {
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
    messaging = getMessaging(firebaseApp);
  }
  return messaging;
}

/**
 * Registra o service worker para FCM
 */
async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/firebase-sw.js", {
        scope: "/",
      });
      console.log("[FCM] Service Worker registrado:", registration);
      return registration;
    } catch (error) {
      console.error("[FCM] Erro ao registrar Service Worker:", error);
      return null;
    }
  }
  return null;
}

/**
 * Obtém o token FCM do dispositivo
 */
async function getFCMToken(messaging: Messaging): Promise<string | null> {
  try {
    // Verificar se o navegador suporta FCM
    if (!("serviceWorker" in navigator) || !("Notification" in window)) {
      console.warn("[FCM] Navegador não suporta notificações");
      return null;
    }

    // Pedir permissão
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("[FCM] Permissão de notificação negada");
      return null;
    }

    // Obter token
    const token = await getToken(messaging, {
      vapidKey: vapidPublicKey,
    });

    console.log("[FCM] Token obtido:", token);
    return token;
  } catch (error) {
    console.error("[FCM] Erro ao obter token:", error);
    return null;
  }
}

/**
 * Salva token FCM no backend via fetch
 */
async function saveFCMTokenToBackend(token: string) {
  try {
    const response = await fetch("/api/trpc/pushNotifications.saveFCMToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        json: {
          token,
          userAgent: navigator.userAgent,
        },
      }),
    });

    if (response.ok) {
      console.log("[FCM] Token salvo no backend");
      return true;
    } else {
      console.error("[FCM] Erro ao salvar token:", response.statusText);
      return false;
    }
  } catch (error) {
    console.error("[FCM] Erro ao salvar token no backend:", error);
    return false;
  }
}

export function useFirebaseNotifications() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initFCM = async () => {
      try {
        // Registrar service worker
        const swReg = await registerServiceWorker();
        if (!swReg) {
          console.warn("[FCM] Service Worker não disponível");
          return;
        }

        // Inicializar Firebase
        const msg = initializeFirebase();
        if (!msg) {
          console.warn("[FCM] Firebase não disponível");
          return;
        }

        // Obter token FCM
        const token = await getFCMToken(msg);
        if (!token) {
          console.warn("[FCM] Não foi possível obter token FCM");
          return;
        }

        // Salvar token no backend
        await saveFCMTokenToBackend(token);

        // Listener para mensagens recebidas em foreground
        onMessage(msg, (payload) => {
          console.log("[FCM] Mensagem recebida em foreground:", payload);

          const { notification, data } = payload;
          if (notification) {
            toast.success(notification.title || "Nova notificação", {
              description: notification.body,
            });
          }
        });

        console.log("[FCM] Inicialização concluída com sucesso");
      } catch (error) {
        console.error("[FCM] Erro durante inicialização:", error);
      }
    };

    initFCM();
  }, []);
}
