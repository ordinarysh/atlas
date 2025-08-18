/**
 * @atlas/api-auth - Provider-agnostic API authentication
 *
 * A production-grade API authentication package supporting:
 * - Secure API key generation and verification with Argon2
 * - HMAC-SHA256 signature verification for webhooks
 * - Scoped permissions system
 * - In-memory store with database upgrade path
 * - Timing-safe comparisons to prevent attacks
 *
 * @example
 * ```typescript
 * import { createApiKeyStore, createApiKey, verifyApiKey } from '@atlas/api-auth'
 *
 * const store = createApiKeyStore()
 * const result = await createApiKey(store, {
 *   id: 'dev-001',
 *   scopes: ['read:projects']
 * })
 *
 * // Later, in your API route:
 * const auth = await verifyApiKey(store, apiKey, 'read:projects')
 * if (auth) {
 *   // User is authenticated with required scope
 *   console.log(`Authenticated as ${auth.id}`)
 * }
 * ```
 */

// Core types
export type {
  ApiKeyRecord,
  AuthContext,
  CreateApiKeyOptions,
  CreateApiKeyResult,
  ApiKeyStore,
} from "./types.js";

// API Key management (store-aware functions)
export {
  generateApiKey,
  hashApiKey,
  verifyApiKeyHash,
  createApiKey as createApiKeyWithStore,
  verifyApiKey as verifyApiKeyWithStore,
  headerToKey as headerToKeyWithStore,
  isValidApiKeyFormat,
  timingSafeStringEqual,
} from "./apiKey.js";

// HMAC verification
export { verifyHmac, generateHmac, verifyGitHubSignature, createGitHubSignature } from "./hmac.js";

// Store implementations
export { MemoryApiKeyStore, createApiKeyStore } from "./store.js";

/**
 * Common scopes used across Atlas applications
 *
 * Use these constants to maintain consistency across your API routes.
 * You can also define custom scopes as needed.
 */
export const COMMON_SCOPES = {
  // Basic operations
  READ: "read",
  WRITE: "write",
  DELETE: "delete",

  // Administrative
  ADMIN: "admin",

  // Resource-specific (examples)
  READ_PROJECTS: "read:projects",
  WRITE_PROJECTS: "write:projects",

  // System operations
  HEALTH: "system:health",
  METRICS: "system:metrics",
} as const;

/**
 * Convenience type for common scopes
 */
export type CommonScope = (typeof COMMON_SCOPES)[keyof typeof COMMON_SCOPES];

/**
 * Predefined scope groups for easier key management
 */
export const SCOPE_GROUPS = {
  readonly: [COMMON_SCOPES.READ, COMMON_SCOPES.HEALTH],
  standard: [COMMON_SCOPES.READ, COMMON_SCOPES.WRITE, COMMON_SCOPES.HEALTH],
  admin: [COMMON_SCOPES.ADMIN], // Admin bypasses all other checks
  service: [COMMON_SCOPES.READ, COMMON_SCOPES.WRITE, COMMON_SCOPES.HEALTH, COMMON_SCOPES.METRICS],
} as const;

// Contract-compliant API functions (main exports for simple usage)
export { createApiKey, verifyApiKey, headerToKey } from "./contract.js";

/**
 * Package version and metadata
 */
export const VERSION = "0.1.0";
export const PACKAGE_NAME = "@atlas/api-auth";
