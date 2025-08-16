# Atlas Web App

Production-ready Next.js API with route-level authentication and rate limiting.

## Architecture

### Route-Level Enforcement (Default)

All authentication and rate limiting is handled at the route level for:
- **Fine-grained control** - Each endpoint can have custom limits and permissions
- **Better performance** - No unnecessary middleware overhead
- **Easier testing** - Route logic is self-contained
- **Error handling** - Proper error responses with correct status codes

### API Route Pattern

```typescript
import { requireApiKey } from '@/server/auth'
import { requireRateLimit } from '@/server/rate-limit'
import { withErrorHandling } from '@/lib/api-utils'

export const GET = withErrorHandling(async (request: NextRequest) => {
  // 1. Rate limiting first
  const rateLimitResult = await requireRateLimit(request, { limiter: 'standard' })
  if (rateLimitResult.type === 'blocked') return rateLimitResult.response
  
  // 2. Authentication with scope
  const auth = await requireApiKey('read:projects')
  if (auth instanceof NextResponse) return auth
  
  // 3. Your business logic
  const data = await getProjects()
  
  // 4. Apply rate limit headers to success response
  const response = NextResponse.json({ data })
  rateLimitResult.setHeaders(response)
  return response
})
```

## Enable Optional Middleware

The middleware is **disabled by default** and provides only coarse global protection. All real enforcement happens at the route level.

### To Enable Global Middleware

1. **Rename the example file:**
   ```bash
   mv src/middleware.example.ts src/middleware.ts
   ```

2. **Set the environment variable:**
   ```bash
   # In your .env file
   GLOBAL_SHIELD=1
   ```

3. **Restart your development server**

### Important Caveats

When middleware is enabled, understand these limitations:

- **Runs on every `/api` request** - Adds overhead to all API calls
- **No request body access** - Cannot parse POST/PUT data for intelligent filtering
- **Keep limits generous** - Should only block obvious abuse, not implement real rate limiting
- **Security headers only** - Authentication and rate limiting still happen at route level

### What the Middleware Provides

When enabled, the middleware adds:

- **Security headers** (CSP, HSTS, X-Frame-Options, etc.)
- **Request correlation** (X-Request-Id for tracing)
- **CORS headers** (for API access)
- **Basic logging** (request method and path)

### What It Does NOT Provide

The middleware intentionally does not handle:

- ❌ **Authentication** - Use `requireApiKey()` in routes
- ❌ **Rate limiting** - Use `requireRateLimit()` in routes  
- ❌ **Request validation** - Use `validateRequest()` in routes
- ❌ **Error handling** - Use `withErrorHandling()` wrapper

## Route Configuration

### Available Rate Limiters

- `standard`: Default limits (60 req/min)
- `strict`: Sensitive operations (20 req/min) 
- `auth`: Authentication endpoints (5 req/15min)
- `admin`: Admin operations (30 req/min)
- `upload`: File uploads (10 req/min)

### Permission Scopes

Common scopes from `@atlas/api-auth`:

```typescript
import { COMMON_SCOPES } from '@atlas/api-auth'

// Basic permissions
COMMON_SCOPES.READ          // 'read'
COMMON_SCOPES.WRITE         // 'write'  
COMMON_SCOPES.DELETE        // 'delete'
COMMON_SCOPES.ADMIN         // 'admin'

// Resource-specific
COMMON_SCOPES.READ_PROJECTS  // 'read:projects'
COMMON_SCOPES.WRITE_PROJECTS // 'write:projects'
```

## Testing

```bash
# Run all tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Build verification
pnpm build
```

## Development

```bash
# Start development server
pnpm dev

# The API will be available at http://localhost:3000/api
```

### API Documentation

Visit `/api/docs` for interactive API documentation with examples and authentication instructions.

## Security

### API Keys

All protected routes require an API key:

```bash
# Using Authorization header (recommended)
curl -H "Authorization: Bearer your-api-key" \
  http://localhost:3000/api/todos

# Using X-API-Key header  
curl -H "X-API-Key: your-api-key" \
  http://localhost:3000/api/todos
```

### Rate Limiting

Rate limits are enforced per route with appropriate headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995200
```

### Security Headers

When middleware is enabled, all API responses include comprehensive security headers for defense in depth.