import { seedTodos } from "@atlas/todos-domain";
import type { Todo, TodoCreate, TodoUpdate } from "@atlas/todos-domain";

/**
 * Repository interface for Todo operations.
 * Defines the contract for data persistence.
 */
export interface TodosRepo {
  list(): Promise<Todo[]>;
  get(id: string): Promise<Todo | null>;
  create(input: TodoCreate): Promise<Todo>;
  update(id: string, patch: TodoUpdate): Promise<Todo | null>;
  delete(id: string): Promise<boolean>;
}

/**
 * In-memory implementation of TodosRepo.
 * For development/demo purposes only.
 */
class InMemoryTodosRepo implements TodosRepo {
  private todos: Map<string, Todo>;

  constructor() {
    this.todos = new Map();
    // Seed with initial data
    seedTodos.forEach((todo) => {
      this.todos.set(todo.id, todo);
    });
  }

  async list(): Promise<Todo[]> {
    return Array.from(this.todos.values()).map((todo) => ({ ...todo }));
  }

  async get(id: string): Promise<Todo | null> {
    const todo = this.todos.get(id);
    return todo ? { ...todo } : null;
  }

  async create(input: TodoCreate): Promise<Todo> {
    const now = new Date().toISOString();
    const todo: Todo = {
      id: crypto.randomUUID(),
      title: input.title,
      completed: input.completed ?? false,
      createdAt: now,
      updatedAt: now,
    };
    this.todos.set(todo.id, todo);
    return { ...todo };
  }

  async update(id: string, patch: TodoUpdate): Promise<Todo | null> {
    const existing = this.todos.get(id);
    if (!existing) return null;

    const updated: Todo = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.todos.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    return this.todos.delete(id);
  }
}

/**
 * Singleton instance of the todos repository.
 * Export this for use in API routes.
 */
export const todosRepo: TodosRepo = new InMemoryTodosRepo();
