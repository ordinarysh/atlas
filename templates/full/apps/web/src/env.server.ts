import { z } from 'zod'

/**
 * Server-side environment variable schema
 * These variables are only available on the server and should never be exposed to the client
 */
const serverSchema = z.object({
  // Core Node.js environment
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // Database configuration (optional - only if implementing data layer)
  DATABASE_URL: z.string().url().optional(),
})

/**
 * Validated and typed server environment variables
 */
export type ServerEnv = z.infer<typeof serverSchema>

let cachedServerEnv: ServerEnv | null = null
let envLoaded = false

/**
 * Helper function to coerce string environment variables to numbers with validation
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

/**
 * Load and validate server-side environment variables
 *
 * In development: loads .env files via dotenv (once)
 * In production: assumes environment is provided by the platform
 *
 * @returns Frozen, validated server environment object
 * @throws Error if required variables are missing or invalid
 */
export async function loadServerEnv(): Promise<ServerEnv> {
  // Return cached env if already loaded
  if (cachedServerEnv) {
    return cachedServerEnv
  }

  // Load .env files only in development and only once
  if (process.env.NODE_ENV === 'development' && !envLoaded) {
    try {
      // Dynamic import to avoid bundling dotenv in production
      const { config } = await import('dotenv')
      config({ path: ['.env.local', '.env'] })
      envLoaded = true
    } catch (error) {
      // Gracefully handle missing dotenv (shouldn't happen since we added it as a dependency)
      console.warn('dotenv not available:', error)
    }
  }

  try {
    const parsed = serverSchema.parse(process.env)
    cachedServerEnv = Object.freeze(parsed)
    return cachedServerEnv
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
        .join('\n')

      throw new Error(`Invalid server environment variables:\n${missingVars}`)
    }
    throw error
  }
}

/**
 * Derived boolean flags from NODE_ENV
 */
export const isDev = async () =>
  (await loadServerEnv()).NODE_ENV === 'development'
export const isTest = async () => (await loadServerEnv()).NODE_ENV === 'test'
export const isProd = async () =>
  (await loadServerEnv()).NODE_ENV === 'production'

/**
 * Get the validated server environment synchronously
 * This works by checking if the environment is already loaded, otherwise loads it
 */
export function getServerEnv(): ServerEnv {
  if (!cachedServerEnv) {
    // For synchronous access, we need to load env without async operations
    // This means no dotenv loading in sync mode - env must be pre-loaded or provided by platform
    try {
      const parsed = serverSchema.parse(process.env)
      cachedServerEnv = Object.freeze(parsed)
      return cachedServerEnv
    } catch (error) {
      if (error instanceof z.ZodError) {
        const missingVars = error.issues
          .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
          .join('\n')

        throw new Error(`Invalid server environment variables:\n${missingVars}`)
      }
      throw error
    }
  }
  return cachedServerEnv
}

/**
 * Get the validated server environment
 * This is the main export that should be used throughout the server-side code
 */
export const envServer = getServerEnv()
