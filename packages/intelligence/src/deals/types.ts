import type { HenryDivision } from "../index";

/**
 * V3-35 — deal & campaign vocabulary (client-safe types only).
 *
 * A deal is an OFFER ARTIFACT: audited terms with a time box — never a price
 * mutation. Terms are integer-only (percent as integer, fixed amounts in
 * integer minor units + ISO 4217 currency); no float ever represents money.
 * The actual money path (any discount reaching checkout) lives exclusively in
 * the behavior-locked payment surface — nothing in this module touches it.
 */

/** Where a deal was rendered — mirrors the deal_impressions.surface CHECK. */
export type DealSurfaceKind = "home_module" | "all_deals" | "division_mini";

/** Deal lifecycle — mirrors the deals.status CHECK. */
export type DealStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "active"
  | "paused"
  | "expired"
  | "rejected";

export type DealVisibility = "public" | "targeted" | "unlisted";

/**
 * The offer terms artifact. Integer-only by construction:
 * `percent` is an integer 1..100; `amountMinor` is integer minor units
 * (kobo/cents) with an explicit ISO 4217 `currency`.
 */
export type DealTerms =
  | { kind: "percent_off"; percent: number }
  | { kind: "fixed_off"; amountMinor: number; currency: string }
  | { kind: "bogo" }
  | { kind: "bundle" }
  | { kind: "spotlight" };

/**
 * Stable, localized-at-render reason CODES — the ONLY ranking explanation that
 * ever leaves the engine (numeric scores are dropped at the module boundary).
 */
export type DealReasonCode =
  | "division_local"
  | "recent_division_activity"
  | "category_match"
  | "ending_soon"
  | "new_this_week"
  | "cross_division_offer";

/**
 * An internal candidate. Carries the numeric `score` (server-only — never
 * serialized), its admission `tier`, the `creatorKey` the diversity guard and
 * fairness audit group by, and `origin` (which injected reader produced it —
 * tests/telemetry only). All four are dropped at the public boundary.
 */
export type DealCandidate = {
  id: string;
  title: string;
  description?: string;
  terms: DealTerms;
  /** Division slug; null = cross-division offer. */
  division: HenryDivision | null;
  categories: ReadonlyArray<string>;
  ctaHref: string;
  /** ISO datetime the offer ends. */
  endsAt: string;
  /**
   * Fairness grouping key: the partner id for partner deals, a stable
   * platform key otherwise. Server-only (audit + diversity guard).
   */
  creatorKey: string;
  reasonCodes: ReadonlyArray<DealReasonCode>;
  /** Server-only relevance score (0..1+). Dropped at the public boundary. */
  score: number;
  /** 'floor' = untargeted division-local default; 'targeted' = consent-gated profiling. */
  tier: "floor" | "targeted";
  /** Which injected reader produced this. Never client-bound. */
  origin: string;
};

/** The opaque, client-safe offer projection — NO score, tier, origin, or creatorKey. */
export type DealOffer = {
  id: string;
  title: string;
  description?: string;
  terms: DealTerms;
  division: HenryDivision | null;
  ctaHref: string;
  endsAt: string;
  reasonCodes: ReadonlyArray<DealReasonCode>;
};
