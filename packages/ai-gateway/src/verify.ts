// The Henry Onyx Verified trust layer — the verdict contract + a fail-safe parser + the
// badge gate. Pure + client-safe. The verdict AUGMENTS human moderation: it can award a
// trust badge or route to review/reject, but it NEVER grants publish authority — go-live
// still flows through the human-submitted upsert + the existing moderation gate.

export type VerdictDecision = "verified" | "review" | "reject";

export interface ListingVerdict {
  /** Claims match what is shown; nothing fabricated. */
  honest: boolean;
  /** The media appears AI-generated / synthetic rather than real. */
  aiGeneratedMedia: boolean;
  /** Meets Henry Onyx content standards. */
  matchesStandards: boolean;
  /** Safe to post (no prohibited/unsafe content). */
  safeToPost: boolean;
  /** 0..100 confidence in the listing's trustworthiness. */
  trustScore: number;
  /** Short, human-readable reasons (bounded). */
  reasons: string[];
  /** The model's own call. Normalised; an unknown value becomes "review". */
  verdict: VerdictDecision;
}

/** The minimum trust score for the Verified badge (with all flags clean). Governed default. */
export const VERIFIED_TRUST_THRESHOLD = 75;

const MAX_REASONS = 10;
const MAX_REASON_LEN = 400;

function asBool(value: unknown): boolean {
  // Fail safe: anything that is not literally true is false. A missing honesty/safety flag
  // must NEVER be treated as a pass.
  return value === true;
}

function clampScore(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function normalizeVerdict(value: unknown): VerdictDecision {
  if (value === "pass" || value === "verified") return "verified";
  if (value === "reject") return "reject";
  // Unknown / "review" / anything else → review. Never silently "verified".
  return "review";
}

function stripFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenced) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

/**
 * Parse a model's verdict output into a {@link ListingVerdict}, fail-safe: malformed input
 * → null; missing honesty/safety/standards flags coerce to `false` (never a free pass); an
 * unknown verdict string normalises to `review`; the score clamps to 0..100; reasons are
 * bounded. A hostile or broken model can never produce a `verified` decision by accident.
 */
export function parseVerdict(raw: string): ListingVerdict | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripFences(raw));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const o = parsed as Record<string, unknown>;

  const reasons = Array.isArray(o.reasons)
    ? o.reasons.filter((r): r is string => typeof r === "string").slice(0, MAX_REASONS).map((r) => r.slice(0, MAX_REASON_LEN))
    : [];

  return {
    honest: asBool(o.honest),
    aiGeneratedMedia: asBool(o.aiGeneratedMedia),
    matchesStandards: asBool(o.matchesStandards),
    safeToPost: asBool(o.safeToPost),
    trustScore: clampScore(o.trustScore),
    reasons,
    verdict: normalizeVerdict(o.verdict),
  };
}

export interface VerdictResolution {
  /** Award the "Henry Onyx Verified" badge? Only when every gate is clean. */
  badge: boolean;
  /** What happens to the listing next. NEVER "publish" — humans/the upsert still gate go-live. */
  outcome: VerdictDecision;
  reasons: string[];
}

/**
 * The badge gate. Awards "Henry Onyx Verified" ONLY when the content is honest, real (not
 * AI-generated), on-standard, safe, scores at/above the threshold, AND the model said pass.
 * Unsafe content routes to `reject`; any other shortfall routes to `review`. This decision
 * augments human moderation — it grants a badge or routes for a human, never publishes.
 */
export function resolveVerdictDecision(v: ListingVerdict, threshold: number = VERIFIED_TRUST_THRESHOLD): VerdictResolution {
  // Unsafe is the hard stop — reject regardless of the model's own verdict.
  if (!v.safeToPost) {
    return { badge: false, outcome: "reject", reasons: v.reasons };
  }
  const clean = v.honest && !v.aiGeneratedMedia && v.matchesStandards && v.trustScore >= threshold && v.verdict === "verified";
  if (clean) {
    return { badge: true, outcome: "verified", reasons: v.reasons };
  }
  if (v.verdict === "reject") {
    return { badge: false, outcome: "reject", reasons: v.reasons };
  }
  return { badge: false, outcome: "review", reasons: v.reasons };
}
