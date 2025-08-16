# Atlas Full-Stack Template

Enterprise-grade TypeScript monorepo template with Next.js, Tailwind v4, and React Query.

## Quickstart

```bash
# Install dependencies
pnpm install

# Run development servers
pnpm dev

# Type check all packages
pnpm type-check

# Build all packages
pnpm build
```

## Folder Structure

```
templates/full/
├── apps/
│   └── web/              # Next.js application
│       ├── src/
│       │   ├── app/      # App router pages
│       │   ├── lib/      # Utilities (api.ts)
│       │   └── hooks/    # Custom React hooks
│       └── tailwind.config.ts
├── packages/
│   ├── api-client/       # API client with type-safe requests
│   ├── design-system/    # Tailwind v4 preset & tokens
│   ├── query/           # React Query configuration
│   └── ui/              # React components
└── turbo.json           # Turborepo configuration
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | Backend API URL (server-side) | `http://localhost:3000/api` |
| `NEXT_PUBLIC_API_URL` | Public API URL (client-side) | `/api` |

## API Client Usage

The template uses a factory pattern for API calls:

```ts
// lib/api.ts
import { createApi } from '@atlas/api-client'

export const makeApi = () =>
  createApi({
    baseUrl: typeof window === 'undefined'
      ? process.env.API_URL ?? 'http://localhost:3000/api'
      : '/api',
    getAuthToken: async () => null, // TODO(auth addon): replace later
  })

// Usage in components
import { makeApi } from '@/lib/api'

const todos = await makeApi().get('/todos')
```

## Rate Limiting

The template includes a production-ready rate limiting system with in-memory storage (Redis-ready for future scaling).

### Configuration

Configure rate limits via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `RATE_LIMIT_MAX` | Maximum requests per window | `60` |
| `RATE_LIMIT_WINDOW_MS` | Time window in milliseconds | `60000` (1 minute) |
| `RATE_LIMIT_PREFIX` | Key prefix for namespacing | `"api"` |
| `RATE_LIMIT_PROVIDER` | Storage provider (`memory` \| `redis`) | `"memory"` |

### Usage in Route Handlers

Rate limiting follows a specific ordering pattern:

**Protected Routes:**
```ts
// apps/web/src/app/api/todos/route.ts
export const GET = withErrorHandling(async (request: NextRequest) => {
  validateMethod(request, ['GET'])
  
  // 1. Authentication first
  const auth = await requireApiKey('read:todos')
  if (auth instanceof NextResponse) return auth
  
  // 2. Rate limiting second  
  const rateLimitResult = await requireRateLimit(request, { limiter: 'standard' })
  if (rateLimitResult.type === 'blocked') return rateLimitResult.response
  
  // 3. Handler logic
  const todos = await todosRepo.list()
  const response = apiResponse(todos)
  
  // Apply rate limit headers
  rateLimitResult.setHeaders(response)
  return response
})
```

**Public Routes:**
```ts
// apps/web/src/app/api/health/route.ts
export const GET = withErrorHandling(async (request: NextRequest) => {
  // 1. Rate limiting only
  const rateLimitResult = await requireRateLimit(request, { limiter: 'standard' })
  if (rateLimitResult.type === 'blocked') return rateLimitResult.response
  
  // 2. Handler logic
  const healthData = await checkHealth()
  const response = apiResponse(healthData)
  
  // Apply rate limit headers
  rateLimitResult.setHeaders(response)
  return response
})
```

### Available Limiters

- `standard` - General API endpoints (60 req/min)
- `strict` - Sensitive operations (20 req/min) 
- `auth` - Authentication endpoints (5 req/15min)
- `upload` - File upload endpoints (10 req/min)
- `admin` - Admin operations (30 req/min)

### Headers

Rate limiting follows RFC 6585 with these headers:

- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining in window  
- `X-RateLimit-Reset` - Unix timestamp when window resets
- `Retry-After` - Seconds to wait (429 responses only)

### Client Key Generation

Rate limiting identifies clients by:

1. **API Key ID** (when authenticated) - `key:api_key_123`
2. **IP Address** (fallback) - `ip:192.168.1.100`
   - Trust proxy headers: `x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`
   - Falls back to `ip:anonymous` if no IP available

### Error Handling

The system uses **fail-open** behavior - if rate limiting fails, requests are allowed:

```ts
// Rate limiting errors result in allowed requests with error header
response.headers.set('X-RateLimit-Error', 'true')
```

### Admin Bypass

API keys with `admin` permissions bypass rate limiting:

```ts
// Automatically bypassed for admin API keys
response.headers.set('X-RateLimit-Bypass', 'admin')
```

### Future Redis Migration  

The system is designed for easy Redis migration:

```bash
# Set provider to redis (when Redis add-on is available)
RATE_LIMIT_PROVIDER=redis
```

Redis implementation will use INCR + PEXPIRE + PTTL pattern for distributed rate limiting.

## Dark Mode

Toggle dark mode by setting the `data-theme` attribute:

```tsx
// Enable dark mode
document.documentElement.setAttribute('data-theme', 'dark')

// Enable light mode
document.documentElement.setAttribute('data-theme', 'light')
```

## Design Tokens

The design system provides semantic color tokens via `@atlas/design-system`:

- `fg` / `fg-muted` - Text colors
- `surface` / `elevated` / `muted` - Background colors
- `primary` / `success` / `warning` / `danger` - State colors
- `border` / `ring` / `outline` - UI element colors

## Renaming the Template

To rename the template scope from `@atlas` to your organization:

```bash
# Replace @atlas with @yourorg
find . -type f -name "*.json" -o -name "*.ts" -o -name "*.tsx" | \
  xargs sed -i '' 's/@atlas/@yourorg/g'

# Update package names
find . -type f -name "package.json" | \
  xargs sed -i '' 's/"name": "@atlas/"name": "@yourorg/g'
```

## Scripts

- `pnpm dev` - Start development servers
- `pnpm build` - Build all packages
- `pnpm type-check` - Type check all packages
- `pnpm lint` - Lint all packages
- `pnpm test` - Run tests