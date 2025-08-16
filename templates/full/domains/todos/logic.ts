import type { Todo, TodoUpdate } from "./types";

/**
 * Normalizes a title string by trimming and collapsing whitespace.
 */
export function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ");
}

/**
 * Toggles the completed status of a todo.
 * Returns a new todo object (immutable).
 */
export function toggle(todo: Todo): Todo {
  return {
    ...todo,
    completed: !todo.completed,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Applies a partial update to a todo.
 * Returns a new todo object (immutable).
 */
export function applyUpdate(todo: Todo, patch: TodoUpdate): Todo {
  const updated: Todo = {
    ...todo,
    updatedAt: new Date().toISOString(),
  };

  if (patch.title !== undefined) {
    updated.title = normalizeTitle(patch.title);
  }

  if (patch.completed !== undefined) {
    updated.completed = patch.completed;
  }

  return updated;
}

/**
 * Filters todos to only show completed items.
 */
export function filterCompleted(list: Todo[]): Todo[] {
  return list.filter((todo) => todo.completed);
}

/**
 * Sorts todos by creation date (newest first).
 */
export function sortByCreatedAtDesc(list: Todo[]): Todo[] {
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
