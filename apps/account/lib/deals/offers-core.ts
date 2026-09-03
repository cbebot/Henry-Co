import {
  henryDivisionSchema,
  type DealCandidate,
  type DealReasonCode,
  type DealTerms,
  type HenryDivision,
} from "@henryco/intelligence";
import { getDivisionUrl, henryWebRoot, type DivisionKey } from "@henryco/config";

/**
 * V3-35 — pure candidate construction for the account deals rail.
 *
 * NO I/O and NO server-only imports so every rule here is unit-tested:
 * deterministic scoring (same row + same clock ⇒ same score), the
 * floor/targeted admission split, and the URL construction (config-derived,
 * zero hardcoded domains). The server wiring in `offers.ts` feeds these to
 * the `selectDeals` engine as injected readers.
 *
 * Viewer scoping by construction: the ONLY viewer-derived input is the
 * viewer's OWN recent-division mix (from their signal feed). No other user's
 * data can enter a candidate, and the catalog rows themselves are public
 * offer artifacts that carry no personal data.
 */

/** Structural row shape (mirrors @henryco/data DealRow's catalog fields). */
export type DealCatalogRow = {
  id: string;
  creator_partner_id: string | null;
  title: string;
  description: string | null;
  deal_type: string;
  discount_percent: number | null;
  discount_minor: number | null;
  discount_currency: string | null;
  scope_division: string | null;
  scope_categories: string[];
  target_ref: string | null;
  ends_at: string;
  created_at: string;
  visibility: string;
  audience_signals: unknown;
};

const ENDING_SOON_MS = 72 * 60 * 60 * 1000;
const NEW_THIS_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Divisions that have a public site URL in COMPANY config. */
const URL_DIVISIONS = new Set<string>([
  "hub",
  "care",
  "marketplace",
  "property",
  "logistics",
  "studio",
  "jobs",
  "learn",
]);

/** Parse the row's division against the canonical envelope enum (null = cross-division). */
export function parseDealDivision(value: string | null): HenryDivision | null {
  if (!value) return null;
  const parsed = henryDivisionSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Config-derived deep link — never a hardcoded domain. */
export function dealHref(row: Pick<DealCatalogRow, "scope_division" | "target_ref">): string {
  const division = parseDealDivision(row.scope_division);
  if (division === "marketplace" && row.target_ref) {
    return `${getDivisionUrl("marketplace")}/product/${row.target_ref}`;
  }
  if (division && URL_DIVISIONS.has(division)) {
    return getDivisionUrl(division as DivisionKey);
  }
  return henryWebRoot("/");
}

/** Map the DB artifact shape onto the typed terms union (invalid ⇒ null ⇒ skipped). */
export function toDealTerms(row: DealCatalogRow): DealTerms | null {
  switch (row.deal_type) {
    case "percent_off":
      return typeof row.discount_percent === "number" && Number.isInteger(row.discount_percent)
        ? { kind: "percent_off", percent: row.discount_percent }
        : null;
    case "fixed_off":
      return typeof row.discount_minor === "number" &&
        Number.isInteger(row.discount_minor) &&
        typeof row.discount_currency === "string"
        ? { kind: "fixed_off", amountMinor: row.discount_minor, currency: row.discount_currency }
        : null;
    case "bogo":
      return { kind: "bogo" };
    case "bundle":
      return { kind: "bundle" };
    case "spotlight":
      return { kind: "spotlight" };
    default:
      return null;
  }
}

function timeReasonsAndBoost(
  row: DealCatalogRow,
  nowMs: number,
): { boost: number; reasons: DealReasonCode[] } {
  const reasons: DealReasonCode[] = [];
  let boost = 0;
  const endsMs = Date.parse(row.ends_at);
  if (!Number.isNaN(endsMs) && endsMs - nowMs <= ENDING_SOON_MS) {
    reasons.push("ending_soon");
    boost += 0.2;
  }
  const createdMs = Date.parse(row.created_at);
  if (!Number.isNaN(createdMs) && nowMs - createdMs <= NEW_THIS_WEEK_MS) {
    reasons.push("new_this_week");
    boost += 0.1;
  }
  return { boost, reasons };
}

function baseCandidate(
  row: DealCatalogRow,
  terms: DealTerms,
  nowMs: number,
): Omit<DealCandidate, "score" | "tier" | "origin" | "reasonCodes"> & {
  timeBoost: number;
  timeReasons: DealReasonCode[];
} {
  const division = parseDealDivision(row.scope_division);
  const { boost, reasons } = timeReasonsAndBoost(row, nowMs);
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    terms,
    division,
    categories: row.scope_categories,
    ctaHref: dealHref(row),
    endsAt: row.ends_at,
    creatorKey: row.creator_partner_id ?? "platform",
    timeBoost: boost,
    timeReasons: reasons,
  };
}

/**
 * FLOOR candidate — the untargeted division-local default every viewer sees.
 * Admits ONLY `public` visibility (defense-in-depth on top of the data-layer
 * wall) and never reads anything about the viewer.
 */
export function floorCandidate(row: DealCatalogRow, nowMs: number): DealCandidate | null {
  if (row.visibility !== "public") return null;
  const terms = toDealTerms(row);
  if (!terms) return null;
  const base = baseCandidate(row, terms, nowMs);
  const { timeBoost, timeReasons, ...core } = base;
  return {
    ...core,
    reasonCodes: [
      base.division === null ? "cross_division_offer" : "division_local",
      ...timeReasons,
    ],
    score: 0.5 + timeBoost,
    tier: "floor",
    origin: "floor-catalog",
  };
}

/** The viewer's OWN recent-division mix — the only profiling signal used. */
export function deriveRecentDealDivisions(
  signals: ReadonlyArray<{ division?: string | null }>,
): Set<HenryDivision> {
  const out = new Set<HenryDivision>();
  for (const signal of signals) {
    const division = parseDealDivision(signal.division ?? null);
    if (division) out.add(division);
  }
  return out;
}

function audienceDivisions(row: DealCatalogRow): string[] {
  const signals = row.audience_signals;
  if (!signals || typeof signals !== "object" || Array.isArray(signals)) return [];
  const divisions = (signals as Record<string, unknown>).divisions;
  if (!Array.isArray(divisions)) return [];
  return divisions.filter((entry): entry is string => typeof entry === "string");
}

/**
 * TARGETED candidate — CONSENT-GATED profiling (the engine only invokes the
 * targeted reader when the V3-34 account consent resolved TRUE). Admits a row
 * only when it matches the viewer's own recent-division mix, either by
 * `scope_division` or by the deal's `audience_signals.divisions` descriptors.
 * This is the only reader allowed to admit `targeted`-visibility rows.
 */
export function targetedCandidate(
  row: DealCatalogRow,
  recentDivisions: ReadonlySet<HenryDivision>,
  nowMs: number,
): DealCandidate | null {
  if (row.visibility !== "public" && row.visibility !== "targeted") return null;
  const division = parseDealDivision(row.scope_division);
  const divisionMatch = division !== null && recentDivisions.has(division);
  const audienceMatch = audienceDivisions(row).some((entry) => {
    const parsed = parseDealDivision(entry);
    return parsed !== null && recentDivisions.has(parsed);
  });
  if (!divisionMatch && !audienceMatch) return null;
  const terms = toDealTerms(row);
  if (!terms) return null;
  const base = baseCandidate(row, terms, nowMs);
  const { timeBoost, timeReasons, ...core } = base;
  return {
    ...core,
    reasonCodes: ["recent_division_activity", ...timeReasons],
    score: 0.65 + timeBoost,
    tier: "targeted",
    origin: "targeted-catalog",
  };
}
