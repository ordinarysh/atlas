/**
 * Next.js API authentication glue layer
 *
 * This module provides Next.js-specific authentication guards using the
 * provider-agnostic @atlas/api-auth package. It handles header parsing,
 * returns proper NextResponse objects, and integrates with rate limiting.
 */

import { headers } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import {
  createApiKeyStore,
  headerToKey,
  verifyApiKey,
  type AuthContext,
} from '@atlas/api-auth'
import { logger } from '@/lib/logger'

/**
 * Global API key store instance
 * TODO: In production, this should connect to your database
 */
const apiKeyStore = createApiKeyStore()

/**
 * Authentication result types
 */
type AuthResult =
  | { success: true; auth: AuthContext }
  | { success: false; response: NextResponse }

/**
 * Require API key authentication with optional scope verification
 *
 * Returns either an AuthContext (on success) or a NextResponse (on failure).
 * Use this pattern in your route handlers:
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const auth = await requireApiKey('read:projects')
 *   if (auth instanceof NextResponse) return auth
 *
 *   // auth is AuthContext, proceed with authenticated request
 *   console.log(`Authenticated as ${auth.id}`)
 * }
 * ```
 *
 * @param scope - Optional scope that must be present in the API key
 * @returns AuthContext on success, NextResponse on failure
 */
export async function requireApiKey(
  scope?: string
): Promise<AuthContext | NextResponse> {
  const result = await authenticateRequest(scope)

  if (result.success) {
    return result.auth
  }

  return result.response
}

/**
 * Get authentication context without throwing errors
 *
 * Use this when you want to check authentication status but continue
 * processing regardless (e.g., for rate limiting by API key ID).
 *
 * @example
 * ```typescript
 * const auth = await getAuthContext()
 * const rateLimitKey = auth ? `api_key:${auth.id}` : `ip:${getClientIP()}`
 * ```
 *
 * @returns AuthContext if authenticated, null otherwise
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const result = await authenticateRequest()
  return result.success ? result.auth : null
}

/**
 * Internal authentication logic
 */
async function authenticateRequest(
  requiredScope?: string
): Promise<AuthResult> {
  try {
    // Get headers (works in both middleware and route handlers)
    const headersList = await headers()
    const authHeader = headersList.get('authorization')
    const apiKeyHeader = headersList.get('x-api-key')

    // Extract API key from headers
    const apiKey = headerToKey(authHeader)

    if (!apiKey) {
      logger.warn('API authentication failed: No API key provided', {
        hasAuthHeader: !!authHeader,
        hasApiKeyHeader: !!apiKeyHeader,
      })

      return {
        success: false,
        response: createUnauthorizedResponse('Valid API key required'),
      }
    }

    // Verify the API key
    const auth = await verifyApiKey(apiKey, requiredScope)

    if (!auth) {
      logger.warn(
        'API authentication failed: Invalid API key or insufficient scope',
        {
          requiredScope,
          hasValidFormat: apiKey.includes('_') && apiKey.length > 20,
        }
      )

      const message = requiredScope
        ? `Invalid API key or missing required scope: ${requiredScope}`
        : 'Invalid API key'

      return {
        success: false,
        response: createUnauthorizedResponse(message),
      }
    }

    // Log successful authentication
    logger.info('API authentication successful', {
      apiKeyId: auth.id,
      scopes: auth.scopes,
      requestedScope: requiredScope,
    })

    return { success: true, auth }
  } catch (error) {
    logger.error('API authentication error', {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : { message: 'Unknown error' },
      requiredScope,
    })

    return {
      success: false,
      response: createInternalErrorResponse(
        'Authentication service unavailable'
      ),
    }
  }
}

/**
 * Create standardized 401 Unauthorized response
 * Follows the contract specification for error format
 */
function createUnauthorizedResponse(_message: string): NextResponse {
  return NextResponse.json(
    {
      error: 'Unauthorized',
    },
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'WWW-Authenticate': 'Bearer realm="api", error="invalid_token"',
        'Cache-Control': 'no-store',
      },
    }
  )
}

/**
 * Create standardized 500 Internal Server Error response
 */
function createInternalErrorResponse(message: string): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message,
      },
    },
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      },
    }
  )
}

/**
 * Extract API key from NextRequest (for middleware)
 *
 * This version works in middleware context where headers() is not available.
 *
 * @param request - The Next.js request object
 * @returns Extracted API key or null
 */
export function extractApiKeyFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')

  return headerToKey(authHeader)
}

/**
 * Verify API key from NextRequest (for middleware)
 *
 * This version is optimized for middleware use and doesn't use the headers() function.
 *
 * @param request - The Next.js request object
 * @param requiredScope - Optional required scope
 * @returns AuthContext if valid, null otherwise
 */
export async function verifyRequestApiKey(
  request: NextRequest,
  requiredScope?: string
): Promise<AuthContext | null> {
  const apiKey = extractApiKeyFromRequest(request)

  if (!apiKey) {
    return null
  }

  return await verifyApiKey(apiKey, requiredScope)
}

/**
 * Get the API key store instance
 *
 * Use this if you need direct access to the store for administrative operations.
 *
 * @returns The global API key store instance
 */
export function getApiKeyStore() {
  return apiKeyStore
}

/**
 * Check if a request is authenticated (for middleware)
 *
 * @param request - The Next.js request object
 * @returns True if request has valid API key
 */
export async function isRequestAuthenticated(
  request: NextRequest
): Promise<boolean> {
  const auth = await verifyRequestApiKey(request)
  return auth !== null
}

/**
 * Create authentication context for rate limiting
 *
 * This creates a consistent key for rate limiting that works with both
 * authenticated and anonymous requests.
 *
 * @param request - The Next.js request object
 * @returns Object with authentication details for rate limiting
 */
export async function createRateLimitContext(request: NextRequest): Promise<{
  apiKeyId?: string
  scopes?: string[]
  isAuthenticated: boolean
}> {
  const auth = await verifyRequestApiKey(request)

  return {
    apiKeyId: auth?.id,
    scopes: auth?.scopes,
    isAuthenticated: !!auth,
  }
}
