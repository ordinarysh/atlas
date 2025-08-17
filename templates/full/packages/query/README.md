# Purpose

React Query utilities and patterns for data fetching, caching, and state management with built-in retry logic and error handling.

## Public Surface

- **Query Client**: Configured TanStack Query client with defaults
- **Query Hooks**: Reusable hooks for common API patterns
- **Mutation Utilities**: Optimistic updates and cache invalidation helpers
- **Error Handling**: Standardized error boundaries and retry strategies
- **Cache Management**: Query key factories and invalidation patterns

## Responsibilities

- **Data Fetching**: Centralized async state management for API calls
- **Cache Strategy**: Intelligent caching with stale-while-revalidate patterns
- **Error Recovery**: Automatic retries with exponential backoff
- **Optimistic Updates**: Immediate UI updates with rollback on failure
- **Query Coordination**: Dependent queries and parallel data fetching

**What doesn't belong here:**
- HTTP client implementation (belongs in packages/api-client)
- Business logic (belongs in domains/)
- Authentication handling (belongs in packages/api-auth)

## Extension Points

### Query Client Setup

```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'
import { createQueryClient } from '@atlas/query'

export const queryClient = createQueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes
      cacheTime: 10 * 60 * 1000,    // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
    },
    mutations: {
      retry: 1
    }
  }
})
```

### Provider Setup

```typescript
// app/layout.tsx or _app.tsx
import { QueryProvider } from '@atlas/query'
import { queryClient } from '@/lib/query-client'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider client={queryClient}>
      {children}
    </QueryProvider>
  )
}
```

### Basic Query Hooks

```typescript
// hooks/use-projects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('/projects'),
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => api.get<Project>(`/projects/${id}`),
    enabled: !!id,
    staleTime: 10 * 60 * 1000 // 10 minutes
  })
}
```

### Mutation Hooks with Optimistic Updates

```typescript
// hooks/use-project-mutations.ts
export function useCreateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateProjectInput) => 
      api.post<Project>('/projects', data),
    onMutate: async (newProject) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['projects'] })
      
      // Snapshot previous value
      const previousProjects = queryClient.getQueryData(['projects'])
      
      // Optimistically update
      queryClient.setQueryData(['projects'], (old: Project[] = []) => [
        ...old,
        { ...newProject, id: 'temp-' + Date.now(), status: 'draft' }
      ])
      
      return { previousProjects }
    },
    onError: (err, newProject, context) => {
      // Rollback on error
      queryClient.setQueryData(['projects'], context?.previousProjects)
    },
    onSettled: () => {
      // Refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectInput }) =>
      api.put<Project>(`/projects/${id}`, data),
    onSuccess: (updatedProject) => {
      // Update specific project in cache
      queryClient.setQueryData(['projects', updatedProject.id], updatedProject)
      
      // Update project in list cache
      queryClient.setQueryData(['projects'], (old: Project[] = []) =>
        old.map(project => 
          project.id === updatedProject.id ? updatedProject : project
        )
      )
    }
  })
}
```

### Dependent Queries

```typescript
// hooks/use-project-with-stats.ts
export function useProjectWithStats(projectId: string) {
  const projectQuery = useProject(projectId)
  
  const statsQuery = useQuery({
    queryKey: ['projects', projectId, 'stats'],
    queryFn: () => api.get<ProjectStats>(`/projects/${projectId}/stats`),
    enabled: !!projectQuery.data?.id, // Only fetch if project exists
    staleTime: 2 * 60 * 1000 // 2 minutes
  })
  
  return {
    project: projectQuery.data,
    stats: statsQuery.data,
    isLoading: projectQuery.isLoading || statsQuery.isLoading,
    error: projectQuery.error || statsQuery.error
  }
}
```

### Infinite Queries

```typescript
// hooks/use-infinite-projects.ts
export function useInfiniteProjects() {
  return useInfiniteQuery({
    queryKey: ['projects', 'infinite'],
    queryFn: ({ pageParam = 0 }) =>
      api.get<PaginatedResponse<Project>>('/projects', {
        params: { page: pageParam, limit: 20 }
      }),
    getNextPageParam: (lastPage) => 
      lastPage.hasMore ? lastPage.nextPage : undefined,
    staleTime: 5 * 60 * 1000
  })
}
```

### Query Key Factories

```typescript
// lib/query-keys.ts
export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.projects.lists(), { filters }] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    stats: (id: string) => [...queryKeys.projects.detail(id), 'stats'] as const
  },
  users: {
    all: ['users'] as const,
    detail: (id: string) => [...queryKeys.users.all, id] as const
  }
}
```

### Error Handling

```typescript
// components/QueryErrorBoundary.tsx
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'

export function QueryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary }) => (
            <div className="text-center p-4">
              <h2>Something went wrong</h2>
              <button 
                onClick={resetErrorBoundary}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
              >
                Try again
              </button>
            </div>
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
```

### Custom Query Utilities

```typescript
// lib/query-utils.ts
import { QueryClient } from '@tanstack/react-query'

export function prefetchProjectData(queryClient: QueryClient, projectId: string) {
  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['projects', projectId],
      queryFn: () => api.get<Project>(`/projects/${projectId}`)
    }),
    queryClient.prefetchQuery({
      queryKey: ['projects', projectId, 'stats'],
      queryFn: () => api.get<ProjectStats>(`/projects/${projectId}/stats`)
    })
  ])
}

export function invalidateProjectData(queryClient: QueryClient, projectId?: string) {
  if (projectId) {
    return queryClient.invalidateQueries({ 
      queryKey: ['projects', projectId] 
    })
  }
  return queryClient.invalidateQueries({ 
    queryKey: ['projects'] 
  })
}
```

## Testing

### Mock Query Client
```typescript
// __tests__/utils/test-query-client.ts
import { QueryClient } from '@tanstack/react-query'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
```

### Hook Testing
```typescript
// __tests__/hooks/use-projects.test.tsx
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useProjects } from '../hooks/use-projects'
import { createTestQueryClient } from './utils/test-query-client'

describe('useProjects', () => {
  let queryClient: QueryClient
  
  beforeEach(() => {
    queryClient = createTestQueryClient()
  })
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
  
  it('fetches projects successfully', async () => {
    const mockProjects = [
      { id: '1', name: 'Project 1', status: 'active' }
    ]
    
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProjects)
    })
    
    const { result } = renderHook(() => useProjects(), { wrapper })
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockProjects)
  })
})
```

### Commands
```bash
# Run all tests
pnpm test

# Run query hook tests
pnpm test hooks/

# Test with React Query devtools
pnpm dev
```

## Links

- **API Client**: [../api-client/README.md](../api-client/README.md)
- **Domain Layer**: [../../domains/README.md](../../domains/README.md)
- **Architecture**: [../../docs/architecture.md](../../docs/architecture.md)
- **Conventions**: [../../docs/conventions.md](../../docs/conventions.md)

*Last reviewed: 2025-08-16*