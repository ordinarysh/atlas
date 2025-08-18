/**
 * Base rate limiting error
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Store operation error (Redis connection failure, etc.)
 */
export class StoreError extends RateLimitError {
  constructor(
    message: string,
    public readonly originalError?: Error,
  ) {
    super(message, "STORE_ERROR");
    this.name = "StoreError";
  }
}

/**
 * Rate limit exceeded error
 */
export class RateLimitExceededError extends RateLimitError {
  constructor(
    message: string,
    public readonly limit: number,
    public readonly resetAt: number,
    public readonly retryAfter: number,
  ) {
    super(message, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitExceededError";
  }
}

/**
 * Invalid configuration error
 */
export class ConfigurationError extends RateLimitError {
  constructor(message: string) {
    super(message, "CONFIGURATION_ERROR");
    this.name = "ConfigurationError";
  }
}
