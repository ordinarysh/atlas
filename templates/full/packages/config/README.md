# Purpose

Shared configuration presets for ESLint, TypeScript, Prettier, and development tooling to ensure consistency across the monorepo.

## Public Surface

- **ESLint Config**: `@atlas/config/eslint` base and React presets
- **TypeScript Config**: `@atlas/config/typescript` base and app configurations
- **Prettier Config**: `@atlas/config/prettier` formatting rules
- **Rate Limit Config**: `@atlas/config/rate-limit` preset configurations
- **Config Types**: TypeScript interfaces for configuration validation

## Responsibilities

- **Code Quality**: ESLint rules for TypeScript, React, and Node.js
- **Type Safety**: TypeScript compiler configurations with strict settings
- **Code Formatting**: Prettier rules for consistent code style
- **Build Optimization**: Shared build and bundler configurations
- **Development Tools**: Shared tooling configurations (Vitest, etc.)

**What doesn't belong here:**
- Application-specific configurations (belongs in apps/)
- Runtime environment variables (belongs in deployment configs)
- Package-specific configurations (belongs in respective packages)

## Extension Points

### Using ESLint Configuration

```json
// package.json or .eslintrc.json
{
  "extends": ["@atlas/config/eslint"]
}
```

```typescript
// eslint.config.js (ESLint 9+)
import config from '@atlas/config/eslint'

export default config
```

### Available ESLint Presets

```typescript
// Base configuration (Node.js/TypeScript)
import baseConfig from '@atlas/config/eslint/base'

// React configuration (includes base + React rules)
import reactConfig from '@atlas/config/eslint/react'

// Next.js configuration (includes React + Next.js rules)
import nextConfig from '@atlas/config/eslint/next'

// Package configuration (for library packages)
import packageConfig from '@atlas/config/eslint/package'
```

### Using TypeScript Configuration

```json
// tsconfig.json
{
  "extends": "@atlas/config/typescript/base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

### Available TypeScript Presets

```json
// Base configuration (strict TypeScript)
"@atlas/config/typescript/base.json"

// App configuration (includes DOM types)
"@atlas/config/typescript/app.json"

// Package configuration (for libraries)
"@atlas/config/typescript/package.json"

// Node configuration (for Node.js projects)
"@atlas/config/typescript/node.json"
```

### Using Prettier Configuration

```json
// package.json
{
  "prettier": "@atlas/config/prettier"
}
```

```javascript
// prettier.config.js
module.exports = require('@atlas/config/prettier')

// Or with customization
module.exports = {
  ...require('@atlas/config/prettier'),
  printWidth: 120
}
```

### Rate Limit Presets

```typescript
import { rateLimitPresets } from '@atlas/config/rate-limit'

// Available presets
const presets = {
  strict: { limit: 10, windowMs: 60000 },      // 10/min for sensitive operations
  standard: { limit: 100, windowMs: 60000 },   // 100/min for normal API usage
  permissive: { limit: 1000, windowMs: 60000 } // 1000/min for public endpoints
}

// Usage
const limiter = createRateLimiter(rateLimitPresets.standard)
```

### Custom Configuration Extension

```typescript
// eslint.config.js - Extending base with custom rules
import baseConfig from '@atlas/config/eslint/base'

export default [
  ...baseConfig,
  {
    rules: {
      // Override or add custom rules
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': 'error'
    }
  }
]
```

### Package-Specific Configurations

```typescript
// For creating new preset configurations
// src/vitest/index.ts
import { defineConfig } from 'vitest/config'

export const vitestConfig = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'html'],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
})
```

## Testing

### Configuration Validation
```typescript
// __tests__/config-validation.test.ts
import { ESLint } from 'eslint'
import baseConfig from '../src/eslint/base'

describe('ESLint Configuration', () => {
  it('validates base config', async () => {
    const eslint = new ESLint({
      baseConfig,
      useEslintrc: false
    })
    
    const results = await eslint.lintText(`
      export function example(): string {
        return "valid typescript"
      }
    `)
    
    expect(results[0].errorCount).toBe(0)
  })
  
  it('catches common errors', async () => {
    const eslint = new ESLint({
      baseConfig,
      useEslintrc: false
    })
    
    const results = await eslint.lintText(`
      var unused = "variable"
      function test() { return; }
    `)
    
    expect(results[0].errorCount).toBeGreaterThan(0)
  })
})
```

### TypeScript Configuration Tests
```typescript
// __tests__/typescript-config.test.ts
import * as ts from 'typescript'
import baseConfig from '../src/typescript/base.json'

describe('TypeScript Configuration', () => {
  it('compiles valid TypeScript', () => {
    const source = `
      interface User {
        id: string
        name: string
      }
      
      const user: User = { id: '1', name: 'Test' }
      export { user }
    `
    
    const result = ts.transpile(source, baseConfig.compilerOptions)
    expect(result).toBeTruthy()
    expect(result).not.toContain('error')
  })
})
```

### Commands
```bash
# Test configurations
pnpm test

# Lint with config
pnpm lint

# Format with config
pnpm format

# Type check with config
pnpm typecheck
```

## Links

- **Development Tools**: [../../docs/ci-and-automation.md](../../docs/ci-and-automation.md)
- **Code Conventions**: [../../docs/conventions.md](../../docs/conventions.md)
- **Rate Limiting**: [../../services/rate-limit/README.md](../../services/rate-limit/README.md)
- **Architecture**: [../../docs/architecture.md](../../docs/architecture.md)

*Last reviewed: 2025-08-16*