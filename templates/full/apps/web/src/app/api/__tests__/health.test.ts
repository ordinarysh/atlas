import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { GET } from '../health/route'

/**
 * Mock NextRequest for testing
 */
function createMockRequest(
  url = 'http://localhost:3000/api/health',
  method = 'GET',
  headers: Record<string, string> = {}
): NextRequest {
  const reqInit: ConstructorParameters<typeof NextRequest>[1] = {
    method,
    headers: new Headers(headers),
  }
  return new NextRequest(url, reqInit)
}

describe('/api/health', () => {
  it('should return healthy status', async () => {
    const request = createMockRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('data')
    expect(data.data).toMatchObject({
      status: 'healthy',
      timestamp: expect.any(String),
      version: expect.any(String),
      uptime: expect.any(Number),
      environment: expect.any(String),
      checks: {
        memory: {
          status: expect.stringMatching(/^(healthy|warning|critical)$/),
          used: expect.any(Number),
          total: expect.any(Number),
          percentage: expect.any(Number),
        },
        dependencies: {
          status: expect.stringMatching(/^(healthy|unhealthy)$/),
          services: expect.any(Array),
        },
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
    expect(response.headers.get('X-Response-Time')).toMatch(/^\d+ms$/)
  })

  it('should validate timestamp format', async () => {
    const request = createMockRequest()
    const response = await GET(request)
    const data = await response.json()

    const timestamp = data.data.timestamp
    expect(new Date(timestamp).toISOString()).toBe(timestamp)
  })

  it('should have memory percentage within valid range', async () => {
    const request = createMockRequest()
    const response = await GET(request)
    const data = await response.json()

    const memoryPercentage = data.data.checks.memory.percentage
    expect(memoryPercentage).toBeGreaterThanOrEqual(0)
    expect(memoryPercentage).toBeLessThanOrEqual(100)
  })
})
