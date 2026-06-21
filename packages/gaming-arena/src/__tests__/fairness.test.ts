import test from "node:test";
import assert from "node:assert/strict";

import {
  sha256,
  hmacSha256,
  randomSeedHex,
  randomBytes32,
  timingSafeEqualHex,
  stableStringify,
} from "../fairness/web-crypto";
import {
  commitSeed,
  combineClientSeeds,
  deriveDrawSeed,
  verifyReveal,
  verifyMatchFairness,
} from "../fairness/commit-reveal";
import { makePrng, shuffleWithPrng } from "../fairness/prng";

test("sha256 produces the known NIST vector for the empty string", async () => {
  assert.equal(
    await sha256(""),
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  );
});

test("hmacSha256 matches the RFC 4231 test case 1", async () => {
  // key = 20 bytes of 0x0b, data = "Hi There"
  const key = new Uint8Array(20).fill(0x0b);
  assert.equal(
    await hmacSha256(key, "Hi There"),
    "b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7",
  );
});

test("randomSeedHex is 64 hex chars and non-repeating", () => {
  const a = randomSeedHex();
  const b = randomSeedHex();
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.notEqual(a, b);
  assert.equal(randomBytes32().length, 32);
});

test("timingSafeEqualHex: equal true, differing/length-mismatch false", () => {
  assert.equal(timingSafeEqualHex("abc123", "abc123"), true);
  assert.equal(timingSafeEqualHex("abc123", "abc124"), false);
  assert.equal(timingSafeEqualHex("abc", "abcd"), false);
});

test("commit-reveal: a valid reveal verifies; a tampered seed does NOT", async () => {
  const serverSeed = randomSeedHex();
  const commitment = await commitSeed(serverSeed);
  assert.equal(await verifyReveal(commitment, serverSeed), true);

  // flip one nibble of the revealed seed -> commitment must fail
  const tampered = (serverSeed[0] === "0" ? "1" : "0") + serverSeed.slice(1);
  assert.equal(await verifyReveal(commitment, tampered), false);
});

test("deriveDrawSeed is deterministic, symmetric, and seed-sensitive", async () => {
  const server = randomSeedHex();
  const clients = ["alice-seed", "bob-seed"];
  const d1 = await deriveDrawSeed(server, clients);
  const d2 = await deriveDrawSeed(server, clients);
  assert.equal(d1, d2, "same inputs -> same draw seed");

  // a different server seed -> different draw
  const other = await deriveDrawSeed(randomSeedHex(), clients);
  assert.notEqual(d1, other);

  // client seed order is part of the canonical input (seat order is authoritative)
  const swapped = await deriveDrawSeed(server, ["bob-seed", "alice-seed"]);
  assert.notEqual(d1, swapped);
  assert.equal(combineClientSeeds(clients), "alice-seed|bob-seed");
});

test("verifyMatchFairness: full happy path + both tamper modes", async () => {
  const server = randomSeedHex();
  const clients = ["a", "b"];
  const commitment = await commitSeed(server);
  const drawSeed = await deriveDrawSeed(server, clients);

  const ok = await verifyMatchFairness({
    commitment,
    revealedServerSeedHex: server,
    clientSeeds: clients,
    expectedDrawSeed: drawSeed,
  });
  assert.deepEqual(ok, { ok: true });

  // wrong revealed seed -> commitment_mismatch
  const bad1 = await verifyMatchFairness({
    commitment,
    revealedServerSeedHex: randomSeedHex(),
    clientSeeds: clients,
    expectedDrawSeed: drawSeed,
  });
  assert.equal(bad1.ok, false);
  assert.equal(bad1.reason, "commitment_mismatch");

  // right seed but lied-about draw seed -> draw_seed_mismatch
  const bad2 = await verifyMatchFairness({
    commitment,
    revealedServerSeedHex: server,
    clientSeeds: clients,
    expectedDrawSeed: "deadbeef",
  });
  assert.equal(bad2.ok, false);
  assert.equal(bad2.reason, "draw_seed_mismatch");
});

test("prng: same seed -> same shuffle; different seed -> different (usually)", () => {
  const items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const s1 = shuffleWithPrng(items, makePrng("a".repeat(64)));
  const s2 = shuffleWithPrng(items, makePrng("a".repeat(64)));
  assert.deepEqual(s1, s2, "deterministic");
  // permutation preserves the multiset
  assert.deepEqual([...s1].sort((x, y) => x - y), items);
  const s3 = shuffleWithPrng(items, makePrng("b".repeat(64)));
  assert.notDeepEqual(s1, s3);
});

test("stableStringify is key-order independent but value-sensitive", () => {
  assert.equal(stableStringify({ a: 1, b: 2 }), stableStringify({ b: 2, a: 1 }));
  assert.notEqual(stableStringify({ a: 1 }), stableStringify({ a: 2 }));
  assert.equal(stableStringify([3, { z: 1, a: 2 }]), '[3,{"a":2,"z":1}]');
});
