/**
 * Rate limiting result returned by store operations
 */
export interface RateLimitResult {
  /** Current count within the window */
  count: number;
  /** Unix timestamp when the window resets */
  resetAt: number;
}

/**
 * Provider-agnostic rate limit store interface (Port)
 *
 * This interface allows for easy swapping between in-memory (dev)
 * and Redis (production) implementations.
 */
export interface RateLimitStore {
  /**
   * Increment the counter for a key and return current state
   *
   * @param key - The rate limit key (should be windowed by caller)
   * @param windowMs - Time window in milliseconds
   * @returns Promise with count and resetTime
   */
  incr(key: string, windowMs: number): Promise<RateLimitResult>;

  /**
   * Reset/delete the counter for a key
   *
   * @param key - The rate limit key to reset
   */
  reset(key: string): Promise<void>;

  /**
   * Optional cleanup method for store maintenance
   * Used by memory store to clean up expired entries
   */
  cleanup?(): void | Promise<void>;
}

/**
 * Rate limiter factory options
 */
export interface RateLimiterOptions {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Store implementation (defaults to memory) */
  store?: RateLimitStore;
  /** Key prefix for namespacing */
  prefix?: string;
  /** Error handler for store failures */
  onError?: (error: Error) => void;
}

/**
 * Rate limiter result returned to callers
 */
export interface RateLimiterResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of requests remaining in window */
  remaining: number;
  /** Unix timestamp when window resets */
  resetAt: number;
  /** Maximum requests allowed in window */
  limit: number;
  /** Current count in window */
  count: number;
}

/**
 * Rate limiter adapter interface
 */
export interface RateLimiterAdapter {
  /**
   * Check rate limit for a given key
   *
   * @param rawKey - The raw key (e.g., user ID, IP address)
   * @returns Rate limit result with allowed status and metadata
   */
  check(rawKey: string): Promise<RateLimiterResult>;

  /**
   * Reset rate limit for a key
   *
   * @param rawKey - The raw key to reset
   */
  reset(rawKey: string): Promise<void>;

  /**
   * Set error handler for store failures
   *
   * @param handler - Error handler function
   */
  setErrorHandler(handler: (error: Error) => void): void;
}

/**
 * Rate limiter service configuration
 */
export interface RateLimiterConfig {
  /** Store adapter to use (defaults to memory) */
  adapter?: RateLimitStore;
  /** Default options for rate limiters */
  defaultOptions?: Partial<RateLimiterOptions>;
  /** Logger instance */
  logger?: Console;
}
