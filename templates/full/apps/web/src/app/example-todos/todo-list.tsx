'use client'

import { useState } from 'react'
import {
  useDeleteTodo,
  useTodos,
  useUpdateTodo,
  type Todo,
  type TodoFilters,
} from '@atlas/query/examples'

export default function TodoList() {
  const [filters, setFilters] = useState<TodoFilters>({ status: 'all' })
  const { data, isLoading, error } = useTodos(filters)
  const updateTodo = useUpdateTodo()
  const deleteTodo = useDeleteTodo()

  if (isLoading) {
    return <TodoListSkeleton />
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">Error loading todos: {error.message}</p>
      </div>
    )
  }

  const todos = data?.todos ?? []

  return (
    <div className="space-y-4">
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilters({ status: 'all' })}
          className={`rounded-lg px-3 py-1 transition ${
            filters.status === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          All ({data?.total ?? 0})
        </button>
        <button
          onClick={() => setFilters({ status: 'active' })}
          className={`rounded-lg px-3 py-1 transition ${
            filters.status === 'active'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilters({ status: 'completed' })}
          className={`rounded-lg px-3 py-1 transition ${
            filters.status === 'completed'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Completed
        </button>
      </div>

      {todos.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No todos found. Create your first todo!
        </div>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={() => {
                updateTodo.mutate({
                  id: todo.id,
                  data: { completed: !todo.completed },
                })
              }}
              onDelete={() => {
                if (confirm('Are you sure you want to delete this todo?')) {
                  deleteTodo.mutate(todo.id)
                }
              }}
              isUpdating={updateTodo.isPending}
              isDeleting={deleteTodo.isPending}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

interface TodoItemProps {
  todo: Todo
  onToggle: () => void
  onDelete: () => void
  isUpdating: boolean
  isDeleting: boolean
}

function TodoItem({
  todo,
  onToggle,
  onDelete,
  isUpdating,
  isDeleting,
}: TodoItemProps) {
  return (
    <li
      className={`flex items-center gap-3 rounded-lg border bg-white p-4 shadow-sm ${isDeleting ? 'opacity-50' : ''} ${todo.completed ? 'border-gray-200' : 'border-gray-300'} `}
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={onToggle}
        disabled={isUpdating || isDeleting}
        className="h-5 w-5 rounded border-gray-300"
      />
      <span
        className={`flex-1 ${todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'} `}
      >
        {todo.title}
      </span>
      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="rounded-lg px-3 py-1 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
    </li>
  )
}

function TodoListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-lg bg-gray-100 p-4">
          <div className="h-5 w-3/4 rounded bg-gray-200"></div>
        </div>
      ))}
    </div>
  )
}
