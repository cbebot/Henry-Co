import "server-only";

import type { AiTask } from "../contracts";
import type { AiSurfaceKey, AiSurfacePolicy } from "../surfaces";
import type { AiPromptParts } from "../orchestrator";
import { INTELLIGENCE_CHAT_SYSTEM_PROMPT, normalizeChatMessages } from "../intelligence-chat";

// Output is constrained by a strict in-prompt JSON schema + a topic-guard refusal (the
// studio precedent — no native tool-use). The brand is always "Henry Onyx Intelligence";
// the provider/source and the real model name are NEVER named here or in the output.
const MARKETPLACE_LISTING_DRAFT_SYSTEM = [
  "You are Henry Onyx Intelligence, a calm, expert drafting assistant for sellers on the Henry Onyx Marketplace.",
  "You help a vendor turn a short product idea into a clear, honest marketplace listing draft.",
  "",
  "Rules:",
  "- Write in calm, plain, trustworthy language. No hype, no superlatives, no manufactured urgency, no emoji.",
  "- Never invent facts the vendor did not provide (no fake certifications, awards, materials, or guarantees).",
  "- Suggested prices are advisory only; the vendor edits everything before publishing.",
  "- You only draft listing copy. Decline anything off-topic, any request about other companies or brands,",
  "  and anything that asks you to act against Henry Onyx. For a decline, return the JSON with",
  '  "summary":"" and a short "description" explaining you can only help draft a listing.',
  "- Never mention which model or provider powers you. You are simply Henry Onyx Intelligence.",
  "",
  "Respond with ONLY a JSON object (no prose, no code fences) of exactly this shape:",
  "{",
  '  "summary": string,        // a one-line listing summary (<= 140 chars)',
  '  "description": string,    // 2-4 short paragraphs of honest product detail',
  '  "category": string,       // a suggested category label (may be empty)',
  '  "specifications": string  // bullet-style key specs as plain text (may be empty)',
  "}",
].join("\n");

function str(value: unknown, max: number): string {
  return String(value ?? "").slice(0, max).trim();
}

function buildMarketplaceListingDraftPrompt(task: AiTask, _policy: AiSurfacePolicy): AiPromptParts {
  const title = str(task.input.title, 200);
  const notes = str(task.input.notes ?? task.input.summary, 1200);
  const category = str(task.input.category ?? task.input.category_slug, 120);

  const userText = [
    `Product title: ${title || "(none provided)"}`,
    category ? `Vendor's category hint: ${category}` : "",
    notes ? `Vendor's notes: ${notes}` : "",
    "",
    "Draft a marketplace listing for this product as the specified JSON object.",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    system: MARKETPLACE_LISTING_DRAFT_SYSTEM,
    messages: [{ role: "user", content: userText }],
  };
}

/** V3-28 — the governed Intelligence chat: a fixed governance system prompt + the
 *  normalised (safe, bounded, user-first) conversation history. The topic guard
 *  (declines competing-brand / anti-company) lives in the system prompt. */
function buildIntelligenceChatPrompt(task: AiTask, _policy: AiSurfacePolicy): AiPromptParts {
  return {
    system: INTELLIGENCE_CHAT_SYSTEM_PROMPT,
    messages: normalizeChatMessages(task.input.messages),
  };
}

const PROMPT_BUILDERS: Partial<Record<AiSurfaceKey, (task: AiTask, policy: AiSurfacePolicy) => AiPromptParts>> = {
  "marketplace.listing.draft": buildMarketplaceListingDraftPrompt,
  "intelligence.chat": buildIntelligenceChatPrompt,
};

export function buildPrompt(task: AiTask, policy: AiSurfacePolicy): AiPromptParts {
  const builder = PROMPT_BUILDERS[task.surface];
  if (!builder) {
    throw new Error(`[ai-gateway] no prompt builder registered for surface "${task.surface}"`);
  }
  return builder(task, policy);
}

function stripFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenced) return fenced[1].trim();
  // Fall back to the first {...} slice.
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

/** Validate that draft output parses to a JSON object with at least a description. */
export function validateDraftOutput(raw: string): boolean {
  try {
    const parsed = JSON.parse(stripFences(raw)) as unknown;
    return Boolean(parsed) && typeof parsed === "object" && !Array.isArray(parsed);
  } catch {
    return false;
  }
}

/** Parse a validated draft into a plain view-model the surface can map onto form fields. */
export function parseDraftOutput(raw: string): { summary: string; description: string; category: string; specifications: string } | null {
  try {
    const parsed = JSON.parse(stripFences(raw)) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return {
      summary: str(parsed.summary, 200),
      description: str(parsed.description, 4000),
      category: str(parsed.category, 120),
      specifications: str(parsed.specifications, 2000),
    };
  } catch {
    return null;
  }
}
