import { test } from "node:test";
import assert from "node:assert/strict";

import {
  resolveScheduledRetention,
  resolveErasureRequest,
  type RetentionPolicy,
} from "../retention/policy";

const NOW = new Date("2026-06-20T00:00:00.000Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

const policy = (over: Partial<RetentionPolicy> = {}): RetentionPolicy => ({
  retentionDays: 365,
  amlFloorDays: 180,
  destructiveShredAllowed: true,
  ...over,
});

test("SCHEDULED: no-op when the retention period is not configured (legal sign-off pending)", () => {
  const d = resolveScheduledRetention(
    { createdAt: daysAgo(1000) },
    policy({ retentionDays: null }),
    NOW,
  );
  assert.equal(d.action, "keep");
  assert.match(d.reason, /not configured/i);
});

test("SCHEDULED: keep while inside the retention window", () => {
  const d = resolveScheduledRetention({ createdAt: daysAgo(100) }, policy(), NOW);
  assert.equal(d.action, "keep");
});

test("SCHEDULED: shred once past both the configured window and the AML floor", () => {
  const d = resolveScheduledRetention({ createdAt: daysAgo(400) }, policy(), NOW);
  assert.equal(d.action, "shred");
});

test("SCHEDULED: AML floor wins even if the configured window is shorter", () => {
  // window 30d would say shred at 100d, but the AML floor is 180d.
  const d = resolveScheduledRetention(
    { createdAt: daysAgo(100) },
    policy({ retentionDays: 30, amlFloorDays: 180 }),
    NOW,
  );
  assert.equal(d.action, "keep");
  assert.match(d.reason, /aml|floor/i);
});

test("SCHEDULED: active legal hold blocks shredding past retention", () => {
  const d = resolveScheduledRetention(
    { createdAt: daysAgo(1000), legalHoldReason: "litigation #42" },
    policy(),
    NOW,
  );
  assert.equal(d.action, "keep");
  assert.match(d.reason, /legal hold/i);
});

test("SCHEDULED: retention_hold_until in the future blocks shredding", () => {
  const future = new Date(NOW.getTime() + 30 * 86_400_000).toISOString();
  const d = resolveScheduledRetention(
    { createdAt: daysAgo(1000), retentionHoldUntil: future },
    policy(),
    NOW,
  );
  assert.equal(d.action, "keep");
});

test("SCHEDULED: an already-shredded record is left alone (idempotent)", () => {
  const d = resolveScheduledRetention(
    { createdAt: daysAgo(1000), cryptoShreddedAt: daysAgo(1) },
    policy(),
    NOW,
  );
  assert.equal(d.action, "keep");
});

test("SCHEDULED: a surface that forbids destruction is never auto-shredded", () => {
  const d = resolveScheduledRetention(
    { createdAt: daysAgo(1000) },
    policy({ destructiveShredAllowed: false }),
    NOW,
  );
  assert.equal(d.action, "keep");
});

test("ERASURE: honored once the AML floor is met, regardless of the configured window", () => {
  const d = resolveErasureRequest(
    { createdAt: daysAgo(200) },
    policy({ retentionDays: null }),
    NOW,
  );
  assert.equal(d.action, "shred");
});

test("ERASURE: refused while under the AML retention floor", () => {
  const d = resolveErasureRequest({ createdAt: daysAgo(10) }, policy(), NOW);
  assert.equal(d.action, "keep");
  assert.match(d.reason, /aml|floor/i);
});

test("ERASURE: refused under active legal hold", () => {
  const d = resolveErasureRequest(
    { createdAt: daysAgo(1000), legalHoldReason: "regulator request" },
    policy(),
    NOW,
  );
  assert.equal(d.action, "keep");
  assert.match(d.reason, /legal hold/i);
});

test("ERASURE: refused when the surface forbids destruction", () => {
  const d = resolveErasureRequest(
    { createdAt: daysAgo(1000) },
    policy({ destructiveShredAllowed: false }),
    NOW,
  );
  assert.equal(d.action, "keep");
});
