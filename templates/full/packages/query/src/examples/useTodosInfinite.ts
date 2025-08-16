"use client";

import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryOptions,
} from "@tanstack/react-query";
import { z } from "zod";
import { fetchJson } from "@atlas/api-client";
import { todoKeys } from "./keys";
import { TodosResponseSchema, type Todo, type TodoFilters, type TodosResponse } from "./types";

interface TodosInfiniteResponse extends TodosResponse {
  nextCursor?: string | null;
  hasMore: boolean;
}

const TodosInfiniteResponseSchema = TodosResponseSchema.extend({
  nextCursor: z.string().nullable().optional(),
  hasMore: z.boolean(),
});

/**
 * Hook for infinite scrolling todos list
 *
 * @example
 * ```tsx
 * function InfiniteTodoList() {
 *   const {
 *     data,
 *     fetchNextPage,
 *     hasNextPage,
 *     isFetchingNextPage,
 *     isLoading,
 *     error,
 *   } = useTodosInfinite({ status: 'active' })
 *
 *   const todos = data?.pages.flatMap(page => page.todos) ?? []
 *
 *   return (
 *     <div>
 *       {isLoading ? (
 *         <Spinner />
 *       ) : error ? (
 *         <Error message={error.message} />
 *       ) : (
 *         <>
 *           <ul>
 *             {todos.map(todo => (
 *               <TodoItem key={todo.id} todo={todo} />
 *             ))}
 *           </ul>
 *
 *           {hasNextPage && (
 *             <button
 *               onClick={() => fetchNextPage()}
 *               disabled={isFetchingNextPage}
 *             >
 *               {isFetchingNextPage ? 'Loading more...' : 'Load more'}
 *             </button>
 *           )}
 *         </>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example With Intersection Observer for auto-loading
 * ```tsx
 * function AutoLoadTodoList() {
 *   const {
 *     data,
 *     fetchNextPage,
 *     hasNextPage,
 *     isFetchingNextPage,
 *   } = useTodosInfinite()
 *
 *   const loadMoreRef = useRef<HTMLDivElement>(null)
 *
 *   useEffect(() => {
 *     if (!loadMoreRef.current) return
 *
 *     const observer = new IntersectionObserver(
 *       (entries) => {
 *         if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
 *           fetchNextPage()
 *         }
 *       },
 *       { threshold: 0.5 }
 *     )
 *
 *     observer.observe(loadMoreRef.current)
 *
 *     return () => observer.disconnect()
 *   }, [hasNextPage, isFetchingNextPage, fetchNextPage])
 *
 *   const todos = data?.pages.flatMap(page => page.todos) ?? []
 *
 *   return (
 *     <div>
 *       <ul>
 *         {todos.map(todo => (
 *           <TodoItem key={todo.id} todo={todo} />
 *         ))}
 *       </ul>
 *
 *       <div ref={loadMoreRef} style={{ height: 20 }}>
 *         {isFetchingNextPage && <Spinner />}
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 */
export function useTodosInfinite(
  filters?: TodoFilters,
  options?: Omit<
    UseInfiniteQueryOptions<
      TodosInfiniteResponse,
      Error,
      InfiniteData<TodosInfiniteResponse>,
      readonly unknown[],
      string | undefined
    >,
    "queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"
  >,
): ReturnType<
  typeof useInfiniteQuery<
    TodosInfiniteResponse,
    Error,
    InfiniteData<TodosInfiniteResponse>,
    readonly unknown[],
    string | undefined
  >
> {
  return useInfiniteQuery({
    queryKey: todoKeys.infinite(filters),

    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();

      // Add cursor for pagination
      if (pageParam) {
        params.set("cursor", pageParam);
      }

      // Add filters
      if (filters?.status && filters.status !== "all") {
        params.set("status", filters.status);
      }
      if (filters?.search) {
        params.set("search", filters.search);
      }
      if (filters?.userId) {
        params.set("userId", filters.userId);
      }

      // Set page size
      params.set("limit", "20");

      return fetchJson<TodosInfiniteResponse>(`/api/todos?${params.toString()}`, {
        schema: TodosInfiniteResponseSchema,
      });
    },

    initialPageParam: undefined as string | undefined,

    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined;
    },

    // Keep previous data while fetching new pages
    placeholderData: (previousData) => previousData,

    ...options,
  });
}

/**
 * Hook to get flattened todos from infinite query
 * Provides a simpler interface when you don't need pagination controls
 */
export function useFlatTodosInfinite(
  filters?: TodoFilters,
): ReturnType<typeof useTodosInfinite> & { todos: Todo[]; totalCount: number } {
  const query = useTodosInfinite(filters);

  return {
    ...query,
    todos: query.data?.pages.flatMap((page) => page.todos) ?? [],
    totalCount: query.data?.pages[0]?.total ?? 0,
  };
}
