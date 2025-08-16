/**
 * Production-ready structured logger
 * Provides consistent logging across the API with correlation IDs
 */

interface LogContext {
  requestId?: string
  method?: string
  path?: string
  userId?: string
  ip?: string
  userAgent?: string
  duration?: number
  statusCode?: number
  error?: {
    message: string
    stack?: string
    code?: string
  }
  [key: string]: unknown
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Logger configuration
 */
const LOGGER_CONFIG = {
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  enableConsole: process.env.NODE_ENV !== 'test',
  includeTimestamp: true,
} as const

/**
 * Log levels with numeric values for filtering
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOGGER_CONFIG.level]
}

/**
 * Format log entry for structured output
 */
function formatLogEntry(
  level: LogLevel,
  message: string,
  context: LogContext = {}
): string {
  const entry = {
    level,
    message,
    ...context,
    ...(LOGGER_CONFIG.includeTimestamp && {
      timestamp: new Date().toISOString(),
    }),
  }

  return JSON.stringify(entry)
}

/**
 * List of sensitive keys that should be sanitized from logs
 */
const SENSITIVE_KEYS = [
  'password',
  'secret',
  'token',
  'key',
  'authorization',
  'cookie',
  'session',
  'auth',
  'credential',
  'private',
  'apikey',
  'jwt',
  'bearer',
] as const

/**
 * Sanitize log context to remove sensitive information
 */
function sanitizeContext(context: LogContext): LogContext {
  if (!context || typeof context !== 'object') {
    return context
  }

  const sanitized: LogContext = {}

  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase()

    // Check if key contains sensitive information
    const isSensitive = SENSITIVE_KEYS.some((sensitiveKey) =>
      lowerKey.includes(sensitiveKey)
    )

    if (isSensitive) {
      // Mask sensitive values
      if (typeof value === 'string') {
        sanitized[key] = value.length > 0 ? '[REDACTED]' : ''
      } else {
        sanitized[key] = '[REDACTED]'
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeContext(value as LogContext)
    } else {
      // Keep non-sensitive values as-is
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, context: LogContext = {}): void {
  if (!shouldLog(level) || !LOGGER_CONFIG.enableConsole) {
    return
  }

  const formattedMessage = formatLogEntry(level, message, context)

  switch (level) {
    case 'debug':
    case 'info':
      console.log(formattedMessage)
      break
    case 'warn':
      console.warn(formattedMessage)
      break
    case 'error':
      console.error(formattedMessage)
      break
  }
}

/**
 * Structured logger interface
 */
export const logger = {
  debug: (message: string, context?: LogContext) =>
    log('debug', message, context),
  info: (message: string, context?: LogContext) =>
    log('info', message, context),
  warn: (message: string, context?: LogContext) =>
    log('warn', message, context),
  error: (message: string, context?: LogContext) =>
    log('error', message, context),

  // Convenience methods for common patterns
  request: (message: string, context: LogContext) =>
    log('info', `[REQUEST] ${message}`, sanitizeContext(context)),

  response: (message: string, context: LogContext) =>
    log('info', `[RESPONSE] ${message}`, sanitizeContext(context)),

  security: (message: string, context: LogContext) =>
    log('warn', `[SECURITY] ${message}`, sanitizeContext(context)),

  performance: (message: string, context: LogContext) =>
    log('info', `[PERFORMANCE] ${message}`, sanitizeContext(context)),

  // Security-specific logging methods
  authFailure: (message: string, context: LogContext) =>
    log('warn', `[AUTH_FAILURE] ${message}`, sanitizeContext(context)),

  rateLimitExceeded: (message: string, context: LogContext) =>
    log('warn', `[RATE_LIMIT] ${message}`, sanitizeContext(context)),

  suspiciousActivity: (message: string, context: LogContext) =>
    log('error', `[SUSPICIOUS] ${message}`, sanitizeContext(context)),

  accessDenied: (message: string, context: LogContext) =>
    log('warn', `[ACCESS_DENIED] ${message}`, sanitizeContext(context)),
}

/**
 * Create a logger with bound request context
 */
export function createRequestLogger(
  requestId: string,
  baseContext: LogContext = {}
) {
  const boundContext = { requestId, ...baseContext }

  return {
    debug: (message: string, context?: LogContext) =>
      logger.debug(message, { ...boundContext, ...context }),
    info: (message: string, context?: LogContext) =>
      logger.info(message, { ...boundContext, ...context }),
    warn: (message: string, context?: LogContext) =>
      logger.warn(message, { ...boundContext, ...context }),
    error: (message: string, context?: LogContext) =>
      logger.error(message, { ...boundContext, ...context }),

    // Bound convenience methods
    request: (message: string, context?: LogContext) =>
      logger.request(message, { ...boundContext, ...context }),
    response: (message: string, context?: LogContext) =>
      logger.response(message, { ...boundContext, ...context }),
    security: (message: string, context?: LogContext) =>
      logger.security(message, { ...boundContext, ...context }),
    performance: (message: string, context?: LogContext) =>
      logger.performance(message, { ...boundContext, ...context }),
  }
}

export type { LogContext, LogLevel }
