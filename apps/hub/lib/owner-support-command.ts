import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

/**
 * Owner Support Command — the owner's window into every conversation the
 * company is having: AI intelligence conversations (who is talking to the
 * assistant right now — by NAME, or "Anonymous visitor") and the Onyx Line
 * support threads waiting on a human. This is the data layer behind
 * /owner/support; the reply write path lives in /api/owner/support/reply.
 *
 * Service-role reads (owner-legitimate: the page is requireOwner-gated and
 * this is the command console). Identity resolves through ONE batched
 * customer_profiles lookup across both feeds. Every read is best-effort —
 * a missing table returns an empty panel, never a broken page.
 */

export type OwnerSupportConversation = {
  id: string;
  division: string;
  status: string;
  userLabel: string;
  anonymous: boolean;
  handoff: boolean;
  escalatedThreadId: string | null;
  lastMessage: string;
  lastRole: string;
  lastMessageAt: string | null;
};

export type OwnerSupportThread = {
  id: string;
  subject: string;
  division: string;
  status: string;
  priority: string;
  userLabel: string;
  lastMessage: string;
  lastSenderType: string;
  updatedAt: string | null;
};

type JsonRow = Record<string, unknown>;

const text = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));

export async function getOwnerSupportCommandData(): Promise<{
  conversations: OwnerSupportConversation[];
  threads: OwnerSupportThread[];
  metrics: { openThreads: number; conversations: number; handoffs: number; anonymous: number };
}> {
  const admin = createAdminSupabase();

  const [convRes, threadRes] = await Promise.all([
    admin
      .from("intelligence_conversations")
      .select("id, user_id, division, status, escalated_thread_id, last_message_at")
      .order("last_message_at", { ascending: false })
      .limit(30),
    admin
      .from("support_threads")
      .select("id, user_id, subject, division, status, priority, updated_at")
      .in("status", ["open", "in_progress"])
      .order("updated_at", { ascending: false })
      .limit(30),
  ]);

  const convRows = ((convRes.data ?? []) as JsonRow[]).filter((r) => r.id);
  const threadRows = ((threadRes.data ?? []) as JsonRow[]).filter((r) => r.id);

  // ── One batched identity lookup across both feeds ─────────────────────────
  const userIds = Array.from(
    new Set(
      [...convRows, ...threadRows]
        .map((r) => text(r.user_id))
        .filter(Boolean),
    ),
  );
  const identity = new Map<string, string>();
  if (userIds.length > 0) {
    const { data } = await admin
      .from("customer_profiles")
      .select("id, full_name, email")
      .in("id", userIds);
    for (const p of (data ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>) {
      identity.set(p.id, p.full_name || p.email || "");
    }
  }
  const labelFor = (userId: string, anonymous: boolean): string => {
    if (anonymous) return "Anonymous visitor";
    return identity.get(userId) || `${userId.slice(0, 8)}…`;
  };

  // ── Last message previews (batched per feed) ──────────────────────────────
  const convIds = convRows.map((r) => text(r.id));
  const lastIntelMessage = new Map<string, { content: string; role: string; handoff: boolean }>();
  if (convIds.length > 0) {
    const { data } = await admin
      .from("intelligence_messages")
      .select("conversation_id, role, content, handoff, created_at")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false })
      .limit(200);
    for (const m of (data ?? []) as JsonRow[]) {
      const key = text(m.conversation_id);
      if (!lastIntelMessage.has(key)) {
        lastIntelMessage.set(key, {
          content: text(m.content),
          role: text(m.role),
          handoff: Boolean(m.handoff),
        });
      }
      // Any handoff turn in the window marks the conversation.
      else if (m.handoff) {
        const existing = lastIntelMessage.get(key);
        if (existing && !existing.handoff) lastIntelMessage.set(key, { ...existing, handoff: true });
      }
    }
  }

  const threadIds = threadRows.map((r) => text(r.id));
  const lastThreadMessage = new Map<string, { body: string; senderType: string }>();
  if (threadIds.length > 0) {
    const { data } = await admin
      .from("support_messages")
      .select("thread_id, sender_type, body, created_at")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false })
      .limit(200);
    for (const m of (data ?? []) as JsonRow[]) {
      const key = text(m.thread_id);
      if (!lastThreadMessage.has(key)) {
        lastThreadMessage.set(key, { body: text(m.body), senderType: text(m.sender_type) });
      }
    }
  }

  const conversations: OwnerSupportConversation[] = convRows.map((row) => {
    const id = text(row.id);
    const userId = text(row.user_id);
    const anonymous = !userId;
    const last = lastIntelMessage.get(id);
    return {
      id,
      division: text(row.division) || "account",
      status: text(row.status) || "active",
      userLabel: labelFor(userId, anonymous),
      anonymous,
      handoff: text(row.status) === "escalated" || Boolean(last?.handoff),
      escalatedThreadId: text(row.escalated_thread_id) || null,
      lastMessage: (last?.content ?? "").slice(0, 200),
      lastRole: last?.role ?? "",
      lastMessageAt: text(row.last_message_at) || null,
    };
  });

  const threads: OwnerSupportThread[] = threadRows.map((row) => {
    const id = text(row.id);
    const userId = text(row.user_id);
    const last = lastThreadMessage.get(id);
    return {
      id,
      subject: text(row.subject) || "Support request",
      division: text(row.division) || "account",
      status: text(row.status) || "open",
      priority: text(row.priority) || "normal",
      userLabel: labelFor(userId, !userId),
      lastMessage: (last?.body ?? "").slice(0, 200),
      lastSenderType: last?.senderType ?? "",
      updatedAt: text(row.updated_at) || null,
    };
  });

  return {
    conversations,
    threads,
    metrics: {
      openThreads: threads.length,
      conversations: conversations.length,
      handoffs: conversations.filter((c) => c.handoff).length,
      anonymous: conversations.filter((c) => c.anonymous).length,
    },
  };
}
