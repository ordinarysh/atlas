/**
 * In-memory API key store implementation
 *
 * ⚠️  WARNING: For DEVELOPMENT ONLY
 * Data will be lost on server restart. Use database implementation for production.
 *
 * This store provides a simple in-memory implementation of the ApiKeyStore interface.
 * It includes clear TODO markers for where to integrate with a persistent database.
 */

import { randomBytes } from "node:crypto";
import type {
  ApiKeyStore,
  ApiKeyRecord,
  CreateApiKeyOptions,
  CreateApiKeyResult,
} from "./types.js";
import { generateApiKey, hashApiKey } from "./apiKey.js";

/**
 * In-memory store for API keys
 *
 * TODO: Replace with database implementation for production
 * - Consider using Prisma, Drizzle, or direct SQL
 * - Add proper indexing on hash field for fast lookups
 * - Add connection pooling for high-throughput applications
 * - Consider read replicas for better performance
 * - Add proper error handling and retry logic
 */
export class MemoryApiKeyStore implements ApiKeyStore {
  private readonly records = new Map<string, ApiKeyRecord>(); // id -> record
  private readonly hashIndex = new Map<string, string>(); // hash -> id

  constructor() {
    this.logStorageWarning();
  }

  private logStorageWarning(): void {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "🚨 PRODUCTION WARNING: Using in-memory API key store. " +
          "API keys will be lost on server restart. " +
          "Please implement a database store for production use.",
      );
    }
  }

  /**
   * Create a new API key
   *
   * TODO: Database implementation should:
   * - Use a transaction for atomic record creation
   * - Add unique constraints on id and hash fields
   * - Consider using database-generated UUIDs for ids
   * - Add proper error handling for constraint violations
   */
  async create(options: CreateApiKeyOptions = {}): Promise<CreateApiKeyResult> {
    // Generate unique ID if not provided
    const id = options.id ?? `key_${randomBytes(8).toString("hex")}`;

    // Check for ID conflicts
    if (this.records.has(id)) {
      throw new Error(`API key with ID '${id}' already exists`);
    }

    // Generate raw key and hash it
    const key = generateApiKey();
    const hash = await hashApiKey(key);

    // Check for hash conflicts (extremely unlikely but good practice)
    if (this.hashIndex.has(hash)) {
      throw new Error("Hash collision detected (extremely rare)");
    }

    // Create record
    const record: ApiKeyRecord = {
      id,
      hash,
      scopes: options.scopes ?? ["read"],
      active: true,
      expiresAt: options.expiresAt,
      createdAt: new Date(),
      lastUsedAt: undefined,
      metadata: options.metadata,
    };

    // Store in memory
    this.records.set(id, record);
    this.hashIndex.set(hash, id);

    return { key, record };
  }

  /**
   * Find API key record by hash
   *
   * Only returns active, non-expired keys for security.
   * Inactive or expired keys should not be accessible via hash lookup.
   *
   * TODO: Database implementation should:
   * - Add index on hash column for O(1) lookups
   * - Consider caching frequently accessed keys
   * - Add query timeout protection
   * - Use prepared statements to prevent SQL injection
   * - Add WHERE clauses to filter inactive/expired keys at database level
   */
  findByHash(hash: string): Promise<ApiKeyRecord | null> {
    const id = this.hashIndex.get(hash);
    if (!id) {
      return Promise.resolve(null);
    }

    const record = this.records.get(id);
    if (!record) {
      return Promise.resolve(null);
    }

    // Filter out inactive keys
    if (!record.active) {
      return Promise.resolve(null);
    }

    // Filter out expired keys
    if (record.expiresAt && record.expiresAt < new Date()) {
      return Promise.resolve(null);
    }

    return Promise.resolve({ ...record }); // Return copy to prevent mutation
  }

  /**
   * Find API key record by ID
   *
   * TODO: Database implementation should:
   * - Add primary key index for fast lookups
   * - Consider soft deletes vs hard deletes
   * - Add audit logging for key access
   */
  findById(id: string): Promise<ApiKeyRecord | null> {
    const record = this.records.get(id);
    return Promise.resolve(record ? { ...record } : null); // Return copy to prevent mutation
  }

  /**
   * Update last used timestamp
   *
   * TODO: Database implementation should:
   * - Use lightweight UPDATE query to minimize lock time
   * - Consider batching updates to reduce database load
   * - Make this operation async and non-blocking
   * - Add proper error handling for connection issues
   */
  updateLastUsed(id: string): Promise<void> {
    const record = this.records.get(id);
    if (record) {
      record.lastUsedAt = new Date();
    }
    return Promise.resolve();
  }

  /**
   * Deactivate an API key
   *
   * TODO: Database implementation should:
   * - Use atomic UPDATE operation
   * - Consider soft delete vs marking inactive
   * - Add audit trail for key deactivation
   * - Send notifications if configured
   */
  deactivate(id: string): Promise<boolean> {
    const record = this.records.get(id);
    if (!record) {
      return Promise.resolve(false);
    }

    record.active = false;
    return Promise.resolve(true);
  }

  /**
   * List all API keys (without hashes for security)
   *
   * @param activeOnly - If true, only returns active, non-expired keys (default: true)
   *
   * TODO: Database implementation should:
   * - Add pagination for large key sets
   * - Add filtering by active status, scopes, etc.
   * - Exclude sensitive hash field from results
   * - Add proper access control (admin only)
   * - Use WHERE clauses for efficient filtering at database level
   */
  list(activeOnly = true): Promise<Array<Omit<ApiKeyRecord, "hash">>> {
    const results: Array<Omit<ApiKeyRecord, "hash">> = [];
    const now = new Date();

    for (const record of this.records.values()) {
      // Apply filtering if activeOnly is true
      if (activeOnly) {
        if (!record.active) {
          continue;
        }

        if (record.expiresAt && record.expiresAt < now) {
          continue;
        }
      }

      const { hash: _, ...safeRecord } = record;
      results.push(safeRecord);
    }

    return Promise.resolve(results);
  }

  /**
   * Clear all keys (for testing only)
   *
   * TODO: Database implementation should:
   * - Only expose this in test environments
   * - Use TRUNCATE for better performance
   * - Add confirmation prompts for safety
   */
  clear(): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      return Promise.reject(new Error("Clear operation not allowed in production"));
    }

    this.records.clear();
    this.hashIndex.clear();
    return Promise.resolve();
  }

  /**
   * Get store statistics (for monitoring/debugging)
   *
   * TODO: Database implementation should:
   * - Use efficient COUNT queries
   * - Add metrics for expired keys
   * - Add performance metrics (avg lookup time, etc.)
   * - Export metrics to monitoring system
   */
  getStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    recentlyUsed: number;
  }> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    let total = 0;
    let active = 0;
    let expired = 0;
    let recentlyUsed = 0;

    for (const record of this.records.values()) {
      total++;

      if (record.active) {
        active++;
      }

      if (record.expiresAt && record.expiresAt < now) {
        expired++;
      }

      if (record.lastUsedAt && record.lastUsedAt >= oneDayAgo) {
        recentlyUsed++;
      }
    }

    return Promise.resolve({ total, active, expired, recentlyUsed });
  }
}

/**
 * Create a new API key store instance
 *
 * TODO: Add environment-based store selection:
 * ```typescript
 * export function createApiKeyStore(): ApiKeyStore {
 *   if (process.env.DATABASE_URL) {
 *     return new DatabaseApiKeyStore(process.env.DATABASE_URL)
 *   }
 *
 *   if (process.env.NODE_ENV === 'production') {
 *     throw new Error('Database required for production')
 *   }
 *
 *   return new MemoryApiKeyStore()
 * }
 * ```
 */
export function createApiKeyStore(): ApiKeyStore {
  return new MemoryApiKeyStore();
}
