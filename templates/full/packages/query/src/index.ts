// Core client and provider
export { createQueryClient, getQueryClient } from "./client";
export { QueryProvider, type QueryProviderProps } from "./provider";

// SSR support
export { HydrateClient, prefetchQuery, prefetchQueries, prefetchInfiniteQuery } from "./ssr";

// Query key management
export { createKeys, createQueryKeys, invalidate, commonPatterns } from "./keys";

// Custom hooks
export { useOptimisticMutation, useInvalidatingMutation, usePaginatedQuery } from "./hooks";

// Todos hooks
export { useTodos, useCreateTodo, useUpdateTodo, useDeleteTodo } from "./todos";

// Re-export fetch utilities from api-client for backward compatibility
export { fetchJson, createFetch, ApiError } from "@atlas/api-client";

// Re-export essential TanStack Query hooks and types
export {
  // Core hooks
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,

  // State hooks
  useIsFetching,
  useIsMutating,
  useMutationState,

  // Suspense hooks
  useSuspenseQuery,
  useSuspenseInfiniteQuery,
  useSuspenseQueries,

  // Error handling
  useQueryErrorResetBoundary,

  // Utilities
  dehydrate,
  hydrate,

  // Types
  type UseQueryOptions,
  type UseMutationOptions,
  type UseInfiniteQueryOptions,
  type QueryKey,
  type QueryClient,
  type MutationKey,
  type InfiniteData,
  type DehydratedState,
} from "@tanstack/react-query";
