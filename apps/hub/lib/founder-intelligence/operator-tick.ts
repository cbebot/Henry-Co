import "server-only";

/**
 * SA-4 — the Owner-AI operator tick (ARCHITECTURE §4.3): the pulse that keeps
 * the studio agency moving while the owner is offline. READ → ASSESS → PREPARE
 * → ESCALATE, never execute:
 *
 *   PREP     briefs held at the SA-D5 gate become one-tap `proposal.send`
 *            cards, with an AI-prepared review note when the budget allows.
 *   MONITOR  jobs in owner_review become `deploy.approve` cards; stalled jobs
 *            with a breached envelope become `budget_increase` cards; stalls
 *            ring the owner (push + email fallback), once per job.
 *   ESCALATE publishNotification (urgent ⇒ owner push fan-out) + Postmark
 *            email as the always-on fallback — the two channels are
 *            independent by design.
 *
 * Discipline (all enforced OUTSIDE the model):
 *   - single-flight: CAS lock on ai_operator_tick_lock (TTL 90s > route
 *     maxDuration 60s) — overlapping crons no-op, so the daily-spend read is
 *     always fresh relative to peers (the SA-3 concurrent-tick lesson);
 *   - ₦5,000/day AI ceiling: reserve the UPPER-BOUND estimate into
 *     `committedKobo` BEFORE each model call, settle into the durable ledger
 *     after; a broken ledger degrades CLOSED (no AI, deterministic work
 *     continues);
 *   - the tick executes NOTHING consequential — every card still crosses the
 *     confirm route's requireOwner → reauth → CAS → drift gate.
 */

import { randomUUID } from "node:crypto";
import { interpretFounderAssistOutput } from "@henryco/ai-gateway";
import { estimateFreeTurnCostKobo, noBillingPort, runAiTask } from "@henryco/ai-gateway/server";
import { sendTransactionalEmail } from "@henryco/email";
import { publishNotification } from "@henryco/notifications";
import { emitEvent } from "@henryco/observability/events";
import { createAdminSupabase } from "@/lib/supabase";
import {
  isStudioAgencyLiveHub,
  listAgencyJobs,
  listProposalsInReview,
} from "@/lib/studio-agency-read";
import { formatNairaFromKobo } from "./studio-agency-model";
import {
  evaluateOperatorBudget,
  OPERATOR_TICK_LOCK_TTL_SECONDS,
  resolveOperatorBudgetKobo,
} from "./operator-budget";
import { raiseOperatorProposal, resolveOperatorOwnerUserId } from "./operator-propose";

export type OperatorTickSummary = {
  ran: boolean;
  reason?: string;
  scanned: number;
  raised: number;
  deduped: number;
  escalated: number;
  aiPrepared: number;
  aiSkipped: number;
};

const AI_PREP_MAX_PER_TICK = 3;

function emptySummary(reason?: string): OperatorTickSummary {
  return { ran: false, reason, scanned: 0, raised: 0, deduped: 0, escalated: 0, aiPrepared: 0, aiSkipped: 0 };
}

// ── single-flight lock (the SA-3 CAS-row idiom, on the operator's OWN row) ───

async function acquireOperatorTickLock(worker: string, ttlSeconds = OPERATOR_TICK_LOCK_TTL_SECONDS): Promise<boolean> {
  try {
    const admin = createAdminSupabase();
    const nowIso = new Date().toISOString();
    const untilIso = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    const { data } = await admin
      .from("ai_operator_tick_lock")
      .update({ locked_until: untilIso, holder: worker, updated_at: nowIso } as never)
      .eq("id", true)
      .lt("locked_until", nowIso) // CAS — only when the prior lock has expired
      .select("id")
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

async function releaseOperatorTickLock(worker: string): Promise<void> {
  try {
    const admin = createAdminSupabase();
    await admin
      .from("ai_operator_tick_lock")
      .update({ locked_until: new Date().toISOString(), updated_at: new Date().toISOString() } as never)
      .eq("id", true)
      .eq("holder", worker);
  } catch {
    // a stuck lock self-heals at TTL expiry.
  }
}

// ── durable spend ledger ─────────────────────────────────────────────────────

async function operatorSpendTodayKobo(): Promise<number | null> {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin.rpc("ai_operator_spend_today");
    if (error) return null; // degrade CLOSED — the caller treats null as exhausted
    return Number(data) || 0;
  } catch {
    return null;
  }
}

async function recordOperatorSpend(costKobo: number): Promise<void> {
  if (!(costKobo > 0)) return;
  try {
    const admin = createAdminSupabase();
    await admin.rpc("ai_operator_spend_add", { p_add_kobo: Math.round(costKobo) });
  } catch {
    // best-effort settle; the reservation already bounded this tick.
  }
}

// ── escalation (push + email fallback, deduped once per job per condition) ───

async function alreadyEscalated(jobId: string, condition: string): Promise<boolean> {
  try {
    const admin = createAdminSupabase();
    const { count } = await admin
      .from("studio_build_events")
      .select("id", { count: "exact", head: true })
      .eq("job_id", jobId)
      .eq("kind", "operator_escalated")
      .eq("payload->>condition", condition);
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

async function markEscalated(jobId: string, condition: string): Promise<void> {
  try {
    const admin = createAdminSupabase();
    await admin
      .from("studio_build_events")
      .insert({ job_id: jobId, kind: "operator_escalated", payload: { condition } } as never);
  } catch {
    // best-effort dedupe marker.
  }
}

async function resolveOwnerEmail(): Promise<string | null> {
  const configured = String(process.env.OWNER_ALERT_EMAIL ?? "").trim();
  if (configured.includes("@")) return configured;
  try {
    const admin = createAdminSupabase();
    const { data } = await admin
      .from("owner_profiles")
      .select("email, role, is_active")
      .eq("role", "owner")
      .eq("is_active", true)
      .limit(1);
    const email = String((data as Array<{ email?: string }> | null)?.[0]?.email ?? "").trim();
    return email.includes("@") ? email : null;
  } catch {
    return null;
  }
}

async function escalateToOwner(input: {
  ownerUserId: string;
  jobId: string;
  condition: "job_stalled" | "budget_breach";
  title: string;
  body: string;
}): Promise<boolean> {
  if (await alreadyEscalated(input.jobId, input.condition)) return false;

  // In-app + push (urgent severity fans out to every registered owner device).
  // No PII and no money amounts in title/body — ids ride the payload.
  await publishNotification({
    userId: input.ownerUserId,
    division: "studio",
    eventType: "owner.operator.escalation",
    severity: "urgent",
    title: input.title,
    body: input.body,
    deepLink: "/owner/operations/decisions",
    payload: { kind: input.condition, job_id: input.jobId },
    publisher: "hub-operator-tick",
  }).catch(() => undefined);

  // Postmark fallback — independent of push; treated as best-effort beside it.
  const ownerEmail = await resolveOwnerEmail();
  if (ownerEmail) {
    await sendTransactionalEmail({
      to: ownerEmail,
      subject: input.title,
      text: `${input.body}\n\nOpen your decisions inbox: /owner/operations/decisions (job ${input.jobId}).`,
      purpose: "security",
    }).catch(() => undefined);
  }

  await markEscalated(input.jobId, input.condition);
  emitEvent({
    name: "henry.studio.operator.escalated",
    classification: "system_state",
    outcome: "completed",
    payload: { job_id: input.jobId, condition: input.condition },
  });
  return true;
}

// ── AI prep (bounded, reserved-before-run, ceiling-capped) ───────────────────

type AiBudgetCtx = { spentKobo: number | null; committedKobo: number; budgetKobo: number };

async function prepareReviewNote(ctx: AiBudgetCtx, proposalTitle: string): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_FOUNDER_INTELLIGENCE_LIVE !== "1") return null;
  const inputText = `Prepare a two-sentence review note for the held studio proposal "${proposalTitle}": what the client is buying and the one thing to check before releasing it. Calm, concrete, no hype.`;
  const estimate = estimateFreeTurnCostKobo({ surface: "hub.founder.assist", inputText });
  const decision = evaluateOperatorBudget({
    spentTodayKobo: ctx.spentKobo,
    committedKobo: ctx.committedKobo,
    nextEstimateKobo: estimate,
    budgetKobo: ctx.budgetKobo,
  });
  if (decision !== "allow") return null;

  // RESERVE before running — N prep calls in one tick can never each see a
  // stale baseline (the free-chat post-pay shape is NOT safe here).
  ctx.committedKobo += estimate;
  try {
    const result = await runAiTask(
      {
        surface: "hub.founder.assist",
        actorId: "founder-cron:operator",
        input: { messages: [{ role: "user", content: inputText }] },
        idempotencyKey: randomUUID(),
      },
      { billing: noBillingPort, audit: { supabase: createAdminSupabase() as never } },
    );
    await recordOperatorSpend(estimate);
    if (!result.ok) return null;
    const turn = interpretFounderAssistOutput(result.value.output);
    const note = turn?.reply?.trim() ?? "";
    return note.length > 0 ? note.slice(0, 600) : null;
  } catch {
    await recordOperatorSpend(estimate);
    return null;
  }
}

// ── the tick ─────────────────────────────────────────────────────────────────

export async function runOperatorTick(now = new Date()): Promise<OperatorTickSummary> {
  if (process.env.FOUNDER_ACTIONS_LIVE !== "1") return emptySummary("actions_dark");
  if (!isStudioAgencyLiveHub()) return emptySummary("agency_dark");

  const ownerUserId = await resolveOperatorOwnerUserId();
  if (!ownerUserId) return emptySummary("no_owner");

  const worker = `optick:${randomUUID().slice(0, 8)}`;
  const locked = await acquireOperatorTickLock(worker);
  if (!locked) return emptySummary("lock_lost");

  const summary: OperatorTickSummary = { ran: true, scanned: 0, raised: 0, deduped: 0, escalated: 0, aiPrepared: 0, aiSkipped: 0 };
  try {
    const budget: AiBudgetCtx = {
      spentKobo: await operatorSpendTodayKobo(),
      committedKobo: 0,
      budgetKobo: resolveOperatorBudgetKobo(process.env),
    };

    // 1. PREP — briefs held at the SA-D5 gate → one-tap proposal.send cards.
    const held = await listProposalsInReview(6);
    summary.scanned += held.length;
    for (const proposal of held) {
      let rationale = `Held at the review gate: "${proposal.title}". Release sends it to the client's portal.`;
      if (summary.aiPrepared < AI_PREP_MAX_PER_TICK) {
        const note = await prepareReviewNote(budget, proposal.title);
        if (note) {
          rationale = note;
          summary.aiPrepared += 1;
        } else {
          summary.aiSkipped += 1;
        }
      }
      const outcome = await raiseOperatorProposal({
        key: "owner.studio.proposal.send",
        params: { proposalId: proposal.id },
        rationale,
        ownerUserId,
      });
      if (outcome.raised) {
        if (outcome.deduped) summary.deduped += 1;
        else summary.raised += 1;
      }
    }

    // 2. MONITOR — jobs waiting on the owner, and jobs in trouble.
    const jobs = await listAgencyJobs({ stages: ["owner_review", "stalled"], limit: 24 });
    summary.scanned += jobs.length;
    for (const job of jobs) {
      if (job.stage === "owner_review") {
        const outcome = await raiseOperatorProposal({
          key: "owner.studio.deploy.approve",
          params: { jobId: job.id },
          rationale: `Client-approved build waiting on your deploy tap. Spend ${formatNairaFromKobo(job.costKobo)} of ${formatNairaFromKobo(job.budgetKobo)}.`,
          ownerUserId,
        });
        if (outcome.raised) {
          if (outcome.deduped) summary.deduped += 1;
          else summary.raised += 1;
        }
        continue;
      }
      // stalled
      const breached = job.costKobo >= job.budgetKobo && job.budgetKobo > 0;
      if (breached) {
        const outcome = await raiseOperatorProposal({
          key: "owner.studio.job.budget_increase",
          params: { jobId: job.id, step: "25" },
          rationale: "The job stopped at its cost envelope. Raising it resumes the build; cancelling refunds per policy.",
          ownerUserId,
        });
        if (outcome.raised) {
          if (outcome.deduped) summary.deduped += 1;
          else summary.raised += 1;
        }
      }
      const rang = await escalateToOwner({
        ownerUserId,
        jobId: job.id,
        condition: breached ? "budget_breach" : "job_stalled",
        title: breached ? "A studio build hit its cost envelope" : "A studio build has stalled",
        body: breached
          ? "The build paused at its approved envelope and is waiting on your decision."
          : "The build stopped reporting progress and is waiting on your decision.",
      });
      if (rang) summary.escalated += 1;
    }

    return summary;
  } finally {
    await releaseOperatorTickLock(worker);
    emitEvent({
      name: "henry.studio.operator.tick",
      classification: "system_state",
      outcome: "completed",
      payload: {
        scanned: summary.scanned,
        raised: summary.raised,
        deduped: summary.deduped,
        escalated: summary.escalated,
        ai_prepared: summary.aiPrepared,
        at: now.toISOString(),
      },
    });
  }
}
