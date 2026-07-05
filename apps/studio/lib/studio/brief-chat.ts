/**
 * Studio brief chat — pure conversation logic for the "Talk it through"
 * on-ramp (/request/copilot). NO React, NO server imports, NO side-effects
 * so it is safe to import from the server action, the client controller,
 * and tests alike.
 *
 * Responsibilities:
 *   - The transcript message shape exchanged client ↔ server action.
 *   - The deterministic coach-prompt walk used when the model is
 *     unavailable (no key / disabled / error) — guarantees the chat
 *     always advances and terminates.
 *   - Assembling the transcript into a single description paragraph that
 *     the proven one-shot synthesis (generateStudioBriefDraftAction)
 *     turns into a structured brief at finalize.
 *   - A minimal local synthesis backstop so finalize never dead-ends even
 *     when the one-shot path is rate-limited.
 *   - The system prompt + JSON-envelope parser for the model path.
 */

import type { BriefCopilotStructured } from "@/lib/studio/brief-copilot-structured";
import type { StudioServiceKind } from "@/lib/studio/types";

export type BriefChatRole = "assistant" | "user";
export type BriefChatMessage = { role: BriefChatRole; content: string };

/** Assistant-reply ceiling per conversation — bounds model cost per session. */
export const BRIEF_CHAT_MAX_TURNS = 12;
/** Per-message length cap — defeats paste-bombs before they reach the model. */
export const BRIEF_CHAT_MAX_MESSAGE_CHARS = 1200;
/** Assistant replies required before the buyer can hand off to the builder. */
export const BRIEF_CHAT_MIN_FINALIZE_TURNS = 3;
/** Upper bound on the assembled description handed to the one-shot synthesis. */
const CHAT_DESCRIPTION_MAX_CHARS = 1600;

/**
 * Static greeting shown above the transcript. NOT stored in the transcript
 * (so the model context always starts with a user turn) — purely UI chrome,
 * localized at render via translateSurfaceLabel.
 */
export const BRIEF_CHAT_OPENER =
  "Tell me what you're hoping to build — in your own words. I'll ask a few questions and shape it into a clear brief; you'll see honest pricing when you review it.";

/**
 * Deterministic fallback conversation. When the model is unavailable we
 * walk these one per assistant turn, in order, then mark the chat ready.
 * Authored in Henry Onyx's voice — warm, one focused ask at a time.
 */
export const BRIEF_CHAT_COACH_PROMPTS: string[] = [
  "Got it. What's the single most important thing it needs to do for the people who use it?",
  "Helpful. Who is it for — the audience or kind of business behind it?",
  "Are there specific pages, screens, or features you already know you want?",
  "Do you have a rough budget band in mind? A range is completely fine.",
  "And when would you like it live — any deadline driving the timeline?",
  "Last one: what outcome would make this a clear win for you?",
];

/** Closing line once the coach walk (or MAX_TURNS) is exhausted. */
export const BRIEF_CHAT_CLOSING =
  "That's everything I need. Let's shape it into a brief you can review — the honest pricing is right there before you commit.";

export function countAssistantTurns(messages: BriefChatMessage[]): number {
  return messages.filter((message) => message.role === "assistant").length;
}

/**
 * The deterministic next assistant turn for the no-model path. Indexes the
 * coach prompts by how many assistant turns have already been spoken, so
 * each call advances exactly one step and the walk terminates.
 */
export function nextCoachReply(messages: BriefChatMessage[]): {
  reply: string;
  ready: boolean;
} {
  const index = countAssistantTurns(messages);
  if (index >= BRIEF_CHAT_COACH_PROMPTS.length) {
    return { reply: BRIEF_CHAT_CLOSING, ready: true };
  }
  const reply = BRIEF_CHAT_COACH_PROMPTS[index] ?? BRIEF_CHAT_CLOSING;
  // Ready once this reply consumes the final coach prompt.
  const ready = index >= BRIEF_CHAT_COACH_PROMPTS.length - 1;
  return { reply, ready };
}

/** Strip emails + phone numbers before any transcript text reaches the model. */
export function redactChatText(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email removed]")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[phone removed]")
    .trim();
}

/**
 * Collapse the user's turns into a single description paragraph for the
 * one-shot synthesis. Assistant questions are dropped — only the buyer's
 * own words describe the project. PII is redacted and the result clamped.
 */
export function assembleChatDescription(messages: BriefChatMessage[]): string {
  const userText = messages
    .filter((message) => message.role === "user")
    .map((message) => redactChatText(message.content))
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return userText.slice(0, CHAT_DESCRIPTION_MAX_CHARS);
}

function includesAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

/**
 * Map a synthesized projectType back to a service kind so the builder lands
 * on a Scope step matching the conversation. Defaults to "website" — the
 * broadest catalogue — when nothing else fits.
 */
export function inferServiceKindFromProjectType(
  projectType: string,
): StudioServiceKind {
  const value = projectType.toLowerCase();
  if (includesAny(value, ["mobile app", "ios", "android", "react native", "flutter"])) {
    return "mobile_app";
  }
  if (includesAny(value, ["storefront", "store", "ecommerce", "e-commerce", "shop"])) {
    return "ecommerce";
  }
  if (includesAny(value, ["internal", "ops tool", "operations", "admin tool"])) {
    return "internal_system";
  }
  if (includesAny(value, ["platform", "web app", "saas", "portal", "dashboard"])) {
    return "custom_software";
  }
  if (includesAny(value, ["brand", "identity", "logo"])) {
    return "branding";
  }
  return "website";
}

/**
 * Minimal deterministic brief built straight from the transcript. This is
 * the finalize backstop — used only when the one-shot synthesis is
 * rate-limited — so the chat lane never dead-ends before the builder.
 * Provides sane Scope + Commercial defaults so the restored draft is valid.
 */
export function synthesizeBriefFromTranscript(
  messages: BriefChatMessage[],
): BriefCopilotStructured {
  const description = assembleChatDescription(messages);
  const input = description.toLowerCase();
  const projectType = includesAny(input, ["mobile app", "ios", "android"])
    ? "Mobile app"
    : includesAny(input, ["store", "shop", "ecommerce", "e-commerce"])
      ? "Storefront"
      : includesAny(input, ["internal", "ops", "admin"])
        ? "Internal ops tool"
        : includesAny(input, ["platform", "saas", "portal", "dashboard"])
          ? "Web app or platform"
          : includesAny(input, ["brand", "identity", "logo"])
            ? "Brand system"
            : "Custom website";

  const goals =
    description.length >= 12
      ? description.slice(0, 600)
      : "Deliver a high-trust digital product that moves the business forward.";

  return {
    projectType,
    platformPreference: "Best-fit recommendation",
    designDirection: "Clean, modern, high-trust product experience",
    preferredLanguage: "English",
    frameworkPreference: "Henry Onyx's framework recommendation",
    backendPreference: "Henry Onyx recommends the backend",
    hostingPreference: "Henry Onyx recommends the host",
    pageRequirements: ["Home", "About", "Services", "Contact"],
    requiredFeatures: ["Responsive interface", "Secure contact capture"],
    addonServices: [],
    techPreferences: [],
    businessType: "Digital business",
    budgetBand: "Not sure yet",
    urgency: "No fixed deadline",
    timeline: "To be confirmed",
    goals,
    scopeNotes:
      "Drafted from a talk-it-through conversation. Confirm scope, integrations, content ownership, and launch constraints before submitting.",
    summary: `${projectType} — conversational brief.`,
    confidence: 0.5,
    uncertainties: [
      "Confirm budget range.",
      "Confirm launch deadline and priority features.",
    ],
  };
}

/**
 * Parse the model's `{ reply, ready }` envelope. Tolerates a stray code
 * fence or surrounding prose by extracting the first balanced object.
 * Returns null when nothing usable is found so the caller can fall back.
 */
export function parseChatEnvelope(
  text: string,
): { reply: string; ready: boolean } | null {
  const trimmed = text.trim();
  const fenced = trimmed
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  const attempt = (candidate: string): { reply: string; ready: boolean } | null => {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
      const record = parsed as Record<string, unknown>;
      const reply = String(record.reply ?? "").trim();
      if (!reply) return null;
      return { reply, ready: record.ready === true };
    } catch {
      return null;
    }
  };

  const direct = attempt(fenced);
  if (direct) return direct;

  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  return attempt(fenced.slice(start, end + 1));
}
