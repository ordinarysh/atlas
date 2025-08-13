/**
 * Example: Todo queries and mutations
 *
 * This demonstrates best practices for organizing queries and mutations
 * using TanStack Query with our custom utilities.
 */

import { type PaginatedResponse } from '@atlas/api-client'
import {
  createKeys,
  useInfiniteQuery,
  useInvalidatingMutation,
  useMutation,
  useOptimisticMutation,
  useQuery,
} from '@atlas/query'
import { makeApi } from '@/lib/api'

// Types
export interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  createdAt: string
  updatedAt: string
  userId: string
}

export interface CreateTodoInput {
  title: string
  description?: string
}

export interface UpdateTodoInput extends Partial<CreateTodoInput> {
  completed?: boolean
}

// Query keys
export const todoKeys = createKeys('todos', {
  list: (filters?: { completed?: boolean; userId?: string }) => ({ filters }),
  detail: (id: string) => ({ id }),
  infinite: (filters?: { completed?: boolean }) => ({ filters }),
})

// Query hooks
/**
 * Fetch all todos
 */
export function useTodos(filters?: { completed?: boolean; userId?: string }) {
  return useQuery({
    queryKey: todoKeys.list(filters),
    queryFn: () => makeApi().get<Todo[]>('/todos', { params: filters }),
  })
}

/**
 * Fetch single todo
 */
export function useTodo(id: string) {
  return useQuery({
    queryKey: todoKeys.detail(id),
    queryFn: () => makeApi().get<Todo>(`/todos/${id}`),
    enabled: !!id, // Only fetch if ID is provided
  })
}

/**
 * Infinite scroll todos
 */
export function useInfiniteTodos(filters?: { completed?: boolean }) {
  return useInfiniteQuery({
    queryKey: todoKeys.infinite(filters),
    queryFn: ({ pageParam }) =>
      makeApi().get<PaginatedResponse<Todo>>('/todos', {
        params: {
          ...filters,
          page: pageParam,
          pageSize: 20,
        },
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
  })
}

// Mutation hooks
/**
 * Create todo with optimistic update
 */
export function useCreateTodo() {
  return useOptimisticMutation<Todo, Error, CreateTodoInput, Todo[]>({
    mutationFn: (data: CreateTodoInput) => makeApi().post<Todo>('/todos', data),
    queryKey: todoKeys.all(),
    updateFn: (oldTodos: Todo[] = [], newTodo: CreateTodoInput) => {
      // Optimistically add the new todo
      const optimisticTodo: Todo = {
        id: `temp-${Date.now()}`,
        ...newTodo,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 'current-user', // Would come from auth context
      }
      return [...oldTodos, optimisticTodo]
    },
  })
}

/**
 * Update todo with optimistic update
 */
export function useUpdateTodo(id: string) {
  return useOptimisticMutation<Todo, Error, UpdateTodoInput, Todo[]>({
    mutationFn: (data: UpdateTodoInput) =>
      makeApi().patch<Todo>(`/todos/${id}`, data),
    queryKey: todoKeys.all(),
    updateFn: (oldTodos: Todo[] = [], updates: UpdateTodoInput) => {
      // Optimistically update the todo
      return oldTodos.map((todo) =>
        todo.id === id
          ? { ...todo, ...updates, updatedAt: new Date().toISOString() }
          : todo
      )
    },
  })
}

/**
 * Delete todo with cache invalidation
 */
export function useDeleteTodo() {
  return useInvalidatingMutation<void, Error, string>({
    mutationFn: (id: string) => makeApi().del<void>(`/todos/${id}`),
    invalidateKeys: [todoKeys.all()],
    onSuccess: (_: unknown, id: string) => {
      // You could also optimistically remove from cache here
      console.log(`Todo ${id} deleted successfully`)
    },
  })
}

/**
 * Toggle todo completion status
 */
export function useToggleTodo() {
  return useOptimisticMutation<Todo, Error, string, Todo[]>({
    mutationFn: async (id: string) => {
      // First get the current todo
      const todo = await makeApi().get<Todo>(`/todos/${id}`)
      // Toggle completion
      return makeApi().patch<Todo>(`/todos/${id}`, {
        completed: !todo.completed,
      })
    },
    queryKey: todoKeys.all(),
    updateFn: (oldTodos: Todo[] = [], id: string) => {
      // Optimistically toggle
      return oldTodos.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              completed: !todo.completed,
              updatedAt: new Date().toISOString(),
            }
          : todo
      )
    },
  })
}

/**
 * Bulk update todos
 */
export function useBulkUpdateTodos() {
  return useMutation({
    mutationFn: (updates: Array<{ id: string; data: UpdateTodoInput }>) =>
      Promise.all(
        updates.map(({ id, data }) =>
          makeApi().patch<Todo>(`/todos/${id}`, data)
        )
      ),
    onSuccess: () => {
      // Invalidate all todo queries
      // This is handled by the mutation but you could do it manually too
    },
  })
}
