import { NextResponse, type NextRequest } from 'next/server'
import { ZodError } from 'zod'
import { features } from '@/lib/config'
import { logger } from '@/lib/logger'

/**
 * Request size limits configuration
 */
const REQUEST_LIMITS = {
  maxBodySize: 10 * 1024 * 1024, // 10MB default
  maxUrlLength: 2048, // 2KB URL limit
} as const

/**
 * Request timeout configuration
 */
const REQUEST_TIMEOUT = {
  defaultMs: 30000, // 30 seconds default
  maxMs: 300000, // 5 minutes maximum
} as const

/**
 * Standard API error codes for consistent error handling
 */
export const API_ERROR_CODES = {
  // Client errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES]

/**
 * Enhanced API error class with structured error information
 */
export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public status = 500,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }

  /**
   * Factory methods for common errors
   */
  static badRequest(message = 'Bad Request', details?: unknown) {
    return new ApiError(API_ERROR_CODES.BAD_REQUEST, message, 400, details)
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(API_ERROR_CODES.UNAUTHORIZED, message, 401)
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(API_ERROR_CODES.FORBIDDEN, message, 403)
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(API_ERROR_CODES.NOT_FOUND, message, 404)
  }

  static methodNotAllowed(method: string) {
    return new ApiError(
      API_ERROR_CODES.METHOD_NOT_ALLOWED,
      `Method ${method} not allowed`,
      405
    )
  }

  static validation(message: string, details?: unknown) {
    return new ApiError(API_ERROR_CODES.VALIDATION_ERROR, message, 400, details)
  }

  static internal(message = 'Internal server error') {
    return new ApiError(API_ERROR_CODES.INTERNAL_ERROR, message, 500)
  }
}

/**
 * Standard API response structure
 */
interface ApiResponse<T = unknown> {
  data?: T
  error?: {
    code: ApiErrorCode
    message: string
    details?: unknown
  }
}

/**
 * Create a standardized API success response
 */
export function apiResponse<T>(
  data: T,
  status = 200,
  headers: HeadersInit = {}
): NextResponse<ApiResponse<T>> {
  const defaultHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  }

  return NextResponse.json(
    { data },
    {
      status,
      headers: { ...defaultHeaders, ...headers },
    }
  )
}

/**
 * Create a standardized API error response
 */
export function apiErrorResponse(
  error: ApiError,
  headers: HeadersInit = {}
): NextResponse<ApiResponse> {
  const defaultHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  }

  // Only expose error details in development
  const errorResponse: ApiResponse = {
    error: {
      code: error.code,
      message: error.message,
      ...(features.showErrorDetails && error.details
        ? {
            details: error.details,
          }
        : {}),
    },
  }

  return NextResponse.json(errorResponse, {
    status: error.status,
    headers: { ...defaultHeaders, ...headers },
  })
}

/**
 * Handle Zod validation errors and convert to API errors
 */
export function handleZodError(error: ZodError<unknown>): ApiError {
  const firstError = error.issues[0]
  const message = firstError?.message || 'Validation failed'
  const details = features.showErrorDetails ? error.issues : undefined

  return ApiError.validation(message, details)
}

/**
 * Validate request size limits to prevent abuse
 */
function validateRequestLimits(request: NextRequest): void {
  // Check URL length
  if (request.url.length > REQUEST_LIMITS.maxUrlLength) {
    throw ApiError.badRequest('Request URL too long')
  }

  // Check content length header
  const contentLength = request.headers.get('content-length')
  if (contentLength) {
    const size = parseInt(contentLength, 10)
    if (size > REQUEST_LIMITS.maxBodySize) {
      throw ApiError.badRequest(
        `Request body too large. Maximum size: ${REQUEST_LIMITS.maxBodySize} bytes`
      )
    }
  }
}

/**
 * Request validation helper - accepts any Zod schema type
 */
export interface ValidationOptions {
  body?: { parse: (data: unknown) => unknown }
  query?: { parse: (data: unknown) => unknown }
  params?: { parse: (data: unknown) => unknown }
}

export async function validateRequest<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
>(
  request: NextRequest,
  options: ValidationOptions,
  routeParams?: Record<string, string>
): Promise<{
  body?: TBody
  query?: TQuery
  params?: TParams
}> {
  // Validate request size limits first
  validateRequestLimits(request)

  const result: {
    body?: TBody
    query?: TQuery
    params?: TParams
  } = {}

  // Validate request body
  if (options.body) {
    try {
      const body = await request.json()
      result.body = options.body.parse(body) as TBody
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw ApiError.badRequest('Invalid JSON in request body')
      }
      if (error instanceof ZodError) {
        throw handleZodError(error)
      }
      throw ApiError.internal('Failed to process request body')
    }
  }

  // Validate query parameters
  if (options.query) {
    try {
      const url = new URL(request.url)
      const queryParams = Object.fromEntries(url.searchParams.entries())
      result.query = options.query.parse(queryParams) as TQuery
    } catch (error) {
      if (error instanceof ZodError) {
        throw handleZodError(error)
      }
      throw error
    }
  }

  // Validate route parameters
  if (options.params && routeParams) {
    try {
      result.params = options.params.parse(routeParams) as TParams
    } catch (error) {
      if (error instanceof ZodError) {
        throw handleZodError(error)
      }
      throw error
    }
  }

  return result
}

/**
 * Create a promise that rejects after a timeout
 */
function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_resolve, reject) => {
    setTimeout(() => {
      reject(
        new ApiError(
          API_ERROR_CODES.INTERNAL_ERROR,
          'Request timeout - operation took too long',
          504 // Gateway Timeout
        )
      )
    }, timeoutMs)
  })
}

/**
 * Higher-order function to wrap API route handlers with error handling and timeout
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  timeoutMs: number = REQUEST_TIMEOUT.defaultMs
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      // Race between the handler and timeout
      const result = await Promise.race([
        handler(...args),
        createTimeoutPromise(Math.min(timeoutMs, REQUEST_TIMEOUT.maxMs)),
      ])
      return result
    } catch (error) {
      // Log the error with structured logging
      const errorContext = {
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          code: error instanceof ApiError ? error.code : undefined,
        },
        statusCode: error instanceof ApiError ? error.status : 500,
      }

      logger.error('API request failed', errorContext)

      // Handle known API errors
      if (error instanceof ApiError) {
        return apiErrorResponse(error)
      }

      // Handle Zod validation errors
      if (error instanceof ZodError) {
        return apiErrorResponse(handleZodError(error))
      }

      // Handle unknown errors
      return apiErrorResponse(ApiError.internal())
    }
  }
}

/**
 * Method validation helper
 */
export function validateMethod(
  request: NextRequest,
  allowedMethods: string[]
): void {
  if (!allowedMethods.includes(request.method)) {
    throw ApiError.methodNotAllowed(request.method)
  }
}

/**
 * Get request ID from headers (added by middleware)
 */
export function getRequestId(request: NextRequest): string | null {
  return request.headers.get('x-request-id')
}

/**
 * Get authentication context from headers (added by middleware)
 */
export function getAuthContext(request: NextRequest): {
  apiKey: {
    id: string
    name: string
    permissions: string[]
  }
  clientIp: string
} | null {
  const authHeader = request.headers.get('x-auth-context')
  if (!authHeader) return null

  try {
    return JSON.parse(authHeader)
  } catch {
    return null
  }
}

/**
 * Pagination utilities
 */
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
    nextPage: number | null
    prevPage: number | null
  }
}

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number
  limit: number
  offset: number
} {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(
      1,
      parseInt(searchParams.get('limit') ?? String(DEFAULT_PAGE_SIZE), 10)
    )
  )
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  pagination: { page: number; limit: number }
): PaginationResult<T> {
  const totalPages = Math.ceil(total / pagination.limit)
  const hasNext = pagination.page < totalPages
  const hasPrev = pagination.page > 1

  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
      nextPage: hasNext ? pagination.page + 1 : null,
      prevPage: hasPrev ? pagination.page - 1 : null,
    },
  }
}

/**
 * Filtering and sorting utilities
 */
export interface FilterParams {
  search?: string
  status?: string
  createdAfter?: Date
  createdBefore?: Date
  [key: string]: unknown
}

export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export function parseFilterParams(searchParams: URLSearchParams): FilterParams {
  const filters: FilterParams = {}

  // Common filter patterns
  const search = searchParams.get('search')
  if (search) filters.search = search

  const status = searchParams.get('status')
  if (status) filters.status = status

  const createdAfter = searchParams.get('created_after')
  if (createdAfter) {
    const date = new Date(createdAfter)
    if (!isNaN(date.getTime())) filters.createdAfter = date
  }

  const createdBefore = searchParams.get('created_before')
  if (createdBefore) {
    const date = new Date(createdBefore)
    if (!isNaN(date.getTime())) filters.createdBefore = date
  }

  // Custom filters (any other query params)
  for (const [key, value] of searchParams.entries()) {
    if (
      ![
        'page',
        'limit',
        'sort_by',
        'sort_order',
        'search',
        'status',
        'created_after',
        'created_before',
      ].includes(key)
    ) {
      filters[key] = value
    }
  }

  return filters
}

export function parseSortParams(
  searchParams: URLSearchParams,
  allowedFields: string[] = []
): SortParams {
  const sortBy = searchParams.get('sort_by')
  const sortOrder = searchParams.get('sort_order') as 'asc' | 'desc' | null

  // Validate sortBy field if allowedFields is provided
  if (sortBy && allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    throw ApiError.badRequest(
      `Invalid sort field: ${sortBy}. Allowed fields: ${allowedFields.join(', ')}`
    )
  }

  return {
    sortBy: sortBy ?? undefined,
    sortOrder: sortOrder === 'desc' ? 'desc' : 'asc',
  }
}

/**
 * Permission checking utilities
 *
 * @deprecated Use requireApiKey(scope) directly in route handlers for better performance
 * This function is kept for backward compatibility but will be removed in future versions
 */
export async function requirePermission(
  request: NextRequest,
  permission: string
): Promise<void> {
  // Import dynamically to avoid circular dependencies
  const { requireApiKey } = await import('@/server/auth')
  const { NextResponse } = await import('next/server')

  const authResult = await requireApiKey(permission)

  if (authResult instanceof NextResponse) {
    // Convert NextResponse to ApiError for consistency
    const status = authResult.status
    if (status === 401) {
      throw ApiError.unauthorized('Authentication required')
    } else if (status === 403) {
      throw ApiError.forbidden(`Missing required permission: ${permission}`)
    } else {
      throw ApiError.internal('Authentication service error')
    }
  }
}

/**
 * @deprecated Use requireApiKey() with specific scopes directly in route handlers
 * This function is kept for backward compatibility but will be removed in future versions
 */
export async function requireAnyPermission(
  request: NextRequest,
  permissions: string[]
): Promise<void> {
  // For backward compatibility, try the first permission
  // In practice, routes should use requireApiKey() directly
  await requirePermission(request, permissions[0])
}

/**
 * @deprecated Use requireApiKey() with specific scopes directly in route handlers
 * This function is kept for backward compatibility but will be removed in future versions
 */
export async function requireAllPermissions(
  request: NextRequest,
  permissions: string[]
): Promise<void> {
  // For backward compatibility, check all permissions sequentially
  // In practice, routes should use requireApiKey() directly
  for (const permission of permissions) {
    await requirePermission(request, permission)
  }
}

/**
 * Input sanitization utilities
 */
export function sanitizeString(input: string): string {
  // Remove HTML tags, script content, and dangerous characters
  return (
    input
      .trim()
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove script-related content
      .replace(
        /\b(alert|eval|function|script|javascript|vbscript|onload|onerror|onclick)\b/gi,
        ''
      )
      // Remove control characters and dangerous special characters
      .replace(/[\p{C}"%'\\<>]/gu, '')
  )
}

export function sanitizeSearchQuery(query: string): string {
  // Remove dangerous characters and SQL injection patterns
  return (
    query
      .trim()
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove SQL injection patterns
      .replace(
        /\b(drop|delete|insert|update|union|select|create|alter|exec|execute)\b/gi,
        ''
      )
      .replace(/\b(table|database|schema|index|view|trigger|procedure)\b/gi, '')
      // Remove dangerous characters and operators
      .replace(/[!#$%&'()*+;<=>@[\\\]^`{|}~]/g, '')
      // Remove SQL comment patterns
      .replace(/--|\/\*|\*\/|#/g, '')
      .substring(0, 200)
  ) // Limit length
}

/**
 * Response builder utilities
 */
export function successResponse<T>(data: T, status = 200) {
  return apiResponse(data, status)
}

export function createdResponse<T>(data: T) {
  return apiResponse(data, 201)
}

export function noContentResponse() {
  return new NextResponse(null, { status: 204 })
}

export function paginatedResponse<T>(result: PaginationResult<T>) {
  return apiResponse(result)
}

/**
 * List response builder with metadata
 */
export function listResponse<T>(
  items: T[],
  metadata: {
    total: number
    count: number
    filters?: Record<string, unknown>
    sort?: SortParams
  }
) {
  return apiResponse({
    items,
    metadata: {
      total: metadata.total,
      count: metadata.count,
      ...(metadata.filters && { filters: metadata.filters }),
      ...(metadata.sort && { sort: metadata.sort }),
    },
  })
}

/**
 * Health check response builder
 */
export function healthResponse(
  status: 'healthy' | 'degraded' | 'unhealthy',
  checks: Record<
    string,
    { status: string; latency?: number; error?: string }
  > = {}
) {
  const httpStatus = status === 'healthy' ? 200 : 503

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: httpStatus }
  )
}

/**
 * Cache control utilities
 */
export function withCacheHeaders(response: NextResponse, maxAge: number) {
  response.headers.set(
    'Cache-Control',
    `public, max-age=${maxAge}, s-maxage=${maxAge}`
  )
  response.headers.set('ETag', `"${Date.now()}"`)
  return response
}

export function withNoCacheHeaders(response: NextResponse) {
  response.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, private'
  )
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

/**
 * Request context utilities
 */
export function extractRequestContext(request: NextRequest) {
  const url = new URL(request.url)
  const searchParams = url.searchParams

  return {
    requestId: getRequestId(request),
    authContext: getAuthContext(request),
    method: request.method,
    pathname: url.pathname,
    query: Object.fromEntries(searchParams.entries()),
    userAgent: request.headers.get('user-agent'),
    contentType: request.headers.get('content-type'),
    clientIp:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown',
  }
}
