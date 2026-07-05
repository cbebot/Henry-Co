import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

/**
 * Intelligence Live L2 — the owner's window. Reads every Henry Onyx Intelligence conversation
 * across the ecosystem via the service role (like the support queue), so the owner can see all
 * chats, with escalations surfaced first. Missing-table-safe: before the L1 migration is applied
 * it simply returns an empty console rather than erroring.
 */

export type IntelligenceConsoleRow = {
  id: string;
  division: string;
  status: string;
  signedIn: boolean;
  escalated: boolean;
  lastMessageAt: string | null;
  createdAt: string | null;
  preview: string;
  messageCount: number;
};

export type IntelligenceConsole = {
  conversations: IntelligenceConsoleRow[];
  total: number;
  escalatedCount: number;
  available: boolean;
};

const EMPTY: IntelligenceConsole = { conversations: [], total: 0, escalatedCount: 0, available: false };
const PREVIEW_MAX = 140;

function isMissingRelation(error: { code?: string } | null): boolean {
  return error?.code === "42P01"; // undefined_table — the migration is not applied yet
}

export async function getIntelligenceConsole(limit = 100): Promise<IntelligenceConsole> {
  try {
    const admin = createAdminSupabase();
    const { data: convData, error: convError } = await admin
      .from("intelligence_conversations")
      .select("id, user_id, division, status, escalated_thread_id, created_at, last_message_at")
      .order("last_message_at", { ascending: false })
      .limit(limit);
    if (convError) {
      if (isMissingRelation(convError)) return EMPTY;
      throw convError;
    }

    const rows = (convData ?? []) as Array<{
      id: string;
      user_id: string | null;
      division: string;
      status: string;
      escalated_thread_id: string | null;
      created_at: string | null;
      last_message_at: string | null;
    }>;
    if (rows.length === 0) return { conversations: [], total: 0, escalatedCount: 0, available: true };

    // One extra query for the messages of these conversations; bucket the latest + count per id.
    const ids = rows.map((r) => r.id);
    const { data: msgData } = await admin
      .from("intelligence_messages")
      .select("conversation_id, role, content, created_at")
      .in("conversation_id", ids)
      .order("created_at", { ascending: false });
    const messages = (msgData ?? []) as Array<{ conversation_id: string; role: string; content: string; created_at: string }>;

    const latest = new Map<string, string>();
    const counts = new Map<string, number>();
    for (const m of messages) {
      counts.set(m.conversation_id, (counts.get(m.conversation_id) ?? 0) + 1);
      if (!latest.has(m.conversation_id)) latest.set(m.conversation_id, m.content); // first seen = newest (desc order)
    }

    const conversations: IntelligenceConsoleRow[] = rows.map((r) => ({
      id: r.id,
      division: r.division,
      status: r.status,
      signedIn: Boolean(r.user_id),
      escalated: r.status === "escalated" || Boolean(r.escalated_thread_id),
      lastMessageAt: r.last_message_at,
      createdAt: r.created_at,
      preview: (latest.get(r.id) ?? "").replace(/\s+/g, " ").trim().slice(0, PREVIEW_MAX),
      messageCount: counts.get(r.id) ?? 0,
    }));

    // Escalations first, then most-recent activity.
    conversations.sort((a, b) => {
      if (a.escalated !== b.escalated) return a.escalated ? -1 : 1;
      return (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? "");
    });

    return {
      conversations,
      total: conversations.length,
      escalatedCount: conversations.filter((c) => c.escalated).length,
      available: true,
    };
  } catch {
    return EMPTY;
  }
}
