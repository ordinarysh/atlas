/**
 * Global type definitions for the application
 */

// Common utility types
export type NonNullable<T> = T extends null | undefined ? never : T

// API response types
export interface ApiResponse<T = unknown> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  code?: string
  statusCode?: number
}

// Component prop types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

// Navigation types
export interface NavItem {
  title: string
  href: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
}

// Form types
export interface FormFieldError {
  message: string
  type: string
}

export type FormState = 'idle' | 'loading' | 'success' | 'error'

// Environment types
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test'
  NEXT_PUBLIC_APP_URL: string
}

// Metadata types for SEO
export interface PageMetadata {
  title: string
  description: string
  keywords?: string[]
  image?: string
  canonical?: string
}
