import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  computeJobEnvelopeKobo,
  isEnvelopeBreached,
  remainingEnvelopeKobo,
  accrueCost,
  ENVELOPE_FLOOR_KOBO,
  ENVELOPE_CEILING_KOBO,
  DEFAULT_ENVELOPE_RULES,
} from "@/lib/agency/envelope";

describe("cost envelope — 20% of package price, clamped", () => {
  it("sizes at 20% of the package price (major naira → kobo)", () => {
    // ₦200,000 package → 20% = ₦40,000 = 4,000,000 kobo (within floor/ceiling).
    assert.equal(computeJobEnvelopeKobo(200_000), 4_000_000);
  });

  it("clamps to the ₦10,000 floor for tiny packages", () => {
    // ₦10,000 package → 20% = ₦2,000 = 200,000 kobo → clamps up to the floor.
    assert.equal(computeJobEnvelopeKobo(10_000), ENVELOPE_FLOOR_KOBO);
  });

  it("clamps to the ₦100,000 ceiling for large packages", () => {
    // ₦5,000,000 package → 20% = ₦1,000,000 = 100,000,000 kobo → clamps to ceiling.
    assert.equal(computeJobEnvelopeKobo(5_000_000), ENVELOPE_CEILING_KOBO);
  });

  it("falls back to the floor for a non-positive/garbage price", () => {
    assert.equal(computeJobEnvelopeKobo(0), ENVELOPE_FLOOR_KOBO);
    assert.equal(computeJobEnvelopeKobo(-5), ENVELOPE_FLOOR_KOBO);
    assert.equal(computeJobEnvelopeKobo(Number.NaN), ENVELOPE_FLOOR_KOBO);
  });

  it("honours a tuned rule book", () => {
    // 50% fraction, higher ceiling.
    const kobo = computeJobEnvelopeKobo(100_000, { fraction: 0.5, floorKobo: 1_000_000, ceilingKobo: 20_000_000 });
    assert.equal(kobo, 5_000_000);
  });
});

describe("envelope breach — enforced outside the model", () => {
  it("breaches when accrued cost reaches or exceeds the budget", () => {
    assert.equal(isEnvelopeBreached({ budgetKobo: 4_000_000, costKobo: 3_999_999 }), false);
    assert.equal(isEnvelopeBreached({ budgetKobo: 4_000_000, costKobo: 4_000_000 }), true);
    assert.equal(isEnvelopeBreached({ budgetKobo: 4_000_000, costKobo: 4_500_000 }), true);
  });

  it("remaining is never negative", () => {
    assert.equal(remainingEnvelopeKobo({ budgetKobo: 4_000_000, costKobo: 1_000_000 }), 3_000_000);
    assert.equal(remainingEnvelopeKobo({ budgetKobo: 4_000_000, costKobo: 9_000_000 }), 0);
  });

  it("a runaway cost trips the breach flag on accrual", () => {
    const state = { budgetKobo: 4_000_000, costKobo: 3_900_000 };
    const after = accrueCost(state, 200_000);
    assert.equal(after.costKobo, 4_100_000);
    assert.equal(after.breached, true);
  });

  it("a corrupt negative delta never reduces accrued cost", () => {
    const after = accrueCost({ budgetKobo: 4_000_000, costKobo: 1_000_000 }, -999_999);
    assert.equal(after.costKobo, 1_000_000);
  });

  it("default rules mirror the seeded rate-card knobs", () => {
    assert.equal(DEFAULT_ENVELOPE_RULES.fraction, 0.2);
    assert.equal(DEFAULT_ENVELOPE_RULES.floorKobo, 1_000_000);
    assert.equal(DEFAULT_ENVELOPE_RULES.ceilingKobo, 10_000_000);
  });
});
