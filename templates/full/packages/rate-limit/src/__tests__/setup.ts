import { vi } from "vitest";

// Mock console methods to avoid noisy test output
vi.spyOn(console, "warn").mockImplementation(vi.fn());
vi.spyOn(console, "debug").mockImplementation(vi.fn());

// Set test environment
process.env.NODE_ENV = "test";
