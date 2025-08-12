import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockClientSide, mockServerSide, setEnvVar } from './setup'

describe('env (aggregator)', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  describe('envPublic (re-export)', () => {
    it('should re-export public environment successfully', async () => {
      mockServerSide()

      setEnvVar('NEXT_PUBLIC_APP_NAME', 'Aggregator Test')

      const { envPublic } = await import('../env')

      expect(envPublic.NEXT_PUBLIC_APP_NAME).toBe('Aggregator Test')
    })
  })

  describe('envServer (with runtime guards)', () => {
    it('should provide server env on server-side', async () => {
      mockServerSide()

      setEnvVar('NODE_ENV', 'development')
      setEnvVar('DATABASE_URL', 'postgresql://localhost:5432/test')

      const { envServer } = await import('../env')

      expect(envServer.NODE_ENV).toBe('development')
      expect(envServer.DATABASE_URL).toBe('postgresql://localhost:5432/test')
    })

    it('should throw error when accessing server env on client-side', async () => {
      mockClientSide()

      const { envServer } = await import('../env')

      expect(() => envServer.DATABASE_URL).toThrow(
        "Security Error: Attempted to access server environment variable 'DATABASE_URL' in client-side code"
      )
      expect(() => envServer.NODE_ENV).toThrow(
        "Security Error: Attempted to access server environment variable 'NODE_ENV' in client-side code"
      )
    })

    it('should throw error when using "in" operator on client-side', async () => {
      mockClientSide()

      const { envServer } = await import('../env')

      expect(() => 'DATABASE_URL' in envServer).toThrow(
        "Security Error: Attempted to access server environment variable 'DATABASE_URL' in client-side code"
      )
    })

    it('should throw error when enumerating keys on client-side', async () => {
      mockClientSide()

      const { envServer } = await import('../env')

      expect(() => Object.keys(envServer)).toThrow(
        "Security Error: Attempted to access server environment variable '[keys enumeration]' in client-side code"
      )
    })

    it('should handle introspection methods gracefully', async () => {
      mockClientSide()

      const { envServer } = await import('../env')

      // Test that we can call introspection methods without errors
      expect(typeof envServer.toString).toBe('function')
      expect(typeof envServer.valueOf).toBe('function')
      expect(typeof envServer.constructor).toBe('function')
    })

    it('should work with Object.getOwnPropertyDescriptor on server-side', async () => {
      mockServerSide()

      setEnvVar('NODE_ENV', 'test')

      const { envServer } = await import('../env')

      const descriptor = Object.getOwnPropertyDescriptor(envServer, 'NODE_ENV')
      expect(descriptor).toBeDefined()
      expect(descriptor?.value).toBe('test')
    })

    it('should throw error with Object.getOwnPropertyDescriptor on client-side', async () => {
      mockClientSide()

      const { envServer } = await import('../env')

      expect(() =>
        Object.getOwnPropertyDescriptor(envServer, 'NODE_ENV')
      ).toThrow(
        "Security Error: Attempted to access server environment variable 'NODE_ENV' in client-side code"
      )
    })
  })

  describe('serverUtils', () => {
    it('should provide isDev flag on server-side', async () => {
      mockServerSide()

      setEnvVar('NODE_ENV', 'development')

      const { serverUtils } = await import('../env')

      expect(await serverUtils.isDev()).toBe(true)
    })

    it('should provide isProd flag on server-side', async () => {
      mockServerSide()

      setEnvVar('NODE_ENV', 'production')

      const { serverUtils } = await import('../env')

      expect(await serverUtils.isProd()).toBe(true)
    })

    it('should provide isTest flag on server-side', async () => {
      mockServerSide()

      setEnvVar('NODE_ENV', 'test')

      const { serverUtils } = await import('../env')

      expect(await serverUtils.isTest()).toBe(true)
    })

    it('should throw error when accessing isDev on client-side', async () => {
      mockClientSide()

      const { serverUtils } = await import('../env')

      await expect(serverUtils.isDev()).rejects.toThrow(
        "Security Error: Attempted to access server environment variable 'isDev' in client-side code"
      )
    })

    it('should throw error when accessing isProd on client-side', async () => {
      mockClientSide()

      const { serverUtils } = await import('../env')

      await expect(serverUtils.isProd()).rejects.toThrow(
        "Security Error: Attempted to access server environment variable 'isProd' in client-side code"
      )
    })

    it('should throw error when accessing isTest on client-side', async () => {
      mockClientSide()

      const { serverUtils } = await import('../env')

      await expect(serverUtils.isTest()).rejects.toThrow(
        "Security Error: Attempted to access server environment variable 'isTest' in client-side code"
      )
    })
  })

  describe('safeNumber (re-export)', () => {
    it('should parse numbers correctly', async () => {
      const { safeNumber } = await import('../env')

      expect(safeNumber('123')).toBe(123)
      expect(safeNumber('0')).toBe(0)
      expect(safeNumber(undefined, 42)).toBe(42)
    })

    it('should throw error for invalid numbers', async () => {
      const { safeNumber } = await import('../env')

      expect(() => safeNumber('invalid')).toThrow('Invalid number: invalid')
    })
  })

  describe('type exports', () => {
    it('should export ClientEnv and ServerEnv types', async () => {
      // This is primarily for TypeScript compilation
      // The types should be available for import
      const module = await import('../env')

      // These would be compile-time checks in real usage
      expect(typeof module).toBe('object')
    })
  })

  describe('mixed usage scenarios', () => {
    it('should allow safe mixed usage pattern', async () => {
      // Simulate a typical usage where public vars are used everywhere
      // and server vars are only used on server-side

      // Server-side context
      mockServerSide()
      setEnvVar('NEXT_PUBLIC_APP_NAME', 'Mixed Usage App')
      setEnvVar('DATABASE_URL', 'postgresql://localhost:5432/test')

      const { envPublic, envServer } = await import('../env')

      // Both should work on server-side
      expect(envPublic.NEXT_PUBLIC_APP_NAME).toBe('Mixed Usage App')
      expect(envServer.DATABASE_URL).toBe('postgresql://localhost:5432/test')

      // Simulate switching to client-side
      mockClientSide()

      // Clear module cache to simulate fresh client-side import
      vi.resetModules()
      const clientModule = await import('../env')

      // Public vars should still work
      expect(clientModule.envPublic.NEXT_PUBLIC_APP_NAME).toBe(
        'Mixed Usage App'
      )

      // Server vars should throw
      expect(() => clientModule.envServer.DATABASE_URL).toThrow(
        'Security Error'
      )
    })

    it('should provide helpful error message with usage guidance', async () => {
      mockClientSide()

      const { envServer } = await import('../env')

      try {
        const _unused = envServer.DATABASE_URL
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('Security Error')
        expect((error as Error).message).toContain('Server Components')
        expect((error as Error).message).toContain('API Routes')
        expect((error as Error).message).toContain('NEXT_PUBLIC_')
        expect((error as Error).message).toContain('envPublic')
      }
    })
  })
})
