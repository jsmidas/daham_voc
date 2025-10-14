import { createClient, RedisClientType } from 'redis';
import { env } from './env';

let redisClient: RedisClientType | null = null;

/**
 * Get Redis client instance
 */
export function getRedisClient(): RedisClientType | null {
  return redisClient;
}

/**
 * Connect to Redis
 */
export async function connectRedis(): Promise<void> {
  try {
    // Skip Redis if URL is not configured
    if (!env.REDIS_URL) {
      console.log('⚠️  Redis URL not configured - Caching disabled');
      return;
    }

    redisClient = createClient({
      url: env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.log('⚠️  Redis reconnection failed - Caching disabled');
            return new Error('Redis reconnection limit exceeded');
          }
          return retries * 100;
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
    console.log('✅ Redis connected successfully');
  } catch (error: any) {
    console.warn('⚠️  Redis connection failed - Caching disabled:', error.message);
    redisClient = null;
  }
}

/**
 * Disconnect from Redis
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('Redis disconnected');
    } catch (error: any) {
      console.error('Error disconnecting from Redis:', error.message);
    }
  }
}

/**
 * Cache helper functions
 */
export const cache = {
  async get(key: string): Promise<string | null> {
    if (!redisClient) return null;
    try {
      return await redisClient.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  },

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!redisClient) return;
    try {
      if (ttl) {
        await redisClient.setEx(key, ttl, value);
      } else {
        await redisClient.set(key, value);
      }
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  },

  async del(...keys: string[]): Promise<void> {
    if (!redisClient) return;
    try {
      await redisClient.del(keys);
    } catch (error) {
      console.error('Redis DEL error:', error);
    }
  },

  async keys(pattern: string): Promise<string[]> {
    if (!redisClient) return [];
    try {
      return await redisClient.keys(pattern);
    } catch (error) {
      console.error('Redis KEYS error:', error);
      return [];
    }
  },
};
