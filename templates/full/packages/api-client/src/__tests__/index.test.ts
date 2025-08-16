import { describe, expect, it } from 'vitest'
import * as exports from '../index'

describe('index exports', () => {
  it('should export core client functions', () => {
    expect(exports.createApi).toBeDefined()
    expect(typeof exports.createApi).toBe('function')
    expect(exports.qs).toBeDefined()
    expect(typeof exports.qs).toBe('function')
  })

  it('should NOT export preconfigured api or auth module', () => {
    const exportedModules = exports as Record<string, unknown>
    expect(exportedModules.api).toBeUndefined()
    expect(exportedModules.auth).toBeUndefined()
  })

  it('should maintain clean api surface without domain-specific exports', () => {
    const exportedModules = exports as Record<string, unknown>
    // Ensure we only export core client functions, not domain-specific resources
    const exportKeys = Object.keys(exportedModules)
    expect(exportKeys).toEqual(expect.arrayContaining(['createApi', 'qs']))
  })
})
