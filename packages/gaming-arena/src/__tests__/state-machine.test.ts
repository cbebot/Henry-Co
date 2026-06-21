import test from "node:test";
import assert from "node:assert/strict";

import {
  ALL_MATCH_STATUSES,
  LEGAL_MATCH_TRANSITIONS,
  assertMatchTransition,
  isLegalMatchTransition,
  isTerminalStatus,
} from "../state/state-machine";
import { IllegalMatchTransitionError } from "../errors";

test("the happy-path forward transitions are legal", () => {
  assert.equal(isLegalMatchTransition("lobby", "matchmaking"), true);
  assert.equal(isLegalMatchTransition("matchmaking", "in_progress"), true);
  assert.equal(isLegalMatchTransition("in_progress", "completed"), true);
});

test("every non-terminal status may transition to abandoned (* -> abandoned)", () => {
  assert.equal(isLegalMatchTransition("lobby", "abandoned"), true);
  assert.equal(isLegalMatchTransition("matchmaking", "abandoned"), true);
  assert.equal(isLegalMatchTransition("in_progress", "abandoned"), true);
});

test("terminal states have no outgoing edges", () => {
  assert.equal(isTerminalStatus("completed"), true);
  assert.equal(isTerminalStatus("abandoned"), true);
  assert.equal(LEGAL_MATCH_TRANSITIONS.completed.length, 0);
  assert.equal(LEGAL_MATCH_TRANSITIONS.abandoned.length, 0);
  assert.equal(isLegalMatchTransition("completed", "in_progress"), false);
  assert.equal(isLegalMatchTransition("abandoned", "lobby"), false);
});

test("same-state is an idempotent legal no-op for every status", () => {
  for (const s of ALL_MATCH_STATUSES) {
    assert.equal(isLegalMatchTransition(s, s), true, `${s} -> ${s} should be a no-op`);
  }
});

test("illegal skips are rejected", () => {
  assert.equal(isLegalMatchTransition("lobby", "in_progress"), false);
  assert.equal(isLegalMatchTransition("lobby", "completed"), false);
  assert.equal(isLegalMatchTransition("matchmaking", "completed"), false);
});

test("assertMatchTransition throws a typed error on an illegal edge", () => {
  assert.throws(() => assertMatchTransition("completed", "in_progress"), IllegalMatchTransitionError);
  // legal edge does not throw
  assert.doesNotThrow(() => assertMatchTransition("lobby", "matchmaking"));
});
