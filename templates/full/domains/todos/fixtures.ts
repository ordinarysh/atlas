import type { Todo } from "./types";

/**
 * Deterministic seed data for todos.
 * Used for development and testing.
 */
export const seedTodos: Todo[] = [
  {
    id: "todo-1",
    title: "Set up domain-driven architecture",
    completed: true,
    createdAt: "2025-01-13T10:00:00.000Z",
    updatedAt: "2025-01-13T10:30:00.000Z",
  },
  {
    id: "todo-2",
    title: "Implement React Query hooks",
    completed: false,
    createdAt: "2025-01-13T11:00:00.000Z",
    updatedAt: "2025-01-13T11:00:00.000Z",
  },
  {
    id: "todo-3",
    title: "Add comprehensive error handling",
    completed: false,
    createdAt: "2025-01-13T12:00:00.000Z",
    updatedAt: "2025-01-13T12:00:00.000Z",
  },
];
