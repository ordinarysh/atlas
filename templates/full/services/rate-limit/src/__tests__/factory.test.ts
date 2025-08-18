import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createRateLimiter,
  createRateLimiterFromConfig,
  createMemoryStore,
  registerStoreAdapter,
  getAvailableStoreAdapters,
} from "../factory.js";
import { RateLimiter } from "../rate-limiter.js";
import { InMemoryStore } from "../in-memory.js";

// Mock store for testing
class MockStore {
  incr() {
    return Promise.resolve({ count: 1, resetAt: Date.now() + 60_000 });
  }
  reset() {
    return Promise.resolve();
  }
}

describe("Factory Functions", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.RATE_LIMIT_STORE;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.RATE_LIMIT_STORE = originalEnv;
    } else {
      delete process.env.RATE_LIMIT_STORE;
    }
  });

  describe("createRateLimiter", () => {
    it("should create a rate limiter with provided options", () => {
      const limiter = createRateLimiter({
        limit: 10,
        windowMs: 30_000,
        prefix: "test",
      });

      expect(limiter).toBeInstanceOf(RateLimiter);
    });

    it("should use custom store when provided", () => {
      const customStore = new MockStore();
      const limiter = createRateLimiter({
        limit: 10,
        windowMs: 30_000,
        store: customStore,
      });

      expect(limiter).toBeInstanceOf(RateLimiter);
    });
  });

  describe("createRateLimiterFromConfig", () => {
    it("should use explicit adapter from config", () => {
      const customStore = new MockStore();
      const limiter = createRateLimiterFromConfig(
        { limit: 10, windowMs: 30_000 },
        { adapter: customStore },
      );

      expect(limiter).toBeInstanceOf(RateLimiter);
    });

    it("should use environment variable adapter", () => {
      process.env.RATE_LIMIT_STORE = "memory";

      const limiter = createRateLimiterFromConfig({
        limit: 10,
        windowMs: 30_000,
      });

      expect(limiter).toBeInstanceOf(RateLimiter);
    });

    it("should fall back to memory store by default", () => {
      delete process.env.RATE_LIMIT_STORE;

      const limiter = createRateLimiterFromConfig({
        limit: 10,
        windowMs: 30_000,
      });

      expect(limiter).toBeInstanceOf(RateLimiter);
    });

    it("should ignore unknown environment adapter", () => {
      process.env.RATE_LIMIT_STORE = "unknown-adapter";

      const limiter = createRateLimiterFromConfig({
        limit: 10,
        windowMs: 30_000,
      });

      expect(limiter).toBeInstanceOf(RateLimiter);
    });
  });

  describe("createMemoryStore", () => {
    it("should create an InMemoryStore instance", () => {
      const store = createMemoryStore();
      expect(store).toBeInstanceOf(InMemoryStore);
    });

    it("should pass options to InMemoryStore", () => {
      const store = createMemoryStore({ cleanupIntervalMs: 30_000 });
      expect(store).toBeInstanceOf(InMemoryStore);
    });
  });

  describe("adapter registry", () => {
    describe("registerStoreAdapter", () => {
      it("should register a new adapter", () => {
        const mockFactory = () => new MockStore();

        registerStoreAdapter("mock", mockFactory);

        const availableAdapters = getAvailableStoreAdapters();
        expect(availableAdapters).toContain("mock");
      });

      it("should allow using registered adapter via environment", () => {
        const mockFactory = () => new MockStore();
        registerStoreAdapter("test-adapter", mockFactory);
        process.env.RATE_LIMIT_STORE = "test-adapter";

        const limiter = createRateLimiterFromConfig({
          limit: 10,
          windowMs: 30_000,
        });

        expect(limiter).toBeInstanceOf(RateLimiter);
      });

      it("should override existing adapter", () => {
        const originalAdapters = getAvailableStoreAdapters();

        const newMemoryFactory = () => new MockStore();
        registerStoreAdapter("memory", newMemoryFactory);

        const adapters = getAvailableStoreAdapters();
        expect(adapters).toContain("memory");
        expect(adapters.length).toBe(originalAdapters.length);
      });
    });

    describe("getAvailableStoreAdapters", () => {
      it("should return array of adapter names", () => {
        const adapters = getAvailableStoreAdapters();

        expect(Array.isArray(adapters)).toBe(true);
        expect(adapters).toContain("memory");
      });

      it("should include custom registered adapters", () => {
        const mockFactory = () => new MockStore();
        registerStoreAdapter("custom-test", mockFactory);

        const adapters = getAvailableStoreAdapters();
        expect(adapters).toContain("custom-test");
      });
    });
  });

  describe("integration", () => {
    it("should create working rate limiter with factory", async () => {
      const limiter = createRateLimiter({
        limit: 2,
        windowMs: 60_000,
        prefix: "integration-test",
      });

      const result1 = await limiter.check("test-key");
      expect(result1.allowed).toBe(true);
      expect(result1.count).toBe(1);

      const result2 = await limiter.check("test-key");
      expect(result2.allowed).toBe(true);
      expect(result2.count).toBe(2);

      const result3 = await limiter.check("test-key");
      expect(result3.allowed).toBe(false);
      expect(result3.count).toBe(3);
    });

    it("should work with config factory", async () => {
      const limiter = createRateLimiterFromConfig({
        limit: 1,
        windowMs: 60_000,
      });

      const result1 = await limiter.check("config-test");
      expect(result1.allowed).toBe(true);

      const result2 = await limiter.check("config-test");
      expect(result2.allowed).toBe(false);
    });
  });
});
