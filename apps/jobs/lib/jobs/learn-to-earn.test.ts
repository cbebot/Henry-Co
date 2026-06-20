/**
 * V3-56 — pure-logic tests for the Jobs side of the Learn→Jobs bridge.
 * Run: tsx --test lib/jobs/learn-to-earn.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  evaluateCourseGate,
  isOptinActive,
  selectInvitableCandidates,
  type CourseGate,
} from "./learn-to-earn";

const hard = (id: string): CourseGate => ({ course_id: id, course_label: id, required: true });
const soft = (id: string): CourseGate => ({ course_id: id, course_label: id, required: false });

test("evaluateCourseGate: hard gate not completed → blocks", () => {
  const v = evaluateCourseGate({ gates: [hard("c1")], verifiedCourseIds: new Set() });
  assert.equal(v.blockingGate?.course_id, "c1");
  assert.equal(v.unmetRequired.length, 1);
  assert.equal(v.preferred, false);
});

test("evaluateCourseGate: hard gate completed → passes", () => {
  const v = evaluateCourseGate({ gates: [hard("c1")], verifiedCourseIds: new Set(["c1"]) });
  assert.equal(v.blockingGate, null);
  assert.equal(v.unmetRequired.length, 0);
});

test("evaluateCourseGate: soft gate completed → preferred, no block", () => {
  const v = evaluateCourseGate({ gates: [soft("c1")], verifiedCourseIds: new Set(["c1"]) });
  assert.equal(v.blockingGate, null);
  assert.equal(v.preferred, true);
});

test("evaluateCourseGate: soft gate not completed → not preferred, no block", () => {
  const v = evaluateCourseGate({ gates: [soft("c1")], verifiedCourseIds: new Set() });
  assert.equal(v.blockingGate, null);
  assert.equal(v.preferred, false);
});

test("evaluateCourseGate: hard unmet + soft met → blocks AND preferred", () => {
  const v = evaluateCourseGate({
    gates: [hard("c1"), soft("c2")],
    verifiedCourseIds: new Set(["c2"]),
  });
  assert.equal(v.blockingGate?.course_id, "c1");
  assert.equal(v.preferred, true);
});

test("evaluateCourseGate: no gates → open", () => {
  const v = evaluateCourseGate({ gates: [], verifiedCourseIds: new Set() });
  assert.equal(v.blockingGate, null);
  assert.equal(v.preferred, false);
});

test("isOptinActive: consent rules", () => {
  assert.equal(isOptinActive(null), false);
  assert.equal(isOptinActive(undefined), false);
  assert.equal(isOptinActive({ user_id: "u", course_id: "c", revoked_at: "2026-01-01" }), false);
  assert.equal(isOptinActive({ user_id: "u", course_id: "c", visibility: "private" }), false);
  assert.equal(isOptinActive({ user_id: "u", course_id: "c", visibility: "employers" }), true);
  assert.equal(isOptinActive({ user_id: "u", course_id: "c" }), true); // default employers
});

test("selectInvitableCandidates: only active, un-invited consenters are invited", () => {
  const r = selectInvitableCandidates({
    candidateUserIds: ["a", "b", "c", "a"], // duplicate 'a'
    alreadyInvited: new Set(["b"]),
    activeOptinUserIds: new Set(["a", "b"]), // 'c' has no active consent
  });
  assert.deepEqual(r.invite, ["a"]);
  assert.deepEqual(r.skippedInvited, ["b"]);
  assert.deepEqual(r.skippedNoConsent, ["c"]);
});

test("selectInvitableCandidates: opt-out is never re-invited", () => {
  const r = selectInvitableCandidates({
    candidateUserIds: ["x"],
    alreadyInvited: new Set(),
    activeOptinUserIds: new Set(), // x opted out
  });
  assert.deepEqual(r.invite, []);
  assert.deepEqual(r.skippedNoConsent, ["x"]);
});
