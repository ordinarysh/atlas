/**
 * Test setup for @atlas/api-auth package
 *
 * This file configures the test environment and provides utilities
 * for testing API authentication functionality.
 */

import { beforeEach, vi } from "vitest";

/**
 * Global test setup
 */
beforeEach(() => {
  // Clear any environment variables that might affect tests
  delete process.env.NODE_ENV;

  // Reset all mocks before each test
  vi.clearAllMocks();

  // Suppress console warnings in tests unless debugging
  if (!process.env.DEBUG_TESTS) {
    vi.spyOn(console, "warn").mockImplementation(() => {
      /* noop */
    });
  }
});

/**
 * Test utilities for API key testing
 */
export const testUtils = {
  /**
   * Create a test API key with known format
   */
  createTestApiKey: (prefix = "test"): string => {
    // Use predictable test data instead of random for reproducible tests
    return `${prefix}_${"a".repeat(43)}`;
  },

  /**
   * Create multiple test API keys
   */
  createTestApiKeys: (count: number, prefix = "test"): string[] => {
    return Array.from({ length: count }, (_, i) => `${prefix}_${String(i).padStart(43, "a")}`);
  },

  /**
   * Wait for a specified amount of time (for timing tests)
   */
  wait: (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  /**
   * Create test metadata
   */
  createTestMetadata: (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    name: "Test Key",
    description: "A test API key",
    createdBy: "test-suite",
    ...overrides,
  }),
};

/**
 * Common test data
 */
export const testData = {
  validApiKey: "atlas_abcdefghijklmnopqrstuvwxyz1234567890ABCDEFG",
  invalidApiKeys: [
    "",
    "invalid",
    "atlas_",
    "atlas_tooshort",
    "atlas_" + "a".repeat(44), // Too long
    "atlas_invalid/chars+", // Invalid chars for base64url
    "_" + "a".repeat(43), // Invalid: no prefix before underscore
  ],
  testScopes: [
    "read:projects",
    "write:projects",
    "read:todos",
    "write:todos",
    "admin",
    "system:health",
  ],
  testPayload: JSON.stringify({
    test: "data",
    timestamp: "2024-01-01T00:00:00Z",
    id: 12_345,
  }),
  testSecret: "test-secret-key-for-hmac-testing",
  // HMAC-SHA256 of testPayload with testSecret
  testSignature: "75aa7fe1fa095f3ce6a02215da96382caaf024b8e401bb39fa4ce577a71eacd2",
} as const;

/**
 * Mock time utilities for testing time-sensitive functionality
 */
export const mockTime = {
  /**
   * Mock Date.now() to return a fixed timestamp
   */
  freezeTime: (timestamp = 1_640_995_200_000): void => {
    // 2022-01-01T00:00:00.000Z
    vi.useFakeTimers();
    vi.setSystemTime(new Date(timestamp));
  },

  /**
   * Restore real timers
   */
  restoreTime: (): void => {
    vi.useRealTimers();
  },

  /**
   * Advance time by specified amount
   */
  advanceTime: (ms: number): void => {
    vi.advanceTimersByTime(ms);
  },
};
