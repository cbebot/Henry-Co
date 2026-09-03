/**
 * V3-39 — the REAL-MOUNT side of the chrome-affordance arbitration proof.
 *
 * `@henryco/ui`'s next-action-arbitration test pins the package contract
 * (launcher stylesheet constants vs chip clearance/z-index). This test pins
 * the ACCOUNT HOST's side of it:
 *
 *   1. The dock is actually mounted in the (account) shell layout — one host,
 *      inside the same tree as the launcher's corner.
 *   2. The IntelligenceLauncher mount (root layout) and the chip mount (dock)
 *      draw their mobile lift from the SAME shared constant, so the two
 *      affordances rise together above the bottom action bar — a hardcoded
 *      divergent offset in either mount fails here.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { ACCOUNT_CHROME_MOBILE_LIFT } from "../chrome";

const read = (rel: string) =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

const shellLayout = read("../../app/(account)/layout.tsx");
const rootLayout = read("../../app/layout.tsx");
const dockSource = read("../../components/next-action/NextActionDock.tsx");

test("the next-action dock is mounted in the (account) shell layout", () => {
  assert.ok(shellLayout.includes("<NextActionDock"), "NextActionDock mount missing");
  assert.ok(
    shellLayout.includes('import { NextActionDock } from "@/components/next-action/NextActionDock"'),
    "NextActionDock import missing",
  );
});

test("launcher and chip share ONE mobile-lift constant (no divergent offsets)", () => {
  assert.ok(
    rootLayout.includes("bottomOffset={ACCOUNT_CHROME_MOBILE_LIFT}"),
    "the IntelligenceLauncher mount no longer uses the shared lift constant",
  );
  assert.ok(
    dockSource.includes("bottomOffset={ACCOUNT_CHROME_MOBILE_LIFT}"),
    "the chip dock no longer uses the shared lift constant",
  );
  // The value itself: bottom action bar (3.5rem) + 1rem gap.
  assert.equal(ACCOUNT_CHROME_MOBILE_LIFT, "calc(3.5rem + 1rem)");
  // Neither mount reintroduces a hardcoded lift literal of its own.
  assert.ok(
    !rootLayout.includes('bottomOffset="calc('),
    "root layout hardcodes a lift literal",
  );
});
