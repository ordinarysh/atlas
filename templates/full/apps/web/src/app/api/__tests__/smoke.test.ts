/**
 * Smoke tests for core API endpoints
 *
 * These tests verify that all essential infrastructure endpoints are working
 * and returning expected response formats without testing deep business logic.
 */

import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'
import { GET as whoamiGet } from '../auth/me/route'
import { GET as docsGet } from '../docs/route'
// Import all core route handlers
import { GET as healthGet } from '../health/route'
import { GET as metricsGet } from '../metrics/route'
import { GET as readyGet } from '../ready/route'

// Mock auth for authenticated endpoints
vi.mock('@/server/auth', () => ({
  requireApiKey: vi.fn().mockResolvedValue({
    id: 'smoke-test-key',
    scopes: ['read:projects'],
    active: true,
    metadata: { name: 'Smoke Test Key' },
  }),
  getAuthContext: vi.fn().mockResolvedValue({
    id: 'smoke-test-key',
    scopes: ['read:projects'],
  }),
}))

// Mock rate limiter to always allow
vi.mock('@/server/rate-limit', () => ({
  requireRateLimit: vi.fn().mockResolvedValue({
    type: 'allowed',
    setHeaders: vi.fn(),
  }),
}))

/**
 * Create a mock NextRequest for testing
 */
function createMockRequest(
  url: string,
  method = 'GET',
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest(url, {
    method,
    headers: new Headers(headers),
  })
}

describe('API Smoke Tests', () => {
  describe('Health Endpoints', () => {
    it('GET /api/health should return healthy status', async () => {
      const request = createMockRequest('http://localhost:3000/api/health')
      const response = await healthGet(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data).toHaveProperty('status')
      expect(data.data).toHaveProperty('timestamp')
      expect(data.data).toHaveProperty('version')
      expect(data.data).toHaveProperty('uptime')
      expect(data.data).toHaveProperty('checks')
    })

    it('GET /api/ready should return readiness status', async () => {
      const request = createMockRequest('http://localhost:3000/api/ready')
      const response = await readyGet(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data).toHaveProperty('startup')
      expect(data.data).toHaveProperty('dependencies')
    })
  })

  describe('Documentation Endpoints', () => {
    it('GET /api/docs should return OpenAPI documentation', async () => {
      const request = createMockRequest('http://localhost:3000/api/docs')
      const response = await docsGet(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('text/html')
    })
  })

  describe('Metrics Endpoints', () => {
    it('GET /api/metrics should return basic metrics', async () => {
      const request = createMockRequest('http://localhost:3000/api/metrics')
      const response = await metricsGet(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data).toHaveProperty('system')
      expect(data.data).toHaveProperty('application')
    })
  })

  describe('Authentication Endpoints', () => {
    it('GET /api/auth/me should return authenticated user info', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/auth/me',
        'GET',
        { Authorization: 'Bearer test-key' }
      )
      const response = await whoamiGet(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data).toHaveProperty('apiKeyId')
      expect(data.data).toHaveProperty('scopes')
      expect(data.data).toHaveProperty('isActive')
    })
  })

  describe('Response Format Consistency', () => {
    it('All endpoints should return consistent error format', async () => {
      // Test that all endpoints follow the same response structure
      const endpoints = [
        { handler: healthGet, url: 'http://localhost:3000/api/health' },
        { handler: readyGet, url: 'http://localhost:3000/api/ready' },
        { handler: metricsGet, url: 'http://localhost:3000/api/metrics' },
        { handler: whoamiGet, url: 'http://localhost:3000/api/auth/me' },
      ]

      for (const endpoint of endpoints) {
        const request = createMockRequest(endpoint.url)
        const response = await endpoint.handler(request)

        expect(response.headers.get('Content-Type')).toContain(
          'application/json'
        )

        const data = await response.json()
        if (response.ok) {
          expect(data).toHaveProperty('data')
        } else {
          expect(data).toHaveProperty('error')
        }
      }
    })

    it('All endpoints should include security headers', async () => {
      const request = createMockRequest('http://localhost:3000/api/health')
      const response = await healthGet(request)

      expect(response.headers.get('Content-Type')).toBeTruthy()
      expect(response.headers.get('Cache-Control')).toBeTruthy()
    })
  })
})
