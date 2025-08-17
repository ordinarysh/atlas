import type { RateLimitStore, RateLimitResult } from "./types.js";

interface MemoryRecord {
  count: number;
  resetAt: number;
}

/**
 * In-memory rate limit store with TTL and garbage collection
 *
 * ⚠️  WARNING: This is for DEVELOPMENT and single-instance deployments only.
 * In production with multiple server instances, this will NOT work correctly
 * as each instance will have its own memory store.
 *
 * For distributed rate limiting, use a Redis-based store implementation.
 */
export class InMemoryStore implements RateLimitStore {
  private store = new Map<string, MemoryRecord>();
  private cleanupInterval: NodeJS.Timeout | undefined;
  private cleanupIntervalMs = 60_000; // Clean up every minute

  constructor(options?: { cleanupIntervalMs?: number }) {
    this.cleanupIntervalMs = options?.cleanupIntervalMs ?? 60_000;
    this.startCleanupInterval();

    // Warn about production usage
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "⚠️  WARNING: Using in-memory rate limiting in production. " +
          "This will not work correctly with multiple server instances. " +
          "Use a Redis-based store for production deployments.",
      );
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanupInterval(): void {
    if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
      // Skip cleanup in test environment to avoid timing issues
      return;
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.cleanupIntervalMs);

    // Use unref() to prevent the timer from keeping the process alive
    if ("unref" in this.cleanupInterval) {
      this.cleanupInterval.unref();
    }

    // Cleanup on process exit
    if (typeof process !== "undefined") {
      const cleanup = (): void => {
        this.stopCleanup();
      };
      process.once("exit", cleanup);
      process.once("SIGINT", cleanup);
      process.once("SIGTERM", cleanup);
    }
  }

  /**
   * Stop the cleanup interval
   */
  private stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Simulate Redis INCR + PEXPIRE behavior
   * Works with windowed keys provided by caller.
   * First incr on a key sets resetAt = now + windowMs
   *
   * @param key - The windowed rate limit key (e.g., "api:123:user-456")
   * @param windowMs - Window size in milliseconds
   * @returns Current count and reset time
   */
  incr(key: string, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();

    const existing = this.store.get(key);

    if (!existing) {
      // First request for this windowed key
      const resetAt = now + windowMs;
      const record: MemoryRecord = { count: 1, resetAt };
      this.store.set(key, record);
      return Promise.resolve({ count: 1, resetAt });
    }

    // Increment existing record
    existing.count++;
    return Promise.resolve({ count: existing.count, resetAt: existing.resetAt });
  }

  /**
   * Reset/delete a key
   *
   * @param key - The rate limit key to reset
   */
  reset(key: string): Promise<void> {
    this.store.delete(key);
    return Promise.resolve();
  }

  /**
   * Remove expired entries to prevent unbounded growth
   */
  cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, record] of this.store.entries()) {
      if (now >= record.resetAt) {
        this.store.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0 && process.env.NODE_ENV === "development") {
      console.debug(
        `Rate limit memory store: Cleaned up ${removedCount.toString()} expired entries`,
      );
    }
  }

  /**
   * Get store statistics for monitoring
   */
  getStats(): { totalKeys: number; memoryUsage: number } {
    // Rough estimate of memory usage (not exact but useful for monitoring)
    const memoryUsage = this.store.size * 64; // ~64 bytes per entry estimate

    return {
      totalKeys: this.store.size,
      memoryUsage,
    };
  }

  /**
   * Clear all entries (useful for testing)
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get all active keys (useful for debugging)
   */
  getActiveKeys(): string[] {
    const now = Date.now();
    const activeKeys: string[] = [];

    for (const [key, record] of this.store.entries()) {
      if (now < record.resetAt) {
        activeKeys.push(key);
      }
    }

    return activeKeys;
  }
}
