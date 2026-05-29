import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { providerPreferenceForCountry } from "../routing/country-defaults";

describe("country defaults", () => {
  it("Nigeria prefers paystack then flutterwave", () => {
    assert.deepEqual(providerPreferenceForCountry("NG"), ["paystack", "flutterwave"]);
  });

  it("US / GB / CA prefer stripe", () => {
    for (const c of ["US", "GB", "CA"]) {
      assert.deepEqual(providerPreferenceForCountry(c), ["stripe"]);
    }
  });

  it("an EU member (DE, FR) prefers stripe", () => {
    assert.deepEqual(providerPreferenceForCountry("DE"), ["stripe"]);
    assert.deepEqual(providerPreferenceForCountry("FR"), ["stripe"]);
  });

  it("is case-insensitive on the country code", () => {
    assert.deepEqual(providerPreferenceForCountry("ng"), ["paystack", "flutterwave"]);
  });

  it("returns a fresh array each call (callers may mutate)", () => {
    const a = providerPreferenceForCountry("NG");
    a.push("mock");
    assert.deepEqual(providerPreferenceForCountry("NG"), ["paystack", "flutterwave"]);
  });

  it("unknown country yields an empty preference (router -> no_suitable_provider)", () => {
    assert.deepEqual(providerPreferenceForCountry("ZZ"), []);
  });
});
