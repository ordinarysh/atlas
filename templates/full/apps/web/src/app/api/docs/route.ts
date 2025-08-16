import type { NextRequest, NextResponse } from 'next/server'
import { apiResponse, withErrorHandling } from '@/lib/api-utils'
import { features } from '@/lib/config'
import { generateOpenAPISpec } from '@/lib/openapi'

/**
 * GET /api/docs
 * Returns OpenAPI specification in JSON format
 */
export const GET = withErrorHandling(
  (request: NextRequest): Promise<NextResponse> => {
    // Only allow documentation access in development or if explicitly enabled
    if (!features.isDevelopment && !process.env.ENABLE_API_DOCS) {
      return Promise.resolve(apiResponse({ error: 'Not Found' }, 404))
    }

    try {
      // Get the base URL from the request
      const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`
      const openAPISpec = generateOpenAPISpec(baseUrl)

      return Promise.resolve(
        apiResponse(openAPISpec, 200, {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        })
      )
    } catch (error) {
      console.error('Failed to generate OpenAPI spec:', error)
      return Promise.resolve(
        apiResponse({ error: 'Internal Server Error' }, 500)
      )
    }
  }
)

/**
 * OPTIONS /api/docs
 * Handle preflight requests
 */
export function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}
