"use server";

import Anthropic from "@anthropic-ai/sdk";
import { getOptionalEnv } from "@/lib/env";
import { getClientPortalViewer } from "@/lib/portal/auth";

/**
 * refineDraftAction — server action that polishes a client/team message
 * draft via Claude Haiku.
 *
 * Reuses the @anthropic-ai/sdk + ANTHROPIC_API_KEY infrastructure already
 * proven by brief-copilot-action.ts. Operates strictly as a "polish"
 * step: takes the draft, returns a refined version. Never adds new
 * information, never changes intent.
 *
 * Falls back gracefully when no key is configured — returns the original
 * draft so the UX doesn't dead-end on an unused environment variable.
 */
const REFINE_MODEL = "claude-haiku-4-5-20251001";
const REFINE_TIMEOUT_MS = 12_000;
const MIN_DRAFT_CHARS = 6;
const MAX_DRAFT_CHARS = 4_000;

const SYSTEM_PROMPT = [
  "You are a polish assistant for messages exchanged between a client and the Henry & Co. Studio team in a project workspace.",
  "Your job: take the user's draft and return a refined version that is clearer, warmer, and more concise.",
  "",
  "Rules — strict:",
  "  - Preserve intent. Never add facts, names, dates, or commitments not present in the draft.",
  "  - Preserve voice. If the draft is casual, keep it casual; if formal, keep it formal. Never become more formal than the input.",
  "  - Preserve language. If the draft is in French, return French. If pidgin, return pidgin. Don't translate.",
  "  - Strip filler (um, just, basically, kind of), tighten verbose constructions.",
  "  - Keep it brief. Aim for 1-3 sentences unless the draft is genuinely longer.",
  "  - No greetings or sign-offs unless the draft already had them.",
  "  - Return ONLY the refined message. No commentary, no explanations, no quote marks.",
].join("\n");

export type RefineDraftResult =
  | {
      ok: true;
      refined: string;
      modelUsed: string;
      durationMs: number;
      cached: false;
    }
  | {
      ok: false;
      reason: "unauthorised" | "input_too_short" | "input_too_long" | "no_api_key" | "model_error" | "timeout";
      message: string;
      /** When falling back, return the original draft so the caller can
       * still update the UI without re-typing. */
      originalDraft?: string;
    };

export async function refineDraftAction(formData: FormData): Promise<RefineDraftResult> {
  const draft = String(formData.get("draft") || "").trim();
  const projectTitle = String(formData.get("projectTitle") || "").trim();
  const projectSummary = String(formData.get("projectSummary") || "").trim();

  if (draft.length < MIN_DRAFT_CHARS) {
    return {
      ok: false,
      reason: "input_too_short",
      message: `Write at least ${MIN_DRAFT_CHARS} characters before asking AI to refine.`,
      originalDraft: draft,
    };
  }
  if (draft.length > MAX_DRAFT_CHARS) {
    return {
      ok: false,
      reason: "input_too_long",
      message: `Drafts over ${MAX_DRAFT_CHARS} characters skip AI refinement — send as-is.`,
      originalDraft: draft,
    };
  }

  // Auth check — only authenticated portal viewers can call. Defence in
  // depth: the route is already protected, but the action is exported
  // and could be reached out-of-band.
  const viewer = await getClientPortalViewer();
  if (!viewer) {
    return {
      ok: false,
      reason: "unauthorised",
      message: "Sign in to use AI refinement.",
      originalDraft: draft,
    };
  }

  const apiKey = getOptionalEnv("ANTHROPIC_API_KEY");
  if (!apiKey) {
    // Silent fallback — the UX should still work without a key set,
    // it just doesn't change the draft.
    return {
      ok: false,
      reason: "no_api_key",
      message: "AI refinement is disabled — message kept as-is.",
      originalDraft: draft,
    };
  }

  const startedAt = Date.now();

  try {
    const client = new Anthropic({ apiKey, timeout: REFINE_TIMEOUT_MS });

    const userMessageParts: string[] = [];
    if (projectTitle || projectSummary) {
      userMessageParts.push(
        "Context — this message is being sent inside an active project workspace:",
      );
      if (projectTitle) userMessageParts.push(`  - Project: ${projectTitle}`);
      if (projectSummary) userMessageParts.push(`  - Summary: ${projectSummary}`);
      userMessageParts.push("");
    }
    userMessageParts.push("Draft to refine:");
    userMessageParts.push("");
    userMessageParts.push(draft);

    const response = await client.messages.create({
      model: REFINE_MODEL,
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessageParts.join("\n") }],
    });

    const refined = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    if (!refined) {
      return {
        ok: false,
        reason: "model_error",
        message: "AI returned an empty response — message kept as-is.",
        originalDraft: draft,
      };
    }

    return {
      ok: true,
      refined,
      modelUsed: response.model || REFINE_MODEL,
      durationMs: Date.now() - startedAt,
      cached: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isTimeout = /timeout|aborted/i.test(message);
    return {
      ok: false,
      reason: isTimeout ? "timeout" : "model_error",
      message: isTimeout
        ? "AI refinement timed out — message kept as-is."
        : "AI refinement is busy — message kept as-is.",
      originalDraft: draft,
    };
  }
}
