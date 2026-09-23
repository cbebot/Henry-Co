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

/**
 * Fold per-day ARRIVAL counts into a dense window that ends YESTERDAY.
 *
 * Today is excluded on purpose (adversarial round 1). The batch runs at 02:47
 * UTC, so "today" holds ~3 hours of arrivals, or an explicit 0 before the run.
 * Judging that partial bucket made real spikes undetectable on every arrival
 * series and drew a permanent false dip at the end of every chart. The last
 * point is now always a COMPLETE day. Missing days inside the window are true
 * zeros: the source read covered them.
 */
function densifyCompleteDays(counts: Map<string, number>, now: Date, days: number): SeriesPoint[] {
  if (counts.size === 0) return [];
  const endMs = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`) - DAY_MS;
  const startMs = endMs - (days - 1) * DAY_MS;
  const out: SeriesPoint[] = [];
  for (let ms = startMs; ms <= endMs; ms += DAY_MS) {
    const key = new Date(ms).toISOString().slice(0, 10);
    out.push({ at: `${key}T00:00:00.000Z`, value: counts.get(key) ?? 0 });
  }
  return out;
}

/**
 * Daily EVENT counts (each row is one event that happened once), newest first.
 * Ordering DESC matters: PostgREST caps responses (max_rows = 1000), and an
 * ascending read would let the cap drop the most recent days, the ones that
 * matter. Only used for tables with one row per event, never for tables the
 * batch re-scores daily (those would be summed 28 times over).
 */
async function loadDailyEvents(
  supabase: IntelligenceSupabaseClient,
  table: string,
  timeColumn: string,
  now: Date,
): Promise<SeriesPoint[]> {
  const since = new Date(now.getTime() - (SERIES_WINDOW_DAYS + 1) * DAY_MS);
  const counts = new Map<string, number>();
  try {
    const { data, error } = await supabase
      .from(table)
      .select(timeColumn)
      .gte(timeColumn, since.toISOString())
      .order(timeColumn, { ascending: false })
      .limit(SERIES_ROW_LIMIT);
    if (error || !data) return [];
    for (const row of data) {
      const key = dayKey(row[timeColumn]);
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  } catch {
    return [];
  }
  return densifyCompleteDays(counts, now, SERIES_WINDOW_DAYS);
}

/**
 * A SNAPSHOT series from a batch run journal: one point per day, from that
 * day's newest successful run. The V3-40/V3-41 batches re-score the same
 * entities every night, so counting score ROWS over 28 days inflated figures up
 * to ~28x (round 1). The journal already records each run's tally exactly once.
 * Days without a run are simply absent: a skipped batch is not "zero risk".
 */
async function loadJournalSeries(
  supabase: IntelligenceSupabaseClient,
  table: "risk_batch_runs" | "predictive_batch_runs",
  now: Date,
  extract: (counts: Record<string, unknown>) => number | null,
): Promise<SeriesPoint[]> {
  const okColumn = table === "risk_batch_runs" ? "status" : "outcome";
  const okValue = table === "risk_batch_runs" ? "done" : "succeeded";
  try {
    const { data, error } = await supabase
      .from(table)
      .select(`started_at,${okColumn},counts`)
      .gte("started_at", new Date(now.getTime() - SERIES_WINDOW_DAYS * DAY_MS).toISOString())
      .eq(okColumn, okValue)
      .order("started_at", { ascending: false })
      .limit(120);
    if (error || !data) return [];
    const byDay = new Map<string, number>();
    for (const row of data) {
      const key = dayKey(row.started_at);
      if (!key || byDay.has(key)) continue; // newest run of the day wins
      const counts = (row.counts && typeof row.counts === "object" ? row.counts : {}) as Record<string, unknown>;
      const value = extract(counts);
      if (value !== null && Number.isFinite(value) && value >= 0) byDay.set(key, Math.round(value));
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, value]) => ({ at: `${key}T00:00:00.000Z`, value }));
  } catch {
    return [];
  }
}

const num = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * The LATEST batch's flagged entities: band tallies and drill rows, each entity
 * counted once. Reads newest-first within the band filter, keeps only the
 * newest scoring day, and de-duplicates by id, so a transaction watched for
 * ten days is one transaction, not ten.
 */
async function loadLatestSnapshot(
  supabase: IntelligenceSupabaseClient,
  table: string,
  idColumn: string,
  bandColumn: string,
  timeColumn: string,
  bands: readonly string[],
  now: Date,
): Promise<{ counts: Record<string, number>; drill: DrillRow[] }> {
  const empty = { counts: {}, drill: [] as DrillRow[] };
  try {
    const { data, error } = await supabase
      .from(table)
      .select(`${idColumn},${bandColumn},${timeColumn}`)
      .gte(timeColumn, new Date(now.getTime() - 3 * DAY_MS).toISOString())
      .in(bandColumn, bands)
      .order(timeColumn, { ascending: false })
      .limit(SERIES_ROW_LIMIT);
    if (error || !data || data.length === 0) return empty;
    const newestDay = dayKey(data[0][timeColumn]);
    const seen = new Set<string>();
    const counts: Record<string, number> = {};
    const drill: DrillRow[] = [];
    for (const row of data) {
      if (dayKey(row[timeColumn]) !== newestDay) continue;
      const id = String(row[idColumn] ?? "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const band = String(row[bandColumn] ?? "");
      counts[band] = (counts[band] ?? 0) + 1;
      if (drill.length < DRILLDOWN_LIMIT) {
        drill.push({ id, label: id, band, at: String(row[timeColumn] ?? "") });
      }
    }
    return { counts, drill };
  } catch {
    return empty;
  }
}

interface ForecastRow {
  queue: string;
  basis: "seasonal" | "sparse" | "empty";
  staffing: ReadonlyArray<{ date: string; recommendedAgents: number; rationale: string }>;
  observedDaily: ReadonlyArray<{ date: string; count: number }>;
  perHour: ReadonlyArray<{ at: string; predicted: number }>;
}

/** The newest forecast row per queue: ONE bounded read serves every queue. */
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

/** Observed daily volume for a queue, from the batch-published counts, ending
 *  at the last COMPLETE day. */
function observedSeries(row: ForecastRow | undefined, now: Date): SeriesPoint[] {
  if (!row || row.observedDaily.length === 0) return [];
  const counts = new Map<string, number>();
  for (const d of row.observedDaily) counts.set(d.date, d.count);
  return densifyCompleteDays(counts, now, SERIES_WINDOW_DAYS);
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
      // V3-40 tables + journal. Only a `security` staff session returns rows.
      const [flagged, enforcement, latest] = await Promise.all([
        loadJournalSeries(supabase, "risk_batch_runs", now, (c) => {
          const tiers = (c.tiers && typeof c.tiers === "object" ? c.tiers : {}) as Record<string, unknown>;
          return num(tiers.review) + num(tiers.freeze);
        }),
        loadDailyEvents(supabase, "risk_enforcement_log", "created_at", now),
        loadLatestSnapshot(supabase, "risk_scores", "entity_id", "tier", "scored_at", ["review", "freeze"], now),
      ]);
      return {
        lens,
        series: [
          { key: "risk_flagged", kind: "observed", points: flagged, href: "/modules/staff-risk" },
          { key: "enforcement_actions", kind: "observed", points: enforcement, href: "/modules/staff-risk" },
        ],
        bands: { risk: latest.counts },
        forecasts: [],
        drill: latest.drill,
      };
    }
    case "finance": {
      const [forecasts, watchList, latest] = await Promise.all([
        loadLatestForecasts(supabase, now),
        loadJournalSeries(supabase, "predictive_batch_runs", now, (c) => num(c.dispute_watch)),
        loadLatestSnapshot(
          supabase,
          "dispute_likelihoods",
          "transaction_id",
          "band",
          "scored_at",
          ["watch", "high"],
          now,
        ),
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
        bands: { dispute: latest.counts },
        forecasts: [],
        drill: latest.drill,
      };
    }
    case "support": {
      const [forecasts, atRisk, latest] = await Promise.all([
        loadLatestForecasts(supabase, now),
        loadJournalSeries(supabase, "predictive_batch_runs", now, (c) => num(c.at_risk)),
        loadLatestSnapshot(
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
        bands: { quality: latest.counts },
        forecasts: support ? [{ queue: support.queue, basis: support.basis, staffing: support.staffing }] : [],
        drill: latest.drill,
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

/**
 * Persisted accept/dismiss/snooze state for EXACTLY the cards being shown.
 *
 * Filtering by the current card keys (rather than "the newest 40 rows for the
 * lens") means no pile of other rows, junk or legitimate, can push a real
 * decision out of the read window and make a dismissed card reappear.
 */
export async function loadRecommendationState(
  supabase: IntelligenceSupabaseClient,
  lens: LensKey,
  cardKeys: readonly string[],
): Promise<RecommendationStateRow[]> {
  if (cardKeys.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from("staff_recommendation_state")
      .select("recommendation_key,status,snooze_until,role_scope")
      .eq("role_scope", lens)
      .in("recommendation_key", cardKeys.slice(0, RECOMMENDATION_LIMIT))
      .order("updated_at", { ascending: false })
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
