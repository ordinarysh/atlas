/**
 * Example: Authentication queries and mutations
 *
 * This demonstrates authentication patterns with TanStack Query,
 * including session management, login/logout, and user data.
 */

import { useRouter } from 'next/navigation'
import { createKeys, useMutation, useQuery, useQueryClient } from '@atlas/query'
import { makeApi } from '@/lib/api'

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
    queryFn: async (): Promise<Session> => {
      const response = await makeApi().get('/auth/session')
      return response as Session
    },
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
    queryFn: async (): Promise<User> => {
      const response = await makeApi().get('/auth/me')
      return response as User
    },
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
    mutationFn: async (credentials: LoginInput): Promise<Session> => {
      const response = await makeApi().post('/auth/login', credentials)
      return response as Session
    },
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
    mutationFn: async (data: RegisterInput): Promise<Session> => {
      const response = await makeApi().post('/auth/register', data)
      return response as Session
    },
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
    mutationFn: async (): Promise<void> => {
      await makeApi().post('/auth/logout')
    },
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
    mutationFn: async (data: UpdateProfileInput): Promise<User> => {
      const response = await makeApi().patch('/auth/profile', data)
      return response as User
    },
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
    mutationFn: async (): Promise<Session> => {
      const response = await makeApi().post('/auth/refresh')
      return response as Session
    },
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
    mutationFn: async (email: string): Promise<{ message: string }> => {
      const response = await makeApi().post('/auth/forgot-password', { email })
      return response as { message: string }
    },
  })
}

/**
 * Reset password with token
 */
export function useResetPassword() {
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }): Promise<{ message: string }> => {
      const response = await makeApi().post('/auth/reset-password', {
        token,
        password,
      })
      return response as { message: string }
    },
    onSuccess: () => {
      // Redirect to login with success message
      router.push('/login?reset=success')
    },
  })
}
