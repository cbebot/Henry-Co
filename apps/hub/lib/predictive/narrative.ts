import "server-only";

/**
 * V3-41 — the OPTIONAL staff-facing narrative for a forecast.
 *
 * This is the ONLY file in the pass that can reach a model provider, and every
 * property the brief demands is enforced here:
 *
 *   - NEVER A WALLET. It rides `predictive.narrative`, registered `billable:false`,
 *     and is dispatched through `noBillingPort`. Not one money-RPC or wallet
 *     identifier appears anywhere in this file — `config.test.ts` scans the source
 *     for the whole forbidden set, and the gateway-level exploding-billing-port
 *     test proves no billing method is reachable at runtime.
 *   - RESERVE BEFORE RUN, DEGRADE CLOSED. The estimated provider cost is added
 *     to the UNIFIED V3-43 ledger (`internal_ai_spend_add`, budget_key
 *     `predictive_ops`) BEFORE dispatch, and only the returned post-increment
 *     total decides whether the call proceeds. Two concurrent runs therefore read
 *     two different totals and cannot both conclude there was room. An
 *     unreachable/unmigrated ledger REFUSES the call.
 *   - CANNOT CORRUPT THE FORECAST. It receives an ALREADY-COMPUTED forecast and
 *     returns prose. It has no way to return a number, and the caller writes the
 *     text to its own `narrative` column — never into `payload`. A refusal, a
 *     timeout, an exhausted budget and a jailbroken reply are all the same
 *     outcome: `null`, and the forecast stands exactly as computed.
 *   - PROVIDER-OPAQUE. Only the assistant text is read; no provider or model
 *     field is touched, and any reply that leaks provider vocabulary is dropped.
 */

import {
  reservePredictiveAiSpend,
  PREDICTIVE_SPEND_BUDGET_KEY,
  resolvePredictiveBudgetKobo,
  type WorkloadForecast,
} from "@henryco/intelligence";
import { assistantReplyLeaksProvider } from "@henryco/ai-gateway";
import { estimateFreeTurnCostKobo, noBillingPort, runAiTask } from "@henryco/ai-gateway/server";
import { createAdminSupabase } from "@/lib/supabase";
import { predictiveNarrativeEnabled } from "./config";

export type NarrativeSkipReason =
  | "flag_dark"
  | "disabled"
  | "ceiling"
  | "ledger_unavailable"
  | "provider_error"
  | "empty_reply"
  | "provider_leak";

export type NarrativeOutcome = {
  /** The staff-facing sentence, or null when anything at all went wrong. */
  narrative: string | null;
  skipped: NarrativeSkipReason | null;
};

const MAX_NARRATIVE_CHARS = 400;

/**
 * Describe an already-computed forecast in one or two sentences for an operator.
 * The prompt carries ONLY aggregate operational numbers — a queue key, totals,
 * a band and a sample size. No customer, provider, order or person is named, so
 * no personal data reaches the provider.
 */
export async function describeForecast(
  forecast: WorkloadForecast,
  env: NodeJS.ProcessEnv = process.env,
): Promise<NarrativeOutcome> {
  if (!predictiveNarrativeEnabled(env)) return { narrative: null, skipped: "flag_dark" };

  const totalPredicted = forecast.perHour.reduce((sum, p) => sum + p.predicted, 0);
  const peak = forecast.perHour.reduce((max, p) => Math.max(max, p.predicted), 0);
  const agents = forecast.staffingRecommendation.map((r) => r.recommendedAgents);
  const prompt =
    `Write ONE short sentence for an operations manager about a support-queue forecast. ` +
    `Plain, factual, no adjectives, no advice about individuals.\n` +
    `queue=${forecast.queue}\n` +
    `next_7_days_total=${Math.round(totalPredicted)}\n` +
    `busiest_hour=${Math.round(peak)}\n` +
    `recommended_agents_per_day=${agents.join(",")}\n` +
    `evidence=${forecast.basis} (${forecast.sampleSize} observed hours)`;

  const estimate = estimateFreeTurnCostKobo({ surface: "predictive.narrative", inputText: prompt });

  // RESERVE FIRST. The atomic post-increment total is the decision input.
  const reservation = await reservePredictiveAiSpend({
    ledger: {
      async add(kobo: number): Promise<number> {
        const admin = createAdminSupabase();
        const { data, error } = await admin.rpc("internal_ai_spend_add", {
          p_budget_key: PREDICTIVE_SPEND_BUDGET_KEY,
          p_add_kobo: kobo,
        } as never);
        // A missing RPC (V3-43 unapplied) throws here -> degrade CLOSED.
        if (error) throw new Error(error.message);
        const total = Number(data);
        if (!Number.isFinite(total)) throw new Error("internal_ai_spend_add returned a non-number");
        return total;
      },
    },
    estimateKobo: estimate,
    ceilingKobo: resolvePredictiveBudgetKobo(env as Record<string, string | undefined>),
  });
  if (!reservation.allowed) return { narrative: null, skipped: reservation.reason };

  try {
    const admin = createAdminSupabase();
    const result = await runAiTask(
      {
        surface: "predictive.narrative",
        actorId: "system:predictive-batch",
        input: { messages: [{ role: "user", content: prompt }] },
        // Stable per (queue, day, model version): a retried tick reuses the
        // reservation's worth of work instead of paying for a second turn.
        idempotencyKey: `predictive-narrative:${forecast.queue}:${forecast.perHour[0]?.at.slice(0, 10) ?? "na"}:${forecast.modelVersion}`,
      },
      { billing: noBillingPort, audit: { supabase: admin as never } },
    );
    if (!result.ok) return { narrative: null, skipped: "provider_error" };

    const text = typeof result.value.output === "string" ? result.value.output.trim() : "";
    if (!text) return { narrative: null, skipped: "empty_reply" };
    // Opacity backstop: a jailbroken reply naming the provider is discarded
    // rather than persisted into a staff-visible column.
    if (assistantReplyLeaksProvider(text)) return { narrative: null, skipped: "provider_leak" };

    return { narrative: text.slice(0, MAX_NARRATIVE_CHARS), skipped: null };
  } catch {
    // The spend is already recorded; the forecast is unaffected.
    return { narrative: null, skipped: "provider_error" };
  }
}
