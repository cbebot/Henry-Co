import "server-only";

import { publishNotification, publishStaffNotification } from "@henryco/notifications";
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

/**
 * Persist a completed PAID deep-work result into the conversation (L4) — one assistant message
 * carrying the output, tagged with the capability. Best-effort and ownership-checked: a
 * client-supplied conversationId is only written to when it belongs to this user; otherwise the
 * result is stored on a fresh conversation. Never throws (the person already has their answer).
 */
export async function persistDeepResult(input: {
  conversationId: string | null;
  userId: string;
  division: string;
  capability: { key: string; title: string };
  output: string;
}): Promise<void> {
  const division = DIVISIONS.has(input.division) ? input.division : "account";
  try {
    const admin = createAdminSupabase();

    let conversationId: string | null = null;
    if (input.conversationId) {
      const { data } = await admin
        .from("intelligence_conversations")
        .select("id, user_id")
        .eq("id", input.conversationId)
        .maybeSingle();
      const row = data as { id: string; user_id: string | null } | null;
      if (row && row.user_id === input.userId) conversationId = row.id;
    }
    if (!conversationId) {
      const { data } = await admin
        .from("intelligence_conversations")
        .insert({ user_id: input.userId, session_id: `deep:${input.userId}`, division, status: "active" } as never)
        .select("id")
        .single();
      conversationId = (data as { id: string } | null)?.id ?? null;
    }
    if (!conversationId) return;

    await admin
      .from("intelligence_conversations")
      .update({ last_message_at: new Date().toISOString() } as never)
      .eq("id", conversationId);
    // A light provenance header so the owner console can tell a paid result from free support
    // without a schema change (the deep result is otherwise just the output).
    await admin.from("intelligence_messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: `[${input.capability.title}]\n\n${input.output}`,
      navigate: [],
      handoff: false,
    } as never);
  } catch {
    /* best-effort */
  }
}

export async function persistIntelligenceTurn(input: PersistInput): Promise<PersistResult> {
  const division = DIVISIONS.has(input.division) ? input.division : "account";
  try {
    const admin = createAdminSupabase();
    const status = input.turn.handoff ? "escalated" : "active";

    // 1) Ensure the conversation of record. The conversationId is CLIENT-SUPPLIED and every
    //    write here is service-role (RLS bypassed), so we must verify ownership before we
    //    touch it — otherwise a caller could append turns to, or escalate, someone else's
    //    conversation (IDOR). A signed-in person owns rows with their user_id; an anonymous
    //    visitor owns rows with a null user_id AND their own session_id. If a supplied id is
    //    not theirs (or is gone), we silently start a FRESH conversation — never write across.
    let conversationId: string | null = null;
    let escalatedThreadId: string | null = null;
    let priorStatus: string | null = null;
    if (input.conversationId) {
      const { data } = await admin
        .from("intelligence_conversations")
        .select("id, user_id, session_id, escalated_thread_id, status")
        .eq("id", input.conversationId)
        .maybeSingle();
      const row = data as
        | {
            id: string;
            user_id: string | null;
            session_id: string;
            escalated_thread_id: string | null;
            status: string | null;
          }
        | null;
      const owns = row
        ? input.userId
          ? row.user_id === input.userId
          : row.user_id === null && row.session_id === input.sessionId
        : false;
      if (row && owns) {
        conversationId = row.id;
        escalatedThreadId = row.escalated_thread_id;
        priorStatus = row.status;
        await admin
          .from("intelligence_conversations")
          .update({ status, last_message_at: new Date().toISOString() } as never)
          .eq("id", conversationId);
      }
    }
    if (!conversationId) {
      const { data } = await admin
        .from("intelligence_conversations")
        .insert({ user_id: input.userId, session_id: input.sessionId, division, status } as never)
        .select("id")
        .single();
      conversationId = (data as { id: string } | null)?.id ?? null;
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
        // The owner's bell rings: a customer asked for a live person.
        await alertOwnersOfHandoff(admin, {
          division,
          subject: deriveSubject(input.lastUserText),
          conversationId,
          threadId,
          anonymous: false,
        });
      }
    } else if (input.turn.handoff && !input.userId && priorStatus !== "escalated") {
      // Anonymous visitor asked for a live person. No support thread can be
      // forged (no auth user), but the OWNER still gets the alert with the
      // conversation pointer — previously an anonymous plea went nowhere a
      // human would see. Fires only on the transition into "escalated".
      await alertOwnersOfHandoff(admin, {
        division,
        subject: deriveSubject(input.lastUserText),
        conversationId,
        threadId: null,
        anonymous: true,
      });
    }

    return { conversationId, assistantMessageId: (assistantRow as { id: string } | null)?.id ?? null };
  } catch {
    // Best-effort: never let a persistence problem surface to the person.
    return { conversationId: input.conversationId, assistantMessageId: null };
  }
}

type Admin = ReturnType<typeof createAdminSupabase>;

/**
 * Ring the owner's bell: a customer (signed-in or anonymous) asked the AI for
 * a live person. Targeted directly at each ACTIVE owner_profiles user (direct
 * userId targeting — no dependency on role-RLS semantics), riding the staff
 * notification spine the owner console's bell already subscribes to.
 * Best-effort by contract: an alert failure never disturbs the customer turn.
 */
async function alertOwnersOfHandoff(
  admin: Admin,
  input: {
    division: string;
    subject: string;
    conversationId: string;
    threadId: string | null;
    anonymous: boolean;
  },
): Promise<void> {
  try {
    const { data } = await admin
      .from("owner_profiles")
      .select("user_id")
      .eq("is_active", true)
      .limit(5);
    const ownerIds = ((data ?? []) as Array<{ user_id: string | null }>)
      .map((row) => row.user_id)
      .filter((id): id is string => Boolean(id));
    if (ownerIds.length === 0) return;

    const deepLink = input.threadId
      ? `/owner/support?thread=${input.threadId}`
      : `/owner/support?conversation=${input.conversationId}`;

    await Promise.all(
      ownerIds.map((ownerId) =>
        publishStaffNotification({
          division: (DIVISIONS.has(input.division) ? input.division : "account") as never,
          recipient: { userId: ownerId },
          eventType: "staff.support.handoff.requested",
          severity: "urgent",
          title: input.anonymous
            ? "An anonymous visitor needs a live person"
            : "A customer needs a live person",
          body: `${input.division} · ${input.subject}`,
          deepLink,
          actionLabel: "Open support command",
          payload: {
            conversationId: input.conversationId,
            ...(input.threadId ? { threadId: input.threadId } : {}),
            division: input.division,
          },
          relatedId: input.threadId ?? input.conversationId,
          relatedType: input.threadId ? "support_thread" : "intelligence_conversation",
          publisher: "intelligence-live",
        }).catch(() => undefined),
      ),
    );
  } catch {
    /* the customer's turn already succeeded; the alert is a relay, not a gate */
  }
}

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
