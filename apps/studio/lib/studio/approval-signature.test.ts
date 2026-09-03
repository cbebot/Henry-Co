/**
 * V3-73 — Studio Project Suite: tamper-evident approval signatures (ANTI-CLONE Principle 12).
 *
 * Run: pnpm --filter @henryco/studio run test
 *      (or: tsx --test apps/studio/lib/studio/approval-signature.test.ts)
 *
 * The trust spine: when a client approves a deliverable, we HMAC-sign a canonical
 * snapshot of the exact approved state. The signature must be deterministic,
 * order-independent over object keys, and detect ANY tampering with the snapshot.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  canonicalizeSnapshot,
  signApprovalSnapshot,
  verifyApprovalSignature,
  type ApprovalSnapshot,
} from "./approval-signature";

const SECRET = "test-secret-key-do-not-use-in-prod";

function baseSnapshot(): ApprovalSnapshot {
  return {
    deliverableId: "11111111-1111-1111-1111-111111111111",
    projectId: "22222222-2222-2222-2222-222222222222",
    revisionNumber: 2,
    approvedByUserId: "33333333-3333-3333-3333-333333333333",
    approvedAt: "2026-06-20T10:00:00.000Z",
    deliverableState: { label: "Logo pack", version: 3, status: "approved" },
  };
}

test("signApprovalSnapshot is deterministic for the same snapshot + secret", () => {
  const snap = baseSnapshot();
  const a = signApprovalSnapshot(snap, SECRET);
  const b = signApprovalSnapshot(snap, SECRET);
  assert.equal(a, b);
  // hex sha256 = 64 chars
  assert.match(a, /^[0-9a-f]{64}$/);
});

test("canonicalization makes object key order irrelevant", () => {
  const snap1 = baseSnapshot();
  const snap2: ApprovalSnapshot = {
    // same data, different key insertion order at the top level and in state
    deliverableState: { status: "approved", version: 3, label: "Logo pack" },
    approvedAt: "2026-06-20T10:00:00.000Z",
    revisionNumber: 2,
    projectId: "22222222-2222-2222-2222-222222222222",
    deliverableId: "11111111-1111-1111-1111-111111111111",
    approvedByUserId: "33333333-3333-3333-3333-333333333333",
  };
  assert.equal(canonicalizeSnapshot(snap1), canonicalizeSnapshot(snap2));
  assert.equal(signApprovalSnapshot(snap1, SECRET), signApprovalSnapshot(snap2, SECRET));
});

test("verifyApprovalSignature accepts a valid signature", () => {
  const snap = baseSnapshot();
  const sig = signApprovalSnapshot(snap, SECRET);
  assert.equal(verifyApprovalSignature(snap, sig, SECRET), true);
});

test("verifyApprovalSignature rejects a tampered snapshot (revision number)", () => {
  const snap = baseSnapshot();
  const sig = signApprovalSnapshot(snap, SECRET);
  const tampered: ApprovalSnapshot = { ...snap, revisionNumber: 99 };
  assert.equal(verifyApprovalSignature(tampered, sig, SECRET), false);
});

test("verifyApprovalSignature rejects a tampered snapshot (deliverable state)", () => {
  const snap = baseSnapshot();
  const sig = signApprovalSnapshot(snap, SECRET);
  const tampered: ApprovalSnapshot = {
    ...snap,
    deliverableState: { ...snap.deliverableState, version: 99 },
  };
  assert.equal(verifyApprovalSignature(tampered, sig, SECRET), false);
});

test("verifyApprovalSignature rejects a signature made with a different secret", () => {
  const snap = baseSnapshot();
  const sig = signApprovalSnapshot(snap, SECRET);
  assert.equal(verifyApprovalSignature(snap, sig, "another-secret"), false);
});

test("verifyApprovalSignature rejects a malformed / empty signature without throwing", () => {
  const snap = baseSnapshot();
  assert.equal(verifyApprovalSignature(snap, "", SECRET), false);
  assert.equal(verifyApprovalSignature(snap, "not-hex-zzzz", SECRET), false);
  assert.equal(verifyApprovalSignature(snap, "abcd", SECRET), false);
});

test("different deliverables produce different signatures", () => {
  const a = signApprovalSnapshot(baseSnapshot(), SECRET);
  const other = { ...baseSnapshot(), deliverableId: "99999999-9999-9999-9999-999999999999" };
  const b = signApprovalSnapshot(other, SECRET);
  assert.notEqual(a, b);
});
