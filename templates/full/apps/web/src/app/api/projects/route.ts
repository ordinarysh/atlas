/**
 * Example API route demonstrating the new @atlas/api-auth integration
 *
 * This route shows how to use the requireApiKey function to protect
 * API endpoints with scoped permissions.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { COMMON_SCOPES } from '@atlas/api-auth'
import {
  apiResponse,
  extractRequestContext,
  validateMethod,
  withErrorHandling,
} from '@/lib/api-utils'
import { logger } from '@/lib/logger'
import { getAuthContext, requireApiKey } from '@/server/auth'
import { requireRateLimit } from '@/server/rate-limit'

/**
 * Mock project data for demonstration
 * In a real application, this would come from your database
 */
const mockProjects = [
  {
    id: 'project-1',
    name: 'Atlas Boilerplate',
    description: 'Production-ready monorepo boilerplate',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-15T12:30:00.000Z',
  },
  {
    id: 'project-2',
    name: 'API Authentication Package',
    description: 'Provider-agnostic API authentication with Argon2',
    status: 'active',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-16T09:15:00.000Z',
  },
  {
    id: 'project-3',
    name: 'Rate Limiting Service',
    description: 'In-memory and Redis rate limiting with proper headers',
    status: 'maintenance',
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-10T14:45:00.000Z',
  },
]

/**
 * GET /api/projects
 * List all projects - requires read:projects scope
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  validateMethod(request, ['GET'])

  // Apply route-level rate limiting (standard limits for read operations)
  const rateLimitResult = await requireRateLimit(request, {
    limiter: 'standard',
  })
  if (rateLimitResult.type === 'blocked') return rateLimitResult.response

  // Require specific scope for this endpoint
  const auth = await requireApiKey(COMMON_SCOPES.READ_PROJECTS)
  if (auth instanceof NextResponse) return auth

  // Extract request context for logging
  const context = extractRequestContext(request)

  // Log the authenticated request
  logger.info('Projects list accessed', {
    apiKeyId: auth.id,
    scopes: auth.scopes,
    requestId: context.requestId ?? undefined,
    userAgent: context.userAgent ?? undefined,
  })

  // Apply simple filtering based on query parameters
  const url = new URL(request.url)
  const statusFilter = url.searchParams.get('status') ?? undefined

  let filteredProjects = mockProjects
  if (statusFilter) {
    filteredProjects = mockProjects.filter((p) => p.status === statusFilter)
  }

  const response = apiResponse({
    projects: filteredProjects,
    total: filteredProjects.length,
    filters: statusFilter ? { status: statusFilter } : {},
    meta: {
      apiVersion: '1.0',
      authenticated: true,
      apiKeyId: auth.id,
    },
  })

  // Apply rate limit headers to response
  rateLimitResult.setHeaders(response)
  return response
})

/**
 * POST /api/projects
 * Create a new project - requires write:projects scope
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  validateMethod(request, ['POST'])

  // Apply stricter rate limiting for write operations
  const rateLimitResult = await requireRateLimit(request, { limiter: 'strict' })
  if (rateLimitResult.type === 'blocked') return rateLimitResult.response

  // Require write scope for creating projects
  const auth = await requireApiKey(COMMON_SCOPES.WRITE_PROJECTS)
  if (auth instanceof NextResponse) return auth

  const context = extractRequestContext(request)

  // Parse request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_JSON',
          message: 'Invalid JSON in request body',
        },
      },
      { status: 400 }
    )
  }

  // Basic validation
  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Project name is required',
        },
      },
      { status: 400 }
    )
  }

  // Create new project (mock implementation)
  const newProject = {
    id: `project-${Date.now()}`,
    name: body.name.trim(),
    description: body.description?.trim() ?? '',
    status: body.status ?? 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Log project creation
  logger.info('Project created', {
    projectId: newProject.id,
    projectName: newProject.name,
    apiKeyId: auth.id,
    scopes: auth.scopes,
    requestId: context.requestId ?? undefined,
    userAgent: context.userAgent ?? undefined,
  })

  const response = apiResponse(newProject, 201)

  // Apply rate limit headers to response
  rateLimitResult.setHeaders(response)
  return response
})

/**
 * PUT /api/projects
 * Bulk update projects - requires admin scope
 */
export const PUT = withErrorHandling(async (request: NextRequest) => {
  validateMethod(request, ['PUT'])

  // Apply admin rate limiting for bulk operations
  const rateLimitResult = await requireRateLimit(request, { limiter: 'admin' })
  if (rateLimitResult.type === 'blocked') return rateLimitResult.response

  // Require admin scope for bulk operations
  const auth = await requireApiKey(COMMON_SCOPES.ADMIN)
  if (auth instanceof NextResponse) return auth

  const context = extractRequestContext(request)

  // Log admin action
  logger.warn('Admin bulk update attempted', {
    apiKeyId: auth.id,
    scopes: auth.scopes,
    requestId: context.requestId ?? undefined,
    userAgent: context.userAgent ?? undefined,
    action: 'bulk_project_update',
  })

  const response = apiResponse({
    message: 'Bulk update functionality not implemented in this demo',
    note: 'This endpoint demonstrates admin-only access',
    authenticatedAs: auth.id,
    availableScopes: auth.scopes,
  })

  // Apply rate limit headers to response
  rateLimitResult.setHeaders(response)
  return response
})

/**
 * PATCH /api/projects
 * Conditional access - different behavior based on available scopes
 */
export const PATCH = withErrorHandling(async (request: NextRequest) => {
  validateMethod(request, ['PATCH'])

  // Apply standard rate limiting
  const rateLimitResult = await requireRateLimit(request, {
    limiter: 'standard',
  })
  if (rateLimitResult.type === 'blocked') return rateLimitResult.response

  // Get auth context without requiring specific scope
  const auth = await getAuthContext()

  if (!auth) {
    return NextResponse.json(
      {
        error: { code: 'AUTHENTICATION_REQUIRED', message: 'API key required' },
      },
      { status: 401 }
    )
  }

  const context = extractRequestContext(request)

  // Different responses based on available scopes
  const hasReadProjects = auth.scopes.includes(COMMON_SCOPES.READ_PROJECTS)
  const hasWriteProjects = auth.scopes.includes(COMMON_SCOPES.WRITE_PROJECTS)
  const hasAdmin = auth.scopes.includes(COMMON_SCOPES.ADMIN)

  logger.info('Conditional access endpoint', {
    apiKeyId: auth.id,
    scopes: auth.scopes,
    capabilities: { hasReadProjects, hasWriteProjects, hasAdmin },
    requestId: context.requestId ?? undefined,
    userAgent: context.userAgent ?? undefined,
  })

  const response = apiResponse({
    message: 'Access granted with conditional capabilities',
    apiKeyId: auth.id,
    scopes: auth.scopes,
    capabilities: {
      canReadProjects: hasReadProjects,
      canWriteProjects: hasWriteProjects,
      isAdmin: hasAdmin,
    },
    availableActions: [
      ...(hasReadProjects ? ['list_projects', 'get_project_details'] : []),
      ...(hasWriteProjects ? ['create_project', 'update_project'] : []),
      ...(hasAdmin ? ['delete_project', 'bulk_operations'] : []),
    ],
  })

  // Apply rate limit headers to response
  rateLimitResult.setHeaders(response)
  return response
})

/**
 * DELETE /api/projects
 * Demonstrates rate limit integration with auth context
 */
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  validateMethod(request, ['DELETE'])

  // Apply admin rate limiting for destructive operations
  const rateLimitResult = await requireRateLimit(request, { limiter: 'admin' })
  if (rateLimitResult.type === 'blocked') return rateLimitResult.response

  // This endpoint uses rate limiting that keys by API key ID
  // The rate limiter will use the auth context from headers
  const auth = await requireApiKey(COMMON_SCOPES.ADMIN)
  if (auth instanceof NextResponse) return auth

  const context = extractRequestContext(request)

  logger.warn('Project deletion attempted', {
    apiKeyId: auth.id,
    scopes: auth.scopes,
    requestId: context.requestId ?? undefined,
    userAgent: context.userAgent ?? undefined,
    note: 'Rate limited by API key ID',
  })

  const response = apiResponse({
    message: 'Project deletion not implemented in this demo',
    note: 'This request was rate limited by your API key ID, not IP address',
    rateLimitKey: `api_key:${auth.id}`,
  })

  // Apply rate limit headers to response
  rateLimitResult.setHeaders(response)
  return response
})

/**
 * OPTIONS /api/projects
 * Handle preflight requests
 */
export function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  })
}
