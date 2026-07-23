/**
 * SA-2 — content-addressed artifact hashing. PURE. SAFETY-MODEL §5: "what was
 * reviewed is what deploys." The report pins a `contentHash` of the exact
 * bundle; the deploy step re-hashes the stored bundle and refuses to flip the
 * live pointer unless the two match byte-for-byte. A post-approval swap is
 * therefore impossible — the hash IS the approval's identity.
 *
 * Canonicalization (stable key order) makes the hash independent of JSON key
 * ordering, so a semantically-identical bundle always hashes identically and a
 * one-byte tamper always diverges.
 */

import crypto from "node:crypto";

/** Deterministic JSON: object keys sorted recursively, arrays preserved. */
export function canonicalizeJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortValue((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

/** sha256 hex of the canonical form of a bundle object. */
export function hashBundle(bundle: unknown): string {
  return crypto.createHash("sha256").update(canonicalizeJson(bundle)).digest("hex");
}

/**
 * Deploy-gate assertion: the recorded (approved) hash must equal the hash of
 * the bundle about to go live. Timing-safe compare. Returns false on any
 * malformed input rather than throwing — the caller aborts the deploy.
 */
export function verifyArtifactHash(recordedHash: string, bundle: unknown): boolean {
  const expected = String(recordedHash ?? "").trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(expected)) return false;
  const actual = hashBundle(bundle);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(actual, "hex"));
  } catch {
    return false;
  }
}
