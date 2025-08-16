import { NextRequest, NextResponse } from 'next/server'
import { describe, expect, it } from 'vitest'
import { z, type ZodError } from 'zod'
import {
  API_ERROR_CODES,
  ApiError,
  apiErrorResponse,
  apiResponse,
  handleZodError,
  validateMethod,
  validateRequest,
  withErrorHandling,
} from '@/lib/api-utils'

function createMockRequest(
  url = 'http://localhost:3000/api/test',
  method = 'POST',
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

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    reqInit.body = JSON.stringify(body)
  }

  // Create a proper NextRequest
  return new NextRequest(url, reqInit)
}

describe('ApiError', () => {
  it('should create error with correct properties', () => {
    const error = new ApiError(
      API_ERROR_CODES.VALIDATION_ERROR,
      'Test message',
      400,
      {
        test: true,
      }
    )

    expect(error.code).toBe(API_ERROR_CODES.VALIDATION_ERROR)
    expect(error.message).toBe('Test message')
    expect(error.status).toBe(400)
    expect(error.details).toEqual({ test: true })
    expect(error.name).toBe('ApiError')
  })

  it('should create bad request error', () => {
    const error = ApiError.badRequest('Invalid input')

    expect(error.code).toBe(API_ERROR_CODES.BAD_REQUEST)
    expect(error.message).toBe('Invalid input')
    expect(error.status).toBe(400)
  })

  it('should create not found error', () => {
    const error = ApiError.notFound('Resource not found')

    expect(error.code).toBe(API_ERROR_CODES.NOT_FOUND)
    expect(error.message).toBe('Resource not found')
    expect(error.status).toBe(404)
  })

  it('should create validation error', () => {
    const error = ApiError.validation('Invalid data', { field: 'title' })

    expect(error.code).toBe(API_ERROR_CODES.VALIDATION_ERROR)
    expect(error.message).toBe('Invalid data')
    expect(error.status).toBe(400)
    expect(error.details).toEqual({ field: 'title' })
  })
})

describe('apiResponse', () => {
  it('should create successful response', () => {
    const data = { test: 'data' }
    const response = apiResponse(data, 201)

    expect(response.status).toBe(201)
    expect(response.headers.get('Content-Type')).toBe(
      'application/json; charset=utf-8'
    )
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('should include custom headers', () => {
    const data = { test: 'data' }
    const response = apiResponse(data, 200, { 'X-Custom': 'value' })

    expect(response.headers.get('X-Custom')).toBe('value')
    expect(response.headers.get('Content-Type')).toBe(
      'application/json; charset=utf-8'
    )
  })
})

describe('apiErrorResponse', () => {
  it('should create error response', () => {
    const error = ApiError.badRequest('Test error')
    const response = apiErrorResponse(error)

    expect(response.status).toBe(400)
    expect(response.headers.get('Content-Type')).toBe(
      'application/json; charset=utf-8'
    )
  })
})

describe('handleZodError', () => {
  it('should convert Zod error to ApiError', () => {
    const schema = z.object({
      name: z.string().min(1),
    })

    try {
      schema.parse({ name: '' })
    } catch (zodError) {
      const apiError = handleZodError(zodError as ZodError)

      expect(apiError).toBeInstanceOf(ApiError)
      expect(apiError.code).toBe(API_ERROR_CODES.VALIDATION_ERROR)
      expect(apiError.status).toBe(400)
      expect(apiError.message).toContain(
        'Too small: expected string to have >=1 character'
      )
    }
  })
})

describe('validateRequest', () => {
  it('should validate request body successfully', async () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    })

    const request = createMockRequest(
      'http://localhost:3000/api/test',
      'POST',
      { name: 'John', age: 30 }
    )

    const result = await validateRequest(request, { body: schema })

    expect(result.body).toEqual({ name: 'John', age: 30 })
  })

  it('should validate query parameters successfully', async () => {
    const schema = z.object({
      page: z.string().transform(Number),
      limit: z.string().transform(Number),
    })

    const request = createMockRequest(
      'http://localhost:3000/api/test?page=1&limit=10',
      'GET'
    )

    const result = await validateRequest(request, { query: schema })

    expect(result.query).toEqual({ page: 1, limit: 10 })
  })

  it('should throw validation error for invalid body', async () => {
    const schema = z.object({
      name: z.string().min(1),
    })

    const request = createMockRequest(
      'http://localhost:3000/api/test',
      'POST',
      { name: '' }
    )

    await expect(validateRequest(request, { body: schema })).rejects.toThrow(
      ApiError
    )
  })

  it('should throw error for invalid JSON', async () => {
    const request = createMockRequest('http://localhost:3000/api/test', 'POST')
    // Override body to have invalid JSON
    Object.defineProperty(request, 'json', {
      value: () => Promise.reject(new SyntaxError('Invalid JSON')),
      writable: false,
    })

    const schema = z.object({ test: z.string() })

    await expect(validateRequest(request, { body: schema })).rejects.toThrow(
      ApiError
    )
  })
})

describe('validateMethod', () => {
  it('should pass for allowed method', () => {
    const request = createMockRequest('http://localhost:3000/api/test', 'GET')

    expect(() => validateMethod(request, ['GET', 'POST'])).not.toThrow()
  })

  it('should throw for disallowed method', () => {
    const request = createMockRequest(
      'http://localhost:3000/api/test',
      'DELETE'
    )

    expect(() => validateMethod(request, ['GET', 'POST'])).toThrow(ApiError)
  })
})

describe('withErrorHandling', () => {
  it('should handle successful execution', async () => {
    const handler = withErrorHandling(async () => {
      return Promise.resolve(new NextResponse('success'))
    })

    const result = await handler()
    expect(result).toBeInstanceOf(NextResponse)
  })

  it('should handle ApiError', async () => {
    const handler = withErrorHandling(async () => {
      return Promise.reject(ApiError.notFound('Resource not found'))
    })

    const result = await handler()
    expect(result.status).toBe(404)

    const data = await result.json()
    expect(data.error.code).toBe(API_ERROR_CODES.NOT_FOUND)
    expect(data.error.message).toBe('Resource not found')
  })

  it('should handle unknown errors', async () => {
    const handler = withErrorHandling(async () => {
      return Promise.reject(new Error('Unknown error'))
    })

    const result = await handler()
    expect(result.status).toBe(500)

    const data = await result.json()
    expect(data.error.code).toBe(API_ERROR_CODES.INTERNAL_ERROR)
  })
})
