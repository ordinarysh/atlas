/**
 * TypeScript definitions for @repo/configs-typescript
 *
 * This module provides shared TypeScript configurations for the monorepo,
 * with presets for different project types.
 *
 * @module @repo/configs-typescript
 * @requires typescript@^5.9.0
 */

/**
 * TypeScript compiler options interface
 * Subset of commonly used options in our configurations
 */
export interface TypeScriptCompilerOptions {
  /** Target ECMAScript version */
  target?: string
  /** Module system */
  module?: string
  /** Library definitions to include */
  lib?: string[]
  /** Enable strict type checking */
  strict?: boolean
  /** Skip library checking */
  skipLibCheck?: boolean
  /** Resolve JSON modules */
  resolveJsonModule?: boolean
  /** Allow JS files */
  allowJs?: boolean
  /** Check JS files */
  checkJs?: boolean
  /** JSX mode */
  jsx?: string
  /** Output directory */
  outDir?: string
  /** Root directory */
  rootDir?: string
  /** Base URL for module resolution */
  baseUrl?: string
  /** Path mapping */
  paths?: Record<string, string[]>
  /** ES module interop */
  esModuleInterop?: boolean
  /** Force consistent file name casing */
  forceConsistentCasingInFileNames?: boolean
  /** Module resolution strategy */
  moduleResolution?: string
  /** Allow synthetic default imports */
  allowSyntheticDefaultImports?: boolean
  /** Emit declaration files */
  declaration?: boolean
  /** Emit declaration map */
  declarationMap?: boolean
  /** Source maps */
  sourceMap?: boolean
  /** Incremental compilation */
  incremental?: boolean
  /** No emit on error */
  noEmitOnError?: boolean
  /** No unused locals */
  noUnusedLocals?: boolean
  /** No unused parameters */
  noUnusedParameters?: boolean
  /** No implicit returns */
  noImplicitReturns?: boolean
  /** No fallthrough cases */
  noFallthroughCasesInSwitch?: boolean
  /** Isolated modules */
  isolatedModules?: boolean
  /** No emit */
  noEmit?: boolean
}

/**
 * TypeScript configuration structure
 */
export interface TypeScriptConfig {
  /** Extends another configuration */
  extends?: string | string[]
  /** Compiler options */
  compilerOptions?: TypeScriptCompilerOptions
  /** Files to include */
  include?: string[]
  /** Files to exclude */
  exclude?: string[]
}

/**
 * Available TypeScript configuration presets
 */
export interface ConfigPresets {
  /**
   * Base TypeScript configuration
   * Suitable for Node.js services and general TypeScript projects
   */
  base: TypeScriptConfig

  /**
   * Next.js optimized configuration
   * Includes JSX support and Next.js specific settings
   */
  nextjs: TypeScriptConfig

  /**
   * React library configuration
   * For building React component libraries with declaration files
   */
  'react-library': TypeScriptConfig
}

/**
 * Default export - base configuration
 */
declare const baseConfig: TypeScriptConfig

export default baseConfig

/**
 * Named exports for specific configurations
 */
export const base: TypeScriptConfig
export const nextjs: TypeScriptConfig
export const reactLibrary: TypeScriptConfig
