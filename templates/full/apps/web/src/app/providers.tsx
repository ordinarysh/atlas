'use client'

import { type ReactNode } from 'react'
import { QueryProvider } from '@atlas/query'
import { ThemeProvider } from '@/components/theme-provider'

export interface ProvidersProps {
  children: ReactNode
}

/**
 * Root providers for the application
 *
 * This component wraps the entire app with necessary providers:
 * - ThemeProvider for app-level theme management
 * - QueryProvider for TanStack Query (includes DevTools in development)
 * - Future providers can be added here (auth, etc.)
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="atlas-theme">
      <QueryProvider>{children}</QueryProvider>
    </ThemeProvider>
  )
}
