// ---------------------------------------------------------------------------
// @henryco/moderation — type contract (client-safe; no server-only imports)
//
// One cross-division moderation spine. Decision vocabulary is deliberately
// distinct from @henryco/trust's ModerationAction (approve/reject/escalate/
// warn/block): this package gates *publish* (approve/hold/reject), trust
// manages the case lifecycle. The two layers compose, they do not overlap.
// ---------------------------------------------------------------------------

/** The four publishable content domains this spine gates. */
export type ContentType =
  | "marketplace_listing"
  | "job_post"
  | "studio_brief"
  | "service_profile";

/**
 * Publish gate decision.
 * - `approve` — may render live.
 * - `hold`    — withheld pending human review (never renders live).
 * - `reject`  — blocked (never renders live). Automated only on unambiguous
 *               deterministic hits; AI never auto-rejects (it maps to hold).
 */
export type ModerationDecision = "approve" | "hold" | "reject";

/** Which scanner produced the recorded decision. */
export type ScannerKind = "deterministic_rule" | "ai_check" | "manual";

/** Severity ranking shared with @henryco/trust's vocabulary. */
export type ModerationSeverity = "low" | "medium" | "high" | "critical";

/**
 * Stable reason codes. These are CHECK-free identifiers persisted into
 * `moderation_decisions.reasons[]` and surfaced (via i18n) in the staff queue.
 * Adding a code here is safe (text[] column, no enum CHECK) — but keep the
 * human-readable labels in @henryco/i18n moderation copy in lockstep.
 */
export type ModerationReason =
  | "banned_goods"
  | "hate_speech"
  | "profanity"
  | "pii_leak"
  | "off_platform_contact"
  | "scam_suspected"
  | "image_hash_match"
  | "ai_flagged_scam"
  | "ai_flagged_nsfw"
  | "ai_flagged_abuse"
  | "ai_flagged_other"
  | "user_reported";

/** Input to the moderation pipeline. */
export interface ModerationInput {
  contentType: ContentType;
  contentId: string;
  /** Concatenated public text of the content (title + body, etc.). */
  text?: string;
  /** Public image refs/URLs attached to the content. */
  imageUrls?: ReadonlyArray<string>;
  /** Locale for locale-aware deterministic rules (BCP-47-ish; "en" default). */
  locale: string;
  /** Author of the content, for audit/repeat-offender context. */
  actorId?: string | null;
}

/** Pure evaluation result (no persistence — the test surface). */
export interface ModerationEvaluation {
  decision: ModerationDecision;
  reasons: ModerationReason[];
  scanner: ScannerKind;
  severity: ModerationSeverity;
  /** True when an unambiguous deterministic reject short-circuited the AI. */
  shortCircuited: boolean;
}

/** Public outcome returned by the server-side `moderate()` orchestrator. */
export interface ModerationOutcome {
  decision: ModerationDecision;
  reasons: ReadonlyArray<ModerationReason>;
  scanner: ScannerKind;
  /** Empty string when persistence was skipped (no supabase client supplied). */
  decisionId: string;
}

// ---- Deterministic detector contracts -------------------------------------

/** A single deterministic detector's verdict. */
export interface DetectorVerdict {
  /**
   * The strongest decision this detector justifies on its own.
   * `reject` from a detector that is `unambiguous` short-circuits the pipeline.
   */
  decision: ModerationDecision;
  reasons: ModerationReason[];
  severity: ModerationSeverity;
  /** When true and decision==="reject", the pipeline rejects without the AI. */
  unambiguous: boolean;
  /** Free-form detail (pattern names, matched categories) — never raw PII. */
  detail?: string[];
}

// ---- AI scan contracts (V3-26 injected via DI; never imported directly) ----

/** Request handed to an injected AI router. */
export interface AiScanRequest {
  contentType: ContentType;
  text?: string;
  imageUrls?: ReadonlyArray<string>;
  locale: string;
}

/** Raw classification an AI router returns. */
export interface AiScanResult {
  /** AI recommendation. A router `reject` is downgraded to `hold` (human-gated). */
  recommendation: "approve" | "hold" | "reject";
  reasons: ModerationReason[];
  /** 0..1 model confidence. */
  confidence: number;
}

/**
 * The injected AI router interface. @henryco/moderation NEVER imports a
 * provider SDK or @henryco/ai-router directly — the caller supplies an adapter.
 * When V3-26 lands, a thin adapter implements this against the governed router.
 * Returning `null` (or throwing) means "AI unavailable" → degrade, never fail open.
 */
export interface ModerationAiRouter {
  scan(request: AiScanRequest): Promise<AiScanResult | null>;
}

// ---- Image-hash contract --------------------------------------------------

/**
 * Perceptual-hash check input. Hashes are computed out-of-band (image bytes
 * are not decoded in this package); the known-bad set is supplied by the
 * caller (CSAM authority list + internal banned-image hashes) at deploy time.
 */
export interface ImageHashInput {
  hashes: ReadonlyArray<string>;
  knownBad: ReadonlySet<string>;
}
