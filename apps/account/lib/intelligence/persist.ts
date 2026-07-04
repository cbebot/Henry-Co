import "server-only";

import { publishNotification } from "@henryco/notifications";
import type { SupportAssistTurn } from "@henryco/ai-gateway";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * Intelligence Live L1 — durable conversation persistence + human handoff (the owner's
 * window + the Onyx Line escalation). Every write is service-role (RLS is default-deny;
 * only this path writes). Persistence is BEST-EFFORT: a failure here — including the
 * tables not being migrated yet — never breaks a support reply. The reply already exists;
 * saving it is a side effect.
 *
 * Escalation creates a real support_threads row (so it lands in the staff queue exactly
 * like any Onyx Line ticket) — once per conversation, and only for a signed-in person
 * (support_threads.user_id references auth.users, so an anonymous visitor is told the team
 * will follow up but no orphan thread is forged).
 */

const DIVISIONS = new Set([
  "marketplace",
  "care",
  "jobs",
  "learn",
  "logistics",
  "property",
  "studio",
  "account",
  "hub",
]);

type PersistInput = {
  conversationId: string | null;
  userId: string | null;
  sessionId: string;
  division: string;
  lastUserText: string;
  turn: SupportAssistTurn;
};

export type PersistResult = {
  conversationId: string | null;
  assistantMessageId: string | null;
};

export async function persistIntelligenceTurn(input: PersistInput): Promise<PersistResult> {
  const division = DIVISIONS.has(input.division) ? input.division : "account";
  try {
    const admin = createAdminSupabase();
    const status = input.turn.handoff ? "escalated" : "active";

    // 1) Ensure the conversation of record.
    let conversationId = input.conversationId;
    let escalatedThreadId: string | null = null;
    if (!conversationId) {
      const { data } = await admin
        .from("intelligence_conversations")
        .insert({ user_id: input.userId, session_id: input.sessionId, division, status } as never)
        .select("id")
        .single();
      conversationId = (data as { id: string } | null)?.id ?? null;
    } else {
      const { data } = await admin
        .from("intelligence_conversations")
        .update({ status, last_message_at: new Date().toISOString() } as never)
        .eq("id", conversationId)
        .select("id, escalated_thread_id")
        .maybeSingle();
      escalatedThreadId = (data as { escalated_thread_id: string | null } | null)?.escalated_thread_id ?? null;
    }
    if (!conversationId) return { conversationId: null, assistantMessageId: null };

    // 2) Append the user turn + the assistant turn.
    await admin
      .from("intelligence_messages")
      .insert({ conversation_id: conversationId, role: "user", content: input.lastUserText } as never);
    const { data: assistantRow } = await admin
      .from("intelligence_messages")
      .insert({
        conversation_id: conversationId,
        role: "assistant",
        content: input.turn.reply,
        navigate: input.turn.navigate,
        handoff: input.turn.handoff,
      } as never)
      .select("id")
      .single();

    // 3) Human handoff → a real Onyx Line thread, once per conversation, signed-in only.
    if (input.turn.handoff && input.userId && !escalatedThreadId) {
      const threadId = await escalateToOnyxLine(admin, {
        userId: input.userId,
        division,
        lastUserText: input.lastUserText,
      });
      if (threadId) {
        await admin
          .from("intelligence_conversations")
          .update({ escalated_thread_id: threadId } as never)
          .eq("id", conversationId);
      }
    }

    return { conversationId, assistantMessageId: (assistantRow as { id: string } | null)?.id ?? null };
  } catch {
    // Best-effort: never let a persistence problem surface to the person.
    return { conversationId: input.conversationId, assistantMessageId: null };
  }
}

type Admin = ReturnType<typeof createAdminSupabase>;

async function escalateToOnyxLine(
  admin: Admin,
  input: { userId: string; division: string; lastUserText: string },
): Promise<string | null> {
  try {
    const subject = deriveSubject(input.lastUserText);
    const { data: thread, error: threadError } = await admin
      .from("support_threads")
      .insert({
        user_id: input.userId,
        subject,
        division: input.division,
        category: "general",
        status: "open",
        priority: "high",
      } as never)
      .select("id")
      .single();
    if (threadError || !thread) return null;
    const threadId = (thread as { id: string }).id;

    const { error: messageError } = await admin.from("support_messages").insert({
      thread_id: threadId,
      sender_id: input.userId,
      sender_type: "customer",
      body: `[Escalated from Henry Onyx Intelligence]\n\n${input.lastUserText}`,
    } as never);
    if (messageError) {
      // Roll the thread back so the queue never shows an empty ticket.
      await admin.from("support_threads").delete().eq("id", threadId).eq("user_id", input.userId);
      return null;
    }

    // Best-effort customer notification (staff see it via the queue regardless).
    try {
      await publishNotification({
        userId: input.userId,
        division: isNotificationDivision(input.division) ? (input.division as never) : "account",
        eventType: "support.thread.created",
        severity: "urgent",
        title: "We've brought in the team",
        body: "A Henry Onyx specialist will pick up your conversation shortly.",
        deepLink: `/support/${threadId}`,
        relatedType: "support_thread",
        relatedId: threadId,
        publisher: "intelligence-live",
      });
    } catch {
      /* notification is a nicety; the thread already exists for staff */
    }

    return threadId;
  } catch {
    return null;
  }
}

function deriveSubject(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "Support request from Henry Onyx Intelligence";
  return trimmed.length > 80 ? `${trimmed.slice(0, 77)}…` : trimmed;
}

function isNotificationDivision(division: string): boolean {
  return ["account", "care", "marketplace", "property", "logistics", "jobs", "learn", "studio", "hub"].includes(division);
}
