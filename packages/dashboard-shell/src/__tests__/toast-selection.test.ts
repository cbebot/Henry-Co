import { test } from "node:test";
import assert from "node:assert/strict";

import {
  initialToastBaselineState,
  reduceToastBaseline,
  type ToastBaselineState,
} from "../components/notifications/toast-selection";

test("holds while the first hydration is still loading (no baseline, no toast)", () => {
  const s0 = initialToastBaselineState();
  const r = reduceToastBaseline(s0, { loading: true, signalIds: [] });
  assert.equal(r.state.ready, false);
  assert.deepEqual(r.toast, []);
  // Even if signals arrive while still loading, we do not toast or baseline yet.
  const r2 = reduceToastBaseline(r.state, { loading: true, signalIds: ["a", "b"] });
  assert.equal(r2.state.ready, false);
  assert.deepEqual(r2.toast, []);
});

test("backlog present when hydration settles is suppressed (the core bug)", () => {
  // This is the case the old first-render baseline got wrong: the backlog
  // arrives AFTER mount, so it must be captured at settle-time, not toasted.
  const s0 = initialToastBaselineState();
  const r = reduceToastBaseline(s0, {
    loading: false,
    signalIds: ["a", "b", "c"],
  });
  assert.equal(r.state.ready, true);
  assert.deepEqual(r.toast, [], "pre-existing backlog must never toast");
  assert.ok(r.state.seen.has("a") && r.state.seen.has("b") && r.state.seen.has("c"));
});

test("a genuine arrival after the baseline toasts exactly once", () => {
  let state: ToastBaselineState = initialToastBaselineState();
  state = reduceToastBaseline(state, { loading: false, signalIds: ["a", "b"] }).state;

  const arrival = reduceToastBaseline(state, {
    loading: false,
    signalIds: ["d", "a", "b"],
  });
  assert.deepEqual(arrival.toast, ["d"]);
  state = arrival.state;

  // Same set again → nothing new.
  const again = reduceToastBaseline(state, {
    loading: false,
    signalIds: ["d", "a", "b"],
  });
  assert.deepEqual(again.toast, []);
  assert.equal(again.state, state, "state identity stable when nothing changed");
});

test("remount does NOT re-toast the backlog (incl. a prior live arrival)", () => {
  // First mount: backlog {a,b}, then live arrival d (toasted, now persisted to DB).
  let state = reduceToastBaseline(initialToastBaselineState(), {
    loading: false,
    signalIds: ["a", "b"],
  }).state;
  state = reduceToastBaseline(state, { loading: false, signalIds: ["d", "a", "b"] }).state;

  // Navigation remounts the viewport (and provider): fresh state, and the
  // backlog now includes d. Nothing must re-toast.
  const remounted = initialToastBaselineState();
  const settle = reduceToastBaseline(remounted, {
    loading: false,
    signalIds: ["d", "a", "b"],
  });
  assert.deepEqual(settle.toast, [], "remount must not replay the backlog");

  // A brand-new arrival after the remount still toasts.
  const newArrival = reduceToastBaseline(settle.state, {
    loading: false,
    signalIds: ["e", "d", "a", "b"],
  });
  assert.deepEqual(newArrival.toast, ["e"]);
});

test("empty backlog at settle, then a later arrival toasts", () => {
  let state = reduceToastBaseline(initialToastBaselineState(), {
    loading: false,
    signalIds: [],
  }).state;
  assert.equal(state.ready, true);

  const arrival = reduceToastBaseline(state, { loading: false, signalIds: ["x"] });
  assert.deepEqual(arrival.toast, ["x"]);
});

test("multiple simultaneous arrivals all toast, in order", () => {
  const state = reduceToastBaseline(initialToastBaselineState(), {
    loading: false,
    signalIds: ["a"],
  }).state;
  const burst = reduceToastBaseline(state, {
    loading: false,
    signalIds: ["c", "b", "a"],
  });
  assert.deepEqual(burst.toast, ["c", "b"]);
});

test("a loading flip back to true does not reset an established baseline", () => {
  let state = reduceToastBaseline(initialToastBaselineState(), {
    loading: false,
    signalIds: ["a"],
  }).state;
  // A subsequent re-hydration that briefly reports loading again must not
  // re-open the baseline window (ready stays true).
  const r = reduceToastBaseline(state, { loading: true, signalIds: ["a", "z"] });
  assert.equal(r.state.ready, true);
  assert.deepEqual(r.toast, ["z"], "still toasts genuine arrivals during a refresh");
});
