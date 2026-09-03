import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { studioChargeMinor, STUDIO_CARD_MIN_KOBO, STUDIO_CARD_MAX_KOBO } from "./card-math";

describe("studioChargeMinor — the ONE major→kobo conversion for the studio card rail", () => {
  it("converts major naira to kobo exactly", () => {
    assert.equal(studioChargeMinor(450_000, "NGN"), 45_000_000); // ₦450,000 deposit
    assert.equal(studioChargeMinor(100, "NGN"), 10_000); // floor: ₦100
  });
  it("refuses out-of-bounds and non-NGN amounts", () => {
    assert.equal(studioChargeMinor(99, "NGN"), null); // below ₦100
    assert.equal(studioChargeMinor(5_000_001, "NGN"), null); // above ₦5,000,000
    assert.equal(studioChargeMinor(1_000, "USD"), null);
    assert.equal(studioChargeMinor(Number.NaN, "NGN"), null);
    assert.equal(studioChargeMinor(-5, "NGN"), null);
  });
  it("bounds are the documented ceiling for big-ticket studio deposits", () => {
    assert.equal(STUDIO_CARD_MIN_KOBO, 10_000);
    assert.equal(STUDIO_CARD_MAX_KOBO, 500_000_000);
  });
});
