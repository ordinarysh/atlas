// Core client exports
export {
  createApi,
  qs,
  type ApiConfig,
  type ApiClient,
  type ApiRequestOptions,
} from './client'

// Fetch utilities
export { fetchJson, createFetch, ApiError } from './fetch'

// Note: Resource functions are not exported directly to maintain clean API surface
// Import them directly from './todos' if needed

// Common types
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
