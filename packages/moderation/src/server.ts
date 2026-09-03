// ---------------------------------------------------------------------------
// server.ts — server-only entry: moderate() orchestrator + persistence
//
// Reached via "@henryco/moderation/server" (NOT the client barrel) so the
// server-only persistence + node:crypto never leak into client bundles. This
// is the single function every publish gate calls.
// ---------------------------------------------------------------------------

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ModerationAiRouter,
  ModerationInput,
  ModerationOutcome,
} from "./types";
import type { ContentType } from "./types";
import { runDeterministic, type DeterministicOptions } from "./deterministic/index";
import { combineVerdicts } from "./pipeline";
import { runAiScan } from "./ai/ai-scan";
import { persistDecision, recordReport } from "./persist";
import { buildScanEvent, buildReportFiledEvent, type ModerationEventInput } from "./telemetry";

export { persistDecision, recordManualDecision, recordReport, computeContentHash } from "./persist";
export { runAiScan, normalizeAiResult } from "./ai/ai-scan";
export { buildModerationPrompt } from "./ai/prompts";

export interface ModerateDeps {
  /** Service-role client for persistence. Omit to skip the ledger write. */
  supabase?: SupabaseClient | null;
  /** Injected governed AI router (V3-26). Omit/null → deterministic-only. */
  aiRouter?: ModerationAiRouter | null;
  /** Telemetry emitter (e.g. the app's emitIntelligenceEvent). Omit → no-op. */
  emit?: (event: ModerationEventInput) => void;
  /** Deterministic options (image hashes + known-bad set). */
  deterministic?: DeterministicOptions;
  /** Correlation id to thread through telemetry + audit. */
  correlationId?: string;
  /** AI call timeout (ms). */
  aiTimeoutMs?: number;
}

/**
 * Moderate a piece of publishable content: deterministic → (optional) AI →
 * decision → persist → telemetry. Returns the publish-gate outcome.
 *
 * Degrade-not-fail-open: if the AI router is absent/errors, the deterministic
 * floor decides and scanner='deterministic_rule'. If persistence fails, the
 * decision still returns (decisionId="") — moderation NEVER fails open.
 */
export async function moderate(
  input: ModerationInput,
  deps: ModerateDeps = {},
): Promise<ModerationOutcome> {
  const startedAt = Date.now();

  const verdict = runDeterministic(input, deps.deterministic);

  // Short-circuit: an unambiguous deterministic reject skips the AI entirely.
  const aiResult =
    verdict.decision === "reject" && verdict.unambiguous
      ? null
      : await runAiScan(deps.aiRouter, input, { timeoutMs: deps.aiTimeoutMs });

  const evaluation = combineVerdicts(verdict, aiResult);

  let decisionId = "";
  if (deps.supabase) {
    decisionId = await persistDecision(deps.supabase, { input, evaluation });
  }

  if (deps.emit) {
    deps.emit(
      buildScanEvent({
        contentType: input.contentType,
        contentId: input.contentId,
        decision: evaluation.decision,
        scanner: evaluation.scanner,
        reasons: evaluation.reasons,
        latencyMs: Date.now() - startedAt,
        actorId: input.actorId ?? null,
        correlationId: deps.correlationId,
      }),
    );
  }

  return {
    decision: evaluation.decision,
    reasons: evaluation.reasons,
    scanner: evaluation.scanner,
    decisionId,
  };
}

export interface FileReportArgs {
  contentType: ContentType;
  contentId: string;
  reasonCode: string;
  detail?: string | null;
  reporterId?: string | null;
}

export interface FileReportDeps {
  supabase: SupabaseClient;
  emit?: (event: ModerationEventInput) => void;
  correlationId?: string;
}

/**
 * File a user report: persist the moderation_reports row + emit report.filed
 * telemetry. The caller (the per-division /api/report route) owns auth +
 * rate-limit + re-moderation of the reported content. Returns the report id
 * ("" on failure → the route returns a generic error).
 */
export async function fileReport(args: FileReportArgs, deps: FileReportDeps): Promise<string> {
  const reportId = await recordReport(deps.supabase, args);
  if (reportId && deps.emit) {
    deps.emit(
      buildReportFiledEvent({
        contentType: args.contentType,
        contentId: args.contentId,
        reasonCode: args.reasonCode,
        reporterId: args.reporterId ?? null,
        correlationId: deps.correlationId,
      }),
    );
  }
  return reportId;
}
