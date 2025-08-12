import { z } from 'zod'

/**
 * Client-side environment variable schema
 * Only NEXT_PUBLIC_* prefixed variables are allowed here for security
 */
const clientSchema = z.object({
  // Application configuration (public)
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default('Atlas App'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_API_URL: z.string().default('/api'),
})

/**
 * Validated and typed client environment variables
 */
export type ClientEnv = z.infer<typeof clientSchema>

let cachedClientEnv: ClientEnv | null = null

/**
 * Validate that all environment variables are properly prefixed for client-side usage
 */
function validateClientEnvPrefix(env: Record<string, unknown>): void {
  const nonPublicVars = Object.keys(env).filter(
    (key) =>
      !key.startsWith('NEXT_PUBLIC_') &&
      !key.startsWith('NODE_') && // Allow Node.js built-ins
      !key.startsWith('npm_') && // Allow npm variables
      !key.startsWith('NEXT_') // Allow Next.js internals
  )

  if (nonPublicVars.length > 0) {
    throw new Error(
      `Client environment contains non-NEXT_PUBLIC_ variables: ${nonPublicVars.join(', ')}\n` +
        'Only NEXT_PUBLIC_ prefixed variables are allowed in client-side code for security.'
    )
  }
}

/**
 * Extract only NEXT_PUBLIC_ prefixed variables from environment
 */
function getClientEnvVars(): Record<string, string | undefined> {
  if (typeof window !== 'undefined') {
    // Client-side: use Next.js provided public env vars
    return Object.keys(process.env).reduce(
      (acc, key) => {
        if (key.startsWith('NEXT_PUBLIC_')) {
          acc[key] = process.env[key]
        }
        return acc
      },
      {} as Record<string, string | undefined>
    )
  }

  // Server-side: filter from process.env
  return Object.keys(process.env).reduce(
    (acc, key) => {
      if (key.startsWith('NEXT_PUBLIC_')) {
        acc[key] = process.env[key]
      }
      return acc
    },
    {} as Record<string, string | undefined>
  )
}

/**
 * Get validated public environment variables
 *
 * Safe to use on both client and server side
 * Only includes NEXT_PUBLIC_ prefixed variables
 *
 * @returns Frozen, validated client environment object
 * @throws Error if variables don't match schema or contain non-public variables
 */
export function getPublicEnv(): ClientEnv {
  // Return cached env if already loaded
  if (cachedClientEnv) {
    return cachedClientEnv
  }

  try {
    const clientEnvVars = getClientEnvVars()

    // Security check: ensure only public variables are included
    validateClientEnvPrefix(clientEnvVars)

    const parsed = clientSchema.parse(clientEnvVars)
    cachedClientEnv = Object.freeze(parsed)

    return cachedClientEnv
  } catch (error) {
    if (error instanceof z.ZodError) {
      const invalidVars = error.issues
        .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
        .join('\n')

      throw new Error(`Invalid client environment variables:\n${invalidVars}`)
    }
    throw error
  }
}

/**
 * Check if we're running in the browser
 */
export const isBrowser = () => typeof window !== 'undefined'

/**
 * Get the validated public environment
 * This is the main export that should be used throughout the application
 */
export const envPublic = getPublicEnv()
