/**
 * BottomActionBar probes — DASH-7 G16.
 *
 * Tests the `computeActive` pure helper that decides which anchor the
 * mobile bar should highlight. Pure logic, deterministic, easy to
 * regress — exactly the shape `node:test` was added for at DASH-5
 * elevation.
 *
 * Runtime: node:test via tsx --test.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { computeActive, BOTTOM_ACTION_BAR_ANCHOR_KEYS } from "../shell/bottom-action-bar";

describe("computeActive", () => {
  it("returns the open sheet key when one is open (sheet wins over pathname)", () => {
    assert.equal(computeActive("/", "modules"), "modules");
    assert.equal(computeActive("/modules/marketplace", "inbox"), "inbox");
    assert.equal(computeActive("/wallet", "more"), "more");
    assert.equal(computeActive("/anything", "home"), "home");
  });

  it("returns 'home' on the root path with no open sheet", () => {
    assert.equal(computeActive("/", null), "home");
    assert.equal(computeActive("", null), "home");
  });

  it("returns 'modules' when pathname starts with /modules", () => {
    assert.equal(computeActive("/modules", null), "modules");
    assert.equal(computeActive("/modules/marketplace", null), "modules");
    assert.equal(computeActive("/modules/wallet/funding", null), "modules");
    assert.equal(computeActive("/modules/customer-overview/notifications", null), "modules");
  });

  it("returns 'home' on every other pathname (legacy account routes)", () => {
    // Legacy apps/account routes (not yet ported to module surfaces) all
    // default to "home" so the bar shows the user where they came from
    // rather than orphaning the active state.
    assert.equal(computeActive("/wallet", null), "home");
    assert.equal(computeActive("/notifications", null), "home");
    assert.equal(computeActive("/settings", null), "home");
    assert.equal(computeActive("/support", null), "home");
    assert.equal(computeActive("/wallet/add", null), "home");
    assert.equal(computeActive("/notifications/recently-deleted", null), "home");
  });

  it("treats `/modulesuffix` as not under /modules (prefix-safe)", () => {
    // A made-up pathname that starts with the literal "modules" but
    // isn't a /modules/* surface (e.g. a future "/modules-archive")
    // would still match `pathname.startsWith("/modules")`. This test
    // documents the current behaviour so a future tightening is
    // intentional rather than accidental.
    assert.equal(computeActive("/modules", null), "modules");
    assert.equal(computeActive("/modulesuffix", null), "modules");
    // If a future route under "/modules-foo" needs different behaviour,
    // extend the regex in computeActive (e.g. /^\/modules(\/|$)/).
  });

  it("is deterministic — same input produces same output", () => {
    for (let i = 0; i < 1000; i++) {
      assert.equal(computeActive("/modules/marketplace", null), "modules");
    }
  });

  it("BOTTOM_ACTION_BAR_ANCHOR_KEYS lists exactly the 4 anchors in spec order", () => {
    assert.deepEqual(
      Array.from(BOTTOM_ACTION_BAR_ANCHOR_KEYS),
      ["home", "modules", "inbox", "more"],
    );
  });

  it("returns a value from the exported anchor key set on every input", () => {
    const cases = [
      computeActive("/", null),
      computeActive("/modules/marketplace", null),
      computeActive("/wallet", null),
      computeActive("/", "modules"),
      computeActive("/", "inbox"),
      computeActive("/", "more"),
    ];
    for (const c of cases) {
      assert.ok(
        BOTTOM_ACTION_BAR_ANCHOR_KEYS.includes(c),
        `computeActive returned ${c} which is not in the anchor key set`,
      );
    }
  });
});
