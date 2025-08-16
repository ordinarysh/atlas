"use client";

import { type ReactNode } from "react";
import { dehydrate, HydrationBoundary, type DehydratedState } from "@tanstack/react-query";
import { getQueryClient } from "./client";

/**
 * Client-side hydration boundary component
 * Hydrates server-prefetched data into the client query cache
 */
export function HydrateClient({
  children,
  state,
}: {
  children: ReactNode;
  state: DehydratedState;
}): ReactNode {
  return <HydrationBoundary state={state}>{children}</HydrationBoundary>;
}

/**
 * Server-side prefetch utility
 * Use in page/layout to prefetch queries and return dehydrated state
 *
 * @example
 * ```tsx
 * // In app/items/page.tsx
 * export default async function ItemsPage() {
 *   const { dehydratedState } = await prefetchQuery({
 *     queryKey: ['items'],
 *     queryFn: fetchItems,
 *   })
 *
 *   return (
 *     <HydrateClient state={dehydratedState}>
 *       <ItemsList />
 *     </HydrateClient>
 *   )
 * }
 * ```
 */
export async function prefetchQuery<T = unknown>(options: {
  queryKey: readonly unknown[];
  queryFn: () => Promise<T>;
  staleTime?: number;
}): Promise<{ dehydratedState: DehydratedState }> {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: options.queryKey,
    queryFn: options.queryFn,
    staleTime: options.staleTime,
  });

  return { dehydratedState: dehydrate(queryClient) };
}

/**
 * Server-side prefetch for multiple queries
 *
 * @example
 * ```tsx
 * const { dehydratedState } = await prefetchQueries([
 *   { queryKey: ['items'], queryFn: fetchItems },
 *   { queryKey: ['user'], queryFn: fetchUser },
 * ])
 * ```
 */
export async function prefetchQueries(
  queries: Array<{
    queryKey: readonly unknown[];
    queryFn: () => Promise<unknown>;
    staleTime?: number;
  }>,
): Promise<{ dehydratedState: DehydratedState }> {
  const queryClient = getQueryClient();

  await Promise.all(
    queries.map((query) =>
      queryClient.prefetchQuery({
        queryKey: query.queryKey,
        queryFn: query.queryFn,
        staleTime: query.staleTime,
      }),
    ),
  );

  return { dehydratedState: dehydrate(queryClient) };
}

/**
 * Server-side prefetch for infinite queries
 */
export async function prefetchInfiniteQuery<T = unknown>(options: {
  queryKey: readonly unknown[];
  queryFn: ({ pageParam }: { pageParam: unknown }) => Promise<T>;
  initialPageParam?: unknown;
  pages?: number;
}): Promise<{ dehydratedState: DehydratedState }> {
  const queryClient = getQueryClient();

  await queryClient.prefetchInfiniteQuery({
    queryKey: options.queryKey,
    queryFn: options.queryFn,
    initialPageParam: options.initialPageParam ?? 0,
    pages: options.pages ?? 1,
    getNextPageParam: () => undefined, // Default to no pagination
  });

  return { dehydratedState: dehydrate(queryClient) };
}
