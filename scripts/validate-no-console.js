#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Security: Project root for path validation
const PROJECT_ROOT = process.cwd()

// Security: Validate and resolve file paths to prevent directory traversal
const validateAndResolvePath = (filePath) => {
  // Resolve the path relative to project root
  const resolvedPath = path.resolve(PROJECT_ROOT, filePath)

  // Ensure the resolved path is within the project directory
  if (!resolvedPath.startsWith(PROJECT_ROOT + path.sep) && resolvedPath !== PROJECT_ROOT) {
    throw new Error(`Path outside project directory: ${filePath}`)
  }

  return resolvedPath
}

// Secure file system operations with path validation
const secureFileExists = (filePath) => {
  try {
    const safePath = validateAndResolvePath(filePath)
    return fs.existsSync(safePath)
  } catch {
    return false
  }
}

const secureReadFile = (filePath) => {
  const safePath = validateAndResolvePath(filePath)
  return fs.readFileSync(safePath, 'utf-8')
}

// Get all staged files with security validation
const rawStagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
  .trim()
  .split('\n')
  .filter(Boolean)
  .filter((file) => {
    try {
      validateAndResolvePath(file)
      return true
    } catch {
      return false // Skip invalid paths
    }
  })
  .filter((file) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file))

const stagedFiles = rawStagedFiles

let hasErrors = false
const errors = []

// Patterns to check
const forbiddenPatterns = [
  {
    pattern: /console\.(log|warn|error|info|debug|trace|dir|table|time|timeEnd|assert)/g,
    name: 'console methods',
    message: 'Use proper logging library instead of console',
  },
  {
    pattern: /debugger/g,
    name: 'debugger statements',
    message: 'Remove debugger statements before committing',
  },
  {
    pattern: /\b(TODO|FIXME|HACK|XXX|BUG)\b/g,
    name: 'TODO/FIXME comments',
    message: 'Create GitHub issues instead of TODO comments',
  },
  {
    pattern: /process\.exit\(/g,
    name: 'process.exit calls',
    message: 'Use proper error handling instead of process.exit',
  },
  {
    pattern: /\bany\b\s*:/g,
    name: 'TypeScript any type',
    message: 'Avoid using "any" type - use proper types',
  },
]

// Check each file
stagedFiles.forEach((file) => {
  if (!secureFileExists(file)) return

  // Skip ESLint config files as they contain rule names that match patterns
  if (file.includes('eslint.config.') || file.includes('.eslintrc.')) return

  // Skip validation scripts themselves as they legitimately use console methods
  if (file.includes('scripts/validate-') || file.includes('scripts/lint-')) return

  // Skip template files
  if (file.includes('templates/') || file.includes('fixtures/')) return

  const content = secureReadFile(file)
  const lines = content.split('\n')

  forbiddenPatterns.forEach(({ pattern, name, message }) => {
    lines.forEach((line, index) => {
      // Skip if line has eslint-disable comment
      if (line.includes('eslint-disable')) return

      // Allow process.exit in error-handler files for graceful shutdown
      if (name === 'process.exit calls' && file.includes('error-handler')) return

      const matches = line.match(pattern)
      if (matches) {
        hasErrors = true
        errors.push({
          file,
          line: index + 1,
          type: name,
          message,
          content: line.trim(),
        })
      }
    })
  })
})

// Report errors using process.stderr and process.stdout to avoid triggering our own validation
if (hasErrors) {
  process.stderr.write('\nCode quality checks failed!\n\n')

  // Group errors by type
  const errorsByType = errors.reduce((acc, error) => {
    if (!acc[error.type]) acc[error.type] = []
    acc[error.type].push(error)
    return acc
  }, {})

  Object.entries(errorsByType).forEach(([type, typeErrors]) => {
    process.stderr.write(`Found ${typeErrors.length} ${type}:\n\n`)
    typeErrors.forEach((error) => {
      process.stderr.write(`   ${error.file}:${error.line}\n`)
      process.stderr.write(`   > ${error.content}\n`)
      process.stderr.write(`   ${error.message}\n\n`)
    })
  })

  process.stderr.write('\nFix these issues before committing.\n\n')
  process.exit(1)
} else {
  process.stdout.write('Code quality checks passed\n')
  process.exit(0)
}