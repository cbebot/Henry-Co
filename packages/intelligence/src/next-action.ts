/**
 * V3-39 — the per-page, context-aware "do this next" resolver (ARCHITECTURE §4.4).
 *
 * Extends — never replaces — `nextAccountSteps`: the account-wide recommender
 * stays the single source of account-level next steps; this module adds the
 * page-contextual layer and the cross-division stitch on top of it.
 *
 * Structural guarantees (the V3-36 doctrine, applied here):
 *
 *   1. DETERMINISTIC AND PURE. No AI call, no clock, no randomness, no I/O —
 *      the same inputs always produce the same 0–2 actions. The AI-hybrid
 *      recommendation variant is V3-36's domain, consumed only through the
 *      injected `providedRecommendations` seam below.
 *   2. NO TABLE ACCESS BY CONSTRUCTION. The resolver reads nothing; every
 *      signal (context, dismissals, opt-out, consent, V3-36 sets) arrives
 *      through the caller's already-viewer-scoped reads. There is no query
 *      here to forget a viewer predicate on.
 *   3. OPAQUE SCORING (ANTI-CLONE Principle 1). Candidates carry a numeric
 *      `score` used only to order; the public `NextAction` drops it at the
 *      module boundary — only ranked items + reason CODES leave the engine.
 *   4. SENSITIVE ⇒ INLINE, structurally. A `sensitive: true` action (KYC,
 *      wallet, destructive) is forced to `placement: "inline"` in the final
 *      projection regardless of what a catalog author wrote — it can never
 *      become a floating chip.
 *   5. OPT-OUT AND DISMISSALS WIN (E-D2 / PRIVACY-NDPR §4). The in-product
 *      next step on the current page runs on legitimate interest with user
 *      control: `promptsEnabled: false` empties the result entirely; a
 *      dismissed `(contextKind, actionId)` pair never resurfaces.
 *   6. CROSS-DIVISION STITCH = PROFILING ⇒ CONSENT-GATED, FAILS SAFE. Stitch
 *      candidates are admitted ONLY when `stitchConsent === true`; unknown /
 *      error / absent resolves to false and the same-page floor stands alone.
 *
 * The candidate catalog is deliberately a SEED SET (one or two obvious steps
 * per page kind). It extends organically in later passes — do not grow it into
 * an exhaustive 30+ action matrix here.
 */

import { henryDomain } from "@henryco/config";
import {
  nextAccountSteps,
  type HenryDivision,
  type Recommendation,
  type RecommendationConfidence,
  type UserContext,
} from "./index";

/** The page kinds the seed catalog understands. */
export type PageContextKind =
  | "account_home"
  | "marketplace_listing"
  | "care_service"
  | "jobs_detail"
  | "studio_brief"
  | "learn_course"
  | "property_listing"
  | "logistics_booking";

/** A just-finished cross-division action the host derived from the viewer's
 *  OWN lifecycle/activity reads (never another user's). The `kind` vocabulary
 *  the stitch understands is `StitchSourceKind`; unknown kinds are ignored. */
export interface PageContext {
  kind: PageContextKind;
  division: HenryDivision;
  /** listing/service/job/brief id — used only to build the deep link. */
  entityId?: string;
  recentCompletedActions?: { kind: string; division: HenryDivision; at: string }[];
}

/** The completed-action kinds the cross-division stitch maps (S3 seed set). */
export const STITCH_SOURCE_KINDS = [
  "care_booking",
  "learn_course",
  "marketplace_purchase",
] as const;
export type StitchSourceKind = (typeof STITCH_SOURCE_KINDS)[number];

export interface NextAction extends Recommendation {
  placement: "inline" | "floating_chip";
  contextKind: PageContextKind;
  /** Gates floating-chip eligibility — sensitive actions render inline only. */
  sensitive: boolean;
  /** True when this action bridges INTO a sibling division from a completed
   *  action (S3) — the host emits `henry.next_action.stitched` for these,
   *  distinct from a same-division surface, so cross-division lift is
   *  measurable. */
  stitched: boolean;
}

/** One localized copy entry. All strings come from the typed i18n module
 *  (`surface:next_action` — `getNextActionCopy(locale).actions`); the engine
 *  itself carries NO user-facing literals. */
export interface NextActionCopyEntry {
  title: string;
  description?: string;
  ctaLabel: string;
}

/**
 * The full copy bundle for the seed catalog. Structurally mirrored by
 * `NextActionCopy["actions"]` in `@henryco/i18n` — the host app (which
 * depends on both packages) is where TypeScript enforces the two shapes
 * agree, keeping this package free of an i18n dependency.
 */
export interface NextActionCatalogCopy {
  marketplaceSave: NextActionCopyEntry;
  marketplaceCompare: NextActionCopyEntry;
  careBook: NextActionCopyEntry;
  jobsApply: NextActionCopyEntry;
  jobsSave: NextActionCopyEntry;
  studioQuote: NextActionCopyEntry;
  learnContinue: NextActionCopyEntry;
  propertyInspection: NextActionCopyEntry;
  propertySave: NextActionCopyEntry;
  logisticsTrack: NextActionCopyEntry;
  logisticsReturn: NextActionCopyEntry;
  stitchCareToJobs: NextActionCopyEntry;
  stitchLearnToJobs: NextActionCopyEntry;
  stitchMarketplaceToLogistics: NextActionCopyEntry;
}

export interface NextActionDismissalRef {
  contextKind: PageContextKind;
  actionId: string;
}

export interface NextActionOptions {
  /** Localized catalog copy — REQUIRED so no literal ever lives here. */
  copy: NextActionCatalogCopy;
  /**
   * The `customer_preferences.next_action_prompts_enabled` control (E-D2:
   * in-product next steps run on legitimate interest, default ON, with user
   * control). `false` suppresses EVERYTHING this resolver produces; `null` /
   * `undefined` (not-yet-answered or read failure) means the default ON.
   */
  promptsEnabled?: boolean | null;
  /**
   * Account-authoritative personalization consent (V3-34 helper). Gates ONLY
   * the cross-division stitch (profiling). Fails safe: unknown/error ⇒ the
   * caller passes false/undefined ⇒ no stitch, floor intact.
   */
  stitchConsent?: boolean;
  /** Viewer's own persisted dismissals (`next_action_dismissals`, RLS-read). */
  dismissed?: ReadonlyArray<NextActionDismissalRef>;
  /**
   * The V3-36 seam: when the cross-division recommendation engine has already
   * produced a viewer-scoped, consent-gated set, the host may inject it and
   * the stitch draws its target-division item from there (same id, copy, and
   * deep link — one recommendation truth). Absent (V3-36 dark or unshipped),
   * the deterministic stitch catalog below stands on its own. This module
   * NEVER imports the V3-36 engine — the seam is data, not a dependency.
   */
  providedRecommendations?: ReadonlyArray<Recommendation>;
  /**
   * Cross-division href builder — defaults to `henryDomain` so every stitch /
   * catalog link is division-config-derived (zero hardcoded hosts). Injectable
   * for tests and for hosts that serve sibling divisions on local paths.
   */
  buildHref?: (division: HenryDivision, path: string) => string;
  /** Result cap (0–2 per the contract). Values above 2 are clamped to 2. */
  limit?: number;
}

/** Internal candidate — carries the server-only numeric score; the projection
 *  to `NextAction` drops it at the boundary (a test asserts no `score` key
 *  survives). */
type NextActionCandidate = Omit<NextAction, "placement"> & {
  score: number;
  placement: NextAction["placement"];
};

const CONFIDENCE_SCORE: Record<RecommendationConfidence, number> = {
  high: 0.9,
  medium: 0.6,
  low: 0.3,
};

function accountHomeCandidates(
  ctx: UserContext,
  page: PageContext,
): NextActionCandidate[] {
  // Defer entirely to the existing account-wide recommender — it stays the
  // single source of truth for account-level steps. The trust/KYC step is
  // sensitive by classification (identity documents) and therefore inline-only.
  return nextAccountSteps(ctx).map((rec) => {
    const sensitive = rec.reasonCodes.includes("trust_pending");
    return {
      ...rec,
      contextKind: page.kind,
      sensitive,
      stitched: false,
      placement: sensitive ? ("inline" as const) : ("floating_chip" as const),
      score: CONFIDENCE_SCORE[rec.confidence],
    };
  });
}

/**
 * The per-page seed catalog (S2). Every entry deep-links into the division's
 * real workflow step via the injected href builder (default `henryDomain`) —
 * never a hardcoded host. None of these seed actions is sensitive (no KYC, no
 * wallet move, no destructive step lives in this catalog by design).
 */
function pageCandidates(
  ctx: UserContext,
  page: PageContext,
  copy: NextActionCatalogCopy,
  href: (division: HenryDivision, path: string) => string,
): NextActionCandidate[] {
  const id = page.entityId;
  const restricted = ctx.trustState === "restricted" || ctx.trustState === "frozen";

  const candidate = (
    actionId: string,
    division: HenryDivision,
    entry: NextActionCopyEntry,
    ctaHref: string,
    score: number,
    confidence: RecommendationConfidence,
    reasonCodes: Recommendation["reasonCodes"],
  ): NextActionCandidate => ({
    id: actionId,
    division,
    title: entry.title,
    description: entry.description,
    reasonCodes,
    confidence,
    ctaHref,
    ctaLabel: entry.ctaLabel,
    placement: "floating_chip",
    contextKind: page.kind,
    sensitive: false,
    stitched: false,
    score,
  });

  switch (page.kind) {
    case "account_home":
      return accountHomeCandidates(ctx, page);
    case "marketplace_listing":
      return [
        candidate(
          "marketplace-save",
          "marketplace",
          copy.marketplaceSave,
          href("marketplace", id ? `/product/${id}?intent=save` : "/search"),
          0.6,
          "medium",
          ["saved_items"],
        ),
        candidate(
          "marketplace-compare",
          "marketplace",
          copy.marketplaceCompare,
          href("marketplace", id ? `/search?similar=${id}` : "/search"),
          0.4,
          "low",
          ["recent_activity"],
        ),
      ];
    case "care_service":
      return [
        candidate(
          "care-book",
          "care",
          copy.careBook,
          href("care", id ? `/book?service=${id}` : "/book"),
          0.7,
          "high",
          ["recent_activity"],
        ),
      ];
    case "jobs_detail": {
      // Profile-ready viewers get the direct apply step; everyone else (and any
      // restricted/frozen account) gets the low-stakes save step instead.
      const profileReady = ctx.profileCompleteness >= 0.6 && !restricted;
      return profileReady
        ? [
            candidate(
              "jobs-apply",
              "jobs",
              copy.jobsApply,
              href("jobs", id ? `/jobs/${id}?intent=apply` : "/jobs"),
              0.8,
              "high",
              ["recent_activity"],
            ),
          ]
        : [
            candidate(
              "jobs-save",
              "jobs",
              copy.jobsSave,
              href("jobs", id ? `/jobs/${id}?intent=save` : "/jobs"),
              0.5,
              "medium",
              ["saved_items"],
            ),
          ];
    }
    case "studio_brief":
      return [
        candidate(
          "studio-quote",
          "studio",
          copy.studioQuote,
          href("studio", "/request"),
          0.7,
          "high",
          ["recent_activity"],
        ),
      ];
    case "learn_course":
      return [
        candidate(
          "learn-continue",
          "learn",
          copy.learnContinue,
          href("learn", id ? `/learner/courses/${id}` : "/learner"),
          0.8,
          "high",
          ["recent_activity"],
        ),
      ];
    case "property_listing":
      return [
        candidate(
          "property-inspection",
          "property",
          copy.propertyInspection,
          href("property", id ? `/property/${id}?intent=viewing` : "/search"),
          0.7,
          "high",
          ["recent_activity"],
        ),
        candidate(
          "property-save",
          "property",
          copy.propertySave,
          href("property", id ? `/property/${id}?intent=save` : "/search"),
          0.5,
          "medium",
          ["saved_items"],
        ),
      ];
    case "logistics_booking":
      return [
        candidate(
          "logistics-track",
          "logistics",
          copy.logisticsTrack,
          href("logistics", "/track"),
          0.7,
          "high",
          ["recent_activity"],
        ),
        candidate(
          "logistics-return",
          "logistics",
          copy.logisticsReturn,
          href("logistics", "/book?intent=return"),
          0.4,
          "low",
          ["recent_activity"],
        ),
      ];
    default:
      return [];
  }
}

/** The deterministic stitch map (S3 seed): completed action → sibling-division
 *  next step. Data, not bespoke code paths (ARCHITECTURE §7). */
const STITCH_MAP: Record<
  StitchSourceKind,
  {
    actionId: string;
    to: HenryDivision;
    path: string;
    copyKey: "stitchCareToJobs" | "stitchLearnToJobs" | "stitchMarketplaceToLogistics";
  }
> = {
  care_booking: {
    actionId: "stitch-care-jobs",
    to: "jobs",
    path: "/jobs?focus=care",
    copyKey: "stitchCareToJobs",
  },
  learn_course: {
    actionId: "stitch-learn-jobs",
    to: "jobs",
    path: "/jobs?focus=learning",
    copyKey: "stitchLearnToJobs",
  },
  marketplace_purchase: {
    actionId: "stitch-marketplace-logistics",
    to: "logistics",
    path: "/book",
    copyKey: "stitchMarketplaceToLogistics",
  },
};

function stitchCandidates(
  page: PageContext,
  copy: NextActionCatalogCopy,
  href: (division: HenryDivision, path: string) => string,
  provided: ReadonlyArray<Recommendation> | undefined,
): NextActionCandidate[] {
  const out: NextActionCandidate[] = [];
  for (const completed of page.recentCompletedActions ?? []) {
    const mapping = STITCH_MAP[completed.kind as StitchSourceKind];
    if (!mapping) continue;
    // Never bridge back into the division the viewer is already standing in.
    if (mapping.to === page.division) continue;

    // V3-36 seam: when the recommendation engine already produced a set, the
    // stitch surfaces ITS target-division item (same id/copy/deep link — one
    // recommendation truth) instead of minting a parallel one.
    const providedMatch = provided?.find((rec) => rec.division === mapping.to);
    if (providedMatch) {
      out.push({
        ...providedMatch,
        reasonCodes: providedMatch.reasonCodes.includes("cross_sell_division")
          ? providedMatch.reasonCodes
          : [...providedMatch.reasonCodes, "cross_sell_division"],
        placement: "floating_chip",
        contextKind: page.kind,
        sensitive: false,
        stitched: true,
        score: 0.75,
      });
      continue;
    }

    const entry = copy[mapping.copyKey];
    out.push({
      id: mapping.actionId,
      division: mapping.to,
      title: entry.title,
      description: entry.description,
      reasonCodes: ["cross_sell_division"],
      confidence: "medium",
      ctaHref: href(mapping.to, mapping.path),
      ctaLabel: entry.ctaLabel,
      placement: "floating_chip",
      contextKind: page.kind,
      sensitive: false,
      stitched: true,
      score: 0.75,
    });
  }
  return out;
}

/** Deterministic order: score desc, then division, then id — never wall-clock
 *  or map-iteration order (the V3-36 tie-break doctrine). */
function deterministicSort(a: NextActionCandidate, b: NextActionCandidate): number {
  if (b.score !== a.score) return b.score - a.score;
  if (a.division !== b.division) return a.division < b.division ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Project to the public contract — drops the numeric `score` and enforces the
 *  sensitive⇒inline invariant structurally (rule 4 above). */
function toPublic(candidate: NextActionCandidate): NextAction {
  return {
    id: candidate.id,
    division: candidate.division,
    title: candidate.title,
    description: candidate.description,
    reasonCodes: candidate.reasonCodes,
    confidence: candidate.confidence,
    ctaHref: candidate.ctaHref,
    ctaLabel: candidate.ctaLabel,
    placement: candidate.sensitive ? "inline" : candidate.placement,
    contextKind: candidate.contextKind,
    sensitive: candidate.sensitive,
    stitched: candidate.stitched,
  };
}

/**
 * Resolve the 0–2 most relevant next actions for the viewer on this page.
 * Server-only by convention (the host resolves and ships only the final
 * objects to the client — the catalog and user signals never leave the
 * server); pure by construction.
 */
export function resolveNextAction(
  ctx: UserContext,
  page: PageContext,
  options: NextActionOptions,
): NextAction[] {
  // Opt-out wins over everything: no nags past a user's "off".
  if (options.promptsEnabled === false) return [];

  const href = options.buildHref ?? henryDomain;
  const limit = Math.max(0, Math.min(options.limit ?? 2, 2));

  const candidates: NextActionCandidate[] = [
    ...pageCandidates(ctx, page, options.copy, href),
    // The stitch is cross-division PROFILING — consent-gated, fails safe.
    ...(options.stitchConsent === true
      ? stitchCandidates(page, options.copy, href, options.providedRecommendations)
      : []),
  ];

  const dismissed = new Set(
    (options.dismissed ?? []).map((d) => `${d.contextKind}::${d.actionId}`),
  );

  const seenId = new Set<string>();
  const seenHref = new Set<string>();
  const picked: NextActionCandidate[] = [];
  for (const candidate of [...candidates].sort(deterministicSort)) {
    if (picked.length >= limit) break;
    if (dismissed.has(`${candidate.contextKind}::${candidate.id}`)) continue;
    if (seenId.has(candidate.id) || seenHref.has(candidate.ctaHref)) continue;
    seenId.add(candidate.id);
    seenHref.add(candidate.ctaHref);
    picked.push(candidate);
  }

  return picked.map(toPublic);
}

/** The single floating-chip pick for a page (one chip max). Sensitive and
 *  inline actions are never eligible — this is the host's chip gate. */
export function pickFloatingChipAction(actions: ReadonlyArray<NextAction>): NextAction | null {
  for (const action of actions) {
    if (action.placement === "floating_chip" && !action.sensitive) return action;
  }
  return null;
}
