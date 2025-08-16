# @atlas/services-rate-limit

Provider-agnostic rate limiting service implementation using Hexagonal Architecture (Port & Adapter pattern).

## Overview

This package provides a production-ready rate limiting service that can be used with different storage backends:

- **In-Memory Store** (default) - For development and single-instance deployments
- **Redis Store** (via addon) - For distributed production deployments

## Architecture

The package follows **Hexagonal Architecture** principles:

- **Port**: `RateLimitStore` interface defines the contract for storage adapters
- **Adapters**: Concrete implementations (`InMemoryStore`, `RedisStore`) that plug into the port
- **Service**: `RateLimiter` class that orchestrates rate limiting logic

```
┌─────────────────────┐
│    Application      │
│   (RateLimiter)     │
└─────────┬───────────┘
          │
    ┌─────▼─────┐     Port
    │RateLimitStore│  (Interface)
    └─────┬─────────┘
          │
    ┌─────▼─────┐ ┌─────────┐
    │InMemoryStore RedisStore│  Adapters
    └───────────┘ └─────────┘
```

## Features

- **Provider-agnostic**: Easy to swap between storage backends
- **Windowed rate limiting**: Time-based windows with automatic expiration
- **Graceful degradation**: Fail-open behavior on storage errors
- **Production warnings**: Alerts for suboptimal configurations
- **Memory management**: Automatic cleanup for in-memory store
- **TypeScript first**: Full type safety and IntelliSense support

## Usage

### Basic Usage

```typescript
import { createRateLimiter, createMemoryStore } from '@atlas/services-rate-limit';

// Create rate limiter with in-memory store
const limiter = createRateLimiter({
  limit: 100,           // 100 requests
  windowMs: 60000,      // per minute
  prefix: 'api',        // key prefix
});

// Check rate limit
const result = await limiter.check('user-123');

if (result.allowed) {
  // Process request
  console.log(`Remaining: ${result.remaining}`);
} else {
  // Reject request
  console.log(`Rate limited. Reset at: ${new Date(result.resetAt)}`);
}
```

### Factory Pattern

```typescript
import { createRateLimiterFromConfig } from '@atlas/services-rate-limit';

// Use environment-based configuration
const limiter = createRateLimiterFromConfig({
  limit: 100,
  windowMs: 60000,
});

// Or with explicit configuration
const limiter = createRateLimiterFromConfig(
  { limit: 100, windowMs: 60000 },
  { 
    adapter: customStoreInstance,
    logger: console 
  }
);
```

### Custom Store Adapters

```typescript
import { registerStoreAdapter, createRateLimiterFromConfig } from '@atlas/services-rate-limit';

// Register custom adapter
registerStoreAdapter('redis', () => {
  return new RedisStore(redisClient);
});

// Use via environment variable
process.env.RATE_LIMIT_STORE = 'redis';
const limiter = createRateLimiterFromConfig({ limit: 100, windowMs: 60000 });
```

## API Reference

### RateLimiter

Main service class for rate limiting operations.

```typescript
class RateLimiter implements RateLimiterAdapter {
  constructor(options: RateLimiterOptions);
  
  async check(rawKey: string): Promise<RateLimiterResult>;
  async reset(rawKey: string): Promise<void>;
  setErrorHandler(handler: (error: Error) => void): void;
}
```

### RateLimitStore (Interface)

Port interface that storage adapters must implement.

```typescript
interface RateLimitStore {
  incr(key: string, windowMs: number): Promise<RateLimitResult>;
  reset(key: string): Promise<void>;
  cleanup?(): void | Promise<void>;
}
```

### InMemoryStore

Default in-memory storage adapter.

```typescript
class InMemoryStore implements RateLimitStore {
  constructor(options?: { cleanupIntervalMs?: number });
  
  // Store-specific methods
  getStats(): { totalKeys: number; memoryUsage: number };
  getActiveKeys(): string[];
  clear(): void;
}
```

### Factory Functions

```typescript
// Create rate limiter directly
function createRateLimiter(options: RateLimiterOptions): RateLimiterAdapter;

// Create with configuration and adapter registry
function createRateLimiterFromConfig(
  options: RateLimiterOptions,
  config?: RateLimiterConfig
): RateLimiterAdapter;

// Create memory store
function createMemoryStore(options?: { cleanupIntervalMs?: number }): InMemoryStore;

// Register custom adapter
function registerStoreAdapter(name: string, factory: () => RateLimitStore): void;

// Get available adapters
function getAvailableStoreAdapters(): string[];
```

## Types

### Core Types

```typescript
interface RateLimiterOptions {
  limit: number;           // Max requests per window
  windowMs: number;        // Window size in milliseconds
  store?: RateLimitStore;  // Storage adapter
  prefix?: string;         // Key prefix (default: "api")
  onError?: (error: Error) => void; // Error handler
}

interface RateLimiterResult {
  allowed: boolean;    // Whether request is allowed
  remaining: number;   // Requests remaining in window
  resetAt: number;     // Unix timestamp when window resets
  limit: number;       // Maximum requests per window
  count: number;       // Current count in window
}

interface RateLimitResult {
  count: number;       // Current count in window
  resetAt: number;     // Unix timestamp when window resets
}
```

## Error Handling

The service implements **fail-open** behavior to maintain availability:

```typescript
const limiter = createRateLimiter({
  limit: 100,
  windowMs: 60000,
  onError: (error) => {
    // Log error but don't block requests
    logger.error('Rate limit store error', error);
  }
});

// If store fails, requests are allowed
const result = await limiter.check('user-123');
// result.allowed will be true even if store is down
```

## Environment Variables

The factory supports environment-based configuration:

```bash
RATE_LIMIT_STORE=memory  # or 'redis' (requires addon)
```

## Production Considerations

### Memory Store Warnings

The in-memory store will warn when used in production:

```
⚠️  WARNING: Using in-memory rate limiting in production.
This will not work correctly with multiple server instances.
Use a Redis-based store for production deployments.
```

### Redis Integration

For distributed rate limiting, install the Redis addon:

```bash
# Add Redis addon (when available)
npx atlas add redis-rate-limit
```

This will:
- Install Redis dependencies
- Add `RedisStore` implementation
- Register Redis adapter in factory
- Provide environment configuration

### Cleanup and Memory Management

The in-memory store automatically cleans up expired entries:

```typescript
const store = createMemoryStore({
  cleanupIntervalMs: 30000  // Clean up every 30 seconds
});

// Monitor memory usage
const stats = store.getStats();
console.log(`Active keys: ${stats.totalKeys}, Memory: ${stats.memoryUsage} bytes`);
```

## Testing

Run the test suite:

```bash
pnpm test
```

Coverage report:

```bash
pnpm test --coverage
```

## Performance

### Windowed Keys

The service uses windowed keys for efficient time-based rate limiting:

```typescript
// Key format: {prefix}:{windowId}:{rawKey}
// Example: "api:1234567:user-123"

const windowId = Math.floor(Date.now() / windowMs);
```

This approach:
- Eliminates need for TTL management
- Provides natural expiration
- Optimizes memory usage
- Simplifies Redis operations

### Memory Usage

For in-memory store:
- ~64 bytes per active key (estimated)
- Automatic cleanup of expired entries
- Configurable cleanup intervals
- Production monitoring via `getStats()`

## Migration Guide

### From Express Rate Limit

```typescript
// Before (express-rate-limit)
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// After (@atlas/services-rate-limit)
import { createRateLimiter } from '@atlas/services-rate-limit';

const limiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 100
});

// Usage in middleware
const result = await limiter.check(clientKey);
if (!result.allowed) {
  return res.status(429).json({ error: 'Too Many Requests' });
}
```

## License

MIT