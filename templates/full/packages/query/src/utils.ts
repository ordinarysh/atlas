import { type QueryClient } from "@tanstack/react-query";

/**
 * Utility to safely get typed query data
 */
export function getQueryData(queryClient: QueryClient, queryKey: readonly unknown[]): unknown {
  return queryClient.getQueryData(queryKey);
}

/**
 * Utility to safely set typed query data
 */
export function setQueryData<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  updater: T | ((old: T | undefined) => T | undefined),
): void {
  queryClient.setQueryData<T>(queryKey, updater);
}

/**
 * Batch invalidate multiple query keys
 */
export async function invalidateQueries(
  queryClient: QueryClient,
  queryKeys: readonly unknown[][],
): Promise<void> {
  await Promise.all(queryKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })));
}

/**
 * Cancel queries and return a rollback function
 */
export async function cancelAndRollback(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
): Promise<{ rollback: () => void; previousData: unknown }> {
  await queryClient.cancelQueries({ queryKey });
  const previousData = queryClient.getQueryData(queryKey);

  return {
    previousData,
    rollback: (): void => {
      if (previousData !== undefined) {
        queryClient.setQueryData(queryKey, previousData);
      }
    },
  };
}

/**
 * Prefetch data for a query
 */
export async function prefetchQuery<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  staleTime?: number,
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime,
  });
}

/**
 * Check if a query has data
 */
export function hasQueryData(queryClient: QueryClient, queryKey: readonly unknown[]): boolean {
  return queryClient.getQueryData(queryKey) !== undefined;
}

/**
 * Get all query data matching a partial key
 */
export function getQueriesData<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
): Array<[readonly unknown[], T | undefined]> {
  return queryClient.getQueriesData<T>({ queryKey });
}

/**
 * Remove query data and cancel any in-flight requests
 */
export async function removeQuery(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
): Promise<void> {
  await queryClient.cancelQueries({ queryKey });
  queryClient.removeQueries({ queryKey });
}

/**
 * Reset all queries (useful for logout)
 */
export async function resetQueries(queryClient: QueryClient): Promise<void> {
  queryClient.clear();
  await queryClient.resetQueries();
}

/**
 * Optimistic update helper with automatic rollback
 */
export async function optimisticUpdate<T, V>({
  queryClient,
  queryKey,
  mutationFn,
  variables,
  updateFn,
}: {
  queryClient: QueryClient;
  queryKey: readonly unknown[];
  mutationFn: (variables: V) => Promise<T>;
  variables: V;
  updateFn: (old: T | undefined, variables: V) => T;
}): Promise<T> {
  // Cancel and get rollback function
  const { rollback } = await cancelAndRollback(queryClient, queryKey);

  try {
    // Optimistic update
    queryClient.setQueryData<T>(queryKey, (old) => updateFn(old, variables));

    // Perform mutation
    const result = await mutationFn(variables);

    // Update with real data
    queryClient.setQueryData(queryKey, result);

    return result;
  } catch (error) {
    // Rollback on error
    rollback();
    throw error;
  }
}

/**
 * Create a query observer for reactive data outside React
 * Simple wrapper around getQueryData for consistent API
 */
export function observeQuery(queryClient: QueryClient, queryKey: readonly unknown[]): unknown {
  return queryClient.getQueryData(queryKey);
}
