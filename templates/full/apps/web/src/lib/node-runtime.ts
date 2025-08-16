/**
 * Node.js-specific runtime utilities
 * Only use this in API routes (Node.js runtime), not in middleware (Edge runtime)
 */

import { config } from './config'

/**
 * Get Node.js runtime information
 * Only safe to use in Node.js runtime (API routes)
 */
export const nodeRuntime = {
  version: config.npm_package_version,
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  uptime: () => Math.round(process.uptime()),
  memoryUsage: () => process.memoryUsage(),
} as const

/**
 * Check memory usage with thresholds
 */
export function checkMemoryHealth() {
  const memUsage = process.memoryUsage()
  const used = Math.round(memUsage.heapUsed / 1024 / 1024) // MB
  const total = Math.round(memUsage.heapTotal / 1024 / 1024) // MB
  const percentage = Math.round((used / total) * 100)

  let status: 'healthy' | 'warning' | 'critical' = 'healthy'
  if (percentage > 90) status = 'critical'
  else if (percentage > 75) status = 'warning'

  return {
    status,
    used,
    total,
    percentage,
  }
}
