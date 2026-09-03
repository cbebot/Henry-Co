"use server";

import { randomUUID } from "node:crypto";
import { runAiTask, createPgBillingPort, noBillingPort } from "@henryco/ai-gateway/server";
import { isAiGatewayLive } from "@henryco/ai-gateway";
import { getPaymentsSqlExecutor, isPaymentsDbConfigured } from "@henryco/payments-db";
import { getClientPortalViewer } from "@/lib/portal/auth";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * refineDraftAction — polishes a client/team message draft through the governed
 * @henryco/ai-gateway (surface `studio.brief.client`, METERED). It never imports a provider SDK
 * and never sees or returns a provider id, model, or cost — the gateway prices, reserves,
 * meters, and returns only a refined string (+ a redacted receipt). Operates strictly as a
 * "polish" step: same intent, same voice, tighter wording.
 *
 * Flag-dark by default: with the `ai_gateway` master switch off it behaves exactly like the old
 * "no API key" path — returns the original draft so the UX never dead-ends. METERED, so it fails
 * closed (kept-as-is) until studio's wallet rail is configured.
 */
const MIN_DRAFT_CHARS = 6;
const MAX_DRAFT_CHARS = 4_000;

export type RefineDraftResult =
  | { ok: true; refined: string; cached: false }
  | {
      ok: false;
      reason: "unauthorised" | "input_too_short" | "input_too_long" | "unavailable" | "model_error";
      message: string;
      /** When falling back, return the original draft so the caller can update the UI
       * without re-typing. */
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

  // Auth — only authenticated portal viewers. Defence in depth: the route is already protected,
  // but the action is exported and could be reached out-of-band.
  const viewer = await getClientPortalViewer();
  if (!viewer) {
    return { ok: false, reason: "unauthorised", message: "Sign in to use AI refinement.", originalDraft: draft };
  }

  // Flag-dark short-circuit — when the master switch is off, behave exactly like "no key" today.
  if (!isAiGatewayLive(process.env)) {
    return {
      ok: false,
      reason: "unavailable",
      message: "AI refinement is disabled — message kept as-is.",
      originalDraft: draft,
    };
  }

  const supabase = await createSupabaseServer();
  // METERED surface. Fail closed when studio's wallet rail is not configured yet (never silently
  // free): the gateway's reserve refuses ⇒ the provider is never called ⇒ we keep the draft as-is.
  const billing = isPaymentsDbConfigured() ? createPgBillingPort(getPaymentsSqlExecutor()) : noBillingPort;

  const result = await runAiTask(
    {
      surface: "studio.brief.client",
      actorId: viewer.userId,
      input: { draft, projectTitle, projectSummary },
      idempotencyKey: randomUUID(),
    },
    { billing, audit: { supabase: supabase as never } },
  );

  if (!result.ok) {
    // Every gateway refusal maps to the graceful "kept as-is" UX (never a raw error code).
    return {
      ok: false,
      reason: "model_error",
      message: "AI refinement is unavailable right now — message kept as-is.",
      originalDraft: draft,
    };
  }

  const refined = result.value.output.trim();
  if (!refined) {
    return {
      ok: false,
      reason: "model_error",
      message: "AI returned an empty response — message kept as-is.",
      originalDraft: draft,
    };
  }
  return { ok: true, refined, cached: false };
}
