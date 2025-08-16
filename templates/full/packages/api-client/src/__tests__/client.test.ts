import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApi, qs } from '../client'
import { fetchJson } from '../fetch'

// Mock the fetch module
vi.mock('../fetch', () => ({
  fetchJson: vi.fn(),
}))

const mockFetchJson = vi.mocked(fetchJson)

describe('createApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('base URL joining', () => {
    it('should correctly join base URL with path', async () => {
      const api = createApi({ baseUrl: '/v1' })
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
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.get('todos')

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/v1/todos',
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should handle absolute URLs', async () => {
      const api = createApi({ baseUrl: '/v1' })
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.get('https://api.example.com/todos')

      expect(mockFetchJson).toHaveBeenCalledWith(
        'https://api.example.com/todos',
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should work without base URL', async () => {
      const api = createApi()
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.get('/todos')

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/todos',
        expect.objectContaining({
          method: 'GET',
        })
      )
    })
  })

  describe('query parameters', () => {
    it('should append query params to URL', async () => {
      const api = createApi()
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.get('/todos', {
        params: { status: 'active', limit: 10 },
      })

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/todos?status=active&limit=10',
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should handle existing query params in URL', async () => {
      const api = createApi()
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.get('/todos?sort=asc', {
        params: { status: 'active' },
      })

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/todos?sort=asc&status=active',
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should ignore null and undefined params', async () => {
      const api = createApi()
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.get('/todos', {
        params: {
          status: 'active',
          limit: undefined,
          page: null,
          filter: '',
        },
      })

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/todos?status=active',
        expect.objectContaining({
          method: 'GET',
        })
      )
    })
  })

  describe('auth token', () => {
    it('should add auth token when provided', async () => {
      const api = createApi({
        getAuthToken: () => 'test-token',
      })
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.get('/todos')

      expect(mockFetchJson).toHaveBeenCalledWith('/todos', expect.any(Object))

      const call = mockFetchJson.mock.calls[0]
      const options = call[1]
      expect(options).toHaveProperty('headers')
      const headers = options?.headers as Headers
      expect(headers.get('Authorization')).toBe('Bearer test-token')
    })

    it('should support async token retrieval', async () => {
      const api = createApi({
        getAuthToken: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          return 'async-token'
        },
      })
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.get('/todos')

      const call = mockFetchJson.mock.calls[0]
      const headers = call[1]?.headers as Headers
      expect(headers.get('Authorization')).toBe('Bearer async-token')
    })

    it('should not add auth header when token is null', async () => {
      const api = createApi({
        getAuthToken: () => null,
      })
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.get('/todos')

      const call = mockFetchJson.mock.calls[0]
      const headers = call[1]?.headers as Headers
      expect(headers.get('Authorization')).toBeNull()
    })
  })

  describe('HTTP methods', () => {
    it('should make GET requests', async () => {
      const api = createApi()
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.get('/todos')

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/todos',
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should make POST requests with body', async () => {
      const api = createApi()
      mockFetchJson.mockResolvedValue({ data: 'test' })

      const body = { title: 'New todo' }
      await api.post('/todos', body)

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/todos',
        expect.objectContaining({
          method: 'POST',
          body,
        })
      )
    })

    it('should make PUT requests with body', async () => {
      const api = createApi()
      mockFetchJson.mockResolvedValue({ data: 'test' })

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

    it('should make PATCH requests with body', async () => {
      const api = createApi()
      mockFetchJson.mockResolvedValue({ data: 'test' })

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

    it('should make DELETE requests', async () => {
      const api = createApi()
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.del('/todos/1')

      expect(mockFetchJson).toHaveBeenCalledWith(
        '/todos/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('custom headers', () => {
    it('should include custom headers', async () => {
      const api = createApi()
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.get('/todos', {
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      })

      const call = mockFetchJson.mock.calls[0]
      const headers = call[1]?.headers as Headers
      expect(headers.get('X-Custom-Header')).toBe('custom-value')
    })

    it('should set Content-Type for JSON by default', async () => {
      const api = createApi()
      mockFetchJson.mockResolvedValue({ data: 'test' })

      await api.post('/todos', { title: 'test' })

      const call = mockFetchJson.mock.calls[0]
      const headers = call[1]?.headers as Headers
      expect(headers.get('Content-Type')).toBe('application/json')
    })
  })
})

describe('qs', () => {
  it('should serialize query params', () => {
    const params = {
      status: 'active',
      limit: 10,
      featured: true,
    }

    const result = qs(params)
    expect(result).toBe('status=active&limit=10&featured=true')
  })

  it('should ignore null and undefined values', () => {
    const params = {
      status: 'active',
      limit: undefined,
      page: null,
      filter: '',
    }

    const result = qs(params)
    expect(result).toBe('status=active')
  })

  it('should handle empty object', () => {
    const result = qs({})
    expect(result).toBe('')
  })

  it('should encode special characters', () => {
    const params = {
      search: 'hello world',
      filter: 'a&b',
    }

    const result = qs(params)
    expect(result).toBe('search=hello+world&filter=a%26b')
  })
})
