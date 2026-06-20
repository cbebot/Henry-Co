// V3-FREESHIP-02 — the NG delivery geography is the source of truth for zones +
// state normalization. Imports the real TypeScript (Node strips types) so the
// 37-entry table + the strict normalizer are verified by EXECUTION.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  NG_STATES,
  NG_ZONES,
  zoneForState,
  statesInZone,
  normalizeStateInput,
} from "../geography-ng.ts";

test("has 37 states (36 + FCT), each in a real zone", () => {
  assert.equal(NG_STATES.length, 37);
  for (const s of NG_STATES) assert.ok(NG_ZONES[s.zone], `${s.code} -> unknown zone ${s.zone}`);
});

test("zones partition the states with no overlap or gap", () => {
  const fromZones = Object.values(NG_ZONES).flatMap((z) => z.states).sort();
  assert.deepEqual(fromZones, NG_STATES.map((s) => s.code).slice().sort());
});

test("state codes are unique", () => {
  assert.equal(new Set(NG_STATES.map((s) => s.code)).size, 37);
});

test("zoneForState / statesInZone round-trip", () => {
  assert.equal(zoneForState("enugu"), "south_east");
  assert.ok(statesInZone("south_east").includes("enugu"));
  assert.equal(statesInZone("south_east").length, 5);
  assert.equal(zoneForState("not-a-state"), null);
});

test("normalizeStateInput is strict — maps messy text or returns null", () => {
  assert.equal(normalizeStateInput("Enugu"), "enugu");
  assert.equal(normalizeStateInput(" enugu state "), "enugu");
  assert.equal(normalizeStateInput("FCT"), "fct");
  assert.equal(normalizeStateInput("Abuja"), "fct"); // common alias
  assert.equal(normalizeStateInput("Akwa Ibom"), "akwa-ibom"); // space -> hyphen
  assert.equal(normalizeStateInput("Cross River"), "cross-river");
  assert.equal(normalizeStateInput("Amama"), null); // a town, not a state
  assert.equal(normalizeStateInput(""), null);
  assert.equal(normalizeStateInput(null), null);
  assert.equal(normalizeStateInput(undefined), null);
});
