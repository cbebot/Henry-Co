import { test } from "node:test";
import assert from "node:assert/strict";

import {
  evaluateSignIn,
  GRACE_WINDOW_MS,
  type SignInContext,
} from "./sign-in-evaluation";

function ctx(over: Partial<SignInContext> = {}): SignInContext {
  return {
    deviceIsKnown: true,
    knownActiveDeviceCount: 2,
    earliestKnownDeviceAgeMs: GRACE_WINDOW_MS + 1, // past grace by default
    currentCountry: "NG",
    priorCountries: ["NG"],
    ...over,
  };
}

test("brand-new account (no known devices) is grandfathered, never alerts", () => {
  const d = evaluateSignIn(
    ctx({ deviceIsKnown: false, knownActiveDeviceCount: 0, earliestKnownDeviceAgeMs: null, priorCountries: [] }),
  );
  assert.equal(d.alert, false);
  assert.equal(d.grandfathered, true);
  assert.equal(d.reason, "grandfathered");
});

test("established account + genuinely new device → ALERT (new_device)", () => {
  const d = evaluateSignIn(ctx({ deviceIsKnown: false }));
  assert.equal(d.alert, true);
  assert.equal(d.isNewDevice, true);
  assert.equal(d.reason, "new_device");
});

test("established account + known device + new country → ALERT (new_country)", () => {
  const d = evaluateSignIn(ctx({ deviceIsKnown: true, currentCountry: "GB", priorCountries: ["NG"] }));
  assert.equal(d.alert, true);
  assert.equal(d.isNewCountry, true);
  assert.equal(d.isNewDevice, false);
  assert.equal(d.reason, "new_country");
});

test("new device AND new country → ALERT (new_device_and_country)", () => {
  const d = evaluateSignIn(ctx({ deviceIsKnown: false, currentCountry: "GB", priorCountries: ["NG"] }));
  assert.equal(d.alert, true);
  assert.equal(d.reason, "new_device_and_country");
});

test("known device + known country → silent (no alert, no grandfather)", () => {
  const d = evaluateSignIn(ctx({ deviceIsKnown: true, currentCountry: "NG", priorCountries: ["NG", "GB"] }));
  assert.equal(d.alert, false);
  assert.equal(d.grandfathered, false);
  assert.equal(d.reason, "known");
});

test("ROLLOUT: a new device within the grace window is grandfathered, not alerted", () => {
  const d = evaluateSignIn(
    ctx({ deviceIsKnown: false, knownActiveDeviceCount: 1, earliestKnownDeviceAgeMs: GRACE_WINDOW_MS - 1 }),
  );
  assert.equal(d.alert, false);
  assert.equal(d.grandfathered, true);
  assert.equal(d.isNewDevice, true);
});

test("first country ever (no prior country history) is NOT a new country", () => {
  const d = evaluateSignIn(ctx({ deviceIsKnown: true, currentCountry: "NG", priorCountries: [] }));
  assert.equal(d.isNewCountry, false);
  assert.equal(d.alert, false);
});

test("unknown geo (null country) never triggers a new-country alert", () => {
  const d = evaluateSignIn(ctx({ deviceIsKnown: true, currentCountry: null, priorCountries: ["NG"] }));
  assert.equal(d.isNewCountry, false);
  assert.equal(d.alert, false);
});

test("country comparison is case/though-not-format sensitive only on the normalized value", () => {
  // The caller normalizes to ISO country codes; same code = same country.
  const d = evaluateSignIn(ctx({ deviceIsKnown: true, currentCountry: "ng", priorCountries: ["NG"] }));
  // 'ng' vs 'NG' must be treated as the same country (no false alert).
  assert.equal(d.isNewCountry, false);
});
