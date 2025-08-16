/**
 * Test helpers for creating mock NextRequest instances
 */

import { NextRequest } from 'next/server'

/**
 * Create a properly typed NextRequest for testing
 * This helper ensures all required NextRequest properties are present
 */
export function createMockNextRequest(
  url: string,
  init?: Omit<RequestInit, 'signal'> & { signal?: AbortSignal }
): NextRequest {
  return new NextRequest(url, init)
}

/**
 * Create a NextRequest with common test defaults
 */
export function createTestRequest(
  path = '/api/test',
  method = 'GET',
  init?: Omit<RequestInit, 'method' | 'signal'> & { signal?: AbortSignal }
): NextRequest {
  const url = path.startsWith('http') ? path : `http://localhost:3000${path}`
  return new NextRequest(url, {
    method,
    ...init,
  })
}
