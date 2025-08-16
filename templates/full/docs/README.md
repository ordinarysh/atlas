# Documentation Hub

Enterprise-grade monorepo template with Next.js, TypeScript, and production-ready patterns.

## Quick Start

New to Atlas? Start here:

1. **[Getting Started](./getting-started.md)** - Setup and first steps
2. **[Architecture](./architecture.md)** - System overview and design
3. **[Conventions](./conventions.md)** - Code standards and practices
4. **[API Overview](./api-overview.md)** - API development patterns

## Central Documentation

### System Design
- **[Architecture](./architecture.md)** - Modular monorepo architecture and request lifecycle
- **[Conventions](./conventions.md)** - Naming, TypeScript patterns, testing, and PR standards
- **[API Overview](./api-overview.md)** - Route handlers, controller patterns, and response envelopes

### Security & Infrastructure  
- **[Authentication & Security](./auth-and-security.md)** - API keys, HMAC validation, and security patterns
- **[Addons & Extensions](./addons.md)** - Redis, Sentry, and middleware integration patterns
- **[CI & Automation](./ci-and-automation.md)** - Template validation, quality checks, and build processes

### Project Management
- **[Getting Started](./getting-started.md)** - Installation, setup, and project structure overview
- **[Release Notes](./release-notes.md)** - Version history and migration guides

## Colocated Documentation

### Application Layer
- **[Web App](../apps/web/README.md)** - Next.js application with API routes and frontend

### Domain Layer
- **[Domains](../domains/README.md)** - Business logic, validation, and feature modules

### Service Layer
- **[Rate Limiting](../services/rate-limit/README.md)** - Provider-agnostic rate limiting service
- **[Repository](../services/repository/README.md)** - Data access patterns and persistence

### Package Layer
- **[API Client](../packages/api-client/README.md)** - Type-safe HTTP client with validation
- **[API Auth](../packages/api-auth/README.md)** - Authentication and authorization
- **[Config](../packages/config/README.md)** - Shared ESLint, TypeScript, and Prettier configs
- **[Query](../packages/query/README.md)** - React Query utilities and caching patterns
- **[Design System](../packages/design-system/README.md)** - Tailwind CSS preset and design tokens
- **[UI Components](../packages/ui/README.md)** - Base UI component library

## Technology Stack

**Core Framework:**
- ⚡ Next.js 15 + React + TypeScript
- 🎨 Tailwind CSS v4 + Design System
- 🔐 HMAC API Authentication + Rate Limiting

**Data & State:**
- 📊 React Query + Type-safe API Client
- ✅ Zod Validation + Domain-Driven Design
- 🗄️ Repository Pattern + Transaction Support

**Development:**
- 🧪 Vitest + TypeScript Strict Mode
- 🔍 ESLint + Prettier + Pre-commit Hooks
- 🏗️ Turborepo + pnpm Workspaces

## Navigation Guide

**Setting up the project?** → [Getting Started](./getting-started.md)
**Understanding the codebase?** → [Architecture](./architecture.md)
**Building APIs?** → [API Overview](./api-overview.md)
**Adding authentication?** → [Authentication & Security](./auth-and-security.md)
**Extending functionality?** → [Addons & Extensions](./addons.md)
**Setting up CI/CD?** → [CI & Automation](./ci-and-automation.md)

## Documentation Principles

- **Colocated Truth**: Each folder has a README with extension points
- **Central Cross-cutting**: Shared patterns documented centrally
- **Tarball Portable**: All links are relative, no external dependencies
- **Enterprise Ready**: Production patterns with security and performance focus

---

*Atlas Template v2.0.0 | Last updated: 2025-08-16*