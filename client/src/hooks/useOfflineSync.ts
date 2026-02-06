import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getPendingActions,
  markActionAsSynced,
  removeAction,
  countPendingActions,
  type PendingAction,
} from '@/lib/offline-storage';

/**
 * Hook para gerenciar sincronização de dados offline
 */
export function useOfflineSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Atualizar contagem de ações pendentes
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await countPendingActions();
      setPendingCount(count);
    } catch (error) {
      console.error('[Offline] Erro ao contar ações pendentes:', error);
    }
  }, []);

  // Sincronizar ações pendentes
  const syncPendingActions = useCallback(async () => {
    if (isSyncing || !isOnline) {
      return;
    }

    setIsSyncing(true);

    try {
      const actions = await getPendingActions();

      if (actions.length === 0) {
        setIsSyncing(false);
        return;
      }

      console.log(`[Offline] Sincronizando ${actions.length} ações pendentes...`);

      let successCount = 0;
      let failCount = 0;

      for (const action of actions) {
        try {
          // Aqui você implementaria a lógica específica para cada tipo de ação
          // Por exemplo, fazer requisições tRPC para criar/atualizar/deletar dados
          await syncAction(action);

          // Marcar como sincronizada
          await markActionAsSynced(action.id!);
          successCount++;
        } catch (error) {
          console.error('[Offline] Erro ao sincronizar ação:', action, error);
          failCount++;
        }
      }

      // Atualizar contagem
      await updatePendingCount();

      // Notificar usuário
      if (successCount > 0) {
        toast.success(`${successCount} ${successCount === 1 ? 'ação sincronizada' : 'ações sincronizadas'}!`, {
          description: failCount > 0 ? `${failCount} ${failCount === 1 ? 'falhou' : 'falharam'}` : undefined,
        });
      }

      if (failCount > 0 && successCount === 0) {
        toast.error('Falha ao sincronizar ações offline', {
          description: 'Tentaremos novamente em breve',
        });
      }
    } catch (error) {
      console.error('[Offline] Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar dados offline');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOnline, updatePendingCount]);

  // Sincronizar uma ação específica
  const syncAction = async (action: PendingAction): Promise<void> => {
    // Esta função deve ser implementada de acordo com a lógica do seu app
    // Por exemplo, fazer requisições tRPC para criar/atualizar/deletar dados
    
    console.log('[Offline] Sincronizando ação:', action);

    // Exemplo de implementação (você deve adaptar para seu caso):
    // switch (action.entity) {
    //   case 'subject':
    //     if (action.type === 'create') {
    //       await trpc.subjects.create.mutate(action.data);
    //     } else if (action.type === 'update') {
    //       await trpc.subjects.update.mutate(action.data);
    //     } else if (action.type === 'delete') {
    //       await trpc.subjects.delete.mutate({ id: action.data.id });
    //     }
    //     break;
    //   // ... outros casos
    // }

    // Por enquanto, apenas simular sucesso
    return Promise.resolve();
  };

  // Escutar mudanças de status online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Sincronizar automaticamente quando voltar online
      setTimeout(() => {
        syncPendingActions();
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingActions]);

  // Atualizar contagem inicial
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // Escutar mensagens do service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'SYNC_REQUESTED') {
          syncPendingActions();
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, [syncPendingActions]);

  return {
    isSyncing,
    pendingCount,
    isOnline,
    syncPendingActions,
    updatePendingCount,
  };
}
