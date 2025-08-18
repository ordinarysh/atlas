# Authentication & Security

Production-grade authentication, authorization, and security patterns for API protection.

## Authentication Strategy

### API Key Authentication

- **Primary Method**: HMAC-signed API keys for service-to-service communication
- **Token Format**: `key:signature` where signature = HMAC-SHA256(key + timestamp + nonce)
- **Validation**: Request signature verified server-side with stored secret

### Session Management

- **Web Sessions**: HTTP-only, secure cookies with CSRF protection
- **Token Storage**: Secure, HTTP-only cookies (no localStorage)
- **Expiration**: Configurable session lifetime with refresh tokens

## Security Configuration

### Environment Variables

```bash
# Required
API_KEY_SECRET=your-256-bit-secret           # HMAC signing key
SESSION_SECRET=your-session-secret           # Session encryption

# Optional
CORS_ORIGINS=https://yourdomain.com          # Allowed origins
RATE_LIMIT_REDIS_URL=redis://localhost:6379  # Rate limiting store
```

### CORS Defaults

```typescript
// Secure defaults in production
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(",") || false,
  credentials: true,
  optionsSuccessStatus: 200,
};
```

### Rate Limiting

- **Standard**: 100 requests/minute per IP
- **Strict**: 10 requests/minute for sensitive operations
- **Permissive**: 1000 requests/minute for public endpoints

## API Key Implementation

### Client Usage

```typescript
import { createApiClient } from "@atlas/api-client";

const client = createApiClient({
  baseUrl: "https://api.example.com",
  apiKey: process.env.API_KEY,
  secret: process.env.API_SECRET,
});

// Automatically signs all requests
const response = await client.get("/api/profile");
```

### Server Validation

```typescript
import { requireApiKey } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Validate API key and scope
  const auth = await requireApiKey("read:projects");
  if (auth instanceof NextResponse) return auth;

  // auth.userId, auth.scopes available
  const projects = await getProjectsForUser(auth.userId);
  return NextResponse.json({ data: projects });
}
```

## Permission Scopes

### Available Scopes

- `read:profile` - Read user profile data
- `write:profile` - Update user profile
- `read:projects` - Read project data
- `write:projects` - Create/update projects
- `admin:*` - Administrative access

### Scope Validation

```typescript
// Single scope
const auth = await requireApiKey("read:projects");

// Multiple scopes (requires ALL)
const auth = await requireApiKey(["read:projects", "write:projects"]);

// Any scope (requires ONE)
const auth = await requireApiKeyAny(["read:projects", "admin:projects"]);
```

## Guarded Route Example

```typescript
// apps/web/src/app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/auth";
import { requireRateLimit } from "@/lib/rate-limit";
import { withErrorHandling } from "@/lib/api-utils";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // 1. Rate limiting
  const rateLimitResult = await requireRateLimit(request, { limiter: "standard" });
  if (rateLimitResult.type === "blocked") return rateLimitResult.response;

  // 2. Authentication & authorization
  const auth = await requireApiKey("read:projects");
  if (auth instanceof NextResponse) return auth;

  // 3. Business logic (authenticated user)
  const projects = await getProjectsForUser(auth.userId);

  // 4. Success response with rate limit headers
  const response = NextResponse.json({ data: projects });
  rateLimitResult.setHeaders(response);
  return response;
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const rateLimitResult = await requireRateLimit(request, { limiter: "strict" });
  if (rateLimitResult.type === "blocked") return rateLimitResult.response;

  const auth = await requireApiKey("write:projects");
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const project = await createProject({
    userId: auth.userId,
    data: body,
  });

  const response = NextResponse.json({ data: project }, { status: 201 });
  rateLimitResult.setHeaders(response);
  return response;
});
```

## Secret Management

### Environment Setup

```bash
# Generate secure secrets
openssl rand -hex 32  # API_KEY_SECRET
openssl rand -hex 32  # SESSION_SECRET
```

### Secret Validation

```typescript
// Validate secrets on startup
function validateSecrets() {
  const requiredSecrets = ["API_KEY_SECRET", "SESSION_SECRET"];

  for (const secret of requiredSecrets) {
    if (!process.env[secret]) {
      throw new Error(`Missing required environment variable: ${secret}`);
    }

    if (process.env[secret]!.length < 32) {
      throw new Error(`${secret} must be at least 32 characters`);
    }
  }
}
```

### Secure Headers

```typescript
// Applied automatically in middleware
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};
```

## Input Validation

### Request Sanitization

```typescript
import { z } from "zod";

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(1000).trim().optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
});

// Automatic validation and sanitization
const result = CreateProjectSchema.safeParse(request.body);
```

### SQL Injection Prevention

- Use parameterized queries only
- No string concatenation for SQL
- ORM query builders preferred

### XSS Prevention

- Content-Type validation
- Output encoding for user content
- CSP headers for frontend

## Error Handling

### Security-Safe Errors

```typescript
// Good: Don't leak sensitive information
if (!isValidApiKey) {
  return NextResponse.json(
    { error: "UNAUTHORIZED", message: "Invalid credentials" },
    { status: 401 },
  );
}

// Avoid: Exposes implementation details
if (!apiKey) {
  return NextResponse.json({ error: "Missing X-API-Key header in request" }, { status: 401 });
}
```

### Rate Limit Protection

```typescript
// Configured limits by endpoint type
const rateLimits = {
  standard: { requests: 100, window: "1m" },
  strict: { requests: 10, window: "1m" },
  permissive: { requests: 1000, window: "1m" },
};
```

## Security Checklist

### API Security

- ✅ HMAC signature validation
- ✅ Scope-based authorization
- ✅ Rate limiting per endpoint
- ✅ Input validation with Zod
- ✅ Secure error responses
- ✅ CORS configuration

### Infrastructure Security

- ✅ HTTPS enforcement
- ✅ Security headers
- ✅ Secret management
- ✅ Environment isolation
- ✅ Dependency scanning

### Monitoring

- ✅ Authentication failures
- ✅ Rate limit violations
- ✅ Suspicious request patterns
- ✅ Error rate monitoring

## Links

- **API Auth Package**: [../packages/api-auth/README.md](../packages/api-auth/README.md)
- **Rate Limiting**: [../services/rate-limit/README.md](../services/rate-limit/README.md)
- **API Patterns**: [api-overview.md](./api-overview.md)
- **Extension Guide**: [addons.md](./addons.md)
