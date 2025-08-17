import type { NextRequest } from 'next/server'
import { z, type ZodTypeAny } from 'zod'
import { apiResponse, withErrorHandling } from '@/lib/api-utils'
import { createCorsPreflightResponse } from '@/lib/cors'
import { registerRouteDoc } from '@/lib/openapi'
import { requireApiKey } from '@/server/auth'
import { requireRateLimit } from '@/server/rate-limit'

/**
 * Whoami response interface
 */
interface WhoamiResponse {
  apiKeyId: string
  scopes: string[]
  isActive: boolean
  metadata?: Record<string, unknown>
}

// Whoami response schema for OpenAPI documentation
const WhoamiResponseSchema = z.object({
  apiKeyId: z.string(),
  scopes: z.array(z.string()),
  isActive: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// Register route documentation
registerRouteDoc('/api/auth/me', 'GET', {
  summary: 'Get authenticated API key information',
  description: 'Returns information about the currently authenticated API key',
  tags: ['Authentication'],
  security: true,
  responseSchema: WhoamiResponseSchema as unknown as ZodTypeAny,
  examples: {
    response: {
      apiKeyId: 'dev-001',
      scopes: ['read:projects', 'write:projects'],
      isActive: true,
      metadata: {
        name: 'Development Key',
        description: 'Key for local development',
      },
    },
  },
})

/**
 * GET /api/auth/me
 * Returns information about the authenticated API key
 * Requires authentication with any valid API key
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Apply rate limiting
  const rateLimitResult = await requireRateLimit(request, {
    limiter: 'standard',
  })
  if (rateLimitResult.type === 'blocked') return rateLimitResult.response

  // Require authentication (no specific scope needed)
  const auth = await requireApiKey()
  if (auth instanceof Response) return auth

  const whoamiData: WhoamiResponse = {
    apiKeyId: auth.id,
    scopes: auth.scopes,
    isActive: true, // If we reach here, the key is active (verified during auth)
    metadata: auth.metadata,
  }

  const response = apiResponse(whoamiData, 200, {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  })

  // Apply rate limit headers to response
  rateLimitResult.setHeaders(response)
  return response
})

/**
 * OPTIONS /api/auth/me
 * Handle preflight requests
 */
export function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  return createCorsPreflightResponse(origin, {
    allowedMethods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
}
