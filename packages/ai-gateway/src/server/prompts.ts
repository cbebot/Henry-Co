import "server-only";

import type { AiTask } from "../contracts";
import type { AiSurfaceKey, AiSurfacePolicy } from "../surfaces";
import type { AiPromptParts } from "../orchestrator";
import { INTELLIGENCE_CHAT_SYSTEM_PROMPT, normalizeChatMessages } from "../intelligence-chat";
import { composeSystemPrompt } from "../doctrine";
import {
  buildStudioBriefStructuredPrompt,
  buildStudioMessageRefinePrompt,
  buildStudioBriefCoachPrompt,
} from "../studio-prompts";

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
    "Fill every field the seller's words genuinely support. Leave a field you cannot ground in their",
    "words as an empty string — an empty field is honest; a guessed one is not.",
    "",
    "Respond with ONLY a JSON object (no prose, no code fences) of exactly this shape:",
    "{",
    '  "title": string,          // a polished product title built from the idea (<= 90 chars)',
    '  "summary": string,        // a one-line listing summary (<= 140 chars)',
    "  \"description\": string, // the product story: 3-5 short paragraphs (roughly 120-250 words) — what it is, who it is for, and what makes it worth buying, grounded ONLY in the seller's words",
    '  "category": string,       // a suggested category label (may be empty)',
    '  "specifications": string, // bullet-style key specs as plain text (may be empty)',
    '  "material": string,       // ONLY if stated or clearly implied by the seller, else ""',
    '  "warranty": string,       // ONLY if the seller mentioned one, else ""',
    '  "delivery_note": string,  // a short honest delivery/fulfilment line if inferable, else ""',
    '  "lead_time": string       // ONLY if the seller mentioned production/shipping time, else ""',
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

// The Henry Onyx Verified trust review (deep tier, METERED, multimodal). Reads the listing
// copy + media and returns a strict JSON verdict on honesty, AI-generated media, standards,
// and safety. The verdict AUGMENTS human moderation (see verify.ts) — it never publishes.
const LISTING_VERIFY_SYSTEM = composeSystemPrompt(
  [
    "Carefully review a Henry Onyx listing (its copy and any images) before it goes live, so the seller",
    "can earn the trust of buyers. Judge ONLY what you can see; never assume facts not present. Assess:",
    "- honest: do the claims match the images and copy? nothing fabricated or exaggerated?",
    "- aiGeneratedMedia: do the images look AI-generated / synthetic rather than real product photos?",
    "- matchesStandards: clear, complete, professional, and within Henry Onyx content standards?",
    "- safeToPost: free of prohibited, unsafe, or deceptive content?",
    "Be fair and encouraging — your goal is to help good listings earn trust, and to protect buyers from",
    "dishonest or unsafe ones. A human reviewer makes the final call; your verdict guides them.",
    "",
    "Respond with ONLY a JSON object (no prose, no code fences) of exactly this shape:",
    "{",
    '  "honest": boolean,',
    '  "aiGeneratedMedia": boolean,',
    '  "matchesStandards": boolean,',
    '  "safeToPost": boolean,',
    '  "trustScore": number,          // 0-100 overall trustworthiness',
    '  "reasons": string[],           // short, specific, constructive notes',
    '  "verdict": "pass" | "review" | "reject"',
    "}",
  ].join("\n"),
);

function buildListingVerifyPrompt(task: AiTask, _policy: AiSurfacePolicy): AiPromptParts {
  const title = str(task.input.title, 200);
  const summary = str(task.input.summary, 400);
  const description = str(task.input.description, 4000);
  const category = str(task.input.category ?? task.input.category_slug, 120);
  const images = Array.isArray(task.input.images)
    ? (task.input.images as unknown[]).filter((u): u is string => typeof u === "string").slice(0, 8)
    : [];

  const userText = [
    title ? `Title: ${title}` : "",
    category ? `Category: ${category}` : "",
    summary ? `Summary: ${summary}` : "",
    description ? `Description: ${description}` : "",
    images.length ? `(${images.length} image(s) attached.)` : "(No images provided.)",
    "",
    "Review this listing and return the verdict JSON.",
  ]
    .filter(Boolean)
    .join("\n");

  return { system: LISTING_VERIFY_SYSTEM, messages: [{ role: "user", content: userText }], images };
}

// A generic structured-draft builder for the company-wide *.draft surfaces (jobs posting,
// learn course, property listing). Inherits the doctrine; produces the same JSON shape the
// marketplace draft uses, so every division's draft panel can fill its form uniformly.
const CONTENT_DRAFT_KIND: Partial<Record<AiSurfaceKey, string>> = {
  "jobs.posting.draft": "job posting (role, responsibilities, requirements)",
  "learn.course.draft": "course outline (what it teaches, who it's for, modules)",
  "property.listing.draft": "property listing (the place, its features, the terms)",
};

function buildContentDraftPrompt(task: AiTask, policy: AiSurfacePolicy): AiPromptParts {
  const kind = CONTENT_DRAFT_KIND[policy.surface] ?? "listing";
  const title = str(task.input.title, 200);
  const notes = str(task.input.notes ?? task.input.text ?? task.input.summary, 1600);
  return {
    system: composeSystemPrompt(
      [
        `Help the person turn a short idea into a clear, honest, conversion-ready ${kind} that helps them`,
        "succeed — making their offering look its best without ever inventing facts, prices, credentials,",
        "or guarantees they did not provide. They edit everything before publishing. If the request is",
        'off-topic or outside the boundaries, return the JSON with "summary":"" and a short, warm',
        '"description" explaining what you can help draft.',
        "",
        "Respond with ONLY a JSON object (no prose, no code fences) of exactly this shape:",
        "{",
        '  "summary": string,        // a one-line summary (<= 140 chars)',
        '  "description": string,    // 2-4 short paragraphs of honest detail',
        '  "category": string,       // a suggested category/label (may be empty)',
        '  "specifications": string  // bullet-style key points as plain text (may be empty)',
        "}",
      ].join("\n"),
    ),
    messages: [{ role: "user", content: `${title ? `Idea: ${title}\n` : ""}${notes ? `Notes: ${notes}\n` : ""}\nDraft the ${kind} as the specified JSON object.` }],
  };
}

const PROMPT_BUILDERS: Partial<Record<AiSurfaceKey, (task: AiTask, policy: AiSurfacePolicy) => AiPromptParts>> = {
  "marketplace.listing.draft": buildMarketplaceListingDraftPrompt,
  "marketplace.listing.verify": buildListingVerifyPrompt,
  "intelligence.chat": buildIntelligenceChatPrompt,
  "support.message.assist": buildSupportAssistPrompt,
  "business.message.assist": buildBusinessAssistPrompt,
  "account.check.assist": buildAccountCheckPrompt,
  "studio.brief.staff": buildStudioBriefStructuredPrompt,
  "studio.brief.client": buildStudioMessageRefinePrompt,
  "studio.brief.coach": buildStudioBriefCoachPrompt,
  // Company-wide: drafts reuse the generic structured-draft builder; the trust reviews reuse
  // the generic verdict builder (honest / not-AI-generated / on-standard / safe).
  "jobs.posting.draft": buildContentDraftPrompt,
  "learn.course.draft": buildContentDraftPrompt,
  "property.listing.draft": buildContentDraftPrompt,
  "jobs.posting.verify": buildListingVerifyPrompt,
  "learn.course.verify": buildListingVerifyPrompt,
  "property.listing.verify": buildListingVerifyPrompt,
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

/** Parse a validated draft into a plain view-model the surface can map onto form fields.
 *  The extended fields (title/material/warranty/deliveryNote/leadTime) are additive: surfaces
 *  whose prompts don't request them simply parse them as "". */
export function parseDraftOutput(raw: string): {
  title: string;
  summary: string;
  description: string;
  category: string;
  specifications: string;
  material: string;
  warranty: string;
  deliveryNote: string;
  leadTime: string;
} | null {
  try {
    const parsed = JSON.parse(stripFences(raw)) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return {
      title: str(parsed.title, 120),
      summary: str(parsed.summary, 200),
      description: str(parsed.description, 4000),
      category: str(parsed.category, 120),
      specifications: str(parsed.specifications, 2000),
      material: str(parsed.material, 160),
      warranty: str(parsed.warranty, 160),
      deliveryNote: str(parsed.delivery_note ?? parsed.deliveryNote, 240),
      leadTime: str(parsed.lead_time ?? parsed.leadTime, 120),
    };
  } catch {
    return null;
  }
}
