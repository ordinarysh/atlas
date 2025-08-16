/**
 * Core API authentication types
 *
 * This module defines the core types for API key authentication.
 * These types are provider-agnostic and can work with any storage backend.
 */

/**
 * API Key record stored in the database/store
 */
export interface ApiKeyRecord {
  /** Unique identifier for the API key */
  id: string;

  /** Argon2 hash of the raw API key (never store raw keys) */
  hash: string;

  /** Array of scope strings (e.g., ['read:projects', 'write:projects']) */
  scopes: string[];

  /** Whether the key is active and can be used for authentication */
  active: boolean;

  /** Optional expiration timestamp */
  expiresAt?: Date;

  /** Timestamp when the key was created */
  createdAt: Date;

  /** Timestamp when the key was last used (updated on each auth) */
  lastUsedAt?: Date;

  /** Optional metadata for debugging/auditing */
  metadata?: {
    name?: string;
    description?: string;
    createdBy?: string;
    [key: string]: unknown;
  };
}

/**
 * Result of successful API key verification
 */
export interface AuthContext {
  /** ID of the authenticated API key */
  id: string;

  /** Scopes granted to this API key */
  scopes: string[];

  /** Metadata about the key (if available) */
  metadata?: ApiKeyRecord["metadata"];
}

/**
 * Options for creating a new API key
 */
export interface CreateApiKeyOptions {
  /** Human-readable identifier/name for the key */
  id?: string;

  /** Scopes to grant to this key */
  scopes?: string[];

  /** Optional expiration date */
  expiresAt?: Date;

  /** Optional metadata */
  metadata?: ApiKeyRecord["metadata"];
}

/**
 * Result of creating a new API key
 */
export interface CreateApiKeyResult {
  /** The raw API key (show this only once!) */
  key: string;

  /** The stored record (without the raw key) */
  record: ApiKeyRecord;
}

/**
 * Store interface for API key persistence
 *
 * This interface allows swapping between different storage backends
 * (memory, database, etc.) without changing the auth logic.
 */
export interface ApiKeyStore {
  /** Create a new API key */
  create(options?: CreateApiKeyOptions): Promise<CreateApiKeyResult>;

  /** Find API key record by its hash */
  findByHash(hash: string): Promise<ApiKeyRecord | null>;

  /** Find API key record by its ID */
  findById(id: string): Promise<ApiKeyRecord | null>;

  /** Update the last used timestamp for a key */
  updateLastUsed(id: string): Promise<void>;

  /** Deactivate an API key */
  deactivate(id: string): Promise<boolean>;

  /** List all API keys (for admin purposes) */
  list(activeOnly?: boolean): Promise<Array<Omit<ApiKeyRecord, "hash">>>;

  /** Clear all keys (for testing) */
  clear?(): Promise<void>;
}
