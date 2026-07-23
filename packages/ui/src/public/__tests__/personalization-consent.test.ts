import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  consentAllowsPersonalized,
  resolvePersonalizationConsent,
  readHenryCoConsentFromCookieString,
  buildHenryCoConsentState,
  HENRYCO_CONSENT_COOKIE_KEY,
  PERSONALIZATION_CONSENT_TEXT_VERSION,
} from "../consent-state";

describe("consentAllowsPersonalized", () => {
  it("is false by default and true only when personalizedExperience is set", () => {
    assert.equal(consentAllowsPersonalized(null), false);
    assert.equal(consentAllowsPersonalized(buildHenryCoConsentState({})), false);
    assert.equal(
      consentAllowsPersonalized(
        buildHenryCoConsentState({ personalizedExperience: true }),
      ),
      true,
    );
  });
});

describe("resolvePersonalizationConsent — account-authoritative opt-in", () => {
  it("account=true enables profiling", () => {
    assert.equal(resolvePersonalizationConsent({ accountValue: true }), true);
  });
  it("account=false (opt-out) suppresses", () => {
    assert.equal(resolvePersonalizationConsent({ accountValue: false }), false);
  });
  it("null/undefined (not-answered OR read-failed) resolves to false — never inherits a shared device cookie", () => {
    // This is the fail-safe: a transient account read failure yields null, and
    // a not-yet-answered signed-in user yields null; both must suppress profiling.
    assert.equal(resolvePersonalizationConsent({ accountValue: null }), false);
    assert.equal(resolvePersonalizationConsent({ accountValue: undefined }), false);
  });
});

describe("readHenryCoConsentFromCookieString (server-safe)", () => {
  it("parses the consent cookie from a raw header string", () => {
    const state = buildHenryCoConsentState({ personalizedExperience: true });
    const cookie = `${HENRYCO_CONSENT_COOKIE_KEY}=${encodeURIComponent(JSON.stringify(state))}; other=1`;
    const parsed = readHenryCoConsentFromCookieString(cookie);
    assert.equal(parsed?.personalizedExperience, true);
  });
  it("returns null for an absent/empty cookie", () => {
    assert.equal(readHenryCoConsentFromCookieString(""), null);
    assert.equal(readHenryCoConsentFromCookieString(null), null);
    assert.equal(readHenryCoConsentFromCookieString("unrelated=1"), null);
  });
});

describe("PERSONALIZATION_CONSENT_TEXT_VERSION", () => {
  it("is a non-empty pinned version string", () => {
    assert.equal(typeof PERSONALIZATION_CONSENT_TEXT_VERSION, "string");
    assert.ok(PERSONALIZATION_CONSENT_TEXT_VERSION.length > 0);
  });
});
