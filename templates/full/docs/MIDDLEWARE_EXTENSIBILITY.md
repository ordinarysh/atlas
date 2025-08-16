# Middleware Extensibility Guide

This document explains how to extend the Atlas API boilerplate with custom middleware, particularly for add-ons like database integration, external services, and monitoring.

## Architecture Overview

**Atlas uses route-level enforcement by default** for authentication and rate limiting. The middleware is optional and disabled by default, providing only coarse global protection when enabled.

### Route-Level First (Default)

All authentication and rate limiting happens at the route level:

```typescript
export const GET = withErrorHandling(async (request: NextRequest) => {
  // 1. Rate limiting
  const rateLimitResult = await requireRateLimit(request, { limiter: "standard" });
  if (rateLimitResult.type === "blocked") return rateLimitResult.response;

  // 2. Authentication
  const auth = await requireApiKey("read:projects");
  if (auth instanceof NextResponse) return auth;

  // 3. Business logic
  const data = await getData();

  const response = NextResponse.json({ data });
  rateLimitResult.setHeaders(response);
  return response;
});
```

### Optional Middleware (Disabled by Default)

When enabled with `GLOBAL_SHIELD=1`, the middleware provides only basic security headers and logging. It does **not** handle authentication or rate limiting.

## Current Middleware Architecture (When Enabled)

The optional Atlas middleware includes:

- **Enterprise Security Headers**: Complete security header suite including CSP, HSTS, X-Frame-Options, and more
- **Request Correlation**: UUID-based request correlation for distributed tracing
- **Structured Logging**: Basic request logging (detailed logging is at route level)
- **CORS**: Basic CORS configuration for API access
- **Feature Flag Guard**: Disabled by default, only runs when `GLOBAL_SHIELD=1`

**Note**: Authentication, rate limiting, request validation, and error handling are all handled at the route level for better performance and control.

### Security-First Design

The middleware (when enabled) implements basic security layers:

- **Content Security Policy (CSP)** with strict directives
- **HTTP Strict Transport Security (HSTS)** with preload
- **Cross-Origin policies** for embedder/opener/resource protection
- **Request correlation** for distributed tracing

**Route-level security** (always active):

- **API key authentication** with timing-safe comparisons via `requireApiKey()`
- **Rate limiting** with different presets via `requireRateLimit()`
- **Input validation** and size limits via `validateRequest()`
- **Security event logging** for monitoring and alerts

### Interface-Based Architecture

The middleware uses interface-based design for easy addon swapping:

- **Rate limiting stores** can be swapped from memory to Redis
- **API key stores** can be swapped from memory to database
- **Authentication systems** can be extended for OAuth, JWT, etc.

## Enabling Optional Middleware

The Atlas middleware is **disabled by default**. To enable it:

1. **Rename the example file:**

   ```bash
   mv src/middleware.example.ts src/middleware.ts
   ```

2. **Set the environment variable:**

   ```bash
   GLOBAL_SHIELD=1
   ```

3. **Restart your application**

## Adding Custom Middleware

### 1. Route-Level Extensions (Recommended)

For most use cases, add functionality at the route level:

```typescript
export const GET = withErrorHandling(async (request: NextRequest) => {
  // 1. Custom pre-processing
  const customContext = await yourCustomFunction(request);

  // 2. Rate limiting
  const rateLimitResult = await requireRateLimit(request, { limiter: "standard" });
  if (rateLimitResult.type === "blocked") return rateLimitResult.response;

  // 3. Authentication
  const auth = await requireApiKey("read:projects");
  if (auth instanceof NextResponse) return auth;

  // 4. Your business logic with custom context
  const data = await getData(customContext);

  const response = NextResponse.json({ data });
  rateLimitResult.setHeaders(response);
  return response;
});
```

### 2. Global Middleware Extensions

To add middleware that runs before the optional Atlas middleware, create a new middleware file:

```typescript
// middleware-custom.ts
import { NextRequest, NextResponse } from "next/server";

export function customMiddleware(request: NextRequest) {
  // Your custom logic here
  console.log("Custom middleware running before Atlas middleware");

  // Continue to Atlas middleware
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
```

Then chain it with the Atlas middleware in your main middleware file.

### 3. Extending the Atlas Middleware

For add-ons that need to integrate with the optional Atlas middleware (like monitoring), you can extend it:

```typescript
// In your add-on package
import { NextRequest, NextResponse } from "next/server";
import { createRequestLogger } from "@/lib/logger";

export function withMonitoring(request: NextRequest, response: NextResponse, requestId: string) {
  const logger = createRequestLogger(requestId);

  // Add monitoring headers
  const startTime = Date.now();

  // Log request
  logger.info("Request processed", {
    path: request.nextUrl.pathname,
    method: request.method,
    userAgent: request.headers.get("user-agent"),
  });

  // Add timing headers
  response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);
  response.headers.set("X-Request-Source", "atlas-middleware");

  return response;
}
```

**Important**: Authentication should still be handled at the route level using `requireApiKey()` for security and performance.

### 3. Route Handler Context

The Atlas middleware adds comprehensive request context that your add-ons can use:

```typescript
import { getAuthContext, getRequestId, extractRequestContext } from "@/lib/api-utils";

// Available headers added by Atlas middleware
const requestId = getRequestId(request); // UUID for request correlation
const authContext = getAuthContext(request); // API key authentication context

// Full request context
const context = extractRequestContext(request);
console.log(context);
// {
//   requestId: 'uuid',
//   authContext: { apiKey: {...}, clientIp: '...' },
//   method: 'GET',
//   pathname: '/api/todos',
//   query: { page: '1', limit: '20' },
//   userAgent: '...',
//   contentType: 'application/json',
//   clientIp: '192.168.1.1'
// }

// Authentication context when API key is provided
if (authContext) {
  console.log(authContext.apiKey.id); // API key ID
  console.log(authContext.apiKey.name); // API key name
  console.log(authContext.apiKey.permissions); // ['read', 'write']
  console.log(authContext.clientIp); // Client IP address
}
```

## Common Add-on Patterns

### Authentication Add-on

```typescript
// auth-addon/middleware.ts
export function authMiddleware(request: NextRequest) {
  // Skip auth for public routes
  if (isPublicRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Verify authentication
  const session = getSessionFromRequest(request);
  if (!session) {
    return redirectToLogin(request);
  }

  // Add user context for route handlers
  const response = NextResponse.next();
  response.headers.set("X-User-Id", session.userId);
  response.headers.set("X-User-Role", session.role);

  return response;
}
```

### Database Connection Add-on

```typescript
// db-addon/middleware.ts
export function dbMiddleware(request: NextRequest) {
  // Initialize database connection per request
  const response = NextResponse.next();

  // Add database context to request
  response.headers.set("X-DB-Connection-Id", generateConnectionId());

  return response;
}
```

### Monitoring Add-on

```typescript
// monitoring-addon/middleware.ts
export function monitoringMiddleware(request: NextRequest) {
  const startTime = Date.now();

  const response = NextResponse.next();

  // Add timing headers
  response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);

  // Send metrics to monitoring service
  sendMetrics({
    path: request.nextUrl.pathname,
    method: request.method,
    duration: Date.now() - startTime,
  });

  return response;
}
```

## Configuration Integration

Add-ons should integrate with the Atlas config system:

```typescript
// your-addon/config.ts
import { z } from "zod";

export const addonConfigSchema = z.object({
  YOUR_ADDON_API_KEY: z.string().min(1),
  YOUR_ADDON_ENDPOINT: z.string().url(),
});

// Extend Atlas config
declare module "@atlas/config" {
  interface Config {
    yourAddon: z.infer<typeof addonConfigSchema>;
  }
}
```

## Request Context Pattern

Use the request context pattern to pass data between middleware and route handlers:

```typescript
// In middleware
response.headers.set("X-Context-Data", JSON.stringify(contextData));

// In route handler
export async function GET(request: NextRequest) {
  const contextData = JSON.parse(request.headers.get("X-Context-Data") || "{}");

  // Use context data in your handler
}
```

## Error Handling Integration

Add-ons should use the Atlas error handling system:

```typescript
import { ApiError, API_ERROR_CODES } from "@atlas/api-utils";

// In your add-on
if (authFailed) {
  throw ApiError.unauthorized("Invalid authentication token");
}

// Custom error codes
export const YOUR_ADDON_ERRORS = {
  CUSTOM_ERROR: "CUSTOM_ERROR",
} as const;
```

## Logging Integration

Use the Atlas logger for consistent logging:

```typescript
import { logger, createRequestLogger } from "@atlas/logger";

// In middleware
const requestLogger = createRequestLogger(requestId, {
  addon: "your-addon-name",
});

requestLogger.info("Add-on processing request", {
  customData: "value",
});
```

## Testing Middleware Extensions

```typescript
// your-addon/tests/middleware.test.ts
import { NextRequest } from "next/server";
import { yourAddonMiddleware } from "../middleware";

describe("Your Add-on Middleware", () => {
  it("should handle authenticated requests", async () => {
    const request = new NextRequest("http://localhost/api/protected", {
      headers: { authorization: "Bearer valid-token" },
    });

    const response = await yourAddonMiddleware(request);

    expect(response.headers.get("X-User-Id")).toBeTruthy();
  });
});
```

## API Key Management

Atlas includes a complete API key management system for secure API access:

### Creating API Keys

```typescript
import { createApiKeyStore } from "@/lib/auth/api-key-store";
import { API_PERMISSIONS, PERMISSION_GROUPS } from "@/lib/auth/api-keys";

const apiKeyStore = createApiKeyStore();

// Create a new API key
const { apiKey, rawKey } = await apiKeyStore.create({
  name: "Frontend App Key",
  permissions: PERMISSION_GROUPS.standard, // ['read', 'write', 'health']
  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  ipWhitelist: ["192.168.1.0/24"], // Optional IP restrictions
  rateLimit: { requests: 100, windowMs: 60000 }, // Optional custom rate limit
});

// Store the hash, show the raw key only once
console.log("API Key (show only once):", rawKey);
console.log("Key ID for logging:", apiKey.id);
```

### Using API Keys in Requests

```bash
# Using Authorization header (recommended)
curl -H "Authorization: Bearer atlas_your-api-key-here" \
  http://localhost:3000/api/todos

# Using X-API-Key header
curl -H "X-API-Key: atlas_your-api-key-here" \
  http://localhost:3000/api/todos
```

### Permission System

```typescript
// Standard permissions
API_PERMISSIONS = {
  READ: "read", // List and view resources
  WRITE: "write", // Create and update resources
  DELETE: "delete", // Delete resources
  ADMIN: "admin", // Bypass all permission checks

  // Specific resources
  USERS_READ: "users:read",
  USERS_WRITE: "users:write",

  // API management
  KEYS_READ: "keys:read",
  KEYS_WRITE: "keys:write",
  KEYS_DELETE: "keys:delete",

  // System operations
  HEALTH: "system:health",
  METRICS: "system:metrics",
};

// Permission groups for easier management
PERMISSION_GROUPS = {
  readonly: ["read", "system:health"],
  standard: ["read", "write", "system:health"],
  admin: ["admin"], // Admin bypasses all checks
  service: ["read", "write", "system:health", "system:metrics"],
};
```

### Route Protection

```typescript
import { requirePermission, requireAnyPermission } from "@/lib/api-utils";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Require specific permission
  requirePermission(request, API_PERMISSIONS.READ);

  // Your route logic here
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Require any of multiple permissions
  requireAnyPermission(request, [API_PERMISSIONS.WRITE, API_PERMISSIONS.ADMIN]);

  // Your route logic here
});
```

### Development Setup

In development, Atlas automatically creates a development API key:

```typescript
// Development key (created automatically)
Key: atlas_dev_key_for_local_testing_only_12345;
Permissions: ["read", "write", "delete", "system:health", "keys:read"];

// This key is logged on startup and works only in development
```

## Rate Limiting System

Atlas includes an advanced, interface-based rate limiting system:

### Rate Limiting Presets

```typescript
import { rateLimiter } from "@/lib/rate-limiter";

// Standard API usage (60 req/min)
const standardLimiter = rateLimiter.standard();

// Strict limits for sensitive operations (20 req/min)
const strictLimiter = rateLimiter.strict();

// Authentication endpoints (5 attempts/15min)
const authLimiter = rateLimiter.auth();

// File uploads (10 uploads/min)
const uploadLimiter = rateLimiter.upload();

// Admin operations (30 req/min)
const adminLimiter = rateLimiter.admin();

// Per-user rate limiting (uses API key context)
const perUserLimiter = rateLimiter.perUser();
```

### Custom Rate Limiting

```typescript
import { RateLimiter } from "@/lib/rate-limiter";

const customLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  keyGenerator: async (req) => {
    // Custom key generation logic
    const userId = req.headers.get("x-user-id");
    return userId ? `user:${userId}` : "anonymous";
  },
  skip: async (req) => {
    // Skip rate limiting for certain conditions
    return req.headers.get("x-skip-rate-limit") === "true";
  },
  message: "Custom rate limit message",
});

// Apply in middleware or route handler
const response = await customLimiter.limit(request);
if (response) return response; // Rate limited
```

### Redis Addon Integration

For production with multiple server instances:

```typescript
// After installing @atlas/addon-redis
import { RedisStore } from "@atlas/addon-redis";

const redisLimiter = rateLimiter.standard({
  store: new RedisStore({
    url: process.env.REDIS_URL,
  }),
});
```

## Monitoring and Observability

Atlas provides comprehensive monitoring endpoints:

### Health Endpoints

```bash
# Basic health check
GET /api/health
# Returns: system health, memory usage, dependency status

# Readiness check (for Kubernetes)
GET /api/ready
# Returns: startup status, critical dependencies

# Metrics (requires system:metrics permission)
GET /api/metrics
# Returns: process metrics, API usage, memory stats
```

### Security Event Logging

```typescript
import { logger } from "@/lib/logger";

// Security events are automatically logged by middleware
// - Authentication failures
// - Rate limit violations
// - Permission denials
// - Invalid API key attempts
// - IP whitelist violations

// Custom security logging in your addon
logger.security("Custom security event", {
  event: "custom_event",
  severity: "high",
  userId: "user123",
  additionalData: {},
});
```

## Best Practices for Add-ons

1. **Minimal Overhead**: Only run your middleware on routes that need it
2. **Error Boundaries**: Always handle errors gracefully
3. **Context Passing**: Use the request context utilities
4. **Logging**: Use the Atlas logger for consistency
5. **Configuration**: Integrate with Atlas config validation
6. **Testing**: Include comprehensive middleware tests
7. **Documentation**: Document your middleware's behavior and requirements
8. **Security**: Follow Atlas security patterns and logging
9. **Permissions**: Use the permission system for authorization
10. **Rate Limiting**: Respect existing rate limits or add custom ones

## Available Extension Points

The Atlas middleware provides these integration opportunities:

### Interface Implementations

- **RateLimitStore**: Implement Redis, database, or other storage backends
- **ApiKeyStore**: Implement database or external auth provider storage
- **Custom authentication**: Extend beyond API keys (OAuth, JWT, etc.)

### Middleware Hooks

- **Before authentication**: Run logic before API key validation
- **After authentication**: Access authenticated context
- **Before rate limiting**: Custom rate limiting logic
- **Error handling**: Custom error processing
- **Response modification**: Add custom headers or transform responses

### Configuration Extensions

- Extend environment validation
- Add custom middleware configuration
- Integrate with external config sources

Contact the Atlas maintainers if you need additional extension points for your add-on.
