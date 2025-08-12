import { type QueryClient } from "@tanstack/react-query";
import { getQueryClient } from "./client";

/**
 * Type-safe query key factory
 * Creates consistent, typed query keys with builder pattern
 *
 * @example
 * ```ts
 * const todoKeys = createKeys('todos', {
 *   list: (filters?: TodoFilters) => ({ filters }),
 *   byId: (id: string) => ({ id }),
 *   byUser: (userId: string, status?: string) => ({ userId, status }),
 * })
 *
 * // Usage:
 * todoKeys.list() // ['todos', 'list']
 * todoKeys.list({ status: 'active' }) // ['todos', 'list', { filters: { status: 'active' } }]
 * todoKeys.byId('123') // ['todos', 'byId', { id: '123' }]
 * ```
 */
export function createKeys<
  TScope extends string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TBuilders extends Record<string, (...args: any[]) => any>,
>(
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
  Object.entries(builders).forEach(([operation, builder]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (result as any)[operation] = (...args: unknown[]): readonly unknown[] => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const params = builder(...args);
      // Only add params if they have values
      const hasParams =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        Object.keys(params).length > 0 &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        Object.values(params).some((v) => v !== undefined);

      return hasParams ? ([scope, operation, params] as const) : ([scope, operation] as const);
    };
  });

  // Add root key
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  (result as any).all = (): readonly [TScope] => [scope] as const;

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
 * // Invalidate all todos queries
 * await invalidate.scope('todos').all()
 *
 * // Invalidate specific operation
 * await invalidate.scope('todos').list()
 *
 * // Invalidate with params
 * await invalidate.scope('todos').byId('123')
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
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
  resource: (resource: string) =>
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
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
  paginated: (resource: string) =>
    createKeys(resource, {
      page: (page: number, size?: number) => ({ page, size }),
      infinite: () => ({}),
    }),

  /**
   * User-scoped pattern
   */
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
  userScoped: (resource: string) =>
    createKeys(resource, {
      byUser: (userId: string) => ({ userId }),
      currentUser: () => ({}),
    }),
};
