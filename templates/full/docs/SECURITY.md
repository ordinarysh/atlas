# Security Guide

This document outlines the security features, configuration, and best practices for the Atlas production boilerplate.

## 🛡️ Security Features Overview

### Built-in Security Layers

1. **Input Validation** - All API endpoints validate inputs with Zod schemas
2. **API Authentication** - Secure API key authentication with Argon2 hashing
3. **Rate Limiting** - Configurable rate limiting with Redis or memory store
4. **Security Headers** - Comprehensive security headers via middleware and Next.js
5. **CORS Protection** - Configurable cross-origin request handling
6. **Error Boundaries** - Secure error handling that doesn't leak sensitive data
7. **Environment Security** - Proper environment variable management

## 🔐 Authentication & Authorization

### API Key Authentication

The boilerplate uses secure API key authentication:

```typescript
// Generate an API key
import { generateApiKey } from "@atlas/api-auth";
const apiKey = generateApiKey("your-key-prefix");

// Verify requests
import { requireApiKey } from "@/server/auth";
const authResult = await requireApiKey("read:todos");
```

**Security Features:**

- Keys hashed with Argon2 (never store raw keys)
- Scoped permissions (read, write, delete, admin)
- Automatic last-used tracking
- Key expiration support

### Route Protection

```typescript
// Protect API routes
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Require specific permission
  await requireApiKey("write:todos");

  // Your route logic here
});
```

## ⚙️ Security Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Security Middleware (disabled by default for development)
ENABLE_SECURITY_MIDDLEWARE=false  # Set to "true" in production

# CORS Configuration
ALLOWED_ORIGINS=*  # Set specific domains in production: "https://yourdomain.com"

# Rate Limiting
RATE_LIMIT_PROVIDER=memory  # Use "redis" for production
RATE_LIMIT_MAX=60
RATE_LIMIT_WINDOW_MS=60000

# Proxy Trust (for IP extraction)
TRUST_PROXY=false  # Set to "true" when behind CDN/proxy
```

### Production Security Checklist

#### Before Deployment:

- [ ] Set `ENABLE_SECURITY_MIDDLEWARE=true`
- [ ] Configure `ALLOWED_ORIGINS` with specific domains
- [ ] Set strong `SESSION_SECRET` (32+ random characters)
- [ ] Use `RATE_LIMIT_PROVIDER=redis` for multi-instance apps
- [ ] Enable HTTPS/TLS on your hosting platform
- [ ] Set `TRUST_PROXY=true` if behind CDN (Cloudflare, AWS CloudFront, etc.)
- [ ] Review API key permissions and scope
- [ ] Configure monitoring and alerting

#### Security Headers Enabled:

✅ **Content Security Policy (CSP)** - Prevents XSS attacks  
✅ **Strict Transport Security (HSTS)** - Enforces HTTPS  
✅ **X-Frame-Options** - Prevents clickjacking  
✅ **X-Content-Type-Options** - Prevents MIME type sniffing  
✅ **X-XSS-Protection** - Browser XSS filtering  
✅ **Referrer Policy** - Controls referrer information  
✅ **Permissions Policy** - Restricts browser features  
✅ **Cross-Origin Policies** - Enhanced isolation

## 🔍 Rate Limiting

### Configuration

```typescript
// Memory store (development/single instance)
RATE_LIMIT_PROVIDER=memory

// Redis store (production/multi-instance)
RATE_LIMIT_PROVIDER=redis
REDIS_URL=redis://localhost:6379
```

### Usage

```typescript
// Apply rate limiting to routes
import { requireRateLimit } from "@/server/rate-limit";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Check rate limit (returns 429 if exceeded)
  const rateLimitResult = await requireRateLimit(request, {
    limiter: "standard", // 60 requests per minute
  });

  if (rateLimitResult.type === "blocked") {
    return rateLimitResult.response;
  }

  // Your route logic here
  const response = apiResponse({ data: "success" });

  // Add rate limit headers
  rateLimitResult.setHeaders(response);
  return response;
});
```

### Rate Limit Presets

- `standard`: 60 requests/minute (default)
- `strict`: 20 requests/minute
- `auth`: 5 requests/15 minutes
- `upload`: 10 requests/minute
- `admin`: 30 requests/minute

## 🚨 Error Handling & Logging

### Secure Error Responses

```typescript
// Good: Generic error message
throw ApiError.badRequest("Invalid request format");

// Bad: Leaking internal details
throw new Error("Database connection failed: user=admin, host=internal-db");
```

### Security Event Logging

```typescript
import { logger } from "@/lib/logger";

// Log security events
logger.security("Failed authentication attempt", {
  ip: request.ip,
  userAgent: request.headers.get("user-agent"),
  endpoint: request.url,
});

// Log rate limit violations
logger.warn("Rate limit exceeded", {
  ip: clientKey,
  endpoint: request.url,
  limit: rateLimitConfig.max,
});
```

## 🌐 CORS Configuration

### Basic Setup

```typescript
import { corsHeaders, CORS_CONFIGS } from "@/lib/cors";

// Use default CORS
response.headers.set("Access-Control-Allow-Origin", corsHeaders["Access-Control-Allow-Origin"]);

// Use predefined configs
const strictCors = CORS_CONFIGS.restrictive;
const publicApiCors = CORS_CONFIGS.publicApi;
```

### Advanced Usage

```typescript
import { withCors } from "@/lib/cors";

// Wrap route handler with CORS
export const GET = withCors(
  async (request: NextRequest) => {
    return apiResponse({ data: "Hello World" });
  },
  {
    allowedOrigins: ["https://yourdomain.com"],
    credentials: true,
  },
);
```

## 🔒 Input Validation

All API endpoints should validate input:

```typescript
import { z } from "zod";
import { validateRequest } from "@/lib/api-utils";

const CreateTodoSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Validate input
  const { body } = await validateRequest(request, {
    body: CreateTodoSchema,
  });

  // body is now type-safe and validated
  console.log(body.title); // string
});
```

## 🚫 Common Security Anti-Patterns to Avoid

### ❌ Don't Do This:

```typescript
// Exposing sensitive data in errors
console.error("Database error:", { password: "secret123", query: sql });

// Storing tokens in localStorage
localStorage.setItem("authToken", token);

// SQL injection risk
const query = `SELECT * FROM users WHERE id = ${userId}`;

// Hardcoded secrets
const API_KEY = "sk-1234567890abcdef";

// Unvalidated input
const userId = request.nextUrl.searchParams.get("userId"); // Could be anything!
```

### ✅ Do This Instead:

```typescript
// Safe error logging
logger.error("Database operation failed", { operation: "user_lookup", userId });

// Secure token storage (httpOnly cookies or secure headers)
response.headers.set("Set-Cookie", `token=${token}; HttpOnly; Secure; SameSite=Strict`);

// Parameterized queries (if using raw SQL)
const query = "SELECT * FROM users WHERE id = $1";
await db.query(query, [userId]);

// Environment variables
const API_KEY = process.env.API_KEY;

// Validated input
const userIdSchema = z.string().uuid();
const userId = userIdSchema.parse(request.nextUrl.searchParams.get("userId"));
```

## 🛠️ Security Testing

### Running Security Tests

```bash
# Run basic security tests
npm run test:security

# Check for vulnerabilities
npm audit

# Lint for security issues
npm run lint:security
```

### Manual Security Checklist

1. **Authentication Testing**
   - [ ] Unauthenticated requests are rejected
   - [ ] Invalid API keys are rejected
   - [ ] Expired keys are rejected

2. **Input Validation Testing**
   - [ ] Invalid JSON is rejected
   - [ ] SQL injection attempts fail
   - [ ] XSS payloads are sanitized
   - [ ] Oversized payloads are rejected

3. **Rate Limiting Testing**
   - [ ] Rate limits are enforced
   - [ ] Rate limit headers are present
   - [ ] Different limits for different endpoints

4. **CORS Testing**
   - [ ] Unauthorized origins are blocked
   - [ ] Preflight requests work correctly
   - [ ] Credentials handling is secure

## 🆘 Incident Response

If you suspect a security incident:

1. **Immediate Actions**
   - Check logs for suspicious activity
   - Review rate limit violations
   - Check for authentication failures

2. **Investigation**
   - Correlate events using request IDs
   - Review user activity patterns
   - Check for data access patterns

3. **Monitoring Setup**
   ```typescript
   // Add to your monitoring
   logger.security("Suspicious activity detected", {
     pattern: "multiple_failed_auth",
     ip: clientIp,
     count: failureCount,
   });
   ```

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Guidelines](https://nextjs.org/docs/pages/building-your-application/configuring/security-headers)
- [Web Security Headers Guide](https://web.dev/security-headers/)
- [API Security Best Practices](https://owasp.org/www-project-api-security/)

## 🔄 Keeping Security Updated

1. **Regular Updates**
   - Monitor `npm audit` for vulnerabilities
   - Update dependencies monthly
   - Review security headers quarterly

2. **Security Monitoring**
   - Set up alerts for authentication failures
   - Monitor rate limit violations
   - Track unusual access patterns

3. **Security Reviews**
   - Review API permissions quarterly
   - Audit user access patterns
   - Update security documentation

---

For additional security questions or to report vulnerabilities, please see our security policy or contact the development team.
