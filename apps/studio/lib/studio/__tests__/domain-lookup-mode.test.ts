import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveDomainLookupMode } from "@/lib/studio/domain-lookup-mode";

describe("resolveDomainLookupMode — the gate that hides the dead lookup", () => {
  it("is OFF when the flag is unset — today's state in every environment", () => {
    assert.equal(resolveDomainLookupMode(undefined), "off");
    assert.equal(resolveDomainLookupMode(null), "off");
    assert.equal(resolveDomainLookupMode(""), "off");
  });

  it("is OFF for anything that is not an explicit enable", () => {
    assert.equal(resolveDomainLookupMode("0"), "off");
    assert.equal(resolveDomainLookupMode("false"), "off");
    assert.equal(resolveDomainLookupMode("no"), "off");
    assert.equal(resolveDomainLookupMode("enabled"), "off");
  });

  it("lights up only on the documented truthy values, any casing", () => {
    assert.equal(resolveDomainLookupMode("1"), "rdap_com");
    assert.equal(resolveDomainLookupMode("true"), "rdap_com");
    assert.equal(resolveDomainLookupMode("yes"), "rdap_com");
    assert.equal(resolveDomainLookupMode("TRUE"), "rdap_com");
    assert.equal(resolveDomainLookupMode(" Yes "), "rdap_com");
  });
});
