import { fetchJson } from '@atlas/query'

/**
 * Configuration options for the API client
 */
export interface ApiConfig {
  /** Base URL for API requests (e.g., 'https://api.example.com' or '/api') */
  baseUrl?: string
  /** Function to retrieve auth token, can be async */
  getAuthToken?: () => string | null | Promise<string | null>
}

/**
 * Request options extending standard RequestInit
 */
export interface ApiRequestOptions
  extends Omit<RequestInit, 'body' | 'method'> {
  /** Query parameters to append to the URL */
  params?: Record<string, string | number | boolean | undefined | null>
}

/**
 * Type-safe API client interface
 */
export interface ApiClient {
  get: <T = unknown>(path: string, options?: ApiRequestOptions) => Promise<T>
  post: <T = unknown>(
    path: string,
    body?: unknown,
    options?: ApiRequestOptions
  ) => Promise<T>
  put: <T = unknown>(
    path: string,
    body?: unknown,
    options?: ApiRequestOptions
  ) => Promise<T>
  patch: <T = unknown>(
    path: string,
    body?: unknown,
    options?: ApiRequestOptions
  ) => Promise<T>
  del: <T = unknown>(path: string, options?: ApiRequestOptions) => Promise<T>
}

/**
 * Serializes query parameters into a URL search string
 * @param params - Object containing query parameters
 * @returns URL search string (without leading '?')
 */
export function qs(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })

  return searchParams.toString()
}

/**
 * Determines if a URL is absolute (starts with http:// or https://)
 */
function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

/**
 * Joins base URL and path, handling absolute URLs and slashes
 */
function buildUrl(base: string, path: string): string {
  // If path is absolute URL, use it directly
  if (isAbsoluteUrl(path)) {
    return path
  }

  // If no base URL, return path as-is
  if (!base) {
    return path
  }

  // Join base and path, avoiding double slashes
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${cleanBase}${cleanPath}`
}

/**
 * Creates a type-safe API client with automatic auth token handling
 *
 * @example
 * ```ts
 * const api = createApi({
 *   baseUrl: 'https://api.example.com',
 *   getAuthToken: async () => getTokenFromSecureStorage()
 * })
 *
 * // GET request with query params
 * const todos = await api.get<Todo[]>('/todos', {
 *   params: { status: 'active', limit: 10 }
 * })
 *
 * // POST with body
 * const newTodo = await api.post<Todo>('/todos', {
 *   title: 'New task',
 *   completed: false
 * })
 *
 * // With abort controller
 * const controller = new AbortController()
 * const data = await api.get('/data', { signal: controller.signal })
 * ```
 */
export function createApi(config: ApiConfig = {}): ApiClient {
  const { baseUrl = '', getAuthToken } = config

  const buildHeaders = async (
    customHeaders?: HeadersInit
  ): Promise<HeadersInit> => {
    const headers = new Headers(customHeaders)

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    if (getAuthToken) {
      const token = await getAuthToken()
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
    }

    return headers
  }

  // Clean the options object to remove null values and extract params
  const prepareOptions = (
    options?: ApiRequestOptions
  ): [
    Record<string, unknown>,
    Record<string, string | number | boolean | undefined | null> | undefined,
  ] => {
    if (!options) return [{}, undefined]

    const { params, ...rest } = options
    const cleaned: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(rest)) {
      cleaned[key] = value
    }

    return [cleaned, params]
  }

  const appendParams = (
    url: string,
    params?: Record<string, string | number | boolean | undefined | null>
  ): string => {
    if (!params || Object.keys(params).length === 0) return url

    const queryString = qs(params)
    if (!queryString) return url

    return url.includes('?') ? `${url}&${queryString}` : `${url}?${queryString}`
  }

  return {
    get: async <T = unknown>(
      path: string,
      options?: ApiRequestOptions
    ): Promise<T> => {
      const [cleanedOptions, params] = prepareOptions(options)
      const baseUrlPath = buildUrl(baseUrl, path)
      const url = appendParams(baseUrlPath, params)

      return await fetchJson(url, {
        ...cleanedOptions,
        method: 'GET',
        headers: await buildHeaders(
          cleanedOptions.headers as HeadersInit | undefined
        ),
      }) as T
    },

    post: async <T = unknown>(
      path: string,
      body?: unknown,
      options?: ApiRequestOptions
    ): Promise<T> => {
      const [cleanedOptions, params] = prepareOptions(options)
      const baseUrlPath = buildUrl(baseUrl, path)
      const url = appendParams(baseUrlPath, params)

      return await fetchJson(url, {
        ...cleanedOptions,
        method: 'POST',
        body,
        headers: await buildHeaders(
          cleanedOptions.headers as HeadersInit | undefined
        ),
      }) as T
    },

    put: async <T = unknown>(
      path: string,
      body?: unknown,
      options?: ApiRequestOptions
    ): Promise<T> => {
      const [cleanedOptions, params] = prepareOptions(options)
      const baseUrlPath = buildUrl(baseUrl, path)
      const url = appendParams(baseUrlPath, params)

      return await fetchJson(url, {
        ...cleanedOptions,
        method: 'PUT',
        body,
        headers: await buildHeaders(
          cleanedOptions.headers as HeadersInit | undefined
        ),
      }) as T
    },

    patch: async <T = unknown>(
      path: string,
      body?: unknown,
      options?: ApiRequestOptions
    ): Promise<T> => {
      const [cleanedOptions, params] = prepareOptions(options)
      const baseUrlPath = buildUrl(baseUrl, path)
      const url = appendParams(baseUrlPath, params)

      return await fetchJson(url, {
        ...cleanedOptions,
        method: 'PATCH',
        body,
        headers: await buildHeaders(
          cleanedOptions.headers as HeadersInit | undefined
        ),
      }) as T
    },

    del: async <T = unknown>(
      path: string,
      options?: ApiRequestOptions
    ): Promise<T> => {
      const [cleanedOptions, params] = prepareOptions(options)
      const baseUrlPath = buildUrl(baseUrl, path)
      const url = appendParams(baseUrlPath, params)

      return await fetchJson(url, {
        ...cleanedOptions,
        method: 'DELETE',
        headers: await buildHeaders(
          cleanedOptions.headers as HeadersInit | undefined
        ),
      }) as T
    },
  }
}
