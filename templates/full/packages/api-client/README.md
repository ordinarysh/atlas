# @atlas/api-client

Type-safe API client for Atlas applications with built-in Zod validation and React Query support.

## Features

- 🚀 Type-safe API calls with TypeScript
- ✅ Automatic request/response validation with Zod
- 🔄 Built on `@atlas/query/fetchJson` (includes retries for 5xx/network errors)
- 🎯 Query parameter serialization
- 🔐 Async auth token support
- ⚡ Abort signal support
- 📦 Zero external dependencies (except Zod)

## Installation

```bash
pnpm add @atlas/api-client
```

## Basic Usage

```typescript
import { createApi } from '@atlas/api-client'

// Create API client
const api = createApi({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  getAuthToken: async () => localStorage.getItem('token')
})

// GET request with type safety
const todos = await api.get<Todo[]>('/todos')

// POST with body
const newTodo = await api.post<Todo>('/todos', {
  title: 'Learn TypeScript',
  completed: false
})

// Query parameters
const filtered = await api.get<Todo[]>('/todos', {
  params: { status: 'active', limit: 10 }
})

// Abort support
const controller = new AbortController()
const data = await api.get('/data', { 
  signal: controller.signal 
})
```

## With React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'
import { createApi, listTodos, createTodo } from '@atlas/api-client'

const api = createApi({ baseUrl: '/api' })

// Query
const { data, isLoading } = useQuery({
  queryKey: ['todos'],
  queryFn: () => api.get<Todo[]>('/todos')
})

// Or use resource functions
const { data } = useQuery({
  queryKey: ['todos'],
  queryFn: listTodos
})

// Mutation
const mutation = useMutation({
  mutationFn: (input: CreateTodoInput) => createTodo(input),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  }
})
```

## Resource Functions

Pre-built resource functions with Zod validation:

```typescript
import { 
  listTodos, 
  createTodo,
  TodoSchema,
  type Todo 
} from '@atlas/api-client'

// Fetch todos with automatic validation
const todos = await listTodos()

// Create with input validation
const newTodo = await createTodo({
  title: 'New Task',
  completed: false
})

// Use schemas for custom validation
const validTodo = TodoSchema.parse(unknownData)
```

## Advanced Configuration

### Async Authentication

```typescript
const api = createApi({
  baseUrl: 'https://api.example.com',
  getAuthToken: async () => {
    // Can be async - fetch from secure storage, refresh tokens, etc.
    const token = await secureStorage.getItem('authToken')
    return token
  }
})
```

### Absolute URLs

The client handles both relative and absolute URLs:

```typescript
const api = createApi({ baseUrl: 'https://api.example.com' })

// Uses base URL
await api.get('/todos') // https://api.example.com/todos

// Absolute URL bypasses base
await api.get('https://other-api.com/data') // https://other-api.com/data
```

### Query Parameters

```typescript
import { qs } from '@atlas/api-client'

// Using the API client
await api.get('/search', {
  params: {
    q: 'typescript',
    limit: 10,
    active: true
  }
})

// Or use the qs helper directly
const queryString = qs({ page: 1, size: 20 })
// Returns: "page=1&size=20"
```

## Error Handling

Errors from `fetchJson` include status codes and response data:

```typescript
try {
  const data = await api.get('/protected')
} catch (error) {
  if (error instanceof FetchError) {
    console.log(error.status) // 401
    console.log(error.data) // Server error response
  }
}
```

## Retry Policy

Built on `@atlas/query/fetchJson`:
- ✅ Retries on 5xx errors (up to 2 attempts)
- ✅ Retries on network failures
- ❌ No retry on 4xx client errors
- ❌ No retry on aborted requests

## TypeScript

Full TypeScript support with type inference:

```typescript
// Explicit typing
const todos = await api.get<Todo[]>('/todos')

// With Zod schemas
const response = await fetchJson('/api/todos', {
  schema: TodosResponseSchema // Validates and types response
})
```

## API Reference

### `createApi(config)`
Creates a new API client instance.

- `config.baseUrl` - Base URL for requests
- `config.getAuthToken` - Function returning auth token (can be async)

### `api.get(path, options)`
### `api.post(path, body, options)`
### `api.put(path, body, options)`
### `api.patch(path, body, options)`
### `api.del(path, options)`

All methods accept:
- `path` - URL path (relative or absolute)
- `body` - Request body (for POST/PUT/PATCH)
- `options` - Extended RequestInit with:
  - `params` - Query parameters
  - `signal` - AbortSignal
  - `headers` - Custom headers
  - All other `fetch` options

### `qs(params)`
Serializes an object to URL query string.