/**
 * V3-42 — the dashboard loaders.
 *
 * EVERY read here goes through the caller's RLS-SCOPED staff client. There is
 * no service-role client in this file and no import that could produce one.
 * That is the per-role safety property: a support operator's session simply
 * cannot return a `risk_scores` row, because `is_staff_in('security')` is false
 * for them and Postgres filters it out before the data leaves the database. The
 * UI gate in `lenses.ts` is the affordance; this is the boundary.
 *
 * WHERE EACH CHART'S DATA COMES FROM — and why it is not the obvious table.
 * The same rule that makes the dashboards safe makes naive charts WRONG. The
 * division tables behind the queues carry heterogeneous, division-scoped RLS:
 *
 *   support_threads            no staff SELECT policy at all (users read own)
 *   platform_moderation_queue  service-role only (SEC-HARDEN-03)
 *   marketplace_refunds        marketplace role members only
 *
 * Read directly with a viewer's session, the support chart would show that
 * operator's personal threads (~0) and the moderation chart would be empty —
 * silently, with no error. So queue VOLUME is charted from the observed daily
 * counts the V3-41 service-role batch publishes into `workload_forecasts`
 * (staff-readable via `is_staff_in_any()`): complete for every staff viewer,
 * numbers only, and still no admin client anywhere in this file.
 *
 * Every read is bounded (explicit window + row limit) and best-effort: before
 * the V3-40/V3-41/V3-42 migrations are applied these tables do not exist, and a
 * dashboard must render its empty state rather than break the staff shell.
 *
 * OPACITY: the dispute reads never select `likelihood`, and the risk reads never
 * select `risk_score` or `deterministic_score`. Raw scores never leave Postgres,
 * so they cannot reach a browser even by accident (omission, not redaction).
 */

import type { SeriesPoint } from "@henryco/intelligence";
import type { LensKey } from "./lenses";

/** Structural duck type — the posture every sibling staff module uses. */
type Chain = {
  eq: (column: string, value: string) => Chain;
  in: (column: string, values: readonly string[]) => Chain;
  gte: (column: string, value: string) => Chain;
  order: (column: string, options?: { ascending?: boolean }) => Chain;
  limit: (count: number) => Promise<{
    data: Array<Record<string, unknown>> | null;
    error: { message: string } | null;
  }>;
};

export type IntelligenceSupabaseClient = {
  from: (table: string) => { select: (columns: string) => Chain };
};

const DAY_MS = 86_400_000;
/** Charts show four weeks; the anomaly baseline needs ~28 points. */
export const SERIES_WINDOW_DAYS = 28;
/** A dashboard must never attempt an unbounded scan. */
export const SERIES_ROW_LIMIT = 5000;
export const DRILLDOWN_LIMIT = 50;
export const RECOMMENDATION_LIMIT = 40;

/**
 * A chart series. `observed` series feed the anomaly detector; a `forecast`
 * series never does — hunting outliers in a model's own projection would flag
 * the model, not the platform.
 */
export interface LensSeries {
  key: string;
  kind: "observed" | "forecast";
  points: SeriesPoint[];
  /** The existing module that lists the underlying items (S4 drill-down). That
   *  module applies its OWN role gate and RLS when the operator arrives. */
  href?: string;
}

export interface DrillRow {
  id: string;
  label: string;
  band: string;
  at: string;
}

export interface LensSnapshot {
  lens: LensKey;
  series: ReadonlyArray<LensSeries>;
  /** Band tallies driving the recommendation inputs. */
  bands: Readonly<Record<string, Record<string, number>>>;
  /** Per-queue staffing outlook (support lens). */
  forecasts: ReadonlyArray<{
    queue: string;
    basis: "seasonal" | "sparse" | "empty";
    staffing: ReadonlyArray<{ date: string; recommendedAgents: number; rationale: string }>;
  }>;
  /** In-dashboard drill rows for the lens's own predictive table. */
  drill: ReadonlyArray<DrillRow>;
}

export const EMPTY_LENS_SNAPSHOT: LensSnapshot = {
  lens: "support",
  series: [],
  bands: {},
  forecasts: [],
  drill: [],
};

function dayKey(iso: unknown): string | null {
  if (typeof iso !== "string") return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Fold per-day counts into a DENSE window ending today. Days with no rows are
 *  explicit zeros — otherwise a chart joins Tuesday to Friday as if Wednesday
 *  never happened, and the anomaly baseline is computed over busy days only. */
function densify(counts: Map<string, number>, now: Date, days: number): SeriesPoint[] {
  if (counts.size === 0) return [];
  const endMs = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`);
  const startMs = endMs - (days - 1) * DAY_MS;
  const out: SeriesPoint[] = [];
  for (let ms = startMs; ms <= endMs; ms += DAY_MS) {
    const key = new Date(ms).toISOString().slice(0, 10);
    out.push({ at: `${key}T00:00:00.000Z`, value: counts.get(key) ?? 0 });
  }
  return out;
}

/** Daily row counts from a table the viewer IS entitled to read, optionally
 *  restricted to certain bands (filtered in SQL, so the limit is spent on rows
 *  that count). */
async function loadDailyCounts(
  supabase: IntelligenceSupabaseClient,
  table: string,
  timeColumn: string,
  now: Date,
  bandFilter?: { column: string; values: readonly string[] },
): Promise<SeriesPoint[]> {
  const since = new Date(now.getTime() - SERIES_WINDOW_DAYS * DAY_MS);
  const counts = new Map<string, number>();
  try {
    let query = supabase.from(table).select(timeColumn).gte(timeColumn, since.toISOString());
    if (bandFilter) query = query.in(bandFilter.column, bandFilter.values);
    const { data, error } = await query.order(timeColumn, { ascending: true }).limit(SERIES_ROW_LIMIT);
    if (error || !data) return [];
    for (const row of data) {
      const key = dayKey(row[timeColumn]);
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  } catch {
    // Absent table / renamed column / RLS denial -> contribute nothing.
    return [];
  }
  return densify(counts, now, SERIES_WINDOW_DAYS);
}

/** Tally rows in the window by one low-cardinality text column. */
async function loadBandCounts(
  supabase: IntelligenceSupabaseClient,
  table: string,
  timeColumn: string,
  bandColumn: string,
  now: Date,
): Promise<Record<string, number>> {
  const since = new Date(now.getTime() - SERIES_WINDOW_DAYS * DAY_MS);
  const counts: Record<string, number> = {};
  try {
    const { data, error } = await supabase
      .from(table)
      .select(`${bandColumn},${timeColumn}`)
      .gte(timeColumn, since.toISOString())
      .order(timeColumn, { ascending: false })
      .limit(SERIES_ROW_LIMIT);
    if (error || !data) return counts;
    for (const row of data) {
      const band = row[bandColumn];
      if (typeof band !== "string") continue;
      counts[band] = (counts[band] ?? 0) + 1;
    }
  } catch {
    return counts;
  }
  return counts;
}

interface ForecastRow {
  queue: string;
  basis: "seasonal" | "sparse" | "empty";
  staffing: ReadonlyArray<{ date: string; recommendedAgents: number; rationale: string }>;
  observedDaily: ReadonlyArray<{ date: string; count: number }>;
  perHour: ReadonlyArray<{ at: string; predicted: number }>;
}

/** The newest forecast row per queue — ONE bounded read serves every queue. */
async function loadLatestForecasts(
  supabase: IntelligenceSupabaseClient,
  now: Date,
): Promise<Map<string, ForecastRow>> {
  const out = new Map<string, ForecastRow>();
  try {
    const { data, error } = await supabase
      .from("workload_forecasts")
      .select("queue,generated_at,payload,basis")
      .gte("generated_at", new Date(now.getTime() - 3 * DAY_MS).toISOString())
      .order("generated_at", { ascending: false })
      .limit(60);
    if (error || !data) return out;
    for (const row of data) {
      const queue = typeof row.queue === "string" ? row.queue : null;
      if (!queue || out.has(queue)) continue; // newest wins
      const payload = (row.payload ?? {}) as Record<string, unknown>;
      const asArray = (value: unknown): Array<Record<string, unknown>> =>
        Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
      out.set(queue, {
        queue,
        basis: row.basis === "seasonal" || row.basis === "sparse" ? row.basis : "empty",
        staffing: asArray(payload.staffingRecommendation).map((s) => ({
          date: String(s?.date ?? ""),
          recommendedAgents: Number(s?.recommendedAgents) || 0,
          rationale: String(s?.rationale ?? "insufficient_history"),
        })),
        observedDaily: asArray(payload.observedDaily)
          .map((d) => ({ date: String(d?.date ?? ""), count: Number(d?.count) }))
          .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date) && Number.isFinite(d.count) && d.count >= 0),
        perHour: asArray(payload.perHour)
          .map((p) => ({ at: String(p?.at ?? ""), predicted: Number(p?.predicted) }))
          .filter((p) => Number.isFinite(p.predicted)),
      });
    }
  } catch {
    return out;
  }
  return out;
}

/** Observed daily volume for a queue, from the batch-published counts. */
function observedSeries(row: ForecastRow | undefined, now: Date): SeriesPoint[] {
  if (!row || row.observedDaily.length === 0) return [];
  const counts = new Map<string, number>();
  for (const d of row.observedDaily) counts.set(d.date, d.count);
  return densify(counts, now, SERIES_WINDOW_DAYS);
}

/** The next seven days of a forecast, as daily totals. */
function forecastSeries(row: ForecastRow | undefined): SeriesPoint[] {
  if (!row || row.basis === "empty") return [];
  const totals = new Map<string, number>();
  for (const p of row.perHour) {
    const key = dayKey(p.at);
    if (key) totals.set(key, (totals.get(key) ?? 0) + Math.max(0, p.predicted));
  }
  return [...totals.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .slice(0, 7)
    .map(([key, value]) => ({ at: `${key}T00:00:00.000Z`, value: Math.round(value) }));
}

async function loadDrill(
  supabase: IntelligenceSupabaseClient,
  table: string,
  idColumn: string,
  bandColumn: string,
  timeColumn: string,
  bands: readonly string[],
  now: Date,
): Promise<DrillRow[]> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(`${idColumn},${bandColumn},${timeColumn}`)
      .gte(timeColumn, new Date(now.getTime() - SERIES_WINDOW_DAYS * DAY_MS).toISOString())
      .in(bandColumn, bands)
      .order(timeColumn, { ascending: false })
      .limit(DRILLDOWN_LIMIT);
    if (error || !data) return [];
    return data.map((row) => ({
      id: String(row[idColumn] ?? ""),
      label: String(row[idColumn] ?? ""),
      band: String(row[bandColumn] ?? ""),
      at: String(row[timeColumn] ?? ""),
    }));
  } catch {
    return [];
  }
}

/**
 * Load everything one lens needs.
 *
 * Note what is NOT here: no branch widens a query when a viewer "should" have
 * access. Each lens asks for its own data and the database answers according
 * to the caller's session. A forbidden table returns nothing, which the surface
 * renders as its empty state.
 */
export async function loadLensSnapshot(
  supabase: IntelligenceSupabaseClient,
  lens: LensKey,
  now: Date = new Date(),
): Promise<LensSnapshot> {
  switch (lens) {
    case "trust": {
      // V3-40 tables. Only a `security` staff session returns rows at all.
      const [flagged, enforcement, tiers, drill] = await Promise.all([
        loadDailyCounts(supabase, "risk_scores", "scored_at", now, {
          column: "tier",
          values: ["review", "freeze"],
        }),
        loadDailyCounts(supabase, "risk_enforcement_log", "created_at", now),
        loadBandCounts(supabase, "risk_scores", "scored_at", "tier", now),
        loadDrill(supabase, "risk_scores", "entity_id", "tier", "scored_at", ["review", "freeze"], now),
      ]);
      return {
        lens,
        series: [
          { key: "risk_flagged", kind: "observed", points: flagged, href: "/modules/staff-risk" },
          { key: "enforcement_actions", kind: "observed", points: enforcement, href: "/modules/staff-risk" },
        ],
        bands: { risk: tiers },
        forecasts: [],
        drill,
      };
    }
    case "finance": {
      const [forecasts, watchList, bands, drill] = await Promise.all([
        loadLatestForecasts(supabase, now),
        loadDailyCounts(supabase, "dispute_likelihoods", "scored_at", now, {
          column: "band",
          values: ["watch", "high"],
        }),
        loadBandCounts(supabase, "dispute_likelihoods", "scored_at", "band", now),
        loadDrill(supabase, "dispute_likelihoods", "transaction_id", "band", "scored_at", ["watch", "high"], now),
      ]);
      return {
        lens,
        series: [
          {
            key: "refund_requests",
            kind: "observed",
            points: observedSeries(forecasts.get("refunds"), now),
            href: "/modules/staff-finance-operator",
          },
          {
            key: "payout_requests",
            kind: "observed",
            points: observedSeries(forecasts.get("finance"), now),
            href: "/modules/staff-finance-operator",
          },
          { key: "dispute_rate", kind: "observed", points: watchList },
        ],
        bands: { dispute: bands },
        forecasts: [],
        drill,
      };
    }
    case "support": {
      const [forecasts, atRisk, bands, drill] = await Promise.all([
        loadLatestForecasts(supabase, now),
        loadDailyCounts(supabase, "quality_assessments", "assessed_at", now, {
          column: "risk_band",
          values: ["elevated", "high"],
        }),
        loadBandCounts(supabase, "quality_assessments", "assessed_at", "risk_band", now),
        loadDrill(
          supabase,
          "quality_assessments",
          "unit_id",
          "risk_band",
          "assessed_at",
          ["elevated", "high"],
          now,
        ),
      ]);
      const support = forecasts.get("support");
      return {
        lens,
        series: [
          {
            key: "support_volume",
            kind: "observed",
            points: observedSeries(support, now),
            href: "/modules/staff-support",
          },
          { key: "support_forecast", kind: "forecast", points: forecastSeries(support) },
          { key: "at_risk_units", kind: "observed", points: atRisk },
        ],
        bands: { quality: bands },
        forecasts: support ? [{ queue: support.queue, basis: support.basis, staffing: support.staffing }] : [],
        drill,
      };
    }
    case "moderation":
    default: {
      const forecasts = await loadLatestForecasts(supabase, now);
      return {
        lens: "moderation",
        series: [
          {
            key: "report_volume",
            kind: "observed",
            points: observedSeries(forecasts.get("moderation"), now),
            href: "/modules/staff-moderation",
          },
          {
            key: "kyc_submissions",
            kind: "observed",
            points: observedSeries(forecasts.get("kyc_review"), now),
            href: "/modules/staff-moderation",
          },
        ],
        bands: {},
        forecasts: [],
        drill: [],
      };
    }
  }
}

export interface RecommendationStateRow {
  recommendationKey: string;
  status: "open" | "accepted" | "dismissed" | "snoozed";
  snoozeUntil: string | null;
}

/** Persisted accept/dismiss/snooze state for this lens. */
export async function loadRecommendationState(
  supabase: IntelligenceSupabaseClient,
  lens: LensKey,
): Promise<RecommendationStateRow[]> {
  try {
    const { data, error } = await supabase
      .from("staff_recommendation_state")
      .select("recommendation_key,status,snooze_until,role_scope")
      .eq("role_scope", lens)
      .order("created_at", { ascending: false })
      .limit(RECOMMENDATION_LIMIT);
    if (error || !data) return [];
    return data.map((row) => ({
      recommendationKey: String(row.recommendation_key ?? ""),
      status: (row.status as RecommendationStateRow["status"]) ?? "open",
      snoozeUntil: typeof row.snooze_until === "string" ? row.snooze_until : null,
    }));
  } catch {
    return [];
  }
}

/**
 * Which cards the rail should actually show.
 *
 * Dismissed and accepted cards stay gone. A snoozed card returns once its wake
 * time passes — a snooze that silently became permanent would be a dismissal
 * the operator never chose, so a missing or unparseable wake time re-surfaces
 * the card rather than hiding it forever.
 */
export function visibleRecommendationKeys(
  cardKeys: ReadonlyArray<string>,
  state: ReadonlyArray<RecommendationStateRow>,
  now: Date = new Date(),
): string[] {
  const byKey = new Map(state.map((row) => [row.recommendationKey, row]));
  return cardKeys.filter((key) => {
    const row = byKey.get(key);
    if (!row || row.status === "open") return true;
    if (row.status === "accepted" || row.status === "dismissed") return false;
    if (row.status === "snoozed") {
      const wake = row.snoozeUntil ? Date.parse(row.snoozeUntil) : Number.NaN;
      return Number.isFinite(wake) ? now.getTime() >= wake : true;
    }
    return true;
  });
}
