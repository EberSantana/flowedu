import { useEffect, useState } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useOfflineSync } from "@/hooks/useOfflineSync";

export default function OfflineIndicator() {
  const { isSyncing, pendingCount, isOnline: isOnlineFromHook, syncPendingActions } = useOfflineSync();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(false);
      
      if (pendingCount > 0) {
        toast.success("Você está online novamente!", {
          description: `Sincronizando ${pendingCount} ${pendingCount === 1 ? 'ação pendente' : 'ações pendentes'}...`,
          icon: <Wifi className="h-4 w-4" />,
        });
      } else {
        toast.success("Você está online novamente!", {
          icon: <Wifi className="h-4 w-4" />,
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
  }, [pendingCount]);

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
              {pendingCount > 0
                ? `${pendingCount} ${pendingCount === 1 ? 'ação pendente' : 'ações pendentes'} para sincronizar`
                : 'Você está sem conexão. Suas alterações serão sincronizadas quando voltar online.'}
            </p>
          </div>
        </div>
        
        {/* Botão de sincronização manual (aparece quando há ações pendentes e está online) */}
        {pendingCount > 0 && isOnline && (
          <button
            onClick={syncPendingActions}
            disabled={isSyncing}
            className="text-white hover:bg-yellow-600 rounded px-3 py-1 text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
          </button>
        )}
        
        {/* Botão "Entendi" (aparece quando está offline e não há ações pendentes) */}
        {(!isOnline || pendingCount === 0) && (
          <button
            onClick={() => setShowBanner(false)}
            className="text-white hover:bg-yellow-600 rounded px-3 py-1 text-sm font-medium transition-colors"
          >
            Entendi
          </button>
        )}
      </div>
    </div>
  );
}
