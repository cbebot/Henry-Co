import { NextResponse, type NextRequest } from "next/server";

import { requireOwner } from "@/app/lib/owner-auth";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * GET /api/owner/intelligence/conversations — Founder Intelligence reads (OCC-2).
 *
 * The founder desktop dock restores the owner's conversation across reloads —
 * turns already persist server-side (persistFounderTurn), but until now there
 * was NO read path. Two modes:
 *
 *   GET  …/conversations           → the owner's latest conversations (id,
 *                                    title, timestamps), newest first.
 *   GET  …/conversations?id=<uuid> → the full transcript of ONE conversation,
 *                                    ownership-verified before any row leaves.
 *
 * Access model mirrors the chat route exactly: flag-dark ⇒ 404, non-owner ⇒
 * 404 (indistinguishable), requireOwner BEFORE any read, service-role reads
 * against the deny-RLS founder_intelligence_* pair scoped to auth.user.id.
 */
export async function GET(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_FOUNDER_INTELLIGENCE_LIVE !== "1") {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const auth = await requireOwner();
  if (!auth.ok) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const admin = createAdminSupabase();
  const id = request.nextUrl.searchParams.get("id");

  if (id) {
    // IDOR discipline (PR #389 lesson): verify the row belongs to THIS owner
    // before reading a single message.
    const { data: conversation } = await admin
      .from("founder_intelligence_conversations")
      .select("id, user_id, title")
      .eq("id", id)
      .maybeSingle();
    const row = conversation as { id: string; user_id: string; title: string | null } | null;
    if (!row || row.user_id !== auth.user.id) {
      return NextResponse.json({ error: "Not available." }, { status: 404 });
    }

    const { data: messages, error } = await admin
      .from("founder_intelligence_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", row.id)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) {
      return NextResponse.json({ error: "Please try again." }, { status: 502 });
    }

    return NextResponse.json({
      conversation: { id: row.id, title: row.title },
      messages: ((messages ?? []) as Array<{ id: string; role: string; content: string; created_at: string }>).map(
        (m) => ({
          id: m.id,
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
          createdAt: m.created_at,
        }),
      ),
    });
  }

  const { data: list, error } = await admin
    .from("founder_intelligence_conversations")
    .select("id, title, created_at, updated_at")
    .eq("user_id", auth.user.id)
    .order("updated_at", { ascending: false })
    .limit(20);
  if (error) {
    return NextResponse.json({ error: "Please try again." }, { status: 502 });
  }

  return NextResponse.json({
    conversations: ((list ?? []) as Array<{ id: string; title: string | null; created_at: string; updated_at: string }>).map(
      (c) => ({ id: c.id, title: c.title, createdAt: c.created_at, updatedAt: c.updated_at }),
    ),
  });
}
