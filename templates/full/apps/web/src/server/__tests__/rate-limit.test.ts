import { NextRequest } from 'next/server'
import * as RateLimitModule from '@atlas/services-rate-limit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
// Import after mocking
import { getClientKey, requireRateLimit } from '../rate-limit'

// Mock the rate limiter module with factory functions
vi.mock('@atlas/services-rate-limit', () => {
  const mockCheck = vi.fn()
  const mockSetErrorHandler = vi.fn()

  return {
    createRateLimiter: vi.fn(() => ({
      check: mockCheck,
      setErrorHandler: mockSetErrorHandler,
    })),
    createMemoryStore: vi.fn(() => ({})),
    __mockCheck: mockCheck,
    __mockSetErrorHandler: mockSetErrorHandler,
  }
})

// Mock config package
vi.mock('@atlas/config-rate-limit', () => ({
  createRateLimitPresets: vi.fn(() => ({
    standard: { max: 60, windowMs: 60_000, prefix: 'api-std' },
    strict: { max: 20, windowMs: 60_000, prefix: 'api-strict' },
    auth: { max: 5, windowMs: 15 * 60 * 1000, prefix: 'api-auth' },
    upload: { max: 10, windowMs: 60_000, prefix: 'api-upload' },
    admin: { max: 30, windowMs: 60_000, prefix: 'api-admin' },
  })),
  getRateLimitConfig: vi.fn(() => ({
    max: 60,
    windowMs: 60_000,
    prefix: 'api',
    provider: 'memory',
    trustProxy: false,
  })),
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock API error codes
vi.mock('@/lib/api-utils', () => ({
  API_ERROR_CODES: {
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  },
}))

// Get access to the mock functions
const mockCheck = (RateLimitModule as any).__mockCheck
const mockSetErrorHandler = (RateLimitModule as any).__mockSetErrorHandler

describe('Rate Limiting Glue Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getClientKey', () => {
    it('should prioritize API key ID when authenticated', () => {
      const headers = new Headers()
      const auth = { apiKeyId: 'test-api-key-123' }

      const result = getClientKey(headers, auth)

      expect(result).toBe('key:test-api-key-123')
    })

    it('should use x-forwarded-for IP when no API key', () => {
      const headers = new Headers({
        'x-forwarded-for': '192.168.1.100, 10.0.0.1',
      })

      const result = getClientKey(headers)

      expect(result).toBe('ip:192.168.1.100')
    })

    it('should use x-real-ip as fallback', () => {
      const headers = new Headers({
        'x-real-ip': '192.168.1.200',
      })

      const result = getClientKey(headers)

      expect(result).toBe('ip:192.168.1.200')
    })

    it('should use cf-connecting-ip for Cloudflare', () => {
      const headers = new Headers({
        'cf-connecting-ip': '192.168.1.300',
      })

      const result = getClientKey(headers)

      expect(result).toBe('ip:192.168.1.300')
    })

    it('should use true-client-ip as another fallback', () => {
      const headers = new Headers({
        'true-client-ip': '192.168.1.400',
      })

      const result = getClientKey(headers)

      expect(result).toBe('ip:192.168.1.400')
    })

    it('should use anonymous fallback when no IP headers', () => {
      const headers = new Headers()

      const result = getClientKey(headers)

      expect(result).toBe('ip:anonymous')
    })

    it('should handle x-forwarded-for with whitespace', () => {
      const headers = new Headers({
        'x-forwarded-for': ' 192.168.1.500 , 10.0.0.1 ',
      })

      const result = getClientKey(headers)

      expect(result).toBe('ip:192.168.1.500')
    })

    it('should prioritize x-forwarded-for over other headers when trustProxy=false', () => {
      const headers = new Headers({
        'x-forwarded-for': '192.168.1.100',
        'x-real-ip': '192.168.1.200',
        'cf-connecting-ip': '192.168.1.300',
      })

      const result = getClientKey(headers, undefined, false)

      expect(result).toBe('ip:192.168.1.100')
    })

    it('should prioritize x-real-ip when trustProxy=true', () => {
      const headers = new Headers({
        'x-forwarded-for': '192.168.1.100',
        'x-real-ip': '192.168.1.200',
        'cf-connecting-ip': '192.168.1.300',
      })

      const result = getClientKey(headers, undefined, true)

      expect(result).toBe('ip:192.168.1.200')
    })

    it('should use cf-connecting-ip when trustProxy=true and no x-real-ip', () => {
      const headers = new Headers({
        'x-forwarded-for': '192.168.1.100',
        'cf-connecting-ip': '192.168.1.300',
      })

      const result = getClientKey(headers, undefined, true)

      expect(result).toBe('ip:192.168.1.300')
    })

    it('should fallback to x-forwarded-for when trustProxy=true and no real IP headers', () => {
      const headers = new Headers({
        'x-forwarded-for': '192.168.1.100',
      })

      const result = getClientKey(headers, undefined, true)

      expect(result).toBe('ip:192.168.1.100')
    })
  })

  describe('requireRateLimit', () => {
    beforeEach(() => {
      mockCheck.mockReset()
      mockSetErrorHandler.mockReset()

      // Default mock implementation for most tests
      mockCheck.mockResolvedValue({
        allowed: true,
        remaining: 59,
        resetAt: Date.now() + 60_000,
        limit: 60,
        count: 1,
      })
    })

    it('should allow request and set proper headers when under limit', async () => {
      mockCheck.mockResolvedValue({
        allowed: true,
        remaining: 59,
        resetAt: Date.now() + 60_000,
        limit: 60,
        count: 1,
      })

      const request = new NextRequest('https://example.com/api/test')
      const result = await requireRateLimit(request, { limiter: 'standard' })

      expect(result.type).toBe('allowed')
      expect(mockCheck).toHaveBeenCalledWith('ip:anonymous')

      if (result.type === 'allowed') {
        const mockResponse = {
          headers: {
            set: vi.fn(),
          },
        }
        result.setHeaders(mockResponse as any)

        expect(mockResponse.headers.set).toHaveBeenCalledWith(
          'X-RateLimit-Limit',
          '60'
        )
        expect(mockResponse.headers.set).toHaveBeenCalledWith(
          'X-RateLimit-Remaining',
          '59'
        )
        expect(mockResponse.headers.set).toHaveBeenCalledWith(
          'X-RateLimit-Reset',
          expect.any(String)
        )
      }
    })

    it('should block request and return 429 when over limit', async () => {
      mockCheck.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 30_000,
        limit: 60,
        count: 61,
      })

      const request = new NextRequest('https://example.com/api/test')
      const result = await requireRateLimit(request, { limiter: 'standard' })

      expect(result.type).toBe('blocked')

      if (result.type === 'blocked') {
        expect(result.response.status).toBe(429)

        const responseBody = await result.response.json()
        expect(responseBody).toEqual({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too Many Requests - rate limit exceeded',
          },
        })

        // Check headers
        expect(result.response.headers.get('X-RateLimit-Limit')).toBe('60')
        expect(result.response.headers.get('X-RateLimit-Remaining')).toBe('0')
        expect(result.response.headers.get('X-RateLimit-Reset')).toBe(
          Math.ceil((Date.now() + 30_000) / 1000).toString()
        )
        expect(result.response.headers.get('Retry-After')).toBe('30')
      }
    })

    it('should use API key for client key when authenticated', async () => {
      mockCheck.mockResolvedValue({
        allowed: true,
        remaining: 59,
        resetAt: Date.now() + 60_000,
        limit: 60,
        count: 1,
      })

      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'x-auth-context': JSON.stringify({
            apiKey: { id: 'test-key-123', permissions: ['read'] },
          }),
        },
      })

      await requireRateLimit(request)

      expect(mockCheck).toHaveBeenCalledWith('key:test-key-123')
    })

    it('should bypass rate limiting for admin permissions', async () => {
      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'x-auth-context': JSON.stringify({
            apiKey: { id: 'admin-key', permissions: ['admin'] },
          }),
        },
      })

      const result = await requireRateLimit(request)

      expect(result.type).toBe('allowed')
      expect(mockCheck).not.toHaveBeenCalled()

      if (result.type === 'allowed') {
        const mockResponse = {
          headers: {
            set: vi.fn(),
          },
        }
        result.setHeaders(mockResponse as any)

        expect(mockResponse.headers.set).toHaveBeenCalledWith(
          'X-RateLimit-Bypass',
          'admin'
        )
      }
    })

    it('should handle invalid auth context gracefully', async () => {
      // This test just verifies that invalid JSON doesn't crash the function
      // The actual mock call depends on the implementation details
      mockCheck.mockResolvedValue({
        allowed: true,
        remaining: 59,
        resetAt: Date.now() + 60_000,
        limit: 60,
        count: 1,
      })

      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'x-auth-context': 'invalid-json',
        },
      })

      const result = await requireRateLimit(request)

      expect(result.type).toBe('allowed')
      // The function should continue with rate limiting even with invalid auth context
      expect(mockCheck).toHaveBeenCalled()
    })

    it('should fail open on rate limiter errors', async () => {
      mockCheck.mockRejectedValue(new Error('Store connection failed'))

      const request = new NextRequest('https://example.com/api/test')
      const result = await requireRateLimit(request)

      expect(result.type).toBe('allowed')

      if (result.type === 'allowed') {
        const mockResponse = {
          headers: {
            set: vi.fn(),
          },
        }
        result.setHeaders(mockResponse as any)

        expect(mockResponse.headers.set).toHaveBeenCalledWith(
          'X-RateLimit-Error',
          'true'
        )
      }
    })

    it('should use custom key override when provided', async () => {
      mockCheck.mockResolvedValue({
        allowed: true,
        remaining: 59,
        resetAt: Date.now() + 60_000,
        limit: 60,
        count: 1,
      })

      const request = new NextRequest('https://example.com/api/test')
      await requireRateLimit(request, { keyOverride: 'custom:key:123' })

      expect(mockCheck).toHaveBeenCalledWith('custom:key:123')
    })

    it('should calculate retry-after as minimum 1 second', async () => {
      // Set up a scenario where resetAt is very close to now (less than 1 second)
      mockCheck.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 500, // 500ms remaining
        limit: 60,
        count: 61,
      })

      const request = new NextRequest('https://example.com/api/test')
      const result = await requireRateLimit(request)

      if (result.type === 'blocked') {
        expect(result.response.headers.get('Retry-After')).toBe('1')
      }
    })
  })

  describe('Header compliance RFC 6585', () => {
    beforeEach(() => {
      mockCheck.mockReset()
      mockSetErrorHandler.mockReset()
    })

    it('should include all required rate limit headers on successful request', async () => {
      mockCheck.mockResolvedValue({
        allowed: true,
        remaining: 45,
        resetAt: Date.now() + 45_000,
        limit: 100,
        count: 55,
      })

      const request = new NextRequest('https://example.com/api/test')
      const result = await requireRateLimit(request)

      expect(result.type).toBe('allowed')

      if (result.type === 'allowed') {
        const mockResponse = {
          headers: {
            set: vi.fn(),
          },
        }
        result.setHeaders(mockResponse as any)

        // Check all required headers are set
        expect(mockResponse.headers.set).toHaveBeenCalledWith(
          'X-RateLimit-Limit',
          '100'
        )
        expect(mockResponse.headers.set).toHaveBeenCalledWith(
          'X-RateLimit-Remaining',
          '45'
        )
        expect(mockResponse.headers.set).toHaveBeenCalledWith(
          'X-RateLimit-Reset',
          expect.any(String)
        )
      }
    })

    it('should include all required headers on 429 response', async () => {
      mockCheck.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 25_000,
        limit: 100,
        count: 101,
      })

      const request = new NextRequest('https://example.com/api/test')
      const result = await requireRateLimit(request)

      expect(result.type).toBe('blocked')

      if (result.type === 'blocked') {
        // Check all required 429 headers
        expect(result.response.headers.get('X-RateLimit-Limit')).toBe('100')
        expect(result.response.headers.get('X-RateLimit-Remaining')).toBe('0')
        expect(result.response.headers.get('X-RateLimit-Reset')).toBe(
          '1704067225'
        ) // Unix timestamp
        expect(result.response.headers.get('Retry-After')).toBe('25')
        expect(result.response.headers.get('Content-Type')).toBe(
          'application/json; charset=utf-8'
        )
        expect(result.response.headers.get('Cache-Control')).toBe('no-store')
      }
    })
  })
})
