# Git Hooks Documentation

## Overview

This repository uses Git hooks to maintain code quality and consistency. The hooks are:

- **Cross-platform** (Windows, macOS, Linux)
- **Fast** (<5s typical pre-commit, <30s pre-push)
- **CI-aware** (automatically skip in CI environments)
- **Template-safe** (no linting/formatting of template payloads)

## Installed Hooks

### pre-commit

- ✅ Runs ESLint with --fix on staged JS/TS files (excludes templates/\*\*)
- ✅ Runs TypeScript type checking
- ✅ Formats JSON/YAML/Markdown with Prettier
- ✅ Validates schema files when changed
- ✅ Blocks forbidden files in templates/\*\* (node_modules, .env, lockfiles, etc.)
- ✅ Warns on large files (>1MB), blocks huge files (>5MB)
- ⏱️ Typical runtime: <5 seconds

### commit-msg

- ✅ Enforces Conventional Commits format
- ✅ Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`, `wip`
- ✅ Scope is optional (any scope allowed)
- ✅ Max header length: 72 characters
- ✅ Allows `wip:` commits on feature branches

### pre-push

- ✅ Runs incremental schema validation (only changed files)
- ✅ Light TypeScript check on changed files
- ⏱️ Typical runtime: <30 seconds

## Bypassing Hooks

When necessary, you can bypass hooks using `--no-verify`:

```bash
# Bypass pre-commit hook
git commit --no-verify -m "emergency: fix production issue"

# Bypass pre-push hook
git push --no-verify
```

⚠️ **Use sparingly!** Bypassing hooks may introduce issues.

## Common Issues & Fixes

### "Forbidden files detected in templates/\*\*"

**Problem**: You're trying to commit build artifacts or sensitive files to template payloads.
**Fix**: Remove these files from staging:

```bash
git reset HEAD templates/full/node_modules
git reset HEAD templates/full/.env
```

### "File exceeds 5MB limit"

**Problem**: Large file detected that shouldn't be in version control.
**Fix**: Consider using Git LFS or storing the file elsewhere:

```bash
git lfs track "*.zip"
git add .gitattributes
```

### "Commit message validation failed"

**Problem**: Your commit message doesn't follow Conventional Commits format.
**Fix**: Use the correct format:

```bash
# Good examples:
git commit -m "feat: add dark mode support"
git commit -m "fix(auth): resolve login timeout issue"
git commit -m "docs: update API documentation"

# Bad examples:
git commit -m "Updated stuff"        # No type
git commit -m "feat Add feature"     # Missing colon
git commit -m "FEAT: add feature"    # Uppercase type
```

### "TypeScript type check failed"

**Problem**: Type errors in staged TypeScript files.
**Fix**: Fix the type errors before committing:

```bash
pnpm typecheck  # See all errors
pnpm lint --fix # Auto-fix what's possible
```

### Hooks not running

**Problem**: Husky not installed properly.
**Fix**: Reinstall hooks:

```bash
pnpm install
pnpm prepare
```

## Configuration

### Disable hooks in CI

Hooks automatically skip when `CI=true` environment variable is set.

### Disable commitlint for forks

Set the `DISABLE_COMMITLINT` environment variable:

```bash
export DISABLE_COMMITLINT=true
```

### Version Requirements

- Node.js: v22+
- pnpm: v10.14.1+

Hooks will gracefully skip if versions are too old, with a warning message.

## Development

Hook scripts are located in:

- `scripts/hooks/precommit.mjs` - Pre-commit logic
- `scripts/hooks/prepush.mjs` - Pre-push logic
- `.lintstagedrc.mjs` - Lint-staged configuration
- `commitlint.config.cjs` - Commit message rules

To modify hook behavior, edit these files directly.
