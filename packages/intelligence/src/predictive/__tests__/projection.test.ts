import { test } from "node:test";
import assert from "node:assert/strict";

import { scoreDisputeLikelihood } from "../dispute";
import { assessQuality } from "../quality";
import { forecastWorkload } from "../workload";
import {
  assertNoRawScore,
  toStaffDisputeView,
  toStaffQualityView,
  toStaffWorkloadView,
} from "../projection";

test("OPACITY: the raw dispute likelihood never crosses the client boundary", () => {
  const scored = scoreDisputeLikelihood({
    transactionId: "t1",
    features: { amountKobo: 900_000, itemNotReceivedReported: true, deliveryConfirmationGapDays: 12 },
  });
  // The engine DOES compute a raw number, server-side.
  assert.ok(scored.likelihood > 0);
  assert.ok(scored.topFactors.every((f) => typeof f.weight === "number"));

  const view = toStaffDisputeView(scored);
  assert.equal("likelihood" in view, false, "the 0..1 score must be dropped");
  assert.equal(view.band, scored.band, "the band survives — that is the usable signal");
  assert.deepEqual(view.factors, scored.topFactors.map((f) => f.factor), "codes in rank order, no weights");
  assert.doesNotThrow(() => assertNoRawScore(view));
});

test("OPACITY: the quality staff view carries codes, never an internal score", () => {
  const assessed = assessQuality({
    unitType: "studio_project",
    unitId: "p1",
    signals: { hoursSinceProviderMessage: 200, milestoneOverdueDays: 5, priorComplaints: 1 },
  });
  const view = toStaffQualityView(assessed);
  assert.equal(view.riskBand, "high");
  assert.ok(view.reasons.length > 0, "reasons are the explanation the operator reads");
  assert.doesNotThrow(() => assertNoRawScore(view));
});

test("a workload forecast is an operational VOLUME, not a score about a person — counts cross", () => {
  const forecast = forecastWorkload({
    queue: "support",
    history: Array.from({ length: 200 }, (_, i) => ({
      at: new Date(Date.parse("2026-01-01T00:00:00.000Z") + i * 3_600_000).toISOString(),
      count: 5,
    })),
  });
  const view = toStaffWorkloadView(forecast);
  assert.ok(view.perHour.length > 0);
  assert.ok(view.perHour.every((p) => typeof p.predicted === "number"));
  assert.doesNotThrow(
    () => assertNoRawScore(view),
    "predicted/lowerCI/upperCI are volumes; no forbidden score key appears",
  );
});

test("assertNoRawScore actually catches a leak, at any depth", () => {
  assert.throws(() => assertNoRawScore({ likelihood: 0.9 }), /raw score key "likelihood"/);
  assert.throws(() => assertNoRawScore({ a: { b: [{ score: 1 }] } }), /raw score key "score"/);
  assert.throws(() => assertNoRawScore({ topFactors: [{ factor: "x", weight: 2 }] }), /raw score key "weight"/);
  assert.throws(() => assertNoRawScore({ model: { coefficients: {} } }), /raw score key "coefficients"/);
  assert.doesNotThrow(() => assertNoRawScore({ band: "high", reasons: ["milestone_overdue"] }));
  assert.doesNotThrow(() => assertNoRawScore(null));
  assert.doesNotThrow(() => assertNoRawScore(undefined));
});

test("NO CROSS-UNIT BLEED: each projection carries only its own subject id", () => {
  const a = toStaffDisputeView(scoreDisputeLikelihood({ transactionId: "txn-A", features: { amountKobo: 1 } }));
  const b = toStaffDisputeView(scoreDisputeLikelihood({ transactionId: "txn-B", features: { amountKobo: 1 } }));
  assert.equal(a.transactionId, "txn-A");
  assert.equal(b.transactionId, "txn-B");
  assert.equal(JSON.stringify(a).includes("txn-B"), false);
  assert.equal(JSON.stringify(b).includes("txn-A"), false);
});
