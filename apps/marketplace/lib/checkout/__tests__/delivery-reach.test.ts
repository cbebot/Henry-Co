// V3-FREESHIP-02 — reach is EARNED: a seller can never promise wider than their
// verified tier permits. These pin the clamp (server RPC + checkout mirror it).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { statesInZone } from "@henryco/config";
import { resolveCoveredStates, tierCeiling, normalizeTier } from "../delivery-reach";

describe("tier ceiling", () => {
  it("maps tiers to their widest reach (unknown → bronze → own state)", () => {
    assert.equal(tierCeiling("bronze"), "own_state");
    assert.equal(tierCeiling("silver"), "own_zone");
    assert.equal(tierCeiling("gold"), "nationwide");
    assert.equal(tierCeiling(null), "own_state");
    assert.equal(tierCeiling("partner"), "own_state");
    assert.equal(normalizeTier("GOLD"), "gold");
  });
});

describe("resolveCoveredStates — clamped to the tier ceiling", () => {
  it("bronze asking nationwide is clamped to its own state", () => {
    const r = resolveCoveredStates({ reachKind: "nationwide", originState: "enugu", tier: "bronze" });
    assert.deepEqual(r.coveredStates, ["enugu"]);
    assert.equal(r.clampedTo, "own_state");
  });

  it("silver own_zone covers its geopolitical zone", () => {
    const r = resolveCoveredStates({ reachKind: "own_zone", originState: "enugu", tier: "silver" });
    assert.deepEqual(r.coveredStates.slice().sort(), statesInZone("south_east").slice().sort());
    assert.equal(r.clampedTo, "own_zone");
  });

  it("silver asking nationwide is clamped to its zone", () => {
    const r = resolveCoveredStates({ reachKind: "nationwide", originState: "enugu", tier: "silver" });
    assert.deepEqual(r.coveredStates.slice().sort(), statesInZone("south_east").slice().sort());
    assert.equal(r.clampedTo, "own_zone");
  });

  it("gold nationwide covers all 37", () => {
    const r = resolveCoveredStates({ reachKind: "nationwide", originState: "lagos", tier: "gold" });
    assert.equal(r.coveredStates.length, 37);
  });

  it("explicit states are clamped to the ceiling (out-of-ceiling states dropped)", () => {
    const r = resolveCoveredStates({
      reachKind: "states",
      originState: "enugu",
      explicitStates: ["enugu", "lagos"],
      tier: "bronze",
    });
    assert.deepEqual(r.coveredStates, ["enugu"]); // lagos is outside the own-state ceiling
    assert.equal(r.clampedTo, "states");
  });

  it("gold explicit subset is honored within nationwide", () => {
    const r = resolveCoveredStates({
      reachKind: "states",
      originState: "lagos",
      explicitStates: ["lagos", "enugu", "not-a-state"],
      tier: "gold",
    });
    assert.deepEqual(r.coveredStates.slice().sort(), ["enugu", "lagos"]); // invalid code dropped
  });

  it("an unrecognized origin yields no coverage (fail-closed)", () => {
    const r = resolveCoveredStates({ reachKind: "own_zone", originState: "amama", tier: "gold" });
    assert.deepEqual(r.coveredStates, []);
  });
});
