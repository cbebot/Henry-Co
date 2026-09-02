import "server-only";

/**
 * V3-41 — the predictive batch (ARCHITECTURE §5.4).
 *
 * Pipeline order, and why:
 *   flag gate -> single-flight lock -> schema probe -> bounded reads ->
 *   PURE scoring -> idempotent writes -> optional narrative -> journal + telemetry,
 *   with the lock released in `finally`.
 *
 * The deterministic product is complete at the "PURE scoring" step. Everything
 * after it is bookkeeping, and the narrative is the last thing attempted so a
 * budget refusal or provider outage can never delay or alter a forecast.
 *
 * NO AUTO-ACTION: this batch writes to three staff-read tables and nothing else.
 * It does not update a booking, a project, an order, a payment or an account,
 * and it holds no code path that could. The strongest statement of that is the
 * absence of any write target outside the predictive tables.
 */

import { randomUUID } from "node:crypto";
import {
  acquireWorkflowLock,
  releaseWorkflowLock,
  workflowLockStore,
} from "@henryco/workflow";
import {
  assessQuality,
  forecastWorkload,
  scoreDisputeLikelihood,
  QUEUE_KEYS,
  type WorkloadForecast,
} from "@henryco/intelligence";
import { emitEvent } from "@henryco/observability/events";
import { createAdminSupabase } from "@/lib/supabase";
import {
  NARRATIVE_MAX_PER_RUN,
  PREDICTIVE_TICK_LOCK_KEY,
  PREDICTIVE_TICK_LOCK_TTL_SECONDS,
  predictiveBatchEnabled,
} from "./config";
import { describeForecast } from "./narrative";
import { readQueueHistory, readServiceUnits, readTransactions } from "./readers";

export type PredictiveBatchSkip =
  | "flag_dark"
  | "locked"
  | "tables_absent";

export type PredictiveBatchSummary = {
  skipped: PredictiveBatchSkip | null;
  forecasts: number;
  assessments: number;
  atRisk: number;
  disputes: number;
  disputeWatch: number;
  narratives: number;
  errors: string[];
};

function emptySummary(skipped: PredictiveBatchSkip | null): PredictiveBatchSummary {
  return {
    skipped,
    forecasts: 0,
    assessments: 0,
    atRisk: 0,
    disputes: 0,
    disputeWatch: 0,
    narratives: 0,
    errors: [],
  };
}

export async function runPredictiveBatch(
  now: Date = new Date(),
  env: NodeJS.ProcessEnv = process.env,
): Promise<PredictiveBatchSummary> {
  if (!predictiveBatchEnabled(env)) return emptySummary("flag_dark");

  const worker = `predictive-tick:${randomUUID().slice(0, 8)}`;
  const admin = createAdminSupabase();

  // SINGLE-FLIGHT. A losing acquirer no-ops, so two overlapping cron fires
  // serialize instead of both spending the daily budget.
  const acquired = await acquireWorkflowLock(workflowLockStore(admin as never), {
    key: PREDICTIVE_TICK_LOCK_KEY,
    ttlSeconds: PREDICTIVE_TICK_LOCK_TTL_SECONDS,
    worker,
    now,
  });
  if (!acquired) return emptySummary("locked");

  const summary = emptySummary(null);
  let runId: string | null = null;

  try {
    // SCHEMA PROBE. The journal insert doubles as "is the migration applied?" —
    // if the predictive tables are absent the whole batch degrades silently.
    const { data: runRow, error: runError } = await admin
      .from("predictive_batch_runs")
      .insert({ started_at: now.toISOString(), outcome: "running" } as never)
      .select("id")
      .maybeSingle();
    if (runError || !runRow) {
      summary.skipped = "tables_absent";
      return summary;
    }
    runId = String((runRow as { id: unknown }).id);

    // ---- 1. Workload forecasts (deterministic, no AI) ----------------------
    const forecasts: WorkloadForecast[] = [];
    for (const queue of QUEUE_KEYS) {
      try {
        const history = await readQueueHistory(queue, now);
        const forecast = forecastWorkload({ queue, history, asOf: now.toISOString() });
        forecasts.push(forecast);
        const { error } = await admin.from("workload_forecasts").insert({
          queue: forecast.queue,
          generated_at: now.toISOString(),
          horizon_hours: forecast.horizonHours,
          payload: {
            perHour: forecast.perHour,
            staffingRecommendation: forecast.staffingRecommendation,
          },
          sample_size: forecast.sampleSize,
          basis: forecast.basis,
          model_version: forecast.modelVersion,
        } as never);
        if (error) summary.errors.push(`workload:${queue}:${error.message}`);
        else summary.forecasts += 1;
      } catch (error) {
        summary.errors.push(`workload:${queue}:${error instanceof Error ? error.message : "failed"}`);
      }
    }

    // ---- 2. Service-unit quality assessments (deterministic, no AI) --------
    try {
      const units = await readServiceUnits(now);
      for (const unit of units) {
        const assessment = assessQuality({
          unitType: unit.unitType,
          unitId: unit.unitId,
          signals: unit.signals,
        });
        const { error } = await admin.from("quality_assessments").insert({
          unit_type: assessment.unitType,
          unit_id: assessment.unitId,
          assessed_at: now.toISOString(),
          at_risk: assessment.atRisk,
          risk_band: assessment.riskBand,
          reasons: assessment.reasons,
          suggested_intervention: assessment.suggestedIntervention ?? null,
          signals_present: assessment.signalsPresent,
          model_version: assessment.modelVersion,
        } as never);
        if (error) summary.errors.push(`quality:${assessment.unitId}:${error.message}`);
        else {
          summary.assessments += 1;
          if (assessment.atRisk) summary.atRisk += 1;
        }
      }
    } catch (error) {
      summary.errors.push(`quality:${error instanceof Error ? error.message : "failed"}`);
    }

    // ---- 3. Dispute likelihoods (deterministic, no AI) ---------------------
    try {
      const transactions = await readTransactions(now);
      for (const txn of transactions) {
        const scored = scoreDisputeLikelihood({
          transactionId: txn.transactionId,
          features: txn.features,
        });
        const { error } = await admin.from("dispute_likelihoods").insert({
          transaction_id: scored.transactionId,
          scored_at: now.toISOString(),
          likelihood: scored.likelihood,
          band: scored.band,
          window_days: scored.windowDays,
          top_factors: scored.topFactors,
          features_present: scored.featuresPresent,
          model_version: scored.modelVersion,
        } as never);
        if (error) summary.errors.push(`dispute:${scored.transactionId}:${error.message}`);
        else {
          summary.disputes += 1;
          if (scored.band !== "low") summary.disputeWatch += 1;
        }
      }
    } catch (error) {
      summary.errors.push(`dispute:${error instanceof Error ? error.message : "failed"}`);
    }

    // ---- 4. OPTIONAL narrative — last, bounded, non-fatal ------------------
    // Only for queues that actually have evidence; a narrative about an empty
    // forecast is noise the company would be paying for.
    const narratable = forecasts.filter((f) => f.basis !== "empty").slice(0, NARRATIVE_MAX_PER_RUN);
    for (const forecast of narratable) {
      try {
        const outcome = await describeForecast(forecast, env);
        if (!outcome.narrative) continue;
        const { error } = await admin
          .from("workload_forecasts")
          .update({ narrative: outcome.narrative } as never)
          .eq("queue", forecast.queue)
          .eq("generated_at", now.toISOString());
        if (!error) summary.narratives += 1;
      } catch {
        // Narrative failure is NON-FATAL by design: the deterministic forecast
        // is the product, so an AI outage is a skip, never a failed run.
      }
    }

    // ---- 5. Journal + telemetry -------------------------------------------
    await admin
      .from("predictive_batch_runs")
      .update({
        finished_at: new Date().toISOString(),
        outcome: summary.errors.length === 0 ? "succeeded" : "failed",
        counts: {
          forecasts: summary.forecasts,
          assessments: summary.assessments,
          at_risk: summary.atRisk,
          disputes: summary.disputes,
          dispute_watch: summary.disputeWatch,
          narratives: summary.narratives,
        },
        model_versions: {
          workload: forecasts[0]?.modelVersion ?? null,
        },
      } as never)
      .eq("id", runId);

    // Counts + bands only. No unit id, no transaction id, no PII, no score.
    emitEvent({
      name: "henry.predictive.workload.computed",
      classification: "system_state",
      outcome: summary.errors.length === 0 ? "completed" : "failed",
      payload: { forecasts: summary.forecasts, narratives: summary.narratives },
    });
    if (summary.atRisk > 0) {
      emitEvent({
        name: "henry.predictive.quality.at_risk_flagged",
        classification: "system_state",
        outcome: "completed",
        payload: { at_risk: summary.atRisk, assessed: summary.assessments },
      });
    }
    if (summary.disputeWatch > 0) {
      emitEvent({
        name: "henry.predictive.dispute.high_likelihood",
        classification: "system_state",
        outcome: "completed",
        payload: { watch: summary.disputeWatch, scored: summary.disputes },
      });
    }

    return summary;
  } catch (error) {
    summary.errors.push(error instanceof Error ? error.message : "batch failed");
    return summary;
  } finally {
    await releaseWorkflowLock(workflowLockStore(admin as never), {
      key: PREDICTIVE_TICK_LOCK_KEY,
      worker,
      now: new Date(),
    });
  }
}
