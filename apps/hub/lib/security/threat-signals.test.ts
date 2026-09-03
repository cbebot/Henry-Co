import { test } from "node:test";
import assert from "node:assert/strict";

import { assessThreats, type ThreatLogRow, type ThreatDeviceRow } from "./threat-signals";

const NOW = Date.UTC(2026, 6, 16, 12, 0, 0);
const iso = (minutesAgo: number) => new Date(NOW - minutesAgo * 60_000).toISOString();

function log(partial: Partial<ThreatLogRow>): ThreatLogRow {
  return {
    userId: "u",
    eventType: "account_sign_in",
    ip: "",
    country: "",
    location: "",
    device: "",
    riskLevel: "low",
    category: "sign_in",
    reason: "",
    createdAt: iso(1),
    ...partial,
  };
}

function device(partial: Partial<ThreatDeviceRow>): ThreatDeviceRow {
  return {
    userId: "u",
    deviceId: "d",
    firstCountry: "NG",
    firstSeenAt: iso(1000),
    lastSeenAt: iso(1),
    trustedAt: null,
    revokedAt: null,
    ...partial,
  };
}

test("calm when nothing is wrong", () => {
  const a = assessThreats(
    [log({ userId: "a", ip: "1.1.1.1", userLabel: "Ada" })],
    [device({ userId: "a", deviceId: "da" })],
    { nowMs: NOW },
  );
  assert.equal(a.posture, "calm");
  assert.equal(a.signals.length, 0);
  assert.ok(a.blindSpots.length >= 1, "always honest about blind spots");
});

test("credential spray — one IP, many accounts", () => {
  const logs = ["a", "b", "c", "d", "e"].map((u) =>
    log({ userId: u, userLabel: u.toUpperCase(), ip: "9.9.9.9" }),
  );
  const a = assessThreats(logs, [], { nowMs: NOW });
  const spray = a.signals.find((s) => s.kind === "credential_spray");
  assert.ok(spray, "expected a credential_spray signal");
  assert.equal(spray!.evidenceCount, 5);
  assert.equal(spray!.severity, "warning"); // >=5 accounts
  assert.equal(a.metrics.distinctSprayIps, 1);
});

test("sign-outs do not count as spray", () => {
  const logs = ["a", "b", "c"].map((u) =>
    log({ userId: u, ip: "8.8.8.8", eventType: "account_sign_out", category: "session" }),
  );
  const a = assessThreats(logs, [], { nowMs: NOW });
  assert.equal(a.signals.filter((s) => s.kind === "credential_spray").length, 0);
});

test("shared device — one cookie, many accounts", () => {
  const devices = ["a", "b", "c"].map((u) => device({ userId: u, deviceId: "shared", userLabel: u }));
  const a = assessThreats([], devices, { nowMs: NOW });
  const shared = a.signals.find((s) => s.kind === "shared_device");
  assert.ok(shared);
  assert.equal(shared!.severity, "critical"); // >=3 accounts
  assert.equal(a.metrics.sharedDevices, 1);
});

test("impossible travel — two countries, short gap", () => {
  const logs = [
    log({ userId: "a", userLabel: "Ada", country: "NG", createdAt: iso(90) }),
    log({ userId: "a", userLabel: "Ada", country: "US", createdAt: iso(30) }), // 60m apart
  ];
  const a = assessThreats(logs, [], { nowMs: NOW });
  const travel = a.signals.find((s) => s.kind === "impossible_travel");
  assert.ok(travel);
  assert.equal(travel!.severity, "critical"); // <=60m
  assert.equal(a.metrics.impossibleTravelAccounts, 1);
});

test("impossible travel reads country from 'City, CC' location", () => {
  const logs = [
    log({ userId: "a", location: "Lagos, NG", createdAt: iso(120) }),
    log({ userId: "a", location: "Berlin, DE", createdAt: iso(60) }), // 60m
  ];
  const a = assessThreats(logs, [], { nowMs: NOW });
  assert.ok(a.signals.some((s) => s.kind === "impossible_travel"));
});

test("same country is not impossible travel", () => {
  const logs = [
    log({ userId: "a", location: "Lagos, NG", createdAt: iso(120) }),
    log({ userId: "a", location: "Abuja, NG", createdAt: iso(60) }),
  ];
  const a = assessThreats(logs, [], { nowMs: NOW });
  assert.equal(a.signals.filter((s) => s.kind === "impossible_travel").length, 0);
});

test("revoked device reuse is critical", () => {
  const d = device({
    userId: "a",
    deviceId: "zombie",
    revokedAt: iso(1000),
    lastSeenAt: iso(10), // seen well after revocation
  });
  const a = assessThreats([], [d], { nowMs: NOW });
  const reuse = a.signals.find((s) => s.kind === "revoked_reuse");
  assert.ok(reuse);
  assert.equal(reuse!.severity, "critical");
  assert.equal(a.metrics.revokedReuse, 1);
});

test("revoked device NOT reused is silent", () => {
  const d = device({ userId: "a", deviceId: "dead", revokedAt: iso(10), lastSeenAt: iso(1000) });
  const a = assessThreats([], [d], { nowMs: NOW });
  assert.equal(a.metrics.revokedReuse, 0);
});

test("new-device alert burst", () => {
  const logs = Array.from({ length: 5 }, (_, i) =>
    log({ userId: "a", userLabel: "Ada", eventType: "new_device_sign_in_alert", createdAt: iso(i * 10 + 1) }),
  );
  const a = assessThreats(logs, [], { nowMs: NOW });
  const burst = a.signals.find((s) => s.kind === "new_device_alert");
  assert.ok(burst);
  assert.equal(burst!.severity, "warning"); // >=5
});

test("password-reset pressure", () => {
  const logs = Array.from({ length: 4 }, () =>
    log({ userId: "a", userLabel: "Ada", eventType: "account_password_reset_request" }),
  );
  const a = assessThreats(logs, [], { nowMs: NOW });
  assert.ok(a.signals.some((s) => s.kind === "reset_pressure"));
});

test("high-risk cluster surfaces above threshold", () => {
  const logs = Array.from({ length: 10 }, (_, i) =>
    log({ userId: `u${i}`, riskLevel: "high", category: "alert" }),
  );
  const a = assessThreats(logs, [], { nowMs: NOW });
  assert.ok(a.signals.some((s) => s.kind === "high_risk_cluster"));
});

test("critical outranks warning in ordering and posture", () => {
  const logs = ["a", "b", "c", "d", "e"].map((u) => log({ userId: u, ip: "7.7.7.7" })); // warning spray
  const devices = ["a", "b", "c"].map((u) => device({ userId: u, deviceId: "shared" })); // critical shared
  const a = assessThreats(logs, devices, { nowMs: NOW });
  assert.equal(a.posture, "critical");
  assert.equal(a.signals[0].severity, "critical");
});

test("events outside the window are excluded", () => {
  const logs = ["a", "b", "c"].map((u) => log({ userId: u, ip: "6.6.6.6", createdAt: iso(60 * 24 * 40) })); // 40d ago
  const a = assessThreats(logs, [], { nowMs: NOW, windowDays: 30 });
  assert.equal(a.signals.filter((s) => s.kind === "credential_spray").length, 0);
  assert.equal(a.metrics.eventsAnalyzed, 0);
});
