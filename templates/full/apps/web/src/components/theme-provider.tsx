'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string
}

interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

/**
 * Theme Provider - App-level theme management
 * 
 * Handles runtime theme switching, persistence, and system preferences.
 * Updates the data-theme attribute on the root element to trigger
 * CSS variable changes defined in @atlas/design-system.
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'atlas-theme',
  attribute = 'data-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // SSR-safe initialization
    if (typeof window === 'undefined') return defaultTheme
    
    try {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme
    } catch {
      return defaultTheme
    }
  })

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const root = window.document.documentElement

    // Remove any existing theme attribute
    root.removeAttribute(attribute)
    
    // Determine resolved theme
    let resolved: 'light' | 'dark' = 'light'
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      resolved = systemTheme ? 'dark' : 'light'
    } else {
      resolved = theme
    }
    
    // Apply theme via attribute (triggers CSS variable changes)
    root.setAttribute(attribute, resolved)
    setResolvedTheme(resolved)
  }, [theme, attribute])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? 'dark' : 'light'
      window.document.documentElement.setAttribute(attribute, resolved)
      setResolvedTheme(resolved)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, attribute])

  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem(storageKey, newTheme)
    } catch {
      console.warn('Failed to save theme preference')
    }
    setThemeState(newTheme)
  }

  const value = {
    theme,
    setTheme,
    resolvedTheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}