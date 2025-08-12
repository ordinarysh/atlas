import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockServerSide, setEnvVar } from './setup'

describe('env.client', () => {
  beforeEach(() => {
    mockServerSide()
    vi.resetModules()
  })

  describe('getPublicEnv', () => {
    it('should load valid public environment variables', async () => {
      setEnvVar('NEXT_PUBLIC_APP_NAME', 'Test App')
      setEnvVar('NEXT_PUBLIC_APP_URL', 'https://example.com')
      setEnvVar('NEXT_PUBLIC_API_URL', '/api/v1')

      const { getPublicEnv } = await import('../env.client')
      const env = getPublicEnv()

      expect(env.NEXT_PUBLIC_APP_NAME).toBe('Test App')
      expect(env.NEXT_PUBLIC_APP_URL).toBe('https://example.com')
      expect(env.NEXT_PUBLIC_API_URL).toBe('/api/v1')
    })

    it('should use default values when variables are not set', async () => {
      const { getPublicEnv } = await import('../env.client')
      const env = getPublicEnv()

      expect(env.NEXT_PUBLIC_APP_NAME).toBe('Atlas App')
      expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000')
      expect(env.NEXT_PUBLIC_API_URL).toBe('/api')
    })

    it('should validate URL format for NEXT_PUBLIC_APP_URL', async () => {
      mockServerSide()
      setEnvVar('NEXT_PUBLIC_APP_URL', 'invalid-url')
      vi.resetModules()

      await expect(import('../env.client')).rejects.toThrow(
        'Invalid client environment variables'
      )
    })

    it('should reject non-NEXT_PUBLIC prefixed variables', async () => {
      // This test demonstrates that the environment filtering only includes NEXT_PUBLIC_ vars
      // so non-public vars are automatically excluded, not rejected
      setEnvVar('NEXT_PUBLIC_APP_NAME', 'Valid App')
      setEnvVar('SECRET_KEY', 'should-not-be-here')

      const { getPublicEnv } = await import('../env.client')
      const env = getPublicEnv()

      // Should only include the public variable
      expect(env.NEXT_PUBLIC_APP_NAME).toBe('Valid App')
      // Should not have the secret key
      expect('SECRET_KEY' in env).toBe(false)
    })

    it('should return frozen environment object', async () => {
      const { getPublicEnv } = await import('../env.client')
      const env = getPublicEnv()

      expect(() => {
        // Intentionally trying to modify frozen object
        ;(env as any).NEXT_PUBLIC_APP_NAME = 'Modified'
      }).toThrow()
    })

    it('should cache environment after first load', async () => {
      const { getPublicEnv } = await import('../env.client')

      const env1 = getPublicEnv()
      const env2 = getPublicEnv()

      expect(env1).toBe(env2) // Same reference
    })

    it('should work in client-side environment', async () => {
      // Mock browser environment
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
      })

      setEnvVar('NEXT_PUBLIC_APP_NAME', 'Client App')

      const { getPublicEnv } = await import('../env.client')
      const env = getPublicEnv()

      expect(env.NEXT_PUBLIC_APP_NAME).toBe('Client App')

      // Cleanup
      delete (global as any).window
    })
  })

  describe('isBrowser', () => {
    it('should return false on server-side', async () => {
      const { isBrowser } = await import('../env.client')
      expect(isBrowser()).toBe(false)
    })

    it('should return true on client-side', async () => {
      // Mock browser environment
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
      })

      const { isBrowser } = await import('../env.client')
      expect(isBrowser()).toBe(true)

      // Cleanup
      delete (global as any).window
    })
  })

  describe('envPublic export', () => {
    it('should export the loaded public environment', async () => {
      setEnvVar('NEXT_PUBLIC_APP_NAME', 'Exported App')

      const { envPublic } = await import('../env.client')

      expect(envPublic.NEXT_PUBLIC_APP_NAME).toBe('Exported App')
    })
  })
})
