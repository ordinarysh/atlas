import { z } from "zod";

/**
 * Core schema for a Todo entity.
 * Serves as the boundary contract between layers.
 */
export const TodoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.string(), // ISO 8601 timestamp
  updatedAt: z.string(), // ISO 8601 timestamp
});

/**
 * Schema for creating a new Todo.
 * Validates user input at API boundary.
 */
export const TodoCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  completed: z.boolean().optional(),
});

/**
 * Schema for updating an existing Todo.
 * All fields optional, but at least one required.
 */
export const TodoUpdateSchema = z
  .object({
    title: z.string().min(1).optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

/**
 * Schema for a list of Todos.
 * Used for API responses returning multiple todos.
 */
export const TodosListSchema = z.array(TodoSchema);
