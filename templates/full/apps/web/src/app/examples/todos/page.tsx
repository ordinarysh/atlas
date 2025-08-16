'use client'

import { useState } from 'react'
import {
  useCreateTodo,
  useDeleteTodo,
  useTodos,
  useUpdateTodo,
} from '@atlas/query'
import {
  TodoEmpty,
  TodoError,
  TodoList,
  TodoSkeleton,
} from '@atlas/todos-domain'

export default function TodosExamplePage() {
  const [newTodoTitle, setNewTodoTitle] = useState('')

  // Fetch todos
  const { data: todos, isLoading, isError, error, refetch } = useTodos()

  // Mutations
  const createMutation = useCreateTodo()
  const updateMutation = useUpdateTodo()
  const deleteMutation = useDeleteTodo()

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoTitle.trim()) return

    createMutation.mutate(
      { title: newTodoTitle.trim() },
      {
        onSuccess: () => {
          setNewTodoTitle('')
        },
      }
    )
  }

  // Handle toggle
  const handleToggle = (id: string) => {
    const todo = todos?.find((t) => t.id === id)
    if (!todo) return

    updateMutation.mutate({
      id,
      patch: { completed: !todo.completed },
    })
  }

  // Handle delete
  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">
        Domain-Driven Todos Example
      </h1>

      {/* Add Todo Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="Add a new todo..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            disabled={createMutation.isPending}
          />
          <button
            type="submit"
            disabled={createMutation.isPending || !newTodoTitle.trim()}
            className="rounded-lg bg-blue-600 px-6 py-2 text-base font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createMutation.isPending ? 'Adding...' : 'Add Todo'}
          </button>
        </div>
        {createMutation.isError && (
          <p className="mt-2 text-sm text-red-600">
            Failed to create todo. Please try again.
          </p>
        )}
      </form>

      {/* Todos List */}
      <div>
        {isLoading && <TodoSkeleton />}

        {isError && (
          <TodoError
            message={error?.message || 'Failed to load todos'}
            onRetry={() => void refetch()}
          />
        )}

        {todos && todos.length === 0 && <TodoEmpty />}

        {todos && todos.length > 0 && (
          <TodoList
            todos={todos}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Status Bar */}
      {todos && todos.length > 0 && (
        <div className="mt-6 rounded-lg bg-gray-100 p-4">
          <p className="text-sm text-gray-600">
            {todos.filter((t) => t.completed).length} of {todos.length}{' '}
            completed
          </p>
        </div>
      )}
    </div>
  )
}
