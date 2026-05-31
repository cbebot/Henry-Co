"use server";

import Anthropic from "@anthropic-ai/sdk";
import { getOptionalEnv } from "@/lib/env";
import { BRIEF_COPILOT_MODEL } from "@/lib/studio/brief-copilot-prompt";
import {
  BRIEF_CHAT_MAX_MESSAGE_CHARS,
  BRIEF_CHAT_MAX_TURNS,
  BRIEF_CHAT_SYSTEM_PROMPT,
  BRIEF_CHAT_CLOSING,
  countAssistantTurns,
  nextCoachReply,
  parseChatEnvelope,
  redactChatText,
  type BriefChatMessage,
} from "@/lib/studio/brief-chat";

// In-memory billing/auth backoff — same pattern as the one-shot generator.
// Resets per cold start, which is acceptable: it only suppresses doomed
// model calls until a human resolves the underlying billing/key issue.
const MODEL_TIMEOUT_MS = 12 * 1000;
const MODEL_DISABLED_BACKOFF_MS = 15 * 60 * 1000;
let modelDisabledUntil = 0;

export type BriefChatTurn = {
  reply: string;
  ready: boolean;
  /** Assistant-turn count after this reply — drives the client's turn meter. */
  turn: number;
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

async function withModelTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  promise.catch(() => undefined);
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`model_timeout:${timeoutMs}`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function shouldTemporarilyDisableModel(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("credit balance") ||
    lower.includes("billing") ||
    lower.includes("authentication") ||
    lower.includes("invalid x-api-key") ||
    lower.includes("permission")
  );
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
 * The transcript always ends with the buyer's latest message. With a model
 * key we ask Haiku for the next question (or a wrap-up); without one — or
 * on any model failure — we walk the deterministic coach prompts so the
 * conversation never stalls. The transcript itself is not persisted here;
 * it is recorded at finalize via the proven one-shot generator.
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

  const apiKey = getOptionalEnv("ANTHROPIC_API_KEY");
  if (!apiKey || modelDisabledUntil > Date.now()) {
    return coachTurn(messages);
  }

  try {
    const client = new Anthropic({ apiKey, timeout: 25 * 1000, maxRetries: 0 });

    // Redact PII from transcript before it leaves our server. The transcript
    // starts with a user turn (the opener greeting is UI-only), so it maps
    // cleanly onto Anthropic's user-first alternating contract.
    const apiMessages = messages.map((message) => ({
      role: message.role,
      content: redactChatText(message.content),
    }));

    const response = await withModelTimeout(
      client.messages.create({
        model: BRIEF_COPILOT_MODEL,
        max_tokens: 400,
        system: [
          {
            type: "text",
            text: BRIEF_CHAT_SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: apiMessages,
      }),
      MODEL_TIMEOUT_MS,
    );

    const modelUsed = response.model || BRIEF_COPILOT_MODEL;
    const text = response.content
      .filter(
        (block): block is Extract<(typeof response.content)[number], { type: "text" }> =>
          block.type === "text",
      )
      .map((block) => block.text)
      .join("\n")
      .trim();

    const envelope = parseChatEnvelope(text);
    if (!envelope) {
      return coachTurn(messages);
    }

    return {
      ok: true,
      turn: {
        reply: envelope.reply,
        ready: envelope.ready,
        turn: countAssistantTurns(messages) + 1,
        modelUsed,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Co-pilot chat call failed";
    console.error("[studio][brief-chat] model call failed", {
      reason: message.slice(0, 240),
      name: error instanceof Error ? error.name : "unknown",
    });
    if (shouldTemporarilyDisableModel(message)) {
      modelDisabledUntil = Date.now() + MODEL_DISABLED_BACKOFF_MS;
    }
    return coachTurn(messages);
  }
}
