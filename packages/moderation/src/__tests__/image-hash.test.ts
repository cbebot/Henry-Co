import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkImageHashes, hammingDistanceHex } from "../deterministic/image-hash";

describe("hammingDistanceHex", () => {
  it("is 0 for identical hashes", () => {
    assert.equal(hammingDistanceHex("ffff", "ffff"), 0);
  });
  it("counts single-bit differences", () => {
    assert.equal(hammingDistanceHex("0", "1"), 1);
    assert.equal(hammingDistanceHex("0", "f"), 4);
  });
  it("is infinity for unequal lengths", () => {
    assert.equal(hammingDistanceHex("ff", "f"), Number.POSITIVE_INFINITY);
  });
  it("is infinity for non-hex input", () => {
    assert.equal(hammingDistanceHex("zz", "ff"), Number.POSITIVE_INFINITY);
  });
});

describe("checkImageHashes — exact match (reject)", () => {
  const knownBad = new Set(["abc123", "deadbeef"]);
  it("rejects an exact known-bad hash", () => {
    const v = checkImageHashes({ hashes: ["abc123"], knownBad });
    assert.equal(v.decision, "reject");
    assert.equal(v.unambiguous, true);
    assert.deepEqual(v.reasons, ["image_hash_match"]);
  });
  it("rejects when one of several matches", () => {
    assert.equal(checkImageHashes({ hashes: ["safe1", "deadbeef"], knownBad }).decision, "reject");
  });
  it("is case-insensitive / trims", () => {
    assert.equal(checkImageHashes({ hashes: [" ABC123 "], knownBad }).decision, "reject");
  });
  it("never echoes the matched hash in detail", () => {
    const v = checkImageHashes({ hashes: ["abc123"], knownBad });
    assert.ok(!v.detail?.some((d) => d.includes("abc123")));
  });
});

describe("checkImageHashes — no match (approve)", () => {
  const knownBad = new Set(["abc123"]);
  it("approves clean hashes", () => {
    assert.equal(checkImageHashes({ hashes: ["safe1", "safe2"], knownBad }).decision, "approve");
  });
  it("approves empty hash list", () => {
    assert.equal(checkImageHashes({ hashes: [], knownBad }).decision, "approve");
  });
  it("approves empty known-bad set", () => {
    assert.equal(checkImageHashes({ hashes: ["abc123"], knownBad: new Set() }).decision, "approve");
  });
});

describe("checkImageHashes — fuzzy (perceptual) match", () => {
  const knownBad = new Set(["ffffffffffffffff"]);
  it("does NOT match a near-duplicate at tolerance 0", () => {
    const v = checkImageHashes({ hashes: ["fffffffffffffffe"], knownBad });
    assert.equal(v.decision, "approve");
  });
  it("matches a near-duplicate within tolerance", () => {
    const v = checkImageHashes({ hashes: ["fffffffffffffffe"], knownBad }, { maxHammingDistance: 2 });
    assert.equal(v.decision, "reject");
  });
  it("does not match a far hash even with tolerance", () => {
    const v = checkImageHashes({ hashes: ["0000000000000000"], knownBad }, { maxHammingDistance: 2 });
    assert.equal(v.decision, "approve");
  });
});
