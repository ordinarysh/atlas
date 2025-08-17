/**
 * Tests for contract-compliant API functions
 *
 * These tests verify that the simplified API functions work correctly
 * and match the exact contract specification.
 */

import { describe, it, expect } from "vitest";
import { createApiKey, verifyApiKey, headerToKey } from "../contract.js";
import { generateApiKey } from "../apiKey.js";

describe("Contract-compliant API", () => {
  describe("createApiKey", () => {
    it("should create API key with exact contract signature", async () => {
      const rawKey = generateApiKey("test");
      const record = await createApiKey("test-001", rawKey, ["read", "write"]);

      expect(record.id).toBe("test-001");
      expect(record.scopes).toEqual(["read", "write"]);
      expect(record.active).toBe(true);
      expect(record.hash).toBeDefined();
      expect(record.createdAt).toBeInstanceOf(Date);
    });

    it("should use default scopes when not provided", async () => {
      const rawKey = generateApiKey("test");
      const record = await createApiKey("test-002", rawKey);

      expect(record.scopes).toEqual(["read"]);
    });

    it("should throw error for duplicate ID", async () => {
      const rawKey = generateApiKey("test");
      await createApiKey("duplicate-test", rawKey);

      await expect(createApiKey("duplicate-test", rawKey)).rejects.toThrow(
        "API key with ID 'duplicate-test' already exists",
      );
    });
  });

  describe("verifyApiKey", () => {
    it("should verify valid API key without scope", async () => {
      const rawKey = generateApiKey("test");
      await createApiKey("verify-test-1", rawKey, ["read", "write"]);

      const auth = await verifyApiKey(rawKey);

      expect(auth).not.toBeNull();
      expect(auth?.id).toBe("verify-test-1");
      expect(auth?.scopes).toEqual(["read", "write"]);
    });

    it("should verify API key with required scope", async () => {
      const rawKey = generateApiKey("test");
      await createApiKey("verify-test-2", rawKey, ["read", "write"]);

      const auth = await verifyApiKey(rawKey, "read");

      expect(auth).not.toBeNull();
      expect(auth?.id).toBe("verify-test-2");
      expect(auth?.scopes).toEqual(["read", "write"]);
    });

    it("should reject API key without required scope", async () => {
      const rawKey = generateApiKey("test");
      await createApiKey("verify-test-3", rawKey, ["read"]);

      const auth = await verifyApiKey(rawKey, "write");

      expect(auth).toBeNull();
    });

    it("should reject non-existent API key", async () => {
      const fakeKey = generateApiKey("fake");

      const auth = await verifyApiKey(fakeKey);

      expect(auth).toBeNull();
    });

    it("should return simplified auth context", async () => {
      const rawKey = generateApiKey("test");
      await createApiKey("simple-test", rawKey, ["admin"]);

      const auth = await verifyApiKey(rawKey);

      expect(auth).toEqual({
        id: "simple-test",
        scopes: ["admin"],
      });
    });
  });

  describe("headerToKey", () => {
    it("should extract key from Authorization Bearer header", () => {
      const key = generateApiKey("test");
      const authHeader = `Bearer ${key}`;

      const extracted = headerToKey(authHeader);

      expect(extracted).toBe(key);
    });

    it("should return null for missing header", () => {
      const extracted = headerToKey(null);

      expect(extracted).toBeNull();
    });

    it("should return null for malformed header", () => {
      const extracted = headerToKey("Basic abc123");

      expect(extracted).toBeNull();
    });

    it("should handle empty header", () => {
      const extracted = headerToKey("");

      expect(extracted).toBeNull();
    });
  });

  describe("Integration workflow", () => {
    it("should support full create-verify workflow", async () => {
      // 1. Create API key with contract API
      const rawKey = generateApiKey("integration");
      const record = await createApiKey("workflow-test", rawKey, [
        "read:projects",
        "write:projects",
      ]);

      expect(record.id).toBe("workflow-test");
      expect(record.scopes).toEqual(["read:projects", "write:projects"]);

      // 2. Extract key from header
      const authHeader = `Bearer ${rawKey}`;
      const extractedKey = headerToKey(authHeader);

      expect(extractedKey).toBe(rawKey);

      // 3. Verify the key
      expect(extractedKey).not.toBeNull();
      if (extractedKey === null) {
        throw new Error("extractedKey should not be null");
      }
      const auth = await verifyApiKey(extractedKey, "read:projects");

      expect(auth).not.toBeNull();
      expect(auth?.id).toBe("workflow-test");
      expect(auth?.scopes).toEqual(["read:projects", "write:projects"]);

      // 4. Verify with different scope
      const authWithDifferentScope = await verifyApiKey(extractedKey, "write:projects");

      expect(authWithDifferentScope).not.toBeNull();
      expect(authWithDifferentScope?.id).toBe("workflow-test");

      // 5. Verify failure with missing scope
      const authWithMissingScope = await verifyApiKey(extractedKey, "admin");

      expect(authWithMissingScope).toBeNull();
    });
  });
});
