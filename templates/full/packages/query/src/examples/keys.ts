import { createKeys } from "../keys";
import type { TodoFilters } from "./types";

export const todoKeys = createKeys("todos", {
  list: (filters?: TodoFilters) => ({ filters }),
  byId: (id: string) => ({ id }),
  infinite: (filters?: TodoFilters) => ({ filters }),
});

export const userKeys = createKeys("users", {
  current: () => ({}),
  byId: (id: string) => ({ id }),
});
