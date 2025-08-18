# Getting Started

Production-ready monorepo template with Next.js, TypeScript, and enterprise-grade tooling.

## What's Included

- **Apps**: Next.js 15 web application with API routes
- **Domains**: Business logic and feature modules (expandable)
- **Services**: Infrastructure services (rate-limiting, repository pattern)
- **Packages**: Shared libraries (API client, auth, design system, config)
- **Tooling**: TypeScript, ESLint, Prettier, Vitest, pnpm workspaces

## Quick Start

### Prerequisites

- Node.js 22.18.0 (see `.nvmrc`)
- pnpm 10.14.0 (see `packageManager` in package.json)

### Setup

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Environment setup**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Development server**

   ```bash
   pnpm dev
   ```

4. **Verify setup**

   ```bash
   # Run all checks
   pnpm check-all

   # Individual commands
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```

## Template Boundaries

This template provides:

- ✅ Production-ready infrastructure
- ✅ Authentication and authorization patterns
- ✅ Rate limiting and security
- ✅ Type-safe API client
- ✅ Testing framework setup
- ✅ CI/CD patterns

You customize:

- 🎯 Business domains and features
- 🎯 Database schema and models
- 🎯 UI components and styling
- 🎯 External integrations

## Project Structure

```
templates/full/
├── apps/web/          # Next.js application
├── domains/           # Business logic modules
├── services/          # Infrastructure services
├── packages/          # Shared libraries
└── docs/             # Documentation
```

## Next Steps

- **Architecture**: [architecture.md](./architecture.md) - System overview
- **API Development**: [api-overview.md](./api-overview.md) - API patterns
- **Conventions**: [conventions.md](./conventions.md) - Code standards
- **Security**: [auth-and-security.md](./auth-and-security.md) - Auth setup

## Common Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm clean:templates        # Clean template artifacts

# Quality checks
pnpm lint                   # ESLint
pnpm typecheck             # TypeScript
pnpm test                  # Vitest
pnpm check-all             # All checks

# Build
pnpm build                 # Production build
```
