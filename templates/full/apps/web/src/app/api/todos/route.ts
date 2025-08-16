import { NextResponse, type NextRequest } from 'next/server'
import { TodoCreateSchema, TodosListSchema } from '@atlas/todos-domain'
import { z, type ZodTypeAny } from 'zod'
import {
  createdResponse,
  createPaginatedResponse,
  extractRequestContext,
  paginatedResponse,
  parseFilterParams,
  parsePaginationParams,
  parseSortParams,
  validateMethod,
  validateRequest,
  withErrorHandling,
} from '@/lib/api-utils'
import { registerRouteDoc } from '@/lib/openapi'
import { requireApiKey } from '@/server/auth'
import { requireRateLimit } from '@/server/rate-limit'
import { todosRepo } from '../../../../../../services/repository/todos-repo'

// Query parameters schema for filtering and pagination
const TodosQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(['completed', 'pending', 'all']).optional(),
  sort_by: z.enum(['title', 'createdAt', 'updatedAt', 'completed']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  created_after: z.string().optional(),
  created_before: z.string().optional(),
})

// Paginated response schema
const PaginatedTodosSchema = z.object({
  data: TodosListSchema,
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
    nextPage: z.number().nullable(),
    prevPage: z.number().nullable(),
  }),
})

// Register route documentation
registerRouteDoc('/api/todos', 'GET', {
  summary: 'List todos with pagination and filtering',
  description:
    'Retrieve a paginated list of todos with optional filtering and sorting. Requires read permission.',
  tags: ['Todos'],
  security: true,
  querySchema: TodosQuerySchema as unknown as ZodTypeAny,
  responseSchema: PaginatedTodosSchema as unknown as ZodTypeAny,
  examples: {
    response: {
      data: [
        {
          id: '1',
          title: 'Complete project documentation',
          completed: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
        nextPage: null,
        prevPage: null,
      },
    },
  },
})

registerRouteDoc('/api/todos', 'POST', {
  summary: 'Create a new todo',
  description:
    'Create a new todo item with the provided data. Requires write permission.',
  tags: ['Todos'],
  security: true,
  bodySchema: TodoCreateSchema as unknown as ZodTypeAny,
  responseSchema: TodosListSchema.element as unknown as ZodTypeAny,
  examples: {
    request: {
      title: 'Complete project documentation',
      completed: false,
    },
    response: {
      id: '1',
      title: 'Complete project documentation',
      completed: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  },
})

/**
 * GET /api/todos
 * List todos with pagination, filtering, and sorting
 * Ordering: requireApiKey(scope) → requireRateLimit() → handler
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  validateMethod(request, ['GET'])

  // Require read permission first
  const auth = await requireApiKey('read:todos')
  if (auth instanceof NextResponse) return auth

  // Apply rate limiting after authentication
  const rateLimitResult = await requireRateLimit(request, {
    limiter: 'standard',
  })
  if (rateLimitResult.type === 'blocked') return rateLimitResult.response

  // Extract request context for logging
  const _context = extractRequestContext(request)

  // Parse URL and query parameters
  const url = new URL(request.url)
  const searchParams = url.searchParams

  // Validate query parameters
  const { query } = await validateRequest<
    never,
    z.infer<typeof TodosQuerySchema>
  >(request, { query: TodosQuerySchema })

  // Parse pagination parameters
  const pagination = parsePaginationParams(searchParams)

  // Parse filter parameters
  const filters = parseFilterParams(searchParams)

  // Parse sort parameters with allowed fields
  const sort = parseSortParams(searchParams, [
    'title',
    'createdAt',
    'updatedAt',
    'completed',
  ])

  // Build filter options for the repository
  const filterOptions = {
    search: filters.search,
    completed:
      query?.status === 'completed'
        ? true
        : query?.status === 'pending'
          ? false
          : undefined,
    createdAfter: filters.createdAfter,
    createdBefore: filters.createdBefore,
  }

  // Get todos with pagination and filtering
  // Note: The repository would need to be updated to support these options
  // For now, we'll do basic filtering on the results
  const allTodos = await todosRepo.list()

  // Apply basic filtering (in a real app, this would be done at the database level)
  let filteredTodos = allTodos

  if (filterOptions.search) {
    filteredTodos = filteredTodos.filter((todo) =>
      todo.title.toLowerCase().includes(filterOptions.search!.toLowerCase())
    )
  }

  if (filterOptions.completed !== undefined) {
    filteredTodos = filteredTodos.filter(
      (todo) => todo.completed === filterOptions.completed
    )
  }

  if (filterOptions.createdAfter) {
    filteredTodos = filteredTodos.filter(
      (todo) => new Date(todo.createdAt) >= filterOptions.createdAfter!
    )
  }

  if (filterOptions.createdBefore) {
    filteredTodos = filteredTodos.filter(
      (todo) => new Date(todo.createdAt) <= filterOptions.createdBefore!
    )
  }

  // Apply sorting
  if (sort.sortBy) {
    filteredTodos.sort((a, b) => {
      const aVal = a[sort.sortBy as keyof typeof a]
      const bVal = b[sort.sortBy as keyof typeof b]

      if (aVal < bVal) return sort.sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sort.sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }

  // Apply pagination
  const total = filteredTodos.length
  const start = pagination.offset
  const end = start + pagination.limit
  const paginatedTodos = filteredTodos.slice(start, end)

  // Validate output against domain schema
  const validated = TodosListSchema.parse(paginatedTodos)

  // Create paginated response
  const result = createPaginatedResponse(validated, total, pagination)

  const response = paginatedResponse(result)

  // Apply rate limit headers to response
  rateLimitResult.setHeaders(response)
  return response
})

/**
 * POST /api/todos
 * Create a new todo
 * Ordering: requireApiKey(scope) → requireRateLimit() → handler
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  validateMethod(request, ['POST'])

  // Require write permission first
  const auth = await requireApiKey('write:todos')
  if (auth instanceof NextResponse) return auth

  // Apply stricter rate limiting for write operations
  const rateLimitResult = await requireRateLimit(request, { limiter: 'strict' })
  if (rateLimitResult.type === 'blocked') return rateLimitResult.response

  // Extract request context for logging
  const _context = extractRequestContext(request)

  // Validate request body
  const { body } = await validateRequest<{
    title: string
    completed?: boolean
  }>(request, { body: TodoCreateSchema })

  const todo = await todosRepo.create(body!)

  // Validate output against domain schema
  const validated = TodosListSchema.element.parse(todo)

  const response = createdResponse(validated)

  // Apply rate limit headers to response
  rateLimitResult.setHeaders(response)
  return response
})

/**
 * OPTIONS /api/todos
 * Handle preflight requests
 */
export function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-API-Key, X-Requested-With',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Expose-Headers':
        'X-Request-Id, RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset',
    },
  })
}
