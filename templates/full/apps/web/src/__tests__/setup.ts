/**
 * Test setup file for Vitest
 */

import { afterEach, beforeEach } from 'vitest'

// Store original process.env to restore between tests
let originalEnv: NodeJS.ProcessEnv

beforeEach(() => {
  // Save the original environment
  originalEnv = { ...process.env }
})

afterEach(() => {
  // Restore the original environment by clearing and reassigning
  Object.keys(process.env).forEach((key) => {
    delete process.env[key]
  })
  Object.assign(process.env, originalEnv)

  // Clear module cache to ensure fresh imports
  Object.keys(require.cache).forEach((key) => {
    if (
      key.includes('env.server') ||
      key.includes('env.client') ||
      key.includes('env.ts')
    ) {
      delete require.cache[key]
    }
  })
})

/**
 * Helper to safely set environment variables in tests
 */
export function setEnvVar(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key]
  } else {
    process.env[key] = value
  }
}

// Mock window for client-side testing
Object.defineProperty(globalThis, 'window', {
  writable: true,
  value: undefined,
})

/**
 * Helper to simulate client-side environment
 */
export function mockClientSide() {
  Object.defineProperty(globalThis, 'window', {
    writable: true,
    configurable: true,
    value: {
      location: { href: 'http://localhost:3000' },
      document: {},
    },
  })
}

/**
 * Helper to simulate server-side environment
 */
export function mockServerSide() {
  Object.defineProperty(globalThis, 'window', {
    writable: true,
    configurable: true,
    value: undefined,
  })
}
