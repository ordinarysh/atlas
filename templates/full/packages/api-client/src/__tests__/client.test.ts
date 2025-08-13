import { fetchJson } from '@atlas/query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApi, qs } from '../client'

describe('createApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('base URL joining', () => {
    it('should correctly join base URL with path', async () => {
      const api = createApi({ baseUrl: '/v1' })
      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.get('/todos')

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/v1/todos',
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should handle trailing slash in base URL', async () => {
      const api = createApi({ baseUrl: '/v1/' })
      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.get('/todos')

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/v1/todos',
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should handle path without leading slash', async () => {
      const api = createApi({ baseUrl: '/v1' })
      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.get('todos')

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/v1/todos',
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should work without base URL', async () => {
      const api = createApi()
      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.get('/todos')

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/todos',
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should handle absolute URLs by ignoring base URL', async () => {
      const api = createApi({ baseUrl: '/v1' })
      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.get('https://external-api.com/data')

      expect(mockFetchJson).toHaveBeenCalledWith(
        'https://external-api.com/data',
        expect.objectContaining({
          method: 'GET',
        })
      )
    })
  })

  describe('auth header', () => {
    it('should include auth header when getAuthToken returns a token', async () => {
      const api = createApi({
        getAuthToken: () => 'test-token',
      })
      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.get('/todos')

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/todos',
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Headers) as Headers,
        })
      )

      const headers = mockFetchJson.mock.calls[0]?.[1]?.headers as Headers
      expect(headers.get('Authorization')).toBe('Bearer test-token')
    })

    it('should support async getAuthToken', async () => {
      const api = createApi({
        getAuthToken: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          return 'async-token'
        },
      })
      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.get('/todos')

      const headers = mockFetchJson.mock.calls[0]?.[1]?.headers as Headers
      expect(headers.get('Authorization')).toBe('Bearer async-token')
    })

    it('should not include auth header when getAuthToken returns null', async () => {
      const api = createApi({
        getAuthToken: () => null,
      })
      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.get('/todos')

      const headers = mockFetchJson.mock.calls[0]?.[1]?.headers as Headers
      expect(headers.get('Authorization')).toBeNull()
    })

    it('should not include auth header when getAuthToken is not provided', async () => {
      const api = createApi()
      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.get('/todos')

      const headers = mockFetchJson.mock.calls[0]?.[1]?.headers as Headers
      expect(headers.get('Authorization')).toBeNull()
    })
  })

  describe('HTTP methods', () => {
    it('should support POST with body', async () => {
      const api = createApi()
      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue({ id: '1' })

      const body = { title: 'Test todo' }
      await api.post('/todos', body)

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/todos',
        expect.objectContaining({
          method: 'POST',
          body,
        })
      )
    })

    it('should support PUT with body', async () => {
      const api = createApi()
      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue({ id: '1' })

      const body = { title: 'Updated todo' }
      await api.put('/todos/1', body)

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/todos/1',
        expect.objectContaining({
          method: 'PUT',
          body,
        })
      )
    })

    it('should support PATCH with body', async () => {
      const api = createApi()
      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue({ id: '1' })

      const body = { completed: true }
      await api.patch('/todos/1', body)

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/todos/1',
        expect.objectContaining({
          method: 'PATCH',
          body,
        })
      )
    })

    it('should support DELETE', async () => {
      const api = createApi()
      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue(null)

      await api.del('/todos/1')

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/todos/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('query parameters', () => {
    it('should append query params to URL', async () => {
      const api = createApi()
      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue([])

      await api.get('/todos', {
        params: { status: 'active', limit: 10 },
      })

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/todos?status=active&limit=10',
        expect.any(Object)
      )
    })

    it('should handle existing query params in URL', async () => {
      const api = createApi()
      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue([])

      await api.get('/todos?sort=date', {
        params: { status: 'active' },
      })

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/todos?sort=date&status=active',
        expect.any(Object)
      )
    })

    it('should skip undefined and null params', async () => {
      const api = createApi()
      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue([])

      await api.get('/todos', {
        params: {
          status: 'active',
          limit: undefined,
          offset: null as unknown as undefined,
          page: 1,
        },
      })

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/todos?status=active&page=1',
        expect.any(Object)
      )
    })

    it('should handle boolean params', async () => {
      const api = createApi()
      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue([])

      await api.get('/todos', {
        params: { active: true, archived: false },
      })

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/todos?active=true&archived=false',
        expect.any(Object)
      )
    })
  })

  describe('abort signal', () => {
    it('should pass abort signal to fetchJson', async () => {
      const api = createApi()
      const mockFetchJson = vi.mocked(fetchJson)
      mockFetchJson.mockResolvedValue({ data: 'test' })

      const controller = new AbortController()
      await api.get('/todos', { signal: controller.signal })

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/todos',
        expect.objectContaining({
          signal: controller.signal,
        })
      )
    })

    it('should propagate abort errors', async () => {
      const api = createApi()
      const mockFetchJson = vi.mocked(fetchJson)

      const abortError = new DOMException('Aborted', 'AbortError')
      mockFetchJson.mockRejectedValue(abortError)

      const controller = new AbortController()
      controller.abort()

      await expect(
        api.get('/todos', { signal: controller.signal })
      ).rejects.toThrow('Aborted')
    })
  })

  describe('retry behavior (via fetchJson)', () => {
    it('should not retry on 4xx errors', async () => {
      const api = createApi()
      const mockFetchJson = vi.mocked(fetchJson)

      const error = new Error('Not Found')
      Object.assign(error, { status: 404 })
      mockFetchJson.mockRejectedValue(error)

      await expect(api.get('/todos')).rejects.toThrow('Not Found')

      // fetchJson should only be called once (no retry)
      expect(mockFetchJson).toHaveBeenCalledTimes(1)
    })
  })
})

describe('qs helper', () => {
  it('should serialize simple params', () => {
    const result = qs({ page: 1, limit: 10 })
    expect(result).toBe('page=1&limit=10')
  })

  it('should handle boolean values', () => {
    const result = qs({ active: true, archived: false })
    expect(result).toBe('active=true&archived=false')
  })

  it('should skip undefined values', () => {
    const result = qs({
      page: 1,
      limit: undefined,
      status: 'active',
    })
    expect(result).toBe('page=1&status=active')
  })

  it('should handle empty strings as valid', () => {
    const result = qs({
      q: '',
      page: 1,
    })
    expect(result).toBe('page=1')
  })

  it('should encode special characters', () => {
    const result = qs({
      query: 'hello world',
      filter: 'status=active',
    })
    expect(result).toBe('query=hello+world&filter=status%3Dactive')
  })

  it('should return empty string for empty object', () => {
    const result = qs({})
    expect(result).toBe('')
  })
})
