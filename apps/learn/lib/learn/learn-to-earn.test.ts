/**
 * V3-56 — pure-logic tests for the Learn side of the Learn→Jobs bridge.
 * Run: tsx --test lib/learn/learn-to-earn.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildLearnCompletionVerificationRow,
  isOptInVisibleToEmployers,
  LEARN_COMPLETION_SOURCE,
} from "./learn-to-earn";

test("buildLearnCompletionVerificationRow: governed, system-actor, verified", () => {
  const row = buildLearnCompletionVerificationRow({
    id: "row-1",
    certificateId: "cert-1",
    courseId: "course-1",
    courseTitle: "Storefront Operations",
    courseSlug: "storefront-ops",
    userId: "user-1",
    issuedAt: "2026-06-20T00:00:00.000Z",
    certificateNo: "HCL-2026-ABC123",
    verificationCode: "VERIFY-XYZ",
    verifyUrl: "https://learn.example/certifications/verify/VERIFY-XYZ",
  });

  assert.equal(row.source, LEARN_COMPLETION_SOURCE);
  assert.equal(row.source, "learn_completion");
  assert.equal(row.source_ref, "cert-1");
  assert.equal(row.course_id, "course-1");
  assert.equal(row.status, "verified");
  assert.equal(row.verified_by_user_id, null); // system actor, never a self-claim
  assert.equal(row.skill_id, null);
  assert.equal(row.evidence_type, "certificate");
  assert.equal(row.skill_label, "Storefront Operations");
  assert.equal(row.candidate_user_id, "user-1");
  assert.equal(row.verified_at, "2026-06-20T00:00:00.000Z");
  assert.equal((row.evidence_payload as Record<string, unknown>).verification_code, "VERIFY-XYZ");
  assert.equal((row.evidence_payload as Record<string, unknown>).source, "learn_completion");
});

test("buildLearnCompletionVerificationRow: blank title falls back", () => {
  const row = buildLearnCompletionVerificationRow({
    id: "row-2",
    certificateId: "cert-2",
    courseId: "course-2",
    courseTitle: "   ",
    userId: "user-2",
    issuedAt: "2026-06-20T00:00:00.000Z",
  });
  assert.equal(row.skill_label, "Henry Onyx Learn course");
});

test("isOptInVisibleToEmployers: consent-first visibility", () => {
  assert.equal(isOptInVisibleToEmployers(null), false);
  assert.equal(isOptInVisibleToEmployers({ visibility: "employers" }), true);
  assert.equal(isOptInVisibleToEmployers({ visibility: "private" }), false);
  assert.equal(isOptInVisibleToEmployers({ visibility: "employers", revoked_at: "2026-01-01" }), false);
  assert.equal(isOptInVisibleToEmployers({}), true); // default employers
});
