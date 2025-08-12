# Configuration System Architecture

## Overview

This monorepo uses a centralized configuration system for ESLint, Prettier, and TypeScript to ensure
consistency across all packages and applications. The configuration system is designed for
scalability, maintainability, and developer experience.

## System Requirements

- **Node.js**: >= 22.18.0
- **pnpm**: 10.14.0 (exact version)
- **TypeScript**: ^5.9.0
- **ESLint**: ^9.33.0
- **Prettier**: ^3.6.0

## Configuration Packages

### @repo/configs-eslint

**Location**: `packages/configs/eslint`

Provides ESLint v9 flat config with typescript-eslint v8 support. Includes multiple presets for
different use cases.

#### Available Presets

- **professional**: Strict type checking with security, promise, and code quality rules
- **base**: TypeScript configuration without full type checking for fast development
- **development**: Balanced rules for active development with helpful warnings
- **react**: React-specific with accessibility rules (jsx-a11y)
- **nextjs**: Next.js optimized configuration
- **testing**: Relaxed rules for test files
- **library**: Strict rules for packages with explicit return types

#### Usage

```javascript
// eslint.config.mjs
import tseslint from "typescript-eslint";
import eslintConfig from "@repo/configs-eslint/base.js";

export default tseslint.config(
  // Use the preset
  ...eslintConfig.configs.nextjs,

  // Add your overrides
  {
    rules: {
      // Your custom rules
    },
  },
);
```

### @repo/configs-prettier

**Location**: `packages/configs/prettier`

Provides Prettier configuration with import sorting and Tailwind CSS class ordering.

#### Features

- Import sorting via `@ianvs/prettier-plugin-sort-imports`
- Tailwind CSS class ordering via `prettier-plugin-tailwindcss`
- Pre-configured overrides for different file types
- Monorepo-optimized import order

#### Usage

Three ways to use the configuration:

1. **JSON Configuration** (Recommended for simplicity):

```json
// .prettierrc
"@repo/configs-prettier"
```

2. **JavaScript Configuration**:

```javascript
// prettier.config.js
export { default } from "@repo/configs-prettier";
```

3. **Extended Configuration**:

```javascript
// prettier.config.mjs
import prettierConfig from "@repo/configs-prettier";

export default {
  ...prettierConfig,
  // Your overrides
  semi: false,
};
```

### @repo/configs-typescript

**Location**: `packages/configs/typescript`

Provides TypeScript compiler configurations for different project types.

#### Available Configurations

- **base**: Node.js services and general TypeScript projects
- **nextjs**: Next.js applications with JSX support
- **react-library**: React component libraries with declaration files

#### Usage

```json
// tsconfig.json
{
  "extends": "@repo/configs-typescript/nextjs",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Key Design Decisions

### 1. ESLint v9 Flat Config

We use ESLint's new flat config system for:

- Better performance with `projectService`
- Clearer configuration composition
- Type-safe configuration with TypeScript

### 2. Separation of Concerns

- **ESLint**: Code quality, logic errors, best practices
- **Prettier**: Code formatting (all formatting rules disabled in ESLint)
- **TypeScript**: Type checking and type safety

### 3. No Conflicting Rules

- `eslint-config-prettier` is included in the ESLint config package
- All perfectionist sorting rules are disabled (Prettier handles imports)
- Prettier compatibility config is always applied last

### 4. Import Sorting Strategy

Import sorting is handled exclusively by Prettier with a monorepo-optimized order:

1. React imports
2. Next.js imports
3. Third-party modules
4. Monorepo packages (`@repo/*`)
5. Internal aliases (`@/*`)
6. Relative imports

### 5. TypeScript Definitions

All config packages include TypeScript definitions for:

- Better IDE support
- Type-safe configuration
- Self-documenting APIs

## Migration Guide

### From Legacy ESLint Config

1. Remove `.eslintrc.*` files
2. Create `eslint.config.mjs`
3. Import the appropriate preset
4. Add `eslint-config-prettier` at the end

### From Standalone Prettier Config

1. Install `@repo/configs-prettier`
2. Replace your `.prettierrc` with `"@repo/configs-prettier"`
3. Remove duplicate plugin installations

## Best Practices

### 1. Use Appropriate Presets

Choose the right ESLint preset for your package:

- Apps: Use `nextjs` or `react`
- Libraries: Use `library` for strict typing
- Services: Use `professional` for backend code
- Tests: Extend with `testing` rules

### 2. Minimal Overrides

Keep configuration overrides minimal. If you need significant changes, consider:

- Contributing to the shared config
- Creating a new preset
- Documenting why the override is necessary

### 3. Version Alignment

Always use workspace protocol for config packages:

```json
{
  "devDependencies": {
    "@repo/configs-eslint": "workspace:*",
    "@repo/configs-prettier": "workspace:*",
    "@repo/configs-typescript": "workspace:*"
  }
}
```

### 4. Run Quality Checks

After configuration changes:

```bash
pnpm lint        # Check for ESLint issues
pnpm format:check # Check for formatting issues
pnpm type-check  # Check for TypeScript issues
```

## Troubleshooting

### Common Issues

1. **Import sorting conflicts**
   - Ensure perfectionist rules are disabled in ESLint
   - Check that Prettier plugins are installed

2. **Type checking performance**
   - Use `projectService` instead of `project` in ESLint
   - Consider using `base` preset for faster development

3. **Plugin not found errors**
   - Ensure all configs are installed via workspace protocol
   - Run `pnpm install` to sync dependencies

4. **Formatting conflicts**
   - Verify `eslint-config-prettier` is last in config array
   - Check that no ESLint formatting rules are enabled

## Security Considerations

- All configurations enforce security best practices
- `eslint-plugin-security` is included in professional preset
- No secrets or credentials in configuration files
- Strict type checking prevents common vulnerabilities

## Performance Optimizations

1. **ESLint projectService**: Uses TypeScript's project service for better performance
2. **Targeted file patterns**: Configs only apply to relevant files
3. **Cached dependencies**: Workspace protocol ensures single dependency installation
4. **Incremental type checking**: TypeScript configured for incremental builds

## Future Enhancements

- [ ] Add Biome as alternative formatter
- [ ] Create config migration CLI tool
- [ ] Add performance benchmarking
- [ ] Implement config validation
- [ ] Add Visual Studio Code workspace settings
