/**
 * In-memory cache with TTL (Time To Live)
 *
 * PURPOSE:
 * Without cache: 10 people loading the dashboard in 5 minutes = 40 BigQuery queries
 * With cache: 10 people loading in 5 minutes = only 4 queries (the first person triggers the queries)
 *
 * HOW IT WORKS:
 * 1. First person loads dashboard → queries BigQuery → stores result in cache for 5 minutes
 * 2. Second person loads dashboard → gets data from cache (instant, no BigQuery cost)
 * 3. After 5 minutes → cache expires → next person triggers fresh BigQuery queries
 *
 * COST SAVINGS:
 * - Reduces BigQuery queries by ~90%
 * - Speeds up response time from 2-3 seconds to <100ms
 * - Saves money on BigQuery costs
 *
 * TRADE-OFF:
 * - Data can be up to 5 minutes "stale" (but GA4 data is already 24-48 hours delayed anyway)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_CACHE_SIZE = 500; // Maximum number of entries before eviction

/**
 * Get cached data if it exists and hasn't expired
 * @param key - Unique cache key (e.g., "metrics:30" for 30-day metrics)
 * @returns Cached data or null if not found/expired
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > entry.ttl) {
    // Cache expired, remove it
    cache.delete(key);
    return null;
  }

  // Cache is still valid
  return entry.data as T;
}

/**
 * Store data in cache with current timestamp.
 * Evicts the oldest entry if the cache exceeds MAX_CACHE_SIZE.
 * @param key - Unique cache key
 * @param data - Data to cache
 * @param ttlMs - Optional TTL override in milliseconds (default: 5 min)
 */
export function setCache<T>(key: string, data: T, ttlMs: number = DEFAULT_CACHE_TTL): void {
  // Evict expired entries first if we're at capacity
  if (cache.size >= MAX_CACHE_SIZE) {
    evictExpired();
  }

  // If still at capacity after evicting expired, remove the oldest entry
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }

  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  });
}

/**
 * Clear cache entries matching a prefix.
 * Use this for targeted invalidation (e.g., clearCacheByPrefix('engagement-calls')
 * won't nuke BigQuery caches).
 */
export function clearCacheByPrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear all cache (useful for testing or manual refresh)
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Remove all expired entries from the cache.
 */
function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key);
    }
  }
}

/**
 * Get cache stats (useful for debugging)
 */
export function getCacheStats() {
  return {
    size: cache.size,
    maxSize: MAX_CACHE_SIZE,
    keys: Array.from(cache.keys()),
  };
}
