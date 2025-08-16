/**
 * API Key management utilities
 *
 * This module provides functions for creating, hashing, and verifying API keys.
 * Uses Argon2 for secure hashing and timing-safe comparisons to prevent attacks.
 */

import { hash, verify } from "@node-rs/argon2";
import { randomBytes, timingSafeEqual } from "node:crypto";
import type { ApiKeyStore, AuthContext, CreateApiKeyOptions } from "./types.js";

/**
 * Argon2 configuration for API key hashing
 *
 * These parameters provide strong security while maintaining reasonable performance:
 * - memoryCost: 64MB memory usage
 * - timeCost: 3 iterations
 * - parallelism: 1 thread (suitable for API key hashing)
 */
const ARGON2_OPTIONS = {
  memoryCost: 65_536, // 64MB
  timeCost: 3, // 3 iterations
  parallelism: 1, // 1 thread
} as const;

/**
 * Generate a cryptographically secure API key
 *
 * @param prefix - Optional prefix for the key (default: 'atlas')
 * @returns A URL-safe base64 encoded API key with prefix
 *
 * @example
 * ```typescript
 * const key = generateApiKey() // Returns: atlas_<43-chars>
 * const customKey = generateApiKey('myapp') // Returns: myapp_<43-chars>
 * ```
 */
export function generateApiKey(prefix = "atlas"): string {
  // Generate 32 bytes of cryptographically secure random data
  const randomData = randomBytes(32);

  // Encode as URL-safe base64 (no padding)
  const encoded = randomData.toString("base64url");

  return `${prefix}_${encoded}`;
}

/**
 * Hash an API key using Argon2
 *
 * @param apiKey - The raw API key to hash
 * @returns Promise resolving to the Argon2 hash
 *
 * @example
 * ```typescript
 * const keyHash = await hashApiKey('atlas_abc123...')
 * // Store keyHash in database, never store the raw key
 * ```
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  return hash(apiKey, ARGON2_OPTIONS);
}

/**
 * Verify an API key against its hash using timing-safe comparison
 *
 * @param apiKey - The raw API key to verify
 * @param keyHash - The stored Argon2 hash
 * @returns Promise resolving to true if key is valid
 *
 * @example
 * ```typescript
 * const isValid = await verifyApiKeyHash('atlas_abc123...', storedHash)
 * ```
 */
export async function verifyApiKeyHash(apiKey: string, keyHash: string): Promise<boolean> {
  try {
    return await verify(keyHash, apiKey);
  } catch {
    // Verification failed - could be invalid hash format or other error
    return false;
  }
}

/**
 * Extract API key from Authorization header or X-API-Key header
 *
 * Supports both formats:
 * - Authorization: Bearer <token>
 * - X-API-Key: <token>
 *
 * @param authHeader - Authorization header value
 * @param apiKeyHeader - X-API-Key header value
 * @returns The extracted API key or null if not found
 *
 * @example
 * ```typescript
 * const key = headerToKey(request.headers.get('authorization'), request.headers.get('x-api-key'))
 * ```
 */
export function headerToKey(
  authHeader?: string | null,
  apiKeyHeader?: string | null,
): string | null {
  // Check Authorization: Bearer <token>
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    return token || null;
  }

  // Check X-API-Key: <token>
  if (apiKeyHeader?.trim()) {
    return apiKeyHeader.trim();
  }

  return null;
}

/**
 * Create a new API key with the given options
 *
 * @param store - The API key store to use
 * @param options - Options for creating the key
 * @returns Promise resolving to the created key and record
 *
 * @example
 * ```typescript
 * const result = await createApiKey(store, {
 *   id: 'dev-001',
 *   scopes: ['read:projects', 'write:projects'],
 *   metadata: { name: 'Development Key' }
 * })
 *
 * console.log('Key (show once):', result.key)
 * // Store result.record in your system
 * ```
 */
export async function createApiKey(
  store: ApiKeyStore,
  options: CreateApiKeyOptions = {},
): Promise<{ key: string; record: Awaited<ReturnType<ApiKeyStore["create"]>>["record"] }> {
  // Use the store to create the record (which will generate and hash the key)
  const result = await store.create({ ...options });

  return {
    key: result.key,
    record: result.record,
  };
}

/**
 * Verify an API key and return authentication context if valid
 *
 * Note: This implementation iterates through all active keys to verify against
 * Argon2 hashes since they cannot be looked up directly due to salt.
 * For production with many keys, consider implementing a dual-hash approach
 * (deterministic hash for lookup + Argon2 for verification).
 *
 * @param store - The API key store to use
 * @param apiKey - The raw API key to verify
 * @param requiredScope - Optional scope that must be present
 * @returns Promise resolving to auth context or null if invalid
 *
 * @example
 * ```typescript
 * const auth = await verifyApiKey(store, 'atlas_abc123...', 'read:projects')
 * if (auth) {
 *   console.log(`Authenticated as ${auth.id} with scopes:`, auth.scopes)
 * }
 * ```
 */
export async function verifyApiKey(
  store: ApiKeyStore,
  apiKey: string,
  requiredScope?: string,
): Promise<AuthContext | null> {
  if (!apiKey) {
    return null;
  }

  // Get all records and verify against each one
  // Note: This is inefficient but necessary due to Argon2 salt making hash lookup impossible
  const allRecords = await store.list();

  for (const safeRecord of allRecords) {
    // Skip inactive or expired keys
    if (!safeRecord.active) {
      continue;
    }

    if (safeRecord.expiresAt && safeRecord.expiresAt < new Date()) {
      continue;
    }

    // Get the full record with hash to verify
    const fullRecord = await store.findById(safeRecord.id);
    if (!fullRecord) {
      continue;
    }

    // Verify the key against this record's hash
    const isValid = await verifyApiKeyHash(apiKey, fullRecord.hash);
    if (isValid) {
      // Check required scope if specified
      if (requiredScope && !fullRecord.scopes.includes(requiredScope)) {
        return null;
      }

      // Update last used timestamp (fire and forget)
      try {
        await store.updateLastUsed(fullRecord.id);
      } catch {
        // Silently ignore errors - this is non-critical
      }

      return {
        id: fullRecord.id,
        scopes: fullRecord.scopes,
        metadata: fullRecord.metadata,
      };
    }
  }

  return null;
}

/**
 * Check if API key format is valid (basic validation)
 *
 * @param apiKey - The API key to validate
 * @returns true if format looks valid
 *
 * @example
 * ```typescript
 * if (!isValidApiKeyFormat(key)) {
 *   throw new Error('Invalid API key format')
 * }
 * ```
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  // Should be prefix_base64url where base64url is 43 chars
  return /^[\dA-Za-z]+_[\w-]{43}$/.test(apiKey);
}

/**
 * Timing-safe string comparison
 *
 * Use this for comparing sensitive values to prevent timing attacks.
 *
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}
