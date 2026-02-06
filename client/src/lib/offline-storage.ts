/**
 * Módulo de armazenamento offline usando IndexedDB
 * Armazena ações pendentes para sincronização quando voltar online
 */

const DB_NAME = 'flowedu_offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending_actions';

export interface PendingAction {
  id?: number;
  type: 'create' | 'update' | 'delete';
  entity: string; // 'subject', 'class', 'schedule', etc.
  data: any;
  timestamp: number;
  synced: boolean;
}

/**
 * Inicializa o banco de dados IndexedDB
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Falha ao abrir IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Criar object store se não existir
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        
        // Criar índices
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('synced', 'synced', { unique: false });
        objectStore.createIndex('entity', 'entity', { unique: false });
      }
    };
  });
}

/**
 * Adiciona uma ação pendente ao armazenamento offline
 */
export async function addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp' | 'synced'>): Promise<number> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const pendingAction: Omit<PendingAction, 'id'> = {
      ...action,
      timestamp: Date.now(),
      synced: false,
    };
    
    const request = store.add(pendingAction);
    
    request.onsuccess = () => {
      resolve(request.result as number);
    };
    
    request.onerror = () => {
      reject(new Error('Falha ao adicionar ação pendente'));
    };
  });
}

/**
 * Obtém todas as ações pendentes não sincronizadas
 */
export async function getPendingActions(): Promise<PendingAction[]> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('synced');
    
    const request = index.getAll(false);
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      reject(new Error('Falha ao obter ações pendentes'));
    };
  });
}

/**
 * Marca uma ação como sincronizada
 */
export async function markActionAsSynced(id: number): Promise<void> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const action = getRequest.result;
      
      if (action) {
        action.synced = true;
        const updateRequest = store.put(action);
        
        updateRequest.onsuccess = () => {
          resolve();
        };
        
        updateRequest.onerror = () => {
          reject(new Error('Falha ao atualizar ação'));
        };
      } else {
        reject(new Error('Ação não encontrada'));
      }
    };
    
    getRequest.onerror = () => {
      reject(new Error('Falha ao obter ação'));
    };
  });
}

/**
 * Remove uma ação do armazenamento
 */
export async function removeAction(id: number): Promise<void> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(new Error('Falha ao remover ação'));
    };
  });
}

/**
 * Limpa todas as ações sincronizadas
 */
export async function clearSyncedActions(): Promise<void> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('synced');
    
    const request = index.openCursor(IDBKeyRange.only(true));
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      } else {
        resolve();
      }
    };
    
    request.onerror = () => {
      reject(new Error('Falha ao limpar ações sincronizadas'));
    };
  });
}

/**
 * Conta o número de ações pendentes
 */
export async function countPendingActions(): Promise<number> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    // Obter todas as ações e filtrar manualmente
    const request = store.getAll();
    
    request.onsuccess = () => {
      const allActions = request.result as PendingAction[];
      // Contar apenas as ações não sincronizadas
      const pendingCount = allActions.filter(action => !action.synced).length;
      resolve(pendingCount);
    };
    
    request.onerror = () => {
      reject(new Error('Falha ao contar ações pendentes'));
    };
  });
}

/**
 * Limpa todo o banco de dados (usar com cuidado!)
 */
export async function clearAllData(): Promise<void> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.clear();
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(new Error('Falha ao limpar banco de dados'));
    };
  });
}
