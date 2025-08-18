/**
 * Default rate limiting values and constants
 */
export const RATE_LIMIT_DEFAULTS = {
  /** Default maximum requests per window */
  MAX_REQUESTS: 60,
  /** Default window size in milliseconds (1 minute) */
  WINDOW_MS: 60_000,
  /** Default key prefix */
  PREFIX: "api",
  /** Default cleanup interval for memory store (1 minute) */
  CLEANUP_INTERVAL_MS: 60_000,
} as const;

/**
 * Rate limiting window presets
 */
export const RATE_LIMIT_WINDOWS = {
  /** 1 minute */
  ONE_MINUTE: 60_000,
  /** 5 minutes */
  FIVE_MINUTES: 5 * 60_000,
  /** 15 minutes */
  FIFTEEN_MINUTES: 15 * 60_000,
  /** 1 hour */
  ONE_HOUR: 60 * 60_000,
  /** 1 day */
  ONE_DAY: 24 * 60 * 60_000,
} as const;

/**
 * Common rate limiting scenarios
 */
export const RATE_LIMIT_PRESETS = {
  /** Standard API operations */
  STANDARD: {
    max: 60,
    windowMs: RATE_LIMIT_WINDOWS.ONE_MINUTE,
  },
  /** Strict rate limiting for sensitive operations */
  STRICT: {
    max: 20,
    windowMs: RATE_LIMIT_WINDOWS.ONE_MINUTE,
  },
  /** Authentication operations */
  AUTH: {
    max: 5,
    windowMs: RATE_LIMIT_WINDOWS.FIFTEEN_MINUTES,
  },
  /** File upload operations */
  UPLOAD: {
    max: 10,
    windowMs: RATE_LIMIT_WINDOWS.ONE_MINUTE,
  },
  /** Admin operations */
  ADMIN: {
    max: 30,
    windowMs: RATE_LIMIT_WINDOWS.ONE_MINUTE,
  },
} as const;

/**
 * Environment variable names for rate limiting configuration
 */
export const RATE_LIMIT_ENV_VARS = {
  MAX: "RATE_LIMIT_MAX",
  WINDOW_MS: "RATE_LIMIT_WINDOW_MS",
  PREFIX: "RATE_LIMIT_PREFIX",
  STORE: "RATE_LIMIT_STORE",
  TRUST_PROXY: "TRUST_PROXY",
} as const;
