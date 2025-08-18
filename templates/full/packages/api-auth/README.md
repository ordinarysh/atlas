# Purpose

Provider-agnostic API authentication with secure API key generation, HMAC verification, and scoped permissions for production APIs.

## Public Surface

- **API Key Management**: `createApiKey()`, `verifyApiKey()`, `headerToKey()`
- **HMAC Verification**: `verifyHmac()`, `generateHmac()`, `verifyGitHubSignature()`
- **Store Interface**: `ApiKeyStore`, `MemoryApiKeyStore`, `createApiKeyStore()`
- **Common Scopes**: `COMMON_SCOPES`, `SCOPE_GROUPS` constants
- **Security Utils**: `timingSafeStringEqual()`, Argon2 hashing

## Responsibilities

- **API Key Generation**: Secure random key generation with Argon2 hashing
- **Authentication**: Verify API keys against store with timing-safe comparison
- **Authorization**: Scope-based permission checking
- **HMAC Signatures**: Webhook and request signature verification
- **Store Abstraction**: In-memory store with database upgrade path

**What doesn't belong here:**
- HTTP request handling (belongs in apps/web)
- Rate limiting logic (belongs in services/rate-limit)
- User authentication (future auth provider packages)

## Extension Points

### Basic Usage

```typescript
import { createApiKey, verifyApiKey, COMMON_SCOPES } from '@atlas/api-auth'

// Generate a new API key
const result = await createApiKey({
  id: 'user-123',
  scopes: [COMMON_SCOPES.READ_PROJECTS]
})
console.log(result.key) // Store this securely

// Verify in API route
const auth = await verifyApiKey(apiKey, COMMON_SCOPES.READ_PROJECTS)
if (auth) {
  console.log(`Authenticated: ${auth.id}`)
}
```

### Route Integration

```typescript
// apps/web/src/app/api/protected/route.ts
import { requireApiKey } from '@/server/auth'
import { COMMON_SCOPES } from '@atlas/api-auth'

export const GET = async () => {
  const auth = await requireApiKey(COMMON_SCOPES.READ_PROJECTS)
  if (auth instanceof NextResponse) return auth // 401 error
  
  // ✅ Authenticated user - continue with business logic
  return NextResponse.json({ data: "protected data" })
}
```

### HMAC Webhook Verification

```typescript
import { verifyHmac, verifyGitHubSignature } from '@atlas/api-auth'

// Generic HMAC verification
const isValid = verifyHmac(payload, signature, secret)

// GitHub webhooks (handles "sha256=" prefix)
const isValidGH = verifyGitHubSignature(
  rawPayload,
  request.headers.get("X-Hub-Signature-256"),
  process.env.GITHUB_WEBHOOK_SECRET
)
```

### Custom Store Implementation

```typescript
class DatabaseApiKeyStore implements ApiKeyStore {
  async get(id: string) {
    return db.apiKeys.findUnique({ where: { id } })
  }
  
  async set(id: string, record: ApiKeyRecord) {
    await db.apiKeys.upsert({ where: { id }, data: record })
  }
  
  async delete(id: string) {
    await db.apiKeys.delete({ where: { id } })
  }
}
```

## Testing

```bash
# Run all tests
pnpm test

# Run specific test
pnpm test apiKey.test.ts

# Coverage report
pnpm test --coverage
```

## Links

- **API Routes**: [../../apps/web/src/app/api](../../apps/web/src/app/api)
- **Auth Integration**: [../../docs/auth-and-security.md](../../docs/auth-and-security.md)
- **Rate Limiting**: [../../services/rate-limit/README.md](../../services/rate-limit/README.md)
- **Architecture**: [../../docs/architecture.md](../../docs/architecture.md)

*Last reviewed: 2025-08-16*