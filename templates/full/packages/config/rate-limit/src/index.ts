/**
 * Rate limiting configuration with environment variable support
 */
export interface RateLimitConfig {
  /** Maximum requests allowed per window */
  max: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Key prefix for namespacing different environments/endpoints */
  prefix: string;
  /** Rate limit store provider */
  provider: "memory" | "redis";
  /** Trust proxy headers for IP extraction */
  trustProxy: boolean;
}

/**
 * Default rate limiting configuration
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  max: 60,
  windowMs: 60_000, // 1 minute
  prefix: "api",
  provider: "memory",
  trustProxy: false,
};

// Module-scoped flag for one-time Redis warning
let redisWarningShown = false;

/**
 * Reset the Redis warning flag (for testing only)
 * @internal
 */
export function __resetRedisWarningForTesting(): void {
  if (process.env.NODE_ENV === "test") {
    redisWarningShown = false;
  }
}

/**
 * Parse and validate environment variable as integer
 */
function parseIntEnv(
  value: string | undefined,
  fallback: number,
): { value: number; isValid: boolean } {
  if (!value) return { value: fallback, isValid: true };
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return { value: fallback, isValid: false };
  }
  return { value: parsed, isValid: true };
}

/**
 * Get rate limiting configuration from environment variables
 *
 * Environment Variables:
 * - RATE_LIMIT_MAX: number (default: 60)
 * - RATE_LIMIT_WINDOW_MS: number (default: 60000)
 * - RATE_LIMIT_PREFIX: string (default: "api")
 * - RATE_LIMIT_PROVIDER: "memory" | "redis" (default: "memory")
 * - TRUST_PROXY: boolean (default: false)
 *
 * @returns Rate limit configuration object
 */
export function getRateLimitConfig(): RateLimitConfig {
  const providerEnv = process.env.RATE_LIMIT_PROVIDER as "memory" | "redis" | undefined;
  const trustProxy = process.env.TRUST_PROXY === "true";

  // Parse and validate numeric values
  const maxResult = parseIntEnv(process.env.RATE_LIMIT_MAX, DEFAULT_CONFIG.max);
  const windowMsResult = parseIntEnv(process.env.RATE_LIMIT_WINDOW_MS, DEFAULT_CONFIG.windowMs);

  let max = maxResult.value;
  let windowMs = windowMsResult.value;

  // Validation warnings
  if (!maxResult.isValid || max <= 0) {
    console.warn(
      `Invalid RATE_LIMIT_MAX: ${process.env.RATE_LIMIT_MAX ?? "undefined"}. Using default: ${DEFAULT_CONFIG.max.toString()}`,
    );
    max = DEFAULT_CONFIG.max;
  }

  if (!windowMsResult.isValid || windowMs <= 0) {
    console.warn(
      `Invalid RATE_LIMIT_WINDOW_MS: ${process.env.RATE_LIMIT_WINDOW_MS ?? "undefined"}. Using default: ${DEFAULT_CONFIG.windowMs.toString()}`,
    );
    windowMs = DEFAULT_CONFIG.windowMs;
  }

  const config: RateLimitConfig = {
    max,
    windowMs,
    prefix: process.env.RATE_LIMIT_PREFIX ?? DEFAULT_CONFIG.prefix,
    provider: providerEnv === "redis" ? "redis" : DEFAULT_CONFIG.provider,
    trustProxy,
  };

  // One-time Redis warning
  if (config.provider === "redis" && !redisWarningShown) {
    redisWarningShown = true;
    console.warn(
      "Redis rate limiting provider is an opt-in add-on not included in this template. " +
        "Falling back to memory provider. To use Redis, install the add-on package.",
    );
    config.provider = "memory";
  }

  return config;
}

/**
 * Create environment-specific rate limit configurations
 */
export const createRateLimitPresets = (): {
  standard: RateLimitConfig;
  strict: RateLimitConfig;
  auth: RateLimitConfig;
  upload: RateLimitConfig;
  admin: RateLimitConfig;
} => {
  const baseConfig = getRateLimitConfig();

  return {
    /** Standard API rate limiting */
    standard: {
      ...baseConfig,
      max: baseConfig.max,
      prefix: `${baseConfig.prefix}-std`,
    },

    /** Strict rate limiting for sensitive operations */
    strict: {
      ...baseConfig,
      max: Math.floor(baseConfig.max / 3), // 1/3 of standard limit
      prefix: `${baseConfig.prefix}-strict`,
    },

    /** Authentication rate limiting */
    auth: {
      ...baseConfig,
      max: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      prefix: `${baseConfig.prefix}-auth`,
    },

    /** File upload rate limiting */
    upload: {
      ...baseConfig,
      max: 10,
      windowMs: 60 * 1000, // 1 minute
      prefix: `${baseConfig.prefix}-upload`,
    },

    /** Admin operations */
    admin: {
      ...baseConfig,
      max: Math.floor(baseConfig.max / 2), // Half of standard limit
      prefix: `${baseConfig.prefix}-admin`,
    },
  };
};
