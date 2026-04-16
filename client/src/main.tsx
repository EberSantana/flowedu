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
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

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

// ==================== SERVICE WORKER ====================
// Só registrar SW em produção (não em dev/preview para evitar cache de assets antigos)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      // 1. Verificar se há um SW antigo registrado
      const existingRegs = await navigator.serviceWorker.getRegistrations();
      
      // 2. Registrar o novo SW
      const registration = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none', // Sempre buscar sw.js do servidor, sem cache
      });
      
      console.log('[PWA] Service Worker registrado');

      // 3. Verificar atualizações a cada 30 minutos
      setInterval(() => registration.update(), 30 * 60 * 1000);

      // 4. Quando nova versão for encontrada, ativar imediatamente
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] Nova versão disponível, ativando...');
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

    } catch (error) {
      console.error('[PWA] Falha ao registrar Service Worker:', error);
    }
  });

  // 5. Quando o novo SW assumir controle, recarregar UMA VEZ
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    console.log('[PWA] Novo SW ativo, recarregando...');
    window.location.reload();
  });
}
