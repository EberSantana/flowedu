/**
 * Utilitários para otimização de queries e prevenção de N+1
 */

/**
 * Executa operações em lote com Promise.all para evitar N+1
 */
export async function batchQuery<T, R>(
  items: T[],
  queryFn: (item: T) => Promise<R>
): Promise<R[]> {
  return Promise.all(items.map(queryFn));
}

/**
 * Agrupa itens por chave para batch loading
 */
export function groupBy<T>(
  items: T[],
  keyFn: (item: T) => string | number
): Map<string | number, T[]> {
  const groups = new Map<string | number, T[]>();

  for (const item of items) {
    const key = keyFn(item);
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  }

  return groups;
}

/**
 * Cache simples em memória para queries frequentes
 */
class QueryCache<K, V> {
  private cache = new Map<string, { value: V; expiry: number }>();
  private ttl: number;

  constructor(ttlSeconds: number = 300) {
    this.ttl = ttlSeconds * 1000;
  }

  private getKey(key: K): string {
    return JSON.stringify(key);
  }

  get(key: K): V | null {
    const cacheKey = this.getKey(key);
    const cached = this.cache.get(cacheKey);

    if (!cached) {
      return null;
    }

    // Verificar se expirou
    if (Date.now() > cached.expiry) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.value;
  }

  set(key: K, value: V): void {
    const cacheKey = this.getKey(key);
    this.cache.set(cacheKey, {
      value,
      expiry: Date.now() + this.ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: K): void {
    const cacheKey = this.getKey(key);
    this.cache.delete(cacheKey);
  }
}

/**
 * Wrapper para queries com cache automático
 */
export function createCachedQuery<Args extends any[], Result>(
  queryFn: (...args: Args) => Promise<Result>,
  ttlSeconds: number = 300
) {
  const cache = new QueryCache<Args, Result>(ttlSeconds);

  return async (...args: Args): Promise<Result> => {
    // Tentar obter do cache
    const cached = cache.get(args);
    if (cached !== null) {
      return cached;
    }

    // Executar query
    const result = await queryFn(...args);

    // Armazenar no cache
    cache.set(args, result);

    return result;
  };
}

/**
 * DataLoader simplificado para batch loading
 */
export class SimpleDataLoader<K, V> {
  private batchLoadFn: (keys: K[]) => Promise<V[]>;
  private cache = new Map<string, V>();
  private queue: Array<{
    key: K;
    resolve: (value: V) => void;
    reject: (error: Error) => void;
  }> = [];
  private batchScheduled = false;

  constructor(batchLoadFn: (keys: K[]) => Promise<V[]>) {
    this.batchLoadFn = batchLoadFn;
  }

  private getKey(key: K): string {
    return JSON.stringify(key);
  }

  async load(key: K): Promise<V> {
    // Verificar cache
    const cacheKey = this.getKey(key);
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    // Adicionar à fila
    return new Promise<V>((resolve, reject) => {
      this.queue.push({ key, resolve, reject });

      // Agendar batch se ainda não foi agendado
      if (!this.batchScheduled) {
        this.batchScheduled = true;
        process.nextTick(() => this.executeBatch());
      }
    });
  }

  private async executeBatch(): Promise<void> {
    const batch = this.queue.splice(0);
    this.batchScheduled = false;

    if (batch.length === 0) {
      return;
    }

    try {
      const keys = batch.map((item) => item.key);
      const values = await this.batchLoadFn(keys);

      // Armazenar no cache e resolver promises
      batch.forEach((item, index) => {
        const value = values[index];
        const cacheKey = this.getKey(item.key);
        this.cache.set(cacheKey, value);
        item.resolve(value);
      });
    } catch (error) {
      // Rejeitar todas as promises
      batch.forEach((item) => {
        item.reject(error as Error);
      });
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Paginação helper
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function createPaginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / params.pageSize);

  return {
    data,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages,
    hasNextPage: params.page < totalPages,
    hasPreviousPage: params.page > 1,
  };
}

/**
 * Helper para calcular offset e limit
 */
export function getPaginationParams(page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  return { offset, limit };
}

/**
 * Debounce para operações de busca
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, waitMs);
  };
}

/**
 * Throttle para limitar frequência de operações
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let lastRun = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastRun >= limitMs) {
      func(...args);
      lastRun = now;
    }
  };
}
