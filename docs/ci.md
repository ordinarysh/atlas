# CI/CD Documentation

## Overview

The Atlas Templates repository uses GitHub Actions for continuous integration and release management with modern LTS tooling and non-hardcoded version resolution.

## Version Management

### Node.js Version

- **Target**: LTS 22.18.x
- **Resolution**: Defined in `.nvmrc` file (contains `22`)
- **Implementation**: Uses `actions/setup-node@v4` with `node-version-file: .nvmrc`
- **Validation**: Enforces minimum version 22.18.0 with automatic acceptance of newer patches

### pnpm Version

- **Target**: ≥10.14.0
- **Resolution**: Defined in `package.json` `packageManager` field
- **Implementation**: Uses Corepack for native pnpm resolution
- **Validation**: Enforces minimum version 10.14.0 with semver validation

## CI Workflow Stages

### Pull Request & Main Branch CI (`ci.yml`)

1. **Version Validation**
   - Validates Node.js ≥22.18.0
   - Validates pnpm ≥10.14.0
   - Fails fast if requirements not met

2. **Parallel Jobs** (after version validation)
   - **Lint**: ESLint checks on root code only (excludes `templates/**`)
   - **Type Check**: TypeScript compilation validation
   - **Template Validation**:
     - Schema validation
     - Forbidden artifacts check (node_modules, .turbo, dist, lockfiles, etc.)

3. **E2E Smoke Test** (after parallel jobs)
   - Extracts `templates/full` to temporary directory
   - Runs full monorepo workflow: install → lint → typecheck → build → test
   - Validates artifact size budgets (<25MB per template)
   - Skipped on doc-only changes via path filters

4. **Timing Report**
   - Monitors total workflow duration
   - Suggests optimizations if >8 minutes

### Release Workflow (`release.yml`)

Triggered on:

- Push to tags matching `v*.*.*`
- Manual workflow dispatch

**Stages**:

1. **Version Validation**: Same as CI
2. **Pre-flight Checks**: Full lint, typecheck, validate, test suite
3. **Build Artifacts**: Package templates, addons, migrations
4. **Determinism Probe** (optional): Verifies reproducible builds
5. **Create GitHub Release**: Publishes artifacts with SHA256 checksums
6. **Timing Report**: Performance monitoring

## Key Features

### Concurrency Control

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

- Cancels in-progress runs for same ref
- Prevents duplicate CI runs

### Intelligent Caching

- Uses pnpm store path caching (Context 7 recommended pattern)
- Cache key: `${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}`
- Restore keys provide fallback for partial cache hits

### Path Filters

- Ignores CI triggers for documentation-only changes
- Smoke tests skip on `[skip-smoke]` or `[docs]` in PR titles

### Matrix-Ready Design

Commented example for future multi-version testing:

```yaml
strategy:
  matrix:
    node-version: [22.x, 24.x]
    os: [ubuntu-latest, macos-latest]
```

## Scripts

### Version Validation

```bash
pnpm validate:versions
```

Standalone script to verify Node.js and pnpm versions meet requirements.

### Full CI Suite Locally

```bash
pnpm check-all  # Runs: lint → typecheck → validate → test:ci
```

## Implementation Notes

1. **No Hardcoded Versions**: All versions resolved from configuration files
2. **Corepack Usage**: Native pnpm management via Node.js Corepack
3. **Context 7 Compliance**: Follows GitHub Actions best practices for caching, concurrency, and node setup
4. **Artifact Validation**: Pre-flight checks prevent shipping development artifacts
5. **Size Budgets**: Enforces <25MB limit per template package

## Optimization Guidelines

If CI duration exceeds 8 minutes:

- Enable more parallel job execution
- Optimize dependency caching strategy
- Split large test suites
- Refine path filters to skip unnecessary jobs

## References

- [GitHub Actions Cache Documentation](https://github.com/actions/cache)
- [Node.js Setup Action](https://github.com/actions/setup-node)
- [Corepack Documentation](https://nodejs.org/api/corepack.html)
