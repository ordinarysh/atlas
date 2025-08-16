import type { Todo } from '@atlas/todos-domain'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTodo, deleteTodo, getTodos, updateTodo } from '../todos'

// Mock fetch globally
global.fetch = vi.fn()

describe('todos resource', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTodos', () => {
    it('should fetch and return todos', async () => {
      const mockTodos: Todo[] = [
        {
          id: '1',
          title: 'Test todo',
          completed: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          title: 'Another todo',
          completed: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ]

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ data: mockTodos }), { status: 200 })
      )

      const result = await getTodos()

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/todos',
        expect.objectContaining({
          method: 'GET',
        })
      )

      expect(result).toEqual(mockTodos)
    })

    it('should throw error on invalid response', async () => {
      const invalidResponse = [
        {
          id: 123, // Should be string
          title: 'Test',
          completed: 'yes', // Should be boolean
        },
      ]

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ data: invalidResponse }), { status: 200 })
      )

      try {
        await getTodos()
        expect.fail('Expected getTodos to throw an error')
      } catch (error: unknown) {
        expect(error).toHaveProperty('name', 'ZodError')
        expect(error).toHaveProperty('issues')
      }
    })
  })

  describe('createTodo', () => {
    it('should create todo and return result', async () => {
      const input = {
        title: 'New todo',
      }

      const mockResponse: Todo = {
        id: '3',
        title: 'New todo',
        completed: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ data: mockResponse }), { status: 201 })
      )

      const result = await createTodo(input)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/todos',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(input),
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('should validate input before sending', async () => {
      const invalidInput = {
        title: '', // Should be at least 1 character
      }

      try {
        await createTodo(invalidInput)
        expect.fail('Expected createTodo to throw an error')
      } catch (error: unknown) {
        expect(error).toHaveProperty('name', 'ZodError')
        expect(error).toHaveProperty('issues')
      }
    })
  })

  describe('updateTodo', () => {
    it('should update todo and return result', async () => {
      const mockResponse: Todo = {
        id: '1',
        title: 'Updated todo',
        completed: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ data: mockResponse }), { status: 200 })
      )

      const result = await updateTodo('1', { completed: true })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/todos/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ completed: true }),
        })
      )

      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteTodo', () => {
    it('should delete todo and return success', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      )

      const result = await deleteTodo('1')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/todos/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )

      expect(result).toEqual({ success: true })
    })
  })
})
