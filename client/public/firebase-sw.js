/**
 * Service Worker para Firebase Cloud Messaging
 * Importa scripts do Firebase e trata mensagens push
 */

// Importar Firebase scripts
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

// Configuração do Firebase (mesma do frontend)
const firebaseConfig = {
  apiKey: "AIzaSyDxK_placeholder",
  authDomain: "flowedu-18cb7.firebaseapp.com",
  projectId: "flowedu-18cb7",
  storageBucket: "flowedu-18cb7.appspot.com",
  messagingSenderId: "101480460831445015399",
  appId: "1:101480460831445015399:web:placeholder",
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ==================== MENSAGENS EM BACKGROUND ====================
// Quando a app está fechada ou em background, as mensagens são tratadas aqui
messaging.onBackgroundMessage((payload) => {
  console.log("[FCM-SW] Mensagem recebida em background:", payload);

  const { notification, data } = payload;
  if (!notification) return;

  const notificationOptions = {
    body: notification.body || "Você tem uma nova notificação",
    icon: notification.icon || "/icon-192.png",
    badge: notification.badge || "/icon-192.png",
    tag: notification.tag || `fcm-${Date.now()}`,
    vibrate: [200, 100, 200],
    requireInteraction: false,
    data: data || { url: "/dashboard" },
    actions: [
      { action: "open", title: "Abrir" },
      { action: "dismiss", title: "Dispensar" },
    ],
  };

  self.registration.showNotification(notification.title || "FlowEdu", notificationOptions);
});

// ==================== CLIQUE NA NOTIFICAÇÃO ====================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Procurar por uma aba já aberta
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.postMessage({ type: "NOTIFICATION_CLICKED", url });
          client.navigate(url);
          return client.focus();
        }
      }
      // Abrir nova aba se nenhuma estiver aberta
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

// ==================== FECHAR NOTIFICAÇÃO ====================
self.addEventListener("notificationclose", (event) => {
  console.log("[FCM-SW] Notificação fechada:", event.notification.tag);
});

console.log("[FCM-SW] Service Worker do Firebase carregado");
