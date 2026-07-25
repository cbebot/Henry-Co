// V3-40 — the daily risk batch (server-only, platform-invoked, shadow-first).
//
// Shape: flag gate → model load → single-flight lock → bounded readers → pure
// scoreEntity per candidate (deterministic floor first; clamped advisory only for
// review+ tiers, capped per run) → idempotent persistence (ON CONFLICT DO NOTHING
// on the daily unique) → system FLAGS ONLY into the enforcement log (through the
// assertEnforcementAllowed choke point — hold/freeze are unreachable from here by
// type, by runtime guard, and by the DB CHECK) → run journal + telemetry.
//
// Degrade posture: flag-dark by default; absent tables (committed-not-applied on
// prod) end the run as a clean no-op; every reader is best-effort. The batch NEVER
// touches a wallet, payments_private, or any money RPC.

import "server-only";

import { emitEvent, persistEvent } from "@henryco/observability";
import {
  assertEnforcementAllowed,
  isFlagEnabled,
  parseHenryFeatureFlags,
  planSystemEnforcement,
  type RiskScoreResult,
  type RiskTier,
} from "@henryco/intelligence";
import { createAdminSupabase } from "@/lib/supabase";
import { requestRiskAdvisory, riskAssistEnabled, RISK_ASSIST_MAX_PER_RUN } from "./assist";
import { acquireRiskBatchLock, releaseRiskBatchLock } from "./lock";
import { loadActiveRiskModel } from "./model";
import {
  readAccountCandidates,
  readListingCandidates,
  readSupportTicketCandidates,
  readTransactionCandidates,
  type RiskEntityCandidate,
} from "./readers";
import { scoreCandidateWithAdvisory } from "./score-candidate";

export interface RiskBatchSummary {
  skipped?: "flag_dark" | "no_model" | "lock_held" | "tables_absent";
  modelVersion?: string;
  shadow?: boolean;
  entities?: Record<string, number>;
  tiers?: Record<RiskTier, number>;
  scoresWritten?: number;
  flagsWritten?: number;
  ai?: { assisted: number; skipped: Record<string, number> };
  errors: string[];
}

export async function runRiskScoreBatch(now: Date): Promise<RiskBatchSummary> {
  const errors: string[] = [];
  const flags = parseHenryFeatureFlags(process.env as Record<string, string | undefined>);
  if (!isFlagEnabled(flags, "predictive_shadow")) {
    return { skipped: "flag_dark", errors };
  }

  const model = await loadActiveRiskModel();
  if (!model) return { skipped: "no_model", errors };

  const worker = `risk-batch:${process.pid}:${now.getTime()}`;
  if (!(await acquireRiskBatchLock(worker, now))) {
    return { skipped: "lock_held", errors };
  }

  const admin = createAdminSupabase();
  const day = now.toISOString().slice(0, 10);
  let runId: string | null = null;

  try {
    // Run journal doubles as the tables-present probe: if this insert cannot find
    // the table, the whole risk schema is absent → clean no-op.
    const { data: runRow, error: runError } = await admin
      .from("risk_batch_runs")
      .insert({ window_day: day, model_kind: model.modelKind, model_version: model.version })
      .select("id")
      .single();
    if (runError || !runRow) {
      return { skipped: "tables_absent", errors };
    }
    runId = (runRow as { id: string }).id;

    // ---- Gather (bounded, best-effort, per-type honesty) ---------------------
    const [accounts, listings, transactions, tickets] = await Promise.all([
      readAccountCandidates(now),
      readListingCandidates(),
      readTransactionCandidates(now),
      readSupportTicketCandidates(now),
    ]);
    const candidates: RiskEntityCandidate[] = [...accounts, ...listings, ...transactions, ...tickets];
    const entities = {
      account: accounts.length,
      listing: listings.length,
      transaction: transactions.length,
      support_ticket: tickets.length,
    };

    // ---- Score (deterministic floor; advisory only for review+, capped) ------
    const tiers: Record<RiskTier, number> = { pass: 0, monitor: 0, review: 0, freeze: 0 };
    const results: RiskScoreResult[] = [];
    const aiSkipped: Record<string, number> = {};
    let aiAssisted = 0;
    const assistOn = riskAssistEnabled();
    for (const candidate of candidates) {
      // Cap gate here; the helper computes the floor, applies the tier gate, and owns the
      // floor-never-dropped guarantee (an advisory throw falls back to the floor).
      const underCap = assistOn && model.advisoryCapPoints > 0 && aiAssisted < RISK_ASSIST_MAX_PER_RUN;
      let outcome;
      try {
        outcome = await scoreCandidateWithAdvisory({
          candidate,
          model,
          wantsAdvisory: underCap,
          isEligible: (floor) => floor.deterministicTier === "review" || floor.deterministicTier === "freeze",
          requestAdvisory: (floor) => requestRiskAdvisory(floor, day),
        });
      } catch (error) {
        // Only a FLOOR failure reaches here (the advisory is caught inside the helper).
        errors.push(`score:${candidate.entityType}:${error instanceof Error ? error.message : "unknown"}`);
        continue;
      }
      if (outcome.advisoryApplied) aiAssisted += 1;
      if (outcome.advisorySkipped) aiSkipped[outcome.advisorySkipped] = (aiSkipped[outcome.advisorySkipped] ?? 0) + 1;
      tiers[outcome.result.tier] += 1;
      results.push(outcome.result);
    }

    // ---- Persist scores (idempotent per entity/model/day) --------------------
    let scoresWritten = 0;
    if (results.length > 0) {
      const rows = results.map((result) => ({
        entity_type: result.entityType,
        entity_id: result.entityId,
        risk_score: Math.round(result.riskScore),
        deterministic_score: Math.round(result.deterministicScore),
        tier: result.tier,
        deterministic_tier: result.deterministicTier,
        contributing_factors: result.contributingFactors,
        model_kind: result.modelKind,
        model_version: result.modelVersion,
        shadow: result.shadow,
        scored_on: day,
      }));
      const { data: inserted, error: insertError } = await admin
        .from("risk_scores")
        .upsert(rows, {
          onConflict: "entity_type,entity_id,model_kind,model_version,scored_on",
          ignoreDuplicates: true,
        })
        .select("entity_id");
      if (insertError) errors.push(`persist:${insertError.message}`);
      scoresWritten = inserted?.length ?? 0;
    }

    // ---- System enforcement: FLAG ONLY, deduped per entity per day -----------
    let flagsWritten = 0;
    const flaggable = results.filter((result) => planSystemEnforcement(result).action === "flag");
    if (flaggable.length > 0) {
      const existing = new Set<string>();
      try {
        const { data: todays } = await admin
          .from("risk_enforcement_log")
          .select("entity_type, entity_id")
          .eq("action", "flag")
          .gte("created_at", `${day}T00:00:00.000Z`)
          .limit(2000);
        for (const row of (todays ?? []) as { entity_type: string; entity_id: string }[]) {
          existing.add(`${row.entity_type}:${row.entity_id}`);
        }
      } catch {
        /* dedupe is best-effort; the log is append-only either way */
      }
      const flagRows = flaggable
        .filter((result) => !existing.has(`${result.entityType}:${result.entityId}`))
        .map((result) => {
          // The choke point every enforcement write passes through — the system
          // actor can only ever plan a flag; anything else throws here.
          assertEnforcementAllowed("flag", { kind: "system" });
          return {
            entity_type: result.entityType,
            entity_id: result.entityId,
            action: "flag",
            tier_at_action: result.tier,
            model_kind: result.modelKind,
            model_version: result.modelVersion,
            shadow: result.shadow,
            actor: "system",
          };
        });
      if (flagRows.length > 0) {
        const { error: flagError } = await admin.from("risk_enforcement_log").insert(flagRows);
        if (flagError) errors.push(`flags:${flagError.message}`);
        else flagsWritten = flagRows.length;
      }
    }

    // ---- Journal + telemetry (ids/tiers/counts only — never PII) -------------
    const counts = { entities, tiers, scoresWritten, flagsWritten, ai: { assisted: aiAssisted, skipped: aiSkipped } };
    await admin
      .from("risk_batch_runs")
      .update({
        status: errors.length === 0 ? "done" : "failed",
        counts,
        error: errors.length > 0 ? errors.slice(0, 5).join(" | ") : null,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);

    emitEvent({
      name: "henry.risk.entity.scored",
      classification: "system_state",
      outcome: errors.length === 0 ? "completed" : "failed",
      payload: { day, modelVersion: model.version, ...counts },
    });
    void persistEvent({
      supabase: admin,
      name: "henry.risk.entity.scored",
      payload: { day, modelVersion: model.version, ...counts },
    });

    return {
      modelVersion: model.version,
      shadow: model.status !== "live",
      entities,
      tiers,
      scoresWritten,
      flagsWritten,
      ai: { assisted: aiAssisted, skipped: aiSkipped },
      errors,
    };
  } finally {
    await releaseRiskBatchLock(worker, new Date());
  }
}
