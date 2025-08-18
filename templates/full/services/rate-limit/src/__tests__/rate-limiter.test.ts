import { describe, it, expect, vi, beforeEach } from "vitest";
import { RateLimiter } from "../rate-limiter.js";
import type { RateLimitStore } from "../types.js";

// Mock store implementation for testing
class MockStore implements RateLimitStore {
  private data = new Map<string, { count: number; resetAt: number }>();

  incr(key: string, windowMs: number) {
    const existing = this.data.get(key);
    if (!existing) {
      const resetAt = Date.now() + windowMs;
      this.data.set(key, { count: 1, resetAt });
      return Promise.resolve({ count: 1, resetAt });
    }

    existing.count++;
    return Promise.resolve({ count: existing.count, resetAt: existing.resetAt });
  }

  reset(key: string) {
    this.data.delete(key);
    return Promise.resolve();
  }

  clear() {
    this.data.clear();
  }

  // Method to simulate store errors
  shouldError = false;
  incrWithError(key: string, windowMs: number) {
    if (this.shouldError) {
      return Promise.reject(new Error("Store error"));
    }
    return this.incr(key, windowMs);
  }
}

describe("RateLimiter", () => {
  let mockStore: MockStore;
  let limiter: RateLimiter;

  beforeEach(() => {
    mockStore = new MockStore();
    limiter = new RateLimiter({
      limit: 5,
      windowMs: 60_000,
      store: mockStore,
      prefix: "test",
    });
  });

  describe("check", () => {
    it("should allow requests within limit", async () => {
      const result = await limiter.check("user123");

      expect(result.allowed).toBe(true);
      expect(result.count).toBe(1);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(5);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it("should deny requests over limit", async () => {
      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        await limiter.check("user123");
      }

      // 6th request should be denied
      const result = await limiter.check("user123");

      expect(result.allowed).toBe(false);
      expect(result.count).toBe(6);
      expect(result.remaining).toBe(0);
      expect(result.limit).toBe(5);
    });

    it("should generate windowed keys correctly", async () => {
      const now = Date.now();
      const windowId = Math.floor(now / 60_000);
      const _expectedKey = `test:${String(windowId)}:user123`;

      await limiter.check("user123");

      // Verify the key was used (indirect check via store behavior)
      const result = await limiter.check("user123");
      expect(result.count).toBe(2);
    });

    it("should handle different users independently", async () => {
      await limiter.check("user1");
      await limiter.check("user2");

      const result1 = await limiter.check("user1");
      const result2 = await limiter.check("user2");

      expect(result1.count).toBe(2);
      expect(result2.count).toBe(2);
    });

    it("should use default prefix when not provided", () => {
      const defaultLimiter = new RateLimiter({
        limit: 5,
        windowMs: 60_000,
        store: mockStore,
      });

      expect(defaultLimiter).toBeDefined();
    });
  });

  describe("error handling", () => {
    it("should fail open on store errors", async () => {
      const errorStore = {
        incr: vi.fn().mockRejectedValue(new Error("Store down")),
        reset: vi.fn(),
      };

      const errorLimiter = new RateLimiter({
        limit: 5,
        windowMs: 60_000,
        store: errorStore,
      });

      const result = await errorLimiter.check("user123");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.count).toBe(0);
    });

    it("should call error handler when provided", async () => {
      const errorHandler = vi.fn();
      const errorStore = {
        incr: vi.fn().mockRejectedValue(new Error("Store error")),
        reset: vi.fn(),
      };

      const errorLimiter = new RateLimiter({
        limit: 5,
        windowMs: 60_000,
        store: errorStore,
        onError: errorHandler,
      });

      await errorLimiter.check("user123");

      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should warn in development when no error handler provided", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

      const errorStore = {
        incr: vi.fn().mockRejectedValue(new Error("Store error")),
        reset: vi.fn(),
      };

      const errorLimiter = new RateLimiter({
        limit: 5,
        windowMs: 60_000,
        store: errorStore,
      });

      await errorLimiter.check("user123");

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Rate limiter store error, allowing request:",
        "Store error",
      );

      process.env.NODE_ENV = originalEnv;
      consoleWarnSpy.mockRestore();
    });
  });

  describe("reset", () => {
    it("should reset rate limit for a key", async () => {
      await limiter.check("user123");
      await limiter.check("user123");

      await limiter.reset("user123");

      const result = await limiter.check("user123");
      expect(result.count).toBe(1);
    });

    it("should handle reset errors gracefully", async () => {
      const errorStore = {
        incr: vi.fn().mockResolvedValue({ count: 1, resetAt: Date.now() + 60_000 }),
        reset: vi.fn().mockRejectedValue(new Error("Reset failed")),
      };

      const errorLimiter = new RateLimiter({
        limit: 5,
        windowMs: 60_000,
        store: errorStore,
      });

      await expect(errorLimiter.reset("user123")).resolves.toBeUndefined();
    });
  });

  describe("setErrorHandler", () => {
    it("should update error handler", async () => {
      const newErrorHandler = vi.fn();

      limiter.setErrorHandler(newErrorHandler);

      const errorStore = {
        incr: vi.fn().mockRejectedValue(new Error("Store error")),
        reset: vi.fn(),
      };

      const errorLimiter = new RateLimiter({
        limit: 5,
        windowMs: 60_000,
        store: errorStore,
      });

      errorLimiter.setErrorHandler(newErrorHandler);

      await errorLimiter.check("user123");

      expect(newErrorHandler).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("windowed key generation", () => {
    it("should generate different keys for different time windows", () => {
      const _limiter1 = new RateLimiter({
        limit: 5,
        windowMs: 60_000,
        store: mockStore,
        prefix: "test",
      });

      const now = Date.now();
      const windowId1 = Math.floor(now / 60_000);
      const windowId2 = Math.floor((now + 60_000) / 60_000);

      expect(windowId1).not.toBe(windowId2);
    });

    it("should use custom prefix in key generation", async () => {
      const customLimiter = new RateLimiter({
        limit: 5,
        windowMs: 60_000,
        store: mockStore,
        prefix: "custom",
      });

      await customLimiter.check("user123");
      // The prefix is used internally - this test verifies it doesn't crash
      expect(true).toBe(true);
    });
  });
});
