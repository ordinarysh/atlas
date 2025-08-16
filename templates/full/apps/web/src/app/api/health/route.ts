import type { NextRequest } from 'next/server'
import { z, type ZodTypeAny } from 'zod'
import { apiResponse, withErrorHandling } from '@/lib/api-utils'
import { config } from '@/lib/config'
import { createCorsPreflightResponse } from '@/lib/cors'
import { checkMemoryHealth, nodeRuntime } from '@/lib/node-runtime'
import { registerRouteDoc } from '@/lib/openapi'
import { requireRateLimit } from '@/server/rate-limit'

/**
 * Health check response interface
 */
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  environment: string
  checks: {
    memory: {
      status: 'healthy' | 'warning' | 'critical'
      used: number
      total: number
      percentage: number
    }
    dependencies: {
      status: 'healthy' | 'unhealthy'
      services: Array<{
        name: string
        status: 'healthy' | 'unhealthy'
        responseTime?: number
        error?: string
      }>
    }
  }
}

// Health check response schema for OpenAPI documentation
const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  timestamp: z.string(),
  version: z.string(),
  uptime: z.number(),
  environment: z.string(),
  checks: z.object({
    memory: z.object({
      status: z.enum(['healthy', 'warning', 'critical']),
      used: z.number(),
      total: z.number(),
      percentage: z.number(),
    }),
    dependencies: z.object({
      status: z.enum(['healthy', 'unhealthy']),
      services: z.array(
        z.object({
          name: z.string(),
          status: z.enum(['healthy', 'unhealthy']),
          responseTime: z.number().optional(),
          error: z.string().optional(),
        })
      ),
    }),
  }),
})

// Register route documentation
registerRouteDoc('/api/health', 'GET', {
  summary: 'Health check',
  description: 'Check the health status of the API and its dependencies',
  tags: ['System'],
  responseSchema: HealthResponseSchema as unknown as ZodTypeAny,
  examples: {
    response: {
      status: 'healthy',
      timestamp: '2024-01-01T00:00:00.000Z',
      version: '1.0.0',
      uptime: 3600,
      environment: 'production',
      checks: {
        memory: {
          status: 'healthy',
          used: 45,
          total: 128,
          percentage: 35,
        },
        dependencies: {
          status: 'healthy',
          services: [],
        },
      },
    },
  },
})

/**
 * Check external dependencies
 * Add your service checks here (database, Redis, etc.)
 */
async function checkDependencies() {
  const services: Array<{
    name: string
    check: () => Promise<void>
  }> = [
    // Example: Add your actual dependencies here
    // {
    //   name: 'database',
    //   check: async () => await db.raw('SELECT 1'),
    // },
    // {
    //   name: 'redis',
    //   check: async () => await redis.ping(),
    // },
  ]

  const results = await Promise.allSettled(
    services.map((service) => {
      const startTime = Date.now()
      try {
        // await service.check()
        return Promise.resolve({
          name: service.name,
          status: 'healthy' as const,
          responseTime: Date.now() - startTime,
        })
      } catch (error) {
        return Promise.resolve({
          name: service.name,
          status: 'unhealthy' as const,
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })
  )

  const serviceResults = results.map((result) =>
    result.status === 'fulfilled'
      ? result.value
      : {
          name: 'unknown',
          status: 'unhealthy' as const,
          error: 'Service check failed',
        }
  )

  const allHealthy = serviceResults.every(
    (service) => service.status === 'healthy'
  )

  return {
    status: allHealthy ? ('healthy' as const) : ('unhealthy' as const),
    services: serviceResults,
  }
}

/**
 * GET /api/health
 * Returns system health status
 * Public route ordering: requireRateLimit() → handler
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Apply rate limiting for public endpoints (no auth required)
  const rateLimitResult = await requireRateLimit(request, {
    limiter: 'standard',
  })
  if (rateLimitResult.type === 'blocked') return rateLimitResult.response

  const startTime = Date.now()

  // Run health checks
  const [memoryCheck, dependencyCheck] = await Promise.all([
    checkMemoryHealth(),
    checkDependencies(),
  ])

  // Determine overall health
  const isHealthy =
    memoryCheck.status !== 'critical' && dependencyCheck.status === 'healthy'

  const healthData: HealthCheckResponse = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: nodeRuntime.version,
    uptime: nodeRuntime.uptime(),
    environment: config.NODE_ENV,
    checks: {
      memory: memoryCheck,
      dependencies: dependencyCheck,
    },
  }

  // Add response time to headers
  const responseTime = Date.now() - startTime

  const response = apiResponse(healthData, isHealthy ? 200 : 503, {
    'X-Response-Time': `${responseTime}ms`,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  })

  // Apply rate limit headers to response
  rateLimitResult.setHeaders(response)
  return response
})

/**
 * OPTIONS /api/health
 * Handle preflight requests
 */
export function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  return createCorsPreflightResponse(origin, {
    allowedMethods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
}
