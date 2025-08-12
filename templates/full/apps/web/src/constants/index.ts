/**
 * Application constants and configuration values
 */

// Application metadata
export const APP_CONFIG = {
  name: 'Next.js App',
  description: 'A professional Next.js application',
  version: '1.0.0',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
} as const

// API configuration
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? '/api',
  timeout: 10_000,
} as const

// UI constants
export const UI_CONFIG = {
  defaultPageSize: 10,
  maxPageSize: 100,
  debounceDelay: 300,
  animationDuration: 200,
} as const

// Validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s()-]+$/,
  url: /^https?:\/\/.+/,
} as const

// Date formats
export const DATE_FORMATS = {
  short: 'MMM dd, yyyy',
  long: 'MMMM dd, yyyy',
  time: 'HH:mm',
  datetime: 'MMM dd, yyyy HH:mm',
} as const

// Error messages
export const ERROR_MESSAGES = {
  required: 'This field is required',
  invalidEmail: 'Please enter a valid email address',
  invalidUrl: 'Please enter a valid URL',
  networkError: 'Network error. Please try again.',
  serverError: 'Server error. Please try again later.',
  notFound: 'The requested resource was not found.',
} as const

// Local storage keys
export const STORAGE_KEYS = {
  theme: 'app-theme',
  user: 'user-data',
  preferences: 'user-preferences',
} as const
