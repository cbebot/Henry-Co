/**
 * Recovery detection helpers — staleness thresholds + the SECRET-FREE guarantee
 * (V3-37 gate: detector writers strip forbidden keys from `state`).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  detectFromDraftEnvelope,
  buildDetectedTask,
  isRecoverableByIdle,
  FORM_DRAFT_MIN_IDLE_MS,
} from "../detect";
import { stateHasForbiddenKey } from "@henryco/data/abandoned-tasks-core";

const NOW = 1_700_000_000_000;
const HOUR = 60 * 60 * 1000;

test("a fresh draft is NOT promoted (still being worked)", () => {
  const detected = detectFromDraftEnvelope(
    { key: "studio-brief-new", savedAt: NOW - 1 * HOUR, value: { stepIndex: 1 } },
    { now: NOW, resumeUrl: "https://account.henryonyx.com/continue" },
  );
  assert.equal(detected, null);
});

test("a stale draft is promoted to a form_draft task", () => {
  const detected = detectFromDraftEnvelope(
    { key: "studio-brief-new", savedAt: NOW - FORM_DRAFT_MIN_IDLE_MS - HOUR, value: { stepIndex: 2 } },
    { now: NOW, resumeUrl: "https://studio.henryonyx.com/request", division: "studio" },
  );
  assert.ok(detected);
  assert.equal(detected?.taskType, "form_draft");
  assert.equal(detected?.taskRef, "studio-brief-new");
  assert.equal(detected?.division, "studio");
  assert.equal(detected?.continueUrl, "https://studio.henryonyx.com/request");
  assert.equal(detected?.lastProgressAt, new Date(NOW - FORM_DRAFT_MIN_IDLE_MS - HOUR).toISOString());
});

test("a draft with no resume target is not recoverable", () => {
  const detected = detectFromDraftEnvelope(
    { key: "x", savedAt: NOW - 5 * FORM_DRAFT_MIN_IDLE_MS, value: {} },
    { now: NOW, resumeUrl: "" },
  );
  assert.equal(detected, null);
});

test("SECRET-FREE: forbidden keys are stripped from a detected draft's state", () => {
  const detected = detectFromDraftEnvelope(
    {
      key: "marketplace-checkout",
      savedAt: NOW - 2 * FORM_DRAFT_MIN_IDLE_MS,
      value: {
        step: 2,
        selectedAddressId: "addr_123",
        card_number: "4111111111111111",
        cvv: "123",
        payment: { card_cvc: "999", token: "tok_secret", note: "ok" },
        password: "hunter2",
        bvn: "12345678901",
      },
    },
    { now: NOW, resumeUrl: "https://marketplace.henryonyx.com/checkout" },
  );
  assert.ok(detected);
  // benign keys survive
  assert.equal((detected!.state as Record<string, unknown>).draftKey, "marketplace-checkout");
  // NO forbidden key anywhere in the persisted snapshot
  assert.equal(stateHasForbiddenKey(detected!.state), false);
});

test("buildDetectedTask sanitises server-record snapshots too", () => {
  const task = buildDetectedTask({
    taskType: "kyc",
    taskRef: "kyc:user-1",
    division: "account",
    continueUrl: "https://account.henryonyx.com/verification",
    state: { status: "in_progress", document_bytes: "BASE64...", selfie: "BASE64..." },
    lastProgressAt: NOW,
  });
  assert.equal(task.taskType, "kyc");
  assert.equal(stateHasForbiddenKey(task.state), false);
  assert.equal((task.state as Record<string, unknown>).status, "in_progress");
});

test("isRecoverableByIdle respects the [min, expire) window", () => {
  const min = 24 * HOUR;
  const expire = 14 * 24 * HOUR;
  assert.equal(isRecoverableByIdle(NOW - 12 * HOUR, NOW, min, expire), false); // too fresh
  assert.equal(isRecoverableByIdle(NOW - 3 * 24 * HOUR, NOW, min, expire), true); // in window
  assert.equal(isRecoverableByIdle(NOW - 20 * 24 * HOUR, NOW, min, expire), false); // expired
});
