import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { z } from 'zod'

/**
 * API Key schema and validation
 */
export const ApiKeySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  key: z.string().optional(), // Only present on creation
  keyHash: z.string(),
  keyPrefix: z.string(), // First 12 chars for identification (atlas_XXXX)
  permissions: z.array(z.string()).default([]),
  rateLimit: z
    .object({
      requests: z.number().min(1),
      windowMs: z.number().min(1000),
    })
    .optional(),
  expiresAt: z.date().optional(),
  lastUsedAt: z.date().optional(),
  ipWhitelist: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const ApiKeyCreateSchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()).default(['read']),
  rateLimit: z
    .object({
      requests: z.number().min(1).max(10000),
      windowMs: z.number().min(1000).max(3600000), // 1 second to 1 hour
    })
    .optional(),
  expiresAt: z.date().optional(),
  ipWhitelist: z.array(z.string()).optional(),
})

export const ApiKeyUpdateSchema = ApiKeyCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export type ApiKey = z.infer<typeof ApiKeySchema>
export type ApiKeyCreate = z.infer<typeof ApiKeyCreateSchema>
export type ApiKeyUpdate = z.infer<typeof ApiKeyUpdateSchema>

/**
 * Standard API permissions
 */
export const API_PERMISSIONS = {
  // Basic operations
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',

  // Administrative
  ADMIN: 'admin',

  // Specific resources
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',

  // API management
  KEYS_READ: 'keys:read',
  KEYS_WRITE: 'keys:write',
  KEYS_DELETE: 'keys:delete',

  // System operations
  HEALTH: 'system:health',
  METRICS: 'system:metrics',
} as const

export type ApiPermission =
  (typeof API_PERMISSIONS)[keyof typeof API_PERMISSIONS]

/**
 * Permission groups for easier management
 */
export const PERMISSION_GROUPS = {
  readonly: [API_PERMISSIONS.READ, API_PERMISSIONS.HEALTH],
  standard: [
    API_PERMISSIONS.READ,
    API_PERMISSIONS.WRITE,
    API_PERMISSIONS.HEALTH,
  ],
  admin: [API_PERMISSIONS.ADMIN], // Admin bypasses all other checks
  service: [
    API_PERMISSIONS.READ,
    API_PERMISSIONS.WRITE,
    API_PERMISSIONS.HEALTH,
    API_PERMISSIONS.METRICS,
  ],
} as const

/**
 * API Key management utilities
 */
export class ApiKeyManager {
  /**
   * Generate a new API key with Atlas prefix
   * Returns both the raw key (show once) and the hash (store)
   */
  static generateKey(): { key: string; hash: string; prefix: string } {
    // Generate 32 bytes of cryptographically secure random data
    const buffer = randomBytes(32)

    // Create key with Atlas prefix for easy identification
    const key = `atlas_${buffer.toString('base64url')}`

    // Hash the key for storage (never store the raw key)
    const hash = this.hashKey(key)

    // Extract prefix for display purposes
    const prefix = key.substring(0, 12) // "atlas_XXXX"

    return { key, hash, prefix }
  }

  /**
   * Hash an API key for secure storage
   * Uses SHA-256 for one-way hashing
   */
  static hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex')
  }

  /**
   * Validate API key format
   */
  static isValidFormat(key: string): boolean {
    // Atlas keys: atlas_<43 base64url chars>
    return /^atlas_[\w-]{43}$/.test(key)
  }

  /**
   * Securely compare API key hashes using timing-safe comparison
   */
  static compareHashes(hash1: string, hash2: string): boolean {
    if (hash1.length !== hash2.length) {
      return false
    }

    try {
      return timingSafeEqual(
        Buffer.from(hash1, 'hex'),
        Buffer.from(hash2, 'hex')
      )
    } catch {
      return false
    }
  }

  /**
   * Extract and validate permissions
   */
  static parsePermissions(permissions: string[]): {
    read: boolean
    write: boolean
    delete: boolean
    admin: boolean
    custom: string[]
    all: string[]
  } {
    const standardPermissions = Object.values(API_PERMISSIONS)

    const parsed = {
      read: permissions.includes(API_PERMISSIONS.READ),
      write: permissions.includes(API_PERMISSIONS.WRITE),
      delete: permissions.includes(API_PERMISSIONS.DELETE),
      admin: permissions.includes(API_PERMISSIONS.ADMIN),
      custom: permissions.filter(
        (p) =>
          !standardPermissions.includes(
            p as (typeof standardPermissions)[number]
          )
      ),
      all: permissions,
    }

    return parsed
  }

  /**
   * Check if permissions include a specific permission
   * Admin permission bypasses all other checks
   */
  static hasPermission(
    userPermissions: string[],
    requiredPermission: string
  ): boolean {
    // Admin bypasses all permission checks
    if (userPermissions.includes(API_PERMISSIONS.ADMIN)) {
      return true
    }

    // Check for specific permission
    return userPermissions.includes(requiredPermission)
  }

  /**
   * Check if any of the required permissions are present
   */
  static hasAnyPermission(
    userPermissions: string[],
    requiredPermissions: string[]
  ): boolean {
    // Admin bypasses all permission checks
    if (userPermissions.includes(API_PERMISSIONS.ADMIN)) {
      return true
    }

    // Check if user has any of the required permissions
    return requiredPermissions.some((perm) => userPermissions.includes(perm))
  }

  /**
   * Check if all required permissions are present
   */
  static hasAllPermissions(
    userPermissions: string[],
    requiredPermissions: string[]
  ): boolean {
    // Admin bypasses all permission checks
    if (userPermissions.includes(API_PERMISSIONS.ADMIN)) {
      return true
    }

    // Check if user has all required permissions
    return requiredPermissions.every((perm) => userPermissions.includes(perm))
  }

  /**
   * Get permission group permissions
   */
  static getGroupPermissions(group: keyof typeof PERMISSION_GROUPS): string[] {
    return [...PERMISSION_GROUPS[group]]
  }

  /**
   * Validate IP whitelist against request IP
   */
  static isIpAllowed(clientIp: string, whitelist?: string[]): boolean {
    if (!whitelist || whitelist.length === 0) {
      return true // No whitelist means all IPs allowed
    }

    // Simple IP matching (in production, consider using IP range libraries)
    return whitelist.includes(clientIp)
  }

  /**
   * Check if API key is expired
   */
  static isExpired(expiresAt?: Date): boolean {
    if (!expiresAt) {
      return false // No expiration date means never expires
    }

    return expiresAt < new Date()
  }

  /**
   * Generate a secure random key name suggestion
   */
  static generateKeyName(prefix = 'api-key'): string {
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const random = randomBytes(4).toString('hex')
    return `${prefix}-${timestamp}-${random}`
  }

  /**
   * Mask an API key for display (show only prefix and last 4 characters)
   */
  static maskKey(key: string): string {
    if (!this.isValidFormat(key)) {
      return '***invalid***'
    }

    const prefix = key.substring(0, 12) // atlas_XXXX
    const suffix = key.slice(-4) // Last 4 chars
    return `${prefix}...${suffix}`
  }

  /**
   * Generate API key metadata for logging/display
   */
  static getKeyMetadata(apiKey: ApiKey) {
    return {
      id: apiKey.id,
      name: apiKey.name,
      prefix: apiKey.keyPrefix,
      permissions: apiKey.permissions,
      isActive: apiKey.isActive,
      isExpired: this.isExpired(apiKey.expiresAt),
      hasCustomRateLimit: !!apiKey.rateLimit,
      hasIpWhitelist: !!(apiKey.ipWhitelist && apiKey.ipWhitelist.length > 0),
      createdAt: apiKey.createdAt,
      lastUsedAt: apiKey.lastUsedAt,
    }
  }
}
