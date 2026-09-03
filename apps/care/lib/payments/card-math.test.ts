import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { careChargeMinor, CARE_CARD_MIN_KOBO, CARE_CARD_MAX_KOBO } from "./card-math";

describe("careChargeMinor — the ONE major→kobo conversion for the care card rail", () => {
  it("converts major naira to kobo exactly", () => {
    assert.equal(careChargeMinor(24_500, "NGN"), 2_450_000); // ₦24,500 booking balance
    assert.equal(careChargeMinor(100, "NGN"), 10_000);
  });
  it("refuses out-of-bounds and non-NGN amounts", () => {
    assert.equal(careChargeMinor(99, "NGN"), null);
    assert.equal(careChargeMinor(5_000_001, "NGN"), null);
    assert.equal(careChargeMinor(500, "USD"), null);
    assert.equal(careChargeMinor(Number.NaN, "NGN"), null);
  });
  it("bounds are the rail standard", () => {
    assert.equal(CARE_CARD_MIN_KOBO, 10_000);
    assert.equal(CARE_CARD_MAX_KOBO, 500_000_000);
  });
});
