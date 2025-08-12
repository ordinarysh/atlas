/**
 * Example: Authentication queries and mutations
 *
 * This demonstrates authentication patterns with TanStack Query,
 * including session management, login/logout, and user data.
 */

import { useRouter } from 'next/navigation'
import { makeApi } from '@/lib/api'
import { createKeys, useMutation, useQuery, useQueryClient } from '@atlas/query'

// Types
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}

export interface Session {
  user: User
  token: string
  expiresAt: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput extends LoginInput {
  name: string
}

export interface UpdateProfileInput {
  name?: string
  avatar?: string
}

// Query keys
export const authKeys = createKeys('auth', {
  session: () => ({}),
  user: () => ({}),
  permissions: () => ({}),
})

// Query hooks
/**
 * Get current session
 */
export function useSession() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: () => makeApi().get<Session>('/auth/session'),
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
    retry: false, // Don't retry failed auth requests
  })
}

/**
 * Get current user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: () => makeApi().get<User>('/auth/me'),
    staleTime: 1000 * 60 * 5,
    retry: false,
  })
}

/**
 * Check if user is authenticated
 */
export function useIsAuthenticated() {
  const { data: session, isLoading } = useSession()
  return {
    isAuthenticated: !!session?.token,
    isLoading,
    user: session?.user,
  }
}

// Mutation hooks
/**
 * Login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (credentials: LoginInput) =>
      makeApi().post<Session>('/auth/login', credentials),
    onSuccess: (session: Session) => {
      // TODO(auth): wire better-auth addon and provide getAuthToken in makeApi()

      // Update query cache
      queryClient.setQueryData(authKeys.session(), session)
      queryClient.setQueryData(authKeys.user(), session.user)

      // Invalidate any stale queries
      void queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] !== 'auth',
      })

      // Redirect to dashboard
      router.push('/dashboard')
    },
    onError: (error) => {
      console.error('Login failed:', error)
      // You might want to show a toast here
    },
  })
}

/**
 * Register mutation
 */
export function useRegister() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (data: RegisterInput) =>
      makeApi().post<Session>('/auth/register', data),
    onSuccess: (session: Session) => {
      // TODO(auth): wire better-auth addon and provide getAuthToken in makeApi()

      // Update query cache
      queryClient.setQueryData(authKeys.session(), session)
      queryClient.setQueryData(authKeys.user(), session.user)

      // Redirect to onboarding or dashboard
      router.push('/onboarding')
    },
  })
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: () => makeApi().post<void>('/auth/logout'),
    onSuccess: () => {
      // TODO(auth): wire better-auth addon and provide getAuthToken in makeApi()

      // Clear all queries
      queryClient.clear()

      // Redirect to login
      router.push('/login')
    },
    onSettled: () => {
      // TODO(auth): wire better-auth addon and provide getAuthToken in makeApi()
      queryClient.removeQueries()
    },
  })
}

/**
 * Update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileInput) =>
      makeApi().patch<User>('/auth/profile', data),
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: authKeys.user() })

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData<User>(authKeys.user())

      // Optimistically update
      if (previousUser) {
        queryClient.setQueryData(authKeys.user(), {
          ...previousUser,
          ...updates,
        })
      }

      return { previousUser }
    },
    onError: (err, updates, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(authKeys.user(), context.previousUser)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      void queryClient.invalidateQueries({ queryKey: authKeys.user() })
    },
  })
}

/**
 * Refresh token mutation
 */
export function useRefreshToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => makeApi().post<Session>('/auth/refresh'),
    onSuccess: (session: Session) => {
      // TODO(auth): wire better-auth addon and provide getAuthToken in makeApi()

      // Update cache
      queryClient.setQueryData(authKeys.session(), session)
    },
    retry: false,
  })
}

/**
 * Request password reset
 */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) =>
      makeApi().post<{ message: string }>('/auth/forgot-password', { email }),
  })
}

/**
 * Reset password with token
 */
export function useResetPassword() {
  const router = useRouter()

  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      makeApi().post<{ message: string }>('/auth/reset-password', {
        token,
        password,
      }),
    onSuccess: () => {
      // Redirect to login with success message
      router.push('/login?reset=success')
    },
  })
}
