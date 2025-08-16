# @atlas/rate-limit

**Memory store by default.** Redis (Upstash) is an **opt-in add-on**—no Redis deps shipped. Route-level guards are canonical; `middleware.example.ts` is optional as a loose pre-filter.

## Features

- **Provider Agnostic**: Clean interface supporting memory and Redis backends
- **Fixed Windows**: Simple, predictable rate limiting with configurable windows
- **Graceful Degradation**: Allows requests on store failures with error logging
- **TypeScript First**: Full type safety with comprehensive interfaces
- **Battle-Tested**: Extensive test coverage for reliability
- **Production Ready**: Memory store for development, Redis for distributed production

## Installation

```bash
pnpm add @atlas/rate-limit
```

## Quick Start

```typescript
import { createRateLimiter, createMemoryStore } from '@atlas/rate-limit'

// Create rate limiter with memory store (default)
const limiter = createRateLimiter({
  limit: 60,          // 60 requests
  windowMs: 60_000,   // per minute
  prefix: 'api'       // key prefix
})

// Check rate limit
const result = await limiter.check('user-123')

if (result.allowed) {
  console.log(`Request allowed. ${result.remaining} remaining.`)
} else {
  console.log(`Rate limited. Reset at ${new Date(result.resetAt)}`)
}
```

## API Reference

### `createRateLimiter(options)`

Creates a new rate limiter instance.

**Options:**
- `limit: number` - Maximum requests allowed in window
- `windowMs: number` - Time window in milliseconds  
- `store?: RateLimitStore` - Storage backend (defaults to memory)
- `prefix?: string` - Key prefix for namespacing (default: 'api')
- `onError?: (error: Error) => void` - Error handler for store failures

**Returns:** `RateLimiter` instance

### `RateLimiter.check(key: string)`

Checks rate limit for the given key.

**Returns:** `RateLimiterResult`
```typescript
{
  allowed: boolean,    // Whether request is allowed
  remaining: number,   // Requests remaining in window
  resetAt: number,     // Unix timestamp when window resets
  limit: number,       // Max requests per window
  count: number        // Current count in window
}
```

### `RateLimiter.reset(key: string)`

Manually reset rate limit for a key.

## Store Interface

Implement `RateLimitStore` for custom backends:

```typescript
interface RateLimitStore {
  incr(key: string, windowMs: number): Promise<RateLimitResult>
  reset(key: string): Promise<void>
  cleanup?(): void | Promise<void>
}
```

### Redis Store Implementation

For production deployments with multiple server instances, implement a Redis store using the exact contract specified below.

**Required Redis Commands:**
- `INCR key` - Increment counter atomically
- `PEXPIRE key windowMs` - Set expiration in milliseconds  
- `PTTL key` - Get remaining TTL for resetAt calculation
- `DEL key` - Delete/reset counter

**Contract Implementation:**

```typescript
import Redis from 'ioredis'
import type { RateLimitStore, RateLimitResult } from '@atlas/rate-limit'

class RedisStore implements RateLimitStore {
  constructor(private redis: Redis) {}
  
  async incr(key: string, windowMs: number): Promise<RateLimitResult> {
    const multi = this.redis.multi()
    multi.incr(key)
    multi.pexpire(key, windowMs)
    multi.pttl(key)
    
    const [count, , ttl] = await multi.exec()
    const resetAt = Date.now() + (ttl?.[1] as number || windowMs)
    
    return { count: count[1] as number, resetAt }
  }
  
  async reset(key: string): Promise<void> {
    await this.redis.del(key)
  }
}

// Usage
const redisStore = new RedisStore(new Redis(process.env.REDIS_URL))
const limiter = createRateLimiter({
  limit: 100,
  windowMs: 60_000,
  store: redisStore
})
```

## Windowing Strategy

The rate limiter uses **fixed windows** based on:

```
windowId = Math.floor(Date.now() / windowMs)
key = `${prefix}:${windowId}:${rawKey}`
```

This ensures:
- Predictable reset times
- Simple implementation
- Redis/memory compatibility

## Error Handling

On store failures, the limiter:
1. Calls `onError` callback if provided
2. Logs warning in development
3. **Allows the request** (graceful degradation)

## Production Considerations

**Memory Store Warning**: The included `MemoryStore` is for development and single-instance deployments only. For production with multiple instances, use a Redis-based store.

**Key Security**: Ensure keys don't contain PII or secrets. Use hashed or sanitized identifiers.

**Route-Level Only**: Default enforcement is route-level. Never apply rate limiting in middleware - each route should control its own rate limiting strategy based on the operation sensitivity. Middleware (if enabled) should be a loose pre-filter only.

## Route-Level Integration

**IMPORTANT**: Apply rate limiting at the route level, NOT in middleware. This provides fine-grained control and proper error handling.

### Next.js API Route Pattern

```typescript
import { requireRateLimit } from '@/server/rate-limit'

export const POST = async (request: NextRequest) => {
  // Apply rate limiting first (before auth/validation)
  const rateLimitResult = await requireRateLimit(request, { 
    limiter: 'strict' // or 'standard', 'auth', 'admin'
  })
  if (rateLimitResult.type === 'blocked') return rateLimitResult.response
  
  // ... your route logic here ...
  
  const response = NextResponse.json(data)
  
  // Apply rate limit headers to success response
  rateLimitResult.setHeaders(response)
  return response
}
```

### Available Limiter Types

- `standard`: Default rate limiting (60 req/min)
- `strict`: Stricter limits for sensitive operations (20 req/min)
- `auth`: Authentication endpoints (5 req/15min)
- `admin`: Admin operations (30 req/min)
- `upload`: File uploads (10 req/min)

## Examples

### API Key Rate Limiting

```typescript
const limiter = createRateLimiter({
  limit: 1000,
  windowMs: 60_000,
  prefix: 'api-key'
})

// Rate limit by API key ID
const result = await limiter.check(`key:${apiKeyId}`)
```

### IP-Based Rate Limiting

```typescript
const limiter = createRateLimiter({
  limit: 100,
  windowMs: 60_000,
  prefix: 'ip'
})

// Rate limit by IP address
const result = await limiter.check(`ip:${clientIp}`)
```

### Custom Route Limits

```typescript
// Custom limits per route
const rateLimitResult = await requireRateLimit(request, {
  limit: 10,        // Override default limit
  window: 60_000,   // Override default window
  limiter: 'strict' // Use preset configuration  
})
```