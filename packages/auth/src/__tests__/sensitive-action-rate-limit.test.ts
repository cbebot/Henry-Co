/**
 * V3-02 S4 — sensitive-action rate-limit local-fallback tests.
 *
 * Tests the in-memory path (no UPSTASH_* env). The Upstash REST
 * branch is exercised manually in the contract notes; CI does not
 * stand up a Redis instance for unit tests.
 */

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  SENSITIVE_ACTION_RATE_LIMIT,
  _resetSensitiveActionRateBucketsForTests,
  _resetAncillaryRateBucketsForTests,
  checkAncillaryRate,
  checkSensitiveActionRate,
} from "../server/sensitive-action-rate-limit";

beforeEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  _resetSensitiveActionRateBucketsForTests();
  _resetAncillaryRateBucketsForTests();
});

const USER = "22222222-2222-2222-2222-222222222222";

test("rate-limit: empty subject fails closed", async () => {
  const r = await checkSensitiveActionRate("");
  assert.equal(r.ok, false);
});

test("rate-limit: first attempt allowed; counter decrements", async () => {
  const now = Date.now();
  const r1 = await checkSensitiveActionRate(USER, now);
  assert.equal(r1.ok, true);
  assert.equal(r1.transport, "local");
  if (r1.ok) {
    assert.equal(r1.remaining, SENSITIVE_ACTION_RATE_LIMIT.limit - 1);
  }
});

test("rate-limit: 5 attempts succeed; 6th blocked", async () => {
  const now = Date.now();
  for (let i = 0; i < SENSITIVE_ACTION_RATE_LIMIT.limit; i += 1) {
    const r = await checkSensitiveActionRate(USER, now + i);
    assert.equal(r.ok, true, `attempt ${i + 1} should pass`);
  }
  const blocked = await checkSensitiveActionRate(USER, now + 100);
  assert.equal(blocked.ok, false);
  if (!blocked.ok) {
    assert.ok(blocked.retryAfterSeconds >= 1);
  }
});

test("rate-limit: next window resets the counter", async () => {
  const t0 = 1_000_000_000_000;
  for (let i = 0; i < SENSITIVE_ACTION_RATE_LIMIT.limit; i += 1) {
    await checkSensitiveActionRate(USER, t0 + i);
  }
  const blocked = await checkSensitiveActionRate(USER, t0 + 100);
  assert.equal(blocked.ok, false);
  const nextWindow = await checkSensitiveActionRate(
    USER,
    t0 + SENSITIVE_ACTION_RATE_LIMIT.windowMs + 1,
  );
  assert.equal(nextWindow.ok, true);
});

test("rate-limit: ancillary limiter respects custom limit + window", async () => {
  const t0 = 2_000_000_000_000;
  const opts = {
    key: "test.endpoint",
    subject: USER,
    windowMs: 60_000,
    limit: 2,
  };
  const r1 = await checkAncillaryRate(opts, t0);
  assert.equal(r1.ok, true);
  const r2 = await checkAncillaryRate(opts, t0 + 1);
  assert.equal(r2.ok, true);
  const r3 = await checkAncillaryRate(opts, t0 + 2);
  assert.equal(r3.ok, false);
});

test("rate-limit: ancillary limiter — empty subject fails closed", async () => {
  const r = await checkAncillaryRate({
    key: "test.endpoint",
    subject: "",
    windowMs: 60_000,
    limit: 2,
  });
  assert.equal(r.ok, false);
});
