import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldSurfaceCapture, SCROLL_THRESHOLD_PCT, ASK_COOLDOWN_MS } from "./newsletter.logic";

const NOW = 3_000_000_000;

test("surfaces after a primary action succeeds", () => {
  assert.equal(shouldSurfaceCapture({ primarySucceeded: true, scrollDepth: 0, lastAskedAt: null, askedThisSession: false }, NOW), true);
});

test("surfaces past 70% scroll on a content page", () => {
  assert.equal(shouldSurfaceCapture({ primarySucceeded: false, scrollDepth: SCROLL_THRESHOLD_PCT, lastAskedAt: null, askedThisSession: false }, NOW), true);
  assert.equal(shouldSurfaceCapture({ primarySucceeded: false, scrollDepth: SCROLL_THRESHOLD_PCT - 1, lastAskedAt: null, askedThisSession: false }, NOW), false);
});

test("never before a value moment: no success, no scroll → no ask", () => {
  assert.equal(shouldSurfaceCapture({ primarySucceeded: false, scrollDepth: 10, lastAskedAt: null, askedThisSession: false }, NOW), false);
});

test("never twice in the same session", () => {
  assert.equal(shouldSurfaceCapture({ primarySucceeded: true, scrollDepth: 100, lastAskedAt: null, askedThisSession: true }, NOW), false);
});

test("not more than weekly cross-session", () => {
  const recent = NOW - (ASK_COOLDOWN_MS - 1);
  assert.equal(shouldSurfaceCapture({ primarySucceeded: true, scrollDepth: 100, lastAskedAt: recent, askedThisSession: false }, NOW), false);
  const stale = NOW - ASK_COOLDOWN_MS;
  assert.equal(shouldSurfaceCapture({ primarySucceeded: true, scrollDepth: 100, lastAskedAt: stale, askedThisSession: false }, NOW), true);
});
