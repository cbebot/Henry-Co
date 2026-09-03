/**
 * V3-39 — the chrome-affordance arbitration proof (BUILD-PLAN delta 3).
 *
 * The floating next-action chip and the IntelligenceLauncher FAB share the
 * bottom-right corner in 9 layouts. This test pins BOTH sides of the
 * arbitration contract (`src/next-action/arbitration.ts`):
 *
 *   1. The mirrored launcher constants still match the launcher's REAL
 *      stylesheet (z-index, FAB size, stack gap, corner base) — if the
 *      launcher chrome changes, this fails and the chip must be
 *      re-arbitrated deliberately.
 *   2. The chip's geometry satisfies the contract arithmetic: clearance
 *      >= FAB + gap (no overlap), z-index < launcher (no z-fight — the
 *      opened Intelligence panel always paints over the chip).
 *   3. The chip stylesheet actually consumes the contract constants and the
 *      shared mobile-lift idiom, so the numbers cannot drift silently.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  CHROME_CORNER_BOTTOM_BASE,
  INTELLIGENCE_LAUNCHER_FAB_REM,
  INTELLIGENCE_LAUNCHER_GAP_REM,
  INTELLIGENCE_LAUNCHER_Z_INDEX,
  NEXT_ACTION_CHIP_CLEARANCE_REM,
  NEXT_ACTION_CHIP_Z_INDEX,
} from "../next-action/arbitration";

const launcherSource = readFileSync(
  fileURLToPath(new URL("../intelligence/IntelligenceLauncher.tsx", import.meta.url)),
  "utf8",
);
const chipSource = readFileSync(
  fileURLToPath(new URL("../next-action/NextActionChip.tsx", import.meta.url)),
  "utf8",
);

test("mirrored launcher constants match the launcher's real stylesheet", () => {
  assert.ok(
    launcherSource.includes(`z-index:${INTELLIGENCE_LAUNCHER_Z_INDEX}`),
    "launcher z-index changed — re-arbitrate the chip layer",
  );
  assert.ok(
    launcherSource.includes(
      `width:${INTELLIGENCE_LAUNCHER_FAB_REM}rem;height:${INTELLIGENCE_LAUNCHER_FAB_REM}rem`,
    ),
    "launcher FAB size changed — re-derive the chip clearance",
  );
  assert.ok(
    launcherSource.includes(`gap:.75rem`) && INTELLIGENCE_LAUNCHER_GAP_REM === 0.75,
    "launcher stack gap changed — re-derive the chip clearance",
  );
  assert.ok(
    launcherSource.includes(`bottom:${CHROME_CORNER_BOTTOM_BASE}`),
    "launcher corner base changed — the chip must share the same base",
  );
});

test("chip geometry satisfies the arbitration arithmetic (no overlap, no z-fight)", () => {
  assert.ok(
    NEXT_ACTION_CHIP_CLEARANCE_REM >=
      INTELLIGENCE_LAUNCHER_FAB_REM + INTELLIGENCE_LAUNCHER_GAP_REM,
    "chip clearance no longer clears the launcher FAB + gap",
  );
  assert.ok(
    NEXT_ACTION_CHIP_Z_INDEX < INTELLIGENCE_LAUNCHER_Z_INDEX,
    "chip must paint UNDER the launcher layer",
  );
});

test("the chip stylesheet consumes the contract constants (no silent drift)", () => {
  assert.ok(chipSource.includes("NEXT_ACTION_CHIP_Z_INDEX"), "chip z-index not sourced from the contract");
  assert.ok(
    chipSource.includes("NEXT_ACTION_CHIP_CLEARANCE_REM"),
    "chip clearance not sourced from the contract",
  );
  assert.ok(
    chipSource.includes("CHROME_CORNER_BOTTOM_BASE"),
    "chip corner base not sourced from the contract",
  );
  // The shared mobile-lift idiom: the chip mirrors the launcher's bottom-nav
  // lift so both affordances rise together on mobile.
  assert.ok(chipSource.includes("--hc-na-lift"), "chip mobile lift variable missing");
  assert.ok(launcherSource.includes("--hc-il-lift"), "launcher mobile lift variable missing");
  // Reduced-motion is honored.
  assert.ok(chipSource.includes("prefers-reduced-motion"), "chip must honor reduced motion");
});

test("the chip structurally refuses sensitive/inline actions (wall #2)", () => {
  assert.ok(
    /action\.sensitive \|\| action\.placement !== "floating_chip"/.test(chipSource),
    "the sensitive/inline refusal guard was removed from the chip",
  );
});
