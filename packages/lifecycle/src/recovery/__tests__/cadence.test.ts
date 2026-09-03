/**
 * Recovery cadence planner — deterministic decision tests (injected `now`).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  planRecoveryDispatch,
  RECOVERY_EXPIRE_IDLE_MS,
} from "../cadence";

const NOW = 1_700_000_000_000;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

test("too fresh: reminder 0 before day 1 → noop", () => {
  const plan = planRecoveryDispatch({
    now: NOW,
    lastProgressAt: NOW - 6 * HOUR,
    reminderCount: 0,
    lastReminderAt: null,
  });
  assert.equal(plan.action, "noop");
});

test("day 1, reminder 0 → dispatch in_app", () => {
  const plan = planRecoveryDispatch({
    now: NOW,
    lastProgressAt: NOW - 1 * DAY - HOUR,
    reminderCount: 0,
    lastReminderAt: null,
  });
  assert.equal(plan.action, "dispatch");
  assert.deepEqual(plan.channels, ["in_app"]);
  assert.equal(plan.withOffer, false);
});

test("min-gap guard: a recent reminder defers the next", () => {
  const plan = planRecoveryDispatch({
    now: NOW,
    lastProgressAt: NOW - 3 * DAY,
    reminderCount: 1,
    lastReminderAt: NOW - 2 * HOUR, // sent 2h ago, within the 20h gap
  });
  assert.equal(plan.action, "noop");
  assert.match(plan.reason, /min gap/);
});

test("day 3, reminder 1 → dispatch email", () => {
  const plan = planRecoveryDispatch({
    now: NOW,
    lastProgressAt: NOW - 3 * DAY - HOUR,
    reminderCount: 1,
    lastReminderAt: NOW - 2 * DAY,
  });
  assert.equal(plan.action, "dispatch");
  assert.deepEqual(plan.channels, ["email"]);
});

test("day 7, reminder 2 → dispatch email+push with offer", () => {
  const plan = planRecoveryDispatch({
    now: NOW,
    lastProgressAt: NOW - 7 * DAY - HOUR,
    reminderCount: 2,
    lastReminderAt: NOW - 4 * DAY,
  });
  assert.equal(plan.action, "dispatch");
  assert.deepEqual(plan.channels, ["email", "push"]);
  assert.equal(plan.withOffer, true);
});

test("expire wins once idle past the window, regardless of reminder_count", () => {
  const plan = planRecoveryDispatch({
    now: NOW,
    lastProgressAt: NOW - RECOVERY_EXPIRE_IDLE_MS - HOUR,
    reminderCount: 0,
    lastReminderAt: null,
  });
  assert.equal(plan.action, "expire");
});

test("opt-out: in-app disabled removes the only day-1 channel → noop", () => {
  const plan = planRecoveryDispatch({
    now: NOW,
    lastProgressAt: NOW - 1 * DAY - HOUR,
    reminderCount: 0,
    lastReminderAt: null,
    prefs: { inApp: false },
  });
  assert.equal(plan.action, "noop");
  assert.match(plan.reason, /opted out|quiet/);
});

test("quiet hours: day-7 push is muted but email still sends", () => {
  const plan = planRecoveryDispatch({
    now: NOW,
    lastProgressAt: NOW - 7 * DAY - HOUR,
    reminderCount: 2,
    lastReminderAt: NOW - 4 * DAY,
    prefs: { quietHours: true },
  });
  assert.equal(plan.action, "dispatch");
  assert.deepEqual(plan.channels, ["email"]);
  assert.equal(plan.withOffer, true);
});

test("reminder_count beyond cadence (but pre-expire) → noop", () => {
  const plan = planRecoveryDispatch({
    now: NOW,
    lastProgressAt: NOW - 8 * DAY,
    reminderCount: 3,
    lastReminderAt: NOW - 2 * DAY,
  });
  assert.equal(plan.action, "noop");
  assert.match(plan.reason, /no cadence step/);
});
