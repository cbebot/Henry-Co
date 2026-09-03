/**
 * V3-41 S1 — the queue-volume forecaster (ARCHITECTURE §5.4).
 *
 * A TRANSPARENT statistical model: hour-of-week seasonality x an EWMA level x
 * a damped daily trend, with a residual-derived confidence interval. Four
 * load-bearing properties, enforced structurally here:
 *
 *   1. NO AI, EVER, ON THIS PATH. The forecast is arithmetic over the caller's
 *      observations. There is no gateway import in this file and no injection
 *      point for one — an LLM cannot reach the core forecast even by mistake.
 *      (V3-41's optional AI slice writes NARRATIVE only, downstream of this.)
 *   2. PURE + DETERMINISTIC. No clock, no randomness, no I/O. `asOf` arrives as
 *      input, so the same history always yields the same forecast — which is
 *      what makes the back-test in __tests__/workload.test.ts meaningful.
 *   3. DB-LESS. The engine reads nothing. History arrives already scoped by the
 *      caller's service-role batch; there is no query here to forget a filter on.
 *   4. HONEST ABOUT DATA. Several queues are pre-data (BUILD-PLAN: "back-tests
 *      report absolute sample sizes given modest live volumes"). The forecast
 *      carries its own `sampleSize` + `basis`, so a surface can say "not enough
 *      history yet" instead of rendering a confident line through noise.
 */

/**
 * The six operator queues. Verified against the LIVE Track C surface on main —
 * the old `app/(workspace)/<queue>` routes are 308 stubs that redirect to
 * `/modules/staff-*`, so the queue set is derived from the real modules and the
 * tables they read:
 *   support       -> public.support_threads                     (created_at)
 *   kyc_review    -> public.customer_verification_submissions   (submitted_at)
 *   moderation    -> public.platform_moderation_queue + moderation_reports (created_at)
 *   finance       -> public.marketplace_payout_requests         (created_at)
 *   refunds       -> public.marketplace_refunds                 (created_at)
 *   logistics_ops -> public.logistics_shipments                 (created_at)
 * `refunds` has no staff module on main yet; it is forecast from its table so
 * the queue exists the day that module lands (and reports `empty` until then).
 */
export type QueueKey =
  | "support"
  | "kyc_review"
  | "moderation"
  | "finance"
  | "refunds"
  | "logistics_ops";

export const QUEUE_KEYS: readonly QueueKey[] = [
  "support",
  "kyc_review",
  "moderation",
  "finance",
  "refunds",
  "logistics_ops",
] as const;

/** One historical hour: how many items ARRIVED in the hour starting at `at`. */
export interface QueueObservation {
  /** ISO-8601 instant marking the start of the hour bucket. */
  at: string;
  /** Items that arrived in that hour. Negative/NaN are treated as 0. */
  count: number;
}

/** Why a staffing figure was recommended. A CODE — the surface localizes it
 *  (`surface:staff_predictive`); never operator-facing English from here. */
export type StaffingRationaleCode =
  | "forecast_within_capacity"
  | "forecast_above_capacity"
  | "forecast_peak_hour_pressure"
  | "insufficient_history";

export interface WorkloadForecastPoint {
  at: string;
  predicted: number;
  lowerCI: number;
  upperCI: number;
}

export interface StaffingRecommendation {
  date: string;
  recommendedAgents: number;
  /** Localization code, not prose. */
  rationale: StaffingRationaleCode;
}

/** How much history backs a forecast — surfaced so nobody reads noise as signal. */
export type ForecastBasis = "seasonal" | "sparse" | "empty";

export interface WorkloadForecast {
  queue: QueueKey;
  horizonHours: number;
  perHour: WorkloadForecastPoint[];
  staffingRecommendation: StaffingRecommendation[];
  /** Absolute observation count behind the model (honesty over ceremony). */
  sampleSize: number;
  basis: ForecastBasis;
  /** Stamped on every persisted row for reproducibility (S6). */
  modelVersion: string;
}

export interface WorkloadConfig {
  /** Items one agent clears per day. Owner-tunable per queue. */
  throughputPerAgentPerDay: number;
  /** Never recommend more than this (a forecast spike must not ask for 400 agents). */
  maxAgents: number;
  /** Minimum cover whenever any volume is expected at all. */
  minAgents: number;
  /** EWMA smoothing for the level (0 < alpha <= 1). Higher = more recency-weighted. */
  alpha: number;
  /** z for the confidence interval (1.96 ~ 95%). */
  z: number;
  /** Below this many observations the model reports `sparse` and widens its CI. */
  sparseBelowObservations: number;
}

export const DEFAULT_WORKLOAD_CONFIG: WorkloadConfig = {
  throughputPerAgentPerDay: 40,
  maxAgents: 25,
  minAgents: 1,
  alpha: 0.3,
  z: 1.96,
  sparseBelowObservations: 168,
};

/** The versioned model identity (E-D3: "learning" = owner-ratified version bumps). */
export const WORKLOAD_MODEL_VERSION = "workload-seasonal-ewma-v1";

const HOURS_PER_WEEK = 168;
const MS_PER_HOUR = 3_600_000;

export interface ForecastWorkloadInput {
  queue: QueueKey;
  history: QueueObservation[];
  /** Forecast origin. Defaults to the last observed hour + 1h (keeps it pure). */
  asOf?: string;
  horizonHours?: number;
  config?: Partial<WorkloadConfig>;
}

function safeCount(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function hourOfWeek(ms: number): number {
  // 1970-01-01 was a Thursday; the offset only has to be STABLE, not calendar-true,
  // because the same function indexes both the profile and the horizon.
  const h = Math.floor(ms / MS_PER_HOUR);
  return ((h % HOURS_PER_WEEK) + HOURS_PER_WEEK) % HOURS_PER_WEEK;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  let total = 0;
  for (const v of values) total += v;
  return total / values.length;
}

/** Least-squares slope of y over its index. Returns 0 for fewer than 2 points. */
function slope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = mean(values);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = i - xMean;
    num += dx * (values[i] - yMean);
    den += dx * dx;
  }
  return den === 0 ? 0 : num / den;
}

function isoHour(ms: number): string {
  return new Date(Math.floor(ms / MS_PER_HOUR) * MS_PER_HOUR).toISOString();
}

/**
 * The largest volume this forecaster will ever emit. A queue receiving a billion
 * items in one hour is not a forecast, it is a bug — and clamping here keeps
 * every emitted number both finite and JSON-safe.
 */
const MAX_FORECAST_VALUE = 1e9;

function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  // `Math.round(1e308 * 100) / 100` is Infinity — the multiply overflows before
  // the divide can bring it back. Clamp BEFORE scaling (found by fuzzing).
  const clamped = Math.max(-MAX_FORECAST_VALUE, Math.min(MAX_FORECAST_VALUE, value));
  return Math.round(clamped * 100) / 100;
}

function emptyForecast(queue: QueueKey, horizonHours: number, originMs: number): WorkloadForecast {
  const perHour: WorkloadForecastPoint[] = [];
  for (let h = 0; h < horizonHours; h += 1) {
    perHour.push({ at: isoHour(originMs + h * MS_PER_HOUR), predicted: 0, lowerCI: 0, upperCI: 0 });
  }
  const dates = new Set(perHour.map((p) => p.at.slice(0, 10)));
  return {
    queue,
    horizonHours,
    perHour,
    staffingRecommendation: [...dates].map((date) => ({
      date,
      recommendedAgents: 0,
      rationale: "insufficient_history" as const,
    })),
    sampleSize: 0,
    basis: "empty",
    modelVersion: WORKLOAD_MODEL_VERSION,
  };
}

/**
 * Forecast per-hour incoming volume for a queue over the horizon (default 168h).
 *
 * Model: predicted(h) = max(0, (level + trendPerHour * hoursAhead) * seasonalIndex[hourOfWeek(h)])
 *   - level          — EWMA over the observed hourly counts (recency-weighted)
 *   - seasonalIndex  — slotMean / overallMean per hour-of-week (1.0 when unknown)
 *   - trendPerHour   — damped least-squares slope of DAILY totals, spread per hour
 *   - CI             — +/- z * sigma where sigma is the in-sample one-step residual RMSE
 */
/**
 * Clamp every config numeric to a finite, sane value.
 *
 * Found by adversarial fuzzing: a non-finite `z` (or an absurd observed count)
 * propagated straight into `upperCI`, so the engine could emit `Infinity` — which
 * would be persisted into JSONB and rendered to an operator as "Infinity". A
 * forecast must ALWAYS be a finite number: garbage config degrades to the
 * default, it never produces a garbage forecast.
 */
function sanitizeConfig(config: WorkloadConfig): WorkloadConfig {
  const finite = (value: number, fallback: number, min: number, max: number): number =>
    Number.isFinite(value) && value >= min && value <= max ? value : fallback;
  const d = DEFAULT_WORKLOAD_CONFIG;
  return {
    throughputPerAgentPerDay: finite(config.throughputPerAgentPerDay, d.throughputPerAgentPerDay, 1, 1e6),
    maxAgents: finite(config.maxAgents, d.maxAgents, 0, 10_000),
    minAgents: finite(config.minAgents, d.minAgents, 0, 10_000),
    alpha: finite(config.alpha, d.alpha, Number.EPSILON, 1),
    z: finite(config.z, d.z, 0, 10),
    sparseBelowObservations: finite(config.sparseBelowObservations, d.sparseBelowObservations, 0, 1e6),
  };
}

/** Belt on every emitted number: finite, non-negative and within the clamp. */
function safeOut(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_FORECAST_VALUE, value));
}

export function forecastWorkload(input: ForecastWorkloadInput): WorkloadForecast {
  const config = sanitizeConfig({ ...DEFAULT_WORKLOAD_CONFIG, ...(input.config ?? {}) });
  const rawHorizon = input.horizonHours ?? HOURS_PER_WEEK;
  // Bound the horizon too: a hostile value must not allocate an enormous array.
  const horizonHours =
    Number.isFinite(rawHorizon) && rawHorizon > 0 ? Math.min(Math.floor(rawHorizon), 744) : HOURS_PER_WEEK;

  const observations = (input.history ?? [])
    .map((o) => ({ ms: Date.parse(o.at), count: safeCount(o.count) }))
    .filter((o) => Number.isFinite(o.ms))
    .sort((a, b) => a.ms - b.ms);

  const originMs = (() => {
    if (input.asOf) {
      const parsed = Date.parse(input.asOf);
      if (Number.isFinite(parsed)) return Math.floor(parsed / MS_PER_HOUR) * MS_PER_HOUR;
    }
    if (observations.length > 0) return observations[observations.length - 1].ms + MS_PER_HOUR;
    return 0;
  })();

  if (observations.length === 0) return emptyForecast(input.queue, horizonHours, originMs);

  const counts = observations.map((o) => o.count);
  const overallMean = mean(counts);

  // --- seasonal profile: mean count per hour-of-week slot -------------------
  const slotTotals = new Array<number>(HOURS_PER_WEEK).fill(0);
  const slotCounts = new Array<number>(HOURS_PER_WEEK).fill(0);
  for (const o of observations) {
    const slot = hourOfWeek(o.ms);
    slotTotals[slot] += o.count;
    slotCounts[slot] += 1;
  }
  const seasonalIndex = new Array<number>(HOURS_PER_WEEK).fill(1);
  // `overallMean > 0` is not enough: a denormal mean (1e-300) makes the ratio
  // Infinity, which then propagates through the whole horizon. Require a mean
  // large enough to divide by, and clamp each index to a sane multiplier.
  if (Number.isFinite(overallMean) && overallMean > 1e-9) {
    for (let s = 0; s < HOURS_PER_WEEK; s += 1) {
      if (slotCounts[s] > 0) {
        const index = slotTotals[s] / slotCounts[s] / overallMean;
        seasonalIndex[s] = Number.isFinite(index) ? Math.max(0, Math.min(1000, index)) : 1;
      }
    }
  }

  // --- level: EWMA over DESEASONALIZED hours --------------------------------
  // Deseasonalize BEFORE smoothing. Taking the EWMA of raw counts and then
  // multiplying by the seasonal index applies seasonality twice, and biases the
  // level toward whichever hour-of-week the series happens to end on — which is
  // exactly the error the back-test caught (MAPE 93% -> single digits).
  const deseasonalized = observations.map((o) => {
    const index = seasonalIndex[hourOfWeek(o.ms)];
    return index > 0 ? o.count / index : o.count;
  });
  let level = deseasonalized[0];
  for (let i = 1; i < deseasonalized.length; i += 1) {
    level = config.alpha * deseasonalized[i] + (1 - config.alpha) * level;
  }
  if (!Number.isFinite(level)) level = 0;

  // --- trend: damped slope of daily totals ----------------------------------
  const dailyTotals = new Map<string, number>();
  for (const o of observations) {
    const day = isoHour(o.ms).slice(0, 10);
    dailyTotals.set(day, (dailyTotals.get(day) ?? 0) + o.count);
  }
  const dailySeries = [...dailyTotals.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([, v]) => v);
  // UNITS MATTER. `slope` is items-per-day PER DAY; `level` is items-per-HOUR.
  // Converting needs /24 twice: once to turn a daily total into an hourly level,
  // once to spread that per-day drift across the day's hours. Dividing once made
  // the trend 24x too large and swamped the level over a 168h horizon.
  // Damped by 0.5 so a short noisy series cannot extrapolate a runaway ramp.
  const trendPerHour = dailySeries.length >= 3 ? (slope(dailySeries) * 0.5) / (24 * 24) : 0;

  // --- in-sample residual sigma for the confidence interval -----------------
  const residuals: number[] = [];
  for (const o of observations) {
    const fitted = Math.max(0, level * seasonalIndex[hourOfWeek(o.ms)]);
    residuals.push((o.count - fitted) ** 2);
  }
  const sparse = observations.length < config.sparseBelowObservations;
  // A sparse series gets a deliberately wider band — under-confidence is the safe error.
  const sigma = Math.sqrt(mean(residuals)) * (sparse ? 1.5 : 1);

  // --- project the horizon --------------------------------------------------
  const perHour: WorkloadForecastPoint[] = [];
  // Belt on the damped trend: the extrapolation may move the level by at most
  // +/-50%, so even a pathological slope cannot invert or explode the horizon.
  const maxDrift = level * 0.5;
  for (let h = 0; h < horizonHours; h += 1) {
    const atMs = originMs + h * MS_PER_HOUR;
    const drift = Math.max(-maxDrift, Math.min(maxDrift, trendPerHour * h));
    const predicted = Math.max(0, (level + drift) * seasonalIndex[hourOfWeek(atMs)]);
    const halfWidth = safeOut(config.z * sigma);
    const safePredicted = safeOut(predicted);
    perHour.push({
      at: isoHour(atMs),
      predicted: round2(safePredicted),
      lowerCI: round2(safeOut(safePredicted - halfWidth)),
      upperCI: round2(safeOut(safePredicted + halfWidth)),
    });
  }

  // --- staffing recommendation (advisory; owner-ratified after shadow) ------
  const byDate = new Map<string, number[]>();
  for (const point of perHour) {
    const date = point.at.slice(0, 10);
    const bucket = byDate.get(date);
    if (bucket) bucket.push(point.predicted);
    else byDate.set(date, [point.predicted]);
  }
  const staffingRecommendation: StaffingRecommendation[] = [...byDate.entries()].map(([date, hours]) => {
    const dayTotal = hours.reduce((sum, v) => sum + v, 0);
    const peak = Math.max(...hours);
    const needed = Math.ceil(dayTotal / Math.max(1, config.throughputPerAgentPerDay));
    // A recommendation is a HEADCOUNT: always a whole, non-negative number. The
    // config bounds are rounded here too, so a fractional `minAgents` can never
    // surface as "recommend 0.3 people" on an operator screen (found by fuzzing).
    const bounded = Math.max(
      0,
      Math.round(
        Math.min(config.maxAgents, Math.max(dayTotal > 0 ? config.minAgents : 0, needed)),
      ),
    );
    const rationale: StaffingRationaleCode = sparse
      ? "insufficient_history"
      : needed > config.maxAgents
        ? "forecast_above_capacity"
        : peak * 24 > dayTotal * 2
          ? "forecast_peak_hour_pressure"
          : "forecast_within_capacity";
    return { date, recommendedAgents: bounded, rationale };
  });

  return {
    queue: input.queue,
    horizonHours,
    perHour,
    staffingRecommendation,
    sampleSize: observations.length,
    basis: sparse ? "sparse" : "seasonal",
    modelVersion: WORKLOAD_MODEL_VERSION,
  };
}
