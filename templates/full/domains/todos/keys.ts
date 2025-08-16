/**
 * Query key factory for todos domain.
 * Pure functions that generate stable query keys for React Query.
 * No React Query imports - keeps domain layer pure.
 */
export const todoKeys = {
  all: ["todos"] as const,
  list: () => [...todoKeys.all, "list"] as const,
  detail: (id: string) => [...todoKeys.all, "detail", id] as const,
};
