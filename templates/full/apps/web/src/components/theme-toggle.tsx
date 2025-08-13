'use client'

import { useTheme } from './theme-provider'

/**
 * Theme Toggle - App-specific UI for theme switching
 *
 * This component uses the app's theme context to switch themes.
 * The actual UI components (Button) come from the theme-agnostic @atlas/ui package.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => {
        const nextTheme =
          theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
        setTheme(nextTheme)
      }}
      className="border-border bg-surface text-fg hover:bg-muted rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
      aria-label={`Switch theme (current: ${theme})`}
    >
      {theme === 'light' && '☀️'}
      {theme === 'dark' && '🌙'}
      {theme === 'system' && '💻'}
    </button>
  )
}

export function ThemeSelect() {
  const { theme, setTheme } = useTheme()

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
      className="border-border bg-surface text-fg rounded-lg border px-3 py-1.5 text-sm"
      aria-label="Select theme"
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  )
}
