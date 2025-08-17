# Purpose

Type-safe HTTP client with built-in Zod validation, authentication support, and React Query integration for seamless API communication.

## Public Surface

- **API Factory**: `createApi()` for creating configured client instances
- **HTTP Methods**: `get()`, `post()`, `put()`, `delete()` with full TypeScript support
- **Request Options**: Query parameters, headers, abort signals, timeout configuration
- **Response Types**: Automatic JSON parsing with type safety
- **Auth Integration**: Async token injection and automatic retry on auth failures

## Responsibilities

- **HTTP Communication**: Making API requests with proper error handling
- **Type Safety**: Full TypeScript support with automatic type inference
- **Request/Response Validation**: Optional Zod schema validation
- **Authentication**: Automatic token injection and refresh handling
- **Request Cancellation**: AbortController support for canceling requests
- **Query Integration**: Seamless React Query compatibility

**What doesn't belong here:**
- Business logic (belongs in domains/)
- Authentication implementation (belongs in packages/api-auth)
- Data caching beyond HTTP layer (belongs in packages/query)

## Extension Points

### Creating an API Client

```typescript
// lib/api.ts
import { createApi } from '@atlas/api-client'

export const api = createApi({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  getAuthToken: async () => {
    // Return auth token from storage/context
    return localStorage.getItem('authToken')
  },
  onAuthError: async () => {
    // Handle auth failures (redirect, refresh token, etc.)
    window.location.href = '/login'
  }
})
```

### Making API Requests

```typescript
// Basic requests
const health = await api.get('/health')
const profile = await api.get<UserProfile>('/auth/me')

// With query parameters
const projects = await api.get<Project[]>('/projects', {
  params: { status: 'active', limit: 10 }
})

// Creating resources
const newProject = await api.post<Project>('/projects', {
  name: 'New Project',
  description: 'Project description'
})

// Updating resources
const updated = await api.put<Project>(`/projects/${id}`, {
  status: 'completed'
})

// Deleting resources
await api.delete(`/projects/${id}`)
```

### Request Configuration

```typescript
// Custom headers
const data = await api.get('/api/data', {
  headers: {
    'X-Custom-Header': 'value'
  }
})

// Request timeout
const data = await api.get('/api/data', {
  timeout: 5000 // 5 seconds
})

// Request cancellation
const controller = new AbortController()
const data = await api.get('/api/data', {
  signal: controller.signal
})

// Cancel the request
controller.abort()
```

### React Query Integration

```typescript
// Query hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('/projects')
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => api.get<Project>(`/projects/${id}`),
    enabled: !!id
  })
}

// Mutation hooks
export function useCreateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateProjectInput) => 
      api.post<Project>('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })
}
```

### Error Handling

```typescript
import { ApiError, NetworkError } from '@atlas/api-client'

try {
  const data = await api.get('/api/data')
} catch (error) {
  if (error instanceof ApiError) {
    // API returned error response
    console.log('API Error:', error.status, error.message)
    console.log('Response data:', error.data)
  } else if (error instanceof NetworkError) {
    // Network/timeout error
    console.log('Network Error:', error.message)
  } else {
    // Other error
    console.log('Unknown Error:', error)
  }
}
```

### Custom Configuration

```typescript
// Advanced client configuration
const api = createApi({
  baseUrl: '/api',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  validateStatus: (status) => status >= 200 && status < 300,
  transformRequest: (data) => {
    // Custom request transformation
    return JSON.stringify(data)
  },
  transformResponse: (data) => {
    // Custom response transformation
    return data
  }
})
```

### Schema Validation

```typescript
import { z } from 'zod'

const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['draft', 'active', 'completed'])
})

// Validate responses automatically
const api = createApi({
  baseUrl: '/api',
  validateResponse: true,
  schemas: {
    '/projects': {
      GET: z.array(ProjectSchema),
      POST: ProjectSchema
    }
  }
})

// Response will be validated against schema
const projects = await api.get('/projects') // Type: Project[]
```

## Testing

### Mock API Client
```typescript
// __tests__/utils/mock-api.ts
import { createMockApi } from '@atlas/api-client/testing'

export const mockApi = createMockApi({
  '/health': { status: 'healthy' },
  '/auth/me': { id: '1', name: 'Test User' },
  '/projects': [
    { id: '1', name: 'Test Project', status: 'active' }
  ]
})
```

### Unit Testing
```typescript
// __tests__/api-client.test.ts
import { createApi } from '@atlas/api-client'

describe('API Client', () => {
  let api: ReturnType<typeof createApi>
  
  beforeEach(() => {
    api = createApi({
      baseUrl: 'https://api.test',
      getAuthToken: async () => 'mock-token'
    })
  })
  
  it('makes GET requests', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ data: 'test' }))
    
    const response = await api.get('/test')
    
    expect(response).toEqual({ data: 'test' })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/test',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token'
        })
      })
    )
  })
  
  it('handles API errors', async () => {
    fetchMock.mockRejectOnce(new Error('Network error'))
    
    await expect(api.get('/test')).rejects.toThrow('Network error')
  })
})
```

### Integration Testing
```typescript
// __tests__/integration/api.test.ts
describe('API Integration', () => {
  it('authenticates and fetches data', async () => {
    const api = createApi({
      baseUrl: process.env.TEST_API_URL,
      getAuthToken: async () => process.env.TEST_TOKEN
    })
    
    const profile = await api.get('/auth/me')
    expect(profile).toHaveProperty('id')
    
    const projects = await api.get('/projects')
    expect(Array.isArray(projects)).toBe(true)
  })
})
```

### Commands
```bash
# Run all tests
pnpm test

# Run specific tests
pnpm test api-client.test.ts

# Integration tests
pnpm test:integration

# Watch mode
pnpm test:watch
```

## Links

- **Authentication**: [../api-auth/README.md](../api-auth/README.md)
- **Query Utilities**: [../query/README.md](../query/README.md)
- **API Overview**: [../../docs/api-overview.md](../../docs/api-overview.md)
- **Architecture**: [../../docs/architecture.md](../../docs/architecture.md)

*Last reviewed: 2025-08-16*