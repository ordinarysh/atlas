# @atlas/api-auth

Provider-agnostic API authentication with secure API keys and HMAC verification.

## Overview

This package provides production-grade API authentication for service-to-service communication. It features secure API key generation using Argon2 hashing, timing-safe comparisons, scoped permissions, and HMAC signature verification for webhooks.

**🔒 Security First**: Uses Argon2 for key hashing, timing-safe comparisons to prevent attacks, and follows security best practices throughout.

**🚀 Production Ready**: Minimal dependencies, comprehensive error handling, and designed for high-throughput applications.

**🔄 Future-Proof**: Clean interfaces ready for BetterAuth integration and database backend swapping.

## Features

- ✅ **Secure API Key Management**: Argon2 hashing with configurable parameters
- ✅ **Scoped Permissions**: Granular access control with string-based scopes
- ✅ **Multiple Auth Headers**: Supports `Authorization: Bearer` and `X-API-Key` headers
- ✅ **HMAC Verification**: SHA-256 HMAC for webhook signature verification
- ✅ **Timing-Safe Comparisons**: Prevents timing attacks on sensitive operations
- ✅ **Provider Agnostic**: No framework dependencies, works anywhere
- ✅ **Database Ready**: Clear upgrade path from in-memory to persistent storage

## Installation

This package is part of the Atlas monorepo and installed automatically with the workspace.

```bash
pnpm install  # Installs all workspace dependencies
```

## Quick Start

### Basic API Key Authentication

```typescript
import { createApiKeyStore, createApiKey, verifyApiKey, headerToKey } from "@atlas/api-auth";

// Initialize store (in-memory for development)
const store = createApiKeyStore();

// Create a new API key
const result = await createApiKey(store, {
  id: "service-001",
  scopes: ["read:projects", "write:todos"],
  metadata: { name: "Service Integration Key" },
});

// Show the raw key once (never store this!)
console.log("API Key (save this):", result.key);
// Outputs: atlas_<43-character-base64url-string>

// Later, verify the key in your API route
const apiKey = headerToKey(authHeader, apiKeyHeader);
const auth = await verifyApiKey(store, apiKey, "read:projects");

if (auth) {
  console.log(`✅ Authenticated as ${auth.id}`);
  console.log("Scopes:", auth.scopes);
  // Continue with authenticated request
} else {
  console.log("❌ Authentication failed");
  // Return 401 Unauthorized
}
```

### HMAC Webhook Verification

```typescript
import { verifyHmac, verifyGitHubSignature } from "@atlas/api-auth";

// Verify generic HMAC signature
const isValid = verifyHmac(
  JSON.stringify(webhookPayload),
  signatureFromHeader,
  process.env.WEBHOOK_SECRET,
);

// Verify GitHub webhook (handles "sha256=" prefix)
const isValidGitHub = verifyGitHubSignature(
  rawPayload,
  request.headers.get("X-Hub-Signature-256"),
  process.env.GITHUB_WEBHOOK_SECRET,
);
```

## API Reference

### Core Functions

#### `createApiKey(store, options?)`

Creates a new API key with secure random generation and Argon2 hashing.

```typescript
const result = await createApiKey(store, {
  id: "optional-custom-id",
  scopes: ["read:projects", "admin"],
  expiresAt: new Date("2024-12-31"),
  metadata: { name: "Development Key", team: "backend" },
});

// result.key: Raw API key (show once!)
// result.record: Stored record (safe to log)
```

#### `verifyApiKey(store, apiKey, requiredScope?)`

Verifies an API key and returns authentication context.

```typescript
const auth = await verifyApiKey(store, "atlas_...", "read:projects");

if (auth) {
  // auth.id: Key identifier
  // auth.scopes: Array of granted scopes
  // auth.metadata: Optional metadata
}
```

#### `headerToKey(authHeader?, apiKeyHeader?)`

Extracts API key from standard headers.

```typescript
// Supports both formats:
const key = headerToKey("Bearer atlas_...", null); // Authorization header
const key = headerToKey(null, "atlas_..."); // X-API-Key header
const key = headerToKey(request.headers.get("authorization"), request.headers.get("x-api-key"));
```

### HMAC Functions

#### `verifyHmac(payload, signature, secret)`

Verifies HMAC-SHA256 signatures with timing-safe comparison.

```typescript
const isValid = verifyHmac(
  JSON.stringify(data), // Payload that was signed
  "a1b2c3d4...", // Hex signature
  "your-secret-key", // Shared secret
);
```

#### `verifyGitHubSignature(payload, signature, secret)`

Specialized function for GitHub webhook signatures.

```typescript
const isValid = verifyGitHubSignature(
  rawPayloadString,
  "sha256=a1b2c3...", // From X-Hub-Signature-256 header
  process.env.GITHUB_WEBHOOK_SECRET,
);
```

### Store Interface

The `ApiKeyStore` interface allows swapping storage backends:

```typescript
interface ApiKeyStore {
  create(options?): Promise<CreateApiKeyResult>;
  findByHash(hash: string): Promise<ApiKeyRecord | null>;
  findById(id: string): Promise<ApiKeyRecord | null>;
  updateLastUsed(id: string): Promise<void>;
  deactivate(id: string): Promise<boolean>;
  list(): Promise<Omit<ApiKeyRecord, "hash">[]>;
}
```

## Security Considerations

### Argon2 vs Other Algorithms

We use Argon2 instead of bcrypt or scrypt because:

- **Memory-hard**: Resistant to GPU/ASIC attacks
- **Tunable**: Configurable memory, time, and parallelism costs
- **Modern**: Designed with current threat models in mind
- **Winner**: Winner of the Password Hashing Competition

### Timing-Safe Comparisons

All sensitive comparisons use `timingSafeEqual()` to prevent timing attacks:

```typescript
// ❌ Vulnerable to timing attacks
if (hash1 === hash2) {
  /* ... */
}

// ✅ Timing-safe comparison
if (timingSafeEqual(Buffer.from(hash1), Buffer.from(hash2))) {
  /* ... */
}
```

### Brute Force Protection

**TODO**: The current in-memory implementation lacks brute-force protection. Consider adding:

- Rate limiting per IP/key attempts
- Exponential backoff after failed attempts
- Account lockout after repeated failures
- Monitoring and alerting for attack patterns

### Key Storage

- ✅ **DO**: Store Argon2 hashes in your database
- ✅ **DO**: Use the provided `hashApiKey()` function
- ❌ **DON'T**: Store raw API keys anywhere
- ❌ **DON'T**: Log raw API keys in production

### Scope Design

- Use specific scopes: `read:projects` vs `read`
- Follow the principle of least privilege
- Consider hierarchical scopes for complex permissions
- Regular scope audits and cleanup

## Production Deployment

### Database Migration

The in-memory store is **development only**. For production:

1. **Implement DatabaseApiKeyStore**:

```typescript
// TODO: Create database implementation
export class DatabaseApiKeyStore implements ApiKeyStore {
  constructor(private db: Database) {}

  async findByHash(hash: string): Promise<ApiKeyRecord | null> {
    // Use indexed query on hash column
    return await this.db.query("SELECT * FROM api_keys WHERE hash = ? AND active = true", [hash]);
  }

  // ... implement other methods
}
```

2. **Update createApiKeyStore()**:

```typescript
export function createApiKeyStore(): ApiKeyStore {
  if (process.env.DATABASE_URL) {
    return new DatabaseApiKeyStore(createConnection(process.env.DATABASE_URL));
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Database required for production");
  }

  return new MemoryApiKeyStore();
}
```

3. **Database Schema**:

```sql
CREATE TABLE api_keys (
  id VARCHAR(255) PRIMARY KEY,
  hash VARCHAR(512) NOT NULL UNIQUE,
  scopes JSON NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP NULL,
  metadata JSON NULL
);

-- Essential indexes
CREATE INDEX idx_api_keys_hash ON api_keys(hash);
CREATE INDEX idx_api_keys_active ON api_keys(active);
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at);
```

### Environment Variables

No additional environment variables are required for basic API key authentication. Optional webhooks require:

```bash
# For HMAC webhook verification
WEBHOOK_SECRET=your-secure-webhook-secret
GITHUB_WEBHOOK_SECRET=github-provided-secret
```

### Performance Optimization

- **Connection Pooling**: Use database connection pools
- **Caching**: Cache frequently accessed keys (with TTL)
- **Indexes**: Ensure proper database indexing on `hash` column
- **Read Replicas**: Consider read replicas for high-traffic applications

## Future BetterAuth Integration

This package is designed to work alongside BetterAuth for user authentication:

### Planned Integration

```typescript
// Future: BetterAuth could mint short-lived JWTs for API access
const jwt = await betterAuth.createApiToken(user, {
  scopes: ["read:projects"],
  expiresIn: "1h",
});

// The same auth guards would work with JWTs
const auth = await verifyApiKey(store, jwt, "read:projects");
// Returns the same AuthContext regardless of token type
```

### Architecture Benefits

- **Unified Auth Context**: Same `AuthContext` for API keys and JWTs
- **Shared Scopes**: Consistent permission model across auth types
- **Drop-in Compatibility**: Existing routes continue working
- **Flexible Migration**: Gradual adoption of new auth methods

## Development

### Running Tests

```bash
pnpm test                    # Run all tests
pnpm test:run               # Run tests once (CI mode)
pnpm test --coverage        # Run with coverage report
```

### Linting and Type Checking

```bash
pnpm lint                   # ESLint
pnpm type-check            # TypeScript compilation
```

### Creating API Keys for Development

Use the included mint script to create development keys:

```bash
pnpm mint:key              # Creates a new development API key
```

**⚠️ Security Warning**: The mint script outputs the raw API key to the console. Never commit these keys or use them in production.

## License

This package is part of the Atlas monorepo and follows the same licensing terms.

## Contributing

1. Ensure all tests pass: `pnpm test`
2. Check types and linting: `pnpm type-check && pnpm lint`
3. Add tests for new functionality
4. Update documentation for API changes
5. Follow existing code style and patterns

## Support

For questions or issues:

1. Check existing documentation and examples
2. Search existing issues in the Atlas repository
3. Create a new issue with detailed reproduction steps
4. Include relevant logs (without sensitive data)

---

**🔒 Remember**: This is for service authentication only. For user authentication with sessions, cookies, and OAuth, use [BetterAuth](https://www.better-auth.com/) or similar solutions.
