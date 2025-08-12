// Core client exports
export {
  createApi,
  qs,
  type ApiConfig,
  type ApiClient,
  type ApiRequestOptions,
} from './client'

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
