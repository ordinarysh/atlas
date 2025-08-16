/**
 * Contract-compliant API functions
 *
 * These functions match the exact API contract specified and use a global store internally.
 * This file is separate to avoid circular import issues.
 */

import { createApiKeyStore, MemoryApiKeyStore } from "./store.js";
import {
  verifyApiKey as verifyApiKeyWithStore,
  headerToKey as headerToKeyWithStore,
  hashApiKey,
} from "./apiKey.js";
import type { ApiKeyRecord } from "./types.js";

/**
 * Global store instance for contract-compliant API
 * This provides the contract-required functions without store parameters
 */
const _globalStore = createApiKeyStore();

/**
 * Create API key with the exact contract signature
 *
 * @param id - Unique identifier for the key
 * @param raw - The raw API key to hash and store
 * @param scopes - Optional scopes to grant (default: ['read'])
 * @returns Promise resolving to the stored API key record
 */
export async function createApiKey(
  id: string,
  raw: string,
  scopes?: string[],
): Promise<ApiKeyRecord> {
  // Hash the provided raw key
  const hash = await hashApiKey(raw);

  // Create record with provided hash
  const record: ApiKeyRecord = {
    id,
    hash,
    scopes: scopes ?? ["read"],
    active: true,
    createdAt: new Date(),
    metadata: {
      name: `API Key ${id}`,
      createdBy: "contract-api",
    },
  };

  // Check if ID already exists using the public API
  const existing = await _globalStore.findById(id);
  if (existing) {
    throw new TypeError(`API key with ID '${id}' already exists`);
  }

  // Store directly in the global store using a more type-safe approach
  if (_globalStore instanceof MemoryApiKeyStore) {
    // Access internals directly for the contract-compliant API
    // This is safe because we control the MemoryApiKeyStore implementation
    const memoryStore = _globalStore as unknown as {
      records: Map<string, ApiKeyRecord>;
      hashIndex: Map<string, string>;
    };
    memoryStore.records.set(id, record);
    memoryStore.hashIndex.set(hash, id);
  } else {
    // For other store types, we'd need to implement a different approach
    throw new TypeError(
      "Contract-compliant createApiKey only supports MemoryApiKeyStore currently",
    );
  }

  return record;
}

/**
 * Verify API key with the exact contract signature
 *
 * @param raw - The raw API key to verify
 * @param neededScope - Optional scope that must be present
 * @returns Promise resolving to auth context or null if invalid
 */
export async function verifyApiKey(
  raw: string,
  neededScope?: string,
): Promise<{ id: string; scopes: string[] } | null> {
  const auth = await verifyApiKeyWithStore(_globalStore, raw, neededScope);

  if (!auth) {
    return null;
  }

  return {
    id: auth.id,
    scopes: auth.scopes,
  };
}

/**
 * Extract API key from Authorization header with contract signature
 *
 * @param authHeader - Authorization header value
 * @returns Extracted API key or null
 */
export function headerToKey(authHeader?: string | null): string | null {
  return headerToKeyWithStore(authHeader, null);
}
