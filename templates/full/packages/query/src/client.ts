import { cache } from "react";
import { QueryClient } from "@tanstack/react-query";

/**
 * Default query client configuration optimized for production
 */
const defaultOptions = {
  queries: {
    // Consider data fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Keep data in cache for 30 minutes
    gcTime: 30 * 60 * 1000,
    // Disable aggressive refetching
    refetchOnWindowFocus: false,
    refetchOnReconnect: "always" as const,
    // Smart retry: only network/5xx errors, not 4xx
    retry: (failureCount: number, error: unknown): boolean => {
      if (failureCount >= 2) return false;

      // Check if it's an HTTP error response
      if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status: number }).status;
        // Don't retry client errors (4xx)
        if (status >= 400 && status < 500) return false;
      }

      return true;
    },
    retryDelay: (attemptIndex: number): number => Math.min(1000 * 2 ** attemptIndex, 30_000),
  },
  mutations: {
    // Retry mutations once for network errors
    retry: 1,
    retryDelay: 1000,
  },
};

/**
 * Create a new QueryClient instance
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions });
}

// Singleton for client-side
let browserQueryClient: QueryClient | undefined;

/**
 * Get or create a QueryClient instance
 * - Server: Always creates new instance (React cache ensures one per request)
 * - Client: Reuses singleton to prevent hydration mismatches
 */
export const getQueryClient = cache(() => {
  if (typeof window === "undefined") {
    // Server: create new instance per request
    return createQueryClient();
  }

  // Client: use singleton
  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
});
