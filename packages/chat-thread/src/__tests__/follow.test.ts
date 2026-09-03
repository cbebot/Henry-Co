import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FOLLOW_THRESHOLD_PX,
  initialFollow,
  isNearBottom,
  onIncoming,
  onScrollPosition,
} from "../follow";

test("threshold: within 120px of the bottom counts as near", () => {
  assert.equal(FOLLOW_THRESHOLD_PX, 120);
  // scrollHeight 1000, clientHeight 600 → max scrollTop 400
  assert.equal(isNearBottom(400, 600, 1000), true); // pinned
  assert.equal(isNearBottom(280, 600, 1000), true); // exactly 120 away
  assert.equal(isNearBottom(279, 600, 1000), false); // 121 away
});

test("initial state follows with zero unseen", () => {
  assert.deepEqual(initialFollow(), { following: true, unseen: 0 });
});

test("scrolling away stops following; returning near clears unseen", () => {
  let state = initialFollow();
  state = onScrollPosition(state, false);
  assert.equal(state.following, false);
  state = onIncoming(state, 2, false);
  assert.equal(state.unseen, 2);
  state = onScrollPosition(state, true);
  assert.deepEqual(state, { following: true, unseen: 0 });
});

test("incoming while following stays pinned with no unseen", () => {
  const state = onIncoming(initialFollow(), 3, false);
  assert.deepEqual(state, { following: true, unseen: 0 });
});

test("own send always re-pins even when scrolled up", () => {
  let state = onScrollPosition(initialFollow(), false);
  state = onIncoming(state, 5, false);
  assert.equal(state.unseen, 5);
  state = onIncoming(state, 1, true);
  assert.deepEqual(state, { following: true, unseen: 0 });
});

test("unseen accumulates across multiple arrivals while scrolled up", () => {
  let state = onScrollPosition(initialFollow(), false);
  state = onIncoming(state, 1, false);
  state = onIncoming(state, 4, false);
  assert.equal(state.unseen, 5);
  assert.equal(state.following, false);
});
