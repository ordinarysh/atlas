"use client";

import type { Todo } from "../types";

interface TodoItemProps {
  todo: Todo;
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle?.(todo.id)}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        aria-label={`Mark "${todo.title}" as ${todo.completed ? "incomplete" : "complete"}`}
      />
      <span
        className={`flex-1 text-base ${
          todo.completed ? "text-gray-500 line-through" : "text-gray-900"
        }`}
      >
        {todo.title}
      </span>
      <button
        onClick={() => onDelete?.(todo.id)}
        className="text-sm font-medium text-red-600 transition-colors hover:text-red-800"
        aria-label={`Delete "${todo.title}"`}
      >
        Delete
      </button>
    </div>
  );
}
