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
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Get cached data if it exists and hasn't expired
 * @param key - Unique cache key (e.g., "metrics:30" for 30-day metrics)
 * @returns Cached data or null if not found/expired
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    // Cache expired, remove it
    cache.delete(key);
    return null;
  }

  // Cache is still valid
  return entry.data as T;
}

/**
 * Store data in cache with current timestamp
 * @param key - Unique cache key
 * @param data - Data to cache
 */
export function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Clear all cache (useful for testing or manual refresh)
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache stats (useful for debugging)
 */
export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
