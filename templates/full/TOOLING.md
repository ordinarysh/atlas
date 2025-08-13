# Template Tooling Configuration

This template includes comprehensive development tooling configurations for maintaining code quality and consistency across your monorepo.

## Included Configuration Files

The template comes with pre-configured tooling files ready to use:

| Configuration File      | Purpose                                        |
| ----------------------- | ---------------------------------------------- |
| `.lintstagedrc.mjs`     | Pre-commit hooks for code quality enforcement |
| `.prettierrc`           | Code formatting rules with import sorting     |
| `eslint.config.mjs`     | ESLint configuration for code quality         |
| `.gitignore`            | Git ignore patterns                           |
| `.npmrc`                | NPM configuration                             |
| `.nvmrc`                | Node.js version specification                 |
| `.env.example`          | Environment variable template                 |

## Getting Started with Atlas CLI

When you generate a project using the Atlas CLI, all configurations are automatically set up:

```bash
# Generate a new project with full template
atlas create my-project --template=full
```

## Development Workflow

Your template includes a complete development workflow:

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

## Tooling Architecture

### 📦 **Monorepo Configuration**
- **Turborepo** (`turbo.json`) - Build system and task orchestration
- **pnpm Workspace** (`pnpm-workspace.yaml`) - Package management
- **TypeScript Project References** (`tsconfig.*.json`) - Type checking optimization

### 🔧 **Code Quality**
- **ESLint 9** with flat config - Modern linting with TypeScript support
- **Prettier 3** with plugins - Code formatting with import sorting and Tailwind class ordering
- **lint-staged** - Pre-commit hooks for staged files only

### 🏗️ **Build & Development**
- **Next.js 15** - React framework with App Router
- **Tailwind CSS 4** - Utility-first styling
- **Vitest** - Fast unit testing framework

## Configuration Inheritance

The template uses a centralized configuration system:

```
packages/configs/
├── eslint/           # Shared ESLint configurations
├── prettier/         # Prettier with plugins
└── typescript/       # TypeScript presets
```

This ensures consistency across all packages while allowing customization when needed.

For more detailed setup instructions, see `docs/setup/GETTING_STARTED.md`.
