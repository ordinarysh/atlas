/**
 * Atlas Design System - Tailwind v4 Preset
 *
 * Minimal preset configuration for semantic tokens
 * Works with Tailwind CSS v4's new configuration approach
 */

import type { Config } from 'tailwindcss'

/**
 * Atlas Design System preset for Tailwind CSS v4
 *
 * This preset provides:
 * - Semantic color tokens (fg, surface, primary, etc.)
 * - Typography scale with exact line heights
 * - Font weight utilities (normal, medium, bold)
 * - Font family definitions
 */
export function atlasPreset(): Partial<Config> {
  return {
    theme: {
      extend: {
        // Semantic colors mapped from CSS variables
        colors: {
          // Foreground
          fg: 'oklch(var(--fg))',
          'fg-muted': 'oklch(var(--fg-muted))',

          // Surfaces
          surface: 'oklch(var(--surface))',
          elevated: 'oklch(var(--elevated))',
          muted: 'oklch(var(--muted))',

          // Primary
          primary: 'oklch(var(--primary))',
          'primary-contrast': 'oklch(var(--primary-contrast))',

          // Status
          success: 'oklch(var(--success))',
          warning: 'oklch(var(--warning))',
          danger: 'oklch(var(--danger))',

          // UI Elements
          border: 'oklch(var(--border))',
          ring: 'oklch(var(--ring))',
          outline: 'oklch(var(--outline))',
        },

        // Typography scale with exact values
        fontSize: {
          '3xl': ['1.802rem', { lineHeight: '1.2' }],
          '2xl': ['1.602rem', { lineHeight: '1.2' }],
          xl: ['1.424rem', { lineHeight: '1.2' }],
          lg: ['1.266rem', { lineHeight: '1.3' }],
          md: ['1.125rem', { lineHeight: '1.4' }],
          base: ['1rem', { lineHeight: '1.4' }],
          sm: ['0.889rem', { lineHeight: '1.5' }],
          xs: ['0.790rem', { lineHeight: '1.5' }],
        },

        // Font families
        fontFamily: {
          sans: [
            'ui-sans-serif',
            'system-ui',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
          ],
          mono: [
            'ui-monospace',
            'SFMono-Regular',
            'Menlo',
            'Monaco',
            'Consolas',
            'monospace',
          ],
        },

        // Font weights - semantic naming
        fontWeight: {
          normal: '400',
          medium: '500',
          bold: '700',
        },
      },
    },
  }
}
