/**
 * V3-73 — Studio Project Suite: revision round-trip counter.
 *
 * "X revisions used / Y remaining" per the contracted package allowance. When the
 * allowance is exhausted, the next change-request is flagged billable (surfaced to
 * operator + client; the actual billing stays on the existing studio billing path).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { computeRoundTrip } from "./revision-rounds";

test("fresh deliverable: nothing used, full allowance remaining, not billable", () => {
  const s = computeRoundTrip(3, 0);
  assert.deepEqual(s, { allowance: 3, used: 0, remaining: 3, exhausted: false, billable: false });
});

test("partially used: remaining decrements, still within allowance", () => {
  const s = computeRoundTrip(3, 2);
  assert.equal(s.remaining, 1);
  assert.equal(s.exhausted, false);
  assert.equal(s.billable, false);
});

test("exactly at allowance: exhausted, next request billable", () => {
  const s = computeRoundTrip(3, 3);
  assert.equal(s.remaining, 0);
  assert.equal(s.exhausted, true);
  assert.equal(s.billable, true);
});

test("over allowance: clamps remaining at 0, stays exhausted + billable", () => {
  const s = computeRoundTrip(3, 5);
  assert.equal(s.remaining, 0);
  assert.equal(s.exhausted, true);
  assert.equal(s.billable, true);
});

test("zero allowance: every change-request is billable", () => {
  const s = computeRoundTrip(0, 0);
  assert.equal(s.allowance, 0);
  assert.equal(s.remaining, 0);
  assert.equal(s.exhausted, true);
  assert.equal(s.billable, true);
});

test("defensive: negative / NaN inputs are clamped to 0", () => {
  const a = computeRoundTrip(-2, -5);
  assert.equal(a.allowance, 0);
  assert.equal(a.used, 0);
  assert.equal(a.remaining, 0);
  const b = computeRoundTrip(Number.NaN, Number.NaN);
  assert.equal(b.allowance, 0);
  assert.equal(b.used, 0);
});

test("fractional inputs are floored to whole rounds", () => {
  const s = computeRoundTrip(3.9, 1.9);
  assert.equal(s.allowance, 3);
  assert.equal(s.used, 1);
  assert.equal(s.remaining, 2);
});
