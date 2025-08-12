# 🚀 Modern Turborepo Boilerplate

A minimal, production-ready monorepo starter with the latest web tooling. Perfect for building scalable applications without the bloat.

## 🎯 Recent Improvements

✅ **Clean Template Packaging** - All build artifacts automatically removed from releases  
✅ **Enhanced Package Structure** - Renamed `packages/system` to `packages/design-system` for clarity  
✅ **Professional CI Workflow** - Comprehensive GitHub Actions with quality gates and security audits  
✅ **Smoke Testing** - Automated template validation to ensure releases work correctly  
✅ **Modern Requirements** - Optimized for Node.js 22 LTS and pnpm 10.14.0

## ⚡ What's Inside

Everything you need, nothing you don't:

### 🏗️ **Core Architecture**

- **[Next.js 15.4](https://nextjs.org/)** - React framework with App Router
- **[Turborepo 2.5](https://turbo.build/repo)** - High-performance monorepo build system
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[pnpm](https://pnpm.io/)** - Fast, efficient package manager

### ⚡ **Performance & DX**

- **Turbopack** - Lightning fast development builds
- **Remote Caching** - Shared build cache across teams and CI
- **Turbo UI** - Enhanced terminal interface (`tui` mode)
- **Parallel Execution** - Optimized task scheduling
- **Smart Dependencies** - Workspace-aware builds

### 🔧 **Developer Experience**

- **ESLint 9.33** - Flat config with typescript-eslint v8 integration
- **Prettier 3.6** - Import sorting + Tailwind CSS class ordering
- **TypeScript 5.9** - Strict type checking with project service
- **VS Code** - Pre-configured workspace settings
- **Strict Environment Mode** - Secure environment variable handling
- **Quality Gates** - Type-check → Lint → Format → Build pipeline

### 📚 **Configuration System**

- **Centralized Configs** - Shared ESLint, Prettier, and TypeScript settings
- **Type-Safe Configs** - Full TypeScript definitions for all configs
- **No Conflicts** - ESLint and Prettier configured to work together
- **Multiple Presets** - Different configs for apps, libraries, and tests
- **[Documentation](./docs/development/CONFIG_SYSTEM.md)** - Complete configuration guide

### 📦 **Workspace Structure**

```
├── apps/
│   └── scope/                  # Next.js application
├── packages/
│   ├── ui/                     # Shared React components & theme
│   ├── design-system/          # Design system tokens
│   ├── api-client/             # Unified API client SDK
│   └── configs/                # Shared configurations
│       ├── eslint/             # ESLint v9 flat configs
│       ├── prettier/           # Prettier with plugins
│       └── typescript/         # TypeScript presets
├── services/
│   └── core/                   # Core domain service
├── docs/                       # Documentation
├── turbo.json                  # Pipeline definitions
└── pnpm-workspace.yaml         # Workspace configuration
```

## 🚀 **Getting Started**

### Prerequisites

- Node.js >= 22.18.0
- pnpm 10.14.0 (exact version)

### Quick Start

```bash
# Clone this boilerplate
git clone <your-repo-url> my-project
cd my-project

# Install dependencies
pnpm install

# Start development
pnpm dev

# Build everything
pnpm build

# Run quality checks
pnpm check-all
```

### Development Commands

```bash
pnpm dev          # Start all apps in development
pnpm build        # Build all packages and apps
pnpm type-check   # Run TypeScript checks
pnpm lint         # Run ESLint
pnpm format       # Format with Prettier
pnpm test         # Run tests (when added)
pnpm clean        # Clean build outputs
```

## 📋 **Enterprise Features**

### 🏗️ **Monorepo Benefits**

- **Code Sharing** - Reuse components, utilities, and configs
- **Atomic Commits** - Change multiple packages in single PR
- **Consistent Tooling** - Unified linting, formatting, and builds
- **Dependency Management** - Shared dependencies and workspace references

### ⚡ **Turborepo Advantages**

- **Smart Caching** - Only rebuild what changed
- **Remote Cache** - Share builds across team and CI
- **Parallel Tasks** - Maximum utilization of system resources
- **Incremental Builds** - Faster CI/CD pipelines

### 🔒 **Enterprise Security**

- **Strict TypeScript** - Maximum type safety
- **Environment Isolation** - Strict environment variable scoping
- **Dependency Scanning** - Built-in security checks
- **Code Quality Gates** - Prevent bad code from reaching production

## 🎯 **Customization Guide**

### Adding New Apps

```bash
# Create new Next.js app
mkdir apps/admin
cd apps/admin
# ... setup Next.js app
# Add to pnpm-workspace.yaml and configure dependencies
```

### Adding New Packages

```bash
# Create new shared package
mkdir packages/database
cd packages/database
# ... setup package
# Configure in turbo.json tasks
```

### Configuring Remote Cache

```bash
# Login to Vercel (or your remote cache provider)
npx turbo login

# Link repository
npx turbo link
```

### Custom Task Pipeline

Edit `turbo.json` to customize build pipelines:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build", "type-check"],
      "outputs": [".next/**", "dist/**"]
    }
  }
}
```

## 🏢 **Production Ready**

This boilerplate is configured for enterprise production deployment:

- **Vercel** - Zero-config deployments with remote caching
- **Docker** - Multi-stage builds with workspace pruning
- **CI/CD** - GitHub Actions, GitLab CI, CircleCI examples
- **Monitoring** - Built-in performance tracking
- **Security** - CSP headers, environment validation

## 🤝 **Best Practices Included**

- **Workspace Dependencies** - Proper internal package references
- **Build Optimization** - Efficient caching and parallel execution
- **Type Safety** - Strict TypeScript across all packages
- **Code Quality** - ESLint + Prettier with import sorting
- **Git Hooks** - Pre-commit quality checks (easily configurable)
- **Documentation** - Package documentation templates

## 📚 **Documentation**

Comprehensive guides organized by topic in `/docs`:

**🚀 Getting Started:**

- **[📖 Getting Started](./docs/setup/GETTING_STARTED.md)** - Quick setup and first steps
- **[🏗️ Project Structure](./docs/setup/PROJECT_STRUCTURE.md)** - Understanding the monorepo
- **[🔧 Development Workflow](./docs/development/WORKFLOW.md)** - Daily development patterns

**🎨 Frontend & Styling:**

- **[🎨 Tailwind CSS](./docs/frontend/TAILWIND.md)** - Complete styling guide
- **[🔤 Custom Fonts](./docs/setup/FONT_SETUP.md)** - Font integration guide
- **[🌍 Environment Setup](./docs/setup/ENVIRONMENT.md)** - Environment configuration

**📚 All Documentation:**

- **[📖 Documentation Hub](./docs/)** - Complete index of all guides

## 📚 **Next Steps**

After using this boilerplate:

1. **Customize the UI Package** - Add your design system components
2. **Configure Remote Cache** - Set up team caching for faster builds
3. **Add Testing** - Integrate Vitest or Jest with Turborepo
4. **Setup CI/CD** - Configure deployment pipelines
5. **Add More Apps** - Create admin panels, landing pages, etc.
6. **Database Integration** - Add Prisma, Drizzle, or your preferred ORM

## 💡 **Why This Boilerplate?**

- **⏰ Time to Market** - Skip weeks of configuration, start building features
- **🏗️ Scalable Architecture** - Grows with your team and codebase
- **🔧 Latest Tooling** - Always up-to-date with modern best practices
- **📈 Performance First** - Optimized for speed and developer experience
- **🏢 Enterprise Ready** - Battle-tested patterns for production workloads

---

**Built with ❤️ for modern development teams**

Ready to build something amazing? Start with this boilerplate and focus on what matters - your product.
