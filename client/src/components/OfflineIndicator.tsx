import { useEffect, useState } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(false);
      toast.success("Você está online novamente!", {
        description: "Sincronizando dados...",
        icon: <Wifi className="h-4 w-4" />,
      });

      // Tentar sincronizar dados offline
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration: any) => {
          return registration.sync.register('sync-offline-data');
        }).catch((err: Error) => {
          console.error('Background sync registration failed:', err);
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      toast.error("Você está offline", {
        description: "Algumas funcionalidades podem estar limitadas",
        icon: <WifiOff className="h-4 w-4" />,
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Escutar mensagens do Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_COMPLETE') {
          toast.success("Dados sincronizados!", {
            description: "Suas alterações offline foram enviadas",
            icon: <RefreshCw className="h-4 w-4" />,
          });
        }
      });
    }
  }, []);

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-3 shadow-lg">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <WifiOff className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Modo Offline</p>
            <p className="text-xs opacity-90">
              Você está sem conexão. Suas alterações serão sincronizadas quando voltar online.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowBanner(false)}
          className="text-white hover:bg-yellow-600 rounded px-3 py-1 text-sm font-medium transition-colors"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
