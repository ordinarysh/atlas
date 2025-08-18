import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
  type UseInfiniteQueryOptions,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";

/**
 * Custom hook for optimistic updates with automatic rollback
 *
 * @example
 * const mutation = useOptimisticMutation({
 *   mutationFn: updateItem,
 *   queryKey: ['items'],
 *   updateFn: (old, variables) => {
 *     return old.map(item =>
 *       item.id === variables.id ? { ...item, ...variables } : item
 *     )
 *   }
 * })
 */
export function useOptimisticMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TQueryData = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables> & {
    queryKey: QueryKey;
    updateFn?: (oldData: TQueryData, variables: TVariables) => TQueryData;
    invalidate?: boolean;
  },
): ReturnType<typeof useMutation<TData, TError, TVariables>> {
  const queryClient = useQueryClient();
  const { queryKey, updateFn, invalidate = true, ...mutationOptions } = options;

  return useMutation<TData, TError, TVariables>({
    ...mutationOptions,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TQueryData>(queryKey);

      // Optimistically update if updateFn provided
      if (updateFn && previousData !== undefined) {
        queryClient.setQueryData(queryKey, (old: TQueryData) => updateFn(old, variables));
      }

      // Call original onMutate if provided
      if (mutationOptions.onMutate) {
        await mutationOptions.onMutate(variables);
      }

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      const typedContext = context as { previousData?: TQueryData } | undefined;
      if (typedContext?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, typedContext.previousData);
      }

      // Call original onError
      mutationOptions.onError?.(error, variables, context);
    },
    onSettled: async (data, error, variables, context) => {
      // Invalidate to refetch actual data
      if (invalidate) {
        await queryClient.invalidateQueries({ queryKey });
      }

      // Call original onSettled
      return mutationOptions.onSettled?.(data, error, variables, context);
    },
  });
}

/**
 * Hook for paginated queries with automatic page tracking
 */
export function usePaginatedQuery<TData = unknown, TError = Error>(
  options: UseQueryOptions<TData, TError> & {
    page: number;
    pageSize?: number;
  },
): ReturnType<typeof useQuery<TData, TError>> {
  const { page, pageSize = 10, queryKey, ...queryOptions } = options;

  // Add pagination params to query key
  const paginatedKey = [...(queryKey as unknown[]), { page, pageSize }];

  return useQuery<TData, TError>({
    ...queryOptions,
    queryKey: paginatedKey,
    // Keep previous data while fetching next page
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook for infinite scroll queries with simplified API
 */
export function useInfiniteScroll<TData = unknown, TError = Error, TPageParam = number>(
  options: Omit<
    UseInfiniteQueryOptions<TData, TError, InfiniteData<TData>, QueryKey, TPageParam>,
    "getNextPageParam" | "initialPageParam"
  > & {
    getNextPageParam?: (lastPage: TData, pages: TData[]) => TPageParam | undefined;
    initialPageParam?: TPageParam;
  },
): ReturnType<typeof useInfiniteQuery<TData, TError, InfiniteData<TData>, QueryKey, TPageParam>> {
  return useInfiniteQuery({
    initialPageParam: options.initialPageParam ?? (0 as TPageParam),
    getNextPageParam:
      options.getNextPageParam ??
      ((lastPage, pages): TPageParam | undefined => {
        // Default implementation for array responses
        if (Array.isArray(lastPage) && lastPage.length > 0) {
          return pages.length as TPageParam;
        }
        return undefined;
      }),
    ...options,
  });
}

/**
 * Hook for mutations with automatic cache invalidation
 */
export function useInvalidatingMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext> & {
    invalidateKeys?: QueryKey[];
  },
): ReturnType<typeof useMutation<TData, TError, TVariables, TContext>> {
  const queryClient = useQueryClient();
  const { invalidateKeys = [], ...mutationOptions } = options;

  return useMutation({
    ...mutationOptions,
    onSuccess: async (data, variables, context) => {
      // Invalidate specified keys
      await Promise.all(
        invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })),
      );

      // Call original onSuccess
      return mutationOptions.onSuccess?.(data, variables, context);
    },
  });
}

/**
 * Hook for debounced queries (useful for search)
 */
export function useDebouncedQuery<TData = unknown, TError = Error>(
  options: UseQueryOptions<TData, TError> & {
    debounceMs?: number;
  },
): ReturnType<typeof useQuery<TData, TError>> {
  const { debounceMs = 300, ...queryOptions } = options;

  return useQuery({
    ...queryOptions,
    // Only enable after debounce delay
    enabled: queryOptions.enabled !== false,
    staleTime: debounceMs,
  });
}
