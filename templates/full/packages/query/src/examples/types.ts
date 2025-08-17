import { z } from "zod";

export const ItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  userId: z.string().optional(),
});

export type Item = z.infer<typeof ItemSchema>;

export const ItemsResponseSchema = z.object({
  items: z.array(ItemSchema),
  total: z.number(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
});

export type ItemsResponse = z.infer<typeof ItemsResponseSchema>;

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type User = z.infer<typeof UserSchema>;
