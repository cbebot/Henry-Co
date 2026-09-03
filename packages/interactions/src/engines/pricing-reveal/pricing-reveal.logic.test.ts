import { test } from "node:test";
import assert from "node:assert/strict";
import { breakdownPrice, annualSavingMinor } from "./pricing-reveal.logic";

test("fee breakdown: integer minor units, 7.5% of 10000 = 750", () => {
  const b = breakdownPrice(10000, 750); // 750 bps = 7.5%
  assert.equal(b.feeMinor, 750);
  assert.equal(b.totalMinor, 10000);
  assert.equal(b.netMinor, 9250);
  assert.ok(Number.isInteger(b.feeMinor));
});

test("fee rounding is half-even (banker's): .5 cases round to the even neighbour", () => {
  // 1% of 150 minor = 1.5 → rounds to 2? No: half-even → 2 is even, 1 is odd → 2.
  assert.equal(breakdownPrice(150, 100).feeMinor, 2);
  // 1% of 250 minor = 2.5 → half-even → 2 (even).
  assert.equal(breakdownPrice(250, 100).feeMinor, 2);
  // 1% of 350 minor = 3.5 → half-even → 4 (even).
  assert.equal(breakdownPrice(350, 100).feeMinor, 4);
});

test("net + fee always reconstitute the total exactly (no lost kobo)", () => {
  for (const total of [1, 99, 12345, 999999]) {
    for (const bps of [0, 250, 750, 1000]) {
      const b = breakdownPrice(total, bps);
      assert.equal(b.feeMinor + b.netMinor, b.totalMinor, `total=${total} bps=${bps}`);
    }
  }
});

test("zero fee rate → zero fee, full net", () => {
  const b = breakdownPrice(5000, 0);
  assert.equal(b.feeMinor, 0);
  assert.equal(b.netMinor, 5000);
});

test("annual saving = 12×monthly − annual, in minor units (never % alone)", () => {
  assert.equal(annualSavingMinor(1000, 10000), 2000);
  assert.equal(annualSavingMinor(1000, 12000), 0); // no saving → 0, never negative marketing
});

test("negative inputs are rejected (money is never negative here)", () => {
  assert.throws(() => breakdownPrice(-1, 750));
  assert.throws(() => breakdownPrice(100, -10));
});
