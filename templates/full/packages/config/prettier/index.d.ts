/**
 * TypeScript definitions for @repo/configs-prettier
 *
 * This module provides type-safe Prettier configurations for the monorepo,
 * including import sorting and Tailwind CSS class ordering.
 *
 * @module @repo/configs-prettier
 * @requires prettier@^3.6.0
 * @requires @ianvs/prettier-plugin-sort-imports@^4.6.1
 * @requires prettier-plugin-tailwindcss@^0.6.14
 */

import type { Config } from 'prettier'

/**
 * Import order configuration for @ianvs/prettier-plugin-sort-imports
 */
export interface ImportOrderConfig {
  /** Array of import order patterns */
  importOrder: string[]
  /** Parser plugins for import sorting */
  importOrderParserPlugins: string[]
  /** TypeScript version for import sorting */
  importOrderTypeScriptVersion: string
}

/**
 * Tailwind CSS configuration for prettier-plugin-tailwindcss
 */
export interface TailwindConfig {
  /** Functions that should have their classes sorted */
  tailwindFunctions: string[]
}

/**
 * Extended Prettier configuration with plugin options
 */
export interface PrettierConfig
  extends Config,
    ImportOrderConfig,
    TailwindConfig {
  /** Plugins to use */
  plugins: string[]
  /** File-specific overrides */
  overrides: Array<{
    files: string | string[]
    options?: Partial<Config>
  }>
}

/**
 * The complete Prettier configuration object
 *
 * @example
 * ```js
 * // prettier.config.js
 * export { default } from '@repo/configs-prettier'
 * ```
 *
 * @example
 * ```json
 * // .prettierrc
 * "@repo/configs-prettier"
 * ```
 */
declare const prettierConfig: PrettierConfig

export default prettierConfig

/**
 * Named export for flexibility
 */
export { prettierConfig }
