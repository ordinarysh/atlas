import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { InMemoryStore } from "../in-memory.js";

describe("InMemoryStore", () => {
  let store: InMemoryStore;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    store = new InMemoryStore({ cleanupIntervalMs: 1000 });
  });

  afterEach(() => {
    store.clear();
    consoleWarnSpy.mockRestore();
  });

  describe("incr", () => {
    it("should initialize count to 1 for new key", async () => {
      const result = await store.incr("test-key", 60_000);

      expect(result.count).toBe(1);
      expect(result.resetAt).toBeGreaterThan(Date.now());
      expect(result.resetAt).toBeLessThanOrEqual(Date.now() + 60_000);
    });

    it("should increment count for existing key", async () => {
      await store.incr("test-key", 60_000);
      const result = await store.incr("test-key", 60_000);

      expect(result.count).toBe(2);
    });

    it("should maintain consistent resetAt for same window", async () => {
      const first = await store.incr("test-key", 60_000);
      const second = await store.incr("test-key", 60_000);

      expect(second.resetAt).toBe(first.resetAt);
    });

    it("should handle multiple different keys", async () => {
      const result1 = await store.incr("key1", 60_000);
      const result2 = await store.incr("key2", 60_000);

      expect(result1.count).toBe(1);
      expect(result2.count).toBe(1);
    });
  });

  describe("reset", () => {
    it("should remove existing key", async () => {
      await store.incr("test-key", 60_000);
      await store.reset("test-key");

      const result = await store.incr("test-key", 60_000);
      expect(result.count).toBe(1);
    });

    it("should handle non-existent key gracefully", async () => {
      await expect(store.reset("non-existent")).resolves.toBeUndefined();
    });
  });

  describe("cleanup", () => {
    it("should remove expired entries", async () => {
      const now = Date.now();
      vi.spyOn(Date, "now").mockReturnValue(now);

      await store.incr("expired-key", 1000);

      // Advance time past expiration
      vi.spyOn(Date, "now").mockReturnValue(now + 2000);

      store.cleanup();

      // Should reset to 1 since expired entry was cleaned up
      const result = await store.incr("expired-key", 1000);
      expect(result.count).toBe(1);

      vi.restoreAllMocks();
    });

    it("should keep non-expired entries", async () => {
      await store.incr("active-key", 60_000);
      store.cleanup();

      const result = await store.incr("active-key", 60_000);
      expect(result.count).toBe(2);
    });
  });

  describe("getStats", () => {
    it("should return correct statistics", async () => {
      await store.incr("key1", 60_000);
      await store.incr("key2", 60_000);

      const stats = store.getStats();
      expect(stats.totalKeys).toBe(2);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe("getActiveKeys", () => {
    it("should return only non-expired keys", async () => {
      const now = Date.now();
      vi.spyOn(Date, "now").mockReturnValue(now);

      await store.incr("active-key", 60_000);
      await store.incr("expired-key", 1000);

      // Advance time to expire one key
      vi.spyOn(Date, "now").mockReturnValue(now + 2000);

      const activeKeys = store.getActiveKeys();
      expect(activeKeys).toContain("active-key");
      expect(activeKeys).not.toContain("expired-key");

      vi.restoreAllMocks();
    });
  });

  describe("production warning", () => {
    it("should warn when used in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      new InMemoryStore();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("WARNING: Using in-memory rate limiting in production"),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should not warn in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      new InMemoryStore();

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("clear", () => {
    it("should remove all entries", async () => {
      await store.incr("key1", 60_000);
      await store.incr("key2", 60_000);

      store.clear();

      const stats = store.getStats();
      expect(stats.totalKeys).toBe(0);
    });
  });
});
