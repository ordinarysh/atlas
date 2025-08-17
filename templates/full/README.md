# Atlas Full-Stack Template

Enterprise-grade TypeScript monorepo with Next.js, authentication, and production-ready tooling.

## 🚀 Quick Start

```bash
pnpm install && pnpm dev
```

Visit [localhost:3000](http://localhost:3000) to see your app.

## What's Included

- **Next.js 15** - App router with TypeScript
- **Authentication** - API keys with scoped permissions  
- **Rate Limiting** - Production-ready with Redis support
- **Design System** - Tailwind v4 with semantic tokens
- **Monorepo** - Turborepo with pnpm workspaces

## Project Structure

```
apps/web/              # Next.js application
packages/              # Shared packages
├── api-auth/          # Authentication system
├── design-system/     # Tailwind preset & tokens
└── ui/               # Component library
services/rate-limit/   # Rate limiting service
docs/                 # Documentation
```

## Essential Commands

```bash
pnpm dev              # Start development
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm type-check       # TypeScript validation
pnpm lint             # Code linting
```

## Documentation

- **[🏗️ Apps](./apps/)** - Frontend applications
- **[📦 Services](./services/)** - Backend services  
- **[🎨 Packages](./packages/)** - Shared libraries
- **[📚 Guides](./docs/)** - Setup & development guides

## Next Steps

1. **[Getting Started](./docs/getting-started.md)** - Setup and configuration
2. **[Development Guide](./docs/conventions.md)** - Coding standards and workflow
3. **[Authentication](./packages/api-auth/)** - API security
4. **[Styling](./packages/design-system/)** - Design system

---

Built for modern development teams who value quality, speed, and maintainability.