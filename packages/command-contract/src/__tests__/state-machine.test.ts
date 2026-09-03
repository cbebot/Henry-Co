import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALL_ATTENTION_STATUSES,
  LEGAL_TRANSITIONS,
  isLegalTransition,
  assertTransition,
} from "../state-machine";
import { IllegalAttentionTransitionError } from "../errors";

describe("attention-item lifecycle state machine", () => {
  it("allows exactly the documented legal transitions and same-state no-ops", () => {
    const legal = new Set<string>([
      "open->acknowledged",
      "open->in_progress",
      "open->escalated",
      "open->dismissed",
      "acknowledged->in_progress",
      "acknowledged->escalated",
      "acknowledged->resolved",
      "acknowledged->dismissed",
      "in_progress->acknowledged",
      "in_progress->escalated",
      "in_progress->resolved",
      "escalated->in_progress",
      "escalated->resolved",
      "escalated->dismissed",
    ]);
    for (const from of ALL_ATTENTION_STATUSES) {
      for (const to of ALL_ATTENTION_STATUSES) {
        const expected = legal.has(`${from}->${to}`) || from === to;
        assert.equal(
          isLegalTransition(from, to),
          expected,
          `${from}->${to} expected ${expected}`,
        );
      }
    }
  });

  it("treats terminal states as having no outgoing edges", () => {
    assert.deepEqual(LEGAL_TRANSITIONS.resolved, []);
    assert.deepEqual(LEGAL_TRANSITIONS.dismissed, []);
  });

  it("assertTransition throws IllegalAttentionTransitionError on an illegal move", () => {
    assert.throws(() => assertTransition("open", "resolved"), IllegalAttentionTransitionError);
    assert.throws(() => assertTransition("resolved", "open"), IllegalAttentionTransitionError);
    assert.throws(() => assertTransition("dismissed", "in_progress"), IllegalAttentionTransitionError);
    assert.throws(() => assertTransition("in_progress", "dismissed"), IllegalAttentionTransitionError);
  });

  it("assertTransition is a no-op on legal moves and same-state writes", () => {
    assert.doesNotThrow(() => assertTransition("open", "acknowledged"));
    assert.doesNotThrow(() => assertTransition("acknowledged", "resolved"));
    assert.doesNotThrow(() => assertTransition("in_progress", "escalated"));
    assert.doesNotThrow(() => assertTransition("escalated", "resolved"));
    assert.doesNotThrow(() => assertTransition("open", "open"));
    assert.doesNotThrow(() => assertTransition("resolved", "resolved"));
  });

  it("escalated is reachable from every non-terminal working state (the staff→owner bump)", () => {
    assert.ok(isLegalTransition("open", "escalated"));
    assert.ok(isLegalTransition("acknowledged", "escalated"));
    assert.ok(isLegalTransition("in_progress", "escalated"));
  });
});
