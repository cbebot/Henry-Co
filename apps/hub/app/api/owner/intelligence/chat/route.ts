import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

import { runAiTask, noBillingPort } from "@henryco/ai-gateway/server";
import { interpretFounderAssistOutput, type ChatMessage } from "@henryco/ai-gateway";
import { requireOwner } from "@/app/lib/owner-auth";
import { buildCompanyFactsForFounderAI } from "@/lib/founder-intelligence/company-facts";
import { persistFounderTurn } from "@/lib/founder-intelligence/persist";

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

  const result = await runAiTask(
    {
      surface: "hub.founder.assist",
      actorId: auth.user.id,
      input: { messages, company },
      idempotencyKey: randomUUID(),
    },
    { billing: noBillingPort },
  );

  if (!result.ok) {
    const status = result.error.code === "rate_limited" ? 429 : 502;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  const turn = interpretFounderAssistOutput(result.value.output);
  if (!turn) {
    return NextResponse.json({ error: "Please try that again." }, { status: 502 });
  }

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
