import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  decideReviewWindowAction,
  daysWaiting,
  revisionRoundsExhausted,
  CLIENT_REVIEW_ESCALATION_DAYS,
  CLIENT_REVIEW_REMINDER_DAYS,
  MAX_CLIENT_REVISION_ROUNDS,
} from "@/lib/agency/review-window";

const DAY = 24 * 60 * 60 * 1000;
const T0 = 1_800_000_000_000; // fixed base (Date.now() is banned in workflow scripts, fine in tests)

describe("client-review silence — reminders then escalate, NEVER auto-advance", () => {
  it("never returns an 'advance' action — the only client→owner edge is the approval route", () => {
    // Sweep the whole window; assert no action kind is anything but none/remind/escalate.
    for (let day = 0; day <= CLIENT_REVIEW_ESCALATION_DAYS + 3; day += 1) {
      for (let sent = 0; sent <= CLIENT_REVIEW_REMINDER_DAYS.length + 1; sent += 1) {
        const action = decideReviewWindowAction({
          enteredAtMs: T0,
          now: T0 + day * DAY,
          remindersSent: sent,
          escalated: false,
        });
        assert.ok(
          action.kind === "none" || action.kind === "remind" || action.kind === "escalate",
          `unexpected action kind ${action.kind}`,
        );
      }
    }
  });

  it("sends nothing on day 0", () => {
    assert.deepEqual(
      decideReviewWindowAction({ enteredAtMs: T0, now: T0, remindersSent: 0, escalated: false }),
      { kind: "none" },
    );
  });

  it("sends the first reminder on day 2, second on day 4, third on day 6", () => {
    const at = (day: number, sent: number) =>
      decideReviewWindowAction({ enteredAtMs: T0, now: T0 + day * DAY, remindersSent: sent, escalated: false });
    assert.equal(at(2, 0).kind, "remind");
    assert.equal(at(3, 1).kind, "none"); // next reminder is day 4
    assert.equal(at(4, 1).kind, "remind");
    assert.equal(at(6, 2).kind, "remind");
  });

  it("escalates to the owner once at day 7, and never again", () => {
    assert.equal(
      decideReviewWindowAction({ enteredAtMs: T0, now: T0 + 7 * DAY, remindersSent: 3, escalated: false }).kind,
      "escalate",
    );
    // Already escalated → nothing (idempotent; the job STAYS in client_review).
    assert.equal(
      decideReviewWindowAction({ enteredAtMs: T0, now: T0 + 9 * DAY, remindersSent: 3, escalated: true }).kind,
      "none",
    );
  });

  it("does not exceed the bounded reminder count before escalation", () => {
    // On day 6 with all 3 reminders already sent, nothing more until escalation day.
    assert.equal(
      decideReviewWindowAction({ enteredAtMs: T0, now: T0 + 6 * DAY, remindersSent: 3, escalated: false }).kind,
      "none",
    );
  });

  it("guards a missing/zero entry timestamp", () => {
    assert.equal(decideReviewWindowAction({ enteredAtMs: 0, now: T0, remindersSent: 0, escalated: false }).kind, "none");
  });

  it("daysWaiting is whole floored days, never negative", () => {
    assert.equal(daysWaiting(T0, T0 + 3.9 * DAY), 3);
    assert.equal(daysWaiting(T0, T0 - DAY), 0);
    assert.equal(daysWaiting(0, T0), 0);
  });
});

describe("client revision rounds — bounded, client cannot force free rebuilds", () => {
  it("exhausts at the included round count", () => {
    assert.equal(revisionRoundsExhausted(0), false);
    assert.equal(revisionRoundsExhausted(MAX_CLIENT_REVISION_ROUNDS - 1), false);
    assert.equal(revisionRoundsExhausted(MAX_CLIENT_REVISION_ROUNDS), true);
    assert.equal(revisionRoundsExhausted(MAX_CLIENT_REVISION_ROUNDS + 5), true);
  });
});
