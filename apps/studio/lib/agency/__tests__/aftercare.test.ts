import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  decideAftercareAction,
  WARRANTY_WINDOW_DAYS,
  AFTERCARE_CHECKIN_DAY,
} from "@/lib/agency/aftercare";

const DAY = 24 * 60 * 60 * 1000;
const T0 = 1_800_000_000_000;

describe("aftercare — day-3 check-in, then close at the warranty window", () => {
  it("does nothing in the first days", () => {
    assert.equal(decideAftercareAction({ liveAtMs: T0, now: T0 + 1 * DAY, checkinsSent: 0 }).kind, "none");
  });

  it("fires exactly one check-in at day 3", () => {
    assert.equal(decideAftercareAction({ liveAtMs: T0, now: T0 + AFTERCARE_CHECKIN_DAY * DAY, checkinsSent: 0 }).kind, "checkin");
    // Already sent → no second check-in.
    assert.equal(decideAftercareAction({ liveAtMs: T0, now: T0 + 5 * DAY, checkinsSent: 1 }).kind, "none");
  });

  it("closes the job at the warranty window", () => {
    assert.equal(decideAftercareAction({ liveAtMs: T0, now: T0 + WARRANTY_WINDOW_DAYS * DAY, checkinsSent: 1 }).kind, "close");
    // Close takes priority even if a check-in was somehow never sent.
    assert.equal(decideAftercareAction({ liveAtMs: T0, now: T0 + (WARRANTY_WINDOW_DAYS + 2) * DAY, checkinsSent: 0 }).kind, "close");
  });

  it("guards a missing live timestamp", () => {
    assert.equal(decideAftercareAction({ liveAtMs: 0, now: T0, checkinsSent: 0 }).kind, "none");
  });
});
