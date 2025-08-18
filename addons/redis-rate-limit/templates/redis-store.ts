import type { RateLimitStore, RateLimitResult } from "@atlas/services-rate-limit";
import type { Redis } from "redis";

/**
 * Redis-based rate limit store implementation
 *
 * Implements distributed rate limiting using Redis as the backend store.
 * This allows for consistent rate limiting across multiple server instances.
 */
export class RedisStore implements RateLimitStore {
  constructor(private redis: Redis) {}

  /**
   * Increment the counter for a key using Redis atomic operations
   *
   * @param key - The windowed rate limit key
   * @param windowMs - Window size in milliseconds
   * @returns Current count and reset time
   */
  async incr(key: string, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const resetAt = now + windowMs;

    // Use Redis pipeline for atomic operations
    const pipeline = this.redis.multi();

    // Check if key exists
    pipeline.get(key);

    // Execute the check
    const results = await pipeline.exec();
    const existingValue = results?.[0] as string | null;

    if (!existingValue) {
      // First request for this windowed key - set initial value and TTL
      const setResult = await this.redis.multi().set(key, "1").pexpire(key, windowMs).exec();

      if (!setResult) {
        throw new Error("Failed to set initial rate limit value in Redis");
      }

      return { count: 1, resetAt };
    }

    // Increment existing value
    const count = await this.redis.incr(key);

    // Get TTL to calculate resetAt
    const ttl = await this.redis.pttl(key);
    const actualResetAt = ttl > 0 ? now + ttl : resetAt;

    return { count, resetAt: actualResetAt };
  }

  /**
   * Reset/delete a key from Redis
   *
   * @param key - The rate limit key to reset
   */
  async reset(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * Optional cleanup method - Redis handles TTL automatically
   * so this is mostly a no-op, but can be used for custom cleanup logic
   */
  async cleanup(): Promise<void> {
    // Redis handles TTL cleanup automatically
    // This could be extended for custom cleanup logic if needed
  }
}

/**
 * Factory function to create a Redis store with connection
 *
 * @param redis - Redis client instance
 * @returns Redis store instance
 */
export function createRedisStore(redis: Redis): RedisStore {
  return new RedisStore(redis);
}
