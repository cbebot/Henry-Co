import { test } from "node:test";
import assert from "node:assert/strict";

import { buildVerdict, decisionToStatus } from "../verdict";

test("decisionToStatus maps vendor decisions onto the shared trust vocabulary", () => {
  assert.equal(decisionToStatus("approved"), "verified");
  assert.equal(decisionToStatus("rejected"), "rejected");
  assert.equal(decisionToStatus("manual_review"), "pending");
  assert.equal(decisionToStatus("pending"), "pending");
});

test("buildVerdict assembles a minimized, redacted verdict", () => {
  const verdict = buildVerdict({
    userId: "user-1",
    decision: "approved",
    level: "L3",
    provider: "internal",
    providerSessionId: "sess-abc",
    reasonCodes: ["doc_authentic", "face_match"],
    resultJson: { bvn: "22212345678", confidence: 0.98, fullName: "Ada Eze" },
    decidedAt: "2026-06-20T05:46:00.000Z",
  });
  assert.equal(verdict.userId, "user-1");
  assert.equal(verdict.status, "verified");
  assert.equal(verdict.level, "L3");
  assert.equal(verdict.decision, "approved");
  assert.equal(verdict.provider, "internal");
  assert.equal(verdict.providerSessionId, "sess-abc");
  assert.deepEqual(verdict.reasonCodes, ["doc_authentic", "face_match"]);
  // Non-PII signal preserved; PII keys DROPPED entirely (allowlist minimization).
  assert.equal((verdict.redactedResultJson as any).confidence, 0.98);
  assert.equal("bvn" in (verdict.redactedResultJson as any), false);
  assert.equal("fullName" in (verdict.redactedResultJson as any), false);
});

test("a built verdict carries no raw identity number anywhere (minimization invariant)", () => {
  const verdict = buildVerdict({
    userId: "user-1",
    decision: "approved",
    level: "L4",
    provider: "internal",
    resultJson: { nin: "12345678901" },
    decidedAt: "2026-06-20T05:46:00.000Z",
  });
  assert.equal(JSON.stringify(verdict).includes("12345678901"), false);
  assert.equal(verdict.providerSessionId, null);
  assert.deepEqual(verdict.reasonCodes, []);
});

test("buildVerdict rejects an unknown level", () => {
  assert.throws(() =>
    buildVerdict({
      userId: "u",
      decision: "approved",
      // @ts-expect-error intentionally invalid
      level: "L9",
      provider: "internal",
      decidedAt: "2026-06-20T05:46:00.000Z",
    }),
  );
});
