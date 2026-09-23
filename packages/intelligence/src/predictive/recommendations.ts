/**
 * V3-42 S3 — recommendation derivation (ARCHITECTURE §5.5).
 *
 * Turns the raw predictive output of V3-40 (risk) and V3-41 (quality/workload)
 * plus the S2 anomaly verdicts into a small set of cards an operator can act on.
 *
 * THE LINE THIS FILE ENFORCES: a recommendation PROPOSES. It cannot act.
 *
 *   - A card is data: a stable key, a kind, a role scope, numeric params and an
 *     optional deep link. There is no field that could carry an operation, a
 *     mutation, a rule body or a target to apply something to.
 *   - `advisory: true` is a literal on every card, mirrored by the DB CHECK on
 *     `staff_recommendation_state` which refuses any state change without a
 *     HUMAN actor. So even "accept" is only an acknowledgement — the platform
 *     cannot accept its own suggestion.
 *   - The rule-suggestion card is deliberately phrased as hindsight ("a rule
 *     like this WOULD HAVE prevented N disputes"). Accepting it records that a
 *     human agrees and deep-links them to the surface where they would build it.
 *     It never writes a rule. Automation is V3-43/44/47 and is human-gated there.
 *
 * As with every Phase E engine: NO AI, PURE + DETERMINISTIC (no clock — `asOf`
 * is an input), and DB-LESS (the caller supplies already-RLS-scoped inputs).
 *
 * Cards carry CODES and NUMBERS, never sentences. `surface:staff_intelligence`
 * turns `{ kind: "staffing_increase", params: { queue: "support", extra: 2 } }`
 * into words, in twelve locales.
 */

import type { AnomalyResult } from "./anomaly";
import { QUEUE_KEYS, type QueueKey, type StaffingRecommendation } from "./workload";

/** The four dashboard lenses. Mirrors `staff_recommendation_state.role_scope`. */
export const RECOMMENDATION_ROLE_SCOPES = ["trust", "finance", "support", "moderation"] as const;
export type RecommendationRoleScope = (typeof RECOMMENDATION_ROLE_SCOPES)[number];

export const RECOMMENDATION_KINDS = [
  "staffing_increase",
  "investigate_anomaly",
  "review_at_risk_units",
  "review_dispute_watchlist",
  "review_risk_backlog",
  "rule_suggestion_hindsight",
] as const;
export type RecommendationKind = (typeof RECOMMENDATION_KINDS)[number];

export type RecommendationSeverity = "info" | "attention";

export interface RecommendationCard {
  /** Stable identity; the `recommendation_key` persisted against accept/dismiss. */
  key: string;
  kind: RecommendationKind;
  roleScope: RecommendationRoleScope;
  severity: RecommendationSeverity;
  /** Interpolation values for the localized card text. Numbers and codes only. */
  params: Readonly<Record<string, string | number>>;
  /** Where a human goes to act. A LINK — following it is their decision. */
  href?: string;
  /** Discriminator: this card proposes and can never apply anything. */
  readonly advisory: true;
}

export interface DeriveRecommendationsInput {
  /** Forecast origin, ISO. Keeps key generation and week bucketing pure. */
  asOf: string;
  /** Per-queue staffing outlook from V3-41's forecaster. */
  forecasts?: ReadonlyArray<{
    queue: QueueKey;
    staffing: ReadonlyArray<StaffingRecommendation>;
    /** Agents currently covering the queue, when the caller knows it. */
    currentAgents?: number | null;
    /** 'empty'/'sparse' forecasts must never drive a staffing card. */
    basis?: "seasonal" | "sparse" | "empty";
  }>;
  /** Fired anomalies from S2. */
  anomalies?: ReadonlyArray<AnomalyResult>;
  /** Counts from V3-41's quality output. */
  atRisk?: { high: number; elevated: number } | null;
  /** Counts from V3-41's dispute output. */
  disputeWatch?: { high: number; watch: number } | null;
  /** Counts from V3-40's risk output — trust lens only. */
  riskBacklog?: { review: number; freeze: number } | null;
  /** Hindsight: disputes in the trailing window that shared one dominant factor. */
  disputeHindsight?: { factor: string; disputes: number; windowDays: number } | null;
  /** Cap on cards returned per lens. A rail nobody reads helps nobody. */
  maxPerScope?: number;
}

/** Which series belongs to which lens. An anomaly only reaches the operators
 *  whose surface it concerns. */
export const SERIES_SCOPE: Readonly<Record<string, RecommendationRoleScope>> = {
  refund_requests: "finance",
  payout_requests: "finance",
  dispute_rate: "finance",
  support_volume: "support",
  at_risk_units: "support",
  enforcement_actions: "trust",
  risk_flagged: "trust",
  report_volume: "moderation",
  kyc_submissions: "moderation",
};

const DEFAULT_MAX_PER_SCOPE = 4;

function isoWeekKey(asOf: string): string {
  const ms = Date.parse(asOf);
  if (!Number.isFinite(ms)) return "undated";
  // ISO-8601 week: Thursday of the current week determines the year.
  const d = new Date(ms);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  const thursday = new Date(d.getTime() + (3 - day) * 86_400_000);
  const year = thursday.getUTCFullYear();
  const jan4 = Date.UTC(year, 0, 4);
  const jan4Day = (new Date(jan4).getUTCDay() + 6) % 7;
  const week1Monday = jan4 - jan4Day * 86_400_000;
  const week = Math.floor((thursday.getTime() - week1Monday) / (7 * 86_400_000)) + 1;
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function safeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/**
 * Derive the recommendation cards for every lens.
 *
 * Deterministic ordering: cards are emitted lens by lens in a fixed sequence, so
 * the rail does not reshuffle between renders — an operator's eye should be able
 * to learn where a card lives.
 */
export function deriveRecommendations(input: DeriveRecommendationsInput): RecommendationCard[] {
  const week = isoWeekKey(input.asOf);
  const maxPerScope = safeCount(input.maxPerScope) || DEFAULT_MAX_PER_SCOPE;
  const cards: RecommendationCard[] = [];

  // --- Staffing, from the workload forecast (support lens) ------------------
  for (const forecast of input.forecasts ?? []) {
    // An 'empty' or 'sparse' forecast is explicitly NOT evidence. V3-41 reports
    // its own basis precisely so a downstream surface cannot launder a guess
    // into a staffing instruction.
    if (forecast.basis === "empty" || forecast.basis === "sparse") continue;
    const peak = (forecast.staffing ?? []).reduce(
      (max, s) => Math.max(max, safeCount(s?.recommendedAgents)),
      0,
    );
    if (peak <= 0) continue;
    const current = safeCount(forecast.currentAgents);
    // Only suggest a change when the forecast asks for MORE than is covering it.
    // With no known current cover, fall back to the "above capacity" rationale.
    const aboveCapacity = (forecast.staffing ?? []).some(
      (s) => s?.rationale === "forecast_above_capacity",
    );
    const extra = current > 0 ? peak - current : 0;
    if (extra <= 0 && !aboveCapacity) continue;
    cards.push({
      key: `workload.staffing.${forecast.queue}.${week}`,
      kind: "staffing_increase",
      roleScope: "support",
      severity: aboveCapacity ? "attention" : "info",
      params: { queue: forecast.queue, recommended: peak, extra: Math.max(0, extra), week },
      href: `/modules/staff-support`,
      advisory: true,
    });
  }

  // --- Anomalies, routed to the lens that owns the series -------------------
  for (const anomaly of input.anomalies ?? []) {
    if (!anomaly?.detected) continue;
    const scope = Object.prototype.hasOwnProperty.call(SERIES_SCOPE, anomaly.series)
      ? SERIES_SCOPE[anomaly.series]
      : undefined;
    if (!scope) continue;
    cards.push({
      key: `anomaly.${anomaly.series}.${anomaly.at.slice(0, 10)}`,
      kind: "investigate_anomaly",
      roleScope: scope,
      severity: anomaly.band === "alert" ? "attention" : "info",
      params: {
        series: anomaly.series,
        observed: anomaly.observed,
        expected: anomaly.expected,
        // The magnitude, rounded to one decimal — enough for "3.5x above normal",
        // not enough to imply false precision.
        deviation: Math.round(Math.abs(anomaly.deviation) * 10) / 10,
        band: anomaly.band,
      },
      advisory: true,
    });
  }

  // --- Quality backlog (support lens) ---------------------------------------
  const atRiskHigh = safeCount(input.atRisk?.high);
  const atRiskElevated = safeCount(input.atRisk?.elevated);
  if (atRiskHigh > 0) {
    cards.push({
      key: `quality.at_risk.${week}`,
      kind: "review_at_risk_units",
      roleScope: "support",
      severity: "attention",
      params: { high: atRiskHigh, elevated: atRiskElevated },
      href: `/modules/staff-support`,
      advisory: true,
    });
  }

  // --- Dispute watch-list (finance lens) ------------------------------------
  const disputeHigh = safeCount(input.disputeWatch?.high);
  const disputeWatch = safeCount(input.disputeWatch?.watch);
  if (disputeHigh > 0 || disputeWatch > 0) {
    cards.push({
      key: `dispute.watchlist.${week}`,
      kind: "review_dispute_watchlist",
      roleScope: "finance",
      severity: disputeHigh > 0 ? "attention" : "info",
      params: { high: disputeHigh, watch: disputeWatch },
      href: `/modules/staff-finance-operator`,
      advisory: true,
    });
  }

  // --- Risk backlog (TRUST lens only) ---------------------------------------
  // Note the scope: these counts come from V3-40 tables that only security staff
  // can read at all. A card about them must never surface on another lens.
  const riskReview = safeCount(input.riskBacklog?.review);
  const riskFreeze = safeCount(input.riskBacklog?.freeze);
  if (riskReview > 0 || riskFreeze > 0) {
    cards.push({
      key: `risk.backlog.${week}`,
      kind: "review_risk_backlog",
      roleScope: "trust",
      severity: riskFreeze > 0 ? "attention" : "info",
      params: { review: riskReview, freeze: riskFreeze },
      href: `/modules/staff-risk`,
      advisory: true,
    });
  }

  // --- Hindsight rule suggestion (trust lens) -------------------------------
  const hindsight = input.disputeHindsight;
  if (hindsight && safeCount(hindsight.disputes) >= 5) {
    cards.push({
      key: `hindsight.rule.${hindsight.factor}.${week}`,
      kind: "rule_suggestion_hindsight",
      roleScope: "trust",
      severity: "info",
      params: {
        factor: hindsight.factor,
        disputes: safeCount(hindsight.disputes),
        windowDays: safeCount(hindsight.windowDays),
      },
      // Deep-links to the review queue, NOT to a rule builder. Accepting this
      // card records agreement; a human still designs and applies any rule.
      href: `/modules/staff-risk`,
      advisory: true,
    });
  }

  // --- Cap per lens, preserving the deterministic order ---------------------
  const perScope = new Map<RecommendationRoleScope, number>();
  return cards.filter((card) => {
    const seen = perScope.get(card.roleScope) ?? 0;
    if (seen >= maxPerScope) return false;
    perScope.set(card.roleScope, seen + 1);
    return true;
  });
}

/** The cards one lens should render. */
export function recommendationsForScope(
  cards: ReadonlyArray<RecommendationCard>,
  scope: RecommendationRoleScope,
): RecommendationCard[] {
  return cards.filter((card) => card.roleScope === scope);
}

/**
 * Runtime backstop mirroring the DB CHECK: a recommendation state change away
 * from 'open' REQUIRES a human actor. Throws otherwise, so a future caller
 * cannot quietly add a system-accept path.
 */
export const RECOMMENDATION_STATUSES = ["open", "accepted", "dismissed", "snoozed"] as const;
export type RecommendationStatus = (typeof RECOMMENDATION_STATUSES)[number];

export function assertHumanActor(status: string, actorId: string | null | undefined): void {
  if (!(RECOMMENDATION_STATUSES as readonly string[]).includes(status)) {
    throw new Error(`V3-42 invariant: "${status}" is not a recommendation status.`);
  }
  if (status !== "open" && !(typeof actorId === "string" && actorId.trim())) {
    throw new Error(
      `V3-42 invariant: status "${status}" requires a human actor. ` +
        "The platform may never accept, dismiss or snooze its own recommendation.",
    );
  }
}

/** Recommendation keys are slugs: bounded, no whitespace, nothing that could
 *  smuggle markup or control characters into an audit log. */
const RECOMMENDATION_KEY_PATTERN = /^[A-Za-z0-9._-]{3,160}$/;

const WEEK = String.raw`\d{4}-W\d{2}`;
const DAY = String.raw`\d{4}-\d{2}-\d{2}`;
/** Queue and series names are plain identifiers; anything else is dropped
 *  rather than escaped, so no name can ever widen the grammar. */
const alternatives = (values: readonly string[]): string =>
  values.filter((v) => /^[a-z][a-z0-9_]*$/.test(v)).join("|");

/**
 * The EXACT key grammars `deriveRecommendations` emits (adversarial round 2).
 * Matching only the first two dot-segments let a staffer mint unlimited junk
 * keys (`workload.staffing.ATTACKER.2026-W39`, `anomaly.x.JUNK.2026-09-22`),
 * each a new state row skewing the soak metrics. Now a key is one of these
 * shapes, with a known queue / series, or it is nothing.
 */
const KEY_GRAMMAR: ReadonlyArray<{ pattern: RegExp; scope: (m: RegExpMatchArray) => RecommendationRoleScope | null }> = [
  {
    pattern: new RegExp(String.raw`^workload\.staffing\.(?:${alternatives(QUEUE_KEYS)})\.${WEEK}$`),
    scope: () => "support",
  },
  { pattern: new RegExp(String.raw`^quality\.at_risk\.${WEEK}$`), scope: () => "support" },
  { pattern: new RegExp(String.raw`^dispute\.watchlist\.${WEEK}$`), scope: () => "finance" },
  { pattern: new RegExp(String.raw`^risk\.backlog\.${WEEK}$`), scope: () => "trust" },
  { pattern: new RegExp(String.raw`^hindsight\.rule\.[a-z][a-z0-9_]{0,47}\.${WEEK}$`), scope: () => "trust" },
  {
    pattern: new RegExp(String.raw`^anomaly\.(${alternatives(Object.keys(SERIES_SCOPE))})\.${DAY}$`),
    scope: (m) => (Object.prototype.hasOwnProperty.call(SERIES_SCOPE, m[1]) ? SERIES_SCOPE[m[1]] : null),
  },
];

/**
 * Which lens a recommendation KEY belongs to — derived from the same key shapes
 * `deriveRecommendations` emits, so there is one source of truth.
 *
 * The write path uses this to refuse a key written under the wrong lens. The
 * lens-permission check already stops a support operator acting on the trust
 * lens; this closes the remaining gap, where they could write a trust-SHAPED
 * key under their own lens and quietly skew the accept/dismiss soak metrics the
 * owner tunes cards against. Returns null for anything the engine never emits.
 */
export function recommendationScopeForKey(key: unknown): RecommendationRoleScope | null {
  if (typeof key !== "string" || !RECOMMENDATION_KEY_PATTERN.test(key)) return null;
  for (const rule of KEY_GRAMMAR) {
    const match = key.match(rule.pattern);
    if (match) return rule.scope(match);
  }
  return null;
}

/**
 * Snapshot series are points stamped on the RUN day (a batch journal), so
 * today's point is real; every other anomaly series counts ARRIVALS and is
 * only ever judged once its day has completed. Snapshot series are also NOT
 * Poisson counts — they re-tally the same scored entities each night, so their
 * day-to-day noise is far below sqrt(level) and the detector must judge them
 * with `countData: false` (round 3).
 */
export const SNAPSHOT_SERIES: ReadonlySet<string> = new Set(["risk_flagged", "dispute_rate", "at_risk_units"]);

/**
 * Is this key's time suffix CURRENT? Backlog cards are keyed by ISO week and
 * anomaly cards by day; the engine only ever emits the current week, and
 * anomalies from the chart window. The write path refuses anything else, so a
 * lens member cannot pre-dismiss next month's cards for the whole team.
 */
export function isRecommendationKeyCurrent(key: unknown, now: Date): boolean {
  if (recommendationScopeForKey(key) === null) return false;
  const suffix = (key as string).split(".").pop() ?? "";
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs)) return false;
  if (/^\d{4}-W\d{2}$/.test(suffix)) {
    // Current week or the previous one (a card raised late on Sunday).
    return suffix === isoWeekKey(now.toISOString()) || suffix === isoWeekKey(new Date(nowMs - 7 * 86_400_000).toISOString());
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(suffix)) {
    const ms = Date.parse(`${suffix}T00:00:00.000Z`);
    // Round-trip: Date.parse rolls "2026-09-31" over to October 1.
    if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 10) !== suffix) return false;
    // The newest day the engine can have judged: today for a batch-journal
    // series, yesterday for an arrival series (round 2 — a wider window let a
    // lens member mute tomorrow's spike in advance).
    const series = (key as string).split(".")[1] ?? "";
    const todayMs = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`);
    const newestMs = SNAPSHOT_SERIES.has(series) ? todayMs : todayMs - 86_400_000;
    return ms <= newestMs && ms >= todayMs - 35 * 86_400_000;
  }
  return false;
}
