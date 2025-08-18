# @atlas/config-rate-limit

Rate limiting configuration for Atlas applications with environment variable support.

## Features

- **Environment-based configuration** with sensible defaults
- **Trust proxy settings** for proper IP extraction behind CDNs/proxies
- **Multiple rate limit presets** (standard, strict, auth, upload, admin)
- **One-time Redis warning** when Redis provider is requested but not available
- **Provider-agnostic** configuration for memory and Redis stores

## Usage

```typescript
import { getRateLimitConfig, createRateLimitPresets } from '@atlas/config-rate-limit'

// Get base configuration
const config = getRateLimitConfig()
console.log(config)
// {
//   max: 60,
//   windowMs: 60000,
//   prefix: "api",
//   provider: "memory",
//   trustProxy: false
// }

// Get rate limit presets
const presets = createRateLimitPresets()
console.log(presets.strict.max) // 20 (1/3 of base limit)
```

## Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `RATE_LIMIT_MAX` | number | `60` | Maximum requests allowed per window |
| `RATE_LIMIT_WINDOW_MS` | number | `60000` | Time window in milliseconds (1 minute) |
| `RATE_LIMIT_PREFIX` | string | `"api"` | Key prefix for namespacing |
| `RATE_LIMIT_PROVIDER` | string | `"memory"` | Provider type (`"memory"` or `"redis"`) |
| `TRUST_PROXY` | boolean | `false` | Trust proxy headers for IP extraction |

## Trust Proxy

When `TRUST_PROXY=true`, IP extraction prioritizes trusted proxy headers:

1. `x-real-ip` (preferred)
2. `cf-connecting-ip` (Cloudflare)
3. `x-forwarded-for` (first IP)

When `TRUST_PROXY=false` (default), prioritizes:

1. `x-forwarded-for` (first IP)
2. Fallback headers

Set to `true` when behind a trusted proxy/CDN to get real client IPs.

## Rate Limit Presets

| Preset | Limit | Window | Use Case |
|--------|-------|---------|----------|
| `standard` | Base limit | Base window | General API operations |
| `strict` | Base ÷ 3 | Base window | Sensitive operations |
| `auth` | 5 requests | 15 minutes | Authentication endpoints |
| `upload` | 10 requests | 1 minute | File upload operations |
| `admin` | Base ÷ 2 | Base window | Administrative operations |

## Redis Provider

When `RATE_LIMIT_PROVIDER=redis` is set, the configuration shows a one-time warning and falls back to memory:

```
Redis rate limiting provider is an opt-in add-on not included in this template. 
Falling back to memory provider. To use Redis, install the add-on package.
```

This keeps the template lean while providing a clear upgrade path for distributed rate limiting.

## Integration

This package is designed to work with `@atlas/rate-limit` for the actual rate limiting implementation:

```typescript
import { createRateLimiter, createMemoryStore } from '@atlas/rate-limit'
import { createRateLimitPresets } from '@atlas/config-rate-limit'

const presets = createRateLimitPresets()
const store = createMemoryStore()

const limiter = createRateLimiter({
  limit: presets.standard.max,
  windowMs: presets.standard.windowMs,
  prefix: presets.standard.prefix,
  store,
})
```