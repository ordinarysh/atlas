# CI & Automation

Template validation, quality checks, and automation patterns for maintaining code quality.

## Template Validation Strategy

The template is validated **in isolation** to ensure it works out-of-the-box for consumers.

### Validation Pipeline

```bash
# Required checks for template integrity
pnpm install           # Dependency installation
pnpm lint             # ESLint rules
pnpm typecheck        # TypeScript compilation
pnpm test             # Unit tests
pnpm build            # Production build
pnpm smoke            # Smoke tests
pnpm clean:templates  # Template artifact cleanup
```

### What CI Should Run

#### ✅ Required Checks

- **Dependencies**: `pnpm install` succeeds
- **Linting**: `pnpm lint` passes with no errors
- **Type Safety**: `pnpm typecheck` passes with no errors
- **Unit Tests**: `pnpm test` passes with 100% success rate
- **Build**: `pnpm build` produces valid output
- **Template Cleanup**: `pnpm clean:templates` works correctly

#### ✅ Quality Checks

- **Bundle Analysis**: Check bundle size regression
- **Security Audit**: `pnpm audit` for vulnerabilities
- **Link Validation**: All internal markdown links work
- **Format Check**: `pnpm format:check` for consistent formatting

#### ❌ What NOT to Run

- **Integration Tests**: Templates can't connect to real services
- **E2E Tests**: No actual deployment environment
- **Database Migrations**: No database in template context
- **External API Calls**: Templates are isolated

### GitHub Actions Example

```yaml
# .github/workflows/template-validation.yml
name: Template Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm typecheck

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build

      - name: Clean templates
        run: pnpm clean:templates

      - name: Check format
        run: pnpm format:check

      - name: Security audit
        run: pnpm audit --audit-level moderate
```

## Code Quality Gates

### Pre-commit Hooks

```json
// package.json
{
  "simple-git-hooks": {
    "pre-commit": "pnpm format && pnpm lint-staged"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix"],
    "*.{ts,tsx,js,jsx,json,md}": ["prettier --write"]
  }
}
```

### ESLint Configuration

```typescript
// Essential rules for template quality
const eslintConfig = {
  extends: ["@atlas/eslint-config"],
  rules: {
    // Prevent common template issues
    "no-console": "warn", // Flag debug logs
    "no-unused-vars": "error", // Clean unused code
    "@typescript-eslint/no-explicit-any": "error", // Type safety
    "prefer-const": "error", // Consistency
    "no-var": "error", // Modern JS
  },
};
```

### TypeScript Strict Mode

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## Documentation Validation

### Link Checking

```bash
# Check all markdown links
find . -name "*.md" -exec markdown-link-check {} \;

# Check for broken internal links
grep -r "\](\./" docs/ | while read line; do
  file=$(echo "$line" | cut -d: -f1)
  link=$(echo "$line" | sed 's/.*](\.\([^)]*\)).*/\1/')
  if [ ! -f "docs$link" ]; then
    echo "Broken link in $file: $link"
  fi
done
```

### Markdown Linting

```bash
# Install markdownlint-cli
npm install -g markdownlint-cli

# Lint all markdown files
markdownlint docs/**/*.md README.md

# Rules configuration (.markdownlint.json)
{
  "line-length": { "line_length": 100 },
  "no-trailing-spaces": true,
  "no-multiple-blanks": true,
  "fenced-code-language": true
}
```

## Automated Testing

### Unit Test Structure

```
packages/*/
  src/
    feature.ts
    feature.test.ts         # Unit tests
  __tests__/
    feature.integration.test.ts  # Integration tests
```

### Test Commands

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific package tests
pnpm --filter @atlas/api-client test

# Watch mode for development
pnpm test:watch
```

### Test Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json"],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

### Smoke Testing

Quick validation that core functionality works:

```bash
# Run smoke tests
pnpm smoke

# What it tests:
- API endpoints respond correctly
- Health checks pass
- Build outputs exist
```

The smoke test script (`tooling/scripts/smoke.mjs`) performs rapid checks:

- `/api/health` returns 200 status
- `/api/ready` returns 200 status
- Build artifacts exist in expected locations
- Environment variables are properly configured

## Build Validation

### Bundle Analysis

```bash
# Analyze bundle size
pnpm build
npx next-bundle-analyzer

# Check for bundle size regression
pnpm --filter @atlas/app-web build
ls -la apps/web/.next/static/chunks/
```

### Build Outputs

```bash
# Expected build outputs
apps/web/.next/          # Next.js build
packages/*/dist/         # Package builds
```

## Template Cleanup

### Cleanup Script

```bash
#!/bin/bash
# scripts/clean-templates.sh

echo "Cleaning template artifacts..."

# Remove development artifacts
rm -rf node_modules/.cache
rm -rf .next/cache
rm -rf dist/
rm -rf .turbo/

# Remove logs
rm -f *.log
rm -f npm-debug.log*
rm -f yarn-debug.log*
rm -f yarn-error.log*

# Remove OS files
find . -name ".DS_Store" -delete
find . -name "Thumbs.db" -delete

echo "Template cleanup complete"
```

### CI Integration

```yaml
# Always run cleanup before packaging
- name: Clean template artifacts
  run: pnpm clean:templates

- name: Verify clean state
  run: |
    if [[ -n $(git status --porcelain) ]]; then
      echo "Template not clean after cleanup"
      git status
      exit 1
    fi
```

## Performance Monitoring

### Build Time Tracking

```bash
# Track build performance
time pnpm build

# Turbo cache hits
pnpm build --summarize
```

### Dependency Auditing

```bash
# Security vulnerabilities
pnpm audit

# Outdated packages
pnpm outdated

# License compliance
npx license-checker --summary
```

## Development Workflow

### Local Quality Checks

```bash
# Pre-push validation
pnpm check-all

# Individual checks
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

### Git Hooks Setup

```bash
# Install hooks
pnpm simple-git-hooks

# Manual hook test
pnpm pre-commit
```

### IDE Integration

```json
// .vscode/settings.json
{
  "eslint.validate": ["typescript", "typescriptreact"],
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.includePackageJsonAutoImports": "off"
}
```

## Links

- **Getting Started**: [getting-started.md](./getting-started.md)
- **Code Standards**: [conventions.md](./conventions.md)
- **Package Configs**: [../packages/config/README.md](../packages/config/README.md)
