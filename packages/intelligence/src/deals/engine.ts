/**
 * V3-35 — the deal selection engine (ARCHITECTURE §4.2).
 *
 * Replicates the V3-36 structural pattern. Four load-bearing properties, all
 * enforced here by construction:
 *
 *   1. DETERMINISTIC FLOOR. `selectDeals` produces a correct, complete result
 *      from the untargeted division-local readers alone — the list every user
 *      sees with all flags dark and consent absent. This pass has NO AI slice:
 *      selection and ordering are fully deterministic; same inputs, same order.
 *   2. CONSENT-GATED TARGETING (E-D2 / PRIVACY-NDPR §1-2). Targeted readers
 *      (profiling a person to select or boost deals) run ONLY when the viewer
 *      affirmatively consented. Without consent the floor stands alone —
 *      graceful, never empty because targeting is off.
 *   3. OPAQUE SCORING (ANTI-CLONE Principle 1). Candidates carry a numeric
 *      `score` used only to sort; the public `DealOffer` carries reason CODES
 *      and no number. `toPublicOffer` drops score/tier/origin/creatorKey at
 *      the boundary; a leak test asserts it key-by-key.
 *   4. NO TABLE ACCESS / VIEWER-SCOPED BY CONSTRUCTION (PRIVACY-NDPR §5).
 *      The engine reads NOTHING itself — every candidate arrives through an
 *      injected, already-viewer-scoped reader. There is no query here to
 *      forget a viewer predicate on.
 *
 * Plus the pass-specific guarantee: a DIVERSITY GUARD caps consecutive cards
 * from the same creator (mirroring the V3-52 marketplace ranking guard), so
 * ranking alone can never hand one creator a monopoly run of the surface.
 */

import type { DealCandidate, DealOffer } from "./types";

/** An injected, already-viewer-scoped candidate reader. A throw = empty. */
export type DealCandidateReader = () => Promise<DealCandidate[]>;

export type SelectDealsInput = {
  /** Viewer id for telemetry only (null on anonymous surfaces). Readers are already scoped. */
  viewerId: string | null;
  /**
   * Account-authoritative personalization consent (V3-34 helper; unknown or
   * read-error resolve to FALSE upstream). FALSE ⇒ targeted readers never run.
   */
  consentAllowed: boolean;
  readers: {
    /** Untargeted division-local live deals — the floor every user sees. */
    floor: DealCandidateReader[];
    /** Consent-gated targeting (profiling) readers. */
    targeted: DealCandidateReader[];
  };
  limit?: number;
  /** Diversity guard: max consecutive cards per creator (default 1). */
  maxConsecutivePerCreator?: number;
};

export type SelectDealsResult = {
  /** Opaque, client-safe offers (no numeric score anywhere). */
  deals: DealOffer[];
  /** Whether targeted candidates were admitted (telemetry only). */
  targeted: boolean;
};

async function collect(readers: DealCandidateReader[]): Promise<DealCandidate[]> {
  const out: DealCandidate[] = [];
  for (const read of readers) {
    try {
      const rows = await read();
      for (const row of rows) out.push(row);
    } catch {
      // A failed reader contributes nothing — never breaks the floor.
    }
  }
  return out;
}

/** Project a candidate to the PUBLIC contract — drops score/tier/origin/creatorKey. */
export function toPublicOffer(candidate: DealCandidate): DealOffer {
  return {
    id: candidate.id,
    title: candidate.title,
    description: candidate.description,
    terms: candidate.terms,
    division: candidate.division,
    ctaHref: candidate.ctaHref,
    endsAt: candidate.endsAt,
    reasonCodes: candidate.reasonCodes,
  };
}

/**
 * Deterministic sort: score desc, then soonest-ending, then id — the same
 * inputs always yield the same order regardless of reader arrival order.
 * Ties never resolve on wall-clock or Map iteration.
 */
function deterministicSort(a: DealCandidate, b: DealCandidate): number {
  if (b.score !== a.score) return b.score - a.score;
  if (a.endsAt !== b.endsAt) return a.endsAt < b.endsAt ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * The diversity guard: greedily re-orders the ranked list so no creator holds
 * more than `maxRun` consecutive slots while an alternative creator exists.
 * Pure + deterministic; when only one creator remains, its cards flow
 * unrestricted (the guard prefers diversity, never drops an offer).
 */
export function applyDiversityGuard(
  ranked: ReadonlyArray<DealCandidate>,
  maxRun: number,
): DealCandidate[] {
  if (maxRun < 1) maxRun = 1;
  const remaining = [...ranked];
  const out: DealCandidate[] = [];
  let runKey: string | null = null;
  let runLength = 0;

  while (remaining.length > 0) {
    let pickIndex = 0;
    if (runLength >= maxRun) {
      const alternative = remaining.findIndex((c) => c.creatorKey !== runKey);
      if (alternative >= 0) pickIndex = alternative;
    }
    const [pick] = remaining.splice(pickIndex, 1);
    if (pick.creatorKey === runKey) {
      runLength += 1;
    } else {
      runKey = pick.creatorKey;
      runLength = 1;
    }
    out.push(pick);
  }
  return out;
}

export async function selectDeals(input: SelectDealsInput): Promise<SelectDealsResult> {
  const limit = input.limit ?? 6;
  const maxRun = input.maxConsecutivePerCreator ?? 1;

  // 1. Gather candidates. Targeted readers run ONLY with consent.
  const floor = await collect(input.readers.floor);
  const targeted = input.consentAllowed ? await collect(input.readers.targeted) : [];

  // 2. Deterministic ranking, then dedupe by id AND ctaHref (first — highest —
  //    wins; targeted duplicates of a floor deal keep the higher-scored copy).
  const ordered = [...floor, ...targeted].sort(deterministicSort);
  const seenId = new Set<string>();
  const seenHref = new Set<string>();
  const deduped: DealCandidate[] = [];
  for (const candidate of ordered) {
    if (seenId.has(candidate.id) || seenHref.has(candidate.ctaHref)) continue;
    seenId.add(candidate.id);
    seenHref.add(candidate.ctaHref);
    deduped.push(candidate);
  }

  // 3. Diversity guard over the full ranked list, THEN cap — so the guard can
  //    pull a lower-ranked alternative creator into the visible window.
  const guarded = applyDiversityGuard(deduped, maxRun).slice(0, limit);

  return {
    deals: guarded.map(toPublicOffer),
    targeted: targeted.length > 0,
  };
}
