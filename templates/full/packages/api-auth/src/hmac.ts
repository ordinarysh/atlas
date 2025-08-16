/**
 * HMAC verification utilities
 *
 * This module provides secure HMAC-SHA256 verification with timing-safe comparison.
 * Used for webhook signature verification and other HMAC-based authentication.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify HMAC-SHA256 signature with timing-safe comparison
 *
 * @param payload - The raw payload that was signed
 * @param signature - The HMAC signature to verify (hex encoded)
 * @param secret - The shared secret key
 * @returns true if signature is valid, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = verifyHmac(
 *   JSON.stringify({ webhook: 'data' }),
 *   'a1b2c3...',  // From X-Signature header
 *   process.env.WEBHOOK_SECRET
 * )
 * ```
 */
export function verifyHmac(payload: string, signature: string, secret: string): boolean {
  if (!payload || !signature || !secret) {
    return false;
  }

  try {
    // Validate that signature is valid hex (only contains 0-9, a-f, A-F)
    if (!/^[\dA-Fa-f]*$/.test(signature)) {
      console.warn("HMAC verification failed: Invalid hex signature format");
      return false;
    }

    // Generate expected signature
    const hmac = createHmac("sha256", secret);
    hmac.update(payload, "utf8");
    const expectedSignature = hmac.digest("hex");

    // Ensure both signatures are the same length for timing-safe comparison
    if (signature.length !== expectedSignature.length) {
      return false;
    }

    // Use timing-safe comparison to prevent timing attacks
    return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSignature, "hex"));
  } catch (error) {
    // Log error but don't expose details to prevent information leakage
    console.warn(
      "HMAC verification failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return false;
  }
}

/**
 * Generate HMAC-SHA256 signature for a payload
 *
 * @param payload - The payload to sign
 * @param secret - The shared secret key
 * @returns hex-encoded HMAC signature
 *
 * @example
 * ```typescript
 * const signature = generateHmac(
 *   JSON.stringify({ webhook: 'data' }),
 *   process.env.WEBHOOK_SECRET
 * )
 * // Use signature in X-Signature header or similar
 * ```
 */
export function generateHmac(payload: string, secret: string): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(payload, "utf8");
  return hmac.digest("hex");
}

/**
 * Verify GitHub-style webhook signature
 *
 * GitHub webhooks send signatures in the format "sha256=<hex_signature>"
 *
 * @param payload - The raw webhook payload
 * @param signature - The signature from the X-Hub-Signature-256 header
 * @param secret - The webhook secret
 * @returns true if signature is valid, false otherwise
 */
export function verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature.startsWith("sha256=")) {
    return false;
  }

  const hexSignature = signature.slice(7); // Remove 'sha256=' prefix
  return verifyHmac(payload, hexSignature, secret);
}

/**
 * Create a signature header in GitHub format
 *
 * @param payload - The payload to sign
 * @param secret - The secret key
 * @returns signature in "sha256=<hex>" format
 */
export function createGitHubSignature(payload: string, secret: string): string {
  const signature = generateHmac(payload, secret);
  return `sha256=${signature}`;
}
