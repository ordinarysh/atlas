import { z } from "zod";

import { TodoCreateSchema, TodoSchema, TodosListSchema, TodoUpdateSchema } from "./schemas";

/**
 * Core Todo entity type.
 * This is the primary type used throughout the application.
 */
export type Todo = z.infer<typeof TodoSchema>;

/**
 * Input type for creating a new Todo.
 */
export type TodoCreate = z.infer<typeof TodoCreateSchema>;

/**
 * Input type for updating an existing Todo.
 */
export type TodoUpdate = z.infer<typeof TodoUpdateSchema>;

/**
 * Type for a list of Todos.
 */
export type TodosList = z.infer<typeof TodosListSchema>;
