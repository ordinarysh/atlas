'use client'

import { useState } from 'react'
import { useCreateTodo, type CreateTodoInput } from '@atlas/query/examples'

export default function CreateTodo() {
  const [title, setTitle] = useState('')
  const createTodo = useCreateTodo()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    const data: CreateTodoInput = {
      title: title.trim(),
      completed: false,
    }

    createTodo.mutate(data, {
      onSuccess: () => {
        setTitle('')
      },
      onError: (error: Error) => {
        console.error('Failed to create todo:', error)
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        disabled={createTodo.isPending}
        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={createTodo.isPending || !title.trim()}
        className="rounded-lg bg-blue-500 px-6 py-2 text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {createTodo.isPending ? 'Adding...' : 'Add Todo'}
      </button>
    </form>
  )
}
