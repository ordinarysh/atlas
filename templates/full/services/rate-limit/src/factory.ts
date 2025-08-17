import type {
  RateLimitStore,
  RateLimiterOptions,
  RateLimiterConfig,
  RateLimiterAdapter,
} from "./types.js";
import { RateLimiter } from "./rate-limiter.js";
import { InMemoryStore } from "./in-memory.js";

/**
 * Registry of available rate limit store adapters
 */
const storeAdapters: Record<string, () => RateLimitStore> = {
  memory: () => new InMemoryStore(),
};

/**
 * Register a new rate limit store adapter
 *
 * @param name - Adapter name (e.g., 'redis')
 * @param factory - Factory function that creates store instances
 */
export function registerStoreAdapter(name: string, factory: () => RateLimitStore): void {
  storeAdapters[name] = factory;
}

/**
 * Create a rate limiter with the specified options
 *
 * @param options - Rate limiter configuration
 * @returns Configured rate limiter instance
 */
export function createRateLimiter(options: RateLimiterOptions): RateLimiterAdapter {
  return new RateLimiter(options);
}

/**
 * Create a rate limiter using factory configuration and adapter registry
 *
 * @param config - Factory configuration
 * @returns Configured rate limiter instance
 */
export function createRateLimiterFromConfig(
  options: RateLimiterOptions,
  config?: RateLimiterConfig,
): RateLimiterAdapter {
  // 1. Explicit DI injection takes precedence
  if (config?.adapter) {
    return new RateLimiter({
      ...options,
      store: config.adapter,
    });
  }

  // 2. Environment variable
  const envAdapter = process.env.RATE_LIMIT_STORE;
  if (envAdapter && storeAdapters[envAdapter]) {
    const store = storeAdapters[envAdapter]();
    return new RateLimiter({
      ...options,
      store,
    });
  }

  // 3. Default to in-memory
  return new RateLimiter({
    ...options,
    store: new InMemoryStore(),
  });
}

/**
 * Factory function to create a memory store
 *
 * @param options - Memory store options
 * @returns Memory store instance
 */
export function createMemoryStore(options?: { cleanupIntervalMs?: number }): InMemoryStore {
  return new InMemoryStore(options);
}

/**
 * Get available store adapter names
 *
 * @returns Array of registered adapter names
 */
export function getAvailableStoreAdapters(): string[] {
  return Object.keys(storeAdapters);
}
