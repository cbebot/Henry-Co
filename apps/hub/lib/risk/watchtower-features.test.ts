import { test } from "node:test";
import assert from "node:assert/strict";

import { assessThreats, type ThreatDeviceRow, type ThreatLogRow } from "../security/threat-signals";
import { threatInvolvementsByAccount } from "./watchtower-features";

/**
 * V3-40 — one vocabulary, one engine: the mapper only attributes what the
 * watchtower detected. These tests run REAL detections through assessThreats
 * and prove per-account attribution (including the cross-user wall: an account
 * not involved in a signal never appears in the map).
 */

const NOW = Date.parse("2026-07-25T12:00:00.000Z");

function logRow(overrides: Partial<ThreatLogRow>): ThreatLogRow {
  return {
    userId: "user-a",
    eventType: "account_sign_in",
    ip: "203.0.113.9",
    country: "NG",
    location: "Lagos, NG",
    device: "Chrome",
    riskLevel: "low",
    category: "sign_in",
    reason: "",
    createdAt: new Date(NOW - 3_600_000).toISOString(),
    ...overrides,
  };
}

test("credential-spray attribution: every sprayed account appears; bystanders never do", () => {
  const logs: ThreatLogRow[] = ["user-a", "user-b", "user-c"].map((userId) =>
    logRow({ userId, ip: "198.51.100.7" }),
  );
  // A bystander on a DIFFERENT ip must not be attributed.
  logs.push(logRow({ userId: "user-bystander", ip: "203.0.113.50" }));
  const assessment = assessThreats(logs, [], { nowMs: NOW });
  const byAccount = threatInvolvementsByAccount(assessment);

  for (const userId of ["user-a", "user-b", "user-c"]) {
    const threats = byAccount.get(userId);
    assert.ok(threats && threats.some((t) => t.kind === "credential_spray"), userId);
  }
  assert.equal(byAccount.has("user-bystander"), false, "uninvolved accounts are never attributed");
});

test("revoked-device reuse attributes the device owner with critical severity", () => {
  const devices: ThreatDeviceRow[] = [
    {
      userId: "user-x",
      deviceId: "dev-1",
      firstCountry: "NG",
      firstSeenAt: new Date(NOW - 40 * 86_400_000).toISOString(),
      lastSeenAt: new Date(NOW - 3_600_000).toISOString(),
      trustedAt: null,
      revokedAt: new Date(NOW - 2 * 86_400_000).toISOString(),
    },
  ];
  const assessment = assessThreats([], devices, { nowMs: NOW });
  const byAccount = threatInvolvementsByAccount(assessment);
  const threats = byAccount.get("user-x");
  assert.ok(threats);
  const reuse = threats?.find((t) => t.kind === "revoked_reuse");
  assert.equal(reuse?.severity, "critical");
  assert.equal(reuse?.evidenceCount, 1);
});

test("an empty assessment attributes nothing", () => {
  const assessment = assessThreats([], [], { nowMs: NOW });
  assert.equal(threatInvolvementsByAccount(assessment).size, 0);
});
