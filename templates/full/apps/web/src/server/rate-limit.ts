import { NextResponse, type NextRequest } from 'next/server'
import {
  createRateLimitPresets,
  getRateLimitConfig,
} from '@atlas/config-rate-limit'
import {
  createMemoryStore,
  createRateLimiter,
  type RateLimiter,
} from '@atlas/rate-limit'
import { API_ERROR_CODES } from '@/lib/api-utils'
import { logger } from '@/lib/logger'

// Initialize rate limit configuration
const presets = createRateLimitPresets()

// Create memory store for rate limiting
// Note: For distributed production deployments, Redis can be added as an add-on
const store = createMemoryStore()
const limiters = {
  standard: createRateLimiter({
    limit: presets.standard.max,
    windowMs: presets.standard.windowMs,
    prefix: presets.standard.prefix,
    store,
  }),
  strict: createRateLimiter({
    limit: presets.strict.max,
    windowMs: presets.strict.windowMs,
    prefix: presets.strict.prefix,
    store,
  }),
  auth: createRateLimiter({
    limit: presets.auth.max,
    windowMs: presets.auth.windowMs,
    prefix: presets.auth.prefix,
    store,
  }),
  upload: createRateLimiter({
    limit: presets.upload.max,
    windowMs: presets.upload.windowMs,
    prefix: presets.upload.prefix,
    store,
  }),
  admin: createRateLimiter({
    limit: presets.admin.max,
    windowMs: presets.admin.windowMs,
    prefix: presets.admin.prefix,
    store,
  }),
}

// Error handler for rate limiter failures
const onRateLimitError = (error: Error) => {
  logger.warn('Rate limiter store error - failing open', {
    error: {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
    errorName: error.name,
  })
}

// Apply error handler to all limiters
Object.values(limiters).forEach((limiter) => {
  limiter.setErrorHandler(onRateLimitError)
})

/**
 * Extract client key from request headers and authentication context
 *
 * Priority:
 * 1. API key ID if authenticated
 * 2. IP address based on trustProxy setting:
 *    - If trustProxy=true: prefer x-real-ip, cf-connecting-ip, then x-forwarded-for
 *    - If trustProxy=false: use first x-forwarded-for, then fallback headers
 * 3. "anonymous" fallback
 */
export function getClientKey(
  headers: Headers,
  auth?: { apiKeyId?: string },
  trustProxy = false
): string {
  // If authenticated via API key, use the API key ID
  if (auth?.apiKeyId) {
    return `key:${auth.apiKeyId}`
  }

  // IP extraction with trustProxy awareness
  const forwardedFor = headers.get('x-forwarded-for')
  const realIp = headers.get('x-real-ip')
  const cfConnectingIp = headers.get('cf-connecting-ip')
  const trueClientIp = headers.get('true-client-ip')

  let clientIp: string | null = null

  if (trustProxy) {
    // Trust proxy headers - prefer real IP headers over forwarded-for
    clientIp =
      realIp ??
      cfConnectingIp ??
      forwardedFor?.split(',')[0]?.trim() ??
      trueClientIp ??
      null
  } else {
    // Don't trust proxy - use first forwarded-for as priority
    clientIp =
      forwardedFor?.split(',')[0]?.trim() ??
      realIp ??
      cfConnectingIp ??
      trueClientIp ??
      null
  }

  return `ip:${clientIp ?? 'anonymous'}`
}

/**
 * Rate limit configuration for route handlers
 */
export interface RequireRateLimitOptions {
  /** Override the default limit */
  limit?: number
  /** Override the default window in milliseconds */
  window?: number
  /** Override the client key */
  keyOverride?: string
  /** Rate limiter to use (default: 'standard') */
  limiter?: keyof typeof limiters
}

/**
 * Apply rate limiting to a route handler
 *
 * @param request - Next.js request object
 * @param options - Rate limiting options
 * @returns Either a 429 response or headers to apply
 */
export async function requireRateLimit(
  request: NextRequest,
  options: RequireRateLimitOptions = {}
): Promise<
  | { type: 'blocked'; response: NextResponse }
  | { type: 'allowed'; setHeaders: (response: NextResponse) => void }
> {
  try {
    // Check for bypass via auth scopes
    const authHeader = request.headers.get('x-auth-context')
    if (authHeader) {
      try {
        const authContext = JSON.parse(authHeader)
        // TODO: Check if scopes include "no-limit" when scope system is implemented
        // For now, we'll use a simple bypass for admin API keys
        if (authContext.apiKey?.permissions?.includes('admin')) {
          // Bypass rate limiting for admin permissions
          return {
            type: 'allowed',
            setHeaders: (response: NextResponse) => {
              response.headers.set('X-RateLimit-Bypass', 'admin')
            },
          }
        }
      } catch {
        // Invalid auth context, continue with rate limiting
      }
    }

    // Select rate limiter
    const limiterKey = options.limiter ?? 'standard'
    const limiter = limiters[limiterKey]

    if (!limiter) {
      throw new Error(`Unknown rate limiter: ${limiterKey}`)
    }

    // Get configuration for trustProxy setting
    const config = getRateLimitConfig()

    // Generate client key
    let authContext
    try {
      authContext = authHeader ? JSON.parse(authHeader) : undefined
    } catch {
      // Invalid auth context, continue with no auth
      authContext = undefined
    }
    const clientKey =
      options.keyOverride ??
      getClientKey(
        request.headers,
        authContext ? { apiKeyId: authContext.apiKey?.id } : undefined,
        config.trustProxy
      )

    // Check rate limit
    const result = await limiter.check(clientKey)

    if (!result.allowed) {
      // Calculate retry-after in seconds
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000)

      const response = NextResponse.json(
        {
          error: {
            code: API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
            message: 'Too Many Requests - rate limit exceeded',
          },
        },
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
            'Retry-After': String(retryAfter),
            'Cache-Control': 'no-store',
          },
        }
      )

      return { type: 'blocked', response }
    }

    // Request allowed - return headers to apply
    return {
      type: 'allowed',
      setHeaders: (response: NextResponse) => {
        response.headers.set('X-RateLimit-Limit', String(result.limit))
        response.headers.set('X-RateLimit-Remaining', String(result.remaining))
        response.headers.set(
          'X-RateLimit-Reset',
          String(Math.ceil(result.resetAt / 1000))
        )
      },
    }
  } catch (error) {
    // On error, allow the request but log the issue (fail-open behavior)
    logger.error('Rate limiting check failed - allowing request', {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack:
          error instanceof Error && process.env.NODE_ENV === 'development'
            ? error.stack
            : undefined,
      },
      errorName: error instanceof Error ? error.name : 'UnknownError',
      clientKey: options.keyOverride ?? 'unknown',
      limiter: options.limiter ?? 'standard',
    })

    return {
      type: 'allowed',
      setHeaders: (response: NextResponse) => {
        response.headers.set('X-RateLimit-Error', 'true')
      },
    }
  }
}

/**
 * Get rate limiter for specific use case
 */
export function getRateLimiter(type: keyof typeof limiters): RateLimiter {
  return limiters[type]
}

/**
 * Reset rate limit for a client key
 */
export async function resetRateLimit(
  headers: Headers,
  auth?: { apiKeyId?: string },
  limiterType: keyof typeof limiters = 'standard'
): Promise<void> {
  const config = getRateLimitConfig()
  const clientKey = getClientKey(headers, auth, config.trustProxy)
  const limiter = limiters[limiterType]
  await limiter.reset(clientKey)
}
