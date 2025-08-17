# Architecture

Modular monorepo architecture with clear separation of concerns and enterprise-grade patterns.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User Request                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                     apps/web                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Next.js App Router (src/app/)                       │    │
│  │ • API Routes (/api/*)                               │    │
│  │ • Pages & Components                                │    │
│  │ • Middleware (optional)                             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                    domains/                                │
│  Business Logic & Feature Modules (expandable)             │
│  • Domain-specific validation                              │
│  • Business rules and workflows                            │
│  • Feature coordination                                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                   services/                                │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  rate-limit/    │  │  repository/    │                  │
│  │  Rate limiting  │  │  Data access    │                  │
│  │  & protection   │  │  patterns       │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                   packages/                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ api-client/ │ │ api-auth/   │ │ design-sys/ │           │
│  │ Type-safe   │ │ Auth &      │ │ UI tokens & │           │
│  │ HTTP client │ │ security    │ │ components  │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ config/     │ │ query/      │ │ ui/         │           │
│  │ Shared      │ │ React Query │ │ Base UI     │           │
│  │ configs     │ │ utilities   │ │ primitives  │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Module Relationships

### Apps Layer

- **Purpose**: User interface and API endpoints
- **Responsibilities**: Routing, request handling, response formatting
- **Dependencies**: domains/, packages/

### Domains Layer

- **Purpose**: Business logic and feature coordination
- **Responsibilities**: Validation, business rules, workflows
- **Dependencies**: services/, packages/

### Services Layer

- **Purpose**: Infrastructure and cross-cutting concerns
- **Responsibilities**: Data access, rate limiting, external integrations
- **Dependencies**: packages/

### Packages Layer

- **Purpose**: Shared utilities and configuration
- **Responsibilities**: Reusable code, type definitions, tooling
- **Dependencies**: None (base layer)

## Request Lifecycle

### API Request Flow

```
1. Request → apps/web/src/app/api/[route]/route.ts
2. Rate limiting → services/rate-limit
3. Authentication → packages/api-auth
4. Business logic → domains/[feature]
5. Data access → services/repository
6. Response formatting → apps/web
```

### Example: GET /api/profile

```typescript
// 1. Route handler (apps/web)
export async function GET(request: NextRequest) {
  // 2. Rate limiting (services/rate-limit)
  const rateLimitResult = await requireRateLimit(request, { limiter: "standard" });
  if (rateLimitResult.type === "blocked") return rateLimitResult.response;

  // 3. Authentication (packages/api-auth)
  const auth = await requireApiKey("read:profile");
  if (auth instanceof NextResponse) return auth;

  // 4. Business logic (domains/user)
  const profile = await getUserProfile(auth.userId);

  // 5. Response (apps/web)
  const response = NextResponse.json({ data: profile });
  rateLimitResult.setHeaders(response);
  return response;
}
```

## Module Dependencies

```
apps/web
  ├── domains/*
  ├── packages/api-client
  ├── packages/api-auth
  ├── packages/design-system
  ├── packages/ui
  └── packages/config

domains/*
  ├── services/*
  ├── packages/api-auth
  └── packages/config

services/*
  ├── packages/config
  └── packages/query (optional)

packages/*
  └── (no internal dependencies)
```

## Design Principles

- **Unidirectional Dependencies**: Higher layers depend on lower layers only
- **Interface Segregation**: Each package has a focused, single responsibility
- **Dependency Injection**: Services accept configuration, not hard-coded values
- **Type Safety**: Full TypeScript coverage with strict settings
- **Testability**: Clear boundaries enable isolated unit testing

## Extension Points

- **New Features**: Add domain modules in `domains/`
- **New Services**: Add infrastructure in `services/`
- **New Packages**: Add shared utilities in `packages/`
- **External APIs**: Integrate via services layer with proper abstraction

## Links

- **API Patterns**: [api-overview.md](./api-overview.md)
- **Code Standards**: [conventions.md](./conventions.md)
- **Security Model**: [auth-and-security.md](./auth-and-security.md)
- **Extension Guide**: [addons.md](./addons.md)
