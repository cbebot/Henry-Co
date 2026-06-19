// ---------------------------------------------------------------------------
// deterministic/image-hash.ts — perceptual-hash check vs a known-bad list
//
// Image BYTES are not decoded here (this package only ever receives refs). The
// caller computes perceptual hashes out-of-band and supplies the known-bad set
// — the CSAM authority list (e.g. NCMEC/IWF) plus internal banned-image hashes.
// A match is an UNAMBIGUOUS reject. Exact match by default; an optional Hamming
// tolerance handles near-duplicate perceptual hashes without false positives.
// ---------------------------------------------------------------------------

import type { DetectorVerdict, ImageHashInput, ModerationReason } from "../types";

/** Hamming distance between two equal-length hex strings (bit differences). */
export function hammingDistanceHex(a: string, b: string): number {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    // Parse each nibble first: bitwise ops coerce NaN -> 0, so a post-xor NaN
    // check never fires — non-hex input must be rejected BEFORE the xor.
    const av = parseInt(a[i], 16);
    const bv = parseInt(b[i], 16);
    if (Number.isNaN(av) || Number.isNaN(bv)) return Number.POSITIVE_INFINITY;
    dist += BIT_COUNT[(av ^ bv) & 0xf];
    if (dist > 64) return dist; // early-out; nothing matches past a nibble cap
  }
  return dist;
}

const BIT_COUNT = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];

/**
 * Check a set of image hashes against the known-bad set.
 * Pure + deterministic. `maxHammingDistance` of 0 (default) = exact match.
 */
export function checkImageHashes(
  input: ImageHashInput,
  opts: { maxHammingDistance?: number } = {},
): DetectorVerdict {
  const tolerance = Math.max(0, opts.maxHammingDistance ?? 0);
  const matched: string[] = [];

  for (const hash of input.hashes) {
    const norm = (hash || "").trim().toLowerCase();
    if (!norm) continue;
    if (input.knownBad.has(norm)) {
      matched.push(norm);
      continue;
    }
    if (tolerance > 0) {
      for (const bad of input.knownBad) {
        if (hammingDistanceHex(norm, bad) <= tolerance) {
          matched.push(norm);
          break;
        }
      }
    }
  }

  if (matched.length === 0) {
    return { decision: "approve", reasons: [], severity: "low", unambiguous: false, detail: [] };
  }

  const reasons: ModerationReason[] = ["image_hash_match"];
  return {
    decision: "reject",
    reasons,
    severity: "critical",
    unambiguous: true,
    // Count only — never echo the matched hash value back into telemetry/snapshots.
    detail: [`${matched.length}_match`],
  };
}
