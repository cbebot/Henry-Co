import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { resolvePayerCurrency, parseChargeCurrencies } from "../currency-model";

describe("parseChargeCurrencies", () => {
  it("always includes NGN, even for empty/null input", () => {
    assert.deepEqual(parseChargeCurrencies(null), ["NGN"]);
    assert.deepEqual(parseChargeCurrencies(""), ["NGN"]);
    assert.deepEqual(parseChargeCurrencies("   "), ["NGN"]);
  });

  it("adds valid ISO codes, upper-cases, and dedupes", () => {
    const list = parseChargeCurrencies("usd, ngn ,GhS");
    assert.deepEqual(new Set(list), new Set(["NGN", "USD", "GHS"]));
  });

  it("ignores junk tokens", () => {
    assert.deepEqual(new Set(parseChargeCurrencies("USD,,12,dollars,€")), new Set(["NGN", "USD"]));
  });
});

describe("resolvePayerCurrency — resolution priority", () => {
  it("prefers the explicit user preference over locality", () => {
    const r = resolvePayerCurrency({
      userPreference: "USD",
      countryCode: "GB",
      division: "studio",
      chargeCurrencies: ["NGN", "USD"],
    });
    assert.equal(r.currency, "USD");
    assert.equal(r.source, "user");
  });

  it("falls back to the locality currency when no preference is set", () => {
    const r = resolvePayerCurrency({ countryCode: "GB", division: "studio" });
    assert.equal(r.currency, "GBP");
    assert.equal(r.source, "locality");
  });

  it("falls back to NGN when neither preference nor country is known", () => {
    const r = resolvePayerCurrency({ division: "studio" });
    assert.equal(r.currency, "NGN");
    assert.equal(r.source, "default");
  });

  it("treats an invalid preference/country as absent (degrades to NGN)", () => {
    const r = resolvePayerCurrency({ userPreference: "dollars", countryCode: "??", division: "studio" });
    assert.equal(r.currency, "NGN");
    assert.equal(r.source, "default");
  });
});

describe("resolvePayerCurrency — chargeability (the CHARGE_CURRENCIES interlock)", () => {
  it("NGN is always chargeable", () => {
    const r = resolvePayerCurrency({ userPreference: "NGN", division: "studio" });
    assert.equal(r.chargeable, true);
  });

  it("a non-NGN currency is display-only until it is in the allowlist", () => {
    const off = resolvePayerCurrency({ userPreference: "USD", division: "studio", chargeCurrencies: ["NGN"] });
    assert.equal(off.currency, "USD");
    assert.equal(off.chargeable, false, "not chargeable — shows approximate, charges NGN");

    const on = resolvePayerCurrency({ userPreference: "USD", division: "studio", chargeCurrencies: ["NGN", "USD"] });
    assert.equal(on.chargeable, true, "allowlisted + studio settles ngn_only → chargeable");
  });

  it("a deferred division cannot charge a non-NGN currency even if allowlisted", () => {
    // 'hotel' is 'deferred' in the division settlement map.
    const r = resolvePayerCurrency({ userPreference: "USD", division: "hotel", chargeCurrencies: ["NGN", "USD"] });
    assert.equal(r.currency, "USD");
    assert.equal(r.chargeable, false, "division does not settle yet → display-only");
  });

  it("locality currency for a live-settling division follows the same allowlist gate", () => {
    const gated = resolvePayerCurrency({ countryCode: "US", division: "care", chargeCurrencies: ["NGN"] });
    assert.equal(gated.currency, "USD");
    assert.equal(gated.chargeable, false);

    const allowed = resolvePayerCurrency({ countryCode: "US", division: "care", chargeCurrencies: ["NGN", "USD"] });
    assert.equal(allowed.chargeable, true);
  });

  it("defaults to NGN-only chargeability when no allowlist is passed", () => {
    const r = resolvePayerCurrency({ userPreference: "USD", division: "studio" });
    assert.equal(r.chargeable, false, "no allowlist → only NGN charges");
  });
});
