import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { RateLimiter, createRateLimiter, createMemoryStore } from "../index";
import type { RateLimitStore } from "../types";

describe("RateLimiter", () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe("window generation", () => {
    it("should generate correct windowed keys", async () => {
      vi.setSystemTime(new Date(0)); // Set to Unix epoch

      const _limiter = new RateLimiter({
        limit: 5,
        windowMs: 60_000,
        prefix: "test",
      });

      // Mock the store to capture the key being used
      const mockIncr = vi.fn().mockResolvedValue({ count: 1, resetAt: Date.now() + 60_000 });
      const mockReset = vi.fn().mockResolvedValue(undefined);
      const mockStore: RateLimitStore = {
        incr: mockIncr,
        reset: mockReset,
      };

      const limiterWithMockStore = new RateLimiter({
        limit: 5,
        windowMs: 60_000,
        prefix: "test",
        store: mockStore,
      });

      await limiterWithMockStore.check("user-123");

      expect(mockIncr).toHaveBeenCalledWith("test:0:user-123", 60_000);
    });

    it("should use different window IDs for different time windows", async () => {
      vi.setSystemTime(new Date(0)); // Set to Unix epoch

      const mockIncr2 = vi.fn().mockResolvedValue({ count: 1, resetAt: Date.now() + 60_000 });
      const mockReset2 = vi.fn().mockResolvedValue(undefined);
      const mockStore: RateLimitStore = {
        incr: mockIncr2,
        reset: mockReset2,
      };

      const limiter = new RateLimiter({
        limit: 5,
        windowMs: 60_000,
        prefix: "test",
        store: mockStore,
      });

      // First call at time 0
      await limiter.check("user-123");
      expect(mockIncr2).toHaveBeenCalledWith("test:0:user-123", 60_000);

      // Advance to next window
      vi.advanceTimersByTime(60_000);

      // Second call should use different window ID
      await limiter.check("user-123");
      expect(mockIncr2).toHaveBeenCalledWith("test:1:user-123", 60_000);
    });
  });

  describe("rate limiting logic", () => {
    it("should allow requests within limit", async () => {
      const limiter = new RateLimiter({
        limit: 5,
        windowMs: 60_000,
      });

      const result1 = await limiter.check("user-123");
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);
      expect(result1.count).toBe(1);

      const result2 = await limiter.check("user-123");
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);
      expect(result2.count).toBe(2);
    });

    it("should block requests exceeding limit", async () => {
      const limiter = new RateLimiter({
        limit: 2,
        windowMs: 60_000,
      });

      // Use up the limit
      await limiter.check("user-123");
      await limiter.check("user-123");

      // This should be blocked
      const result = await limiter.check("user-123");
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.count).toBe(3);
    });

    it("should allow request exactly at limit (inclusive)", async () => {
      const limiter = new RateLimiter({
        limit: 3,
        windowMs: 60_000,
      });

      await limiter.check("user-123");
      await limiter.check("user-123");

      const result = await limiter.check("user-123");
      expect(result.allowed).toBe(true); // 3rd request should be allowed (count <= limit)
      expect(result.remaining).toBe(0);
      expect(result.count).toBe(3);

      // 4th request should be blocked
      const result4 = await limiter.check("user-123");
      expect(result4.allowed).toBe(false);
    });

    it("should reset limits on window rollover", async () => {
      const limiter = new RateLimiter({
        limit: 2,
        windowMs: 60_000,
      });

      // Use up limit in first window
      await limiter.check("user-123");
      await limiter.check("user-123");

      const blocked = await limiter.check("user-123");
      expect(blocked.allowed).toBe(false);

      // Advance to next window
      vi.advanceTimersByTime(60_000);

      // Should be allowed in new window
      const newWindow = await limiter.check("user-123");
      expect(newWindow.allowed).toBe(true);
      expect(newWindow.count).toBe(1);
    });

    it("should track different keys independently", async () => {
      const limiter = new RateLimiter({
        limit: 2,
        windowMs: 60_000,
      });

      // Use up limit for user-123
      await limiter.check("user-123");
      await limiter.check("user-123");
      const blocked = await limiter.check("user-123");
      expect(blocked.allowed).toBe(false);

      // user-456 should still be allowed
      const allowed = await limiter.check("user-456");
      expect(allowed.allowed).toBe(true);
      expect(allowed.count).toBe(1);
    });
  });

  describe("error handling", () => {
    it("should gracefully handle store errors by allowing requests", async () => {
      const errorStore: RateLimitStore = {
        incr: vi.fn().mockRejectedValue(new Error("Store failure")),
        reset: vi.fn().mockResolvedValue(undefined),
      };

      const onError = vi.fn();
      const limiter = new RateLimiter({
        limit: 5,
        windowMs: 60_000,
        store: errorStore,
        onError,
      });

      const result = await limiter.check("user-123");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.count).toBe(0);
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should handle reset errors silently", async () => {
      const errorStore: RateLimitStore = {
        incr: vi.fn().mockResolvedValue({ count: 1, resetAt: Date.now() + 60_000 }),
        reset: vi.fn().mockRejectedValue(new Error("Reset failure")),
      };

      const onError = vi.fn();
      const limiter = new RateLimiter({
        limit: 5,
        windowMs: 60_000,
        store: errorStore,
        onError,
      });

      // Should not throw
      await expect(limiter.reset("user-123")).resolves.not.toThrow();

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("factory functions", () => {
    it("createRateLimiter should create a limiter with options", () => {
      const limiter = createRateLimiter({
        limit: 10,
        windowMs: 30_000,
        prefix: "api",
      });

      expect(limiter).toBeInstanceOf(RateLimiter);
    });

    it("createMemoryStore should create a memory store", () => {
      const store = createMemoryStore();
      expect(store).toBeDefined();
      expect(typeof store.incr).toBe("function");
      expect(typeof store.reset).toBe("function");
    });
  });

  describe("retry-after boundary", () => {
    it("should ensure Retry-After is at least 1 second", async () => {
      const limiter = new RateLimiter({
        limit: 1,
        windowMs: 60_000,
      });

      // Use up the limit
      await limiter.check("user-123");

      // Block the next request
      const result = await limiter.check("user-123");
      expect(result.allowed).toBe(false);

      // Calculate retry-after (simulating the glue layer logic)
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);

      // Should be at least 1 second, even for very small remaining time
      expect(retryAfter).toBeGreaterThanOrEqual(1);
    });

    it("should handle sub-second remaining time correctly", async () => {
      const limiter = new RateLimiter({
        limit: 1,
        windowMs: 1500, // 1.5 seconds window
      });

      // Use up the limit
      await limiter.check("user-123");

      // Advance time to near window end
      vi.advanceTimersByTime(1400); // 100ms remaining

      // Block the next request
      const result = await limiter.check("user-123");
      expect(result.allowed).toBe(false);

      // Calculate retry-after
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);

      // Even with 100ms remaining, should round up to 1 second
      expect(retryAfter).toBe(1);
    });
  });

  describe("resetAt calculation", () => {
    it("should return correct resetAt time", async () => {
      vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
      const currentTime = Date.now();

      const limiter = new RateLimiter({
        limit: 5,
        windowMs: 60_000,
      });

      const result = await limiter.check("user-123");

      expect(result.resetAt).toBe(currentTime + 60_000);
    });

    it("should maintain consistent resetAt within same window", async () => {
      vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

      const limiter = new RateLimiter({
        limit: 5,
        windowMs: 60_000,
      });

      const result1 = await limiter.check("user-123");

      // Advance time but stay in same window
      vi.advanceTimersByTime(30_000);

      const result2 = await limiter.check("user-123");

      expect(result1.resetAt).toBe(result2.resetAt);
    });
  });
});
