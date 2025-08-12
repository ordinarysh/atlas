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
    expect((exports as any).api).toBeUndefined()
    expect((exports as any).auth).toBeUndefined()
  })

  it('should NOT export resource functions directly', () => {
    expect((exports as any).listTodos).toBeUndefined()
    expect((exports as any).createTodo).toBeUndefined()
  })

  it('should NOT export schemas directly', () => {
    expect((exports as any).TodoSchema).toBeUndefined()
    expect((exports as any).TodosResponseSchema).toBeUndefined()
    expect((exports as any).CreateTodoInputSchema).toBeUndefined()
  })
})