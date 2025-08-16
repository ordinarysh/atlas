import {
  TodoCreateSchema,
  TodoSchema,
  TodosListSchema,
  TodoUpdateSchema,
  type Todo,
  type TodoCreate,
  type TodoUpdate,
} from '@atlas/todos-domain'
import { fetchJson } from './fetch'

/**
 * Fetches all todos from the API.
 */
export async function getTodos(): Promise<Todo[]> {
  const response = await fetchJson('/api/todos')
  return TodosListSchema.parse(response)
}

/**
 * Creates a new todo.
 */
export async function createTodo(input: TodoCreate): Promise<Todo> {
  // Validate input before sending
  const validated = TodoCreateSchema.parse(input)

  const response = await fetchJson('/api/todos', {
    method: 'POST',
    body: validated,
  })

  return TodoSchema.parse(response)
}

/**
 * Updates an existing todo.
 */
export async function updateTodo(id: string, patch: TodoUpdate): Promise<Todo> {
  // Validate input before sending
  const validated = TodoUpdateSchema.parse(patch)

  const response = await fetchJson(`/api/todos/${id}`, {
    method: 'PATCH',
    body: validated,
  })

  return TodoSchema.parse(response)
}

/**
 * Deletes a todo.
 */
export async function deleteTodo(id: string): Promise<{ success: boolean }> {
  // fetchJson returns { success: true } for 204 responses
  return fetchJson<{ success: boolean }>(`/api/todos/${id}`, {
    method: 'DELETE',
  })
}
