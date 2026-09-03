// ---------------------------------------------------------------------------
// persist.ts — write moderation_decisions (server-only, idempotent)
//
// Idempotent on (content_type, content_id, content_hash, scanner): a re-scan of
// unchanged content by the same scanner resolves to the SAME row (the unique
// dedupe index). A manual staff decision uses scanner='manual', so it never
// collides with an automated row — both coexist, the manual one supersedes at
// read time. content_snapshot is PII-redacted before it is ever written.
// ---------------------------------------------------------------------------

import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ContentType,
  ModerationDecision,
  ModerationEvaluation,
  ModerationInput,
  ModerationReason,
} from "./types";
import { buildContentSnapshot } from "./snapshot";

const TABLE = "moderation_decisions";
const REPORTS_TABLE = "moderation_reports";

/** Stable content hash for the dedupe key (normalised text + sorted image refs). */
export function computeContentHash(input: ModerationInput): string {
  const text = (input.text ?? "").trim().replace(/\s+/g, " ").toLowerCase();
  const images = [...(input.imageUrls ?? [])].sort().join("|");
  return createHash("sha256").update(`${text} ${images}`).digest("hex");
}

export interface PersistDecisionArgs {
  input: ModerationInput;
  evaluation: ModerationEvaluation;
  /** Staff reviewer for manual decisions; null/omitted for automated. */
  reviewerId?: string | null;
}

/**
 * Persist an automated or manual decision. Returns the row id, or "" if the
 * write failed (the caller still has the decision; persistence is best-effort
 * for telemetry/training, it does not gate the publish decision).
 */
export async function persistDecision(
  supabase: SupabaseClient,
  args: PersistDecisionArgs,
): Promise<string> {
  const { input, evaluation, reviewerId } = args;
  const row = {
    content_type: input.contentType,
    content_id: input.contentId,
    content_hash: computeContentHash(input),
    content_snapshot: buildContentSnapshot(input),
    decision: evaluation.decision,
    reasons: evaluation.reasons,
    scanner: evaluation.scanner,
    reviewer: reviewerId ?? null,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: "content_type,content_id,content_hash,scanner" })
    .select("id")
    .maybeSingle();

  if (error || !data) return "";
  return (data as { id: string }).id;
}

export interface RecordReportArgs {
  contentType: ContentType;
  contentId: string;
  reasonCode: string;
  detail?: string | null;
  reporterId?: string | null;
}

/**
 * Insert a user-filed report (service-role; status defaults to 'open').
 * Returns the row id, or "" on failure (the route surfaces a generic error).
 */
export async function recordReport(
  supabase: SupabaseClient,
  args: RecordReportArgs,
): Promise<string> {
  const { data, error } = await supabase
    .from(REPORTS_TABLE)
    .insert({
      content_type: args.contentType,
      content_id: args.contentId,
      reason_code: args.reasonCode,
      detail: args.detail ?? null,
      reporter_id: args.reporterId ?? null,
      status: "open",
    })
    .select("id")
    .maybeSingle();

  if (error || !data) return "";
  return (data as { id: string }).id;
}

export interface ManualDecisionArgs {
  contentType: ModerationInput["contentType"];
  contentId: string;
  contentHash: string;
  decision: ModerationDecision;
  reasons: ReadonlyArray<ModerationReason>;
  reviewerId: string;
  snapshot?: Record<string, unknown>;
}

/** Record a staff manual decision (scanner='manual') — supersedes automation. */
export async function recordManualDecision(
  supabase: SupabaseClient,
  args: ManualDecisionArgs,
): Promise<string> {
  const row = {
    content_type: args.contentType,
    content_id: args.contentId,
    content_hash: args.contentHash,
    content_snapshot: args.snapshot ?? {},
    decision: args.decision,
    reasons: [...args.reasons],
    scanner: "manual" as const,
    reviewer: args.reviewerId,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: "content_type,content_id,content_hash,scanner" })
    .select("id")
    .maybeSingle();

  if (error || !data) return "";
  return (data as { id: string }).id;
}
