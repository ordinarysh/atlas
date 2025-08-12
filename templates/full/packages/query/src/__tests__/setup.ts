import { vi } from "vitest";

// Mock Next.js modules
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    toString: vi.fn(() => ""),
  })),
  headers: vi.fn(() => ({
    get: vi.fn(() => null),
  })),
}));

// Set up global test environment
global.fetch = vi.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};
