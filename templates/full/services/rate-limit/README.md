# Purpose

Provider-agnostic rate limiting service with Redis and in-memory storage adapters for API protection and traffic management.

## Public Surface

- **Rate Limiter Factory**: `createRateLimiter()`, `createRateLimiterFromConfig()`
- **Storage Adapters**: `InMemoryStore`, `RedisStore` implementations
- **Rate Limit Interface**: `RateLimitStore` contract for custom adapters
- **Configuration Types**: `RateLimitConfig`, `RateLimitResult` interfaces
- **Middleware Integration**: Express/Next.js rate limiting utilities

## Responsibilities

- **Request Counting**: Track API requests per key (IP, user ID, API key)
- **Window Management**: Time-based sliding/fixed windows with automatic expiration
- **Storage Abstraction**: Provider-agnostic storage with graceful degradation
- **Performance Optimization**: Memory management and automatic cleanup
- **Error Handling**: Fail-open behavior on storage errors

**What doesn't belong here:**
- Authentication logic (belongs in packages/api-auth)
- Request routing (belongs in apps/web)
- Business logic validation (belongs in domains/)

## Extension Points

### Adding a New Storage Adapter

1. **Implement RateLimitStore Interface**
   ```typescript
   // src/adapters/custom-store.ts
   import { RateLimitStore, RateLimitEntry } from '../types'
   
   export class CustomStore implements RateLimitStore {
     async get(key: string): Promise<RateLimitEntry | null> {
       // Retrieve rate limit data for key
       return { count: 1, resetAt: Date.now() + 60000 }
     }
     
     async set(key: string, entry: RateLimitEntry): Promise<void> {
       // Store rate limit data
     }
     
     async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
       // Atomic increment with expiration
       return { count: 1, resetAt: Date.now() + windowMs }
     }
     
     async cleanup?(): Promise<void> {
       // Optional: cleanup expired entries
     }
   }
   ```

2. **Register Adapter**
   ```typescript
   // src/factory.ts
   import { registerStoreAdapter } from './registry'
   import { CustomStore } from './adapters/custom-store'
   
   registerStoreAdapter('custom', (config) => {
     return new CustomStore(config.customOptions)
   })
   ```

3. **Usage**
   ```typescript
   const limiter = createRateLimiterFromConfig({
     adapter: 'custom',
     limit: 100,
     windowMs: 60000,
     customOptions: { /* adapter config */ }
   })
   ```

### Adding Rate Limit Presets

```typescript
// src/presets.ts
export const rateLimitPresets = {
  strict: { limit: 10, windowMs: 60000 },      // 10/min for sensitive ops
  standard: { limit: 100, windowMs: 60000 },   // 100/min for normal API
  permissive: { limit: 1000, windowMs: 60000 } // 1000/min for public endpoints
}

// Usage in API routes
const limiter = createRateLimiter(rateLimitPresets.strict)
```

### Middleware Integration

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRateLimiter } from './factory'

export function createRateLimitMiddleware(config: RateLimitConfig) {
  const limiter = createRateLimiter(config)
  
  return async (request: NextRequest) => {
    const key = getClientKey(request) // IP, user ID, API key
    const result = await limiter.check(key)
    
    if (!result.allowed) {
      return NextResponse.json(
        { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(result.resetAt).toISOString()
          }
        }
      )
    }
    
    return null // Allow request to proceed
  }
}
```

### Custom Algorithms

```typescript
// src/algorithms/token-bucket.ts
export class TokenBucketLimiter implements RateLimiter {
  async check(key: string): Promise<RateLimitResult> {
    const bucket = await this.store.get(key) || this.createBucket()
    
    // Refill tokens based on time elapsed
    const now = Date.now()
    const tokensToAdd = Math.floor((now - bucket.lastRefill) / this.refillInterval)
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd)
    bucket.lastRefill = now
    
    if (bucket.tokens > 0) {
      bucket.tokens--
      await this.store.set(key, bucket)
      return { allowed: true, remaining: bucket.tokens, resetAt: bucket.lastRefill + this.windowMs }
    }
    
    return { allowed: false, remaining: 0, resetAt: bucket.lastRefill + this.windowMs }
  }
}
```

## Testing

### Unit Testing
```typescript
// __tests__/rate-limiter.test.ts
import { createRateLimiter, createMemoryStore } from '../src'

describe('RateLimiter', () => {
  let limiter: RateLimiter
  
  beforeEach(() => {
    limiter = createRateLimiter({
      limit: 3,
      windowMs: 60000,
      store: createMemoryStore()
    })
  })
  
  it('allows requests within limit', async () => {
    const result1 = await limiter.check('user-1')
    const result2 = await limiter.check('user-1')
    const result3 = await limiter.check('user-1')
    
    expect(result1.allowed).toBe(true)
    expect(result2.allowed).toBe(true)
    expect(result3.allowed).toBe(true)
    expect(result3.remaining).toBe(0)
  })
  
  it('blocks requests over limit', async () => {
    // Exhaust limit
    await limiter.check('user-1')
    await limiter.check('user-1')
    await limiter.check('user-1')
    
    // Should be blocked
    const result = await limiter.check('user-1')
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })
  
  it('isolates different keys', async () => {
    // Exhaust limit for user-1
    await limiter.check('user-1')
    await limiter.check('user-1')
    await limiter.check('user-1')
    
    // user-2 should still be allowed
    const result = await limiter.check('user-2')
    expect(result.allowed).toBe(true)
  })
})
```

### Integration Testing
```typescript
// __tests__/integration/redis-store.test.ts
import { createRateLimiter, createRedisStore } from '../src'
import Redis from 'ioredis'

describe('Redis Store Integration', () => {
  let redis: Redis
  let limiter: RateLimiter
  
  beforeAll(() => {
    redis = new Redis(process.env.REDIS_URL)
    limiter = createRateLimiter({
      limit: 5,
      windowMs: 60000,
      store: createRedisStore(redis)
    })
  })
  
  afterAll(() => {
    redis.disconnect()
  })
  
  it('persists rate limit data across checks', async () => {
    const result1 = await limiter.check('integration-test')
    const result2 = await limiter.check('integration-test')
    
    expect(result2.remaining).toBe(result1.remaining - 1)
  })
})
```

### Performance Testing
```typescript
// __tests__/performance/load.test.ts
describe('Rate Limiter Performance', () => {
  it('handles concurrent requests', async () => {
    const limiter = createRateLimiter({ limit: 1000, windowMs: 60000 })
    
    const promises = Array.from({ length: 100 }, (_, i) => 
      limiter.check(`user-${i % 10}`)
    )
    
    const results = await Promise.all(promises)
    const allowed = results.filter(r => r.allowed).length
    
    expect(allowed).toBeGreaterThan(0)
    expect(allowed).toBeLessThanOrEqual(100)
  })
})
```

### Commands
```bash
# Run all tests
pnpm test

# Run with Redis integration
REDIS_URL=redis://localhost:6379 pnpm test

# Performance tests
pnpm test:performance

# Specific test file
pnpm test rate-limiter.test.ts
```

## Links

- **Architecture**: [../../docs/architecture.md](../../docs/architecture.md)
- **API Integration**: [../../apps/web/README.md](../../apps/web/README.md)
- **Auth & Security**: [../../docs/auth-and-security.md](../../docs/auth-and-security.md)
- **Addons Guide**: [../../docs/addons.md](../../docs/addons.md)

*Last reviewed: 2025-08-16*