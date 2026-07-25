import { test } from "node:test";
import assert from "node:assert/strict";

import { auditImpressionFairness, computeCreatorShares } from "../fairness";
import type { FairnessImpression } from "../fairness";

/**
 * V3-35 gate — the fairness audit: a synthetic impression skew toward one
 * creator triggers an alert; balanced distributions and under-volume scopes
 * stay quiet; aggregates carry no user identity.
 */

function impressions(creatorKey: string, scope: string, count: number): FairnessImpression[] {
  return Array.from({ length: count }, () => ({ creatorKey, scope }));
}

test("V3-35 fairness: synthetic skew toward one creator triggers the alert", () => {
  const rows = [
    ...impressions("partner-a", "marketplace", 80),
    ...impressions("partner-b", "marketplace", 15),
    ...impressions("platform", "marketplace", 5),
  ];
  const alerts = auditImpressionFairness(rows, {
    maxCreatorImpressionShare: 0.4,
    minImpressionsForAlert: 50,
  });
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].creatorKey, "partner-a");
  assert.equal(alerts[0].scope, "marketplace");
  assert.equal(alerts[0].impressions, 80);
  assert.equal(alerts[0].totalImpressions, 100);
  assert.equal(alerts[0].share, 0.8);
});

test("V3-35 fairness: balanced distribution stays quiet", () => {
  const rows = [
    ...impressions("partner-a", "marketplace", 30),
    ...impressions("partner-b", "marketplace", 35),
    ...impressions("platform", "marketplace", 35),
  ];
  const alerts = auditImpressionFairness(rows, {
    maxCreatorImpressionShare: 0.4,
    minImpressionsForAlert: 50,
  });
  assert.deepEqual(alerts, []);
});

test("V3-35 fairness: under-volume scopes never alert (no noise pre-launch)", () => {
  const rows = impressions("partner-a", "care", 10); // 100% share, tiny volume
  const alerts = auditImpressionFairness(rows, {
    maxCreatorImpressionShare: 0.4,
    minImpressionsForAlert: 50,
  });
  assert.deepEqual(alerts, []);
});

test("V3-35 fairness: scopes audit independently; empty input yields nothing", () => {
  const rows = [
    ...impressions("partner-a", "marketplace", 60), // 100% of marketplace
    ...impressions("partner-a", "learn", 10),
    ...impressions("partner-b", "learn", 45),
  ];
  const alerts = auditImpressionFairness(rows, {
    maxCreatorImpressionShare: 0.4,
    minImpressionsForAlert: 50,
  });
  assert.equal(alerts.length, 2, "marketplace monopoly + learn partner-b (45/55) both flag");
  assert.deepEqual(
    alerts.map((a) => `${a.scope}:${a.creatorKey}`).sort(),
    ["learn:partner-b", "marketplace:partner-a"],
  );
  assert.deepEqual(auditImpressionFairness([], { maxCreatorImpressionShare: 0.4, minImpressionsForAlert: 1 }), []);
});

test("V3-35 fairness: shares are deterministic aggregates with no user fields", () => {
  const rows = [
    ...impressions("partner-b", "marketplace", 10),
    ...impressions("partner-a", "marketplace", 20),
  ];
  const shares = computeCreatorShares(rows);
  assert.deepEqual(
    shares.map((s) => ({ ...s })),
    [
      { scope: "marketplace", creatorKey: "partner-a", impressions: 20, share: 0.6667 },
      { scope: "marketplace", creatorKey: "partner-b", impressions: 10, share: 0.3333 },
    ],
  );
  for (const share of shares) {
    assert.deepEqual(Object.keys(share).sort(), ["creatorKey", "impressions", "scope", "share"]);
  }
});
