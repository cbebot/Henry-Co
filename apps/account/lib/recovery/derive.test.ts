/**
 * Layer-A derivation — selecting recoverable journeys from the lifecycle
 * snapshot. Pure + deterministic (injected `now`).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import type {
  LifecycleActionable,
  LifecycleSnapshot,
} from "@henryco/lifecycle";
import { RECOVERY_EXPIRE_IDLE_MS } from "@henryco/lifecycle/recovery";
import { stateHasForbiddenKey } from "@henryco/data/abandoned-tasks-core";

import {
  deriveRecoveryTasksFromSnapshot,
  RECOVERY_SERVER_MIN_IDLE_MS,
} from "./derive";

const NOW = 1_700_000_000_000;

function actionable(over: Partial<LifecycleActionable>): LifecycleActionable {
  return {
    pillar: "care",
    division: "care",
    stage: "in_progress",
    priority: "normal",
    title: "Care booking",
    detail: "",
    actionUrl: "https://care.henryonyx.com/track?code=ABC",
    actionLabel: "Continue",
    blockerReason: null,
    lastActiveAt: new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(),
    referenceId: "bk_1",
    referenceType: "care_booking",
    ...over,
  };
}

function snapshot(actionables: LifecycleActionable[]): LifecycleSnapshot {
  return {
    userId: "user-1",
    generatedAt: new Date(NOW).toISOString(),
    entries: [],
    actionables,
    hasBlocker: false,
    hasReEngagement: false,
    overallLastActiveAt: null,
  };
}

test("maps a resumable, in-window care actionable to a booking task", () => {
  const tasks = deriveRecoveryTasksFromSnapshot(snapshot([actionable({})]), { now: NOW });
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].taskType, "booking");
  assert.equal(tasks[0].taskRef, "care_booking:bk_1");
  assert.equal(tasks[0].continueUrl, "https://care.henryonyx.com/track?code=ABC");
  assert.equal(tasks[0].division, "care");
});

test("excludes unmapped pillars (wallet is panel-only, never nudged)", () => {
  const tasks = deriveRecoveryTasksFromSnapshot(
    snapshot([actionable({ pillar: "wallet", division: "wallet", referenceType: "funding" })]),
    { now: NOW },
  );
  assert.equal(tasks.length, 0);
});

test("excludes too-fresh journeys (still being worked)", () => {
  const tasks = deriveRecoveryTasksFromSnapshot(
    snapshot([actionable({ lastActiveAt: new Date(NOW - 60_000).toISOString() })]),
    { now: NOW },
  );
  assert.equal(tasks.length, 0);
});

test("excludes journeys idle past the expire window", () => {
  const tasks = deriveRecoveryTasksFromSnapshot(
    snapshot([
      actionable({ lastActiveAt: new Date(NOW - RECOVERY_EXPIRE_IDLE_MS - 60_000).toISOString() }),
    ]),
    { now: NOW },
  );
  assert.equal(tasks.length, 0);
});

test("excludes non-resumable stages and missing deep-links", () => {
  const tasks = deriveRecoveryTasksFromSnapshot(
    snapshot([
      actionable({ stage: "completed" }),
      actionable({ referenceId: "bk_2", actionUrl: "" }),
    ]),
    { now: NOW },
  );
  assert.equal(tasks.length, 0);
});

test("maps studio→proposal, marketplace→cart, kyc pillars→kyc", () => {
  const tasks = deriveRecoveryTasksFromSnapshot(
    snapshot([
      actionable({ pillar: "studio", division: "studio", referenceType: "proposal", referenceId: "p1", actionUrl: "https://studio.henryonyx.com/x" }),
      actionable({ pillar: "marketplace", division: "marketplace", referenceType: "order", referenceId: "o1", actionUrl: "https://marketplace.henryonyx.com/x" }),
      actionable({ pillar: "trust", division: "account", referenceType: "kyc", referenceId: "k1", actionUrl: "https://account.henryonyx.com/verification" }),
    ]),
    { now: NOW },
  );
  const byType = Object.fromEntries(tasks.map((t) => [t.taskType, t.taskRef]));
  assert.equal(byType["proposal"], "proposal:p1");
  assert.equal(byType["cart"], "order:o1");
  assert.equal(byType["kyc"], "kyc:k1");
});

test("derived state is secret-free + minimal (stage/title/pillar only)", () => {
  const tasks = deriveRecoveryTasksFromSnapshot(snapshot([actionable({})]), { now: NOW });
  assert.equal(stateHasForbiddenKey(tasks[0].state), false);
  assert.deepEqual(Object.keys(tasks[0].state).sort(), ["pillar", "stage", "title"]);
});

test("min-idle threshold boundary is respected", () => {
  // exactly at the threshold is not yet recoverable (strictly greater-equal min)
  const justInside = deriveRecoveryTasksFromSnapshot(
    snapshot([actionable({ lastActiveAt: new Date(NOW - RECOVERY_SERVER_MIN_IDLE_MS - 1000).toISOString() })]),
    { now: NOW },
  );
  assert.equal(justInside.length, 1);
});
