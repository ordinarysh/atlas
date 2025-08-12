import { fetchJson } from '@atlas/query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import {
  createTodo,
  CreateTodoInputSchema,
  listTodos,
  TodoSchema,
  TodosResponseSchema,
} from '../resources/todos'

describe('todos resource', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listTodos', () => {
    it('should fetch and validate todos response', async () => {
      const mockTodos = [
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
        },
      ]

      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue(mockTodos)

      const result = await listTodos()

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/api/todos',
        expect.objectContaining({
          method: 'GET',
          schema: TodosResponseSchema,
        })
      )

      expect(result).toEqual(mockTodos)
    })

    it('should use custom base URL when provided', async () => {
      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue([])

      await listTodos('https://api.example.com')

      expect(mockFetchJson).toHaveBeenCalledWith(
        'https://api.example.com/api/todos',
        expect.any(Object)
      )
    })

    it('should throw validation error on malformed response', async () => {
      const invalidResponse = [
        {
          id: 123, // Should be string
          title: 'Test',
          completed: 'yes', // Should be boolean
        },
      ]

      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockImplementation((_, options) => {
        const schema = options?.schema
        return Promise.resolve(
          schema?.parse(invalidResponse) ?? invalidResponse
        )
      })

      await expect(listTodos()).rejects.toThrow(z.ZodError)
    })
  })

  describe('createTodo', () => {
    it('should create todo and validate response', async () => {
      const input = {
        title: 'New todo',
        completed: false,
      }

      const mockResponse = {
        id: '3',
        title: 'New todo',
        completed: false,
        createdAt: '2024-01-01T00:00:00Z',
      }

      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue(mockResponse)

      const result = await createTodo(input)

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/api/todos',
        expect.objectContaining({
          method: 'POST',
          body: input,
          schema: TodoSchema,
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('should use custom base URL when provided', async () => {
      const input = { title: 'Test', completed: false }
      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue({
        id: '1',
        title: 'Test',
        completed: false,
        createdAt: '2024-01-01T00:00:00Z',
      })

      await createTodo(input, 'https://api.example.com')

      expect(mockFetchJson).toHaveBeenCalledWith(
        'https://api.example.com/api/todos',
        expect.any(Object)
      )
    })

    it('should throw validation error on malformed response', async () => {
      const input = { title: 'Test', completed: false }
      const invalidResponse = {
        id: 123, // Should be string
        title: 'Test',
        // Missing required 'completed' field
        createdAt: '2024-01-01T00:00:00Z',
      }

      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockImplementation((_, options) => {
        const schema = options?.schema
        return Promise.resolve(
          schema?.parse(invalidResponse) ?? invalidResponse
        )
      })

      await expect(createTodo(input)).rejects.toThrow(z.ZodError)
    })
  })

  describe('schemas', () => {
    it('TodoSchema should validate correct todo object', () => {
      const validTodo = {
        id: '1',
        title: 'Test',
        completed: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      }

      expect(() => TodoSchema.parse(validTodo)).not.toThrow()
    })

    it('TodoSchema should allow optional updatedAt', () => {
      const validTodo = {
        id: '1',
        title: 'Test',
        completed: true,
        createdAt: '2024-01-01T00:00:00Z',
      }

      expect(() => TodoSchema.parse(validTodo)).not.toThrow()
    })

    it('CreateTodoInputSchema should validate input', () => {
      const validInput = {
        title: 'New todo',
        completed: true,
      }

      expect(() => CreateTodoInputSchema.parse(validInput)).not.toThrow()
    })

    it('CreateTodoInputSchema should default completed to false', () => {
      const input = { title: 'New todo' }
      const parsed = CreateTodoInputSchema.parse(input)

      expect(parsed.completed).toBe(false)
    })

    it('CreateTodoInputSchema should reject empty title', () => {
      const invalidInput = { title: '' }

      expect(() => CreateTodoInputSchema.parse(invalidInput)).toThrow(
        z.ZodError
      )
    })
  })
})
