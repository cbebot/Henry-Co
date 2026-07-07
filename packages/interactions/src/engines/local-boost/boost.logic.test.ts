import { test } from "node:test";
import assert from "node:assert/strict";
import { projectBoost } from "./boost.logic";

const baseline = { cpmMinor: 50_000, ctr: 0.02 }; // ₦500.00 per 1000 impressions, 2% CTR

test("impressions scale linearly with bid", () => {
  const small = projectBoost(50_000, "en-NG", baseline);
  const large = projectBoost(100_000, "en-NG", baseline);
  assert.equal(small.impressions, 1000);
  assert.equal(large.impressions, 2000);
});

test("clicks = round(impressions × ctr)", () => {
  const p = projectBoost(50_000, "en-NG", baseline);
  assert.equal(p.clicks, 20);
});

test("zero bid → zero projection (no invented reach)", () => {
  const p = projectBoost(0, "en-NG", baseline);
  assert.equal(p.impressions, 0);
  assert.equal(p.clicks, 0);
});

test("degenerate baseline (zero cpm) → zero projection, no division blow-up", () => {
  const p = projectBoost(50_000, "en-NG", { cpmMinor: 0, ctr: 0.02 });
  assert.equal(p.impressions, 0);
  assert.equal(p.clicks, 0);
});
