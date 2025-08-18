// Re-export factory functions
export {
  createRateLimiter,
  createRateLimiterFromConfig,
  createMemoryStore,
  registerStoreAdapter,
  getAvailableStoreAdapters,
} from "./factory.js";

// Re-export types
export type {
  RateLimitStore,
  RateLimitResult,
  RateLimiterOptions,
  RateLimiterResult,
  RateLimiterAdapter,
  RateLimiterConfig,
} from "./types.js";

// Re-export errors
export {
  RateLimitError,
  StoreError,
  RateLimitExceededError,
  ConfigurationError,
} from "./errors.js";

// Re-export adapters for direct use if needed
export { RateLimiter } from "./rate-limiter.js";
export { InMemoryStore } from "./in-memory.js";
