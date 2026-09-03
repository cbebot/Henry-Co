/**
 * Provably-fair commit-reveal engine (ARCHITECTURE.md §6).
 *
 * Protocol (for any game that uses randomness — Onyx Cards; NOT Onyx Lines):
 *  1. COMMIT  (match creation): server mints serverSeed = randomSeedHex() and
 *     publishes commitment = sha256(serverSeed) BEFORE any move. The server
 *     commits before it knows the players' seeds, so it cannot grind a seed.
 *  2. CONTRIBUTE: each player contributes a clientSeed (recorded). The players'
 *     seeds enter AFTER the commitment, so they cannot grind either.
 *  3. DERIVE: drawSeed = HMAC-SHA256(serverSeed, clientSeedA | clientSeedB).
 *     Every game expands this single seed deterministically (see prng.ts). The
 *     randomness is SYMMETRIC — both players face the same prize order.
 *  4. REVEAL (match end): server reveals serverSeed. Anyone checks
 *     sha256(revealedSeed) === commitment and recomputes drawSeed + the order —
 *     proving the server neither rigged nor changed the seed mid-match.
 *
 * All functions are PURE + client-safe (Web Crypto only). The same code runs on
 * the server (authority) and in the browser/third-party (verifier).
 *
 * NOTE on key material: the serverSeed hex STRING is used directly as the HMAC
 * key (UTF-8). The verifier uses the same function, so derivation is internally
 * consistent and reproducible from the published hex.
 */

import { hmacSha256, sha256, timingSafeEqualHex } from "./web-crypto";

/** Canonical, order-stable concatenation of the per-seat client seeds. */
export function combineClientSeeds(clientSeeds: readonly string[]): string {
  // seat order is authoritative; "|" is not a hex char so it cannot collide.
  return clientSeeds.join("|");
}

/** COMMIT: the public commitment for a freshly minted server seed. */
export async function commitSeed(serverSeedHex: string): Promise<string> {
  return sha256(serverSeedHex);
}

/** DERIVE: the single draw seed both sides expand. Symmetric + verifiable. */
export async function deriveDrawSeed(
  serverSeedHex: string,
  clientSeeds: readonly string[],
): Promise<string> {
  return hmacSha256(serverSeedHex, combineClientSeeds(clientSeeds));
}

/** REVEAL check: does the revealed server seed hash to the published commitment? */
export async function verifyReveal(
  commitment: string,
  revealedServerSeedHex: string,
): Promise<boolean> {
  const recomputed = await sha256(revealedServerSeedHex);
  return timingSafeEqualHex(recomputed, commitment);
}

/**
 * Full fairness verification for a completed RNG match: the revealed seed must
 * match the commitment AND re-deriving the draw seed from (revealed seed +
 * recorded client seeds) must equal the draw seed the match actually used.
 */
export async function verifyMatchFairness(input: {
  commitment: string;
  revealedServerSeedHex: string;
  clientSeeds: readonly string[];
  expectedDrawSeed: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const revealOk = await verifyReveal(input.commitment, input.revealedServerSeedHex);
  if (!revealOk) return { ok: false, reason: "commitment_mismatch" };
  const drawSeed = await deriveDrawSeed(input.revealedServerSeedHex, input.clientSeeds);
  if (!timingSafeEqualHex(drawSeed, input.expectedDrawSeed)) {
    return { ok: false, reason: "draw_seed_mismatch" };
  }
  return { ok: true };
}
