// @ts-check
import tseslint from 'typescript-eslint'
import eslintConfig from '../config/eslint/base.js'

/**
 * UI library ESLint configuration using centralized enterprise-grade rules.
 * Inherits from @repo/eslint-config library configuration to eliminate redundancy
 * and ensure consistency across the monorepo.
 *
 * ARCHITECTURE:
 * - Uses centralized library config from packages/config/eslint/base.js
 * - Adds UI-specific ignore patterns
 * - Maintains same enterprise-grade standards as other library packages
 *
 * @see packages/config/eslint/base.js - Centralized configuration source
 */
export default tseslint.config(
  // UI-specific ignore patterns
  {
    name: 'package/ui/ignores',
    ignores: [
      'dist/',
      '.turbo/',
      'node_modules/',
      '*.d.ts',
      '*.config.*',
      'coverage/',
      'storybook-static/',
    ],
  },

  // Inherit enterprise-grade library configuration from centralized config
  // This replaces 160+ lines of duplicated configuration with proper inheritance
  ...eslintConfig.configs.library,

  // UI-specific overrides (only add here if UI package needs different rules)
  {
    name: 'package/ui/specific-overrides',
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Add any UI-specific rule overrides here if needed
      // Currently no overrides needed - centralized library config is sufficient
    },
  }
)
