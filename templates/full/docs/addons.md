# Addons & Extensions

Opt-in integrations and extension patterns for Redis, Sentry, auth providers, and middleware.

## Addon Philosophy

Addons are **opt-in** features that:

- Don't require configuration by default
- Gracefully degrade when not configured
- Have clear extension points in colocated READMEs
- Follow dependency injection patterns

## Available Addons

### Redis Rate Limiting

**Status**: Optional (falls back to in-memory)
**Package**: `@upstash/redis`

```typescript
// Automatically detects Redis availability
const rateLimit = await requireRateLimit(request, { limiter: 'standard' })

// Configuration
REDIS_URL=redis://localhost:6379  # Optional
REDIS_TOKEN=your-token           # For Upstash
```

### Sentry Error Monitoring

**Status**: Configurable
**Package**: `@sentry/nextjs`

```typescript
// Optional Sentry integration
if (process.env.SENTRY_DSN) {
  Sentry.captureException(error)
}

// Configuration
SENTRY_DSN=https://your-dsn@sentry.io/project
SENTRY_ENV=production
```

### Authentication Providers

**Status**: Pluggable
**Packages**: BetterAuth, Auth0, Firebase

```typescript
// Provider-agnostic auth interface
interface AuthProvider {
  validateToken(token: string): Promise<AuthResult>;
  getUser(token: string): Promise<User | null>;
}

// Swap implementations without changing API routes
const authProvider = createAuthProvider(process.env.AUTH_PROVIDER);
```

## Extension Points

### Middleware Extensions

**Location**: `apps/web/src/middleware.ts` (optional file)

```typescript
// Opt-in middleware (disabled by default)
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { authenticate } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  // Global rate limiting (optional)
  if (process.env.ENABLE_GLOBAL_RATE_LIMIT) {
    const rateLimitResult = await rateLimit(request);
    if (rateLimitResult.type === "blocked") {
      return rateLimitResult.response;
    }
  }

  // Global auth (optional)
  if (process.env.ENABLE_GLOBAL_AUTH) {
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.redirect("/login");
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*"],
};
```

### Service Extensions

**Location**: `services/*/` directories

```typescript
// Example: Email service addon
// services/email/src/provider.ts
interface EmailProvider {
  send(to: string, template: string, data: object): Promise<void>;
}

class SendGridProvider implements EmailProvider {
  async send(to: string, template: string, data: object) {
    if (!process.env.SENDGRID_API_KEY) {
      console.log("Email sending disabled (no SendGrid key)");
      return;
    }
    // Send email
  }
}

// Graceful degradation
export const emailProvider = process.env.SENDGRID_API_KEY
  ? new SendGridProvider()
  : new NoOpEmailProvider();
```

### Package Extensions

**Location**: `packages/*/` shared utilities

```typescript
// Example: Analytics addon
// packages/analytics/src/index.ts
export class Analytics {
  track(event: string, properties?: object) {
    if (process.env.MIXPANEL_TOKEN) {
      mixpanel.track(event, properties);
    }

    if (process.env.GA_MEASUREMENT_ID) {
      gtag("event", event, properties);
    }

    // Always log locally for debugging
    console.log("Analytics:", { event, properties });
  }
}

export const analytics = new Analytics();
```

## Integration Patterns

### Environment-Based Activation

```typescript
// Feature flags via environment
const features = {
  redis: !!process.env.REDIS_URL,
  sentry: !!process.env.SENTRY_DSN,
  analytics: !!process.env.MIXPANEL_TOKEN,
  email: !!process.env.SENDGRID_API_KEY,
};

// Conditional initialization
if (features.redis) {
  await initializeRedis();
}
```

### Provider Pattern

```typescript
// Abstract interface
interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
}

// Multiple implementations
class RedisCache implements CacheProvider {
  /* ... */
}
class MemoryCache implements CacheProvider {
  /* ... */
}

// Factory with fallback
export function createCacheProvider(): CacheProvider {
  if (process.env.REDIS_URL) {
    return new RedisCache(process.env.REDIS_URL);
  }

  console.warn("Using in-memory cache (not suitable for production)");
  return new MemoryCache();
}
```

### Configuration Validation

```typescript
import { z } from "zod";

// Optional config schemas
const RedisConfigSchema = z
  .object({
    REDIS_URL: z.string().url().optional(),
    REDIS_TOKEN: z.string().optional(),
  })
  .optional();

const SentryConfigSchema = z
  .object({
    SENTRY_DSN: z.string().url().optional(),
    SENTRY_ENV: z.enum(["development", "staging", "production"]).default("development"),
  })
  .optional();

// Validate addon configs
export function validateAddonConfig() {
  const redis = RedisConfigSchema.safeParse(process.env);
  const sentry = SentryConfigSchema.safeParse(process.env);

  if (!redis.success) {
    throw new Error("Invalid Redis configuration");
  }

  if (!sentry.success) {
    throw new Error("Invalid Sentry configuration");
  }

  return { redis: redis.data, sentry: sentry.data };
}
```

## Adding New Addons

### 1. Create Provider Interface

```typescript
// Define contract first
interface NotificationProvider {
  send(message: string, channel: string): Promise<void>;
}
```

### 2. Implement Providers

```typescript
// Slack implementation
class SlackProvider implements NotificationProvider {
  constructor(private webhookUrl: string) {}

  async send(message: string, channel: string) {
    // Slack-specific implementation
  }
}

// Discord implementation
class DiscordProvider implements NotificationProvider {
  constructor(private webhookUrl: string) {}

  async send(message: string, channel: string) {
    // Discord-specific implementation
  }
}

// No-op fallback
class NoOpProvider implements NotificationProvider {
  async send(message: string, channel: string) {
    console.log(`Notification (${channel}): ${message}`);
  }
}
```

### 3. Factory with Auto-Detection

```typescript
export function createNotificationProvider(): NotificationProvider {
  if (process.env.SLACK_WEBHOOK_URL) {
    return new SlackProvider(process.env.SLACK_WEBHOOK_URL);
  }

  if (process.env.DISCORD_WEBHOOK_URL) {
    return new DiscordProvider(process.env.DISCORD_WEBHOOK_URL);
  }

  return new NoOpProvider();
}
```

### 4. Usage in Services

```typescript
// services/notification/src/index.ts
import { createNotificationProvider } from "./providers";

const notificationProvider = createNotificationProvider();

export async function sendAlert(message: string) {
  await notificationProvider.send(message, "alerts");
}
```

## Addon Configuration

### Environment Template

```bash
# .env.example

# Optional: Redis for rate limiting and caching
REDIS_URL=redis://localhost:6379
REDIS_TOKEN=                    # For Upstash Redis

# Optional: Sentry for error monitoring
SENTRY_DSN=
SENTRY_ENV=development

# Optional: Email provider
SENDGRID_API_KEY=
EMAIL_FROM=noreply@example.com

# Optional: Analytics
MIXPANEL_TOKEN=
GA_MEASUREMENT_ID=

# Optional: Notifications
SLACK_WEBHOOK_URL=
DISCORD_WEBHOOK_URL=
```

### Addon Status Check

```typescript
// GET /api/addons/status
export async function GET() {
  const status = {
    redis: await checkRedisConnection(),
    sentry: !!process.env.SENTRY_DSN,
    email: !!process.env.SENDGRID_API_KEY,
    analytics: !!process.env.MIXPANEL_TOKEN,
  };

  return NextResponse.json({ addons: status });
}
```

## Links

- **Rate Limiting**: [../services/rate-limit/README.md](../services/rate-limit/README.md)
- **Auth Package**: [../packages/api-auth/README.md](../packages/api-auth/README.md)
- **Web App Config**: [../apps/web/README.md](../apps/web/README.md)
- **Security Guide**: [auth-and-security.md](./auth-and-security.md)
