/**
 * Edge-safe crypto primitives for the provably-fair (commit-reveal) engine.
 *
 * Uses ONLY the runtime-global Web Crypto API (crypto.subtle, crypto.getRandomValues)
 * — never `node:crypto` — so this module bundles identically into the browser
 * (the pure verifier), the Next Edge runtime, the Next Node runtime, Cloudflare
 * Workers, and node:test. Matches the established repo idiom in
 * packages/kyc/src/crypto/aws-sigv4.ts and packages/seo/src/deeplinks/share.ts
 * (the latter documents exactly why Web Crypto, not node:crypto: a static
 * node-crypto import fails the Turbopack edge build).
 *
 * Hex output is byte-identical to node:crypto's `.digest("hex")`, so values
 * produced here verify against any previously hex-encoded digest/HMAC.
 */

const encoder = new TextEncoder();

/** Lower-case hex of an ArrayBuffer / ArrayBufferView, matching node's "hex" digest. */
function toHex(buf: ArrayBuffer | ArrayBufferView): string {
  const view =
    buf instanceof ArrayBuffer
      ? new Uint8Array(buf)
      : new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  let out = "";
  for (let i = 0; i < view.length; i += 1) {
    out += view[i]!.toString(16).padStart(2, "0");
  }
  return out;
}

/** Accept a string or raw bytes; strings are UTF-8 encoded. */
function toBytes(input: string | Uint8Array): Uint8Array {
  return typeof input === "string" ? encoder.encode(input) : input;
}

/** SHA-256(bytes) -> lower-case hex. The commit-reveal hash primitive. */
export async function sha256(input: string | Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", toBytes(input) as BufferSource);
  return toHex(digest);
}

/** HMAC-SHA256(keyBytes, msgBytes) -> lower-case hex. */
export async function hmacSha256(
  key: string | Uint8Array,
  message: string | Uint8Array,
): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    toBytes(key) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, toBytes(message) as BufferSource);
  return toHex(signature);
}

/** 32 cryptographically-random bytes (256-bit server seed / nonce). */
export function randomBytes32(): Uint8Array {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes;
}

/** A 64-char hex server seed for commit-reveal. */
export function randomSeedHex(): string {
  return toHex(randomBytes32());
}

/**
 * Deterministic JSON: object keys sorted recursively so a signature/hash is
 * independent of key insertion order but sensitive to every value. Lifted
 * verbatim from apps/studio/lib/studio/approval-signature.ts:36-47 (pure — no
 * crypto dependency, already edge/client-safe).
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const entries = Object.keys(value as Record<string, unknown>)
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`,
    );
  return `{${entries.join(",")}}`;
}

/**
 * Constant-time comparison of two equal-length hex/ASCII strings. No node:crypto
 * — edge/browser-safe. Returns false on length mismatch (length is not secret
 * for a fixed-width digest/HMAC). Adapted from packages/seo/src/deeplinks/share.ts:150-157.
 */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
