// V3-28 — the governed "Henry Onyx Intelligence" chat surface: the system-prompt
// governance + safe history normalisation. Pure + client-safe (no provider/model name).
import { composeSystemPrompt } from "./doctrine";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * The Intelligence chat system prompt — the shared doctrine (premium concierge; helps the
 * person succeed; declines competing-brand / anti-company / dishonest prompts; never names
 * the provider/model) plus the chat task. Inherits the doctrine so the chat carries the
 * same premium-and-growth posture as every other surface in the company.
 */
export const INTELLIGENCE_CHAT_SYSTEM_PROMPT = composeSystemPrompt(
  [
    "Hold a helpful, multi-turn conversation that helps the person get things done across Henry Onyx —",
    "marketplace, jobs, learning, property, studio, care, and their account. Understand what they are",
    "trying to achieve and move them toward it: answer clearly, draft what they need, and point them to",
    "the right place in their workspace. Keep replies focused and concise.",
  ].join("\n"),
);

function clamp(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) : text;
}

/**
 * Normalise a raw client-supplied history into a safe, bounded, user-first alternating
 * sequence the provider accepts: keep only valid `user`/`assistant` string turns, clamp
 * each to `maxChars`, keep the last `maxTurns*2`, and drop any leading assistant turn (the
 * API requires the prompt to start with a user message).
 */
export function normalizeChatMessages(raw: unknown, opts: { maxTurns?: number; maxChars?: number } = {}): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const maxChars = Math.max(1, opts.maxChars ?? 4000);
  const maxMessages = Math.max(2, (opts.maxTurns ?? 12) * 2);

  const valid: ChatMessage[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") continue;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
    const trimmed = content.trim();
    if (!trimmed) continue;
    valid.push({ role, content: clamp(trimmed, maxChars) });
  }

  const bounded = valid.slice(-maxMessages);
  // Drop any leading assistant turn(s) so the prompt starts with a user message.
  let start = 0;
  while (start < bounded.length && bounded[start].role !== "user") start += 1;
  return bounded.slice(start);
}
