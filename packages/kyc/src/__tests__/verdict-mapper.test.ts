import { test } from "node:test";
import assert from "node:assert/strict";

import { verdictFromVendorResult } from "../provider/verdict-mapper";
import type { VerificationResult } from "../provider/adapter-interface";

const now = "2026-06-20T05:46:00.000Z";

test("maps an approved vendor result into a verified verdict", () => {
  const result: VerificationResult = {
    vendorSessionId: "sess-1",
    decision: "approved",
    achievedLevel: "L3",
    redactedResultJson: { confidence: 0.97 },
    reasonCodes: ["doc_authentic"],
  };
  const v = verdictFromVendorResult("user-1", "smile_identity", result, now);
  assert.equal(v.status, "verified");
  assert.equal(v.level, "L3");
  assert.equal(v.provider, "smile_identity");
  assert.equal(v.providerSessionId, "sess-1");
  assert.deepEqual(v.reasonCodes, ["doc_authentic"]);
  assert.equal(v.decidedAt, now);
});

test("minimizes the vendor JSON defensively even if the adapter left PII in (drops unknown keys)", () => {
  const result: VerificationResult = {
    vendorSessionId: "sess-2",
    decision: "approved",
    achievedLevel: "L4",
    // An adapter bug leaks a raw BVN — allowlist minimization drops it entirely.
    redactedResultJson: { bvn: "22212345678", confidence: 0.9 },
    reasonCodes: [],
  };
  const v = verdictFromVendorResult("user-1", "onfido", result, now);
  assert.equal("bvn" in (v.redactedResultJson as any), false, "PII key dropped, not just masked");
  assert.equal((v.redactedResultJson as any).confidence, 0.9, "safe signal retained");
  assert.equal(JSON.stringify(v).includes("22212345678"), false);
});

test("maps manual_review to pending status", () => {
  const result: VerificationResult = {
    vendorSessionId: "sess-3",
    decision: "manual_review",
    achievedLevel: "L0",
    redactedResultJson: {},
    reasonCodes: ["manual_review_required"],
  };
  const v = verdictFromVendorResult("user-1", "internal", result, now);
  assert.equal(v.status, "pending");
  assert.equal(v.level, "L0");
});
