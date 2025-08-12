#!/usr/bin/env tsx
/**
 * Enterprise Theme Validation Script
 *
 * Validates consistency between CSS theme variables and TypeScript types.
 * Ensures design token integrity across the enterprise design system.
 *
 * Usage:
 *   npm run theme:validate
 *   tsx scripts/validate-theme.ts
 */
import fs from 'node:fs'
import path from 'node:path'

/* ========================================
 * CONFIGURATION
 * ======================================== */

const THEME_CSS_PATH = path.join(__dirname, '../src/theme.css')
const THEME_TYPES_PATH = path.join(__dirname, '../src/theme.types.ts')
const OUTPUT_PATH = path.join(__dirname, '../../..', 'theme-validation.json')

interface ValidationResult {
  success: boolean
  errors: string[]
  warnings: string[]
  stats: {
    cssVariables: number
    typeDefinitions: number
    matchedTokens: number
    timestamp: string
  }
}

/* ========================================
 * CSS PARSER
 * ======================================== */

function extractCSSVariables(cssContent: string): Set<string> {
  const variables = new Set<string>()

  // Match CSS custom properties: --variable-name: value;
  const cssVarRegex = /--([\da-z-]+):\s*[^;]+;/g
  let match

  while ((match = cssVarRegex.exec(cssContent)) !== null) {
    if (match[1] && match[1] !== '*') {
      // Skip the reset pattern
      variables.add(match[1])
    }
  }

  return variables
}

/* ========================================
 * TYPESCRIPT PARSER
 * ======================================== */

function extractTypeDefinitions(tsContent: string): {
  colors: Set<string>
  breakpoints: Set<string>
  containers: Set<string>
  other: Set<string>
} {
  const colors = new Set<string>()
  const breakpoints = new Set<string>()
  const containers = new Set<string>()
  const other = new Set<string>()

  // Extract color type definitions
  const colorMatch = tsContent.match(
    /export type \w*Colors =[\S\s]*?\|[\S\s]*?(?=export|$)/g
  )
  if (colorMatch) {
    colorMatch.forEach((match) => {
      const colorNames = match.match(/'([^']+)'/g)
      if (colorNames) {
        colorNames.forEach((name) => {
          colors.add(name.replaceAll("'", ''))
        })
      }
    })
  }

  // Extract breakpoint type definitions
  const breakpointRegex =
    /export type Breakpoints =[\S\s]*?\|[\S\s]*?(?=export|$)/
  const breakpointMatch = breakpointRegex.exec(tsContent)
  if (breakpointMatch) {
    const breakpointNames = breakpointMatch[0].match(/'([^']+)'/g)
    if (breakpointNames) {
      breakpointNames.forEach((name) => {
        breakpoints.add(name.replaceAll("'", ''))
      })
    }
  }

  // Extract container type definitions
  const containerRegex =
    /export type Containers =[\S\s]*?\|[\S\s]*?(?=export|$)/
  const containerMatch = containerRegex.exec(tsContent)
  if (containerMatch) {
    const containerNames = containerMatch[0].match(/'([^']+)'/g)
    if (containerNames) {
      containerNames.forEach((name) => {
        containers.add(name.replaceAll("'", ''))
      })
    }
  }

  return { colors, breakpoints, containers, other }
}

/* ========================================
 * VALIDATION LOGIC
 * ======================================== */

function validateThemeConsistency(): ValidationResult {
  const result: ValidationResult = {
    success: true,
    errors: [],
    warnings: [],
    stats: {
      cssVariables: 0,
      typeDefinitions: 0,
      matchedTokens: 0,
      timestamp: new Date().toISOString(),
    },
  }

  try {
    // Read files
    const cssContent = fs.readFileSync(THEME_CSS_PATH, 'utf8')
    const tsContent = fs.readFileSync(THEME_TYPES_PATH, 'utf8')

    // Extract tokens
    const cssVariables = extractCSSVariables(cssContent)
    const typeDefinitions = extractTypeDefinitions(tsContent)

    result.stats.cssVariables = cssVariables.size
    result.stats.typeDefinitions =
      typeDefinitions.colors.size +
      typeDefinitions.breakpoints.size +
      typeDefinitions.containers.size

    // Validate colors
    typeDefinitions.colors.forEach((colorName) => {
      const expectedCSSVar = `color-${colorName}`
      if (!cssVariables.has(expectedCSSVar)) {
        result.errors.push(
          `Missing CSS variable for color: --${expectedCSSVar}`
        )
      } else {
        result.stats.matchedTokens++
      }
    })

    // Validate breakpoints
    typeDefinitions.breakpoints.forEach((breakpointName) => {
      const expectedCSSVar = `breakpoint-${breakpointName}`
      if (!cssVariables.has(expectedCSSVar)) {
        result.errors.push(
          `Missing CSS variable for breakpoint: --${expectedCSSVar}`
        )
      } else {
        result.stats.matchedTokens++
      }
    })

    // Validate containers
    typeDefinitions.containers.forEach((containerName) => {
      const expectedCSSVar = `container-${containerName}`
      if (!cssVariables.has(expectedCSSVar)) {
        result.errors.push(
          `Missing CSS variable for container: --${expectedCSSVar}`
        )
      } else {
        result.stats.matchedTokens++
      }
    })

    // Check for orphaned CSS variables
    cssVariables.forEach((cssVar) => {
      const isColorVar = cssVar.startsWith('color-')
      const isBreakpointVar = cssVar.startsWith('breakpoint-')
      const isContainerVar = cssVar.startsWith('container-')

      if (isColorVar) {
        const colorName = cssVar.replace('color-', '')
        if (!typeDefinitions.colors.has(colorName)) {
          result.warnings.push(
            `CSS color variable has no TypeScript type: --${cssVar}`
          )
        }
      } else if (isBreakpointVar) {
        const breakpointName = cssVar.replace('breakpoint-', '')
        if (!typeDefinitions.breakpoints.has(breakpointName)) {
          result.warnings.push(
            `CSS breakpoint variable has no TypeScript type: --${cssVar}`
          )
        }
      } else if (isContainerVar) {
        const containerName = cssVar.replace('container-', '')
        if (!typeDefinitions.containers.has(containerName)) {
          result.warnings.push(
            `CSS container variable has no TypeScript type: --${cssVar}`
          )
        }
      }
    })

    // Validate required system variables exist
    const requiredVariables = [
      'font-sans',
      'font-serif',
      'font-mono',
      'color-white',
      'color-black',
      'color-transparent',
      'spacing',
      'shadow-none',
      'radius-none',
      // Typography system
      'text-xs',
      'text-sm',
      'text-base',
      'text-lg',
      'text-xl',
      'text-2xl',
      'text-3xl',
      'text-4xl',
      'text-5xl',
      // Font weights
      'font-weight-normal',
      'font-weight-medium',
      'font-weight-semibold',
      'font-weight-bold',
      // Performance
      'will-change-auto',
      'will-change-transform',
      // Text shadows
      'text-shadow-none',
      'text-shadow-xs',
      // Letter spacing
      'tracking-normal',
      'tracking-tight',
      'tracking-wide',
      // Line height
      'leading-none',
      'leading-tight',
      'leading-normal',
      'leading-relaxed',
    ]

    requiredVariables.forEach((variable) => {
      if (!cssVariables.has(variable)) {
        result.errors.push(`Missing required system variable: --${variable}`)
      }
    })

    result.success = result.errors.length === 0
  } catch (error) {
    result.success = false
    result.errors.push(
      `Validation failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  return result
}

/* ========================================
 * MAIN EXECUTION
 * ======================================== */

function main(): void {
  console.log('🎨 Enterprise Theme Validation')
  console.log('================================')

  const result = validateThemeConsistency()

  // Write results to file
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2))

  // Console output
  console.log(`📊 Statistics:`)
  console.log(`  CSS Variables: ${String(result.stats.cssVariables)}`)
  console.log(`  TypeScript Types: ${String(result.stats.typeDefinitions)}`)
  console.log(`  Matched Tokens: ${String(result.stats.matchedTokens)}`)
  console.log()

  if (result.errors.length > 0) {
    console.log('❌ Errors:')
    result.errors.forEach((error) => {
      console.log(`  • ${error}`)
    })
    console.log()
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:')
    result.warnings.forEach((warning) => {
      console.log(`  • ${warning}`)
    })
    console.log()
  }

  if (result.success) {
    console.log('✅ Theme validation passed!')
  } else {
    console.log('❌ Theme validation failed!')
    process.exit(1)
  }

  console.log(`📋 Full report: ${OUTPUT_PATH}`)
}

// Run if called directly
if (require.main === module) {
  main()
}
