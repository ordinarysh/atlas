import { vi, type MockedFunction } from 'vitest'
import { type z } from 'zod'

// Define the fetchJson function type to match the real implementation
type FetchJsonType = <TSchema extends z.ZodType = z.ZodType>(
  input: string | URL,
  options?: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    headers?: HeadersInit;
    schema?: TSchema extends z.ZodType ? TSchema : never;
    signal?: AbortSignal;
    credentials?: RequestCredentials;
    cache?: RequestCache;
    next?: { revalidate?: number | false; tags?: string[] };
  }
) => Promise<TSchema extends z.ZodType ? z.infer<TSchema> : unknown>

// Mock fetchJson from @atlas/query
vi.mock('@atlas/query', () => ({
  fetchJson: vi.fn(),
}))

import { fetchJson } from '@atlas/query'
export const mockFetchJson = fetchJson as MockedFunction<FetchJsonType>
