import type {
  RateLimitStore,
  RateLimiterOptions,
  RateLimiterResult,
  RateLimiterAdapter,
} from "./types.js";
import { InMemoryStore } from "./in-memory.js";

/**
 * Rate limiter implementation with windowed counting
 */
export class RateLimiter implements RateLimiterAdapter {
  private store: RateLimitStore;
  private limit: number;
  private windowMs: number;
  private prefix: string;
  private onError?: (error: Error) => void;

  constructor(options: RateLimiterOptions) {
    this.store = options.store ?? new InMemoryStore();
    this.limit = options.limit;
    this.windowMs = options.windowMs;
    this.prefix = options.prefix ?? "api";
    this.onError = options.onError;
  }

  /**
   * Check rate limit for a given key
   *
   * @param rawKey - The raw key (e.g., user ID, IP address)
   * @returns Rate limit result with allowed status and metadata
   */
  async check(rawKey: string): Promise<RateLimiterResult> {
    try {
      const windowedKey = this.generateWindowedKey(rawKey);
      const result = await this.store.incr(windowedKey, this.windowMs);

      const allowed = result.count <= this.limit;
      const remaining = Math.max(0, this.limit - result.count);

      return {
        allowed,
        remaining,
        resetAt: result.resetAt,
        limit: this.limit,
        count: result.count,
      };
    } catch (error) {
      // On store failure, default to allow and log error
      const err = error instanceof Error ? error : new Error(String(error));

      if (this.onError) {
        this.onError(err);
      } else if (process.env.NODE_ENV === "development") {
        console.warn("Rate limiter store error, allowing request:", err.message);
      }

      // Graceful degradation: allow the request
      const now = Date.now();
      return {
        allowed: true,
        remaining: this.limit,
        resetAt: now + this.windowMs,
        limit: this.limit,
        count: 0,
      };
    }
  }

  /**
   * Reset rate limit for a key
   *
   * @param rawKey - The raw key to reset
   */
  async reset(rawKey: string): Promise<void> {
    try {
      const windowedKey = this.generateWindowedKey(rawKey);
      await this.store.reset(windowedKey);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (this.onError) {
        this.onError(err);
      }
      // Silently continue on reset failures
    }
  }

  /**
   * Set error handler for store failures
   *
   * @param handler - Error handler function
   */
  setErrorHandler(handler: (error: Error) => void): void {
    this.onError = handler;
  }

  /**
   * Generate windowed key for rate limiting
   *
   * Format: ${prefix}:${windowId}:${rawKey}
   * Where windowId = Math.floor(Date.now() / windowMs)
   *
   * @param rawKey - The raw key
   * @returns Windowed key string
   */
  private generateWindowedKey(rawKey: string): string {
    const now = Date.now();
    const windowId = Math.floor(now / this.windowMs);
    return `${this.prefix}:${windowId.toString()}:${rawKey}`;
  }
}
