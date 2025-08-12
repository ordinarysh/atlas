/**
 * @repo/configs-prettier
 *
 * Main entry point for the Prettier configuration package.
 * Re-exports the base configuration for simplified imports.
 *
 * Usage in .prettierrc:
 * "@repo/configs-prettier"
 *
 * Usage in prettier.config.js:
 * export { default } from '@repo/configs-prettier'
 *
 * @module @repo/configs-prettier
 */

// Re-export the base configuration as default
export { default } from './base.js'

// Also export as named export for flexibility
export { default as prettierConfig } from './base.js'
