import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from '../projects/route'

// Mock the rate limiter to control behavior
vi.mock('@atlas/services-rate-limit', () => {
  const mockRateLimiter = {
    check: vi.fn(),
    setErrorHandler: vi.fn(),
  }

  return {
    createRateLimiter: vi.fn(() => mockRateLimiter),
    createMemoryStore: vi.fn(() => ({})),
    __getMockRateLimiter: () => mockRateLimiter, // Helper to access mock
  }
})

// Mock config with predictable values
vi.mock('@atlas/config-rate-limit', () => ({
  createRateLimitPresets: vi.fn(() => ({
    standard: { max: 3, windowMs: 60_000, prefix: 'test-std' },
    strict: { max: 1, windowMs: 60_000, prefix: 'test-strict' },
    auth: { max: 5, windowMs: 15 * 60 * 1000, prefix: 'test-auth' },
    upload: { max: 10, windowMs: 60 * 1000, prefix: 'test-upload' },
    admin: { max: 2, windowMs: 60_000, prefix: 'test-admin' },
  })),
  getRateLimitConfig: vi.fn(() => ({
    max: 3,
    windowMs: 60_000,
    prefix: 'test',
    provider: 'memory',
    trustProxy: false,
  })),
}))

// Mock auth to control authentication
vi.mock('@/server/auth', () => ({
  requireApiKey: vi.fn().mockResolvedValue({
    id: 'test-key-123',
    name: 'Test Key',
    scopes: ['read:projects'],
  }),
  getAuthContext: vi.fn().mockResolvedValue({
    id: 'test-key-123',
    scopes: ['read:projects'],
  }),
}))

// Mock other dependencies
vi.mock('@/lib/api-utils', () => ({
  validateMethod: vi.fn(),
  extractRequestContext: vi.fn(() => ({ requestId: 'test-req-123' })),
  withErrorHandling: vi.fn((handler) => handler),
  apiResponse: vi.fn(
    (data, status = 200) => new Response(JSON.stringify(data), { status })
  ),
  API_ERROR_CODES: {
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Projects API Rate Limiting Integration', () => {
  let mockRateLimiter: any

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))

    // Get access to the mock through the helper
    const rateLimitModule = await import('@atlas/services-rate-limit') as {
      createRateLimiter: any
      createMemoryStore: any
      __getMockRateLimiter: () => typeof mockRateLimiter
    }
    mockRateLimiter = rateLimitModule.__getMockRateLimiter()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('GET /api/projects rate limiting', () => {
    it('should allow requests under limit and set correct headers', async () => {
      // Mock rate limiter to allow request
      mockRateLimiter.check.mockResolvedValue({
        allowed: true,
        remaining: 2,
        resetAt: Date.now() + 60_000,
        limit: 3,
        count: 1,
      })

      const request = new NextRequest('https://example.com/api/projects', {
        headers: {
          'x-forwarded-for': '192.168.1.100',
        },
      })

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-RateLimit-Limit')).toBe('3')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('2')
      expect(response.headers.get('X-RateLimit-Reset')).toBe(
        Math.ceil((Date.now() + 60_000) / 1000).toString()
      )
      expect(response.headers.get('Retry-After')).toBeNull()

      // Verify rate limiter was called with IP-based key
      expect(mockRateLimiter.check).toHaveBeenCalledWith('ip:192.168.1.100')
    })

    it('should block requests over limit and return 429 with correct headers', async () => {
      // Mock rate limiter to block request
      mockRateLimiter.check.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 30_000,
        limit: 3,
        count: 4,
      })

      const request = new NextRequest('https://example.com/api/projects', {
        headers: {
          'x-forwarded-for': '192.168.1.100',
        },
      })

      const response = await GET(request)

      expect(response.status).toBe(429)
      expect(response.headers.get('X-RateLimit-Limit')).toBe('3')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(response.headers.get('X-RateLimit-Reset')).toBe(
        Math.ceil((Date.now() + 30_000) / 1000).toString()
      )
      expect(response.headers.get('Retry-After')).toBe('30')
      expect(response.headers.get('Content-Type')).toBe(
        'application/json; charset=utf-8'
      )
      expect(response.headers.get('Cache-Control')).toBe('no-store')

      const body = await response.json()
      expect(body).toEqual({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too Many Requests - rate limit exceeded',
        },
      })
    })

    it('should use API key for rate limiting when authenticated', async () => {
      // Mock rate limiter to allow request
      mockRateLimiter.check.mockResolvedValue({
        allowed: true,
        remaining: 99,
        resetAt: Date.now() + 60_000,
        limit: 100,
        count: 1,
      })

      const request = new NextRequest('https://example.com/api/projects', {
        headers: {
          'x-auth-context': JSON.stringify({
            apiKey: { id: 'api-key-456', permissions: ['read'] },
          }),
          'x-forwarded-for': '192.168.1.100',
        },
      })

      const response = await GET(request)

      expect(response.status).toBe(200)

      // Verify rate limiter was called with API key-based key
      expect(mockRateLimiter.check).toHaveBeenCalledWith('key:api-key-456')
    })

    it('should calculate Retry-After as minimum 1 second', async () => {
      // Mock rate limiter to block with very short remaining time
      mockRateLimiter.check.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 500, // 500ms remaining
        limit: 3,
        count: 4,
      })

      const request = new NextRequest('https://example.com/api/projects')

      const response = await GET(request)

      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('1')
    })
  })

  describe('POST /api/projects rate limiting', () => {
    it('should use strict limiter for write operations', async () => {
      // Mock rate limiter to allow request
      mockRateLimiter.check.mockResolvedValue({
        allowed: true,
        remaining: 0,
        resetAt: Date.now() + 60_000,
        limit: 1,
        count: 1,
      })

      const request = new NextRequest('https://example.com/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Project' }),
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.100',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(response.headers.get('X-RateLimit-Limit')).toBe('1')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')

      // Verify rate limiter was called (strict limiter has limit of 1 in our mock)
      expect(mockRateLimiter.check).toHaveBeenCalled()
    })
  })

  describe('Header rounding and math correctness', () => {
    it('should round X-RateLimit-Reset to ceiling unix seconds', async () => {
      const resetTime = Date.now() + 45_500 // 45.5 seconds from now

      mockRateLimiter.check.mockResolvedValue({
        allowed: true,
        remaining: 1,
        resetAt: resetTime,
        limit: 3,
        count: 2,
      })

      const request = new NextRequest('https://example.com/api/projects')

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-RateLimit-Reset')).toBe(
        Math.ceil(resetTime / 1000).toString()
      )
    })

    it('should calculate Retry-After correctly on 429', async () => {
      const resetTime = Date.now() + 45_500 // 45.5 seconds from now

      mockRateLimiter.check.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: resetTime,
        limit: 3,
        count: 4,
      })

      const request = new NextRequest('https://example.com/api/projects')

      const response = await GET(request)

      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('46') // Ceil of 45.5
    })
  })
})
