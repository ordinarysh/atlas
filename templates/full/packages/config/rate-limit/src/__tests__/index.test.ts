import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getRateLimitConfig, createRateLimitPresets } from "../index.js";

describe("Rate Limit Configuration", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Mock console methods to test warnings
    vi.spyOn(console, "warn").mockImplementation(vi.fn());
  });

  afterEach(() => {
    // Restore environment - clear rate limit specific vars
    delete process.env.RATE_LIMIT_MAX;
    delete process.env.RATE_LIMIT_WINDOW_MS;
    delete process.env.RATE_LIMIT_PREFIX;
    delete process.env.RATE_LIMIT_STORE;
    delete process.env.TRUST_PROXY;
    Object.assign(process.env, originalEnv);

    // Restore console methods
    vi.restoreAllMocks();
  });

  describe("getRateLimitConfig", () => {
    it("should return default configuration when no env vars are set", () => {
      const config = getRateLimitConfig();

      expect(config).toEqual({
        max: 60,
        windowMs: 60_000,
        prefix: "api",
        provider: "memory",
        trustProxy: false,
      });
    });

    it("should parse RATE_LIMIT_MAX from environment", () => {
      process.env.RATE_LIMIT_MAX = "120";

      const config = getRateLimitConfig();

      expect(config.max).toBe(120);
    });

    it("should parse RATE_LIMIT_WINDOW_MS from environment", () => {
      process.env.RATE_LIMIT_WINDOW_MS = "300000";

      const config = getRateLimitConfig();

      expect(config.windowMs).toBe(300_000);
    });

    it("should parse RATE_LIMIT_PREFIX from environment", () => {
      process.env.RATE_LIMIT_PREFIX = "custom";

      const config = getRateLimitConfig();

      expect(config.prefix).toBe("custom");
    });

    it("should parse RATE_LIMIT_STORE from environment", () => {
      process.env.RATE_LIMIT_STORE = "redis";

      const config = getRateLimitConfig();

      expect(config.provider).toBe("redis");
    });

    it("should parse TRUST_PROXY from environment", () => {
      process.env.TRUST_PROXY = "true";

      const config = getRateLimitConfig();

      expect(config.trustProxy).toBe(true);
    });

    it("should handle TRUST_PROXY=false", () => {
      process.env.TRUST_PROXY = "false";

      const config = getRateLimitConfig();

      expect(config.trustProxy).toBe(false);
    });

    it("should default TRUST_PROXY to false when not set", () => {
      const config = getRateLimitConfig();

      expect(config.trustProxy).toBe(false);
    });

    it("should warn and use default for invalid RATE_LIMIT_MAX", () => {
      process.env.RATE_LIMIT_MAX = "invalid";

      const config = getRateLimitConfig();

      expect(config.max).toBe(60);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("Invalid RATE_LIMIT_MAX"));
    });

    it("should warn and use default for negative RATE_LIMIT_MAX", () => {
      process.env.RATE_LIMIT_MAX = "-10";

      const config = getRateLimitConfig();

      expect(config.max).toBe(60);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("Invalid RATE_LIMIT_MAX"));
    });

    it("should warn and use default for invalid RATE_LIMIT_WINDOW_MS", () => {
      process.env.RATE_LIMIT_WINDOW_MS = "invalid";

      const config = getRateLimitConfig();

      expect(config.windowMs).toBe(60_000);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Invalid RATE_LIMIT_WINDOW_MS"),
      );
    });

    it("should warn and use default for negative RATE_LIMIT_WINDOW_MS", () => {
      process.env.RATE_LIMIT_WINDOW_MS = "-5000";

      const config = getRateLimitConfig();

      expect(config.windowMs).toBe(60_000);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Invalid RATE_LIMIT_WINDOW_MS"),
      );
    });
  });

  describe("createRateLimitPresets", () => {
    beforeEach(() => {
      // Set predictable environment for preset tests
      process.env.RATE_LIMIT_MAX = "60";
      process.env.RATE_LIMIT_WINDOW_MS = "60000";
      process.env.RATE_LIMIT_PREFIX = "test";
      process.env.TRUST_PROXY = "true";
    });

    it("should create standard preset", () => {
      const presets = createRateLimitPresets();

      expect(presets.standard).toEqual({
        max: 60,
        windowMs: 60_000,
        prefix: "test-std",
        provider: "memory",
        trustProxy: true,
      });
    });

    it("should create strict preset with 1/3 limit", () => {
      const presets = createRateLimitPresets();

      expect(presets.strict).toEqual({
        max: 20, // 60 / 3
        windowMs: 60_000,
        prefix: "test-strict",
        provider: "memory",
        trustProxy: true,
      });
    });

    it("should create auth preset with fixed limits", () => {
      const presets = createRateLimitPresets();

      expect(presets.auth).toEqual({
        max: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
        prefix: "test-auth",
        provider: "memory",
        trustProxy: true,
      });
    });

    it("should create upload preset with fixed limits", () => {
      const presets = createRateLimitPresets();

      expect(presets.upload).toEqual({
        max: 10,
        windowMs: 60 * 1000, // 1 minute
        prefix: "test-upload",
        provider: "memory",
        trustProxy: true,
      });
    });

    it("should create admin preset with half limit", () => {
      const presets = createRateLimitPresets();

      expect(presets.admin).toEqual({
        max: 30, // 60 / 2
        windowMs: 60_000,
        prefix: "test-admin",
        provider: "memory",
        trustProxy: true,
      });
    });

    it("should adapt presets to custom base configuration", () => {
      process.env.RATE_LIMIT_MAX = "120";
      process.env.RATE_LIMIT_PREFIX = "custom";

      const presets = createRateLimitPresets();

      expect(presets.standard.max).toBe(120);
      expect(presets.strict.max).toBe(40); // 120 / 3
      expect(presets.admin.max).toBe(60); // 120 / 2
      expect(presets.standard.prefix).toBe("custom-std");
      expect(presets.strict.prefix).toBe("custom-strict");
    });
  });
});
