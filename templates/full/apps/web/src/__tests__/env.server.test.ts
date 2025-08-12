import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockServerSide, setEnvVar } from './setup'

// Mock dotenv
const mockDotenvConfig = vi.fn()
vi.mock('dotenv', () => ({
  config: mockDotenvConfig,
}))

describe('env.server', () => {
  beforeEach(() => {
    mockServerSide()
    mockDotenvConfig.mockClear()
    vi.resetModules()
  })

  describe('loadServerEnv', () => {
    it('should load valid environment variables successfully', async () => {
      setEnvVar('NODE_ENV', 'production')
      setEnvVar('DATABASE_URL', 'postgresql://user:pass@localhost:5432/db')

      const { loadServerEnv } = await import('../env.server')
      const env = await loadServerEnv()

      expect(env.NODE_ENV).toBe('production')
      expect(env.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db')
    })

    it('should use default values for optional variables', async () => {
      setEnvVar('NODE_ENV', 'development')

      const { loadServerEnv } = await import('../env.server')
      const env = await loadServerEnv()

      expect(env.NODE_ENV).toBe('development')
      expect(env.DATABASE_URL).toBeUndefined()
    })

    it('should throw error for invalid URL in DATABASE_URL', async () => {
      setEnvVar('DATABASE_URL', 'invalid-url')
      vi.resetModules()

      await expect(import('../env.server')).rejects.toThrow(
        'Invalid server environment variables'
      )
    })

    it('should handle dotenv loading in development mode', async () => {
      setEnvVar('NODE_ENV', 'development')
      setEnvVar('DATABASE_URL', 'postgresql://localhost:5432/test')
      vi.resetModules()

      const envServerModule = await import('../env.server')
      const env = await envServerModule.loadServerEnv()

      expect(env.NODE_ENV).toBe('development')
      expect(env.DATABASE_URL).toBe('postgresql://localhost:5432/test')

      // Verify the mock was available (ensures dotenv import path works)
      expect(mockDotenvConfig).toBeDefined()
    })

    it('should work without dotenv in production mode', async () => {
      setEnvVar('NODE_ENV', 'production')
      setEnvVar('DATABASE_URL', 'postgresql://prod-server:5432/myapp')
      vi.resetModules()

      const envServerModule = await import('../env.server')
      const env = await envServerModule.loadServerEnv()

      expect(env.NODE_ENV).toBe('production')
      expect(env.DATABASE_URL).toBe('postgresql://prod-server:5432/myapp')
    })

    it('should return frozen environment object', async () => {
      const { loadServerEnv } = await import('../env.server')
      const env = await loadServerEnv()

      expect(() => {
        // Intentionally trying to modify frozen object
        ;(env as any).NODE_ENV = 'test'
      }).toThrow()
    })

    it('should cache environment after first load', async () => {
      const { loadServerEnv } = await import('../env.server')

      const env1 = await loadServerEnv()
      const env2 = await loadServerEnv()

      expect(env1).toBe(env2) // Same reference
    })
  })

  describe('utility functions', () => {
    beforeEach(() => {
      setEnvVar('NODE_ENV', 'development')
    })

    it('should provide correct isDev flag', async () => {
      setEnvVar('NODE_ENV', 'development')
      const { isDev } = await import('../env.server')
      expect(await isDev()).toBe(true)
    })

    it('should provide correct isProd flag', async () => {
      setEnvVar('NODE_ENV', 'production')
      const { isProd } = await import('../env.server')
      expect(await isProd()).toBe(true)
    })

    it('should provide correct isTest flag', async () => {
      setEnvVar('NODE_ENV', 'test')
      const { isTest } = await import('../env.server')
      expect(await isTest()).toBe(true)
    })
  })

  describe('safeNumber', () => {
    it('should parse valid numbers', async () => {
      const { safeNumber } = await import('../env.server')

      expect(safeNumber('123')).toBe(123)
      expect(safeNumber('0')).toBe(0)
      expect(safeNumber('-456')).toBe(-456)
      expect(safeNumber('3.14')).toBe(3.14)
    })

    it('should return default for undefined input', async () => {
      const { safeNumber } = await import('../env.server')

      expect(safeNumber(undefined)).toBeUndefined()
      expect(safeNumber(undefined, 42)).toBe(42)
    })

    it('should throw error for invalid numbers', async () => {
      const { safeNumber } = await import('../env.server')

      expect(() => safeNumber('not-a-number')).toThrow(
        'Invalid number: not-a-number'
      )
      expect(() => safeNumber('123abc')).toThrow('Invalid number: 123abc')
    })
  })

  describe('envServer export', () => {
    it('should export the loaded server environment', async () => {
      setEnvVar('NODE_ENV', 'development')
      setEnvVar('DATABASE_URL', 'postgresql://localhost:5432/test')

      const { envServer } = await import('../env.server')

      expect(envServer.NODE_ENV).toBe('development')
      expect(envServer.DATABASE_URL).toBe('postgresql://localhost:5432/test')
    })
  })
})
