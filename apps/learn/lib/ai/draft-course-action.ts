"use server";

import { runAiTask, createPgBillingPort, parseDraftOutput } from "@henryco/ai-gateway/server";
import type { AiUsageReceipt } from "@henryco/ai-gateway";
import { getPaymentsSqlExecutor } from "@henryco/payments-db";
import { getLearnViewer, viewerHasRole } from "@/lib/learn/auth";
import { createSupabaseServer } from "@/lib/supabase/server";

export interface DraftCourseResult {
  ok: boolean;
  code?: string;
  message?: string;
  draft?: { summary: string; description: string; category: string; specifications: string };
  receipt?: AiUsageReceipt;
}

/**
 * learn.course.draft — METERED. An instructor turns a short idea into a clear, honest course
 * outline through the governed gateway: auth-gated to course authors, priced + reserved
 * against the shared wallet, metered, settled atomically, audited. Provider/model never
 * reach the client; the return carries only the draft + the redacted receipt.
 */
export async function draftCourseAction(input: { title: string; notes?: string; idempotencyKey: string }): Promise<DraftCourseResult> {
  const viewer = await getLearnViewer();
  if (!viewer.user || !viewerHasRole(viewer, ["academy_owner", "academy_admin", "instructor", "content_manager"])) {
    return { ok: false, code: "auth_required", message: "Sign in as an instructor to use Henry Onyx Intelligence." };
  }
  if (!input.title?.trim()) {
    return { ok: false, code: "rate_limited", message: "Add a course title first." };
  }

  const supabase = await createSupabaseServer();
  const result = await runAiTask(
    {
      surface: "learn.course.draft",
      actorId: viewer.user.id,
      input: { title: input.title, notes: input.notes ?? "" },
      idempotencyKey: input.idempotencyKey,
    },
    { billing: createPgBillingPort(getPaymentsSqlExecutor()), audit: { supabase: supabase as never } },
  );

  // Do not surface the raw gateway error message (it can name internal
  // billing/provider mechanics) — the panel renders its own fallback copy.
  if (!result.ok) {
    console.error("[learn][draft-course] AI gateway error:", result.error.code, result.error.message);
    return { ok: false, code: result.error.code, message: "Henry Onyx Intelligence couldn’t complete the draft. Please try again." };
  }

  const draft = parseDraftOutput(result.value.output);
  if (!draft) {
    return { ok: false, code: "schema_validation_failed", message: "Henry Onyx Intelligence couldn’t complete the draft. Please try again." };
  }
  return { ok: true, draft, receipt: result.value.receipt };
}
