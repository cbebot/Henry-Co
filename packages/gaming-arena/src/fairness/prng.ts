/**
 * Deterministic, SYNCHRONOUS PRNG for expanding a single derived draw seed into
 * game randomness (e.g. a prize-order permutation).
 *
 * Why sync: the unpredictable, verifiable entropy comes from the async
 * commit-reveal HMAC (`deriveDrawSeed`); a game's `initialState` is PURE and
 * SYNC, so it expands that one seed value with this deterministic generator.
 * The verifier recomputes the same `drawSeed` after reveal and runs the same
 * generator, reproducing the exact permutation — provably fair end-to-end.
 *
 * `mulberry32` is a well-known, tiny, deterministic 32-bit generator. It is NOT
 * cryptographically secure and must never be used for the seed itself — only to
 * deterministically expand an already-committed, already-verifiable seed.
 */

/** Seed a mulberry32 generator, folding the FULL hex seed into the 32-bit state. */
export function makePrng(seedHex: string): () => number {
  // Fold every 8-hex-char (32-bit) chunk via an FNV-1a-style ROLLING hash so all
  // 256 bits of an HMAC draw seed contribute (not just the first 32) AND repeated
  // chunks don't cancel (a plain XOR fold collapses "ABAB…" patterns to 0).
  let a = 0x811c9dc5;
  for (let i = 0; i < seedHex.length; i += 8) {
    const chunk = parseInt(seedHex.slice(i, i + 8) || "0", 16);
    if (Number.isFinite(chunk)) {
      a = (a ^ (chunk >>> 0)) >>> 0;
      a = Math.imul(a, 0x01000193) >>> 0;
    }
  }
  if (a === 0) a = 0x9e3779b9;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic, unbiased Fisher-Yates over a copy of `items`, driven by `prng`. */
export function shuffleWithPrng<T>(items: readonly T[], prng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i >= 1; i -= 1) {
    const j = Math.floor(prng() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}
