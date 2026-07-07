import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldTriggerRecovery, IDLE_MS, RECOVERY_CAP_MS } from "./recovery.logic";

const NOW = 2_000_000_000;

test("idle below 20s → no trigger", () => {
  assert.equal(shouldTriggerRecovery(IDLE_MS - 1, true, true, null, NOW), null);
});

test("idle at 20s + consent + high intent → idle trigger", () => {
  const t = shouldTriggerRecovery(IDLE_MS, true, true, null, NOW);
  assert.ok(t);
  assert.equal(t.trigger, "idle");
});

test("no consent → never triggers, regardless of idle", () => {
  assert.equal(shouldTriggerRecovery(IDLE_MS * 10, false, true, null, NOW), null);
});

test("not high-intent → never triggers (recovery is for checkout/booking/listing/application)", () => {
  assert.equal(shouldTriggerRecovery(IDLE_MS * 10, true, false, null, NOW), null);
});

test("frequency cap: one recovery per flow per 7 days", () => {
  const recent = NOW - (RECOVERY_CAP_MS - 1);
  assert.equal(shouldTriggerRecovery(IDLE_MS, true, true, recent, NOW), null);
  const stale = NOW - RECOVERY_CAP_MS;
  assert.ok(shouldTriggerRecovery(IDLE_MS, true, true, stale, NOW));
});
