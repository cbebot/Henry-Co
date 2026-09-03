"use server";

import { runAiTask, createPgBillingPort } from "@henryco/ai-gateway/server";
import type { AiUsageReceipt, ChatMessage } from "@henryco/ai-gateway";
import { getMarketplaceViewer, viewerHasRole } from "@/lib/marketplace/auth";
import { getPaymentsSqlExecutor } from "@/lib/payments/db";
import { createSupabaseServer } from "@/lib/supabase/server";

export type ChatResult =
  | { ok: true; reply: string; receipt: AiUsageReceipt }
  | { ok: false; code: string; message: string };

/**
 * V3-28 — the governed Henry Onyx Intelligence chat (METERED per reply). Each turn runs
 * through the gateway: authenticated actor required (V3-33), priced + reserved against the
 * vendor's wallet, metered, settled atomically, audited. The system prompt's topic guard
 * declines competing-brand / anti-company prompts. Provider/model never reach the client.
 */
export async function intelligenceChatAction(input: { messages: ChatMessage[]; idempotencyKey: string }): Promise<ChatResult> {
  const viewer = await getMarketplaceViewer();
  if (!viewer.user || !viewerHasRole(viewer, ["vendor", "marketplace_owner", "marketplace_admin"])) {
    return { ok: false, code: "auth_required", message: "Sign in to use Henry Onyx Intelligence." };
  }

  const messages = Array.isArray(input.messages) ? input.messages : [];
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || !last.content.trim()) {
    return { ok: false, code: "rate_limited", message: "Type a message first." };
  }

  const supabase = await createSupabaseServer();
  const result = await runAiTask(
    {
      surface: "intelligence.chat",
      actorId: viewer.user.id,
      input: { messages },
      idempotencyKey: input.idempotencyKey,
    },
    { billing: createPgBillingPort(getPaymentsSqlExecutor()), audit: { supabase: supabase as never } },
  );

  if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
  return { ok: true, reply: result.value.output, receipt: result.value.receipt };
}
