import type { NextRequest } from 'next/server'
import { z, type ZodTypeAny } from 'zod'
import { healthResponse, withErrorHandling } from '@/lib/api-utils'
import { nodeRuntime } from '@/lib/node-runtime'
import { registerRouteDoc } from '@/lib/openapi'

/**
 * Readiness check response interface
 *
 * Readiness checks are used by orchestrators (like Kubernetes) to determine
 * if the application is ready to receive traffic. This is different from
 * health checks which indicate if the application is working properly.
 */
interface ReadinessCheckResponse {
  status: 'ready' | 'not_ready'
  timestamp: string
  checks: {
    startup: {
      status: 'complete' | 'pending' | 'failed'
      message?: string
    }
    dependencies: {
      status: 'ready' | 'not_ready'
      critical_services: Array<{
        name: string
        status: 'ready' | 'not_ready'
        error?: string
      }>
    }
  }
}

// Readiness response schema for OpenAPI documentation
const ReadinessResponseSchema = z.object({
  status: z.enum(['ready', 'not_ready']),
  timestamp: z.string(),
  checks: z.object({
    startup: z.object({
      status: z.enum(['complete', 'pending', 'failed']),
      message: z.string().optional(),
    }),
    dependencies: z.object({
      status: z.enum(['ready', 'not_ready']),
      critical_services: z.array(
        z.object({
          name: z.string(),
          status: z.enum(['ready', 'not_ready']),
          error: z.string().optional(),
        })
      ),
    }),
  }),
})

// Register route documentation
registerRouteDoc('/api/ready', 'GET', {
  summary: 'Readiness check',
  description:
    'Check if the API is ready to receive traffic. Used by orchestrators like Kubernetes.',
  tags: ['System'],
  responseSchema: ReadinessResponseSchema as unknown as ZodTypeAny,
  examples: {
    response: {
      status: 'ready',
      timestamp: '2024-01-01T00:00:00.000Z',
      checks: {
        startup: {
          status: 'complete',
        },
        dependencies: {
          status: 'ready',
          critical_services: [],
        },
      },
    },
  },
})

/**
 * Check if critical dependencies are ready
 * These are services that MUST be available for the app to function
 */
async function checkCriticalDependencies() {
  const criticalServices: Array<{
    name: string
    check: () => Promise<void>
  }> = [
    // Add critical dependencies here
    // Example: Database connection that's required for all operations
    // {
    //   name: 'database',
    //   check: async () => {
    //     await db.raw('SELECT 1')
    //   }
    // }
  ]

  const results = await Promise.allSettled(
    criticalServices.map(async (service) => {
      try {
        await service.check()
        return {
          name: service.name,
          status: 'ready' as const,
        }
      } catch (error) {
        return {
          name: service.name,
          status: 'not_ready' as const,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    })
  )

  const serviceResults = results.map((result) =>
    result.status === 'fulfilled'
      ? result.value
      : {
          name: 'unknown',
          status: 'not_ready' as const,
          error: 'Service check failed',
        }
  )

  const allReady = serviceResults.every((service) => service.status === 'ready')

  return {
    status: allReady ? ('ready' as const) : ('not_ready' as const),
    critical_services: serviceResults,
  }
}

/**
 * Check if application startup is complete
 */
function checkStartupStatus(): {
  status: 'complete' | 'pending' | 'failed'
  message?: string
} {
  // Check if minimum uptime has been reached (app has been running for at least 5 seconds)
  const minimumUptimeMs = 5000
  const uptime = nodeRuntime.uptime() * 1000

  if (uptime < minimumUptimeMs) {
    return {
      status: 'pending',
      message: `Startup in progress. Uptime: ${Math.round(uptime)}ms`,
    }
  }

  // Add any other startup checks here
  // Example: configuration validation, essential file checks, etc.

  return {
    status: 'complete',
  }
}

/**
 * GET /api/ready
 * Returns readiness status for orchestrators
 *
 * This endpoint should return:
 * - 200 if the application is ready to receive traffic
 * - 503 if the application is not ready (orchestrator should not route traffic)
 */
export const GET = withErrorHandling(async (_request: NextRequest) => {
  // Run readiness checks
  const [startupCheck, dependencyCheck] = await Promise.all([
    Promise.resolve(checkStartupStatus()),
    checkCriticalDependencies(),
  ])

  // Determine overall readiness
  const isReady =
    startupCheck.status === 'complete' && dependencyCheck.status === 'ready'

  const _readinessData: ReadinessCheckResponse = {
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks: {
      startup: startupCheck,
      dependencies: dependencyCheck,
    },
  }

  return healthResponse(isReady ? 'healthy' : 'unhealthy', {
    startup: {
      status: startupCheck.status,
    },
    dependencies: {
      status: dependencyCheck.status,
    },
  })
})

/**
 * OPTIONS /api/ready
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
