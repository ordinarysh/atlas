// Import server environment - this will be tree-shaken in client builds
import {
  getServerEnv,
  isDev as serverIsDev,
  isProd as serverIsProd,
  isTest as serverIsTest,
} from './env.server'

/**
 * Environment Variables Aggregator
 *
 * This file provides a secure way to access environment variables with runtime guards
 * to prevent server-only variables from being accessed in client-side code.
 */

// Re-export public environment (safe everywhere)
export {
  envPublic,
  getPublicEnv,
  isBrowser,
  type ClientEnv,
} from './env.client'

// Re-export server environment types (for type checking)
export type { ServerEnv } from './env.server'

/**
 * Detect if code is running on the server side
 */
function isServerSide(): boolean {
  return typeof window === 'undefined'
}

/**
 * Runtime guard error for client-side access attempts
 */
class ServerEnvAccessError extends Error {
  constructor(property: string) {
    super(
      `🚨 Security Error: Attempted to access server environment variable '${property}' in client-side code.\n\n` +
        `Server environment variables contain sensitive data and must only be used in:\n` +
        `- Server Components\n` +
        `- API Routes\n` +
        `- Server Actions\n` +
        `- Middleware\n\n` +
        `If you need this data on the client, consider:\n` +
        `1. Using a NEXT_PUBLIC_ prefixed variable for non-sensitive data\n` +
        `2. Passing the data through props from a Server Component\n` +
        `3. Fetching it via an API route\n\n` +
        `Import 'envPublic' instead for client-safe environment variables.`
    )
    this.name = 'ServerEnvAccessError'
  }
}

/**
 * Create a proxy that throws runtime errors when server env is accessed client-side
 */
function createServerEnvProxy() {
  return new Proxy({} as Record<string, unknown>, {
    get(_target, property: string | symbol) {
      // Allow common inspection properties
      if (typeof property === 'symbol') {
        return undefined
      }

      if (
        property === 'valueOf' ||
        property === 'toString' ||
        property === 'constructor'
      ) {
        return () => '[ServerEnv - Access Restricted]'
      }

      if (typeof property === 'symbol' && property === Symbol.toPrimitive) {
        return () => '[ServerEnv - Access Restricted]'
      }

      // Runtime check: prevent client-side access
      if (!isServerSide()) {
        throw new ServerEnvAccessError(property)
      }

      // Server-side: load and return actual value
      try {
        const serverEnv = getServerEnv()
        return serverEnv[property as keyof typeof serverEnv]
      } catch (error) {
        throw new Error(
          `Failed to load server environment: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    },

    has(_target, property: string | symbol) {
      if (!isServerSide()) {
        throw new ServerEnvAccessError(String(property))
      }

      try {
        const serverEnv = getServerEnv()
        return property in serverEnv
      } catch {
        return false
      }
    },

    ownKeys(_target) {
      if (!isServerSide()) {
        throw new ServerEnvAccessError('[keys enumeration]')
      }

      try {
        const serverEnv = getServerEnv()
        return Object.keys(serverEnv)
      } catch {
        return []
      }
    },

    getOwnPropertyDescriptor(_target, property: string | symbol) {
      if (!isServerSide()) {
        throw new ServerEnvAccessError(String(property))
      }

      try {
        const serverEnv = getServerEnv()
        const descriptor = Object.getOwnPropertyDescriptor(serverEnv, property)
        if (descriptor) {
          // Make sure descriptor is configurable to avoid proxy invariant violations
          return {
            ...descriptor,
            configurable: true,
            enumerable: true,
          }
        }
        return descriptor
      } catch {
        return undefined
      }
    },
  })
}

/**
 * Server environment variables with runtime protection
 *
 * ⚠️  SECURITY WARNING: Only use in server-side contexts!
 * - Server Components
 * - API Routes
 * - Server Actions
 * - Middleware
 *
 * Attempting to access this in Client Components will throw an error.
 *
 * @example
 * ```typescript
 * // ✅ Server Component
 * export default function Page() {
 *   const dbUrl = envServer.DATABASE_URL
 *   return <div>Connected to DB</div>
 * }
 *
 * // ❌ Client Component - Will throw error
 * 'use client'
 * export default function ClientComponent() {
 *   const secret = envServer.NEXTAUTH_SECRET // 🚨 Runtime Error!
 * }
 * ```
 */
export const envServer = createServerEnvProxy()

/**
 * Derived server-side utilities with runtime protection
 */
export const serverUtils = {
  /**
   * Check if running in development mode
   * Only available on server-side
   */
  async isDev(): Promise<boolean> {
    if (!isServerSide()) {
      throw new ServerEnvAccessError('isDev')
    }
    return await serverIsDev()
  },

  /**
   * Check if running in production mode
   * Only available on server-side
   */
  async isProd(): Promise<boolean> {
    if (!isServerSide()) {
      throw new ServerEnvAccessError('isProd')
    }
    return await serverIsProd()
  },

  /**
   * Check if running in test mode
   * Only available on server-side
   */
  async isTest(): Promise<boolean> {
    if (!isServerSide()) {
      throw new ServerEnvAccessError('isTest')
    }
    return await serverIsTest()
  },
}

/**
 * Safe number coercion utility
 * Re-exported from server env for convenience
 */
export function safeNumber(
  value: string | undefined,
  defaultValue?: number
): number | undefined {
  if (!value) return defaultValue
  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number: ${value}`)
  }
  return parsed
}
