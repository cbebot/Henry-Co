/**
 * Toast drip-release planner — paced, one-at-a-time, max-2 behaviour.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { planToastRelease } from "../components/notifications/toast-drip";

const NOW = 1_700_000_000_000;
const GAP = 650;
const LIMIT = 2;

const base = { lastReleaseAt: 0, now: NOW, limit: LIMIT, gapMs: GAP };

test("first toast after a lull releases instantly (no artificial delay)", () => {
  const plan = planToastRelease({ ...base, candidateKeys: ["a"], releasedKeys: [] });
  assert.deepEqual(plan, { action: "release", key: "a" });
});

test("a second toast within the gap must WAIT, not pop simultaneously", () => {
  const plan = planToastRelease({
    ...base,
    candidateKeys: ["b", "a"], // newest-first
    releasedKeys: ["a"],
    lastReleaseAt: NOW - 100, // released 'a' 100ms ago
  });
  assert.equal(plan.action, "wait");
  assert.equal((plan as { waitMs: number }).waitMs, GAP - 100);
});

test("the second toast releases once the gap has elapsed", () => {
  const plan = planToastRelease({
    ...base,
    candidateKeys: ["b", "a"],
    releasedKeys: ["a"],
    lastReleaseAt: NOW - (GAP + 10),
  });
  assert.deepEqual(plan, { action: "release", key: "b" });
});

test("never exceeds the visible limit (2) → idle when full", () => {
  const plan = planToastRelease({
    ...base,
    candidateKeys: ["c", "b", "a"],
    releasedKeys: ["a", "b"],
    lastReleaseAt: NOW - 10_000,
  });
  assert.deepEqual(plan, { action: "idle" });
});

test("a dismissed visible toast is pruned, freeing a slot", () => {
  const plan = planToastRelease({
    ...base,
    candidateKeys: ["b"], // 'a' was dismissed → no longer a candidate
    releasedKeys: ["a", "b"],
    lastReleaseAt: NOW - 10_000,
  });
  assert.deepEqual(plan, { action: "prune", releasedKeys: ["b"] });
});

test("after a prune frees a slot, the next still respects the gap", () => {
  // freed a slot (1 live), a queued 'c' waits out the gap from the last release
  const plan = planToastRelease({
    ...base,
    candidateKeys: ["c", "b"],
    releasedKeys: ["b"],
    lastReleaseAt: NOW - 200,
  });
  assert.equal(plan.action, "wait");
  assert.equal((plan as { waitMs: number }).waitMs, GAP - 200);
});

test("idle when everything on screen is already released and at/under limit", () => {
  const plan = planToastRelease({
    ...base,
    candidateKeys: ["a"],
    releasedKeys: ["a"],
    lastReleaseAt: NOW - 10_000,
  });
  assert.deepEqual(plan, { action: "idle" });
});

test("backlog of 5 drips in one at a time (sequential releases, never a burst)", () => {
  const keys = ["e", "d", "c", "b", "a"]; // newest-first
  // nothing released yet → first releases instantly
  let plan = planToastRelease({ ...base, candidateKeys: keys, releasedKeys: [], lastReleaseAt: 0 });
  assert.deepEqual(plan, { action: "release", key: "e" });
  // one released, gap not elapsed → the 2nd must wait (so 2 never appear together)
  plan = planToastRelease({ ...base, candidateKeys: keys, releasedKeys: ["e"], lastReleaseAt: NOW });
  assert.equal(plan.action, "wait");
});
