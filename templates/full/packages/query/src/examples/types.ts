import { z } from "zod";

export const TodoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  userId: z.string().optional(),
});

export type Todo = z.infer<typeof TodoSchema>;

export const TodosResponseSchema = z.object({
  todos: z.array(TodoSchema),
  total: z.number(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
});

export type TodosResponse = z.infer<typeof TodosResponseSchema>;

export const CreateTodoSchema = z.object({
  title: z.string().min(1).max(500),
  completed: z.boolean().optional().default(false),
});

export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;

export const UpdateTodoSchema = CreateTodoSchema.partial();

export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>;

export const TodoFiltersSchema = z.object({
  status: z.enum(["all", "active", "completed"]).optional(),
  search: z.string().optional(),
  userId: z.string().optional(),
});

export type TodoFilters = z.infer<typeof TodoFiltersSchema>;
