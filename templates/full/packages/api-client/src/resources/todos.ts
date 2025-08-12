import { fetchJson } from '@atlas/query'
import { z } from 'zod'

/**
 * Schema for a single Todo item
 */
export const TodoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
})

/**
 * Schema for an array of Todos
 */
export const TodosResponseSchema = z.array(TodoSchema)

/**
 * Schema for creating a new Todo
 */
export const CreateTodoInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  completed: z.boolean().optional().default(false),
})

// Type exports using Zod inference
export type Todo = z.infer<typeof TodoSchema>
export type TodosResponse = z.infer<typeof TodosResponseSchema>
export type CreateTodoInput = z.infer<typeof CreateTodoInputSchema>

/**
 * Fetches a list of todos from the API
 *
 * @param baseUrl - Optional base URL for the API
 * @returns Promise resolving to an array of todos
 *
 * @example
 * ```ts
 * const todos = await listTodos('https://api.example.com')
 *
 * // Use with React Query
 * const { data } = useQuery({
 *   queryKey: ['todos'],
 *   queryFn: () => listTodos()
 * })
 * ```
 */
export async function listTodos(baseUrl = ''): Promise<TodosResponse> {
  const url = baseUrl ? `${baseUrl}/api/todos` : '/api/todos'
  return fetchJson(url, {
    method: 'GET',
    schema: TodosResponseSchema,
  })
}

/**
 * Creates a new todo
 *
 * @param input - The todo data to create
 * @param baseUrl - Optional base URL for the API
 * @returns Promise resolving to the created todo
 *
 * @example
 * ```ts
 * const newTodo = await createTodo({
 *   title: 'Learn TypeScript',
 *   completed: false
 * })
 *
 * // Use with React Query mutations
 * const mutation = useMutation({
 *   mutationFn: (input: CreateTodoInput) => createTodo(input)
 * })
 * ```
 */
export async function createTodo(
  input: CreateTodoInput,
  baseUrl = ''
): Promise<Todo> {
  // Validate input before sending
  const validatedInput = CreateTodoInputSchema.parse(input)

  const url = baseUrl ? `${baseUrl}/api/todos` : '/api/todos'
  return fetchJson(url, {
    method: 'POST',
    body: validatedInput,
    schema: TodoSchema,
  })
}
