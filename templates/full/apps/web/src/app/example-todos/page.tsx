'use client'

import { Suspense } from 'react'
import CreateTodo from './create-todo'
import TodoList from './todo-list'

export default function TodosPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
        <header className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Todo List</h1>
          <p className="text-gray-600">
            Example of React Query with SSR prefetching and optimistic updates
          </p>
        </header>

        <div className="mb-8">
          <CreateTodo />
        </div>

        <Suspense fallback={<TodoListSkeleton />}>
          <TodoList />
        </Suspense>
      </div>
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
