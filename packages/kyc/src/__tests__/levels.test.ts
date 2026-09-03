import { test } from "node:test";
import assert from "node:assert/strict";

import { meetsLevel, maxLevel, isVerificationLevel, VERIFICATION_LEVELS } from "../levels";

test("meetsLevel is a total order L0 < L1 < L2 < L3 < L4", () => {
  assert.equal(meetsLevel("L3", "L0"), true);
  assert.equal(meetsLevel("L3", "L3"), true);
  assert.equal(meetsLevel("L3", "L4"), false);
  assert.equal(meetsLevel("L0", "L1"), false);
  assert.equal(meetsLevel("L4", "L4"), true);
});

test("maxLevel returns the higher of two levels", () => {
  assert.equal(maxLevel("L1", "L3"), "L3");
  assert.equal(maxLevel("L4", "L2"), "L4");
  assert.equal(maxLevel("L0", "L0"), "L0");
});

test("isVerificationLevel guards unknown input", () => {
  assert.equal(isVerificationLevel("L2"), true);
  assert.equal(isVerificationLevel("L9"), false);
  assert.equal(isVerificationLevel(null), false);
  assert.equal(isVerificationLevel(3), false);
});

test("VERIFICATION_LEVELS lists all five in order", () => {
  assert.deepEqual([...VERIFICATION_LEVELS], ["L0", "L1", "L2", "L3", "L4"]);
});
