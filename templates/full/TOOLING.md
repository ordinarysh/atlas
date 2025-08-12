# Template Tooling Configuration

This template uses a special pattern to handle development tooling configurations that need to be present in the final project but would interfere with the parent repository's tooling during development.

## The `.tpl` Pattern

Configuration files that would auto-discover and conflict with parent repository tooling are stored with `.tpl` extensions:

| Template File | Final File | Purpose |
|---------------|------------|---------|
| `lintstagedrc.mjs.tpl` | `.lintstagedrc.mjs` | Lint-staged configuration for pre-commit hooks |
| `prettierrc.tpl` | `.prettierrc` | Prettier code formatting rules |
| `eslint.config.mjs.tpl` | `eslint.config.mjs` | ESLint configuration for code quality |

## Automatic Restoration

When you generate a project using the Atlas CLI, these files are automatically restored to their proper names with working configurations.

```bash
# This happens automatically during project generation
atlas create my-project --template=full
```

## Manual Restoration

If you're working with the template directly or the automatic restoration didn't run, you can manually restore the configurations:

```bash
# From your project root
node scripts/post-extract.mjs
```

This script will:
1. Find all `.tpl` files in the project root
2. Rename them to their final dotfile names
3. Provide you with next steps

## Why This Pattern?

This approach provides several enterprise-grade benefits:

### 🚫 **Prevents Tooling Conflicts**
- Template configurations don't interfere with parent repo's lint-staged
- No more `--no-verify` commits or bypassed quality gates
- Clean separation of concerns between template and parent repository

### 🔧 **Preserves User Experience**
- Generated projects get full, working tooling configurations
- No manual setup required after project generation
- All quality gates work out of the box

### 📦 **Enterprise-Grade Isolation**
- Templates can have their own specific configurations
- Parent repository maintains its own quality standards
- Scalable across multiple templates with different requirements

## What Gets Restored?

After running the post-extract script, your project will have:

- **`.lintstagedrc.mjs`**: Pre-commit hooks for code quality
- **`.prettierrc`**: Code formatting configuration
- **`eslint.config.mjs`**: Linting rules and quality checks

Plus all the standard configuration files:
- `.gitignore`: Git ignore patterns
- `.npmrc`: NPM configuration
- `.nvmrc`: Node.js version specification
- `.env.example`: Environment variable template

## Troubleshooting

### Script Not Found
If `scripts/post-extract.mjs` doesn't exist, the template may have been manually copied. Check that you have all the necessary files or regenerate using the Atlas CLI.

### Permission Errors
Make sure you have write permissions in the project directory:

```bash
chmod +x scripts/post-extract.mjs
node scripts/post-extract.mjs
```

### Missing Files
If some `.tpl` files are missing, they may have already been restored or not included in your template copy. The script will safely skip missing files and report what it finds.

## Development Workflow

Once your configurations are restored:

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Start Development**
   ```bash
   pnpm dev:web  # Starts the Next.js app
   ```

3. **Quality Checks**
   ```bash
   pnpm lint        # Run linting
   pnpm typecheck   # Type checking
   pnpm test        # Run tests
   ```

4. **Commit Changes**
   Your pre-commit hooks will automatically run quality checks before each commit.

For more detailed setup instructions, see `docs/setup/GETTING_STARTED.md`.