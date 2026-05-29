import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LEGAL_TRANSITIONS,
  isLegalTransition,
  assertTransition,
  ALL_STATUSES,
} from "../state-machine";
import { IllegalTransitionError } from "../errors";

describe("payment intent state machine (A2)", () => {
  it("allows exactly the documented legal transitions and same-state no-ops", () => {
    const legal = new Set<string>([
      "pending->processing",
      "pending->cancelled",
      "processing->succeeded",
      "processing->failed",
      "succeeded->refunded",
    ]);
    for (const from of ALL_STATUSES) {
      for (const to of ALL_STATUSES) {
        const expected = legal.has(`${from}->${to}`) || from === to;
        assert.equal(
          isLegalTransition(from, to),
          expected,
          `${from}->${to} expected ${expected}`,
        );
      }
    }
  });

  it("assertTransition throws IllegalTransitionError on an illegal move", () => {
    assert.throws(() => assertTransition("succeeded", "pending"), IllegalTransitionError);
    assert.throws(() => assertTransition("failed", "succeeded"), IllegalTransitionError);
    assert.throws(() => assertTransition("refunded", "succeeded"), IllegalTransitionError);
    assert.throws(() => assertTransition("cancelled", "processing"), IllegalTransitionError);
    assert.throws(() => assertTransition("pending", "succeeded"), IllegalTransitionError);
  });

  it("assertTransition is a no-op on legal moves and same-state writes", () => {
    assert.doesNotThrow(() => assertTransition("pending", "processing"));
    assert.doesNotThrow(() => assertTransition("pending", "cancelled"));
    assert.doesNotThrow(() => assertTransition("processing", "succeeded"));
    assert.doesNotThrow(() => assertTransition("processing", "failed"));
    assert.doesNotThrow(() => assertTransition("succeeded", "refunded"));
    assert.doesNotThrow(() => assertTransition("succeeded", "succeeded"));
  });

  it("LEGAL_TRANSITIONS matches the SQL mirror exactly (terminal states have no exits)", () => {
    assert.deepEqual([...LEGAL_TRANSITIONS.pending].sort(), ["cancelled", "processing"]);
    assert.deepEqual([...LEGAL_TRANSITIONS.processing].sort(), ["failed", "succeeded"]);
    assert.deepEqual(LEGAL_TRANSITIONS.succeeded, ["refunded"]);
    assert.deepEqual(LEGAL_TRANSITIONS.failed, []);
    assert.deepEqual(LEGAL_TRANSITIONS.refunded, []);
    assert.deepEqual(LEGAL_TRANSITIONS.cancelled, []);
  });
});
