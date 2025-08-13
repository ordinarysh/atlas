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

  it('should NOT export resource functions directly', () => {
    const exportedModules = exports as Record<string, unknown>
    expect(exportedModules.listTodos).toBeUndefined()
    expect(exportedModules.createTodo).toBeUndefined()
  })

  it('should NOT export schemas directly', () => {
    const exportedModules = exports as Record<string, unknown>
    expect(exportedModules.TodoSchema).toBeUndefined()
    expect(exportedModules.TodosResponseSchema).toBeUndefined()
    expect(exportedModules.CreateTodoInputSchema).toBeUndefined()
  })
})
