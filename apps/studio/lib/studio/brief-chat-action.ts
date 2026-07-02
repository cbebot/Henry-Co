"use server";

import { randomUUID } from "node:crypto";
import { runAiTask, noBillingPort } from "@henryco/ai-gateway/server";
import { isAiGatewayLive } from "@henryco/ai-gateway";
import { STUDIO_AI_MODEL_LABEL, shouldBackOffOnGatewayCode } from "@/lib/studio/ai-runtime";
import {
  BRIEF_CHAT_MAX_MESSAGE_CHARS,
  BRIEF_CHAT_MAX_TURNS,
  BRIEF_CHAT_CLOSING,
  countAssistantTurns,
  nextCoachReply,
  parseChatEnvelope,
  redactChatText,
  type BriefChatMessage,
} from "@/lib/studio/brief-chat";

// In-memory backoff — same pattern as the one-shot generator. Resets per cold start, which is
// acceptable: it only suppresses doomed model calls until a human resolves the underlying issue.
const MODEL_DISABLED_BACKOFF_MS = 15 * 60 * 1000;
let modelDisabledUntil = 0;

export type BriefChatTurn = {
  reply: string;
  ready: boolean;
  /** Assistant-turn count after this reply — drives the client's turn meter. */
  turn: number;
  /** Brand-opaque label only (never a provider/model id). */
  modelUsed: string;
};

export type BriefChatResult =
  | { ok: true; turn: BriefChatTurn }
  | { ok: false; message: string };

const FALLBACK_MODEL = "studio-local-brief-coach-v1";

function sanitizeMessages(raw: unknown): BriefChatMessage[] | null {
  if (!Array.isArray(raw)) return null;
  const cleaned: BriefChatMessage[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const role = record.role === "assistant" ? "assistant" : record.role === "user" ? "user" : null;
    const content = String(record.content ?? "").trim().slice(0, BRIEF_CHAT_MAX_MESSAGE_CHARS);
    if (!role || !content) continue;
    cleaned.push({ role, content });
  }
  return cleaned;
}

function coachTurn(messages: BriefChatMessage[]): BriefChatResult {
  const { reply, ready } = nextCoachReply(messages);
  return {
    ok: true,
    turn: { reply, ready, turn: countAssistantTurns(messages) + 1, modelUsed: FALLBACK_MODEL },
  };
}

/**
 * Advance the brief intake conversation by one assistant turn.
 *
 * The transcript always ends with the buyer's latest message. When the gateway is live we ask it
 * for the next question (or a wrap-up) through the governed `studio.brief.coach` surface; when it
 * is dark — or on any refusal — we walk the deterministic coach prompts so the conversation never
 * stalls. The transcript itself is not persisted here; it is recorded at finalize via the proven
 * one-shot generator.
 */
export async function continueStudioBriefChatAction(input: {
  messages: BriefChatMessage[];
}): Promise<BriefChatResult> {
  const messages = sanitizeMessages(input?.messages);
  if (!messages || messages.length === 0) {
    return { ok: false, message: "Send a message to start shaping your brief." };
  }
  if (messages[messages.length - 1]?.role !== "user") {
    return { ok: false, message: "Waiting on your reply before the next question." };
  }

  // Hard ceiling — wrap up rather than burn another model call.
  if (countAssistantTurns(messages) >= BRIEF_CHAT_MAX_TURNS) {
    return {
      ok: true,
      turn: {
        reply: BRIEF_CHAT_CLOSING,
        ready: true,
        turn: countAssistantTurns(messages) + 1,
        modelUsed: FALLBACK_MODEL,
      },
    };
  }

  // Flag-dark or backing off → deterministic coach (no provider call).
  if (!isAiGatewayLive(process.env) || modelDisabledUntil > Date.now()) {
    return coachTurn(messages);
  }

  // Redact PII from the transcript before it leaves our server, then route through the gateway.
  // The transcript starts with a user turn (the opener greeting is UI-only), so it maps cleanly
  // onto the provider's user-first alternating contract.
  const redacted = messages.map((message) => ({
    role: message.role,
    content: redactChatText(message.content),
  }));

  let result: Awaited<ReturnType<typeof runAiTask>>;
  try {
    result = await runAiTask(
      {
        surface: "studio.brief.coach",
        // Public funnel (prospective clients, pre-signup): a stable-per-call synthetic actor so the
        // gateway's "no anonymous AI" gate never refuses this FREE intake. The turn ceiling above is
        // the real abuse guard.
        actorId: `studio-coach:${randomUUID()}`,
        input: { messages: redacted },
        idempotencyKey: randomUUID(),
      },
      { billing: noBillingPort },
    );
  } catch (error) {
    // Defence in depth: a runtime throw from the gateway degrades to the deterministic coach turn
    // below rather than crashing the action into a client-facing failure (restores the pre-gateway
    // try/catch resilience). Error name only — no provider/model — so it's diagnosable from logs.
    console.error("[studio][brief-chat] gateway threw", {
      name: error instanceof Error ? error.name : "unknown",
    });
    result = { ok: false, error: { code: "provider_error", message: "" } };
  }

  if (!result.ok) {
    if (shouldBackOffOnGatewayCode(result.error.code)) {
      modelDisabledUntil = Date.now() + MODEL_DISABLED_BACKOFF_MS;
    }
    return coachTurn(messages);
  }

  const envelope = parseChatEnvelope(result.value.output);
  if (!envelope) {
    return coachTurn(messages);
  }

  return {
    ok: true,
    turn: {
      reply: envelope.reply,
      ready: envelope.ready,
      turn: countAssistantTurns(messages) + 1,
      modelUsed: STUDIO_AI_MODEL_LABEL,
    },
  };
}
