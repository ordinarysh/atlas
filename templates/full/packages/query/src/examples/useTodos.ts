"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { fetchJson } from "@atlas/api-client";
import { invalidate } from "../keys";
import { todoKeys } from "./keys";
import {
  TodoSchema,
  TodosResponseSchema,
  type CreateTodoInput,
  type Todo,
  type TodoFilters,
  type TodosResponse,
  type UpdateTodoInput,
} from "./types";

/**
 * Hook to fetch todos list with filters
 *
 * @example
 * ```tsx
 * function TodoList() {
 *   const { data, isLoading, error } = useTodos({
 *     status: 'active'
 *   })
 *
 *   if (isLoading) return <Spinner />
 *   if (error) return <Error message={error.message} />
 *
 *   return (
 *     <ul>
 *       {data?.todos.map(todo => (
 *         <TodoItem key={todo.id} todo={todo} />
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useTodos(
  filters?: TodoFilters,
  options?: Omit<UseQueryOptions<TodosResponse>, "queryKey" | "queryFn">,
): ReturnType<typeof useQuery<TodosResponse>> {
  return useQuery({
    queryKey: todoKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== "all") {
        params.set("status", filters.status);
      }
      if (filters?.search) {
        params.set("search", filters.search);
      }
      if (filters?.userId) {
        params.set("userId", filters.userId);
      }

      const url = params.toString() ? `/api/todos?${params.toString()}` : "/api/todos";

      return fetchJson<TodosResponse>(url, {
        schema: TodosResponseSchema,
      });
    },
    ...options,
  });
}

/**
 * Hook to fetch a single todo by ID
 */
export function useTodo(
  id: string,
  options?: Omit<UseQueryOptions<Todo>, "queryKey" | "queryFn">,
): ReturnType<typeof useQuery<Todo>> {
  return useQuery({
    queryKey: todoKeys.byId(id),
    queryFn: () =>
      fetchJson<Todo>(`/api/todos/${id}`, {
        schema: TodoSchema,
      }),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to create a new todo with optimistic updates
 *
 * @example
 * ```tsx
 * function CreateTodo() {
 *   const createTodo = useCreateTodo()
 *
 *   const handleSubmit = (data: CreateTodoInput) => {
 *     createTodo.mutate(data, {
 *       onSuccess: () => {
 *         toast.success('Todo created!')
 *         form.reset()
 *       },
 *       onError: (error) => {
 *         toast.error(error.message)
 *       }
 *     })
 *   }
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input name="title" required />
 *       <button type="submit" disabled={createTodo.isPending}>
 *         {createTodo.isPending ? 'Creating...' : 'Create'}
 *       </button>
 *     </form>
 *   )
 * }
 * ```
 */
export function useCreateTodo(
  options?: UseMutationOptions<Todo, Error, CreateTodoInput>,
): ReturnType<typeof useMutation<Todo, Error, CreateTodoInput>> {
  const queryClient = useQueryClient();

  return useMutation<Todo, Error, CreateTodoInput>({
    mutationFn: (data: CreateTodoInput) =>
      fetchJson<Todo>("/api/todos", {
        method: "POST",
        body: data,
        schema: TodoSchema,
      }),

    // Optimistic update
    onMutate: async (newTodo) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: todoKeys.all() });

      // Snapshot previous values
      const previousTodos = queryClient.getQueriesData<TodosResponse>({
        queryKey: todoKeys.list(),
      });

      // Optimistically update all matching queries
      queryClient.setQueriesData<TodosResponse>({ queryKey: todoKeys.list() }, (old) => {
        if (!old) return old;

        const optimisticTodo: Todo = {
          id: `temp-${Date.now().toString()}`,
          title: newTodo.title,
          completed: newTodo.completed || false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return {
          ...old,
          todos: [optimisticTodo, ...old.todos],
          total: old.total + 1,
        };
      });

      // Return context for rollback
      return { previousTodos };
    },

    // Rollback on error
    onError: (_error, _newTodo, context) => {
      const typedContext = context as
        | {
            previousTodos?: Array<[readonly unknown[], TodosResponse | undefined]>;
          }
        | undefined;
      if (typedContext?.previousTodos) {
        for (const [queryKey, data] of typedContext.previousTodos) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },

    // Refetch after success or error
    onSettled: () => {
      void invalidate.scope("todos").all();
    },

    ...options,
  });
}

/**
 * Hook to update a todo
 */
export function useUpdateTodo(
  options?: UseMutationOptions<Todo, Error, { id: string; data: UpdateTodoInput }>,
): ReturnType<typeof useMutation<Todo, Error, { id: string; data: UpdateTodoInput }>> {
  const queryClient = useQueryClient();

  return useMutation<Todo, Error, { id: string; data: UpdateTodoInput }>({
    mutationFn: ({ id, data }) =>
      fetchJson<Todo>(`/api/todos/${id}`, {
        method: "PATCH",
        body: data,
        schema: TodoSchema,
      }),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.byId(id) });

      const previousTodo = queryClient.getQueryData<Todo>(todoKeys.byId(id));

      // Update single todo query
      queryClient.setQueryData<Todo>(todoKeys.byId(id), (old) =>
        old ? { ...old, ...data, updatedAt: new Date().toISOString() } : old,
      );

      // Update in list queries
      queryClient.setQueriesData<TodosResponse>({ queryKey: todoKeys.list() }, (old) => {
        if (!old) return old;
        return {
          ...old,
          todos: old.todos.map((todo) =>
            todo.id === id ? { ...todo, ...data, updatedAt: new Date().toISOString() } : todo,
          ),
        };
      });

      return { previousTodo } as { previousTodo: Todo | undefined };
    },

    onError: (_error, { id }, context) => {
      const typedContext = context as { previousTodo?: Todo } | undefined;
      if (typedContext?.previousTodo) {
        queryClient.setQueryData(todoKeys.byId(id), typedContext.previousTodo);
      }
      // Also rollback list queries
      void invalidate.scope("todos").all();
    },

    onSettled: async (_data, _error, { id }) => {
      await queryClient.invalidateQueries({ queryKey: todoKeys.byId(id) });
      await queryClient.invalidateQueries({ queryKey: todoKeys.list() });
    },

    ...options,
  });
}

/**
 * Hook to delete a todo
 */
export function useDeleteTodo(
  options?: UseMutationOptions<undefined, Error, string>,
): ReturnType<typeof useMutation<undefined, Error, string>> {
  const queryClient = useQueryClient();

  return useMutation<undefined, Error, string>({
    mutationFn: async (id: string) => {
      await fetchJson<{ success: boolean }>(`/api/todos/${id}`, {
        method: "DELETE",
      });
    },

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.all() });

      const previousTodos = queryClient.getQueriesData<TodosResponse>({
        queryKey: todoKeys.list(),
      });

      // Remove from list queries
      queryClient.setQueriesData<TodosResponse>({ queryKey: todoKeys.list() }, (old) => {
        if (!old) return old;
        return {
          ...old,
          todos: old.todos.filter((todo) => todo.id !== id),
          total: old.total - 1,
        };
      });

      // Remove single todo query
      queryClient.removeQueries({ queryKey: todoKeys.byId(id) });

      return { previousTodos };
    },

    onError: (_error, _id, context) => {
      const typedContext = context as
        | { previousTodos?: Array<[readonly unknown[], unknown]> }
        | undefined;
      if (typedContext?.previousTodos) {
        for (const [queryKey, data] of typedContext.previousTodos) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },

    onSettled: () => {
      void invalidate.scope("todos").all();
    },

    ...options,
  });
}

/**
 * Hook to toggle todo completion status
 */
export function useToggleTodo(): ReturnType<typeof useMutation<Todo, Error, Todo>> {
  const updateTodo = useUpdateTodo();

  return useMutation({
    mutationFn: (todo: Todo) =>
      updateTodo.mutateAsync({
        id: todo.id,
        data: { completed: !todo.completed },
      }),
  });
}
