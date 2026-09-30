import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  advanceNextRunAt,
  dueWithoutStoredRun,
  recurringTrackingCode,
} from "./recurring-auto-book";

// Run from apps/care (so the `@/` path alias resolves):
//   node --conditions=react-server --import tsx --test lib/automation/recurring-auto-book.test.ts
// (the module is server-only; the react-server condition resolves the no-op guard).
//
// V3-CARE-JOBS-PREAPPLY-FIX-01. The recurring sweep's pure helpers: the run key
// that keeps a run from being booked twice, the cadence step (fed by text the
// schedule owner can write), and the due time of a schedule with no stored run.

const DAY = 24 * 60 * 60 * 1000;
const SCHEDULE = "abcdef01-2345-4678-89ab-cdef01234567";
const OTHER = "abcdef01-9999-4999-8999-999999999999"; // same first 8 hex chars

describe("recurringTrackingCode", () => {
  const run = new Date("2026-10-07T06:00:00.000Z");

  it("is RECUR- plus 32 upper-case hex characters", () => {
    assert.match(recurringTrackingCode(SCHEDULE, run), /^RECUR-[0-9A-F]{32}$/);
  });

  it("is the same for every retry of a run, at any time on its UTC day", () => {
    const code = recurringTrackingCode(SCHEDULE, run);
    assert.equal(recurringTrackingCode(SCHEDULE, new Date("2026-10-07T00:00:00.000Z")), code);
    assert.equal(recurringTrackingCode(SCHEDULE, new Date("2026-10-07T23:59:59.999Z")), code);
  });

  it("differs between run days and between schedules, including a shared id prefix", () => {
    const code = recurringTrackingCode(SCHEDULE, run);
    assert.notEqual(recurringTrackingCode(SCHEDULE, new Date(run.getTime() + DAY)), code);
    assert.notEqual(recurringTrackingCode(SCHEDULE, new Date(run.getTime() + 7 * DAY)), code);
    assert.notEqual(recurringTrackingCode(OTHER, run), code);
  });

  it("does not carry the schedule id, so one code cannot be turned into another", () => {
    const code = recurringTrackingCode(SCHEDULE, run);
    const hex = SCHEDULE.replace(/-/g, "").toUpperCase();
    assert.equal(code.includes(hex.slice(0, 8)), false);
    assert.equal(code.includes(SCHEDULE.toUpperCase()), false);
    assert.equal(code.includes("20261007"), false);
  });
});

describe("advanceNextRunAt", () => {
  const from = new Date("2026-10-01T08:15:00.000Z");

  it("steps by the schedule's cadence", () => {
    assert.equal(advanceNextRunAt(from, "weekly").getTime(), from.getTime() + 7 * DAY);
    assert.equal(advanceNextRunAt(from, "biweekly").getTime(), from.getTime() + 14 * DAY);
    assert.equal(advanceNextRunAt(from, "monthly").getTime(), from.getTime() + 30 * DAY);
    assert.equal(advanceNextRunAt(from, "custom").getTime(), from.getTime() + 7 * DAY);
  });

  it("falls back to a week for any other text, including inherited object keys", () => {
    for (const cadence of ["", "daily", "constructor", "__proto__", "toString", "valueOf", "hasOwnProperty"]) {
      const next = advanceNextRunAt(from, cadence);
      assert.equal(next.getTime(), from.getTime() + 7 * DAY, cadence);
      assert.doesNotThrow(() => next.toISOString(), cadence);
    }
  });
});

describe("dueWithoutStoredRun", () => {
  const now = new Date("2026-10-01T08:15:00.000Z");

  it("is now for a schedule that has never run", () => {
    assert.equal(dueWithoutStoredRun(null, "weekly", now).getTime(), now.getTime());
  });

  it("is one cadence after the last run while that is still ahead", () => {
    const lastRun = new Date(now.getTime() - 2 * DAY).toISOString();
    assert.equal(dueWithoutStoredRun(lastRun, "weekly", now).getTime(), now.getTime() + 5 * DAY);
    // A re-save on the day of a run keeps the next pickup a full cadence away.
    assert.equal(dueWithoutStoredRun(now.toISOString(), "weekly", now).getTime(), now.getTime() + 7 * DAY);
  });

  it("is now once a full cadence has passed since the last run", () => {
    const lastRun = new Date(now.getTime() - 30 * DAY).toISOString();
    assert.equal(dueWithoutStoredRun(lastRun, "weekly", now).getTime(), now.getTime());
  });

  it("treats an unreadable last run as never run", () => {
    assert.equal(dueWithoutStoredRun("infinity", "weekly", now).getTime(), now.getTime());
    assert.equal(dueWithoutStoredRun("not a date", "constructor", now).getTime(), now.getTime());
  });
});
