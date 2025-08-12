"use client";

import { lazy, Suspense, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "./client";

// Lazy load DevTools only in development
const ReactQueryDevtools =
  process.env.NODE_ENV === "development"
    ? lazy(async () => {
        const mod = await import("@tanstack/react-query-devtools");
        return { default: mod.ReactQueryDevtools };
      })
    : (): null => null;

export interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Query Provider with DevTools support
 * Provides QueryClient to the React tree
 *
 * @example
 * ```tsx
 * // In app/providers.tsx
 * export function Providers({ children }: { children: ReactNode }) {
 *   return <QueryProvider>{children}</QueryProvider>
 * }
 * ```
 */
export function QueryProvider({ children }: QueryProviderProps): ReactNode {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}
