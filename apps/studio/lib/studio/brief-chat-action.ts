"use server";

import { randomUUID } from "node:crypto";
import { runAiTask, noBillingPort } from "@henryco/ai-gateway/server";
import { parseCoachEnvelope } from "@henryco/ai-gateway";
import { STUDIO_AI_MODEL_LABEL, briefFailureCopy, isRetryableGatewayCode } from "@/lib/studio/ai-runtime";
import { getOrCreateCopilotSessionId } from "@/lib/studio/copilot-session";
import {
  briefUsageHash,
  countChatTurnsByIpHash,
  countChatTurnsBySession,
  countChatTurnsSystemWide,
  recordChatTurnRow,
  resolveRequestIp,
} from "@/lib/studio/brief-usage";
import {
  BRIEF_CHAT_MAX_MESSAGE_CHARS,
  BRIEF_CHAT_MAX_TURNS,
  BRIEF_CHAT_CLOSING,
  countAssistantTurns,
  redactChatText,
  type BriefChatMessage,
} from "@/lib/studio/brief-chat";

/**
 * Rule-based cost guards for the model-only coach (there is NO canned
 * fallback to hide behind, so the rules do all the limiting):
 *
 *   1. 12-turn ceiling per conversation (BRIEF_CHAT_MAX_TURNS, below)
 *   2. 1200-char per-message cap (sanitizeMessages)
 *   3. Gateway per-session daily allowance — 60 calls (surfaces.ts)
 *   4. Burst brake     — 8 turns / minute / session (anti-loop, anti-script)
 *   5. Per-IP backstop — 150 turns / day (defeats cookie-clear session
 *                        rotation; generous for shared/NAT'd offices)
 *   6. System ceiling  — 4000 turns / day (final brake against runaway;
 *                        chat turns are fast-tier, 512-token-capped)
 *
 * Counters live on studio_brief_drafts (intent "studio_brief_chat", no
 * transcript content) and fail open — the gateway allowance still binds.
 */
const CHAT_BURST_LIMIT_PER_MINUTE = 8;
const CHAT_IP_LIMIT_PER_DAY = 150;
const CHAT_SYSTEM_LIMIT_PER_DAY = 4000;
const DAY_SECONDS = 60 * 60 * 24;

export type BriefChatTurn = {
  reply: string;
  ready: boolean;
  /** Assistant-turn count after this reply — drives the client's turn meter. */
  turn: number;
  /** 0-100 — model-reported brief completeness (drives the client's progress bar). */
  progress: number;
  /** Brand-opaque label only (never a provider/model id). */
  modelUsed: string;
};

export type BriefChatResult =
  | { ok: true; turn: BriefChatTurn }
  | { ok: false; message: string };

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

/**
 * Advance the brief intake conversation by one assistant turn — model-only, by design.
 *
 * The coach NEVER substitutes a scripted question that pretends to understand (owner directive:
 * misleading fallbacks are worse than an honest miss). Every turn goes to the governed gateway;
 * a transport hiccup gets ONE server-side retry; anything else returns calm, honest copy and the
 * person simply sends again. Cost is guarded by RULES, not by canned replies: the per-session
 * daily allowance at the gateway (the stable session actor makes it bind), the 12-turn ceiling
 * per conversation, and the per-message length cap.
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

  // Hard ceiling — wrap up honestly (a completion, not a stand-in) rather than burn more calls.
  if (countAssistantTurns(messages) >= BRIEF_CHAT_MAX_TURNS) {
    return {
      ok: true,
      turn: {
        reply: BRIEF_CHAT_CLOSING,
        ready: true,
        turn: countAssistantTurns(messages) + 1,
        progress: 100,
        modelUsed: STUDIO_AI_MODEL_LABEL,
      },
    };
  }

  // The stable session actor — the same identity the co-pilot's anti-abuse uses — so the
  // gateway's per-actor daily allowance actually binds for anonymous prospects.
  const sessionId = await getOrCreateCopilotSessionId();
  const ip = await resolveRequestIp();
  const ipHash = ip ? briefUsageHash(ip) : null;
  const lastUserMessage = messages[messages.length - 1]?.content ?? "";

  // Rule guards (see the constants above) — checked in parallel, honest copy
  // on every block, a rate_limited accounting row for telemetry.
  const [burstCount, ipCount, systemCount] = await Promise.all([
    countChatTurnsBySession(sessionId, 60),
    ipHash ? countChatTurnsByIpHash(ipHash, DAY_SECONDS) : Promise.resolve(0),
    countChatTurnsSystemWide(DAY_SECONDS),
  ]);
  if (burstCount >= CHAT_BURST_LIMIT_PER_MINUTE) {
    void recordChatTurnRow({
      sessionId, ipHash, lastUserMessage,
      status: "rate_limited", errorReason: "burst",
    });
    return {
      ok: false,
      message: "One moment — the co-pilot answers at a steady pace. Send that again in a few seconds.",
    };
  }
  if (ipCount >= CHAT_IP_LIMIT_PER_DAY) {
    void recordChatTurnRow({
      sessionId, ipHash, lastUserMessage,
      status: "rate_limited", errorReason: "ip_daily",
    });
    return { ok: false, message: briefFailureCopy("rate_limited") };
  }
  if (systemCount >= CHAT_SYSTEM_LIMIT_PER_DAY) {
    void recordChatTurnRow({
      sessionId, ipHash, lastUserMessage,
      status: "rate_limited", errorReason: "system_daily",
    });
    return { ok: false, message: briefFailureCopy("kill_switch_active") };
  }

  // Redact PII from the transcript before it leaves our server. The transcript starts with a
  // user turn (the opener greeting is UI-only), matching the provider's user-first contract.
  const redacted = messages.map((message) => ({
    role: message.role,
    content: redactChatText(message.content),
  }));

  const attempt = async () => {
    try {
      return await runAiTask(
        {
          surface: "studio.brief.coach",
          actorId: `studio-coach:${sessionId}`,
          input: { messages: redacted },
          idempotencyKey: randomUUID(),
        },
        { billing: noBillingPort },
      );
    } catch (error) {
      // Defence in depth — the gateway's contract is to never throw; if it somehow does, the
      // person gets honest copy, not a crash. Error name only (no provider/model).
      console.error("[studio][brief-chat] gateway threw", {
        name: error instanceof Error ? error.name : "unknown",
      });
      return { ok: false as const, error: { code: "provider_error", message: "" } };
    }
  };

  // One transparent retry on transport trouble; every other refusal reports honestly.
  const startedAt = Date.now();
  let result = await attempt();
  if (!result.ok && isRetryableGatewayCode(result.error.code)) {
    result = await attempt();
  }
  if (!result.ok) {
    void recordChatTurnRow({
      sessionId, ipHash, lastUserMessage,
      status: "failed", errorReason: result.error.code,
      durationMs: Date.now() - startedAt,
    });
    return { ok: false, message: briefFailureCopy(result.error.code) };
  }

  // The gateway already validated (and once-retried) the envelope; this parse is the backstop.
  const envelope = parseCoachEnvelope(result.value.output);
  if (!envelope) {
    void recordChatTurnRow({
      sessionId, ipHash, lastUserMessage,
      status: "failed", errorReason: "schema_validation_failed",
      durationMs: Date.now() - startedAt,
    });
    return { ok: false, message: briefFailureCopy("schema_validation_failed") };
  }

  void recordChatTurnRow({
    sessionId, ipHash, lastUserMessage,
    status: "completed", durationMs: Date.now() - startedAt,
  });

  return {
    ok: true,
    turn: {
      reply: envelope.reply,
      ready: envelope.ready,
      turn: countAssistantTurns(messages) + 1,
      progress: envelope.progress,
      modelUsed: STUDIO_AI_MODEL_LABEL,
    },
  };
}
