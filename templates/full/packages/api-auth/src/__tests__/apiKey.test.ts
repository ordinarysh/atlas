/**
 * Tests for API key management functions
 */

import { describe, it, expect, vi } from "vitest";
import {
  generateApiKey,
  hashApiKey,
  verifyApiKeyHash,
  createApiKey,
  verifyApiKey,
  headerToKey,
  isValidApiKeyFormat,
  timingSafeStringEqual,
} from "../apiKey.js";
import { MemoryApiKeyStore } from "../store.js";
import { testData, testUtils } from "./setup.js";

describe("generateApiKey", () => {
  it("should generate API key with default prefix", () => {
    const key = generateApiKey();

    expect(key).toMatch(/^atlas_[\w-]{43}$/);
    expect(key.length).toBe(49); // 'atlas_' (6) + 43 chars
  });

  it("should generate API key with custom prefix", () => {
    const key = generateApiKey("myapp");

    expect(key).toMatch(/^myapp_[\w-]{43}$/);
    expect(key.length).toBe(49); // 'myapp_' (6) + 43 chars
  });

  it("should generate unique keys", () => {
    const keys = Array.from({ length: 100 }, () => generateApiKey());
    const uniqueKeys = new Set(keys);

    expect(uniqueKeys.size).toBe(100);
  });
});

describe("hashApiKey", () => {
  it("should hash API key with Argon2", async () => {
    const key = testData.validApiKey;
    const hash = await hashApiKey(key);

    expect(hash).toMatch(/^\$argon2id\$/); // Argon2id format
    expect(hash.length).toBeGreaterThan(50);
  });

  it("should produce different hashes for different keys", async () => {
    const key1 = generateApiKey("test1");
    const key2 = generateApiKey("test2");

    const hash1 = await hashApiKey(key1);
    const hash2 = await hashApiKey(key2);

    expect(hash1).not.toBe(hash2);
  });

  it("should produce same hash for same key", async () => {
    const key = testData.validApiKey;

    const hash1 = await hashApiKey(key);
    const hash2 = await hashApiKey(key);

    // Note: Argon2 includes salt, so hashes will be different but both valid
    expect(hash1).not.toBe(hash2); // Different due to salt
    expect(await verifyApiKeyHash(key, hash1)).toBe(true);
    expect(await verifyApiKeyHash(key, hash2)).toBe(true);
  });
});

describe("verifyApiKeyHash", () => {
  it("should verify correct API key", async () => {
    const key = testData.validApiKey;
    const hash = await hashApiKey(key);

    const isValid = await verifyApiKeyHash(key, hash);
    expect(isValid).toBe(true);
  });

  it("should reject incorrect API key", async () => {
    const correctKey = testData.validApiKey;
    const wrongKey = generateApiKey("wrong");
    const hash = await hashApiKey(correctKey);

    const isValid = await verifyApiKeyHash(wrongKey, hash);
    expect(isValid).toBe(false);
  });

  it("should handle invalid hash format", async () => {
    const key = testData.validApiKey;
    const invalidHash = "not-a-valid-hash";

    const isValid = await verifyApiKeyHash(key, invalidHash);
    expect(isValid).toBe(false);
  });

  it("should handle empty inputs", async () => {
    expect(await verifyApiKeyHash("", "")).toBe(false);
    expect(await verifyApiKeyHash("key", "")).toBe(false);
    expect(await verifyApiKeyHash("", "hash")).toBe(false);
  });
});

describe("headerToKey", () => {
  it("should extract key from Authorization Bearer header", () => {
    const key = testData.validApiKey;
    const authHeader = `Bearer ${key}`;

    const extracted = headerToKey(authHeader, null);
    expect(extracted).toBe(key);
  });

  it("should extract key from X-API-Key header", () => {
    const key = testData.validApiKey;

    const extracted = headerToKey(null, key);
    expect(extracted).toBe(key);
  });

  it("should prefer Authorization header over X-API-Key", () => {
    const authKey = "atlas_auth_key_" + "a".repeat(30);
    const apiKeyHeader = "atlas_api_key_" + "b".repeat(29);

    const extracted = headerToKey(`Bearer ${authKey}`, apiKeyHeader);
    expect(extracted).toBe(authKey);
  });

  it("should handle malformed Authorization header", () => {
    expect(headerToKey("Bearer", null)).toBeNull();
    expect(headerToKey("Bearer ", null)).toBeNull();
    expect(headerToKey("Basic abc123", null)).toBeNull();
    expect(headerToKey("NotBearer token", null)).toBeNull();
  });

  it("should handle empty headers", () => {
    expect(headerToKey(null, null)).toBeNull();
    expect(headerToKey("", "")).toBeNull();
    expect(headerToKey(undefined, undefined)).toBeNull();
  });

  it("should trim whitespace from X-API-Key header", () => {
    const key = testData.validApiKey;

    const extracted = headerToKey(null, `  ${key}  `);
    expect(extracted).toBe(key);
  });
});

describe("createApiKey", () => {
  it("should create API key with store", async () => {
    const store = new MemoryApiKeyStore();

    const result = await createApiKey(store, {
      id: "test-key",
      scopes: ["read:test"],
      metadata: testUtils.createTestMetadata(),
    });

    expect(result.key).toMatch(/^atlas_[\w-]{43}$/);
    expect(result.record.id).toBe("test-key");
    expect(result.record.scopes).toEqual(["read:test"]);
    expect(result.record.active).toBe(true);
  });

  it("should create API key with default options", async () => {
    const store = new MemoryApiKeyStore();

    const result = await createApiKey(store);

    expect(result.key).toMatch(/^atlas_[\w-]{43}$/);
    expect(result.record.id).toMatch(/^key_[\da-f]{16}$/);
    expect(result.record.scopes).toEqual(["read"]);
    expect(result.record.active).toBe(true);
  });
});

describe("verifyApiKey", () => {
  it("should verify valid API key", async () => {
    const store = new MemoryApiKeyStore();

    // Create a key
    const result = await createApiKey(store, {
      id: "test-key",
      scopes: ["read:projects", "write:projects"],
    });

    // Verify the key
    const auth = await verifyApiKey(store, result.key);

    expect(auth).not.toBeNull();
    if (auth) {
      expect(auth.id).toBe("test-key");
      expect(auth.scopes).toEqual(["read:projects", "write:projects"]);
    }
  });

  it("should verify API key with required scope", async () => {
    const store = new MemoryApiKeyStore();

    const result = await createApiKey(store, {
      scopes: ["read:projects", "write:projects"],
    });

    const auth = await verifyApiKey(store, result.key, "read:projects");
    expect(auth).not.toBeNull();
    if (auth) {
      expect(auth.scopes).toContain("read:projects");
    }
  });

  it("should reject API key without required scope", async () => {
    const store = new MemoryApiKeyStore();

    const result = await createApiKey(store, {
      scopes: ["read:projects"],
    });

    const auth = await verifyApiKey(store, result.key, "write:projects");
    expect(auth).toBeNull();
  });

  it("should reject inactive API key", async () => {
    const store = new MemoryApiKeyStore();

    const result = await createApiKey(store, {
      id: "test-key",
    });

    // Deactivate the key
    await store.deactivate(result.record.id);

    const auth = await verifyApiKey(store, result.key);
    expect(auth).toBeNull();
  });

  it("should reject expired API key", async () => {
    const store = new MemoryApiKeyStore();

    // Create expired key
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const result = await createApiKey(store, {
      expiresAt: yesterday,
    });

    const auth = await verifyApiKey(store, result.key);
    expect(auth).toBeNull();
  });

  it("should reject non-existent API key", async () => {
    const store = new MemoryApiKeyStore();

    const auth = await verifyApiKey(store, testData.validApiKey);
    expect(auth).toBeNull();
  });

  it("should handle empty API key", async () => {
    const store = new MemoryApiKeyStore();

    const auth = await verifyApiKey(store, "");
    expect(auth).toBeNull();
  });

  it("should update last used timestamp", async () => {
    const store = new MemoryApiKeyStore();
    const updateSpy = vi.spyOn(store, "updateLastUsed");

    const result = await createApiKey(store);

    await verifyApiKey(store, result.key);

    expect(updateSpy).toHaveBeenCalledWith(result.record.id);
  });
});

describe("isValidApiKeyFormat", () => {
  it("should validate correct API key format", () => {
    expect(isValidApiKeyFormat(testData.validApiKey)).toBe(true);
  });

  it("should reject invalid formats", () => {
    testData.invalidApiKeys.forEach((invalidKey) => {
      expect(isValidApiKeyFormat(invalidKey)).toBe(false);
    });
  });

  it("should handle custom prefixes", () => {
    const customKey = "myapp_" + "a".repeat(43);
    expect(isValidApiKeyFormat(customKey)).toBe(true);

    const invalidCustom = "my-app_" + "a".repeat(43); // Hyphen not allowed in prefix
    expect(isValidApiKeyFormat(invalidCustom)).toBe(false);
  });
});

describe("timingSafeStringEqual", () => {
  it("should return true for equal strings", () => {
    const str = "test-string-123";
    expect(timingSafeStringEqual(str, str)).toBe(true);
  });

  it("should return false for different strings", () => {
    expect(timingSafeStringEqual("string1", "string2")).toBe(false);
  });

  it("should return false for strings of different lengths", () => {
    expect(timingSafeStringEqual("short", "longer-string")).toBe(false);
  });

  it("should handle empty strings", () => {
    expect(timingSafeStringEqual("", "")).toBe(true);
    expect(timingSafeStringEqual("", "non-empty")).toBe(false);
  });

  it("should handle unicode strings", () => {
    const unicode1 = "test-🔐-string";
    const unicode2 = "test-🔐-string";
    expect(timingSafeStringEqual(unicode1, unicode2)).toBe(true);
  });
});
