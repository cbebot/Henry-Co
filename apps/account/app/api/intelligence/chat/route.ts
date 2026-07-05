import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

import { runAiTask, noBillingPort } from "@henryco/ai-gateway/server";
import { interpretSupportAssistOutput, type ChatMessage } from "@henryco/ai-gateway";
import { createSupabaseServer } from "@/lib/supabase/server";
import { persistIntelligenceTurn } from "@/lib/intelligence/persist";
import { intelligenceCorsHeaders as corsHeaders, intelligencePreflight } from "@/lib/intelligence/cors";

export const runtime = "nodejs";

/** CORS preflight for the cross-subdomain launcher. */
export function OPTIONS(request: NextRequest) {
  return intelligencePreflight(request);
}

/**
 * POST /api/intelligence/chat — one turn of Henry Onyx Intelligence support (FREE).
 *
 * A POST so no prefetch runs a turn. The signed-in person is derived from the session cookie
 * (never trusted from the body); an anonymous visitor gets a stable synthetic actor from their
 * session id so the gateway's free-allowance cap still binds. The provider and model are never
 * named in the response.
 *
 * Flag-dark: NEXT_PUBLIC_INTELLIGENCE_LIVE must be "1" (the same flag that mounts the
 * launcher), so merging changes nothing in production until the owner flips it.
 */
export async function POST(request: NextRequest) {
  const cors = corsHeaders(request);
  if (process.env.NEXT_PUBLIC_INTELLIGENCE_LIVE !== "1") {
    return NextResponse.json({ error: "Not available." }, { status: 404, headers: cors });
  }

  const body = (await request.json().catch(() => null)) as {
    messages?: unknown;
    division?: unknown;
    page?: unknown;
    sessionId?: unknown;
    conversationId?: unknown;
  } | null;

  const messages = normalizeMessages(body?.messages);
  const division = typeof body?.division === "string" ? body.division : "account";
  const page = typeof body?.page === "string" ? body.page.slice(0, 200) : undefined;
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId.slice(0, 128) : "";
  const conversationId = typeof body?.conversationId === "string" ? body.conversationId : null;

  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || !last.content.trim()) {
    return NextResponse.json({ error: "Type a message first." }, { status: 400, headers: cors });
  }
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session." }, { status: 400, headers: cors });
  }

  // The signed-in person (if any) comes from the session, never the request body.
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;
  const actorId = userId ?? `intelligence:${sessionId}`;

  const result = await runAiTask(
    {
      surface: "support.message.assist",
      actorId,
      input: { messages, division, page },
      idempotencyKey: randomUUID(),
    },
    { billing: noBillingPort },
  );

  if (!result.ok) {
    const status = result.error.code === "rate_limited" ? 429 : result.error.code === "auth_required" ? 401 : 502;
    return NextResponse.json({ error: result.error.message }, { status, headers: cors });
  }

  const turn = interpretSupportAssistOutput(result.value.output);
  if (!turn) {
    return NextResponse.json({ error: "Please try that again." }, { status: 502, headers: cors });
  }

  // Persist + escalate (best-effort — never blocks or breaks the reply).
  const persisted = await persistIntelligenceTurn({
    conversationId,
    userId,
    sessionId,
    division,
    lastUserText: last.content,
    turn,
  });

  return NextResponse.json(
    {
      reply: turn.reply,
      navigate: turn.navigate,
      handoff: turn.handoff,
      // A chargeable deep-work offer (L4): the render-ready capability, or null. The person
      // prices and confirms it before anything runs (see /api/intelligence/quote + /run).
      offer: turn.offer
        ? { key: turn.offer.key, title: turn.offer.title, blurb: turn.offer.blurb }
        : null,
      conversationId: persisted.conversationId,
      messageId: persisted.assistantMessageId,
    },
    { headers: cors },
  );
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
