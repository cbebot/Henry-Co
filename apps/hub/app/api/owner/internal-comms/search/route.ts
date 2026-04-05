import { NextResponse } from "next/server";
import { requireOwner } from "@/app/lib/owner-auth";
import { ownerAuthDeniedResponse } from "@/lib/owner-api-auth";
import { createAdminSupabase } from "@/app/lib/supabase-admin";
import {
  INTERNAL_COMMS_UNAVAILABLE,
  isInternalCommsStorageError,
  logInternalCommsError,
} from "@/app/lib/internal-comms-errors";
import {
  assertThreadReadable,
  canReadThreadFast,
  loadThreadAccessContext,
  type ThreadAccessRow,
} from "@/app/lib/internal-comms-access";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const threadFilter = url.searchParams.get("threadId")?.trim() || "";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const safe = q.replace(/[%_\\]/g, "").slice(0, 200);
  const pattern = `%${safe}%`;

  const admin = createAdminSupabase();
  const accessCtx = await loadThreadAccessContext(admin, auth.user.id);

  if (threadFilter) {
    const gate = await assertThreadReadable(admin, auth.user.id, threadFilter, accessCtx);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.message }, { status: gate.status });
    }
  }

  let query = admin
    .from("hq_internal_comm_messages")
    .select("id, thread_id, author_label, body, created_at")
    .ilike("body", pattern)
    .order("created_at", { ascending: false })
    .limit(80);

  if (threadFilter) {
    query = query.eq("thread_id", threadFilter);
  }

  const { data, error } = await query;

  if (error) {
    logInternalCommsError("search", error);
    if (isInternalCommsStorageError(error)) {
      return NextResponse.json({ error: INTERNAL_COMMS_UNAVAILABLE, results: [] }, { status: 503 });
    }
    return NextResponse.json({ error: "Search failed.", results: [] }, { status: 400 });
  }

  const threadsCache = new Map<string, ThreadAccessRow>();
  async function threadFor(id: string) {
    if (threadsCache.has(id)) return threadsCache.get(id)!;
    const { data: t } = await admin
      .from("hq_internal_comm_threads")
      .select("id, slug, kind, title, division, visibility, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();
    const row = (t || null) as ThreadAccessRow | null;
    if (row) threadsCache.set(id, row);
    return row;
  }

  const results = [];
  for (const row of data || []) {
    const tid = String(row.thread_id || "");
    const t = await threadFor(tid);
    if (!t || !canReadThreadFast(t, accessCtx)) continue;
    results.push({
      id: row.id,
      thread_id: tid,
      thread_title: t.title,
      author_label: row.author_label,
      body: row.body,
      created_at: row.created_at,
    });
    if (results.length >= 40) break;
  }

  return NextResponse.json({ results });
}
