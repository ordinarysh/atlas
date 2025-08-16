import type { NextRequest } from 'next/server'
import { TodoSchema, TodoUpdateSchema } from '@atlas/todos-domain'
import { z, type ZodTypeAny } from 'zod'
import {
  ApiError,
  extractRequestContext,
  noContentResponse,
  requirePermission,
  successResponse,
  validateMethod,
  validateRequest,
  withErrorHandling,
} from '@/lib/api-utils'
import { API_PERMISSIONS } from '@/lib/auth/api-keys'
import { registerRouteDoc } from '@/lib/openapi'
import { todosRepo } from '../../../../../../../services/repository/todos-repo'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Schema for validating route parameters
const ParamsSchema = z.object({
  id: z.string().min(1),
})

// Register route documentation
registerRouteDoc('/api/todos/{id}', 'PATCH', {
  summary: 'Update a todo',
  description:
    'Update a specific todo by ID. Can update title and/or completion status. Requires write permission.',
  tags: ['Todos'],
  security: true,
  paramsSchema: ParamsSchema as unknown as ZodTypeAny,
  bodySchema: TodoUpdateSchema as unknown as ZodTypeAny,
  responseSchema: TodoSchema as unknown as ZodTypeAny,
  examples: {
    request: {
      title: 'Updated todo title',
      completed: true,
    },
    response: {
      id: '1',
      title: 'Updated todo title',
      completed: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T12:00:00.000Z',
    },
  },
})

registerRouteDoc('/api/todos/{id}', 'DELETE', {
  summary: 'Delete a todo',
  description:
    'Delete a specific todo by ID. Returns 204 No Content on success. Requires delete permission.',
  tags: ['Todos'],
  security: true,
  paramsSchema: ParamsSchema as ZodTypeAny,
  examples: {
    response: null,
  },
})

/**
 * PATCH /api/todos/[id]
 * Update a todo (toggle or edit)
 */
export const PATCH = withErrorHandling(
  async (request: NextRequest, props: RouteParams) => {
    validateMethod(request, ['PATCH'])

    // Require write permission
    await requirePermission(request, API_PERMISSIONS.WRITE)

    // Extract request context for logging
    const _context = extractRequestContext(request)

    const routeParams = await props.params

    // Validate request body and route parameters
    const { body, params } = await validateRequest<
      { title?: string; completed?: boolean },
      never,
      { id: string }
    >(
      request,
      {
        body: TodoUpdateSchema,
        params: ParamsSchema,
      },
      routeParams
    )

    const updated = await todosRepo.update(params!.id, body!)

    if (!updated) {
      throw ApiError.notFound(`Todo with ID '${params!.id}' not found`)
    }

    // Validate output against domain schema
    const validated = TodoSchema.parse(updated)

    return successResponse(validated)
  }
)

/**
 * DELETE /api/todos/[id]
 * Delete a todo
 */
export const DELETE = withErrorHandling(
  async (request: NextRequest, props: RouteParams) => {
    validateMethod(request, ['DELETE'])

    // Require delete permission
    await requirePermission(request, API_PERMISSIONS.DELETE)

    // Extract request context for logging
    const _context = extractRequestContext(request)

    const routeParams = await props.params

    // Validate route parameters
    const { params } = await validateRequest<never, never, { id: string }>(
      request,
      { params: ParamsSchema },
      routeParams
    )

    const deleted = await todosRepo.delete(params!.id)

    if (!deleted) {
      throw ApiError.notFound(`Todo with ID '${params!.id}' not found`)
    }

    // Return 204 No Content for successful deletion
    return noContentResponse()
  }
)

/**
 * OPTIONS /api/todos/[id]
 * Handle preflight requests
 */
export function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-API-Key, X-Requested-With',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Expose-Headers':
        'X-Request-Id, RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset',
    },
  })
}
