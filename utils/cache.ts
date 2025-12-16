interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// In-memory cache (resets on cold start)
const cache = new Map<string, CacheItem<any>>();

export const CacheService = {
  get: <T>(key: string): T | null => {
    const item = cache.get(key);
    
    if (!item) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - item.timestamp > item.ttl;

    if (isExpired) {
      cache.delete(key);
      return null;
    }

    return item.data;
  },

  set: <T>(key: string, data: T, ttl: number = 60000): void => {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  },

  delete: (key: string): void => {
    cache.delete(key);
  },

  deletePattern: (pattern: string): void => {
    const keys = Array.from(cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    });
  },

  clear: (): void => {
    cache.clear();
  },

  has: (key: string): boolean => {
    const item = cache.get(key);
    if (!item) return false;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      cache.delete(key);
      return false;
    }

    return true;
  }
};

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  GAMES_LIST: 24 * 60 * 60 * 1000,   // 24 hours (games don't change often)
  GAME_DETAIL: 24 * 60 * 60 * 1000,  // 24 hours
  RATINGS_STATS: 5 * 60 * 1000,      // 5 minutes (ratings update frequently)
  COMMENTS: 2 * 60 * 1000,           // 2 minutes (comments are real-time)
};