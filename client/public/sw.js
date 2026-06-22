// Service Worker para PWA - FlowEdu
// VERSÃO INJETADA NO DEPLOY - não usar Date.now() para evitar loops de reload
// O deploy.sh substitui esta linha com: const CACHE_VERSION = 'TIMESTAMP';
const CACHE_VERSION = 'DEPLOY_VERSION_PLACEHOLDER';
const CACHE_NAME = `flowedu-v${CACHE_VERSION}`;

// ==================== INSTALAÇÃO ====================
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando versão:', CACHE_VERSION);
  // Ativar imediatamente sem esperar abas fecharem
  event.waitUntil(self.skipWaiting());
});

// ==================== ATIVAÇÃO ====================
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando versão:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Versão', CACHE_VERSION, 'ativada');
      return self.clients.claim();
    }).then(() => {
      // Forçar reload em todos os clientes após atualização do SW
      // Isso garante que o browser carregue os novos assets após deploy
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          console.log('[SW] Forçando reload do cliente após atualização');
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
        });
      });
    })
  );
});

// ==================== FETCH ====================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar não-GET e outros domínios
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // NUNCA cachear API
  if (url.pathname.startsWith('/api/')) return;

  // NUNCA cachear sw.js (sempre buscar do servidor)
  if (url.pathname === '/sw.js') return;

  // Assets com hash (imutáveis) - Cache-First
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return new Response('Asset not found', { status: 404 });
        }
      })
    );
    return;
  }

  // HTML / navegação - Network-First (sempre pegar versão mais recente)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request).catch(() => caches.match('/') || createOfflineResponse())
    );
    return;
  }

  // Outros recursos estáticos - Cache-First
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      } catch {
        return createOfflineResponse();
      }
    })
  );
});

// ==================== MENSAGENS ====================
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CLEAR_ALL_CACHE') {
    event.waitUntil(
      caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))))
    );
  }
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_VERSION });
  }
});

// ==================== BADGE COUNTER ====================
let badgeCount = 0;

async function updateBadge(increment) {
  try {
    if (increment) {
      badgeCount += 1;
    }
    if (navigator.setAppBadge) {
      if (badgeCount > 0) {
        await navigator.setAppBadge(badgeCount);
      } else {
        await navigator.clearAppBadge();
      }
      console.log('[SW] Badge atualizado:', badgeCount);
    }
  } catch (e) {
    console.warn('[SW] Erro ao atualizar badge:', e);
  }
}

async function clearBadge() {
  try {
    badgeCount = 0;
    if (navigator.setAppBadge) {
      await navigator.clearAppBadge();
      console.log('[SW] Badge limpo');
    }
  } catch (e) {
    console.warn('[SW] Erro ao limpar badge:', e);
  }
}

// Listener para mensagens do frontend (limpar badge, sincronizar contagem)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_BADGE') {
    clearBadge();
  } else if (event.data && event.data.type === 'SET_BADGE') {
    badgeCount = event.data.count || 0;
    updateBadge(false);
  }
});

// ==================== PUSH NOTIFICATIONS ====================
self.addEventListener('push', (event) => {
  let data = {
    title: 'FlowEdu',
    body: 'Você tem uma nova notificação',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'flowedu-notification',
    data: { url: '/dashboard' },
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    console.warn('[SW] Erro ao parsear push data:', e);
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        badge: data.badge || '/icon-192.png',
        tag: data.tag || `flowedu-${Date.now()}`,
        vibrate: [200, 100, 200],
        requireInteraction: false,
        data: data.data || { url: '/dashboard' },
        actions: [
          { action: 'open', title: 'Abrir' },
          { action: 'dismiss', title: 'Dispensar' },
        ],
      }),
      updateBadge(true),
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/dashboard';
  
  // Decrementar badge ao clicar na notificação
  if (badgeCount > 0) badgeCount -= 1;
  updateBadge(false);
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Avisar o frontend para sincronizar o badge
          client.postMessage({ type: 'NOTIFICATION_CLICKED', url });
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notificação fechada:', event.notification.tag);
});

console.log('[SW] Carregado, versão:', CACHE_VERSION);
