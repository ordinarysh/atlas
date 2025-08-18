import { RATE_LIMIT_DEFAULTS, RATE_LIMIT_WINDOWS, RATE_LIMIT_ENV_VARS } from "./constants.js";

// Re-export constants
export {
  RATE_LIMIT_DEFAULTS,
  RATE_LIMIT_PRESETS,
  RATE_LIMIT_WINDOWS,
  RATE_LIMIT_ENV_VARS,
} from "./constants.js";

/**
 * Rate limiting configuration
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
 * Parse environment variable as integer with fallback and validation
 */
function parseIntEnv(value: string | undefined, fallback: number, envVarName: string): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    console.warn(`Invalid ${envVarName}: "${value}". Using default: ${String(fallback)}`);
    return fallback;
  }
  return parsed;
}

/**
 * Get rate limiting configuration from environment variables
 *
 * Environment Variables:
 * - RATE_LIMIT_MAX: number (default: 60)
 * - RATE_LIMIT_WINDOW_MS: number (default: 60000)
 * - RATE_LIMIT_PREFIX: string (default: "api")
 * - RATE_LIMIT_STORE: "memory" | "redis" (default: "memory")
 * - TRUST_PROXY: boolean (default: false)
 *
 * @returns Rate limit configuration object
 */
export function getRateLimitConfig(): RateLimitConfig {
  const provider = process.env[RATE_LIMIT_ENV_VARS.STORE] === "redis" ? "redis" : "memory";
  const trustProxy = process.env[RATE_LIMIT_ENV_VARS.TRUST_PROXY] === "true";

  return {
    max: parseIntEnv(
      process.env[RATE_LIMIT_ENV_VARS.MAX],
      RATE_LIMIT_DEFAULTS.MAX_REQUESTS,
      RATE_LIMIT_ENV_VARS.MAX,
    ),
    windowMs: parseIntEnv(
      process.env[RATE_LIMIT_ENV_VARS.WINDOW_MS],
      RATE_LIMIT_DEFAULTS.WINDOW_MS,
      RATE_LIMIT_ENV_VARS.WINDOW_MS,
    ),
    prefix: process.env[RATE_LIMIT_ENV_VARS.PREFIX] ?? RATE_LIMIT_DEFAULTS.PREFIX,
    provider,
    trustProxy,
  };
}

/**
 * Create environment-specific rate limit configurations
 */
export function createRateLimitPresets(): {
  standard: RateLimitConfig;
  strict: RateLimitConfig;
  auth: RateLimitConfig;
  upload: RateLimitConfig;
  admin: RateLimitConfig;
} {
  const baseConfig = getRateLimitConfig();

  return {
    /** Standard API rate limiting */
    standard: {
      ...baseConfig,
      prefix: `${baseConfig.prefix}-std`,
    },

    /** Strict rate limiting for sensitive operations */
    strict: {
      ...baseConfig,
      max: Math.floor(baseConfig.max / 3),
      prefix: `${baseConfig.prefix}-strict`,
    },

    /** Authentication rate limiting */
    auth: {
      ...baseConfig,
      max: 5,
      windowMs: RATE_LIMIT_WINDOWS.FIFTEEN_MINUTES,
      prefix: `${baseConfig.prefix}-auth`,
    },

    /** File upload rate limiting */
    upload: {
      ...baseConfig,
      max: 10,
      windowMs: RATE_LIMIT_WINDOWS.ONE_MINUTE,
      prefix: `${baseConfig.prefix}-upload`,
    },

    /** Admin operations */
    admin: {
      ...baseConfig,
      max: Math.floor(baseConfig.max / 2),
      prefix: `${baseConfig.prefix}-admin`,
    },
  };
}
