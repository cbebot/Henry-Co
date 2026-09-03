import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

import { runAiTask, noBillingPort } from "@henryco/ai-gateway/server";
import {
  interpretFounderAssistOutput,
  type ChatMessage,
  type FounderAssistTurn,
} from "@henryco/ai-gateway";
import { requireOwner } from "@/app/lib/owner-auth";
import { buildCompanyFactsForFounderAI } from "@/lib/founder-intelligence/company-facts";
import { persistFounderTurn } from "@/lib/founder-intelligence/persist";
import { listFounderActionsForPrompt } from "@/lib/founder-intelligence/action-catalog";
import {
  listFounderLookupsForPrompt,
  runFounderLookup,
} from "@/lib/founder-intelligence/lookup-catalog";
import { resolveProposedAction } from "@/lib/founder-intelligence/propose";

export const runtime = "nodejs";

/**
 * POST /api/owner/intelligence/chat — one turn of Founder Intelligence (F2).
 *
 * The owner-ONLY executive assistant. Access model is independent of the
 * customer support AI by construction:
 *   • its own flag (NEXT_PUBLIC_FOUNDER_INTELLIGENCE_LIVE — dark by default;
 *     flipping the customer flag does nothing here);
 *   • requireOwner (the {ok}-returning API gate) runs BEFORE any model work —
 *     a non-owner gets 404, indistinguishable from the flag being dark;
 *   • grounding is the COMPANY facts pack (owner-data + finance ledger), not
 *     per-user account facts;
 *   • persistence lands in the separate deny-RLS founder_intelligence_* pair.
 *
 * Same-origin only (the launcher lives inside the owner console) — no CORS.
 * Every call is audited by the gateway's telemetry (henry_events + audit log).
 * FREE surface (the founder is the company) but still rate-limited per day so
 * a leaked session cannot burn unbounded provider spend.
 */
export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_FOUNDER_INTELLIGENCE_LIVE !== "1") {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  // Owner gate FIRST — before parsing costs, before any model call.
  const auth = await requireOwner();
  if (!auth.ok) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as {
    messages?: unknown;
    conversationId?: unknown;
  } | null;

  const messages = normalizeMessages(body?.messages);
  const conversationId = typeof body?.conversationId === "string" ? body.conversationId : null;

  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || !last.content.trim()) {
    return NextResponse.json({ error: "Type a message first." }, { status: 400 });
  }

  // Ground the assistant in the live company dataset. Best-effort — a facts
  // failure degrades to conversation-only, never to an error.
  const company = await buildCompanyFactsForFounderAI().catch(() => undefined);

  // F3 — the action catalog is passed to the prompt ONLY when the action layer
  // is live. Absent, the prompt is F2-identical and no proposal is ever formed.
  const actionsLive = process.env.FOUNDER_ACTIONS_LIVE === "1";
  const actions = actionsLive
    ? listFounderActionsForPrompt(
        Number.isFinite(Number(process.env.FOUNDER_ACTIONS_TRANCHE))
          ? Math.max(1, Math.floor(Number(process.env.FOUNDER_ACTIONS_TRANCHE)))
          : 1,
      )
    : undefined;

  // F4 — the closed READ catalog is always offered (owner-gated, read-only):
  // the assistant may request one server-run lookup per model turn to fetch the
  // records (ids, thread messages, pending applications) it needs.
  const lookups = listFounderLookupsForPrompt();

  // The lookup loop: model turn → (optional) server-run read → follow-up model
  // turn WITH the records, inside this same POST. Bounded to MAX_LOOKUPS reads
  // (≤ MAX_LOOKUPS+1 model calls); each call is individually audited by the
  // gateway. The intermediate exchange is transport-only — persistence below
  // stores the owner's question and the FINAL answer, exactly as before.
  const MAX_LOOKUPS = 2;
  let convo: ChatMessage[] = messages;
  let turn: FounderAssistTurn | null = null;

  for (let round = 0; ; round += 1) {
    const result = await runAiTask(
      {
        surface: "hub.founder.assist",
        actorId: auth.user.id,
        input: { messages: convo, company, actions, lookups },
        idempotencyKey: randomUUID(),
      },
      // The audit option is what makes "every call is audited" TRUE — without it the
      // gateway writes no henry_events/audit rows (review finding, 2026-07-10). The
      // most privileged AI surface is exactly where a leaked-session investigation
      // needs a durable trail.
      { billing: noBillingPort, audit: { supabase: auth.supabase as never } },
    );

    if (!result.ok) {
      const status = result.error.code === "rate_limited" ? 429 : 502;
      return NextResponse.json({ error: result.error.message }, { status });
    }

    turn = interpretFounderAssistOutput(result.value.output);
    if (!turn) {
      return NextResponse.json({ error: "Please try that again." }, { status: 502 });
    }

    // No lookup requested, or the read budget is spent → this turn is final.
    if (!turn.lookup || round >= MAX_LOOKUPS) break;

    const lookupBlock = await runFounderLookup(turn.lookup).catch(
      () =>
        `LOOKUP_RESULT for ${turn?.lookup?.key ?? "that lookup"}: the read failed. Answer with what you have and say what's missing.`,
    );
    const finalNotice =
      round === MAX_LOOKUPS - 1
        ? "\nThis was the final lookup for this exchange — answer the founder now."
        : "";

    convo = [
      ...convo,
      { role: "assistant", content: result.value.output.slice(0, 3800) },
      { role: "user", content: (lookupBlock + finalNotice).slice(0, 3900) },
    ];
  }

  // F3 — resolve any proposed action into a server-built confirmation card.
  // Read-only + one INSERT; executes nothing. Null when the layer is dark or
  // the proposal is invalid, so F2 turns are untouched.
  const proposedAction = await resolveProposedAction({
    ownerId: auth.user.id,
    ownerScopedSupabase: auth.supabase as never,
    proposal: turn.proposeAction,
  }).catch(() => null);

  // Persist the turn (best-effort; ownership-checked inside).
  const persisted = await persistFounderTurn({
    conversationId,
    ownerUserId: auth.user.id,
    lastUserText: last.content,
    turn,
  });

  // The launcher renders this like any intelligence turn; founder surface has
  // no handoff/offer semantics (he IS the escalation target).
  return NextResponse.json({
    reply: turn.reply,
    navigate: turn.navigate,
    handoff: false,
    offer: null,
    proposedAction,
    conversationId: persisted.conversationId,
    messageId: persisted.assistantMessageId,
  });
}

function normalizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatMessage[] = [];
  for (const item of raw.slice(-40)) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
    const trimmed = content.trim();
    if (!trimmed) continue;
    out.push({ role, content: trimmed.slice(0, 4000) });
  }
  return out;
}
