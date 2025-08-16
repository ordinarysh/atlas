import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE as deleteTodo, PATCH as updateTodo } from '../todos/[id]/route'
import { POST as createTodo, GET as getTodos } from '../todos/route'

// Mock auth module
vi.mock('@/server/auth', () => ({
  requireApiKey: vi.fn(),
}))

// Mock rate limit module
vi.mock('@/server/rate-limit', () => ({
  requireRateLimit: vi.fn(),
}))

// Mock api utils module for requirePermission
vi.mock('@/lib/api-utils', async () => {
  const actual = await vi.importActual('@/lib/api-utils')
  return {
    ...actual,
    requirePermission: vi.fn(),
  }
})

// Mock todos domain module
vi.mock('@atlas/todos-domain', async () => {
  const z = await import('zod')
  return {
    TodoCreateSchema: z.object({
      title: z.string().min(1, 'Title is required'),
      completed: z.boolean().optional(),
    }),
    TodoUpdateSchema: z
      .object({
        title: z.string().min(1).optional(),
        completed: z.boolean().optional(),
      })
      .refine((data: any) => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update',
      }),
    TodoSchema: z.object({
      id: z.string(),
      title: z.string(),
      completed: z.boolean(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
    TodosListSchema: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        completed: z.boolean(),
        createdAt: z.string(),
        updatedAt: z.string(),
      })
    ),
    seedTodos: [
      {
        id: 'todo-1',
        title: 'Set up domain-driven architecture',
        completed: true,
        createdAt: '2025-01-13T10:00:00.000Z',
        updatedAt: '2025-01-13T10:30:00.000Z',
      },
      {
        id: 'todo-2',
        title: 'Implement React Query hooks',
        completed: false,
        createdAt: '2025-01-13T11:00:00.000Z',
        updatedAt: '2025-01-13T11:00:00.000Z',
      },
      {
        id: 'todo-3',
        title: 'Add comprehensive error handling',
        completed: false,
        createdAt: '2025-01-13T12:00:00.000Z',
        updatedAt: '2025-01-13T12:00:00.000Z',
      },
    ],
  }
})

// Mock todos repository
vi.mock('../../../../../../../services/repository/todos-repo', () => {
  const mockTodos = [
    {
      id: 'todo-1',
      title: 'Set up domain-driven architecture',
      completed: true,
      createdAt: '2025-01-13T10:00:00.000Z',
      updatedAt: '2025-01-13T10:30:00.000Z',
    },
    {
      id: 'todo-2',
      title: 'Implement React Query hooks',
      completed: false,
      createdAt: '2025-01-13T11:00:00.000Z',
      updatedAt: '2025-01-13T11:00:00.000Z',
    },
    {
      id: 'todo-3',
      title: 'Add comprehensive error handling',
      completed: false,
      createdAt: '2025-01-13T12:00:00.000Z',
      updatedAt: '2025-01-13T12:00:00.000Z',
    },
  ]

  return {
    todosRepo: {
      list: vi.fn().mockResolvedValue([...mockTodos]),
      get: vi.fn().mockImplementation((id: string) => {
        const todo = mockTodos.find((t) => t.id === id)
        return Promise.resolve(todo ?? null)
      }),
      create: vi.fn().mockImplementation((input: any) => {
        const now = new Date().toISOString()
        const todo = {
          id: 'new-todo-' + Date.now(),
          title: input.title,
          completed: input.completed ?? false,
          createdAt: now,
          updatedAt: now,
        }
        mockTodos.push(todo)
        return Promise.resolve(todo)
      }),
      update: vi.fn().mockImplementation((id: string, patch: any) => {
        const todoIndex = mockTodos.findIndex((t) => t.id === id)
        if (todoIndex === -1) return Promise.resolve(null)

        const updated = {
          ...mockTodos[todoIndex],
          ...patch,
          updatedAt: new Date().toISOString(),
        }
        mockTodos[todoIndex] = updated
        return Promise.resolve(updated)
      }),
      delete: vi.fn().mockImplementation((id: string) => {
        const todoIndex = mockTodos.findIndex((t) => t.id === id)
        if (todoIndex === -1) return Promise.resolve(false)

        mockTodos.splice(todoIndex, 1)
        return Promise.resolve(true)
      }),
    },
  }
})

/**
 * Mock NextRequest for testing
 */
function createMockRequest(
  url = 'http://localhost:3000/api/todos',
  method = 'GET',
  body?: any,
  headers: Record<string, string> = {}
): NextRequest {
  const reqInit: ConstructorParameters<typeof NextRequest>[1] = {
    method,
    headers: new Headers({
      'Content-Type': 'application/json',
      ...headers,
    }),
  }

  if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    reqInit.body = JSON.stringify(body)
  }

  return new NextRequest(url, reqInit)
}

/**
 * Mock route params for dynamic routes
 */
function createMockRouteProps(id: string) {
  return {
    params: Promise.resolve({ id }),
  }
}

describe('/api/todos', () => {
  beforeEach(async () => {
    vi.clearAllMocks()

    // Mock successful authentication
    const { requireApiKey } = await import('@/server/auth')
    vi.mocked(requireApiKey).mockResolvedValue({
      id: 'test-key',
      scopes: ['read:todos', 'write:todos'],
    })

    // Mock successful rate limiting
    const { requireRateLimit } = await import('@/server/rate-limit')
    vi.mocked(requireRateLimit).mockResolvedValue({
      type: 'allowed',
      setHeaders: vi.fn(),
    })

    // Mock successful permission check
    const { requirePermission } = await import('@/lib/api-utils')
    vi.mocked(requirePermission).mockResolvedValue(undefined)
  })
  describe('GET /api/todos', () => {
    it('should return list of todos', async () => {
      const request = createMockRequest()
      const response = await getTodos(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('data')
      expect(data.data).toHaveProperty('pagination')
      expect(Array.isArray(data.data.data)).toBe(true)
      expect(response.headers.get('Content-Type')).toBe(
        'application/json; charset=utf-8'
      )
    })

    it('should include proper cache headers', async () => {
      const request = createMockRequest()
      const response = await getTodos(request)

      expect(response.headers.get('Cache-Control')).toContain('no-store')
    })
  })

  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const newTodo = {
        title: 'Test Todo',
        completed: false,
      }

      const request = createMockRequest(
        'http://localhost:3000/api/todos',
        'POST',
        newTodo
      )
      const response = await createTodo(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toHaveProperty('data')
      expect(data.data).toMatchObject({
        title: 'Test Todo',
        completed: false,
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    })

    it('should create todo with default completed value', async () => {
      const newTodo = {
        title: 'Test Todo',
      }

      const request = createMockRequest(
        'http://localhost:3000/api/todos',
        'POST',
        newTodo
      )
      const response = await createTodo(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.completed).toBe(false)
    })

    it('should return validation error for empty title', async () => {
      const invalidTodo = {
        title: '',
      }

      const request = createMockRequest(
        'http://localhost:3000/api/todos',
        'POST',
        invalidTodo
      )
      const response = await createTodo(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toContain('Title is required')
    })

    it('should return validation error for missing title', async () => {
      const invalidTodo = {}

      const request = createMockRequest(
        'http://localhost:3000/api/todos',
        'POST',
        invalidTodo
      )
      const response = await createTodo(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })
  })
})

describe('/api/todos/[id]', () => {
  beforeEach(async () => {
    vi.clearAllMocks()

    // Mock successful authentication
    const { requireApiKey } = await import('@/server/auth')
    vi.mocked(requireApiKey).mockResolvedValue({
      id: 'test-key',
      scopes: ['read:todos', 'write:todos', 'delete:todos'],
    })

    // Mock successful rate limiting
    const { requireRateLimit } = await import('@/server/rate-limit')
    vi.mocked(requireRateLimit).mockResolvedValue({
      type: 'allowed',
      setHeaders: vi.fn(),
    })

    // Mock successful permission check
    const { requirePermission } = await import('@/lib/api-utils')
    vi.mocked(requirePermission).mockResolvedValue(undefined)
  })
  describe('PATCH /api/todos/[id]', () => {
    it('should update existing todo', async () => {
      // First create a todo to update
      const newTodo = { title: 'Original Todo' }
      const createRequest = createMockRequest(
        'http://localhost:3000/api/todos',
        'POST',
        newTodo
      )
      const createResponse = await createTodo(createRequest)
      const createData = await createResponse.json()
      const todoId = createData.data.id

      // Now update it
      const updateData = {
        title: 'Updated Todo',
        completed: true,
      }

      const request = createMockRequest(
        `http://localhost:3000/api/todos/${todoId}`,
        'PATCH',
        updateData
      )
      const response = await updateTodo(request, createMockRouteProps(todoId))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toMatchObject({
        id: todoId,
        title: 'Updated Todo',
        completed: true,
      })
    })

    it('should return 404 for non-existent todo', async () => {
      const updateData = { title: 'Updated Todo' }
      const request = createMockRequest(
        'http://localhost:3000/api/todos/non-existent',
        'PATCH',
        updateData
      )
      const response = await updateTodo(
        request,
        createMockRouteProps('non-existent')
      )
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toContain('not found')
    })

    it('should return validation error for invalid update data', async () => {
      const invalidData = { title: '' } // Empty title is invalid
      const request = createMockRequest(
        'http://localhost:3000/api/todos/some-id',
        'PATCH',
        invalidData
      )
      const response = await updateTodo(
        request,
        createMockRouteProps('some-id')
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('DELETE /api/todos/[id]', () => {
    it('should delete existing todo', async () => {
      // First create a todo to delete
      const newTodo = { title: 'Todo to Delete' }
      const createRequest = createMockRequest(
        'http://localhost:3000/api/todos',
        'POST',
        newTodo
      )
      const createResponse = await createTodo(createRequest)
      const createData = await createResponse.json()
      const todoId = createData.data.id

      // Now delete it
      const request = createMockRequest(
        `http://localhost:3000/api/todos/${todoId}`,
        'DELETE'
      )
      const response = await deleteTodo(request, createMockRouteProps(todoId))

      expect(response.status).toBe(204)
      const cacheControl = response.headers.get('Cache-Control')
      if (cacheControl) {
        expect(cacheControl).toContain('no-store')
      }

      // Verify it's deleted by trying to update it
      const updateRequest = createMockRequest(
        `http://localhost:3000/api/todos/${todoId}`,
        'PATCH',
        { title: 'Should not work' }
      )
      const updateResponse = await updateTodo(
        updateRequest,
        createMockRouteProps(todoId)
      )
      expect(updateResponse.status).toBe(404)
    })

    it('should return 404 for non-existent todo', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/todos/non-existent',
        'DELETE'
      )
      const response = await deleteTodo(
        request,
        createMockRouteProps('non-existent')
      )
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toContain('not found')
    })
  })
})
