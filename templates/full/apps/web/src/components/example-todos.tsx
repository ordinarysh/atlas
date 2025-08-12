'use client'

import { useState } from 'react'
import {
  useCreateTodo,
  useDeleteTodo,
  useTodos,
  useToggleTodo,
  type Todo,
} from '@/hooks/use-todos'

/**
 * Example component demonstrating TanStack Query usage
 *
 * This showcases:
 * - Data fetching with loading/error states
 * - Optimistic updates
 * - Mutations with automatic cache invalidation
 */
export function ExampleTodos() {
  const [newTodoTitle, setNewTodoTitle] = useState('')

  // Queries
  const { data: todos, isLoading, error } = useTodos()

  // Mutations
  const createTodo = useCreateTodo()
  const toggleTodo = useToggleTodo()
  const deleteTodo = useDeleteTodo()

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTodoTitle.trim()) {
      createTodo.mutate(
        { title: newTodoTitle },
        {
          onSuccess: () => setNewTodoTitle(''),
        }
      )
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="text-muted-foreground">Loading todos...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <h3 className="font-semibold text-red-800">Error loading todos</h3>
        <p className="text-sm text-red-600">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Todo Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newTodoTitle}
          onChange={(e) => setNewTodoTitle(e.target.value)}
          placeholder="Add a new todo..."
          disabled={createTodo.isPending}
          className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={createTodo.isPending || !newTodoTitle.trim()}
          className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {createTodo.isPending ? 'Adding...' : 'Add Todo'}
        </button>
      </form>

      {/* Error from creation */}
      {createTodo.isError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          Failed to create todo: {createTodo.error?.message}
        </div>
      )}

      {/* Todo List */}
      <div className="space-y-2">
        {todos?.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            No todos yet. Create your first one!
          </p>
        ) : (
          todos?.map((todo: Todo) => (
            <div
              key={todo.id}
              className={`group flex items-center gap-3 rounded-lg border p-4 transition-all ${
                todo.completed
                  ? 'border-gray-200 bg-gray-50'
                  : 'border-gray-300 bg-white'
              }`}
            >
              {/* Toggle Checkbox */}
              <button
                onClick={() => toggleTodo.mutate(todo.id)}
                disabled={toggleTodo.isPending}
                className="flex h-5 w-5 items-center justify-center rounded border-2 border-gray-300 transition-colors hover:border-blue-500 disabled:opacity-50"
                aria-label={`Mark ${todo.title} as ${
                  todo.completed ? 'incomplete' : 'complete'
                }`}
              >
                {todo.completed && (
                  <svg
                    className="h-3 w-3 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>

              {/* Todo Content */}
              <div className="flex-1">
                <h3
                  className={`font-medium ${
                    todo.completed
                      ? 'text-gray-500 line-through'
                      : 'text-gray-900'
                  }`}
                >
                  {todo.title}
                </h3>
                {todo.description && (
                  <p className="text-sm text-gray-600">{todo.description}</p>
                )}
              </div>

              {/* Delete Button */}
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this todo?')) {
                    deleteTodo.mutate(todo.id)
                  }
                }}
                disabled={deleteTodo.isPending}
                className="opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={`Delete ${todo.title}`}
              >
                <svg
                  className="h-5 w-5 text-red-500 hover:text-red-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Mutation Status Indicators */}
      <div className="text-sm text-gray-500">
        {toggleTodo.isPending && 'Updating todo...'}
        {deleteTodo.isPending && 'Deleting todo...'}
      </div>
    </div>
  )
}
