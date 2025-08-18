import { type z } from 'zod'

/**
 * API Error with structured error data from server.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: HeadersInit
  schema?: z.ZodType
  signal?: AbortSignal
  credentials?: RequestCredentials
  cache?: RequestCache
  next?: NextFetchRequestConfig
}

interface NextFetchRequestConfig {
  revalidate?: number | false
  tags?: string[]
}

// Helper function to handle response errors
async function handleResponseError(response: Response): Promise<ApiError> {
  let errorData: unknown
  try {
    errorData = (await response.json()) as unknown
  } catch {
    // If not JSON, use status text
    return new ApiError(
      response.statusText || `HTTP ${String(response.status)}`,
      response.status,
      'HTTP_ERROR'
    )
  }

  // Extract error from standard envelope { error: { code, message } }
  if (errorData && typeof errorData === 'object' && 'error' in errorData) {
    const errorObj = errorData as { error: { code?: string; message?: string } }
    const { code, message } = errorObj.error
    return new ApiError(
      message ?? (response.statusText || `HTTP ${String(response.status)}`),
      response.status,
      code ?? 'API_ERROR',
      errorData
    )
  }

  // Fallback for non-standard error responses
  const fallbackMessage =
    errorData && typeof errorData === 'object' && 'message' in errorData
      ? (errorData as { message: string }).message
      : response.statusText || `HTTP ${String(response.status)}`

  return new ApiError(fallbackMessage, response.status, 'API_ERROR', errorData)
}

// Helper function to determine if error should be retried
function shouldRetry(
  error: unknown,
  attempt: number,
  maxRetries: number
): boolean {
  if (attempt >= maxRetries) return false

  // Don't retry 4xx errors
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false
  }

  // Retry network errors
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return true
  }

  // Retry 5xx errors
  return error instanceof ApiError && error.status >= 500
}

// Helper function for exponential backoff delay
async function delay(attempt: number): Promise<void> {
  await new Promise((resolve) =>
    setTimeout(resolve, Math.min(1000 * 2 ** attempt, 10_000))
  )
}

// Helper function to process successful response
async function processResponse<T>(
  response: Response,
  schema?: z.ZodType
): Promise<T> {
  // Handle 204 No Content (DELETE success)
  if (response.status === 204) {
    return { success: true } as T
  }

  // Parse response
  const responseData = (await response.json()) as unknown

  // Extract data from envelope { data: ... } or use raw response
  const data =
    responseData && typeof responseData === 'object' && 'data' in responseData
      ? (responseData as { data: unknown }).data
      : responseData

  // Validate with schema if provided
  if (schema) {
    return schema.parse(data) as T
  }

  return data as T
}

/**
 * Isomorphic fetch wrapper with automatic retries and Zod validation.
 * Only works with relative URLs for API routes.
 *
 * @example
 * ```ts
 * // Simple GET
 * const data = await fetchJson('/api/items')
 *
 * // With Zod validation
 * const items = await fetchJson('/api/items', {
 *   schema: z.array(ItemSchema)
 * })
 *
 * // POST with body
 * const newItem = await fetchJson('/api/items', {
 *   method: 'POST',
 *   body: { title: 'New item' },
 *   schema: ItemSchema
 * })
 * ```
 */
export async function fetchJson<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers: customHeaders = {},
    schema,
    signal,
    credentials = 'include',
    cache,
    next,
  } = options

  // Only accept relative URLs for API routes
  if (url.startsWith('http://') || url.startsWith('https://')) {
    throw new Error('fetchJson only accepts relative URLs starting with /')
  }

  // Build headers
  const headers = new Headers(customHeaders)

  // Add JSON content type for requests with body
  if (body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Prepare fetch options
  const fetchOptions: RequestInit & { next?: NextFetchRequestConfig } = {
    method,
    headers,
    credentials,
    signal,
    cache,
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...(next ? { next } : {}),
  }

  // Retry logic
  let lastError: Error | undefined
  const maxRetries = 2

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions)

      // Handle non-OK responses
      if (!response.ok) {
        const error = await handleResponseError(response)

        // Don't retry 4xx errors
        if (error.status >= 400 && error.status < 500) {
          throw error
        }

        // Retry 5xx errors with delay
        if (shouldRetry(error, attempt, maxRetries)) {
          lastError = error
          await delay(attempt)
          continue
        }

        throw error
      }

      // Process successful response
      return await processResponse<T>(response, schema)
    } catch (error) {
      // Handle abort
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }

      // Handle retryable errors
      if (shouldRetry(error, attempt, maxRetries)) {
        lastError = error as Error
        await delay(attempt)
        continue
      }

      // Re-throw other errors
      throw error
    }
  }

  // If we get here, all retries failed
  throw lastError ?? new Error('All fetch attempts failed')
}

/**
 * Create a fetch instance with default options.
 *
 * @example
 * ```ts
 * const api = createFetch({
 *   headers: { 'X-API-Key': 'secret' }
 * })
 *
 * const items = await api('/api/items')
 * ```
 */
export function createFetch(defaultOptions: Partial<FetchOptions> = {}) {
  return <T = unknown>(url: string, options: FetchOptions = {}): Promise<T> => {
    const mergedOptions = { ...defaultOptions, ...options }

    // Merge headers properly
    if (defaultOptions.headers || options.headers) {
      mergedOptions.headers = Object.assign(
        {},
        defaultOptions.headers as Record<string, string>,
        options.headers as Record<string, string>
      )
    }

    return fetchJson<T>(url, mergedOptions)
  }
}
