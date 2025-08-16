import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { MemoryStore } from "../memoryStore";

describe("MemoryStore", () => {
  let store: MemoryStore;

  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
    store = new MemoryStore({ cleanupIntervalMs: 1000 });
  });

  afterEach(() => {
    store.clear();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe("incr", () => {
    it("should initialize count to 1 for new key", async () => {
      vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

      const result = await store.incr("test-key", 60_000);

      expect(result.count).toBe(1);
      expect(result.resetAt).toBe(Date.now() + 60_000);
    });

    it("should increment existing key within window", async () => {
      vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

      const result1 = await store.incr("test-key", 60_000);
      expect(result1.count).toBe(1);

      // Advance time but stay within window
      vi.advanceTimersByTime(30_000);

      const result2 = await store.incr("test-key", 60_000);
      expect(result2.count).toBe(2);
      expect(result2.resetAt).toBe(result1.resetAt); // Same reset time
    });

    it("should work with different windowed keys", async () => {
      vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

      // First windowed key (window 0)
      const result1 = await store.incr("api:0:user-123", 60_000);
      expect(result1.count).toBe(1);

      // Same windowed key increments
      const result2 = await store.incr("api:0:user-123", 60_000);
      expect(result2.count).toBe(2);

      // Advance time slightly
      vi.advanceTimersByTime(1000);

      // Different windowed key (window 1) starts fresh
      const result3 = await store.incr("api:1:user-123", 60_000);
      expect(result3.count).toBe(1);
      expect(result3.resetAt).toBeGreaterThan(result1.resetAt);
    });

    it("should handle multiple keys independently", async () => {
      const result1 = await store.incr("key1", 60_000);
      const result2 = await store.incr("key2", 60_000);

      expect(result1.count).toBe(1);
      expect(result2.count).toBe(1);

      await store.incr("key1", 60_000);
      const result3 = await store.incr("key1", 60_000);
      const result4 = await store.incr("key2", 60_000);

      expect(result3.count).toBe(3);
      expect(result4.count).toBe(2);
    });
  });

  describe("reset", () => {
    it("should remove key from store", async () => {
      await store.incr("test-key", 60_000);

      const statsBefore = store.getStats();
      expect(statsBefore.totalKeys).toBe(1);

      await store.reset("test-key");

      const statsAfter = store.getStats();
      expect(statsAfter.totalKeys).toBe(0);
    });

    it("should not throw for non-existent key", async () => {
      await expect(store.reset("non-existent-key")).resolves.not.toThrow();
    });
  });

  describe("cleanup", () => {
    it("should remove expired entries", async () => {
      vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

      await store.incr("expired-key", 30_000);
      await store.incr("active-key", 120_000);

      expect(store.getStats().totalKeys).toBe(2);

      // Advance time to expire first key but not second
      vi.advanceTimersByTime(60_000);

      store.cleanup();

      expect(store.getStats().totalKeys).toBe(1);
      expect(store.getActiveKeys()).toEqual(["active-key"]);
    });

    it("should not remove non-expired entries", async () => {
      vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

      await store.incr("active-key", 120_000);

      expect(store.getStats().totalKeys).toBe(1);

      // Advance time but not enough to expire
      vi.advanceTimersByTime(60_000);

      store.cleanup();

      expect(store.getStats().totalKeys).toBe(1);
    });
  });

  describe("getStats", () => {
    it("should return correct stats", async () => {
      const initialStats = store.getStats();
      expect(initialStats.totalKeys).toBe(0);
      expect(initialStats.memoryUsage).toBe(0);

      await store.incr("key1", 60_000);
      await store.incr("key2", 60_000);

      const stats = store.getStats();
      expect(stats.totalKeys).toBe(2);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe("getActiveKeys", () => {
    it("should return only non-expired keys", async () => {
      vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

      await store.incr("expired-key", 30_000);
      await store.incr("active-key", 120_000);

      // Advance time to expire first key
      vi.advanceTimersByTime(60_000);

      const activeKeys = store.getActiveKeys();
      expect(activeKeys).toEqual(["active-key"]);
    });

    it("should return empty array when no active keys", () => {
      const activeKeys = store.getActiveKeys();
      expect(activeKeys).toEqual([]);
    });
  });

  describe("clear", () => {
    it("should remove all entries", async () => {
      await store.incr("key1", 60_000);
      await store.incr("key2", 60_000);

      expect(store.getStats().totalKeys).toBe(2);

      store.clear();

      expect(store.getStats().totalKeys).toBe(0);
    });
  });
});
