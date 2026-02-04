// Service Worker para PWA - FlowEdu
// Versão do cache - incrementar quando houver mudanças importantes
const CACHE_VERSION = 'v1.2.0';
const CACHE_NAME = `teacher-schedule-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// Recursos estáticos essenciais para cache offline
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Rotas da aplicação para pré-cache
const APP_ROUTES = [
  '/dashboard',
  '/subjects',
  '/classes',
  '/schedule',
  '/learning-paths',
  '/calendar',
  '/reports',
  '/student/dashboard',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Cache de assets estáticos
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch(err => {
          console.warn('[SW] Failed to cache some static assets:', err);
        });
      }),
      // Cache de rotas da aplicação
      caches.open(RUNTIME_CACHE).then((cache) => {
        console.log('[SW] Caching app routes');
        return Promise.all(
          APP_ROUTES.map(route => {
            return cache.add(route).catch(err => {
              console.warn(`[SW] Failed to cache route ${route}:`, err);
            });
          })
        );
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      return self.skipWaiting();
    })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Remover caches antigos
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service Worker ativado');
      return self.clients.claim();
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignorar requisições de outros domínios
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Estratégia baseada no tipo de recurso
  if (url.pathname.startsWith('/api/')) {
    // Network-First para API
    event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE));
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2)$/)) {
    // Cache-First para assets estáticos
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
  } else {
    // Stale-While-Revalidate para páginas HTML
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  }
});

// Estratégia Cache-First: Busca no cache primeiro, depois na rede
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache-First failed:', error);
    const cachedResponse = await caches.match(request);
    return cachedResponse || createOfflineResponse();
  }
}

// Estratégia Network-First: Busca na rede primeiro, depois no cache
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network-First failed, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Retornar resposta offline para API
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Você está offline. Esta requisição será sincronizada quando você voltar online.' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Estratégia Stale-While-Revalidate: Retorna cache imediatamente e atualiza em background
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  // Fetch em background para atualizar cache
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    // Verificar se a resposta é válida antes de clonar
    if (networkResponse && networkResponse.status === 200 && networkResponse.ok) {
      try {
        // Clonar ANTES de usar a resposta
        const responseToCache = networkResponse.clone();
        const cache = await caches.open(cacheName);
        await cache.put(request, responseToCache);
      } catch (error) {
        console.warn('[SW] Failed to cache response:', error);
      }
    }
    return networkResponse;
  }).catch(error => {
    console.log('[SW] Network fetch failed:', error);
    return cachedResponse || createOfflineResponse();
  });
  
  // Retornar cache imediatamente se disponível, senão esperar fetch
  return cachedResponse || fetchPromise;
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
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          padding: 20px;
        }
        .container {
          max-width: 500px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }
        p {
          font-size: 1.1rem;
          opacity: 0.95;
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        button {
          background: white;
          color: #667eea;
          border: none;
          padding: 14px 32px;
          font-size: 1rem;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }
        button:active {
          transform: translateY(0);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📡</div>
        <h1>Você está offline</h1>
        <p>Não foi possível carregar esta página. Verifique sua conexão com a internet e tente novamente.</p>
        <button onclick="window.location.reload()">Tentar Novamente</button>
      </div>
    </body>
    </html>`,
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}

// Sincronização em background quando voltar online
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

// Sincronizar dados offline (placeholder para implementação futura)
async function syncOfflineData() {
  console.log('[SW] Syncing offline data...');
  
  try {
    // TODO: Implementar sincronização com IndexedDB
    // 1. Buscar requisições pendentes do IndexedDB
    // 2. Enviar cada requisição para o servidor
    // 3. Remover da fila após sucesso
    
    console.log('[SW] Sync completed');
    
    // Notificar o cliente sobre a sincronização
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error;
  }
}

// Mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls || []);
      })
    );
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[SW] Service Worker loaded', CACHE_VERSION);
