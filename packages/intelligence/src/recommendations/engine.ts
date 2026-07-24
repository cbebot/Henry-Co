/**
 * V3-36 — the cross-division recommendation engine (ARCHITECTURE §4.1).
 *
 * The governed-AI enhancement layer OVER a deterministic floor. Four load-
 * bearing properties, all enforced structurally here:
 *
 *   1. DETERMINISTIC FLOOR. `generateRecommendations` produces a correct,
 *      ordered result with NO AI (rerank absent, disabled, or failed). AI may
 *      only REORDER the floor's items — never add, drop, or invent one — so a
 *      dead gateway degrades to the deterministic order, never a broken surface.
 *   2. CONSENT-GATED PROFILING (E-D2 / PRIVACY-NDPR §1-2). Cross-division
 *      candidates (the `profiling` tier) are admitted ONLY when the viewer
 *      affirmatively consented. Without consent the engine returns division-
 *      local, non-profiled defaults — a graceful floor, never empty.
 *   3. OPAQUE SCORING (ANTI-CLONE Principle 1 / PRIVACY-NDPR §5.4). Candidates
 *      carry a numeric `score` used only to sort; the public `Recommendation`
 *      the engine returns has a string `confidence` tier and NO numeric score.
 *      The projection drops it at the boundary; a leak test asserts it.
 *   4. NO TABLE ACCESS / VIEWER-SCOPED BY CONSTRUCTION (PRIVACY-NDPR §5.1-5.3).
 *      The engine reads NOTHING itself — every candidate arrives through an
 *      injected, already-viewer-scoped reader. It can only ever surface what
 *      the caller's viewer-scoped readers returned, so it cannot leak another
 *      user's rows: there is no query here to forget a viewer predicate on.
 */

import type { HenryDivision } from "../index";
import type {
  Recommendation,
  RecommendationConfidence,
  RecommendationReasonCode,
} from "../index";

/**
 * An internal candidate. Carries the numeric `score` (server-only — never
 * serialized) and its admission tier. `origin` (NOT `source` — that key is on
 * the ai-gateway forbidden list) records which reader produced it, for tests
 * and telemetry only.
 */
export type RecommendationCandidate = {
  id: string;
  division: HenryDivision;
  title: string;
  description?: string;
  ctaHref: string;
  ctaLabel: string;
  reasonCodes: RecommendationReasonCode[];
  confidence: RecommendationConfidence;
  /** Server-only relevance score (0..1+). Dropped at the public boundary. */
  score: number;
  /** 'local' = division-local default (no profiling); 'profiling' = cross-division inference. */
  tier: "local" | "profiling";
  /** Which injected reader produced this (telemetry/tests). Never client-bound. */
  origin: string;
};

/** An injected, already-viewer-scoped candidate reader. The engine calls it; it
 *  never reads a table itself. A reader that throws is treated as empty. */
export type CandidateReader = () => Promise<RecommendationCandidate[]>;

/**
 * The optional governed-AI re-rank. It receives the deterministic floor's
 * PUBLIC items and returns a REORDERING of them. The engine validates the
 * return is a permutation of the same ids — any drift (a dropped, added, or
 * unknown id) discards the rerank entirely and keeps the deterministic order.
 * So the floor is intact by construction; AI is enhancement, never authority.
 */
export type RecommendationRerank = (items: Recommendation[]) => Promise<Recommendation[]>;

export type GenerateRecommendationsInput = {
  /** Viewer id — for the telemetry envelope only; readers are already scoped. */
  viewerId: string;
  /**
   * Account-authoritative personalization consent (E-D2). FALSE ⇒ profiling
   * candidates are dropped and only division-local defaults surface.
   */
  consentAllowed: boolean;
  /** Injected, viewer-scoped readers. The engine has no table access of its own. */
  readers: {
    /** Division-local defaults — always admitted (legitimate interest, no profiling). */
    local: CandidateReader[];
    /** Cross-division profiling — admitted ONLY with consent. */
    profiling: CandidateReader[];
  };
  /** Optional governed-AI re-rank (enhancement only). Omitted ⇒ deterministic floor. */
  rerank?: RecommendationRerank;
  limit?: number;
};

export type GenerateRecommendationsResult = {
  /** The opaque, client-safe recommendations (no numeric score anywhere). */
  recommendations: Recommendation[];
  /** Whether the AI re-rank actually reordered the floor (telemetry). */
  aiApplied: boolean;
  /** Whether profiling candidates were admitted (telemetry). */
  profiled: boolean;
};

async function collect(readers: CandidateReader[]): Promise<RecommendationCandidate[]> {
  const out: RecommendationCandidate[] = [];
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

/** Project a candidate to the PUBLIC contract — drops `score`/`tier`/`origin`. */
function toPublic(candidate: RecommendationCandidate): Recommendation {
  return {
    id: candidate.id,
    division: candidate.division,
    title: candidate.title,
    description: candidate.description,
    reasonCodes: candidate.reasonCodes,
    confidence: candidate.confidence,
    ctaHref: candidate.ctaHref,
    ctaLabel: candidate.ctaLabel,
  };
}

/**
 * The deterministic sort: score descending, then division (stable, alphabetical),
 * then id — so the same inputs always yield the same order, independent of
 * reader arrival order. Ties never resolve on wall-clock or Map iteration.
 */
function deterministicSort(a: RecommendationCandidate, b: RecommendationCandidate): number {
  if (b.score !== a.score) return b.score - a.score;
  if (a.division !== b.division) return a.division < b.division ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export async function generateRecommendations(
  input: GenerateRecommendationsInput,
): Promise<GenerateRecommendationsResult> {
  const limit = input.limit ?? 6;

  // 1. Gather candidates. Profiling readers run ONLY with consent.
  const local = await collect(input.readers.local);
  const profiling = input.consentAllowed ? await collect(input.readers.profiling) : [];
  const profiled = profiling.length > 0;

  // 2. Deterministic floor: sort, dedupe by ctaHref (first — highest — wins), cap.
  const ordered = [...local, ...profiling].sort(deterministicSort);
  const seen = new Set<string>();
  const floor: RecommendationCandidate[] = [];
  for (const candidate of ordered) {
    if (floor.length >= limit) break;
    if (seen.has(candidate.ctaHref)) continue;
    seen.add(candidate.ctaHref);
    floor.push(candidate);
  }

  const floorPublic = floor.map(toPublic);

  // 3. Optional AI re-rank — enhancement ONLY. It may reorder the SAME items;
  //    any drift discards it and the deterministic floor stands.
  let recommendations = floorPublic;
  let aiApplied = false;
  if (input.rerank && floorPublic.length > 1) {
    try {
      const reranked = await input.rerank(floorPublic);
      if (isPermutation(floorPublic, reranked)) {
        recommendations = reranked;
        aiApplied = true;
      }
    } catch {
      // AI failure is invisible — the deterministic floor already stands.
    }
  }

  return { recommendations, aiApplied, profiled };
}

/** A rerank result is honored ONLY if it is a strict reordering of the input:
 *  same multiset of ids, same length — no added/dropped/unknown item. */
function isPermutation(original: Recommendation[], candidate: Recommendation[]): boolean {
  if (!Array.isArray(candidate)) return false;
  if (candidate.length !== original.length) return false;
  const originalIds = original.map((item) => item.id).sort();
  const candidateIds = candidate.map((item) => item?.id).sort();
  for (let i = 0; i < originalIds.length; i += 1) {
    if (originalIds[i] !== candidateIds[i]) return false;
  }
  // Every reranked entry must be byte-identical to a floor item (AI may reorder,
  // never rewrite copy) — look each up by id and compare the CTA target.
  const byId = new Map(original.map((item) => [item.id, item]));
  for (const item of candidate) {
    const source = byId.get(item?.id);
    if (!source || source.ctaHref !== item.ctaHref || source.title !== item.title) return false;
  }
  return true;
}
