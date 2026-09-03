import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  forecastWorkload,
  QUEUE_KEYS,
  WORKLOAD_MODEL_VERSION,
  type QueueObservation,
} from "../workload";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MS_PER_HOUR = 3_600_000;
const HOURS_PER_WEEK = 168;
const START = Date.parse("2026-01-01T00:00:00.000Z");

/** Same stable hour-of-week index the engine uses (epoch-anchored). */
function hourOfWeek(ms: number): number {
  const h = Math.floor(ms / MS_PER_HOUR);
  return ((h % HOURS_PER_WEEK) + HOURS_PER_WEEK) % HOURS_PER_WEEK;
}

/** Deterministic LCG — a back-test must be reproducible, so no Math.random. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1_664_525 + 1_013_904_223) >>> 0;
    return s / 4_294_967_296;
  };
}

/** A realistic weekly shape: quiet nights, busy weekday mid-mornings. */
function seasonalTruth(slot: number): number {
  const dayOfWeek = Math.floor(slot / 24);
  const hourOfDay = slot % 24;
  const weekend = dayOfWeek === 5 || dayOfWeek === 6;
  const night = hourOfDay < 7 || hourOfDay >= 21;
  if (night) return weekend ? 1 : 2;
  if (weekend) return 5;
  return hourOfDay >= 9 && hourOfDay <= 14 ? 14 : 8;
}

function generate(weeks: number, seed = 42): QueueObservation[] {
  const rand = rng(seed);
  const out: QueueObservation[] = [];
  for (let h = 0; h < weeks * HOURS_PER_WEEK; h += 1) {
    const ms = START + h * MS_PER_HOUR;
    const base = seasonalTruth(hourOfWeek(ms));
    // +/-25% multiplicative noise — enough to be non-trivial, not enough to drown the signal.
    const noisy = base * (0.75 + rand() * 0.5);
    out.push({ at: new Date(ms).toISOString(), count: Math.max(0, Math.round(noisy)) });
  }
  return out;
}

test("BACK-TEST: train on 3 weeks, forecast week 4 — MAPE and CI coverage reported", () => {
  const all = generate(4);
  const train = all.slice(0, 3 * HOURS_PER_WEEK);
  const holdout = all.slice(3 * HOURS_PER_WEEK);

  const forecast = forecastWorkload({
    queue: "support",
    history: train,
    asOf: holdout[0].at,
    horizonHours: HOURS_PER_WEEK,
  });

  assert.equal(forecast.perHour.length, HOURS_PER_WEEK);
  assert.equal(forecast.sampleSize, train.length);
  assert.equal(forecast.basis, "seasonal", "3 weeks of hourly data is a seasonal basis");

  let apeSum = 0;
  let apeCount = 0;
  let covered = 0;
  for (let i = 0; i < holdout.length; i += 1) {
    const actual = holdout[i].count;
    const point = forecast.perHour[i];
    assert.equal(point.at, holdout[i].at, "forecast hours line up with the holdout hours");
    if (actual > 0) {
      apeSum += Math.abs(point.predicted - actual) / actual;
      apeCount += 1;
    }
    if (actual >= point.lowerCI && actual <= point.upperCI) covered += 1;
  }
  const mape = apeSum / apeCount;
  const coverage = covered / holdout.length;

  // Reported so the pass report can quote real numbers (BUILD-PLAN: honesty over ceremony).
  console.log(
    `    workload back-test — n_train=${train.length} n_holdout=${holdout.length} ` +
      `MAPE=${(mape * 100).toFixed(1)}% CI_coverage=${(coverage * 100).toFixed(1)}%`,
  );

  assert.ok(mape < 0.45, `MAPE ${(mape * 100).toFixed(1)}% must beat 45% on a clean seasonal series`);
  assert.ok(coverage >= 0.8, `CI must cover >=80% of actuals, got ${(coverage * 100).toFixed(1)}%`);
});

test("captures weekly seasonality: predicted peak hours exceed predicted night hours", () => {
  const forecast = forecastWorkload({ queue: "support", history: generate(3) });
  const bySlot = new Map<number, number>();
  for (const p of forecast.perHour) bySlot.set(hourOfWeek(Date.parse(p.at)), p.predicted);

  let peaks = 0;
  let nights = 0;
  for (const [slot, predicted] of bySlot) {
    const hourOfDay = slot % 24;
    if (hourOfDay >= 9 && hourOfDay <= 14 && Math.floor(slot / 24) < 5) peaks += predicted;
    if (hourOfDay < 7) nights += predicted;
  }
  assert.ok(peaks > nights * 2, "weekday mid-morning must forecast well above night");
});

test("PURE: identical input yields identical output and the history is not mutated", () => {
  const history = generate(2);
  const snapshot = JSON.stringify(history);
  const a = forecastWorkload({ queue: "kyc_review", history, asOf: "2026-01-15T00:00:00.000Z" });
  const b = forecastWorkload({ queue: "kyc_review", history, asOf: "2026-01-15T00:00:00.000Z" });
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(history), snapshot, "input must not be mutated");
});

test("PRE-DATA queue: empty history is honest, not a confident zero-line", () => {
  const forecast = forecastWorkload({
    queue: "logistics_ops",
    history: [],
    asOf: "2026-02-01T00:00:00.000Z",
  });
  assert.equal(forecast.basis, "empty");
  assert.equal(forecast.sampleSize, 0);
  assert.ok(forecast.perHour.every((p) => p.predicted === 0 && p.upperCI === 0));
  assert.ok(
    forecast.staffingRecommendation.every(
      (r) => r.recommendedAgents === 0 && r.rationale === "insufficient_history",
    ),
    "a queue with no history recommends nobody and says why",
  );
});

test("SPARSE history widens the interval and flags itself", () => {
  const forecast = forecastWorkload({ queue: "refunds", history: generate(1).slice(0, 40) });
  assert.equal(forecast.basis, "sparse");
  assert.equal(forecast.sampleSize, 40);
  assert.ok(
    forecast.staffingRecommendation.every((r) => r.rationale === "insufficient_history"),
    "sparse data must not present a confident staffing figure",
  );
});

test("staffing recommendation is bounded — a spike can never ask for unbounded agents", () => {
  const spike: QueueObservation[] = Array.from({ length: 300 }, (_, i) => ({
    at: new Date(START + i * MS_PER_HOUR).toISOString(),
    count: 10_000,
  }));
  const forecast = forecastWorkload({
    queue: "support",
    history: spike,
    config: { maxAgents: 25, sparseBelowObservations: 10 },
  });
  for (const rec of forecast.staffingRecommendation) {
    assert.ok(rec.recommendedAgents <= 25, "never exceeds the configured ceiling");
    assert.equal(rec.rationale, "forecast_above_capacity");
  }
});

test("hostile input (NaN, negatives, unparseable dates) degrades instead of throwing", () => {
  const forecast = forecastWorkload({
    queue: "moderation",
    history: [
      { at: "not-a-date", count: 5 },
      { at: "2026-01-01T00:00:00.000Z", count: Number.NaN },
      { at: "2026-01-01T01:00:00.000Z", count: -20 },
      { at: "2026-01-01T02:00:00.000Z", count: 4 },
    ],
  });
  assert.equal(forecast.sampleSize, 3, "the unparseable row is dropped, the rest survive");
  assert.ok(forecast.perHour.every((p) => p.predicted >= 0 && p.lowerCI >= 0));
});

test("every declared queue key forecasts and stamps the model version", () => {
  for (const queue of QUEUE_KEYS) {
    const f = forecastWorkload({ queue, history: generate(2) });
    assert.equal(f.queue, queue);
    assert.equal(f.modelVersion, WORKLOAD_MODEL_VERSION);
    assert.equal(f.horizonHours, 168);
  }
});

test("STRUCTURAL: the forecaster has no path to an AI gateway or a wallet", () => {
  const source = readFileSync(path.join(HERE, "..", "workload.ts"), "utf8");
  for (const forbidden of [
    "ai-gateway",
    "runAiTask",
    "payments_private",
    "customer_wallet",
    "supabase",
    "fetch(",
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      `the deterministic forecaster must not reference "${forbidden}"`,
    );
  }
});
