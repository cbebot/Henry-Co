// ---------------------------------------------------------------------------
// reasons.ts — stable catalogs (reason codes, content types, decisions)
//
// These arrays are the runtime source of truth that the i18n moderation copy
// and the staff-queue UI iterate over. Keep ALL_MODERATION_REASONS in lockstock
// with the ModerationReason union in types.ts (a test asserts they match) and
// with the @henryco/i18n moderation labels (every code must have a label).
// ---------------------------------------------------------------------------

import type { ContentType, ModerationDecision, ModerationReason, ScannerKind } from "./types";

export const ALL_MODERATION_REASONS: readonly ModerationReason[] = [
  "banned_goods",
  "hate_speech",
  "profanity",
  "pii_leak",
  "off_platform_contact",
  "scam_suspected",
  "image_hash_match",
  "ai_flagged_scam",
  "ai_flagged_nsfw",
  "ai_flagged_abuse",
  "ai_flagged_other",
  "user_reported",
] as const;

export const ALL_CONTENT_TYPES: readonly ContentType[] = [
  "marketplace_listing",
  "job_post",
  "studio_brief",
  "service_profile",
] as const;

export const ALL_DECISIONS: readonly ModerationDecision[] = ["approve", "hold", "reject"] as const;

export const ALL_SCANNERS: readonly ScannerKind[] = ["deterministic_rule", "ai_check", "manual"] as const;

/** User-facing report reason codes (the report sheet's reason picker). */
export const REPORT_REASON_CODES = [
  "scam_or_fraud",
  "prohibited_item",
  "offensive_content",
  "personal_info",
  "spam",
  "impersonation",
  "other",
] as const;

export type ReportReasonCode = (typeof REPORT_REASON_CODES)[number];

/** Report lifecycle statuses (mirrors the moderation_reports CHECK). */
export const REPORT_STATUSES = ["open", "reviewing", "resolved", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];
