import { z } from 'zod'

/**
 * Environment schema validation
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // Server configuration
  PORT: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535)),

  // API configuration
  API_URL: z.string().url().optional(),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Security configuration
  ENABLE_SECURITY_MIDDLEWARE: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  ALLOWED_ORIGINS: z.string().default('*'),
  TRUST_PROXY: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),

  // Security (optional - for when auth is added via add-ons)
  JWT_SECRET: z.string().min(32).optional(),
  ENCRYPTION_KEY: z.string().min(32).optional(),
  SESSION_SECRET: z.string().min(32).optional(),

  // Rate limiting configuration
  RATE_LIMIT_PROVIDER: z.enum(['memory', 'redis']).default('memory'),
  RATE_LIMIT_MAX: z
    .string()
    .default('60')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('60000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1000)),
  RATE_LIMIT_PREFIX: z.string().default('api'),

  // Database (optional - for database add-ons)
  DATABASE_URL: z.string().url().optional(),

  // External services (optional - for service add-ons)
  REDIS_URL: z.string().url().optional(),

  // Package version (automatically set by npm/pnpm)
  npm_package_version: z.string().default('0.1.0'),
})

/**
 * Validate and parse environment variables
 */
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ')

      throw new Error(`Environment validation failed: ${issues}`)
    }
    throw error
  }
}

/**
 * Validated environment configuration
 * Use this instead of process.env for type safety
 */
export const config = validateEnv()

/**
 * Typed environment variables
 */
export type Config = typeof config

/**
 * Feature flags based on environment
 */
export const features = {
  isDevelopment: config.NODE_ENV === 'development',
  isProduction: config.NODE_ENV === 'production',
  isTest: config.NODE_ENV === 'test',

  // Security features
  enableSecurityMiddleware: config.ENABLE_SECURITY_MIDDLEWARE,
  trustProxy: config.TRUST_PROXY,

  // Enable detailed error responses in development
  showErrorDetails: config.NODE_ENV === 'development',

  // Enable request logging in development and production
  enableRequestLogging: config.NODE_ENV !== 'test',

  // Enable performance logging in development
  enablePerformanceLogging: config.NODE_ENV === 'development',

  // Security logging in production and development
  enableSecurityLogging: config.NODE_ENV !== 'test',
} as const

/**
 * Runtime environment information
 * Safe for Edge runtime - no process API usage
 */
export const runtime = {
  version: config.npm_package_version,
  nodeVersion: 'unknown',
  platform: 'unknown',
  arch: 'unknown',
  uptime: () => 0,
  memoryUsage: () => ({
    rss: 0,
    heapTotal: 0,
    heapUsed: 0,
    external: 0,
    arrayBuffers: 0,
  }),
} as const

/**
 * Configuration for different environments
 */
export const environments = {
  development: {
    cors: {
      origin: config.ALLOWED_ORIGINS,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-API-Key',
      ],
      credentials: false,
    },
    security: {
      enableHSTS: false,
      enableSecurityMiddleware: false, // Usually disabled in development
      trustProxy: config.TRUST_PROXY,
      strictCSP: false,
    },
    rateLimit: {
      provider: config.RATE_LIMIT_PROVIDER,
      max: config.RATE_LIMIT_MAX * 2, // More lenient in development
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      prefix: `${config.RATE_LIMIT_PREFIX}-dev`,
    },
  },

  production: {
    cors: {
      origin:
        config.ALLOWED_ORIGINS === '*'
          ? false
          : config.ALLOWED_ORIGINS.split(','),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      credentials: true,
    },
    security: {
      enableHSTS: true,
      enableSecurityMiddleware: config.ENABLE_SECURITY_MIDDLEWARE,
      trustProxy: config.TRUST_PROXY,
      strictCSP: true,
    },
    rateLimit: {
      provider: config.RATE_LIMIT_PROVIDER,
      max: config.RATE_LIMIT_MAX,
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      prefix: config.RATE_LIMIT_PREFIX,
    },
  },

  test: {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-API-Key',
      ],
      credentials: false,
    },
    security: {
      enableHSTS: false,
      enableSecurityMiddleware: false, // Disabled in tests
      trustProxy: false,
      strictCSP: false,
    },
    rateLimit: {
      provider: 'memory',
      max: 1000, // Very high limit for tests
      windowMs: 1000,
      prefix: `${config.RATE_LIMIT_PREFIX}-test`,
    },
  },
} as const

/**
 * Current environment configuration
 */
export const env = environments[config.NODE_ENV]
