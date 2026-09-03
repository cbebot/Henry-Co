import { test } from "node:test";
import assert from "node:assert/strict";

import {
  redactKycPayload,
  minimizeVerdictJson,
  scrubText,
  KYC_EXTRA_REDACT_KEYS,
} from "../redaction";

test("redacts identity numbers and names that the default set or KYC extras cover", () => {
  const raw = {
    decision: "approved",
    level: "L3",
    bvn: "22212345678",
    nin: "12345678901",
    passportNumber: "A1234567",
    documentNumber: "DOC-9",
    firstName: "Ada",
    lastName: "Eze",
    fullName: "Ada Eze",
    dateOfBirth: "1990-01-01",
    address: "1 Airport Rd",
    nested: { selfie: "data:image/png;base64,AAAA", reasonCode: "ok" },
  };
  const out = redactKycPayload(raw) as Record<string, any>;
  // Non-PII preserved.
  assert.equal(out.decision, "approved");
  assert.equal(out.level, "L3");
  assert.equal(out.nested.reasonCode, "ok");
  // PII redacted.
  for (const k of ["bvn", "nin", "passportNumber", "documentNumber", "firstName", "lastName", "fullName", "dateOfBirth", "address"]) {
    assert.equal(out[k], "[redacted]", `${k} must be redacted`);
  }
  assert.equal(out.nested.selfie, "[redacted]");
});

test("redaction is CASE-INSENSITIVE — vendor key variants are still caught", () => {
  const out = redactKycPayload({ BVN: "22212345678", Nin: "12345678901", Full_Name: "Ada Eze", DECISION: "approved" }) as Record<string, any>;
  assert.equal(out.BVN, "[redacted]");
  assert.equal(out.Nin, "[redacted]");
  assert.equal(out.Full_Name, "[redacted]");
  assert.equal(out.DECISION, "approved");
});

test("no raw identity value survives anywhere in the redacted JSON", () => {
  const raw = { a: { b: { bvn: "22212345678" } }, list: [{ nin: "12345678901" }] };
  const serialized = JSON.stringify(redactKycPayload(raw));
  assert.equal(serialized.includes("22212345678"), false);
  assert.equal(serialized.includes("12345678901"), false);
});

test("scrubText masks long digit runs embedded in free text (value-based PII)", () => {
  assert.equal(scrubText("BVN is 22212345678 ok"), "BVN is [redacted-digits] ok");
  assert.equal(scrubText("ref ABC-12"), "ref ABC-12"); // short numbers untouched
});

test("scrubText masks separator-formatted IDs but NOT ISO timestamps", () => {
  assert.equal(scrubText("id 123-456-789 done"), "id [redacted-digits] done");
  assert.equal(scrubText("nin 123 456 7890"), "nin [redacted-digits]");
  // ISO timestamp (':' / 'T' break the run) is preserved.
  assert.equal(scrubText("at 2026-06-21T05:46:00 ok"), "at 2026-06-21T05:46:00 ok");
});

test("KYC extras include name/dob/document-number keys missing from the default set", () => {
  for (const k of ["firstName", "lastName", "fullName", "dateOfBirth", "documentNumber"]) {
    assert.ok(KYC_EXTRA_REDACT_KEYS.includes(k), `${k} should be a KYC extra`);
  }
});

// ---- minimizeVerdictJson: ALLOWLIST (the persisted verdict) ----

test("minimizeVerdictJson keeps only safe signal keys and DROPS everything else", () => {
  const out = minimizeVerdictJson({
    decision: "approved",
    achievedLevel: "L3",
    confidence: 0.98,
    reasonCodes: ["doc_authentic", "face_match"],
    // vendor-controlled PII fields — must be DROPPED, not just '[redacted]'
    bvn: "22212345678",
    fullName: "Ada Eze",
    address: "1 Airport Rd",
    rawDocumentImage: "data:image/png;base64,AAAA",
    unknownVendorField: { nin: "12345678901", note: "subject NIN 12345678901" },
  }) as Record<string, any>;
  assert.equal(out.decision, "approved");
  assert.equal(out.achievedLevel, "L3");
  assert.equal(out.confidence, 0.98);
  assert.deepEqual(out.reasonCodes, ["doc_authentic", "face_match"]);
  // dropped entirely
  for (const k of ["bvn", "fullName", "address", "rawDocumentImage", "unknownVendorField"]) {
    assert.equal(k in out, false, `${k} must be dropped`);
  }
});

test("minimizeVerdictJson is case-insensitive on the allowlist and scrubs retained string values", () => {
  const out = minimizeVerdictJson({
    DECISION: "approved",
    Reason: "verified; subject id 22212345678 matched", // allowlisted but free-text → scrub digits
    confidence: 0.9,
  }) as Record<string, any>;
  assert.equal(out.DECISION, "approved");
  assert.equal(out.confidence, 0.9);
  assert.equal((out.Reason ?? "").includes("22212345678"), false, "digit PII scrubbed from retained text");
});

test("minimizeVerdictJson recurses into nested safe objects (e.g. checks) and drops PII inside", () => {
  const out = minimizeVerdictJson({
    checks: { liveness: "passed", documentName: "Ada Eze", score: 0.95 },
  }) as Record<string, any>;
  assert.equal(out.checks.liveness, "passed");
  assert.equal(out.checks.score, 0.95);
  assert.equal("documentName" in out.checks, false, "PII key dropped inside a safe nested object");
});

test("a minimized verdict json never contains any raw identity number", () => {
  const out = minimizeVerdictJson({
    bvn: "22212345678",
    nested: { nin: "12345678901" },
    reasonCodes: ["ok 99999999999"],
  });
  assert.equal(JSON.stringify(out).includes("22212345678"), false);
  assert.equal(JSON.stringify(out).includes("12345678901"), false);
  assert.equal(JSON.stringify(out).includes("99999999999"), false); // scrubbed from retained array string
});
