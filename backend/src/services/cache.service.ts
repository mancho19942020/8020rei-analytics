/**
 * Cache Service
 *
 * Provides caching functionality for API responses.
 * Supports both in-memory caching (development) and Redis (production).
 *
 * Cache TTLs are configurable per data source:
 * - BigQuery GA4: 5 min (data is 24-48h delayed anyway)
 * - Salesforce: 1 min (real-time API)
 * - Skip Trace: 5 min
 * - AWS Pipelines: 1 min (for real-time job status)
 * - QA Axioms: 2 min
 * - ML Models: 5 min
 */

import Redis from 'ioredis';

// Default cache TTLs (in seconds) per data source
export const CACHE_TTLS: Record<string, number> = {
  'bigquery-ga4': 300,      // 5 minutes
  'salesforce': 60,          // 1 minute
  'skiptrace': 300,          // 5 minutes
  'aws-pipelines': 60,       // 1 minute
  'qa-axioms': 120,          // 2 minutes
  'ml-models': 300,          // 5 minutes
  'default': 300,            // 5 minutes
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheService {
  private redis: Redis | null = null;
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map();
  private useRedis: boolean = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl);
        this.useRedis = true;
        console.log('[Cache] Connected to Redis');

        this.redis.on('error', (err) => {
          console.error('[Cache] Redis error:', err);
          // Fall back to memory cache
          this.useRedis = false;
        });
      } catch (error) {
        console.warn('[Cache] Failed to connect to Redis, using in-memory cache');
        this.useRedis = false;
      }
    } else {
      console.log('[Cache] No Redis URL configured, using in-memory cache');
    }
  }

  /**
   * Get a cached value
   */
  async get<T>(key: string): Promise<T | null> {
    if (this.useRedis && this.redis) {
      try {
        const cached = await this.redis.get(key);
        if (cached) {
          return JSON.parse(cached) as T;
        }
      } catch (error) {
        console.error('[Cache] Redis get error:', error);
      }
    }

    // Check memory cache
    const entry = this.memoryCache.get(key);
    if (entry) {
      const now = Date.now();
      if (now - entry.timestamp < entry.ttl * 1000) {
        return entry.data as T;
      }
      // Expired, remove from cache
      this.memoryCache.delete(key);
    }

    return null;
  }

  /**
   * Set a cached value
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds || CACHE_TTLS.default;

    if (this.useRedis && this.redis) {
      try {
        await this.redis.setex(key, ttl, JSON.stringify(value));
      } catch (error) {
        console.error('[Cache] Redis set error:', error);
      }
    }

    // Also set in memory cache (as backup or primary)
    this.memoryCache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Delete a cached value
   */
  async delete(key: string): Promise<void> {
    if (this.useRedis && this.redis) {
      try {
        await this.redis.del(key);
      } catch (error) {
        console.error('[Cache] Redis delete error:', error);
      }
    }

    this.memoryCache.delete(key);
  }

  /**
   * Clear all cached values matching a pattern
   */
  async clearPattern(pattern: string): Promise<void> {
    if (this.useRedis && this.redis) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.error('[Cache] Redis clear pattern error:', error);
      }
    }

    // Clear matching keys from memory cache
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Clear all cached values
   */
  async clearAll(): Promise<void> {
    if (this.useRedis && this.redis) {
      try {
        await this.redis.flushdb();
      } catch (error) {
        console.error('[Cache] Redis flush error:', error);
      }
    }

    this.memoryCache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    type: 'redis' | 'memory';
    memoryEntries: number;
    memorySize: number;
  } {
    let memorySize = 0;
    for (const entry of this.memoryCache.values()) {
      memorySize += JSON.stringify(entry).length;
    }

    return {
      type: this.useRedis ? 'redis' : 'memory',
      memoryEntries: this.memoryCache.size,
      memorySize,
    };
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
