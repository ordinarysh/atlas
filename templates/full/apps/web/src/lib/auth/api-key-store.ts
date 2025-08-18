import { logger } from '@/lib/logger'
import {
  API_PERMISSIONS,
  ApiKeyManager,
  type ApiKey,
  type ApiKeyCreate,
  type ApiKeyUpdate,
} from './api-keys'

/**
 * API Key store interface
 * Allows swapping between in-memory (dev) and database (production) implementations
 */
export interface ApiKeyStore {
  /** Get API key by hash */
  getByHash(keyHash: string): Promise<ApiKey | null>

  /** Get API key by ID */
  getById(id: string): Promise<ApiKey | null>

  /** Create new API key */
  create(data: ApiKeyCreate): Promise<{ apiKey: ApiKey; rawKey: string }>

  /** Update API key */
  update(id: string, data: ApiKeyUpdate): Promise<ApiKey | null>

  /** Delete/revoke API key */
  delete(id: string): Promise<boolean>

  /** List all API keys (without sensitive data) */
  list(activeOnly?: boolean): Promise<Array<Omit<ApiKey, 'keyHash'>>>

  /** Update last used timestamp */
  updateLastUsed(keyHash: string): Promise<void>

  /** Get usage statistics */
  getStats(): Promise<{
    total: number
    active: number
    expired: number
    lastWeek: number
  }>
}

/**
 * In-memory API Key store for development
 *
 * ⚠️  WARNING: For DEVELOPMENT ONLY
 * Data will be lost on server restart. Use database addon for production.
 */
export class MemoryApiKeyStore implements ApiKeyStore {
  private keys = new Map<string, ApiKey>() // id -> ApiKey
  private keysByHash = new Map<string, ApiKey>() // hash -> ApiKey
  private hasCreatedDevKey = false

  constructor() {
    this.logWarningAndCreateDevKey()
  }

  private logWarningAndCreateDevKey(): void {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('🚨 Production Warning: Using in-memory API key store', {
        issue: 'API keys will be lost on server restart',
        solution:
          'Install @atlas/addon-database for persistent API key storage',
        documentation: 'https://docs.atlas.dev/addons/database',
      })
    }

    // Create a default development key for easy testing
    if (process.env.NODE_ENV === 'development' && !this.hasCreatedDevKey) {
      this.createDevKey()
    }
  }

  private createDevKey(): void {
    const devKeyData: ApiKey = {
      id: 'dev-key-001',
      name: 'Development Key',
      keyHash: ApiKeyManager.hashKey(
        'atlas_dev_key_for_local_testing_only_12345'
      ),
      keyPrefix: 'atlas_dev_k',
      permissions: [
        API_PERMISSIONS.READ,
        API_PERMISSIONS.WRITE,
        API_PERMISSIONS.DELETE,
        API_PERMISSIONS.HEALTH,
        API_PERMISSIONS.KEYS_READ,
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      createdBy: 'system',
    }

    this.keys.set(devKeyData.id, devKeyData)
    this.keysByHash.set(devKeyData.keyHash, devKeyData)
    this.hasCreatedDevKey = true

    logger.info('📝 Development API Key created', {
      key: 'atlas_dev_key_for_local_testing_only_12345',
      permissions: devKeyData.permissions,
      note: 'This key is for development only and will not work in production',
    })
  }

  getByHash(keyHash: string): Promise<ApiKey | null> {
    const apiKey = this.keysByHash.get(keyHash)

    if (!apiKey) {
      return Promise.resolve(null)
    }

    // Check if key is active and not expired
    if (!apiKey.isActive) {
      return Promise.resolve(null)
    }

    if (ApiKeyManager.isExpired(apiKey.expiresAt)) {
      return Promise.resolve(null)
    }

    return Promise.resolve({ ...apiKey }) // Return copy to prevent mutation
  }

  getById(id: string): Promise<ApiKey | null> {
    const apiKey = this.keys.get(id)
    return Promise.resolve(apiKey ? { ...apiKey } : null)
  }

  create(data: ApiKeyCreate): Promise<{ apiKey: ApiKey; rawKey: string }> {
    const { key, hash, prefix } = ApiKeyManager.generateKey()

    const apiKey: ApiKey = {
      id: crypto.randomUUID(),
      name: data.name,
      keyHash: hash,
      keyPrefix: prefix,
      permissions: data.permissions || [API_PERMISSIONS.READ],
      rateLimit: data.rateLimit,
      expiresAt: data.expiresAt,
      ipWhitelist: data.ipWhitelist,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    }

    this.keys.set(apiKey.id, apiKey)
    this.keysByHash.set(apiKey.keyHash, apiKey)

    logger.info('API key created', {
      id: apiKey.id,
      name: apiKey.name,
      permissions: apiKey.permissions,
      hasExpiration: !!apiKey.expiresAt,
      hasRateLimit: !!apiKey.rateLimit,
      hasIpWhitelist: !!(apiKey.ipWhitelist && apiKey.ipWhitelist.length > 0),
    })

    return Promise.resolve({
      apiKey: { ...apiKey },
      rawKey: key, // Only returned on creation
    })
  }

  update(id: string, data: ApiKeyUpdate): Promise<ApiKey | null> {
    const existing = this.keys.get(id)
    if (!existing) {
      return Promise.resolve(null)
    }

    const updated: ApiKey = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    }

    this.keys.set(id, updated)
    this.keysByHash.set(updated.keyHash, updated)

    logger.info('API key updated', {
      id: updated.id,
      name: updated.name,
      changes: Object.keys(data),
    })

    return Promise.resolve({ ...updated })
  }

  delete(id: string): Promise<boolean> {
    const apiKey = this.keys.get(id)
    if (!apiKey) {
      return Promise.resolve(false)
    }

    this.keys.delete(id)
    this.keysByHash.delete(apiKey.keyHash)

    logger.info('API key deleted', {
      id: apiKey.id,
      name: apiKey.name,
    })

    return Promise.resolve(true)
  }

  list(activeOnly = true): Promise<Array<Omit<ApiKey, 'keyHash'>>> {
    let allKeys = Array.from(this.keys.values())

    if (activeOnly) {
      allKeys = allKeys.filter(
        (key) => key.isActive && !ApiKeyManager.isExpired(key.expiresAt)
      )
    }

    // Remove sensitive hash data from response
    return Promise.resolve(allKeys.map(({ keyHash: _keyHash, ...key }) => key))
  }

  updateLastUsed(keyHash: string): Promise<void> {
    const apiKey = this.keysByHash.get(keyHash)
    if (apiKey) {
      apiKey.lastUsedAt = new Date()
      apiKey.updatedAt = new Date()
    }
    return Promise.resolve()
  }

  getStats(): Promise<{
    total: number
    active: number
    expired: number
    lastWeek: number
  }> {
    const allKeys = Array.from(this.keys.values())
    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const stats = {
      total: allKeys.length,
      active: allKeys.filter(
        (k) => k.isActive && !ApiKeyManager.isExpired(k.expiresAt)
      ).length,
      expired: allKeys.filter((k) => ApiKeyManager.isExpired(k.expiresAt))
        .length,
      lastWeek: allKeys.filter((k) => k.lastUsedAt && k.lastUsedAt >= lastWeek)
        .length,
    }

    return Promise.resolve(stats)
  }

  /**
   * Development utilities
   */

  /** Clear all keys (testing only) */
  clear(): void {
    this.keys.clear()
    this.keysByHash.clear()
    this.hasCreatedDevKey = false
  }

  /** Get all keys with sensitive data (debugging only) */
  getAllKeysDebug(): ApiKey[] {
    return Array.from(this.keys.values())
  }

  /** Recreate dev key (testing only) */
  recreateDevKey(): void {
    // Remove existing dev key
    const devKey = Array.from(this.keys.values()).find(
      (k) => k.id === 'dev-key-001'
    )
    if (devKey) {
      this.keys.delete(devKey.id)
      this.keysByHash.delete(devKey.keyHash)
    }

    this.hasCreatedDevKey = false
    this.createDevKey()
  }
}

/**
 * Create store instance
 * In production with database addon, this would return DatabaseApiKeyStore
 */
export function createApiKeyStore(): ApiKeyStore {
  // Future: detect if database addon is available and use that instead
  // if (process.env.DATABASE_URL) {
  //   return new DatabaseApiKeyStore()
  // }

  return new MemoryApiKeyStore()
}
