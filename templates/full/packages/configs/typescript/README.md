# TypeScript Configuration

## Overview

This package provides centralized TypeScript configurations for the monorepo, following TypeScript 5.9 best practices with proper separation of concerns.

## Configuration Files

### `base.json`
Core TypeScript configuration with enterprise-grade strictness settings:
- **Strict mode**: All strict type-checking enabled
- **Module**: ESNext with bundler resolution for modern tooling
- **Target**: ES2022 for modern JavaScript features
- **Interop**: Full ESM/CJS interoperability with `verbatimModuleSyntax`

### `nextjs.json`
Extends base for Next.js applications:
- **JSX**: Preserved for Next.js processing
- **DOM APIs**: Includes browser libraries
- **No emit**: Next.js handles compilation
- **Relaxed strictness**: Practical for app development

### `react-library.json`
Extends base for React component libraries:
- **JSX**: react-jsx transform
- **Build output**: Configured for dist/types structure
- **Strict APIs**: `exactOptionalPropertyTypes` for type-safe APIs
- **Declaration files**: Full .d.ts generation with sourcemaps

## Best Practices

### Separation of Concerns

**TypeScript handles:**
- Type checking and type safety
- Module resolution
- Compilation and emit settings
- Declaration file generation

**ESLint handles:**
- Code quality and best practices
- Unused variables/imports
- Complexity and maintainability
- Security and performance patterns

**Prettier handles:**
- Code formatting
- Import sorting
- Consistent styling

### Key Features

1. **Modern Module Syntax**: Uses `verbatimModuleSyntax` (TS 5.0+) for proper import/export handling
2. **Incremental Builds**: Enabled for faster compilation
3. **Project References**: Supports monorepo with composite projects
4. **Performance**: `skipLibCheck` for faster builds, smart defaults
5. **Developer Experience**: Balanced strictness without being dogmatic

### Configuration Hierarchy

```
base.json (core settings)
├── nextjs.json (app-specific)
├── react-library.json (library-specific)
└── [custom configs extend these]
```

## Usage

In your package's `tsconfig.json`:

```json
{
  "extends": "@repo/configs-typescript/base",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## TypeScript 5.9 Compliance

- ✅ Uses latest module resolution strategies
- ✅ Proper `verbatimModuleSyntax` for modern imports
- ✅ Optimized for bundlers with `moduleResolution: "bundler"`
- ✅ Smart incremental compilation
- ✅ Balanced strictness without over-engineering