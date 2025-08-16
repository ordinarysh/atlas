import * as os from 'os'
import type { NextRequest } from 'next/server'
import { z, type ZodTypeAny } from 'zod'
import {
  apiResponse,
  requirePermission,
  withErrorHandling,
} from '@/lib/api-utils'
import { createApiKeyStore } from '@/lib/auth/api-key-store'
import { API_PERMISSIONS } from '@/lib/auth/api-keys'
import { nodeRuntime } from '@/lib/node-runtime'
import { registerRouteDoc } from '@/lib/openapi'

/**
 * Metrics response interface
 *
 * Provides basic application metrics for monitoring and observability.
 * This is a lightweight metrics endpoint - for production, consider
 * using proper metrics solutions like Prometheus, DataDog, etc.
 */
interface MetricsResponse {
  timestamp: string
  uptime: number
  memory: {
    used: number
    total: number
    percentage: number
    heap_used: number
    heap_total: number
    external: number
  }
  process: {
    pid: number
    version: string
    node_version: string
    platform: string
    arch: string
  }
  api: {
    total_keys: number
    active_keys: number
    recent_requests?: number
  }
  environment: {
    node_env: string
    deployment_time?: string
  }
}

// Metrics response schema for OpenAPI documentation
const MetricsResponseSchema = z.object({
  timestamp: z.string(),
  uptime: z.number(),
  memory: z.object({
    used: z.number(),
    total: z.number(),
    percentage: z.number(),
    heap_used: z.number(),
    heap_total: z.number(),
    external: z.number(),
  }),
  process: z.object({
    pid: z.number(),
    version: z.string(),
    node_version: z.string(),
    platform: z.string(),
    arch: z.string(),
  }),
  api: z.object({
    total_keys: z.number(),
    active_keys: z.number(),
    recent_requests: z.number().optional(),
  }),
  environment: z.object({
    node_env: z.string(),
    deployment_time: z.string().optional(),
  }),
})

// Register route documentation
registerRouteDoc('/api/metrics', 'GET', {
  summary: 'Application metrics',
  description:
    'Get application performance and usage metrics. Requires system:metrics permission.',
  tags: ['System'],
  security: true,
  responseSchema: MetricsResponseSchema as unknown as ZodTypeAny,
  examples: {
    response: {
      timestamp: '2024-01-01T00:00:00.000Z',
      uptime: 3600,
      memory: {
        used: 64,
        total: 128,
        percentage: 50,
        heap_used: 45,
        heap_total: 89,
        external: 12,
      },
      process: {
        pid: 12345,
        version: '1.0.0',
        node_version: '18.17.0',
        platform: 'linux',
        arch: 'x64',
      },
      api: {
        total_keys: 5,
        active_keys: 3,
        recent_requests: 1247,
      },
      environment: {
        node_env: 'production',
        deployment_time: '2024-01-01T00:00:00.000Z',
      },
    },
  },
})

/**
 * Get detailed memory metrics
 */
function getMemoryMetrics() {
  const usage = process.memoryUsage()
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem

  return {
    used: Math.round(usedMem / 1024 / 1024), // MB
    total: Math.round(totalMem / 1024 / 1024), // MB
    percentage: Math.round((usedMem / totalMem) * 100),
    heap_used: Math.round(usage.heapUsed / 1024 / 1024), // MB
    heap_total: Math.round(usage.heapTotal / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
  }
}

/**
 * Get process information
 */
function getProcessMetrics() {
  return {
    pid: process.pid,
    version: nodeRuntime.version,
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
  }
}

/**
 * Get API usage metrics
 */
async function getApiMetrics() {
  const apiKeyStore = createApiKeyStore()

  try {
    const stats = await apiKeyStore.getStats()

    return {
      total_keys: stats.total,
      active_keys: stats.active,
      // Note: recent_requests would need to be tracked separately
      // For now, we'll omit it since we don't have request tracking yet
    }
  } catch (_error) {
    // If stats are not available, return basic info
    return {
      total_keys: 0,
      active_keys: 0,
    }
  }
}

/**
 * Get environment information
 */
function getEnvironmentMetrics() {
  return {
    node_env: process.env.NODE_ENV || 'development',
    // If you track deployment times, add them here
    deployment_time: process.env.DEPLOYMENT_TIME,
  }
}

/**
 * GET /api/metrics
 * Returns application metrics for monitoring
 *
 * Requires system:metrics permission
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Require metrics permission
  await requirePermission(request, API_PERMISSIONS.METRICS)

  // Gather all metrics
  const [memoryMetrics, apiMetrics] = await Promise.all([
    Promise.resolve(getMemoryMetrics()),
    getApiMetrics(),
  ])

  const metricsData: MetricsResponse = {
    timestamp: new Date().toISOString(),
    uptime: nodeRuntime.uptime(),
    memory: memoryMetrics,
    process: getProcessMetrics(),
    api: apiMetrics,
    environment: getEnvironmentMetrics(),
  }

  return apiResponse(metricsData, 200, {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'X-Content-Type': 'application/json',
  })
})

/**
 * OPTIONS /api/metrics
 * Handle preflight requests
 */
export function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  })
}
