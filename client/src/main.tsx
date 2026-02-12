import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
      staleTime: 10 * 60 * 1000, // 10 minutos - cache mais agressivo
      gcTime: 30 * 60 * 1000, // 30 minutos - mantém dados em cache por mais tempo
      networkMode: 'online', // Só faz requests quando online
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

// REMOVIDO: Subscribers de redirecionamento automático
// O redirecionamento agora é gerenciado individualmente por cada página protegida

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <App />
    </trpc.Provider>
  </QueryClientProvider>
);

// Registrar Service Worker para PWA com atualização automática
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registrado, versão app:', __APP_VERSION__);
        
        // Verificar atualizações a cada 30 minutos
        setInterval(() => {
          registration.update();
        }, 30 * 60 * 1000);
        
        // Quando uma nova versão do SW for encontrada
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova versão disponível - forçar ativação imediata
              console.log('[PWA] Nova versão detectada, atualizando...');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch((error) => {
        console.error('[PWA] Falha ao registrar Service Worker:', error);
      });
  });
  
  // Quando o novo SW assumir controle, recarregar a página
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[PWA] Novo Service Worker ativo, recarregando...');
    window.location.reload();
  });
  
  // Ouvir mensagens do SW (ex: notificação de atualização)
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SW_UPDATED') {
      console.log('[PWA] Cache atualizado para versão:', event.data.version);
    }
  });
}
