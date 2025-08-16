/**
 * Atlas Design System - Main Export
 *
 * Provides semantic tokens and Tailwind preset for the Atlas template
 */

// Re-export the preset function
export { atlasPreset } from './preset'

// Export the resolved path to styles.css for importing
export const atlasStylesPath = new URL('styles.css', import.meta.url).pathname

// Legacy tokens export for backward compatibility
export const tokens = {
  colors: {
    fg: 'oklch(var(--fg))',
    'fg-muted': 'oklch(var(--fg-muted))',
    surface: 'oklch(var(--surface))',
    elevated: 'oklch(var(--elevated))',
    muted: 'oklch(var(--muted))',
    primary: 'oklch(var(--primary))',
    'primary-contrast': 'oklch(var(--primary-contrast))',
    success: 'oklch(var(--success))',
    warning: 'oklch(var(--warning))',
    danger: 'oklch(var(--danger))',
    border: 'oklch(var(--border))',
    ring: 'oklch(var(--ring))',
    outline: 'oklch(var(--outline))',
  },
  typography: {
    '3xl': { fontSize: '1.802rem', lineHeight: '1.2' },
    '2xl': { fontSize: '1.602rem', lineHeight: '1.2' },
    xl: { fontSize: '1.424rem', lineHeight: '1.2' },
    lg: { fontSize: '1.266rem', lineHeight: '1.3' },
    md: { fontSize: '1.125rem', lineHeight: '1.4' },
    base: { fontSize: '1rem', lineHeight: '1.4' },
    sm: { fontSize: '0.889rem', lineHeight: '1.5' },
    xs: { fontSize: '0.790rem', lineHeight: '1.5' },
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    bold: 700,
  },
} as const

export type Tokens = typeof tokens
