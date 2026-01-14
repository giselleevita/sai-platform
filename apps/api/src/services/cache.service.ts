import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

/**
 * Initialize Redis connection
 */
export function initRedis(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.warn('Redis URL not configured. Caching disabled.');
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
      redisClient = null;
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected');
    });

    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    return null;
  }
}

/**
 * Cache service for Redis operations
 */
export class CacheService {
  private static getClient(): Redis | null {
    if (!redisClient) {
      return initRedis();
    }
    return redisClient;
  }

  /**
   * Get value from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    const client = this.getClient();
    if (!client) {
      return null;
    }

    try {
      const value = await client.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  static async set(key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> {
    const client = this.getClient();
    if (!client) {
      return false;
    }

    try {
      await client.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  static async del(key: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) {
      return false;
    }

    try {
      await client.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  static async delPattern(pattern: string): Promise<number> {
    const client = this.getClient();
    if (!client) {
      return 0;
    }

    try {
      const keys = await client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      await client.del(...keys);
      return keys.length;
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Invalidate cache for a company
   */
  static async invalidateCompany(companyId: string): Promise<void> {
    await Promise.all([
      this.delPattern(`company:${companyId}:tools:*`),
      this.delPattern(`company:${companyId}:risks:*`),
      this.delPattern(`company:${companyId}:summary:*`),
    ]);
  }
}

// Initialize Redis on module load
initRedis();
