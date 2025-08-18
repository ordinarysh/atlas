import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'
import { GET } from '../auth/me/route'

// Mock auth to control authentication
vi.mock('@/server/auth', () => ({
  requireApiKey: vi.fn().mockResolvedValue({
    id: 'test-key-123',
    scopes: ['read:projects', 'write:projects'],
    active: true,
    metadata: {
      name: 'Test Key',
      description: 'Test API key for integration tests',
    },
  }),
}))

// Mock rate limiter
vi.mock('@/server/rate-limit', () => ({
  requireRateLimit: vi.fn().mockResolvedValue({
    type: 'allowed',
    setHeaders: vi.fn(),
  }),
}))

/**
 * Mock NextRequest for testing
 */
function createMockRequest(
  url = 'http://localhost:3000/api/auth/me',
  method = 'GET',
  headers: Record<string, string> = {}
): NextRequest {
  const reqInit: ConstructorParameters<typeof NextRequest>[1] = {
    method,
    headers: new Headers({
      Authorization: 'Bearer test_abcdefghijklmnopqrstuvwxyz1234567890ABCDEFG',
      ...headers,
    }),
  }
  return new NextRequest(url, reqInit)
}

describe('/api/auth/me', () => {
  it('should return authenticated user information', async () => {
    const request = createMockRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('data')
    expect(data.data).toMatchObject({
      apiKeyId: 'test-key-123',
      scopes: ['read:projects', 'write:projects'],
      isActive: true,
      metadata: {
        name: 'Test Key',
        description: 'Test API key for integration tests',
      },
    })
  })

  it('should include proper headers', async () => {
    const request = createMockRequest()
    const response = await GET(request)

    expect(response.headers.get('Content-Type')).toBe(
      'application/json; charset=utf-8'
    )
    expect(response.headers.get('Cache-Control')).toBe(
      'no-cache, no-store, must-revalidate'
    )
  })

  it('should validate response structure', async () => {
    const request = createMockRequest()
    const response = await GET(request)
    const data = await response.json()

    // Validate required fields
    expect(data.data.apiKeyId).toBeDefined()
    expect(Array.isArray(data.data.scopes)).toBe(true)
    expect(typeof data.data.isActive).toBe('boolean')
  })
})
