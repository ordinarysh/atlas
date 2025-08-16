/**
 * TypeScript definitions for @repo/configs-eslint
 *
 * This module provides type-safe ESLint configurations for the monorepo,
 * supporting ESLint v9 flat config format with typescript-eslint v8.
 *
 * @module @repo/configs-eslint
 * @requires eslint@^9.0.0
 * @requires typescript-eslint@^8.39.0
 */

import type { Linter } from 'eslint'

/**
 * ESLint plugin configuration object with metadata and rule definitions
 */
export interface ESLintPlugin {
  meta: {
    /** Plugin name identifier */
    name: string
    /** Semantic version */
    version: string
  }
  /** Available configuration presets */
  configs: Record<string, Linter.Config[]>
  /** Plugin-specific rule definitions */
  rules: Record<string, Linter.Rule.RuleModule>
  /** File processors for custom file types */
  processors: Record<string, Linter.Processor>
}

/**
 * Available configuration presets for different use cases
 */
export interface ConfigPresets {
  /**
   * Professional configuration with strict type checking.
   * Includes all security, promise, and code quality rules.
   * Recommended for production code.
   */
  professional: Linter.Config[]

  /**
   * Base TypeScript configuration without full type checking.
   * Fast development mode with essential rules.
   */
  base: Linter.Config[]

  /**
   * Development configuration with helpful warnings.
   * Balanced rules for active development.
   */
  development: Linter.Config[]

  /**
   * React-specific configuration with accessibility rules.
   * Includes jsx-a11y and React best practices.
   */
  react: Linter.Config[]

  /**
   * Next.js optimized configuration.
   * Includes React rules with Next.js specific adjustments.
   */
  nextjs: Linter.Config[]

  /**
   * Testing configuration with relaxed rules.
   * Allows any types and test-specific patterns.
   */
  testing: Linter.Config[]

  /**
   * Library configuration for packages.
   * Strict rules with explicit return types and documentation.
   */
  library: Linter.Config[]
}

/**
 * Main ESLint plugin export
 */
declare const plugin: ESLintPlugin & {
  configs: ConfigPresets
}

export default plugin

/**
 * Re-export individual configurations for convenience
 */
export const configs: ConfigPresets
