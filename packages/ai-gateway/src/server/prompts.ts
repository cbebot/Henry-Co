import "server-only";

import type { AiTask } from "../contracts";
import type { AiSurfaceKey, AiSurfacePolicy } from "../surfaces";
import type { AiPromptParts } from "../orchestrator";
import { INTELLIGENCE_CHAT_SYSTEM_PROMPT, normalizeChatMessages } from "../intelligence-chat";
import { composeSystemPrompt } from "../doctrine";

// The draft surface inherits the shared doctrine (premium concierge; honesty; declines
// competitors/anti-company; opacity) and adds its structured-output task. Output is
// constrained by a strict in-prompt JSON schema (the studio precedent — no native tool-use).
const MARKETPLACE_LISTING_DRAFT_SYSTEM = composeSystemPrompt(
  [
    "Help a seller turn a short product idea into a clear, honest, conversion-ready marketplace listing",
    "draft that helps them sell — making their product look its best without ever inventing facts (no fake",
    "certifications, awards, materials, or guarantees). Suggested prices are advisory; the seller edits",
    "everything before publishing. If the request is off-topic or outside the boundaries, return the JSON",
    'with "summary":"" and a short, warm "description" explaining you can help draft their listing.',
    "",
    "Respond with ONLY a JSON object (no prose, no code fences) of exactly this shape:",
    "{",
    '  "summary": string,        // a one-line listing summary (<= 140 chars)',
    '  "description": string,    // 2-4 short paragraphs of honest product detail',
    '  "category": string,       // a suggested category label (may be empty)',
    '  "specifications": string  // bullet-style key specs as plain text (may be empty)',
    "}",
  ].join("\n"),
);

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

// V3-29..32 — the assist surfaces. Each is a single-shot "help me write/check X" task. Every
// one inherits the shared Henry Onyx Intelligence Doctrine (premium concierge; help the
// person succeed; decline competing-brand / anti-company / dishonest prompts; opacity), so
// the premium-and-growth posture is uniform across the company. FREE vs METERED is policy
// (surfaces.ts), not prompt — a metered surface still bills the user the company's margin;
// the doctrine is what makes the help worth paying for.
function singleShotPrompt(taskInstruction: string, task: AiTask): AiPromptParts {
  const text = str(task.input.text ?? task.input.message ?? task.input.notes, 4000);
  return {
    system: composeSystemPrompt(taskInstruction),
    messages: [{ role: "user", content: text || "(no input provided)" }],
  };
}

// V3-29 — support-message assist (FREE; company-critical). Helps a user phrase a clear
// message to Henry Onyx support — reduces friction and grows trust.
function buildSupportAssistPrompt(task: AiTask): AiPromptParts {
  return singleShotPrompt(
    "Help the person write a clear, concise message to Henry Onyx support so the team can help them quickly. Rewrite or draft their message; keep their facts and add the missing specifics (what, when, which order or listing) without inventing any. Leave them feeling well looked after.",
    task,
  );
}

// V3-30 — business-message assist (METERED). Helps a business owner draft a professional,
// honest customer-facing message that wins business.
function buildBusinessAssistPrompt(task: AiTask): AiPromptParts {
  return singleShotPrompt(
    "Help a Henry Onyx business owner draft a professional, honest customer-facing message (an update, reply, or announcement) that builds trust and wins business. Keep it warm and specific; never invent facts, prices, promises, or guarantees the owner did not state.",
    task,
  );
}

// V3-31 — account-check assist (FREE; respects RLS — reasons only over what the surface
// provides, never fetches secrets). Helps a user understand their own account.
function buildAccountCheckPrompt(task: AiTask): AiPromptParts {
  return singleShotPrompt(
    "Help the person understand something about their own Henry Onyx account using ONLY the information they have shared in this request. Do not ask for or guess passwords, tokens, card numbers, or other secrets, and never claim to have looked anything up — explain plainly and point them to the right place in their workspace.",
    task,
  );
}

// V3-32 — studio brief assist. The staff variant (FREE/internal) and client variant
// (METERED) share copy; the billing split is policy.
function buildStudioBriefPrompt(task: AiTask): AiPromptParts {
  return singleShotPrompt(
    "Help articulate a clear creative brief for a Henry Onyx Studio project: the goal, audience, scope, tone, and any constraints. Turn rough notes into a structured, confident brief that sets the project up to succeed; never invent requirements the person did not state.",
    task,
  );
}

const PROMPT_BUILDERS: Partial<Record<AiSurfaceKey, (task: AiTask, policy: AiSurfacePolicy) => AiPromptParts>> = {
  "marketplace.listing.draft": buildMarketplaceListingDraftPrompt,
  "intelligence.chat": buildIntelligenceChatPrompt,
  "support.message.assist": buildSupportAssistPrompt,
  "business.message.assist": buildBusinessAssistPrompt,
  "account.check.assist": buildAccountCheckPrompt,
  "studio.brief.staff": buildStudioBriefPrompt,
  "studio.brief.client": buildStudioBriefPrompt,
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
