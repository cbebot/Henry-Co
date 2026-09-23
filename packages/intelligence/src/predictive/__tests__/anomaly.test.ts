import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  detectAnomalies,
  detectAnomaliesForSeries,
  firedAnomalies,
  ANOMALY_SERIES_KEYS,
  type SeriesPoint,
} from "../anomaly";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DAY = 86_400_000;
const START = Date.parse("2026-01-01T00:00:00.000Z");

/** Deterministic LCG — a back-test must be reproducible, so never Math.random. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1_664_525 + 1_013_904_223) >>> 0;
    return s / 4_294_967_296;
  };
}

function seriesOf(values: number[], startMs = START): SeriesPoint[] {
  return values.map((value, i) => ({ at: new Date(startMs + i * DAY).toISOString(), value }));
}

/** A stable series: noisy but with no real incident in it. */
function stableSeries(n: number, seed: number, level = 20, spread = 0.18): SeriesPoint[] {
  const rand = rng(seed);
  return seriesOf(
    Array.from({ length: n }, () => Math.max(0, Math.round(level * (1 - spread + rand() * spread * 2)))),
  );
}

test("a synthetic spike is DETECTED and banded alert", () => {
  const points = stableSeries(30, 11);
  points.push({ at: new Date(START + 30 * DAY).toISOString(), value: 120 }); // 6x baseline
  const [result] = detectAnomalies(points, { series: "refund_requests" });
  assert.equal(result.detected, true, "a 6x spike must fire");
  assert.equal(result.band, "alert");
  assert.equal(result.series, "refund_requests");
  assert.ok(result.deviation > 3.5, `deviation ${result.deviation} should clear the alert bar`);
  assert.ok(result.expected > 0 && result.expected < 40, "expected tracks the baseline, not the spike");
  assert.equal(result.basis, "robust");
  assert.equal(result.baselineCount, 30);
});

test("bands follow the CONFIGURED thresholds, not a hard-coded magnitude", () => {
  // Asserting "value 27 is a watch" would silently depend on whatever MAD this
  // seed happens to produce. Pin the bars instead and assert the banding
  // contract, which is the behaviour that actually matters.
  const points = stableSeries(30, 12, 20, 0.1);
  points.push({ at: new Date(START + 30 * DAY).toISOString(), value: 27 });
  // This fixture is deliberately TIGHTER than any count process (±10% at 20);
  // the Poisson floor would rightly call 27 noise, so the banding contract is
  // pinned with count semantics off.
  const opts = { series: "support_volume", countData: false } as const;

  const strict = detectAnomalies(points, { ...opts, watchAt: 2.5, alertAt: 3.5 })[0];
  assert.equal(strict.detected, true);
  assert.equal(strict.band, "alert", `z=${strict.deviation} clears the 3.5 alert bar`);

  // Same point, a far higher alert bar: still an anomaly, but only a watch.
  const lenient = detectAnomalies(points, { ...opts, watchAt: 2.5, alertAt: 25 })[0];
  assert.equal(lenient.detected, true);
  assert.equal(lenient.band, "watch", "detected but below the alert bar => watch");
  assert.equal(lenient.deviation, strict.deviation, "the measurement is identical; only the banding moved");

  // And a bar above the observation silences it entirely.
  const quiet = detectAnomalies(points, { series: "support_volume", watchAt: 25, alertAt: 30 })[0];
  assert.equal(quiet.detected, false, "below the watch bar => not an anomaly");
});

test("BACK-TEST: false-positive rate on stable series stays low", () => {
  // The spec's gate: "back-test confirms low false-positive rate on stable
  // series". 300 independent stable series, each judged on its final point.
  // Every fire here is by construction a FALSE positive — there is no incident.
  let fired = 0;
  const trials = 300;
  for (let i = 0; i < trials; i += 1) {
    const results = detectAnomalies(stableSeries(30, 1000 + i), { series: "support_volume" });
    if (results[0]?.detected) fired += 1;
  }
  const falsePositiveRate = fired / trials;
  console.log(
    `    anomaly back-test — stable series n=${trials} false positives=${fired} ` +
      `rate=${(falsePositiveRate * 100).toFixed(1)}%`,
  );
  assert.ok(
    falsePositiveRate <= 0.05,
    `false-positive rate ${(falsePositiveRate * 100).toFixed(1)}% must stay at or below 5% — ` +
      "a banner that cries wolf trains operators to ignore it",
  );
});

test("BACK-TEST: true-positive rate on seeded incidents is high", () => {
  let caught = 0;
  const trials = 200;
  for (let i = 0; i < trials; i += 1) {
    const points = stableSeries(30, 5000 + i);
    const baselineLevel = points[points.length - 1].value;
    // A real incident: 4x the running level.
    points.push({ at: new Date(START + 30 * DAY).toISOString(), value: baselineLevel * 4 });
    if (detectAnomalies(points, { series: "dispute_rate" })[0]?.detected) caught += 1;
  }
  const recall = caught / trials;
  console.log(`    anomaly back-test — seeded incidents n=${trials} caught=${caught} recall=${(recall * 100).toFixed(1)}%`);
  assert.ok(recall >= 0.95, `recall ${(recall * 100).toFixed(1)}% below 95%`);
});

test("ROBUSTNESS: a prior outlier in the baseline does not mask a new spike", () => {
  // This is the whole reason for median+MAD over mean+stdev. One huge historical
  // outlier inflates a standard deviation enough to hide the next real spike.
  const points = stableSeries(30, 21, 20, 0.1);
  points[5] = { at: points[5].at, value: 5000 }; // a past incident still in the window
  points.push({ at: new Date(START + 30 * DAY).toISOString(), value: 120 });
  const [result] = detectAnomalies(points, { series: "report_volume" });
  assert.equal(result.detected, true, "MAD must survive a contaminated baseline");
  assert.ok(result.expected < 50, `median centre should ignore the 5000 outlier, got ${result.expected}`);
});

test("a FLAT series never fires — a constant has no outliers", () => {
  const points = seriesOf(Array.from({ length: 30 }, () => 7));
  points.push({ at: new Date(START + 30 * DAY).toISOString(), value: 7 });
  const [result] = detectAnomalies(points, { series: "support_volume" });
  assert.equal(result.detected, false);
  assert.equal(result.basis, "flat_series");
  assert.equal(Number.isFinite(result.deviation), true, "must never emit Infinity from a zero scale");
});

test("a jump off a flat line still fires via the stdev fallback", () => {
  const points = seriesOf([7, 7, 7, 7, 7, 7, 7, 7, 7, 8, 7, 7, 8, 7, 7]);
  points.push({ at: new Date(START + 20 * DAY).toISOString(), value: 400 });
  const [result] = detectAnomalies(points, { series: "enforcement_actions" });
  assert.equal(result.detected, true);
  assert.equal(result.basis, "stdev_fallback", "MAD was 0, so stdev carried the verdict");
});

test("INSUFFICIENT history is reported as such, never as an all-clear", () => {
  const [result] = detectAnomalies(seriesOf([1, 2, 3]), { series: "refund_requests" });
  assert.equal(result.detected, false);
  assert.equal(result.basis, "insufficient_history");
  assert.equal(result.windowDescription, "window_insufficient");
  assert.equal(result.baselineCount, 2);
});

test("direction: a COLLAPSE is ignored by default, caught with direction 'both'", () => {
  const points = stableSeries(30, 31, 100, 0.05);
  points.push({ at: new Date(START + 30 * DAY).toISOString(), value: 1 });
  assert.equal(detectAnomalies(points, { series: "support_volume" })[0].detected, false, "up-only by default");
  const both = detectAnomalies(points, { series: "support_volume", direction: "both" })[0];
  assert.equal(both.detected, true, "a collapse can mean a broken form — opt-in catches it");
  assert.ok(both.deviation < 0, "a downward move reports a NEGATIVE deviation");
});

test("the spike is judged against points BEFORE it, never a baseline containing itself", () => {
  const points = stableSeries(30, 41, 20, 0.1);
  points.push({ at: new Date(START + 30 * DAY).toISOString(), value: 500 });
  const [result] = detectAnomalies(points, { series: "refund_requests" });
  assert.equal(result.baselineCount, 30, "baseline excludes the evaluated point");
  assert.ok(result.expected < 40, "a self-inclusive baseline would have dragged `expected` upward");
});

test("evaluating several trailing points returns one verdict each", () => {
  const points = stableSeries(30, 51);
  points.push({ at: new Date(START + 30 * DAY).toISOString(), value: 200 });
  points.push({ at: new Date(START + 31 * DAY).toISOString(), value: 18 });
  const results = detectAnomalies(points, { series: "support_volume", evaluate: 2 });
  assert.equal(results.length, 2);
  assert.equal(results[0].detected, true, "the spike fires");
  assert.equal(results[1].detected, false, "the return to normal does not");
});

test("PURE: identical input yields identical output and the series is not mutated", () => {
  const points = stableSeries(30, 61);
  const snapshot = JSON.stringify(points);
  const a = detectAnomalies(points, { series: "dispute_rate" });
  const b = detectAnomalies(points, { series: "dispute_rate" });
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(points), snapshot, "input must not be mutated");
});

test("HOSTILE input degrades instead of throwing, and every number stays finite", () => {
  const hostile: SeriesPoint[] = [
    { at: "not-a-date", value: 5 },
    { at: "2026-01-01T00:00:00.000Z", value: Number.NaN },
    { at: "2026-01-02T00:00:00.000Z", value: Number.POSITIVE_INFINITY },
    { at: "2026-01-03T00:00:00.000Z", value: -1e308 },
    { at: "2026-01-04T00:00:00.000Z", value: 1e308 },
    ...seriesOf([10, 11, 9, 10, 12, 10, 11, 10], Date.parse("2026-02-01T00:00:00.000Z")),
    { at: "2026-03-01T00:00:00.000Z", value: 1e308 },
  ];
  const results = detectAnomalies(hostile, { series: "refund_requests" });
  for (const r of results) {
    assert.ok(Number.isFinite(r.deviation), "deviation must be finite");
    assert.ok(Number.isFinite(r.observed), "observed must be finite");
    assert.ok(Number.isFinite(r.expected), "expected must be finite");
    assert.ok(Math.abs(r.deviation) <= 50, "deviation is capped");
  }
});

test("hostile OPTIONS degrade to the defaults rather than inverting the bands", () => {
  const points = stableSeries(30, 71);
  points.push({ at: new Date(START + 30 * DAY).toISOString(), value: 200 });
  for (const opts of [
    { watchAt: Number.NaN, alertAt: Number.NaN },
    { watchAt: 5, alertAt: 1 }, // alert BELOW watch — nonsensical
    { watchAt: -3, alertAt: Number.POSITIVE_INFINITY },
    { minBaseline: -10, evaluate: -5 },
  ]) {
    const results = detectAnomalies(points, { series: "refund_requests", ...opts });
    assert.ok(results.length >= 1, "must still produce a verdict");
    for (const r of results) {
      assert.ok(Number.isFinite(r.deviation));
      assert.ok(r.band === "watch" || r.band === "alert");
    }
  }
});

test("empty / non-array input yields no results rather than throwing", () => {
  assert.deepEqual(detectAnomalies([], { series: "x" }), []);
  assert.deepEqual(detectAnomalies(undefined as never, { series: "x" }), []);
  assert.deepEqual(detectAnomalies(null as never), []);
});

test("multi-series helper tags each result and firedAnomalies filters to the real ones", () => {
  const quiet = stableSeries(30, 81);
  const spiked = stableSeries(30, 82);
  spiked.push({ at: new Date(START + 30 * DAY).toISOString(), value: 400 });
  const results = detectAnomaliesForSeries([
    { series: "support_volume", points: quiet },
    { series: "refund_requests", points: spiked },
  ]);
  assert.equal(results.length, 2);
  assert.deepEqual(results.map((r) => r.series), ["support_volume", "refund_requests"]);
  const fired = firedAnomalies(results);
  assert.equal(fired.length, 1);
  assert.equal(fired[0].series, "refund_requests");
});

test("windowDescription is a CODE, never operator-facing English", () => {
  const points = stableSeries(30, 91);
  const [result] = detectAnomalies(points, { series: "support_volume" });
  assert.match(result.windowDescription, /^window_[a-z_]+$/, "must be a localisation key");
  assert.equal(/[A-Z ]/.test(result.windowDescription), false, "no prose, no capitals, no spaces");
});

test("every declared series key is a usable label", () => {
  assert.ok(ANOMALY_SERIES_KEYS.length >= 5);
  for (const key of ANOMALY_SERIES_KEYS) {
    const [r] = detectAnomalies(stableSeries(30, 101), { series: key });
    assert.equal(r.series, key);
  }
});

test("STRUCTURAL: the detector has no path to an AI gateway, a wallet or a database", () => {
  const source = readFileSync(path.join(HERE, "..", "anomaly.ts"), "utf8");
  for (const forbidden of [
    "ai-gateway",
    "runAiTask",
    "supabase",
    "fetch(",
    "Date.now",
    "Math.random",
    "customer_wallet",
  ]) {
    assert.equal(source.includes(forbidden), false, `the detector must not reference "${forbidden}"`);
  }
});

// ── round-1 regression: count data needs a spread floor ─────────────────────

test("ROUND-1: a near-empty queue's next single item is NOISE, not an alert", () => {
  const quiet = seriesOf([...Array.from({ length: 26 }, () => 0), 1]);
  quiet.push({ at: new Date(START + 27 * DAY).toISOString(), value: 2 });
  const [a] = detectAnomalies(quiet, { series: "refund_requests" });
  assert.equal(a.detected, false, `0,0,...,1 then 2 must not fire (got z=${a.deviation})`);

  const single = seriesOf([...Array.from({ length: 26 }, () => 0), 1, 0]);
  single.push({ at: new Date(START + 28 * DAY).toISOString(), value: 1 });
  assert.equal(detectAnomalies(single, { series: "kyc_submissions" })[0].detected, false);
});

test("ROUND-1: a FLAT queue suddenly flooded DOES fire", () => {
  const flat = seriesOf(Array.from({ length: 27 }, () => 0));
  flat.push({ at: new Date(START + 27 * DAY).toISOString(), value: 500 });
  const [a] = detectAnomalies(flat, { series: "support_volume" });
  assert.equal(a.detected, true, "0 -> 500 is the incident the banner exists for");
  assert.equal(a.band, "alert");
  assert.equal(a.basis, "flat_series");
  assert.ok(Number.isFinite(a.deviation) && a.deviation <= 50);
});

// ── Adversarial round 2: realistic COUNT noise at low volume ────────────────

/** Deterministic Poisson draws (Knuth), seeded — the FP rate must be reproducible. */
function poissonSeries(length: number, level: number, seed: number): SeriesPoint[] {
  let state = seed >>> 0 || 1;
  const rand = (): number => {
    state = (Math.imul(state ^ (state >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    state = Math.imul(state ^ (state >>> 13), 3266489909) >>> 0;
    return ((state ^ (state >>> 16)) >>> 0) / 4294967296;
  };
  return Array.from({ length }, (_, i) => {
    const limit = Math.exp(-level);
    let k = 0;
    let p = rand();
    while (p > limit) {
      k += 1;
      p *= rand();
    }
    return { at: new Date(START + i * DAY).toISOString(), value: k };
  });
}

test("BACK-TEST: Poisson counts at 1–8/day stay under the 5% watch gate (round 2)", () => {
  // Round 2 measured 5.1–5.4% at five a day: integer MAD under-states the
  // noise of small counts. The sqrt(median) floor is what holds this gate.
  for (const level of [1, 2, 3, 4, 5, 6, 8, 20]) {
    let watch = 0;
    let alert = 0;
    const trials = 2000;
    for (let i = 0; i < trials; i += 1) {
      const [result] = detectAnomalies(poissonSeries(28, level, level * 100_003 + i), { series: "support_volume" });
      if (result.detected) watch += 1;
      if (result.detected && result.band === "alert") alert += 1;
    }
    assert.ok(watch / trials < 0.05, `level ${level}: watch FP ${(watch / trials * 100).toFixed(1)}% must stay < 5%`);
    assert.ok(alert / trials < 0.01, `level ${level}: alert FP ${(alert / trials * 100).toFixed(1)}% must stay < 1%`);
  }
});

test("Poisson floor still fires on a real flood at low volume", () => {
  const points = poissonSeries(27, 5, 42);
  points.push({ at: new Date(START + 27 * DAY).toISOString(), value: 20 });
  const [result] = detectAnomalies(points, { series: "support_volume" });
  assert.equal(result.detected, true, "5/day -> 20 is a real spike");
  assert.equal(result.band, "alert");
});
