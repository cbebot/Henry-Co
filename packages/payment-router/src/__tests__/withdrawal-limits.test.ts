import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateWithdrawal,
  DEFAULT_WITHDRAWAL_LIMITS,
  type WithdrawalLimitTable,
} from "../withdrawal-limits";

// The owner-approved policy: no cash-out for an unverified account; a verified account gets
// ₦100 min / ₦5,000,000 single / ₦10,000,000 daily (kobo). Per-currency + per-tier, fail-closed.
describe("evaluateWithdrawal — tiered, per-currency payout limits", () => {
  const verified = (amountMinor: number, windowWithdrawnMinor = 0) =>
    evaluateWithdrawal({ amountMinor, currency: "NGN", kycTier: "verified", windowWithdrawnMinor });

  it("allows a normal verified NGN withdrawal within all limits", () => {
    const d = verified(200_000_00); // ₦200,000
    assert.equal(d.ok, true);
    if (d.ok) assert.equal(d.limit.maxSingleMinor, 500_000_000);
  });

  it("NEVER cashes out an unverified account (fail-closed — KYC first)", () => {
    const d = evaluateWithdrawal({ amountMinor: 50_000, currency: "NGN", kycTier: "unverified", windowWithdrawnMinor: 0 });
    assert.equal(d.ok, false);
    assert.equal(d.ok === false && d.reason, "kyc_required");
  });

  it("rejects a currency with no limit table (fail-closed) — NGN-only today", () => {
    const d = evaluateWithdrawal({ amountMinor: 10_000, currency: "USD", kycTier: "verified", windowWithdrawnMinor: 0 });
    assert.equal(d.ok, false);
    assert.equal(d.ok === false && d.reason, "currency_unsupported");
  });

  it("enforces the ₦100 floor", () => {
    const low = verified(9_999); // ₦99.99
    assert.equal(low.ok, false);
    assert.equal(low.ok === false && low.reason, "below_min");
    assert.equal(verified(10_000).ok, true); // exactly ₦100
  });

  it("enforces the ₦5,000,000 single ceiling (boundary inclusive)", () => {
    assert.equal(verified(500_000_000).ok, true); // exactly ₦5,000,000
    const over = verified(500_000_001);
    assert.equal(over.ok, false);
    assert.equal(over.ok === false && over.reason, "above_max_single");
  });

  it("enforces the ₦10,000,000 rolling daily cap (pending + paid both count)", () => {
    // Already withdrawn ₦9,000,000 today; a ₦2,000,000 more would exceed ₦10,000,000.
    const d = verified(200_000_000, 900_000_000);
    assert.equal(d.ok, false);
    assert.equal(d.ok === false && d.reason, "daily_cap_exceeded");
    // But ₦1,000,000 more lands exactly on the cap and is allowed.
    assert.equal(verified(100_000_000, 900_000_000).ok, true);
  });

  it("a fractional/unsafe amount is rejected below-min, never coerced", () => {
    assert.equal(verified(Number.NaN).ok, false);
    assert.equal(evaluateWithdrawal({ amountMinor: 10_000.5, currency: "NGN", kycTier: "verified", windowWithdrawnMinor: 0 }).ok, true); // trunc → 10000, at the floor
  });

  it("honours an injected custom limit table (configurable, no code change to the evaluator)", () => {
    const strict: WithdrawalLimitTable = {
      NGN: { verified: { minMinor: 10_000, maxSingleMinor: 100_000_000, dailyCapMinor: 200_000_000 } },
    };
    const d = evaluateWithdrawal({ amountMinor: 200_000_000, currency: "NGN", kycTier: "verified", windowWithdrawnMinor: 0 }, strict);
    assert.equal(d.ok, false);
    assert.equal(d.ok === false && d.reason, "above_max_single");
  });

  it("the shipped defaults match the approved NGN policy", () => {
    const l = DEFAULT_WITHDRAWAL_LIMITS.NGN?.verified;
    assert.deepEqual(l, { minMinor: 10_000, maxSingleMinor: 500_000_000, dailyCapMinor: 1_000_000_000 });
    assert.equal(DEFAULT_WITHDRAWAL_LIMITS.NGN?.unverified, undefined); // unverified has no cash-out
  });
});
