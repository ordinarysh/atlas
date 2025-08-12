import { type z } from "zod";

export class FetchError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: Response,
    public data?: unknown,
  ) {
    super(message);
    this.name = "FetchError";
  }
}

interface FetchOptions<TSchema = unknown> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
  schema?: TSchema extends z.ZodType ? TSchema : never;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
}

interface NextFetchRequestConfig {
  revalidate?: number | false;
  tags?: string[];
}

// Helper function to build URL from input
function buildUrl(input: string | URL): string {
  return typeof input === "string"
    ? input.startsWith("http")
      ? input
      : `${process.env.NEXT_PUBLIC_API_URL ?? ""}${input}`
    : input.toString();
}

// Helper function to handle response errors
async function handleResponseError(response: Response): Promise<FetchError> {
  let errorData: unknown;
  try {
    errorData = await response.json();
  } catch {
    errorData = await response.text();
  }

  return new FetchError(
    `HTTP ${response.status.toString()}: ${response.statusText}`,
    response.status,
    response,
    errorData,
  );
}

// Helper function to determine if error should be retried
function shouldRetry(error: unknown, attempt: number, maxRetries: number): boolean {
  if (attempt >= maxRetries) return false;

  // Don't retry 4xx errors
  if (
    error instanceof FetchError &&
    typeof error.status === "number" &&
    error.status >= 400 &&
    error.status < 500
  ) {
    return false;
  }

  // Retry network errors
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return true;
  }

  // Retry 5xx errors
  return error instanceof FetchError && typeof error.status === "number" && error.status >= 500;
}

// Helper function for exponential backoff delay
async function delay(attempt: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * 2 ** attempt, 10_000)));
}

/**
 * Isomorphic fetch wrapper with automatic retries and Zod validation
 *
 * Features:
 * - Works on both server (with cookies/headers) and client
 * - Automatic JSON parsing
 * - Optional Zod schema validation
 * - Smart retry policy (network/5xx only, not 4xx)
 * - Abort controller support
 * - Next.js specific options (revalidate, tags)
 *
 * @example
 * ```ts
 * // Simple GET
 * const data = await fetchJson('/api/todos')
 *
 * // With Zod validation
 * const todos = await fetchJson('/api/todos', {
 *   schema: z.array(TodoSchema)
 * })
 *
 * // POST with body
 * const newTodo = await fetchJson('/api/todos', {
 *   method: 'POST',
 *   body: { title: 'New todo' },
 *   schema: TodoSchema
 * })
 *
 * // With abort controller
 * const controller = new AbortController()
 * const data = await fetchJson('/api/todos', {
 *   signal: controller.signal
 * })
 * ```
 */
export async function fetchJson<TSchema extends z.ZodType = z.ZodType>(
  input: string | URL,
  options: FetchOptions<TSchema> = {},
): Promise<TSchema extends z.ZodType ? z.infer<TSchema> : unknown> {
  const {
    method = "GET",
    body,
    headers: customHeaders = {},
    schema,
    signal,
    credentials = "include",
    cache,
    next,
  } = options;

  // Build URL using helper
  const url = buildUrl(input);

  // Build headers
  const headers = new Headers(customHeaders);

  // Add JSON content type for requests with body
  if (body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Prepare fetch options
  const fetchOptions: RequestInit & { next?: NextFetchRequestConfig } = {
    method,
    headers,
    credentials,
    signal,
    cache,
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...(next ? { next } : {}),
  };

  // Retry logic
  let lastError: Error | undefined;
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);

      // Handle non-OK responses
      if (!response.ok) {
        const error = await handleResponseError(response);

        // Don't retry 4xx errors
        if (error.status && error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Retry 5xx errors with delay
        if (shouldRetry(error, attempt, maxRetries)) {
          lastError = error;
          await delay(attempt);
          continue;
        }

        throw error;
      }

      // Parse response
      const data = (await response.json()) as unknown;

      // Validate with schema if provided
      if (schema) {
        return schema.parse(data) as TSchema extends z.ZodType ? z.infer<TSchema> : unknown;
      }

      return data as TSchema extends z.ZodType ? z.infer<TSchema> : unknown;
    } catch (error) {
      // Handle abort
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }

      // Handle retryable errors
      if (shouldRetry(error, attempt, maxRetries)) {
        lastError = error as Error;
        await delay(attempt);
        continue;
      }

      // Re-throw other errors
      throw error;
    }
  }

  // If we get here, all retries failed
  throw lastError ?? new Error("All fetch attempts failed");
}

/**
 * Create a fetch instance with default options
 *
 * @example
 * ```ts
 * const api = createFetch({
 *   headers: { 'X-API-Key': 'secret' }
 * })
 *
 * const todos = await api('/todos')
 * ```
 */
export function createFetch(defaultOptions: Partial<FetchOptions> = {}) {
  return <TSchema extends z.ZodType = z.ZodType>(
    input: string | URL,
    options: FetchOptions<TSchema> = {},
  ): Promise<TSchema extends z.ZodType ? z.infer<TSchema> : unknown> => {
    const mergedOptions = { ...defaultOptions, ...options };

    // Merge headers properly
    if (defaultOptions.headers || options.headers) {
      mergedOptions.headers = Object.assign(
        {},
        defaultOptions.headers as Record<string, string>,
        options.headers as Record<string, string>,
      );
    }

    return fetchJson(input, mergedOptions);
  };
}
