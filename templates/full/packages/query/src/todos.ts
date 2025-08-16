"use client";

import { createTodo, deleteTodo, getTodos, updateTodo } from "@atlas/api-client/resources/todos";
import { todoKeys } from "@atlas/todos-domain";
import type { Todo, TodoCreate, TodoUpdate } from "@atlas/todos-domain";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";

/**
 * Hook to fetch all todos.
 */
export function useTodos(
  options?: Omit<UseQueryOptions<Todo[]>, "queryKey" | "queryFn">,
): ReturnType<typeof useQuery<Todo[]>> {
  return useQuery({
    queryKey: todoKeys.list(),
    queryFn: getTodos,
    staleTime: 1000 * 60, // 1 minute
    retry: 2,
    ...options,
  });
}

/**
 * Hook to create a new todo.
 */
export function useCreateTodo(
  options?: UseMutationOptions<Todo, Error, TodoCreate>,
): ReturnType<typeof useMutation<Todo, Error, TodoCreate>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTodo,
    onSuccess: (data, variables, context) => {
      // Invalidate and refetch todos list
      void queryClient.invalidateQueries({ queryKey: todoKeys.list() });

      // Call user's onSuccess if provided
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Hook to update a todo.
 */
export function useUpdateTodo(
  options?: UseMutationOptions<Todo, Error, { id: string; patch: TodoUpdate }>,
): ReturnType<typeof useMutation<Todo, Error, { id: string; patch: TodoUpdate }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }) => updateTodo(id, patch),
    onSuccess: (data, variables, context) => {
      // Invalidate specific todo and list
      void queryClient.invalidateQueries({ queryKey: todoKeys.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: todoKeys.list() });

      // Call user's onSuccess if provided
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Hook to delete a todo.
 */
export function useDeleteTodo(
  options?: UseMutationOptions<{ success: boolean }, Error, string>,
): ReturnType<typeof useMutation<{ success: boolean }, Error, string>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTodo,
    onSuccess: (data, variables, context) => {
      // Invalidate todos list
      void queryClient.invalidateQueries({ queryKey: todoKeys.list() });

      // Call user's onSuccess if provided
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}
