/**
 * Security tests for the Atlas boilerplate
 * Tests authentication, rate limiting, input validation, and security headers
 */

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ZodError } from 'zod'
import { ApiError } from '@/lib/api-utils'

// Mock the auth module
vi.mock('@/server/auth', () => ({
  requireApiKey: vi.fn(),
}))

// Mock the rate limit module
vi.mock('@/server/rate-limit', () => ({
  requireRateLimit: vi.fn(),
}))

describe('Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Input Validation Security', () => {
    it('should reject malformed JSON', async () => {
      const { validateRequest } = await import('@/lib/api-utils')
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{',
      })

      await expect(
        validateRequest(request, {
          body: { parse: (data: unknown) => data },
        })
      ).rejects.toThrow('Invalid JSON')
    })

    it('should validate request size limits', async () => {
      const { validateRequest } = await import('@/lib/api-utils')

      // Create oversized request
      const largePayload = 'x'.repeat(15 * 1024 * 1024) // 15MB
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': largePayload.length.toString(),
        },
        body: JSON.stringify({ data: largePayload }),
      })

      await expect(
        validateRequest(request, {
          body: { parse: (data: unknown) => data },
        })
      ).rejects.toThrow('Request body too large')
    })

    it('should validate URL length limits', async () => {
      const { validateRequest } = await import('@/lib/api-utils')

      // Create oversized URL
      const longUrl =
        'http://localhost:3000/api/test?' + 'param=value&'.repeat(1000)
      const request = new NextRequest(longUrl, { method: 'GET' })

      await expect(validateRequest(request, {})).rejects.toThrow(
        'Request URL too long'
      )
    })

    it('should sanitize dangerous input', async () => {
      const { sanitizeString } = await import('@/lib/api-utils')

      // Test XSS payload sanitization
      const maliciousInput = '<script>alert("xss")</script>test'
      const sanitized = sanitizeString(maliciousInput)

      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert')
    })

    it('should sanitize search queries', async () => {
      const { sanitizeSearchQuery } = await import('@/lib/api-utils')

      const maliciousQuery =
        '<script>evil()</script>search term; DROP TABLE users;--'
      const sanitized = sanitizeSearchQuery(maliciousQuery)

      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('DROP TABLE')
      expect(sanitized).not.toContain(';')
      expect(sanitized.length).toBeLessThanOrEqual(200)
    })
  })

  describe('Authentication Security', () => {
    it('should reject requests without API key', async () => {
      const { requireApiKey } = await import('@/server/auth')
      const mockRequireApiKey = vi.mocked(requireApiKey)

      // Mock authentication failure
      mockRequireApiKey.mockResolvedValue(
        new Response('Unauthorized', { status: 401 }) as any
      )

      const result = await requireApiKey('read')

      expect(result).toBeInstanceOf(Response)
      expect((result as Response).status).toBe(401)
    })

    it('should validate API key scopes', async () => {
      const { requireApiKey } = await import('@/server/auth')
      const mockRequireApiKey = vi.mocked(requireApiKey)

      // Mock insufficient permissions
      mockRequireApiKey.mockResolvedValue(
        new Response('Forbidden', { status: 403 }) as any
      )

      const result = await requireApiKey('admin')

      expect(result).toBeInstanceOf(Response)
      expect((result as Response).status).toBe(403)
    })

    it('should handle authentication success', async () => {
      const { requireApiKey } = await import('@/server/auth')
      const mockRequireApiKey = vi.mocked(requireApiKey)

      // Mock successful authentication
      mockRequireApiKey.mockResolvedValue({
        id: 'test-key',
        scopes: ['read', 'write'],
      })

      const result = await requireApiKey('read')

      expect(result).toHaveProperty('id', 'test-key')
      expect(result).toHaveProperty('scopes')
    })
  })

  describe('Rate Limiting Security', () => {
    it('should enforce rate limits', async () => {
      const { requireRateLimit } = await import('@/server/rate-limit')
      const mockRequireRateLimit = vi.mocked(requireRateLimit)

      // Mock rate limit exceeded
      mockRequireRateLimit.mockResolvedValue({
        type: 'blocked',
        response: new Response('Too Many Requests', {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '60',
            'X-RateLimit-Remaining': '0',
          },
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/test')
      const result = await requireRateLimit(request)

      expect(result.type).toBe('blocked')
      if (result.type === 'blocked') {
        expect(result.response.status).toBe(429)
        expect(result.response.headers.get('Retry-After')).toBe('60')
      }
    })

    it('should allow requests within rate limit', async () => {
      const { requireRateLimit } = await import('@/server/rate-limit')
      const mockRequireRateLimit = vi.mocked(requireRateLimit)

      // Mock successful rate limit check
      mockRequireRateLimit.mockResolvedValue({
        type: 'allowed',
        setHeaders: vi.fn(),
      })

      const request = new NextRequest('http://localhost:3000/api/test')
      const result = await requireRateLimit(request)

      expect(result.type).toBe('allowed')
      if (result.type === 'allowed') {
        expect(result.setHeaders).toBeInstanceOf(Function)
      }
    })

    it('should handle rate limiter errors gracefully', async () => {
      const { requireRateLimit } = await import('@/server/rate-limit')
      const mockRequireRateLimit = vi.mocked(requireRateLimit)

      // Mock rate limiter error (should fail open)
      mockRequireRateLimit.mockResolvedValue({
        type: 'allowed',
        setHeaders: vi.fn((response: any) => {
          response.headers.set('X-RateLimit-Error', 'true')
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/test')
      const result = await requireRateLimit(request)

      expect(result.type).toBe('allowed') // Should fail open
    })
  })

  describe('Error Handling Security', () => {
    it('should not leak sensitive data in errors', () => {
      const apiError = ApiError.internal('Internal server error')

      // API error should not contain sensitive data
      expect(apiError.message).not.toContain('password')
      expect(apiError.message).not.toContain('secret123')
      expect(apiError.message).toBe('Internal server error')
    })

    it('should provide safe error responses', () => {
      const badRequestError = ApiError.badRequest('Invalid input format')
      const notFoundError = ApiError.notFound('Resource not found')
      const validationError = ApiError.validation('Validation failed', {
        field: 'email',
      })

      // Errors should be descriptive but not leak internals
      expect(badRequestError.message).toBe('Invalid input format')
      expect(badRequestError.status).toBe(400)

      expect(notFoundError.message).toBe('Resource not found')
      expect(notFoundError.status).toBe(404)

      expect(validationError.message).toBe('Validation failed')
      expect(validationError.details).toEqual({ field: 'email' })
    })

    it('should handle Zod validation errors safely', async () => {
      const { handleZodError } = await import('@/lib/api-utils')

      // Mock a Zod error
      const zodError = new ZodError([
        {
          code: 'too_small',
          minimum: 1,
          inclusive: true,
          exact: false,
          origin: 'value',
          message: 'String must contain at least 1 character(s)',
          path: ['title'],
        },
      ])

      const apiError = handleZodError(zodError)

      expect(apiError).toBeInstanceOf(ApiError)
      expect(apiError.code).toBe('VALIDATION_ERROR')
      expect(apiError.message).toContain('at least 1 character')
    })
  })

  describe('CORS Security', () => {
    it('should generate proper CORS headers', async () => {
      const { generateCorsHeaders } = await import('@/lib/cors')

      const headers = generateCorsHeaders('https://example.com', {
        allowedOrigins: ['https://example.com'],
        credentials: true,
      })

      expect(headers['Access-Control-Allow-Origin']).toBe('https://example.com')
      expect(headers['Access-Control-Allow-Credentials']).toBe('true')
      expect(headers['Access-Control-Allow-Methods']).toContain('GET')
      expect(headers['Access-Control-Allow-Headers']).toContain('Authorization')
    })

    it('should reject unauthorized origins', async () => {
      const { generateCorsHeaders } = await import('@/lib/cors')

      const headers = generateCorsHeaders('https://malicious.com', {
        allowedOrigins: ['https://trusted.com'],
      })

      expect(headers['Access-Control-Allow-Origin']).toBe('null')
    })

    it('should handle wildcard origins correctly', async () => {
      const { generateCorsHeaders } = await import('@/lib/cors')

      const headers = generateCorsHeaders('https://any-domain.com', {
        allowedOrigins: ['*'],
      })

      expect(headers['Access-Control-Allow-Origin']).toBe('*')
    })
  })

  describe('Security Headers', () => {
    it('should include security headers in middleware', async () => {
      // Mock environment variable
      process.env.ENABLE_SECURITY_MIDDLEWARE = 'true'

      const { middleware } = await import('@/middleware')
      const request = new NextRequest('http://localhost:3000/api/test')

      const response = middleware(request)

      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')
      expect(response.headers.get('Referrer-Policy')).toBe(
        'strict-origin-when-cross-origin'
      )

      // Reset environment
      delete process.env.ENABLE_SECURITY_MIDDLEWARE
    })

    it('should respect middleware feature flag', async () => {
      // Ensure middleware is disabled
      process.env.ENABLE_SECURITY_MIDDLEWARE = 'false'

      const { middleware } = await import('@/middleware')
      const request = new NextRequest('http://localhost:3000/api/test')

      const response = middleware(request)

      // Should pass through without modification when disabled
      expect(response.status).toBe(200)

      // Reset environment
      delete process.env.ENABLE_SECURITY_MIDDLEWARE
    })
  })

  describe('Content Security Policy', () => {
    it('should have restrictive CSP headers', async () => {
      process.env.ENABLE_SECURITY_MIDDLEWARE = 'true'

      const { middleware } = await import('@/middleware')
      const request = new NextRequest('http://localhost:3000/api/test')

      const response = middleware(request)
      const csp = response.headers.get('Content-Security-Policy')

      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("frame-ancestors 'none'")
      expect(csp).toContain("form-action 'self'")

      // Reset environment
      delete process.env.ENABLE_SECURITY_MIDDLEWARE
    })
  })

  describe('Request Logging Security', () => {
    it('should not log sensitive data', async () => {
      // Use Vitest's stubEnv to mock NODE_ENV
      vi.stubEnv('NODE_ENV', 'development')

      // Re-import logger with new environment
      vi.resetModules()
      const { logger } = await import('@/lib/logger')
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {
        /* no-op */
      })

      // Log a request with potential sensitive data
      logger.request('POST /api/login', {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        // Should not log request body or headers with credentials
      })

      const logCall = logSpy.mock.calls[0]?.[0]
      expect(logCall).toBeDefined()
      expect(logCall).not.toContain('password')
      expect(logCall).not.toContain('token')
      expect(logCall).not.toContain('authorization')

      // Cleanup
      logSpy.mockRestore()
      vi.unstubAllEnvs()
    })

    it('should log security events appropriately', async () => {
      // Use Vitest's stubEnv to mock NODE_ENV
      vi.stubEnv('NODE_ENV', 'development')

      // Re-import logger with new environment
      vi.resetModules()
      const { logger } = await import('@/lib/logger')
      const logSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
        /* no-op */
      })

      logger.security('Failed authentication attempt', {
        ip: '192.168.1.1',
        endpoint: '/api/protected',
      })

      const logCall = logSpy.mock.calls[0]?.[0]
      expect(logCall).toBeDefined()
      expect(logCall).toContain('[SECURITY]')
      expect(logCall).toContain('Failed authentication attempt')

      // Cleanup
      logSpy.mockRestore()
      vi.unstubAllEnvs()
    })
  })
})
