import { createKeys } from "../keys";

export const userKeys = createKeys("users", {
  current: () => ({}),
  byId: (id: string) => ({ id }),
});

export const itemKeys = createKeys("items", {
  list: (filters?: Record<string, unknown>) => ({ filters }),
  byId: (id: string) => ({ id }),
});
