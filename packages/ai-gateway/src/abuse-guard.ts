// The AI Abuse Guard — a layered, cheapest-first defence for the FREE surfaces (support chat,
// studio brief coach, and the other subsidised assists). Free AI is a real cost, and a small
// number of people burn it on junk. This module is the brain of the defence:
//
//   1. assessFreeMessage  — a CHEAP pre-model filter. Reject the clearest junk (empty, a
//      paste-bomb, an exact repeat, a single character mashed) BEFORE spending a token. The
//      model is the expensive part; this never calls it.
//   2. evaluateFreeAccess — the access policy. Anonymous visitors get a small taste, then must
//      sign in to keep using free AI (which makes heavy users trackable). An actor who keeps
//      being refused is restricted from FREE AI for a cooling-off window (they can still pay and
//      still reach a human).
//   3. shouldRestrict     — turn an accumulating refusal count into a temporary restriction.
//
// Pure + client-safe. Deliberately HIGH-PRECISION on the pre-filter: it must never reject a
// genuine question, including one in a non-Latin script (language mirroring is sacred), so it
// only catches junk it is certain about and leaves nuance to the model + the doctrine's scope rules.

/** How the cheap pre-filter judged a single message. */
export type JunkVerdict = "ok" | "empty" | "too_long" | "repeat" | "char_mash";

export interface FreeMessageAssessment {
  /** True when the message is worth sending to the model. */
  ok: boolean;
  verdict: JunkVerdict;
}

/** Above this length a single free-chat message is a paste-bomb, not a question. */
export const FREE_MESSAGE_MAX_CHARS = 4000;

/**
 * The cheap pre-model check. Returns ok:false ONLY for junk we are certain about, so the caller
 * can return a canned redirect without calling the model. Never rejects a real question.
 */
export function assessFreeMessage(input: { text: string; recentUserTexts?: string[] }): FreeMessageAssessment {
  const raw = String(input.text ?? "");
  const text = raw.trim();
  if (!text) return { ok: false, verdict: "empty" };
  if (text.length > FREE_MESSAGE_MAX_CHARS) return { ok: false, verdict: "too_long" };

  // An exact repeat of a recent turn is a person hammering the same thing (or a script).
  const recent = (input.recentUserTexts ?? []).map((t) => String(t ?? "").trim().toLowerCase());
  if (recent.length > 0 && recent.includes(text.toLowerCase())) return { ok: false, verdict: "repeat" };

  // A single character (or the same short run) mashed out — e.g. "aaaaaaaa", "........", ";;;;;".
  // Only fires when there is genuinely one distinct non-space character across a long-ish string,
  // so multi-byte scripts (which have many distinct characters) are never caught.
  const compact = text.replace(/\s+/g, "");
  if (compact.length >= 8) {
    const distinct = new Set([...compact]);
    if (distinct.size <= 1) return { ok: false, verdict: "char_mash" };
  }

  return { ok: true, verdict: "ok" };
}

// ---------------------------------------------------------------------------
// Access policy
// ---------------------------------------------------------------------------

/** Anonymous visitors may sample this many free turns before they must sign in to continue. */
export const ANON_FREE_TURNS_BEFORE_SIGN_IN = 6;
/** Refusals in the window that trip a temporary restriction on free AI. */
export const FREE_ABUSE_REFUSAL_THRESHOLD = 8;
/** How long a restriction lasts once tripped. */
export const FREE_RESTRICTION_WINDOW_MS = 24 * 60 * 60 * 1000;

export type FreeAccessDecision = "allow" | "require_sign_in" | "restricted";

export interface FreeActorStats {
  /** Whether the actor is anonymous (no signed-in user id). */
  isAnonymous: boolean;
  /** Free turns this actor has already spent in the current window. */
  turnsInWindow: number;
  /** Turns the AI refused / redirected as off-topic in the current window. */
  refusedInWindow: number;
  /** Epoch ms this actor is restricted until, if any. */
  restrictedUntilMs?: number | null;
}

export interface FreeAccessOutcome {
  decision: FreeAccessDecision;
  /** A short machine reason (for telemetry + choosing copy). */
  reason: "ok" | "restricted" | "anon_limit";
}

/**
 * Decide whether a free-AI turn may proceed for this actor. Restriction wins (a flagged abuser is
 * held for the cooling-off window); then the anonymous taste limit (sign in to continue); else allow.
 */
export function evaluateFreeAccess(stats: FreeActorStats, nowMs: number): FreeAccessOutcome {
  if (stats.restrictedUntilMs && stats.restrictedUntilMs > nowMs) {
    return { decision: "restricted", reason: "restricted" };
  }
  if (stats.isAnonymous && stats.turnsInWindow >= ANON_FREE_TURNS_BEFORE_SIGN_IN) {
    return { decision: "require_sign_in", reason: "anon_limit" };
  }
  return { decision: "allow", reason: "ok" };
}

/**
 * Given the actor's refusal count after this turn, decide whether to trip a restriction and until
 * when. Keeps the escalation graduated: friction accrues, then a temporary hold, never an instant ban.
 */
export function shouldRestrict(refusedInWindow: number, nowMs: number): { restrict: boolean; untilMs: number | null } {
  if (refusedInWindow >= FREE_ABUSE_REFUSAL_THRESHOLD) {
    return { restrict: true, untilMs: nowMs + FREE_RESTRICTION_WINDOW_MS };
  }
  return { restrict: false, untilMs: null };
}
