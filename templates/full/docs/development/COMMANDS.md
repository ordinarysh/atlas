# Running Commands from Any Directory

## Quick Solution

Add `-w` flag to run any root script from anywhere:

```bash
# From any subdirectory:
pnpm -w lint        # Runs root lint
pnpm -w build       # Runs root build
pnpm -w dev         # Runs root dev
pnpm -w type-check  # Runs root type-check
pnpm -w check-all   # Runs all checks
```

## Why This Works

The `-w` flag tells pnpm to run the command in the workspace root, regardless of your current
directory.

## Shell Alias (Optional)

Add to your `.bashrc` or `.zshrc`:

```bash
alias pw="pnpm -w"
```

Then use:

```bash
pw lint
pw build
pw dev
```

## Package-Specific Commands

To run commands in specific packages from anywhere:

```bash
pnpm --filter @repo/scope dev
pnpm --filter @repo/ui build
pnpm -F @repo/design-system test  # -F is short for --filter
```
