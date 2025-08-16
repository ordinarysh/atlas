/**
 * Tests for API key store implementations
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryApiKeyStore, createApiKeyStore } from "../store.js";
import { testUtils, mockTime } from "./setup.js";

describe("MemoryApiKeyStore", () => {
  let store: MemoryApiKeyStore;

  beforeEach(() => {
    store = new MemoryApiKeyStore();
  });

  describe("create", () => {
    it("should create API key with default options", async () => {
      const result = await store.create();

      expect(result.key).toMatch(/^atlas_[\w-]{43}$/);
      expect(result.record.id).toMatch(/^key_[\da-f]{16}$/);
      expect(result.record.scopes).toEqual(["read"]);
      expect(result.record.active).toBe(true);
      expect(result.record.createdAt).toBeInstanceOf(Date);
      expect(result.record.lastUsedAt).toBeUndefined();
    });

    it("should create API key with custom options", async () => {
      const options = {
        id: "custom-key-001",
        scopes: ["read:projects", "write:projects"],
        expiresAt: new Date("2025-01-01"),
        metadata: testUtils.createTestMetadata({ team: "backend" }),
      };

      const result = await store.create(options);

      expect(result.record.id).toBe("custom-key-001");
      expect(result.record.scopes).toEqual(["read:projects", "write:projects"]);
      expect(result.record.expiresAt).toEqual(new Date("2025-01-01"));
      expect(result.record.metadata).toEqual(expect.objectContaining({ team: "backend" }));
    });

    it("should throw error for duplicate ID", async () => {
      await store.create({ id: "duplicate-id" });

      await expect(store.create({ id: "duplicate-id" })).rejects.toThrow(
        "API key with ID 'duplicate-id' already exists",
      );
    });

    it("should store hash correctly", async () => {
      const result = await store.create({ id: "test-key" });

      // Hash should be stored and findable
      const found = await store.findByHash(result.record.hash);
      expect(found).not.toBeNull();
      if (found) {
        expect(found.id).toBe("test-key");
      }
    });
  });

  describe("findByHash", () => {
    it("should find existing API key by hash", async () => {
      const result = await store.create({ id: "test-key" });

      const found = await store.findByHash(result.record.hash);

      expect(found).not.toBeNull();
      if (found) {
        expect(found.id).toBe("test-key");
        expect(found.active).toBe(true);
      }
    });

    it("should return null for non-existent hash", async () => {
      const found = await store.findByHash("non-existent-hash");
      expect(found).toBeNull();
    });

    it("should return null for inactive key", async () => {
      const result = await store.create({ id: "test-key" });
      await store.deactivate("test-key");

      const found = await store.findByHash(result.record.hash);
      expect(found).toBeNull();
    });

    it("should return null for expired key", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const result = await store.create({
        id: "expired-key",
        expiresAt: yesterday,
      });

      const found = await store.findByHash(result.record.hash);
      expect(found).toBeNull();
    });

    it("should return copy to prevent mutation", async () => {
      const result = await store.create({ id: "test-key" });

      const found1 = await store.findByHash(result.record.hash);
      const found2 = await store.findByHash(result.record.hash);

      expect(found1).not.toBe(found2); // Different objects
      expect(found1).toEqual(found2); // Same data
    });
  });

  describe("findById", () => {
    it("should find existing API key by ID", async () => {
      await store.create({ id: "test-key" });

      const found = await store.findById("test-key");

      expect(found).not.toBeNull();
      if (found) {
        expect(found.id).toBe("test-key");
      }
    });

    it("should return null for non-existent ID", async () => {
      const found = await store.findById("non-existent");
      expect(found).toBeNull();
    });

    it("should find inactive keys by ID", async () => {
      await store.create({ id: "test-key" });
      await store.deactivate("test-key");

      const found = await store.findById("test-key");

      expect(found).not.toBeNull();
      if (found) {
        expect(found.active).toBe(false);
      }
    });

    it("should return copy to prevent mutation", async () => {
      await store.create({ id: "test-key" });

      const found1 = await store.findById("test-key");
      const found2 = await store.findById("test-key");

      expect(found1).not.toBe(found2); // Different objects
      expect(found1).toEqual(found2); // Same data
    });
  });

  describe("updateLastUsed", () => {
    it("should update last used timestamp", async () => {
      mockTime.freezeTime(1000);
      const _result = await store.create({ id: "test-key" });

      mockTime.advanceTime(5000);
      await store.updateLastUsed("test-key");

      const found = await store.findById("test-key");
      expect(found).not.toBeNull();
      if (found) {
        expect(found.lastUsedAt).toEqual(new Date(6000));
      }

      mockTime.restoreTime();
    });

    it("should handle non-existent key gracefully", async () => {
      await expect(store.updateLastUsed("non-existent")).resolves.not.toThrow();
    });
  });

  describe("deactivate", () => {
    it("should deactivate existing key", async () => {
      await store.create({ id: "test-key" });

      const success = await store.deactivate("test-key");

      expect(success).toBe(true);

      const found = await store.findById("test-key");
      expect(found).not.toBeNull();
      if (found) {
        expect(found.active).toBe(false);
      }
    });

    it("should return false for non-existent key", async () => {
      const success = await store.deactivate("non-existent");
      expect(success).toBe(false);
    });

    it("should make key unfindable by hash after deactivation", async () => {
      const result = await store.create({ id: "test-key" });
      await store.deactivate("test-key");

      const found = await store.findByHash(result.record.hash);
      expect(found).toBeNull(); // Inactive keys not returned by findByHash
    });
  });

  describe("list", () => {
    it("should list all active keys by default", async () => {
      await store.create({ id: "key1", scopes: ["read"] });
      await store.create({ id: "key2", scopes: ["write"] });
      await store.create({ id: "key3", scopes: ["admin"] });

      const keys = await store.list();

      expect(keys).toHaveLength(3);
      expect(keys.map((k) => k.id)).toEqual(["key1", "key2", "key3"]);

      // Should not include hash field
      keys.forEach((key) => {
        expect(key).not.toHaveProperty("hash");
      });
    });

    it("should exclude inactive keys when activeOnly=true", async () => {
      await store.create({ id: "active-key" });
      await store.create({ id: "inactive-key" });
      await store.deactivate("inactive-key");

      const activeKeys = await store.list(true);

      expect(activeKeys).toHaveLength(1);
      expect(activeKeys[0].id).toBe("active-key");
    });

    it("should include inactive keys when activeOnly=false", async () => {
      await store.create({ id: "active-key" });
      await store.create({ id: "inactive-key" });
      await store.deactivate("inactive-key");

      const allKeys = await store.list(false);

      expect(allKeys).toHaveLength(2);
      expect(allKeys.map((k) => k.id).sort()).toEqual(["active-key", "inactive-key"]);
    });

    it("should exclude expired keys when activeOnly=true", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await store.create({ id: "active-key" });
      await store.create({ id: "expired-key", expiresAt: yesterday });

      const activeKeys = await store.list(true);

      expect(activeKeys).toHaveLength(1);
      expect(activeKeys[0].id).toBe("active-key");
    });
  });

  describe("clear", () => {
    it("should clear all keys in non-production environment", async () => {
      process.env.NODE_ENV = "test";

      await store.create({ id: "key1" });
      await store.create({ id: "key2" });

      await store.clear();

      const keys = await store.list();
      expect(keys).toHaveLength(0);
    });

    it("should throw error in production environment", async () => {
      process.env.NODE_ENV = "production";

      await expect(store.clear()).rejects.toThrow("Clear operation not allowed in production");

      delete process.env.NODE_ENV;
    });
  });

  describe("getStats", () => {
    it("should return correct statistics", async () => {
      mockTime.freezeTime();

      // Create various keys
      await store.create({ id: "active1" });
      await store.create({ id: "active2" });
      await store.create({ id: "inactive" });
      await store.deactivate("inactive");

      // Create expired key
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await store.create({ id: "expired", expiresAt: yesterday });

      // Create recently used key
      await store.create({ id: "recent" });
      await store.updateLastUsed("recent");

      const stats = await store.getStats();

      expect(stats.total).toBe(5); // All keys (active1, active2, inactive, expired, recent)
      expect(stats.active).toBe(4); // Excluding inactive (active1, active2, expired, recent)
      expect(stats.expired).toBe(1); // Only expired key
      expect(stats.recentlyUsed).toBe(1); // Only recent key

      mockTime.restoreTime();
    });

    it("should handle empty store", async () => {
      const stats = await store.getStats();

      expect(stats.total).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.expired).toBe(0);
      expect(stats.recentlyUsed).toBe(0);
    });
  });

  describe("production warnings", () => {
    it("should log warning in production environment", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
        /* noop */
      });
      process.env.NODE_ENV = "production";

      new MemoryApiKeyStore();

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("PRODUCTION WARNING"));

      delete process.env.NODE_ENV;
    });

    it("should not log warning in development environment", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
        /* noop */
      });
      process.env.NODE_ENV = "development";

      new MemoryApiKeyStore();

      // Should not log production warning (may log other things)
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("PRODUCTION WARNING"),
      );

      delete process.env.NODE_ENV;
    });
  });
});

describe("createApiKeyStore", () => {
  it("should return MemoryApiKeyStore instance", () => {
    const store = createApiKeyStore();

    expect(store).toBeInstanceOf(MemoryApiKeyStore);
  });

  it("should create working store", async () => {
    const store = createApiKeyStore();

    const _result = await store.create({ id: "test" });
    const found = await store.findById("test");

    expect(found).not.toBeNull();
    if (found) {
      expect(found.id).toBe("test");
    }
  });
});

describe("Store integration tests", () => {
  it("should handle concurrent operations", async () => {
    const store = new MemoryApiKeyStore();

    // Create multiple keys concurrently
    const promises = Array.from({ length: 10 }, (_, i) =>
      store.create({ id: `concurrent-${String(i)}` }),
    );

    const results = await Promise.all(promises);

    // All should succeed
    expect(results).toHaveLength(10);

    // All keys should be unique
    const keys = results.map((r) => r.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(10);

    // All should be findable
    const found = await Promise.all(results.map((r) => store.findByHash(r.record.hash)));

    expect(found.every((f) => f !== null)).toBe(true);
  });

  it("should handle complex workflow", async () => {
    const store = new MemoryApiKeyStore();

    // 1. Create key
    const result = await store.create({
      id: "workflow-key",
      scopes: ["read:projects"],
      metadata: testUtils.createTestMetadata(),
    });

    // 2. Verify it exists
    let found = await store.findByHash(result.record.hash);
    expect(found).not.toBeNull();
    if (found) {
      expect(found.lastUsedAt).toBeUndefined();
    }

    // 3. Use the key (update last used)
    await store.updateLastUsed("workflow-key");

    // 4. Check last used was updated
    found = await store.findById("workflow-key");
    expect(found).not.toBeNull();
    if (found) {
      expect(found.lastUsedAt).toBeInstanceOf(Date);
    }

    // 5. List all keys
    const allKeys = await store.list();
    expect(allKeys.some((k) => k.id === "workflow-key")).toBe(true);

    // 6. Deactivate key
    await store.deactivate("workflow-key");

    // 7. Key should not be findable by hash anymore
    found = await store.findByHash(result.record.hash);
    expect(found).toBeNull();

    // 8. But still findable by ID
    found = await store.findById("workflow-key");
    expect(found).not.toBeNull();
    if (found) {
      expect(found.active).toBe(false);
    }
  });

  it("should maintain data integrity across operations", async () => {
    const store = new MemoryApiKeyStore();

    // Create key with all optional fields
    const fullOptions = {
      id: "full-test-key",
      scopes: ["read:projects", "write:projects", "admin"],
      expiresAt: new Date("2025-12-31"),
      metadata: {
        name: "Full Test Key",
        description: "A key with all optional fields",
        createdBy: "integration-test",
        customField: "custom-value",
        nested: {
          deep: {
            value: 42,
          },
        },
      },
    };

    const result = await store.create(fullOptions);

    // Verify all fields are preserved correctly
    const found = await store.findById("full-test-key");

    expect(found).not.toBeNull();
    if (found) {
      expect(found.id).toBe("full-test-key");
      expect(found.scopes).toEqual(["read:projects", "write:projects", "admin"]);
      expect(found.expiresAt).toEqual(new Date("2025-12-31"));
      expect(found.active).toBe(true);
      expect(found.metadata).toBeDefined();
      if (found.metadata) {
        expect(found.metadata.name).toBe("Full Test Key");
        expect(found.metadata.description).toBe("A key with all optional fields");
        expect(found.metadata.createdBy).toBe("integration-test");
        expect(found.metadata.customField).toBe("custom-value");
        expect(found.metadata.nested).toEqual({
          deep: {
            value: 42,
          },
        });
      }
    }

    // Verify hash is working
    const foundByHash = await store.findByHash(result.record.hash);
    expect(foundByHash).toEqual(found);
  });
});
