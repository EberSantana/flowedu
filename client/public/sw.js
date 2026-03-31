// Service Worker para PWA - FlowEdu
// A versão é controlada automaticamente pelo sistema de deploy
// Quando o sw.js muda (nova versão injetada), o browser detecta e atualiza automaticamente
const CACHE_VERSION = (typeof __SW_VERSION__ !== 'undefined' && __SW_VERSION__ !== '__SW_VERSION__') ? __SW_VERSION__ : Date.now().toString(); // Versão injetada no deploy
const CACHE_NAME = `flowedu-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `flowedu-runtime-${CACHE_VERSION}`;

// Recursos estáticos essenciais para cache offline
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando nova versão:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Failed to cache some static assets:', err);
      });
    }).then(() => {
      console.log('[SW] Installation complete, skipping waiting');
      // Força ativação imediata sem esperar abas fecharem
      return self.skipWaiting();
    })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando nova versão:', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Remover TODOS os caches que não são da versão atual
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Versão', CACHE_VERSION, 'ativada com sucesso');
      // Toma controle de todas as abas imediatamente
      return self.clients.claim();
    }).then(() => {
      // Notifica todas as abas abertas que uma nova versão está ativa
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: CACHE_VERSION
          });
        });
      });
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requisições não-GET
  if (request.method !== 'GET') return;
  
  // Ignorar requisições de outros domínios
  if (url.origin !== self.location.origin) return;
  
  // NUNCA cachear arquivos de assets com hash do Vite (eles já são imutáveis)
  // Se o browser pedir um asset que não existe, deixar o servidor retornar 404/302
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }
  
  // NUNCA cachear módulos dinâmicos do Vite (.tsx, .ts, .jsx, .js com @fs ou src/)
  if (url.pathname.includes('/src/') || url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts') || url.pathname.includes('@fs') || url.pathname.includes('@vite') || url.pathname.includes('node_modules')) {
    event.respondWith(fetch(request));
    return;
  }
  
  // Network-First para API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // Network-First para index.html e rotas SPA (sempre buscar a versão mais recente)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // Cache-First para outros recursos estáticos (imagens, fontes, etc)
  event.respondWith(cacheFirstStrategy(request));
});

// Estratégia Network-First: Busca na rede primeiro, depois no cache
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    
    // Se for navegação HTML, retornar página offline
    if (request.mode === 'navigate') {
      return createOfflineResponse();
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Estratégia Cache-First para assets estáticos
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || createOfflineResponse();
  }
}

// Criar resposta offline HTML
function createOfflineResponse() {
  return new Response(
    `<!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - FlowEdu</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex; align-items: center; justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white; text-align: center; padding: 20px;
        }
        .container {
          max-width: 500px; background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px); border-radius: 20px;
          padding: 40px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        .icon { font-size: 4rem; margin-bottom: 1rem; }
        h1 { font-size: 2rem; margin-bottom: 1rem; }
        p { font-size: 1.1rem; opacity: 0.95; margin-bottom: 2rem; line-height: 1.6; }
        button {
          background: white; color: #3b82f6; border: none;
          padding: 14px 32px; font-size: 1rem; border-radius: 10px;
          cursor: pointer; font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📡</div>
        <h1>Você está offline</h1>
        <p>Verifique sua conexão com a internet e tente novamente.</p>
        <button onclick="window.location.reload()">Tentar Novamente</button>
      </div>
    </body>
    </html>`,
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

// ==================== PUSH NOTIFICATIONS ====================

// Receber notificação push
self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido:', event);
  
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
  
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'flowedu-notification',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    data: data.data || { url: '/dashboard' },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'Dispensar' },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event.action);
  event.notification.close();
  
  if (event.action === 'dismiss') return;
  
  const url = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se já tem uma aba aberta, focar nela
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Senão, abrir nova aba
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

// Fechar notificação
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notificação fechada:', event.notification.tag);
});

// Mensagens do cliente
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

console.log('[SW] Service Worker loaded, version:', CACHE_VERSION);
