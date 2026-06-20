import { test } from "node:test";
import assert from "node:assert/strict";

import { InternalKycAdapter } from "../provider/internal-adapter";

function makeAdapter() {
  return new InternalKycAdapter({ now: () => new Date("2026-06-20T05:46:00.000Z") });
}

test("identifies as the internal vendor and covers all countries/doc types as a fallback", () => {
  const a = makeAdapter();
  assert.equal(a.vendorKey, "internal");
  assert.ok(a.supportedCountries.includes("*"));
  assert.ok(a.supportedDocumentTypes.length > 0);
});

test("initiateVerification mints a deterministic session from the idempotency key (no live call)", async () => {
  const a = makeAdapter();
  const input = {
    userId: "u1",
    country: "NG",
    documentTypes: ["nin"] as const,
    requestedLevel: "L3" as const,
    idempotencyKey: "idem-1",
  };
  const s1 = await a.initiateVerification(input);
  const s2 = await a.initiateVerification(input);
  assert.equal(s1.vendorSessionId, s2.vendorSessionId, "same idempotency key → same session id");
  assert.ok(s1.clientToken.length > 0);
  assert.ok(Date.parse(s1.expiresAt) > Date.parse("2026-06-20T05:46:00.000Z"));
});

test("fetchResult resolves to manual_review (staff queue decides), never auto-approves", async () => {
  const a = makeAdapter();
  const r = await a.fetchResult("any-session");
  assert.equal(r.decision, "manual_review");
  assert.equal(r.achievedLevel, "L0");
});

test("verifyWebhook is refused — the internal adapter has no vendor webhook ingress", async () => {
  const a = makeAdapter();
  await assert.rejects(() => a.verifyWebhook("{}", {}));
});
