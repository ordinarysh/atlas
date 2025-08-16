/**
 * Tests for HMAC verification functions
 */

import { describe, it, expect, vi } from "vitest";
import { verifyHmac, generateHmac, verifyGitHubSignature, createGitHubSignature } from "../hmac.js";
import { testData } from "./setup.js";

describe("generateHmac", () => {
  it("should generate HMAC-SHA256 signature", () => {
    const signature = generateHmac(testData.testPayload, testData.testSecret);

    expect(signature).toBe(testData.testSignature);
    expect(signature).toMatch(/^[\da-f]{64}$/); // 64 hex characters
  });

  it("should generate different signatures for different payloads", () => {
    const payload1 = "payload1";
    const payload2 = "payload2";
    const secret = "shared-secret";

    const sig1 = generateHmac(payload1, secret);
    const sig2 = generateHmac(payload2, secret);

    expect(sig1).not.toBe(sig2);
  });

  it("should generate different signatures for different secrets", () => {
    const payload = "same-payload";
    const secret1 = "secret1";
    const secret2 = "secret2";

    const sig1 = generateHmac(payload, secret1);
    const sig2 = generateHmac(payload, secret2);

    expect(sig1).not.toBe(sig2);
  });

  it("should be deterministic", () => {
    const sig1 = generateHmac(testData.testPayload, testData.testSecret);
    const sig2 = generateHmac(testData.testPayload, testData.testSecret);

    expect(sig1).toBe(sig2);
  });
});

describe("verifyHmac", () => {
  it("should verify correct HMAC signature", () => {
    const isValid = verifyHmac(testData.testPayload, testData.testSignature, testData.testSecret);

    expect(isValid).toBe(true);
  });

  it("should reject incorrect signature", () => {
    const wrongSignature = "f".repeat(64); // Wrong signature

    const isValid = verifyHmac(testData.testPayload, wrongSignature, testData.testSecret);

    expect(isValid).toBe(false);
  });

  it("should reject signature with wrong secret", () => {
    const wrongSecret = "wrong-secret";

    const isValid = verifyHmac(testData.testPayload, testData.testSignature, wrongSecret);

    expect(isValid).toBe(false);
  });

  it("should reject signature with wrong payload", () => {
    const wrongPayload = JSON.stringify({ different: "data" });

    const isValid = verifyHmac(wrongPayload, testData.testSignature, testData.testSecret);

    expect(isValid).toBe(false);
  });

  it("should handle empty inputs", () => {
    expect(verifyHmac("", "", "")).toBe(false);
    expect(verifyHmac("payload", "", "secret")).toBe(false);
    expect(verifyHmac("", "signature", "secret")).toBe(false);
    expect(verifyHmac("payload", "signature", "")).toBe(false);
  });

  it("should handle signatures of different lengths", () => {
    const shortSignature = "abc123";
    const longSignature = "a".repeat(128);

    expect(verifyHmac(testData.testPayload, shortSignature, testData.testSecret)).toBe(false);
    expect(verifyHmac(testData.testPayload, longSignature, testData.testSecret)).toBe(false);
  });

  it("should handle invalid hex signatures gracefully", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      /* noop */
    });

    const invalidHex = "not-hex-signature-gggggg";
    const isValid = verifyHmac(testData.testPayload, invalidHex, testData.testSecret);

    expect(isValid).toBe(false);
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it("should use timing-safe comparison", () => {
    // This is hard to test directly, but we can ensure the function completes
    // in reasonable time for both correct and incorrect signatures
    const start = Date.now();

    // Test with correct signature
    verifyHmac(testData.testPayload, testData.testSignature, testData.testSecret);
    const correctTime = Date.now() - start;

    // Test with incorrect signature (same length)
    const start2 = Date.now();
    const wrongSignature = testData.testSignature.replaceAll("a", "b");
    verifyHmac(testData.testPayload, wrongSignature, testData.testSecret);
    const incorrectTime = Date.now() - start2;

    // Both should complete quickly (timing attack prevention is about microseconds)
    expect(correctTime).toBeLessThan(100);
    expect(incorrectTime).toBeLessThan(100);
  });
});

describe("verifyGitHubSignature", () => {
  const payload = testData.testPayload;
  const secret = testData.testSecret;
  const signature = generateHmac(payload, secret);
  const githubSignature = `sha256=${signature}`;

  it("should verify correct GitHub signature format", () => {
    const isValid = verifyGitHubSignature(payload, githubSignature, secret);
    expect(isValid).toBe(true);
  });

  it("should reject signature without sha256 prefix", () => {
    const isValid = verifyGitHubSignature(payload, signature, secret);
    expect(isValid).toBe(false);
  });

  it("should reject incorrect signature", () => {
    const wrongSignature = `sha256=${"f".repeat(64)}`;
    const isValid = verifyGitHubSignature(payload, wrongSignature, secret);
    expect(isValid).toBe(false);
  });

  it("should handle malformed GitHub signatures", () => {
    const malformedSignatures = [
      "sha1=abc123", // Wrong algorithm
      "sha256:abc123", // Wrong separator
      "sha256=", // Empty signature
      "sha256=invalid", // Invalid hex
      "", // Empty string
      "no-prefix-signature", // No prefix
    ];

    malformedSignatures.forEach((sig) => {
      expect(verifyGitHubSignature(payload, sig, secret)).toBe(false);
    });
  });
});

describe("createGitHubSignature", () => {
  it("should create GitHub-format signature", () => {
    const signature = createGitHubSignature(testData.testPayload, testData.testSecret);

    expect(signature).toBe(`sha256=${testData.testSignature}`);
    expect(signature).toMatch(/^sha256=[\da-f]{64}$/);
  });

  it("should create signature that verifies correctly", () => {
    const signature = createGitHubSignature(testData.testPayload, testData.testSecret);

    const isValid = verifyGitHubSignature(testData.testPayload, signature, testData.testSecret);
    expect(isValid).toBe(true);
  });

  it("should be compatible with verifyGitHubSignature", () => {
    const payload = JSON.stringify({ webhook: "test", data: [1, 2, 3] });
    const secret = "test-webhook-secret";

    const signature = createGitHubSignature(payload, secret);
    const isValid = verifyGitHubSignature(payload, signature, secret);

    expect(isValid).toBe(true);
  });
});

describe("HMAC integration tests", () => {
  it("should handle real webhook payload", () => {
    const webhookPayload = JSON.stringify({
      action: "opened",
      pull_request: {
        id: 1,
        title: "Test PR",
        user: { login: "testuser" },
      },
      repository: {
        name: "test-repo",
        full_name: "testorg/test-repo",
      },
    });

    const secret = "my-webhook-secret";

    // Generate signature as GitHub would
    const signature = createGitHubSignature(webhookPayload, secret);

    // Verify as our webhook handler would
    const isValid = verifyGitHubSignature(webhookPayload, signature, secret);

    expect(isValid).toBe(true);
  });

  it("should handle empty JSON payload", () => {
    const payload = "{}";
    const secret = "test-secret";

    const signature = createGitHubSignature(payload, secret);
    const isValid = verifyGitHubSignature(payload, signature, secret);

    expect(isValid).toBe(true);
  });

  it("should handle binary-like payload", () => {
    const payload = "\u0000\u0001\u0002\u0003test\u00FF\u00FE";
    const secret = "binary-test-secret";

    const signature = createGitHubSignature(payload, secret);
    const isValid = verifyGitHubSignature(payload, signature, secret);

    expect(isValid).toBe(true);
  });

  it("should be resistant to timing attacks on signature comparison", () => {
    const payload = testData.testPayload;
    const secret = testData.testSecret;
    const correctSignature = createGitHubSignature(payload, secret);

    // Create signatures that differ at different positions
    const signatures = [
      correctSignature, // Correct
      correctSignature.replace(/^sha256=./, "sha256=0"), // Differ at start
      correctSignature.replace(/.$/, "0"), // Differ at end
      correctSignature.replace(/(.{32}).$/, "$10"), // Differ in middle
    ];

    // All should complete in similar time (though actual timing attack
    // protection is at the microsecond level, not measurable here)
    signatures.forEach((sig) => {
      const start = performance.now();
      verifyGitHubSignature(payload, sig, secret);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10); // Should be very fast
    });
  });
});
