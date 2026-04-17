// ---------------------------------------------------------------------------
// moderation.ts - Types, constants, and helpers for the moderation queue
// ---------------------------------------------------------------------------

import {
  detectOffPlatformContact,
  detectSuspiciousContent,
} from "./detect";

// ---- Core types ----------------------------------------------------------

export type ModerationAction = "approve" | "reject" | "escalate" | "warn" | "block";

export type ModerationEntityType =
  | "message"
  | "listing"
  | "review"
  | "application"
  | "user_profile"
  | "payment";

export type ModerationSeverity = "low" | "medium" | "high" | "critical";

export type ModerationStatus = "pending" | "in_review" | "resolved" | "escalated";

/** Mirrors the `platform_moderation_queue` Supabase table. */
export interface ModerationCase {
  id: string;
  entity_type: ModerationEntityType;
  entity_id: string;
  content_snapshot: string;
  reason: string;
  severity: ModerationSeverity;
  status: ModerationStatus;
  flagged_by: string | null; // user id or "system"
  assigned_to: string | null;
  action_taken: ModerationAction | null;
  action_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

/** Mirrors the `trust_flags` Supabase table. */
export interface TrustFlag {
  id: string;
  user_id: string;
  flag_type: string;
  reason: string;
  severity: ModerationSeverity;
  source: string; // "system" | "user_report" | "admin"
  entity_type: ModerationEntityType | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  resolved_at: string | null;
}

// ---- Display label constants ---------------------------------------------

export const SEVERITY_LABELS: Record<ModerationSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
} as const;

export const ACTION_LABELS: Record<ModerationAction, string> = {
  approve: "Approve",
  reject: "Reject",
  escalate: "Escalate",
  warn: "Warn User",
  block: "Block",
} as const;

// ---- Auto-flag decision --------------------------------------------------

export interface AutoFlagResult {
  flag: boolean;
  reason: string;
  severity: ModerationSeverity;
}

// ---- Repeat-offender escalation -----------------------------------------

/**
 * Escalates a moderation severity based on prior unresolved bypass-related
 * flags for the same actor.  Callers pass the count of open or recent trust
 * flags for the user/entity; this function returns the adjusted severity.
 *
 * Escalation rules:
 *  - 0–1 prior flags: no change.
 *  - 2–3 prior flags: escalate low→medium, medium→high.
 *  - 4+ prior flags:  escalate to at least "high"; critical stays critical.
 *
 * The caller is responsible for querying `trust_flags` and passing the count.
 * This function is intentionally pure (no I/O) so it stays testable.
 */
export function escalateSeverityForRepeatOffender(
  baseSeverity: ModerationSeverity,
  priorFlagCount: number
): ModerationSeverity {
  if (priorFlagCount <= 1) return baseSeverity;

  const RANK: Record<ModerationSeverity, number> = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3,
  };
  const RANK_TO: ModerationSeverity[] = ["low", "medium", "high", "critical"];

  let rank = RANK[baseSeverity] ?? 0;

  if (priorFlagCount >= 4) {
    // Four or more priors: force to at least "high"
    rank = Math.max(rank, RANK["high"]);
  } else {
    // 2–3 priors: bump one step
    rank = Math.min(rank + 1, RANK["critical"]);
  }

  return RANK_TO[rank] ?? "high";
}

/**
 * Combines off-platform contact detection and suspicious content detection
 * to decide whether a piece of content should be automatically flagged for
 * moderation review.
 */
export function shouldAutoFlag(content: string): AutoFlagResult {
  const offPlatform = detectOffPlatformContact(content);
  const suspicious = detectSuspiciousContent(content);

  const reasons: string[] = [];

  // Severity ranking for comparison
  const SEVERITY_RANK: Record<string, number> = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3,
  };

  let maxRank = 0; // start at "low"

  // Collect off-platform reasons
  if (offPlatform.detected) {
    reasons.push(
      `Off-platform contact attempt (${offPlatform.patterns.length} pattern${offPlatform.patterns.length === 1 ? "" : "s"})`
    );
    const rank = SEVERITY_RANK[offPlatform.severity] ?? 0;
    if (rank > maxRank) maxRank = rank;
  }

  // Collect suspicious content reasons
  if (suspicious.detected) {
    reasons.push(...suspicious.reasons);
    const rank = SEVERITY_RANK[suspicious.severity] ?? 0;
    if (rank > maxRank) maxRank = rank;
  }

  // Escalate to critical when both detectors fire at high severity
  if (
    offPlatform.detected &&
    suspicious.detected &&
    offPlatform.severity === "high" &&
    suspicious.severity === "high"
  ) {
    maxRank = SEVERITY_RANK["critical"];
  }

  const RANK_TO_SEVERITY: ModerationSeverity[] = ["low", "medium", "high", "critical"];
  const severity: ModerationSeverity = RANK_TO_SEVERITY[maxRank] ?? "low";

  return {
    flag: reasons.length > 0,
    reason: reasons.length > 0 ? reasons.join("; ") : "No issues detected",
    severity,
  };
}
