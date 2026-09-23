/**
 * V3-42 S2 — the statistical anomaly detector (ARCHITECTURE §5.5).
 *
 * Answers one question for an operator: "is what I'm looking at right now
 * actually unusual, or does it only feel unusual?" It compares the most recent
 * observation(s) against a rolling baseline of the same series.
 *
 * Design decisions, and why:
 *
 *   1. ROBUST BY DEFAULT (median + MAD, not mean + stdev). The mean and standard
 *      deviation are themselves dragged by the very spike being hunted, so a
 *      single huge outlier inflates sigma and HIDES itself. Median absolute
 *      deviation has a ~50% breakdown point: half the baseline can be garbage
 *      and the centre still holds. For an alerting system that is the difference
 *      between catching an incident and sleeping through it.
 *   2. NO AI. Arithmetic over the caller's series. No gateway import exists in
 *      this file and there is no injection point for one.
 *   3. PURE + DETERMINISTIC. No clock, no randomness, no I/O — the same series
 *      always yields the same verdict, which is what makes the back-test real.
 *   4. FAIL QUIET, NOT LOUD. Too little history, a flat series, or hostile input
 *      yields `detected: false`. A false alarm trains operators to ignore the
 *      banner, which is worse than no banner at all.
 *   5. CODES, NOT PROSE. `windowDescription` is a localisation CODE, not English
 *      — the operator copy module turns it into a sentence. Same posture as
 *      V3-41's reason codes; it is what keeps `i18n:check:strict` green.
 *
 * Hardening note: every numeric guard here was written deliberately against the
 * four defects V3-41's adversarial fuzzing found in its sibling engines (a
 * non-finite config value poisoning the whole output; `round` overflowing to
 * Infinity because the multiply happens before the divide). The same fuzz runs
 * against this engine.
 */

/** The named series the dashboards chart and this engine watches. */
export const ANOMALY_SERIES_KEYS = [
  "refund_requests",
  "payout_requests",
  "dispute_rate",
  "support_volume",
  "at_risk_units",
  "enforcement_actions",
  "risk_flagged",
  "report_volume",
  "kyc_submissions",
] as const;

export type AnomalySeriesKey = (typeof ANOMALY_SERIES_KEYS)[number];

/** One point in a series. `at` is an ISO instant; `value` is the measurement. */
export interface SeriesPoint {
  at: string;
  value: number;
}

export type AnomalyBand = "watch" | "alert";

/**
 * Why a verdict could not be reached, when `detected` is false and it is NOT
 * simply "this is normal". Lets a surface say "not enough history" instead of
 * implying an all-clear it cannot actually vouch for.
 */
export type AnomalyBasis =
  | "robust"           // median + MAD — the intended path
  | "stdev_fallback"   // MAD was zero but the series does vary; used stdev
  | "flat_series"      // no variation at all; nothing can be an outlier
  | "insufficient_history";

export interface AnomalyResult {
  series: string;
  detected: boolean;
  observed: number;
  expected: number;
  /** Standardized deviation (robust z). Signed: negative = unusually LOW. */
  deviation: number;
  band: AnomalyBand;
  /** Localisation CODE for the banner, not operator-facing English. */
  windowDescription: string;
  /** Points in the baseline — so a surface can say "vs the last N days". */
  baselineCount: number;
  basis: AnomalyBasis;
  /** The point being judged (ISO), for the drill-down handler. */
  at: string;
}

export interface AnomalyOpts {
  /** Series name carried into the result (and used by the drill-down). */
  series?: string;
  /** |z| at or above which a point is a `watch`. */
  watchAt?: number;
  /** |z| at or above which a point is an `alert`. */
  alertAt?: number;
  /** Minimum baseline points before any verdict is offered. */
  minBaseline?: number;
  /** How many trailing points to evaluate (each against the points before it). */
  evaluate?: number;
  /**
   * Only flag UPWARD movement. For most operator series (refunds, disputes,
   * reports) a sudden drop is not an incident worth waking someone for; for
   * `support_volume` a collapse can mean a broken form, so callers may opt in.
   */
  direction?: "up" | "both";
  /**
   * The smallest spread the detector will divide by. The dashboards chart COUNT
   * data, where a spread below one item is meaningless: without this floor a
   * near-empty queue (26 zeros and a 1) turned its next single item into an
   * "alert" at z=10, while a flat series jumping 0 -> 500 was waved through as
   * "flat". With the floor, 0 -> 2 is ordinary noise and 0 -> 500 fires.
   */
  minScale?: number;
  /**
   * Treat the series as COUNTS and never divide by less than the Poisson spread
   * of its baseline, sqrt(median) (adversarial round 2). At a few items a day
   * the MAD is a small integer that UNDER-states the real noise (MAD 1 → 1.48
   * against a true sigma of 2.24 at five a day), which pushed the false "watch"
   * rate past 5% exactly where operators look most. Every series the staff
   * dashboards judge is a count, so this is on by default.
   */
  countData?: boolean;
  /**
   * The smallest spread as a FRACTION of the baseline median (round 4). Batch-
   * journal snapshots re-tally the same entities nightly: they are neither
   * Poisson (so `countData` is off) nor independent day to day, and with only
   * `minScale` a flat 200 moving to 204 read as an ALERT. A relative floor says
   * "a few percent of a stock is not news". 0 disables it (the default).
   */
  relativeFloor?: number;
}

export const DEFAULT_ANOMALY_OPTS: Required<AnomalyOpts> = {
  series: "series",
  // 3.5 is the conventional MAD-based outlier bar (Iglewicz & Hoaglin); 2.5
  // gives a softer "worth a look" tier beneath it.
  watchAt: 2.5,
  alertAt: 3.5,
  minBaseline: 7,
  evaluate: 1,
  direction: "up",
  minScale: 1,
  countData: true,
  relativeFloor: 0,
};

/** Anything beyond this is a bug in the caller's series, not a real measurement. */
const MAX_SERIES_VALUE = 1e12;
/** A z of 1000 is not more informative than a z of 50; cap so JSON stays sane. */
const MAX_DEVIATION = 50;

/** Consistency constant making MAD comparable to a standard deviation. */
const MAD_TO_SIGMA = 1.4826;

function finiteNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(-MAX_SERIES_VALUE, Math.min(MAX_SERIES_VALUE, value));
}

function round3(value: number): number {
  if (!Number.isFinite(value)) return 0;
  // Clamp BEFORE scaling: Math.round(1e308 * 1000) overflows to Infinity and the
  // divide can never bring it back. (The exact defect V3-41's fuzz found.)
  const clamped = Math.max(-MAX_SERIES_VALUE, Math.min(MAX_SERIES_VALUE, value));
  return Math.round(clamped * 1000) / 1000;
}

function median(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = n >> 1;
  return n % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdev(values: number[], centre: number): number {
  if (values.length < 2) return 0;
  let sum = 0;
  for (const v of values) sum += (v - centre) ** 2;
  return Math.sqrt(sum / (values.length - 1));
}

/** Clamp caller options into a sane, finite configuration. Garbage degrades to
 *  the default rather than producing a garbage verdict. */
function sanitizeOpts(opts: AnomalyOpts | undefined): Required<AnomalyOpts> {
  const d = DEFAULT_ANOMALY_OPTS;
  const o = opts ?? {};
  const bounded = (value: unknown, fallback: number, min: number, max: number): number => {
    const n = finiteNumber(value);
    return n !== null && n >= min && n <= max ? n : fallback;
  };
  const watchAt = bounded(o.watchAt, d.watchAt, 0.1, MAX_DEVIATION);
  const alertAt = bounded(o.alertAt, d.alertAt, 0.1, MAX_DEVIATION);
  return {
    series: typeof o.series === "string" && o.series.trim() ? o.series : d.series,
    watchAt,
    // An alert bar BELOW the watch bar would make the bands nonsensical.
    alertAt: alertAt >= watchAt ? alertAt : d.alertAt,
    minBaseline: Math.round(bounded(o.minBaseline, d.minBaseline, 2, 10_000)),
    evaluate: Math.round(bounded(o.evaluate, d.evaluate, 1, 1000)),
    direction: o.direction === "both" ? "both" : "up",
    minScale: bounded(o.minScale, d.minScale, 0.000001, MAX_SERIES_VALUE),
    countData: o.countData === false ? false : d.countData,
    relativeFloor: bounded(o.relativeFloor, d.relativeFloor, 0, 1),
  };
}

function notDetected(
  series: string,
  at: string,
  observed: number,
  expected: number,
  baselineCount: number,
  basis: AnomalyBasis,
): AnomalyResult {
  return {
    series,
    detected: false,
    observed: round3(observed),
    expected: round3(expected),
    deviation: 0,
    band: "watch",
    windowDescription: basis === "insufficient_history" ? "window_insufficient" : "window_rolling",
    baselineCount,
    basis,
    at,
  };
}

/**
 * Detect anomalies in a series.
 *
 * Each of the trailing `evaluate` points is judged against the points that came
 * BEFORE it — never against a baseline that includes itself, which would let a
 * spike raise its own bar and mask itself.
 */
export function detectAnomalies(series: SeriesPoint[], opts?: AnomalyOpts): AnomalyResult[] {
  const config = sanitizeOpts(opts);

  const points = (Array.isArray(series) ? series : [])
    .map((p) => ({ at: typeof p?.at === "string" ? p.at : "", value: finiteNumber(p?.value) }))
    .filter((p): p is { at: string; value: number } => p.at !== "" && p.value !== null);

  if (points.length === 0) return [];

  const evaluateCount = Math.min(config.evaluate, points.length);
  const results: AnomalyResult[] = [];

  for (let i = points.length - evaluateCount; i < points.length; i += 1) {
    const target = points[i];
    const baseline = points.slice(0, i).map((p) => p.value);

    if (baseline.length < config.minBaseline) {
      results.push(
        notDetected(config.series, target.at, target.value, 0, baseline.length, "insufficient_history"),
      );
      continue;
    }

    const sorted = [...baseline].sort((a, b) => a - b);
    const centre = median(sorted);
    const absDeviations = baseline.map((v) => Math.abs(v - centre)).sort((a, b) => a - b);
    const mad = median(absDeviations);

    // Scale: MAD first (robust). If MAD is exactly zero the series is mostly
    // constant — fall back to stdev so a genuine jump off a flat line is still
    // caught, rather than dividing by zero and reporting Infinity.
    let scale = mad * MAD_TO_SIGMA;
    let basis: AnomalyBasis = "robust";
    if (!(scale > 0)) {
      scale = stdev(baseline, centre);
      basis = "stdev_fallback";
    }
    if (!(scale > 0)) basis = "flat_series";
    // Floor the spread (see `minScale`). This is what separates "a second item
    // in a quiet month" (noise) from "a quiet queue suddenly flooded" (signal).
    scale = Math.max(scale, config.minScale);
    // ...and, for counts, the Poisson floor (see `countData`).
    if (config.countData && centre > 0) scale = Math.max(scale, Math.sqrt(centre));
    // ...and, for stocks, a floor relative to their level (see `relativeFloor`).
    if (config.relativeFloor > 0 && centre > 0) scale = Math.max(scale, config.relativeFloor * centre);

    const rawDeviation = (target.value - centre) / scale;
    const deviation = Math.max(-MAX_DEVIATION, Math.min(MAX_DEVIATION, rawDeviation));
    const magnitude = config.direction === "up" ? deviation : Math.abs(deviation);
    const detected = magnitude >= config.watchAt;
    const band: AnomalyBand = magnitude >= config.alertAt ? "alert" : "watch";

    results.push({
      series: config.series,
      detected,
      observed: round3(target.value),
      expected: round3(centre),
      deviation: round3(deviation),
      band,
      windowDescription: "window_rolling",
      baselineCount: baseline.length,
      basis,
      at: target.at,
    });
  }

  return results;
}

/** Convenience: run the detector over several named series at once. */
export function detectAnomaliesForSeries(
  input: ReadonlyArray<{ series: string; points: SeriesPoint[]; opts?: AnomalyOpts }>,
  shared?: AnomalyOpts,
): AnomalyResult[] {
  const out: AnomalyResult[] = [];
  for (const entry of input ?? []) {
    out.push(...detectAnomalies(entry.points, { ...shared, ...entry.opts, series: entry.series }));
  }
  return out;
}

/** Only the anomalies actually worth showing an operator. */
export function firedAnomalies(results: ReadonlyArray<AnomalyResult>): AnomalyResult[] {
  return results.filter((r) => r.detected);
}
