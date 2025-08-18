/**
 * CORS utilities for API routes
 * Provides simple CORS helpers for route-level control
 */

import { NextResponse, type NextRequest } from 'next/server'

/**
 * Default CORS configuration
 */
const DEFAULT_CORS_OPTIONS = {
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') ?? ['*'],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Requested-With',
  ],
  exposedHeaders: [
    'X-Request-Id',
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset',
  ],
  maxAge: 86400, // 24 hours
} as const

/**
 * CORS configuration interface
 */
export interface CorsOptions {
  allowedOrigins?: string[]
  allowedMethods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  maxAge?: number
  credentials?: boolean
}

/**
 * Generate CORS headers object
 */
export function generateCorsHeaders(
  origin?: string | null,
  options: CorsOptions = {}
): Record<string, string> {
  const config = { ...DEFAULT_CORS_OPTIONS, ...options }

  // Determine allowed origin
  let allowedOrigin = '*'
  if (origin && config.allowedOrigins) {
    if (config.allowedOrigins.includes('*')) {
      allowedOrigin = '*'
    } else if (config.allowedOrigins.includes(origin)) {
      allowedOrigin = origin
    } else {
      allowedOrigin = 'null' // Deny if not in whitelist
    }
  }

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': config.allowedMethods.join(', '),
    'Access-Control-Allow-Headers': config.allowedHeaders.join(', '),
    'Access-Control-Expose-Headers': config.exposedHeaders.join(', '),
    'Access-Control-Max-Age': config.maxAge.toString(),
  }

  if (config.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  return headers
}

/**
 * Add CORS headers to a NextResponse
 */
export function addCorsHeaders(
  response: NextResponse,
  origin?: string | null,
  options?: CorsOptions
): NextResponse {
  const headers = generateCorsHeaders(origin, options)

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

/**
 * Create a CORS preflight response
 */
export function createCorsPreflightResponse(
  origin?: string | null,
  options?: CorsOptions
): NextResponse {
  const headers = generateCorsHeaders(origin, options)

  return new NextResponse(null, {
    status: 200,
    headers: {
      ...headers,
      'Content-Length': '0',
    },
  })
}

/**
 * Type guard to check if an unknown value is a NextRequest
 */
function isNextRequest(value: unknown): value is NextRequest {
  return (
    typeof value === 'object' &&
    value !== null &&
    'method' in value &&
    'headers' in value &&
    typeof (value as { headers: unknown }).headers === 'object' &&
    (value as { headers: { get?: unknown } }).headers !== null &&
    'get' in (value as { headers: { get?: unknown } }).headers &&
    typeof (value as { headers: { get: unknown } }).headers.get === 'function'
  )
}

/**
 * Higher-order function to wrap API handlers with CORS
 */
export function withCors<T extends unknown[], R>(
  handler: (...args: T) => Promise<NextResponse<R>>,
  options?: CorsOptions
) {
  return async (...args: T): Promise<NextResponse<R>> => {
    // Extract request from args (assume first arg is NextRequest)
    const firstArg = args[0]
    const request = isNextRequest(firstArg) ? firstArg : null
    const origin: string | null = request?.headers?.get?.('origin') ?? null

    // Handle preflight requests
    if (request?.method === 'OPTIONS') {
      return createCorsPreflightResponse(origin, options) as NextResponse<R>
    }

    // Execute handler and add CORS headers to response
    const response = await handler(...args)
    return addCorsHeaders(response, origin, options) as NextResponse<R>
  }
}

/**
 * Predefined CORS configurations for common scenarios
 */
export const CORS_CONFIGS = {
  /**
   * Allow all origins (development mode)
   */
  permissive: {
    allowedOrigins: ['*'],
    credentials: false,
  },

  /**
   * Strict CORS for production APIs
   */
  restrictive: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
    credentials: true,
  },

  /**
   * Public API endpoints (read-only)
   */
  publicApi: {
    allowedOrigins: ['*'],
    allowedMethods: ['GET', 'OPTIONS'],
    credentials: false,
  },

  /**
   * Admin endpoints (very restrictive)
   */
  adminOnly: {
    allowedOrigins: process.env.ADMIN_ORIGINS?.split(',') ?? [],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
} as const

/**
 * Utility to check if an origin is allowed
 */
export function isOriginAllowed(
  origin: string | null,
  allowedOrigins: string[] = DEFAULT_CORS_OPTIONS.allowedOrigins
): boolean {
  if (!origin) return false
  if (allowedOrigins.includes('*')) return true
  return allowedOrigins.includes(origin)
}

/**
 * Simple CORS headers for quick route setup
 */
export const corsHeaders = generateCorsHeaders()
