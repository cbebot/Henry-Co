// V3-40 — the OPTIONAL LLM-advisory slice (E-D1 Option A), platform-invoked.
//
// ABSOLUTES enforced here:
//   * NEVER a wallet debit — surface `risk.entity.assist` is billable:false and the
//     task runs with `noBillingPort` (fail-closed even if billing were attempted).
//   * ONE internal counter — spend reserves against the existing free-AI daily
//     ledger via the signature-preserved `ai_free_spend_add` RPC (the primitive
//     V3-43 folds into `internal_ai_spend_ledger`); no new counter exists.
//   * RESERVE BEFORE RUN, DEGRADE CLOSED — reservePlatformAiSpend adds the estimate
//     atomically FIRST and refuses at the ceiling or on ANY ledger failure. Two
//     concurrent batches cannot each spend the ceiling.
//   * ADVISORY ONLY — output is a clamped adjustment the engine caps again; a
//     freeze can never rest on it (engine rule, tested).
//   * OPACITY — prompt carries factor keys/numbers only (no PII, no provider
//     vocabulary); audit ON so every call lands in henry_events + audit log.

import "server-only";

import { noBillingPort, runAiTask } from "@henryco/ai-gateway/server";
import { estimateFreeTurnCostKobo } from "@henryco/ai-gateway/server";
import {
  isFlagEnabled,
  parseHenryFeatureFlags,
  reservePlatformAiSpend,
  RISK_ADVISORY_NOTE_KEYS,
  type PlatformSpendRefusal,
  type RiskAdvisoryInput,
  type RiskAdvisoryNoteKey,
  type RiskScoreResult,
} from "@henryco/intelligence";
import { createAdminSupabase } from "@/lib/supabase";

/** Hard per-run cap on advisory calls — bounds risk's share of the daily budget. */
export const RISK_ASSIST_MAX_PER_RUN = 5;

/**
 * Risk predictive AI rides its OWN budget_key on the unified internal_ai_spend_ledger
 * (V3-43 / #527) — isolated from the customer free-chat 'free_ai' key so a busy chat
 * day can never starve fraud scoring and vice versa. This is the unified primitive,
 * not a new counter (E-D1-A: a dedicated per-day counter + ceiling on the one ledger).
 */
export const RISK_SPEND_BUDGET_KEY = "risk_predictive";
/** E-D1-A default: start at ₦2,000/day (owner-tunable via RISK_AI_DAILY_BUDGET_KOBO). */
export const RISK_AI_DAILY_BUDGET_KOBO_DEFAULT = 200_000;

export function resolveRiskBudgetKobo(env: Record<string, string | undefined> = {}): number {
  const raw = Number(env.RISK_AI_DAILY_BUDGET_KOBO);
  return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : RISK_AI_DAILY_BUDGET_KOBO_DEFAULT;
}

export function riskAssistEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const flags = parseHenryFeatureFlags(env as Record<string, string | undefined>);
  return isFlagEnabled(flags, "predictive_risk_assist") && isFlagEnabled(flags, "ai_gateway");
}

export type RiskAssistOutcome =
  | { advisory: RiskAdvisoryInput }
  | { advisory: null; skipped: PlatformSpendRefusal | "flag_dark" | "provider" | "parse" };

/**
 * Ask the governed gateway for a bounded score adjustment on ONE flagged entity.
 * The deterministic result is complete without this — every failure path returns
 * `advisory: null` and the floor stands.
 */
export async function requestRiskAdvisory(
  floor: RiskScoreResult,
  day: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<RiskAssistOutcome> {
  if (!riskAssistEnabled(env)) return { advisory: null, skipped: "flag_dark" };

  // Redacted evidence: namespaced factor keys + numeric weights/values only.
  const evidence = floor.contributingFactors.map((f) => ({
    key: f.signal,
    points: f.weight,
    value: typeof f.value === "number" ? f.value : String(f.value),
  }));
  const prompt = [
    "You assist a fraud-review team. Given the deterministic risk evidence for one",
    `${floor.entityType} entity (score ${floor.deterministicScore}/100), reply with STRICT JSON`,
    'only: {"adjustmentPoints": <integer between -10 and 10>, "noteKey": "<one of: corroborating_pattern, likely_benign, insufficient_evidence>"}.',
    "Raise only when independent factors corroborate; lower when the pattern reads benign.",
    `Evidence: ${JSON.stringify(evidence)}`,
  ].join(" ");

  const admin = createAdminSupabase();
  const estimate = estimateFreeTurnCostKobo({ surface: "risk.entity.assist", inputText: prompt });
  const reservation = await reservePlatformAiSpend({
    ledger: {
      // Reserve BEFORE the run against the unified ledger's dedicated risk budget_key.
      async add(kobo: number): Promise<number> {
        const { data, error } = await admin.rpc("internal_ai_spend_add", {
          p_budget_key: RISK_SPEND_BUDGET_KEY,
          p_add_kobo: kobo,
        });
        if (error) throw new Error(error.message);
        return Number(data);
      },
    },
    estimateKobo: estimate,
    ceilingKobo: resolveRiskBudgetKobo(process.env),
  });
  if (!reservation.allowed) return { advisory: null, skipped: reservation.reason };

  try {
    const result = await runAiTask(
      {
        surface: "risk.entity.assist",
        actorId: "system:risk-batch",
        input: { messages: [{ role: "user", content: prompt }] },
        idempotencyKey: `risk-assist:${floor.entityType}:${floor.entityId}:${day}:${floor.modelVersion}`,
      },
      { billing: noBillingPort, audit: { supabase: admin as never } },
    );
    if (!result.ok) return { advisory: null, skipped: "provider" };
    // Fence-tolerant strict parse: take the first JSON object in the reply.
    const match = result.value.output.match(/\{[\s\S]*?\}/);
    if (!match) return { advisory: null, skipped: "parse" };
    const parsed = JSON.parse(match[0]) as { adjustmentPoints?: unknown; noteKey?: unknown };
    const points = Number(parsed.adjustmentPoints);
    if (!Number.isFinite(points)) return { advisory: null, skipped: "parse" };
    const noteKey: RiskAdvisoryNoteKey =
      typeof parsed.noteKey === "string" &&
      (RISK_ADVISORY_NOTE_KEYS as readonly string[]).includes(parsed.noteKey)
        ? (parsed.noteKey as RiskAdvisoryNoteKey)
        : "insufficient_evidence";
    return {
      advisory: {
        adjustmentPoints: Math.max(-10, Math.min(10, Math.round(points))),
        noteKey,
      },
    };
  } catch {
    return { advisory: null, skipped: "provider" };
  }
}
