# Release Notes

Template changes and improvements relevant to developers using this boilerplate.

## Version 2.0.0 (2025-08-16)

### 🎯 Documentation Architecture Overhaul

**Major Changes:**

- Complete restructure of documentation for better developer experience
- Hybrid model: colocated READMEs + centralized cross-cutting docs
- Removed 70+ KB of redundant/outdated documentation
- Fixed all broken links and standardized markdown formatting

**New Documentation Structure:**

- **Central Docs**: 8 focused guides covering architecture, conventions, API patterns
- **Colocated READMEs**: Standardized format for each package and service
- **Neutral Examples**: Replaced TODO-centric examples with realistic endpoints

**Breaking Changes:**

- Removed `docs/setup/`, `docs/development/`, `docs/frontend/`, `docs/packages/`
- Consolidated `SECURITY.md` and `MIDDLEWARE_EXTENSIBILITY.md` into central docs
- Updated all documentation links - existing bookmarks may be broken

**Migration Guide:**

- New docs entry point: [docs/getting-started.md](./getting-started.md)
- Architecture overview: [docs/architecture.md](./architecture.md)
- API development: [docs/api-overview.md](./api-overview.md)

## Version 1.0.0-beta.2 (Previous)

### 🚀 Core Infrastructure

**Added:**

- Redis rate-limiting addon with graceful fallback
- HMAC-based API authentication with scopes
- Type-safe API client with automatic validation
- Comprehensive error handling patterns
- Production-ready middleware patterns

**Infrastructure:**

- Next.js 15 with App Router
- TypeScript strict mode configuration
- ESLint + Prettier + Husky pre-commit hooks
- Vitest testing framework
- Turborepo monorepo setup with pnpm workspaces

**Packages:**

- `@atlas/api-client` - Type-safe HTTP client
- `@atlas/api-auth` - Authentication and authorization
- `@atlas/design-system` - Tailwind CSS preset and tokens
- `@atlas/config` - Shared configurations (ESLint, TypeScript, Prettier)
- `@atlas/rate-limit` - Rate limiting service
- `@atlas/query` - React Query utilities

## Migration Guide

### From 1.x to 2.0

1. **Documentation Updates**

   ```bash
   # Update bookmarks to new docs structure
   Old: docs/setup/GETTING_STARTED.md
   New: docs/getting-started.md

   Old: docs/packages/api-client.md
   New: packages/api-client/README.md
   ```

2. **No Code Changes Required**
   - All package APIs remain the same
   - Environment variables unchanged
   - Build scripts unchanged

3. **New Documentation Features**
   - Standardized README format across all packages
   - Clear extension points for adding features
   - Better coverage of testing strategies
   - Updated examples using real endpoints

### Breaking Changes Policy

We follow semantic versioning:

- **Major** (2.0.0): Breaking changes to APIs or documentation structure
- **Minor** (1.1.0): New features, backward compatible
- **Patch** (1.0.1): Bug fixes, documentation improvements

### Template Compatibility

This template is designed to be:

- ✅ **Forward Compatible**: New versions add features without breaking existing code
- ✅ **Tarball Portable**: All documentation uses relative links
- ✅ **Self-Contained**: No external dependencies for core functionality
- ✅ **Production Ready**: Includes security, monitoring, and CI patterns

## Upgrade Instructions

### Updating Documentation

If you're using an older version of this template:

1. **Review New Structure**
   - Check [getting-started.md](./getting-started.md) for setup changes
   - Review [architecture.md](./architecture.md) for system overview

2. **Update Internal Links**
   - Replace old documentation references
   - Update developer onboarding materials

3. **Adopt New Patterns**
   - Use colocated READMEs for package documentation
   - Follow standardized heading structure
   - Include "Last reviewed" dates

### Contributing to Template

1. **Documentation Changes**
   - Follow the standardized README template
   - Keep central docs under 7 minutes reading time
   - Use relative links only

2. **Code Changes**
   - Maintain backward compatibility
   - Add tests for new features
   - Update relevant documentation

## Roadmap

### Planned Features

- **Authentication**: Additional OAuth providers
- **Database**: Repository patterns and migration tools
- **Monitoring**: Observability and metrics collection
- **Deployment**: Container and serverless patterns

### Documentation Improvements

- **Interactive Examples**: Runnable code snippets
- **Video Guides**: Complex setup procedures
- **Architecture Diagrams**: Visual system overviews
- **Migration Tools**: Automated upgrade scripts

## Support

- **Template Issues**: Check existing patterns and extension points
- **Bug Reports**: Include template version and specific use case
- **Feature Requests**: Focus on common, production-ready patterns

---

_Last updated: 2025-08-16_  
_Template version: 2.0.0_
