import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatVendorMoney } from "./money";

describe("formatVendorMoney — the single vendor money-display seam", () => {
  it("formats kobo as naira with grouping and 2 decimals", () => {
    const formatted = formatVendorMoney(4_515_000, "en");
    assert.match(formatted, /45,150\.00/);
    assert.match(formatted, /₦/);
  });
  it("never emits fractional-kobo artifacts", () => {
    assert.match(formatVendorMoney(2_554, "en"), /25\.54/);
  });
  it("treats non-finite input as zero", () => {
    assert.match(formatVendorMoney(Number.NaN, "en"), /0\.00/);
  });
});
