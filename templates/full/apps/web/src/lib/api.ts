import { createApi } from '@atlas/api-client'

export const makeApi = () =>
  createApi({
    baseUrl: typeof window === 'undefined'
      ? process.env.API_URL ?? 'http://localhost:3000/api'
      : '/api',
    getAuthToken: () => Promise.resolve(null), // TODO: replaced by auth addon later
  })