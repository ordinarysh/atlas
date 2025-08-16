/**
 * Optional global middleware - off by default
 *
 * This middleware is disabled by default and provides only coarse global protection.
 * Use it as a first line of defense, but rely on route-level guards for real enforcement.
 *
 * To enable: Set GLOBAL_SHIELD=1 in your environment variables
 *
 * Note: All authentication and rate limiting is handled at the route level
 * for fine-grained control and better performance.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createRequestLogger } from '@/lib/logger'

/**
 * Production security headers configuration
 * Includes CSP, HSTS, and other modern security headers
 */
const SECURITY_HEADERS = {
  // Content Security
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ].join('; '),

  // Transport Security (HTTPS)
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',

  // Content Type
  'X-Content-Type-Options': 'nosniff',

  // Frame Options
  'X-Frame-Options': 'DENY',

  // XSS Protection
  'X-XSS-Protection': '1; mode=block',

  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()',
  ].join(', '),

  // Cache Control for API responses
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',

  // Additional Security
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
} as const

/**
 * Next.js Middleware for API routes (OPTIONAL)
 * Handles: Request ID, Security Headers, CORS, Logging
 *
 * Authentication and rate limiting are handled at the route level for fine-grained control.
 */
export function middleware(request: NextRequest) {
  // Feature flag guard - disabled by default
  if (process.env.GLOBAL_SHIELD !== '1') {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // Only process API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Generate unique request ID for request correlation
  const requestId = crypto.randomUUID()

  // Get client identifier (IP or fallback)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  const identifier =
    forwardedFor?.split(',')[0]?.trim() ??
    realIp ??
    cfConnectingIp ??
    'anonymous'

  // Initialize request logger
  const requestLogger = createRequestLogger(requestId, {
    method: request.method,
    path: pathname,
    ip: identifier,
    userAgent: request.headers.get('user-agent') ?? undefined,
  })

  // Handle preflight requests early
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Request-Id': requestId,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods':
          'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, X-API-Key, X-Requested-With',
        'Access-Control-Max-Age': '86400',
        'Content-Length': '0',
        ...SECURITY_HEADERS,
      },
    })
  }

  // NOTE: This middleware provides only basic security headers and logging.
  // All authentication and rate limiting is handled at the route level
  // for fine-grained control and better performance.

  // Log API request
  requestLogger.request(`${request.method} ${pathname}`, {
    contentLength: request.headers.get('content-length'),
  })

  // Create response with enhanced headers
  const response = NextResponse.next()

  // Add request correlation ID
  response.headers.set('X-Request-Id', requestId)

  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Add CORS headers for API routes
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  )
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-API-Key, X-Requested-With'
  )
  response.headers.set('Access-Control-Max-Age', '86400') // 24 hours
  response.headers.set(
    'Access-Control-Expose-Headers',
    'X-Request-Id, RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset'
  )

  return response
}

/**
 * Configure which paths the middleware should run on
 */
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Exclude static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
