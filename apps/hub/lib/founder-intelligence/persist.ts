import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import type { FounderAssistTurn } from "@henryco/ai-gateway";

/**
 * Founder Intelligence F2 — conversation persistence.
 *
 * Service-role writes into the deny-RLS `founder_intelligence_*` tables
 * (owner-only SELECT via a SECURITY DEFINER gate; no client write path at
 * all). Separate tables from the customer `intelligence_*` pair BY DESIGN —
 * the brief requires an access model independent of the support AI.
 *
 * Best-effort by contract: a persistence failure never blocks or breaks the
 * reply. IDOR lesson (PR #389) applied from day one: a caller-supplied
 * conversationId is only appended to after verifying the row belongs to THIS
 * owner user.
 */
export async function persistFounderTurn(input: {
  conversationId: string | null;
  ownerUserId: string;
  lastUserText: string;
  turn: FounderAssistTurn;
}): Promise<{ conversationId: string | null; assistantMessageId: string | null }> {
  try {
    const admin = createAdminSupabase();

    let conversationId = input.conversationId;
    if (conversationId) {
      const { data: existing } = await admin
        .from("founder_intelligence_conversations")
        .select("id, user_id")
        .eq("id", conversationId)
        .maybeSingle();
      const row = existing as { id: string; user_id: string } | null;
      if (!row || row.user_id !== input.ownerUserId) {
        // Unknown or foreign conversation — never append; start fresh instead.
        conversationId = null;
      }
    }

    if (!conversationId) {
      const { data: created, error } = await admin
        .from("founder_intelligence_conversations")
        .insert({
          user_id: input.ownerUserId,
          title: input.lastUserText.slice(0, 120),
        } as never)
        .select("id")
        .single();
      if (error || !created) return { conversationId: null, assistantMessageId: null };
      conversationId = (created as { id: string }).id;
    } else {
      await admin
        .from("founder_intelligence_conversations")
        .update({ updated_at: new Date().toISOString() } as never)
        .eq("id", conversationId);
    }

    await admin.from("founder_intelligence_messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: input.lastUserText.slice(0, 8000),
    } as never);

    const { data: assistantRow } = await admin
      .from("founder_intelligence_messages")
      .insert({
        conversation_id: conversationId,
        role: "assistant",
        content: input.turn.reply.slice(0, 8000),
        navigate: input.turn.navigate,
      } as never)
      .select("id")
      .single();

    return {
      conversationId,
      assistantMessageId: (assistantRow as { id: string } | null)?.id ?? null,
    };
  } catch {
    return { conversationId: null, assistantMessageId: null };
  }
}
