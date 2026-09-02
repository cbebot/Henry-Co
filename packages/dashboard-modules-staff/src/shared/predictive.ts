/**
 * V3-41 — the server-safe predictive loader for staff queue modules.
 *
 * OPACITY BY OMISSION. The dispute reader deliberately does NOT select
 * `likelihood`. The raw 0..1 score therefore never leaves Postgres, never enters
 * a React tree and never reaches a browser — which is a stronger guarantee than
 * fetching it and remembering to drop it later (Phase E Prime Directive 11).
 * Staff get the BAND and the ranked factor codes, which is what a watch-list
 * actually needs.
 *
 * The client passed in is the RLS-scoped staff client, so the database — not
 * this file — decides who may read a row. A non-staff viewer gets zero rows even
 * if this loader is somehow reached.
 *
 * Every read is best-effort: before the migration is applied these tables do not
 * exist, and the panel must render its empty state rather than break the queue.
 */

import type {
  DisputeBand,
  DisputeFactor,
  ForecastBasis,
  QualityIntervention,
  QualityReasonCode,
  QueueKey,
  RiskBand,
  ServiceUnitType,
  StaffingRationaleCode,
  StaffingRecommendation,
  WorkloadForecastPoint,
} from "@henryco/intelligence";

/** Structural duck type — the same posture the sibling queue modules use. */
type PredictiveChain = {
  eq: (column: string, value: string) => PredictiveChain;
  order: (column: string, options?: { ascending?: boolean }) => PredictiveChain;
  limit: (count: number) => Promise<{
    data: Array<Record<string, unknown>> | null;
    error: { message: string } | null;
  }>;
};

export type PredictiveSupabaseClient = {
  from: (table: string) => { select: (columns: string) => PredictiveChain };
};

export type PredictiveForecastView = {
  queue: QueueKey;
  generatedAt: string;
  basis: ForecastBasis;
  sampleSize: number;
  /** Total predicted items across the horizon. */
  expectedTotal: number;
  /** Busiest single hour in the horizon. */
  busiestHour: number;
  staffing: ReadonlyArray<{ date: string; agents: number; rationale: StaffingRationaleCode }>;
  /** Optional governed-AI prose. Null is the normal state. */
  narrative: string | null;
};

export type PredictiveAtRiskView = {
  unitType: ServiceUnitType;
  unitId: string;
  band: RiskBand;
  reasons: ReadonlyArray<QualityReasonCode>;
  intervention: QualityIntervention | null;
};

export type PredictiveDisputeView = {
  transactionId: string;
  band: DisputeBand;
  factors: ReadonlyArray<DisputeFactor>;
};

export type PredictiveSnapshot = {
  forecast: PredictiveForecastView | null;
  atRisk: ReadonlyArray<PredictiveAtRiskView>;
  disputes: ReadonlyArray<PredictiveDisputeView>;
};

export const EMPTY_PREDICTIVE_SNAPSHOT: PredictiveSnapshot = {
  forecast: null,
  atRisk: [],
  disputes: [],
};

/** Which staff module maps to which forecast queue. Modules absent from this map
 *  simply render no forecast panel. */
export const MODULE_QUEUE_KEYS: Readonly<Record<string, QueueKey>> = {
  "staff-support": "support",
  "staff-moderation": "moderation",
  "staff-finance-operator": "finance",
  "staff-logistics": "logistics_ops",
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

async function loadForecast(
  supabase: PredictiveSupabaseClient,
  queue: QueueKey,
): Promise<PredictiveForecastView | null> {
  try {
    const { data, error } = await supabase
      .from("workload_forecasts")
      .select("queue,generated_at,payload,sample_size,basis,narrative")
      .eq("queue", queue)
      .order("generated_at", { ascending: false })
      .limit(1);
    if (error || !data || data.length === 0) return null;
    const row = data[0];
    const payload = (row.payload ?? {}) as {
      perHour?: WorkloadForecastPoint[];
      staffingRecommendation?: StaffingRecommendation[];
    };
    const perHour = Array.isArray(payload.perHour) ? payload.perHour : [];
    const staffing = Array.isArray(payload.staffingRecommendation)
      ? payload.staffingRecommendation
      : [];
    return {
      queue,
      generatedAt: String(row.generated_at ?? ""),
      basis: (row.basis as ForecastBasis) ?? "empty",
      sampleSize: Number(row.sample_size) || 0,
      expectedTotal: Math.round(perHour.reduce((sum, p) => sum + (Number(p?.predicted) || 0), 0)),
      busiestHour: Math.round(perHour.reduce((max, p) => Math.max(max, Number(p?.predicted) || 0), 0)),
      staffing: staffing.map((s) => ({
        date: String(s?.date ?? ""),
        agents: Number(s?.recommendedAgents) || 0,
        rationale: (s?.rationale as StaffingRationaleCode) ?? "insufficient_history",
      })),
      narrative: typeof row.narrative === "string" && row.narrative.trim() ? row.narrative : null,
    };
  } catch {
    return null;
  }
}

async function loadAtRisk(
  supabase: PredictiveSupabaseClient,
  limit: number,
): Promise<PredictiveAtRiskView[]> {
  try {
    const { data, error } = await supabase
      .from("quality_assessments")
      .select("unit_type,unit_id,risk_band,reasons,suggested_intervention,assessed_at")
      .order("assessed_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data
      .filter((row) => row.risk_band === "elevated" || row.risk_band === "high")
      .map((row) => ({
        unitType: row.unit_type as ServiceUnitType,
        unitId: String(row.unit_id ?? ""),
        band: row.risk_band as RiskBand,
        reasons: asStringArray(row.reasons) as QualityReasonCode[],
        intervention:
          typeof row.suggested_intervention === "string"
            ? (row.suggested_intervention as QualityIntervention)
            : null,
      }));
  } catch {
    return [];
  }
}

async function loadDisputes(
  supabase: PredictiveSupabaseClient,
  limit: number,
): Promise<PredictiveDisputeView[]> {
  try {
    // NOTE the column list: `likelihood` is deliberately NOT selected.
    const { data, error } = await supabase
      .from("dispute_likelihoods")
      .select("transaction_id,band,top_factors,scored_at")
      .order("scored_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data
      .filter((row) => row.band === "watch" || row.band === "high")
      .map((row) => ({
        transactionId: String(row.transaction_id ?? ""),
        band: row.band as DisputeBand,
        factors: (Array.isArray(row.top_factors) ? row.top_factors : [])
          .map((f) => (f && typeof f === "object" ? (f as { factor?: unknown }).factor : null))
          .filter((f): f is DisputeFactor => typeof f === "string"),
      }));
  } catch {
    return [];
  }
}

/**
 * Load the predictive snapshot for one staff module. `includeDisputes` is on for
 * the finance/operations surface only — a dispute watch-list is not useful on the
 * moderation or logistics queue and would just add noise.
 */
export async function loadPredictiveSnapshot(
  supabase: PredictiveSupabaseClient,
  moduleSlug: string,
  options?: { includeDisputes?: boolean; limit?: number },
): Promise<PredictiveSnapshot> {
  const queue = MODULE_QUEUE_KEYS[moduleSlug];
  if (!queue) return EMPTY_PREDICTIVE_SNAPSHOT;
  const limit = options?.limit ?? 25;
  const [forecast, atRisk, disputes] = await Promise.all([
    loadForecast(supabase, queue),
    loadAtRisk(supabase, limit),
    options?.includeDisputes ? loadDisputes(supabase, limit) : Promise.resolve([]),
  ]);
  return { forecast, atRisk, disputes };
}
