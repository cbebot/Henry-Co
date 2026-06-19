// ---------------------------------------------------------------------------
// deterministic/index.ts — run every deterministic rule, combine to one verdict
//
// Order is decision-significant: an UNAMBIGUOUS reject (banned goods, hate
// speech, known-bad image) short-circuits — the AI is never shown clearly-bad
// content and no spend is incurred. Everything else accumulates into a `hold`
// or `approve` candidate that the pipeline may then refine with the AI layer.
// ---------------------------------------------------------------------------

import { detectSuspiciousContent } from "@henryco/trust/detect";
import type {
  DetectorVerdict,
  ModerationInput,
  ModerationReason,
  ModerationSeverity,
} from "../types";
import { detectBannedGoods } from "./banned-goods";
import { detectProfanity } from "./profanity";
import { detectPiiLeak } from "./pii-leak";
import { checkImageHashes } from "./image-hash";

export { detectBannedGoods } from "./banned-goods";
export { detectProfanity, normalizeForLexicon } from "./profanity";
export { detectPiiLeak } from "./pii-leak";
export { checkImageHashes, hammingDistanceHex } from "./image-hash";

const SEVERITY_RANK: Record<ModerationSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};
const RANK_TO_SEVERITY: ModerationSeverity[] = ["low", "medium", "high", "critical"];

function maxSeverity(a: ModerationSeverity, b: ModerationSeverity): ModerationSeverity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

/** Deterministic scam signal (composes trust's suspicious-content detector). */
export function detectScam(text: string): DetectorVerdict {
  const result = detectSuspiciousContent(text || "");
  if (!result.detected) {
    return { decision: "approve", reasons: [], severity: "low", unambiguous: false, detail: [] };
  }
  const reasons: ModerationReason[] = ["scam_suspected"];
  // High-severity scam (off-platform payment, identity theft, phishing) holds
  // hard; lower-severity urgency language still holds, just less severe.
  const severity: ModerationSeverity = result.severity === "high" ? "high" : "medium";
  return { decision: "hold", reasons, severity, unambiguous: false, detail: result.reasons };
}

export interface DeterministicOptions {
  /** Out-of-band perceptual hashes for the content's images. */
  imageHashes?: ReadonlyArray<string>;
  /** Known-bad hash set (CSAM authority list + internal bans). */
  knownBadImageHashes?: ReadonlySet<string>;
  /** Hamming tolerance for perceptual near-duplicates (0 = exact). */
  imageHashTolerance?: number;
}

/**
 * Run the full deterministic suite and combine into a single verdict.
 * Pure + deterministic. This is the always-safe floor: it runs with or without
 * the AI layer and never fails open.
 */
export function runDeterministic(
  input: ModerationInput,
  opts: DeterministicOptions = {},
): DetectorVerdict {
  const text = input.text ?? "";
  const verdicts: DetectorVerdict[] = [
    detectBannedGoods(text, input.locale),
    detectProfanity(text, input.locale),
    detectPiiLeak(text, input.locale),
    detectScam(text),
  ];

  if (opts.imageHashes?.length && opts.knownBadImageHashes?.size) {
    verdicts.push(
      checkImageHashes(
        { hashes: opts.imageHashes, knownBad: opts.knownBadImageHashes },
        { maxHammingDistance: opts.imageHashTolerance },
      ),
    );
  }

  // Unambiguous reject short-circuits everything.
  const hardReject = verdicts.find((v) => v.decision === "reject" && v.unambiguous);
  if (hardReject) {
    return {
      decision: "reject",
      reasons: dedupe(hardReject.reasons),
      severity: "critical",
      unambiguous: true,
      detail: hardReject.detail ?? [],
    };
  }

  const reasons: ModerationReason[] = [];
  const detail: string[] = [];
  let severity: ModerationSeverity = "low";
  let decision: DetectorVerdict["decision"] = "approve";

  for (const v of verdicts) {
    if (v.decision === "hold") {
      decision = "hold";
      reasons.push(...v.reasons);
      if (v.detail) detail.push(...v.detail);
      severity = maxSeverity(severity, v.severity);
    } else if (v.decision === "reject") {
      // A non-unambiguous reject (none today) is downgraded to hold — human-gated.
      decision = "hold";
      reasons.push(...v.reasons);
      severity = maxSeverity(severity, v.severity);
    }
  }

  return { decision, reasons: dedupe(reasons), severity, unambiguous: false, detail };
}

function dedupe(reasons: ModerationReason[]): ModerationReason[] {
  return [...new Set(reasons)];
}

export { SEVERITY_RANK, RANK_TO_SEVERITY };
