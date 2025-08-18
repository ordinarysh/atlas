import { type QueryClient } from "@tanstack/react-query";
import { getQueryClient } from "./client";

/**
 * Type-safe query key factory
 * Creates consistent, typed query keys with builder pattern
 *
 * @example
 * ```ts
 * const itemKeys = createKeys('items', {
 *   list: (filters?: ItemFilters) => ({ filters }),
 *   byId: (id: string) => ({ id }),
 *   byUser: (userId: string, status?: string) => ({ userId, status }),
 * })
 *
 * // Usage:
 * itemKeys.list() // ['items', 'list']
 * itemKeys.list({ status: 'active' }) // ['items', 'list', { filters: { status: 'active' } }]
 * itemKeys.byId('123') // ['items', 'byId', { id: '123' }]
 * ```
 */
export function createKeys<TScope extends string, TBuilders>(
  scope: TScope,
  builders: TBuilders,
): {
  [K in keyof TBuilders]: TBuilders[K] extends (...args: infer Args) => infer Result
    ? (...args: Args) => readonly [TScope, K, Result]
    : never;
} & { all: () => readonly [TScope] } {
  const result = {} as {
    [K in keyof TBuilders]: TBuilders[K] extends (...args: infer Args) => infer Result
      ? (...args: Args) => readonly [TScope, K, Result]
      : never;
  } & { all: () => readonly [TScope] };

  // Build the dynamic methods
  for (const [operation, builderFn] of Object.entries(builders as Record<string, unknown>)) {
    // Runtime validation that the builder is a function
    if (typeof builderFn !== "function") {
      throw new TypeError(`Builder for operation "${operation}" must be a function`);
    }

    Object.assign(result, {
      [operation]: (...args: unknown[]) => {
        const params = (builderFn as (...args: unknown[]) => unknown)(...args);
        // Only add params if they have meaningful values
        const hasParams =
          typeof params === "object" &&
          params !== null &&
          !Array.isArray(params) &&
          Object.keys(params as Record<string, unknown>).length > 0 &&
          Object.values(params as Record<string, unknown>).some((v) => v !== undefined);

        return hasParams ? ([scope, operation, params] as const) : ([scope, operation] as const);
      },
    });
  }

  // Add root key
  Object.assign(result, {
    all: () => [scope] as const,
  });

  return result;
}

// Alias for backward compatibility
export const createQueryKeys = createKeys;

/**
 * Type-safe invalidation helpers
 * Provides scoped invalidation functions for query keys
 *
 * @example
 * ```ts
 * // Invalidate all items queries
 * await invalidate.scope('items').all()
 *
 * // Invalidate specific operation
 * await invalidate.scope('items').list()
 *
 * // Invalidate with params
 * await invalidate.scope('items').byId('123')
 * ```
 */
export const invalidate = {
  /**
   * Create invalidation helpers for a specific scope
   */
  scope: (
    scope: string,
  ): {
    all: (queryClient?: QueryClient) => Promise<void>;
    operation: (operation: string, queryClient?: QueryClient) => Promise<void>;
    exact: (queryKey: readonly unknown[], queryClient?: QueryClient) => Promise<void>;
  } => ({
    /**
     * Invalidate all queries in this scope
     */
    all: async (queryClient?: QueryClient): Promise<void> => {
      const client = queryClient ?? getQueryClient();
      await client.invalidateQueries({ queryKey: [scope] });
    },

    /**
     * Invalidate specific operation
     */
    operation: async (operation: string, queryClient?: QueryClient): Promise<void> => {
      const client = queryClient ?? getQueryClient();
      await client.invalidateQueries({ queryKey: [scope, operation] });
    },

    /**
     * Invalidate with exact match
     */
    exact: async (queryKey: readonly unknown[], queryClient?: QueryClient): Promise<void> => {
      const client = queryClient ?? getQueryClient();
      await client.invalidateQueries({ queryKey, exact: true });
    },
  }),

  /**
   * Invalidate multiple scopes at once
   */
  multiple: async (scopes: string[], queryClient?: QueryClient): Promise<void> => {
    const client = queryClient ?? getQueryClient();
    await Promise.all(scopes.map((scope) => client.invalidateQueries({ queryKey: [scope] })));
  },

  /**
   * Invalidate everything
   */
  all: async (queryClient?: QueryClient): Promise<void> => {
    const client = queryClient ?? getQueryClient();
    await client.invalidateQueries();
  },
};

/**
 * Common query key patterns
 * Provides pre-built key factories for typical use cases
 */
export const commonPatterns = {
  /**
   * CRUD resource pattern
   */
  resource: (
    resource: string,
  ): {
    list: (
      params?: Record<string, unknown>,
    ) => readonly [string, "list", { params: Record<string, unknown> | undefined }];
    byId: (id: string | number) => readonly [string, "byId", { id: string | number }];
    create: () => readonly [string, "create", Record<string, never>];
    update: (id: string | number) => readonly [string, "update", { id: string | number }];
    delete: (id: string | number) => readonly [string, "delete", { id: string | number }];
    all: () => readonly [string];
  } =>
    createKeys(resource, {
      list: (params?: Record<string, unknown>) => ({ params }),
      byId: (id: string | number) => ({ id }),
      create: () => ({}),
      update: (id: string | number) => ({ id }),
      delete: (id: string | number) => ({ id }),
    }),

  /**
   * Paginated resource pattern
   */
  paginated: (
    resource: string,
  ): {
    page: (
      page: number,
      size?: number,
    ) => readonly [string, "page", { page: number; size: number | undefined }];
    infinite: () => readonly [string, "infinite", Record<string, never>];
    all: () => readonly [string];
  } =>
    createKeys(resource, {
      page: (page: number, size?: number) => ({ page, size }),
      infinite: () => ({}),
    }),

  /**
   * User-scoped pattern
   */
  userScoped: (
    resource: string,
  ): {
    byUser: (userId: string) => readonly [string, "byUser", { userId: string }];
    currentUser: () => readonly [string, "currentUser", Record<string, never>];
    all: () => readonly [string];
  } =>
    createKeys(resource, {
      byUser: (userId: string) => ({ userId }),
      currentUser: () => ({}),
    }),
};
