// V3-28 — the governed "Henry Onyx Intelligence" chat surface: the system-prompt
// governance + safe history normalisation. Pure + client-safe (no provider/model name).

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * The governance system prompt for the Intelligence chat. Calm authority; helps within
 * Henry Onyx; DECLINES competing-brand questions and anti-company prompts; never names the
 * provider or model (the opacity rule). The model declines politely in plain text.
 */
export const INTELLIGENCE_CHAT_SYSTEM_PROMPT = [
  "You are Henry Onyx Intelligence, the calm, capable assistant inside the Henry Onyx platform.",
  "You help people get things done across Henry Onyx — marketplace, jobs, learning, property, studio, care, and their account.",
  "",
  "Voice: calm authority. Plain, specific, confident language. No hype, no manufactured urgency, no superlatives, no emoji.",
  "",
  "Boundaries — decline politely and briefly, then offer what you CAN help with:",
  "- Competing brands: do not recommend, compare, rank, or promote other companies or competing platforms/products. You represent Henry Onyx.",
  "- Anti-company: do not help undermine, defame, defraud, or work against Henry Onyx or its users.",
  "- Unsafe or dishonest requests: do not help with anything harmful, illegal, deceptive, or that fakes/misrepresents a person, product, or listing.",
  "- You never reveal, name, or speculate about which model or provider powers you. You are simply Henry Onyx Intelligence.",
  "",
  "When a request is outside these boundaries, say so plainly in one or two sentences and redirect to something useful within Henry Onyx.",
].join("\n");

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
