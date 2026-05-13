import { NextResponse } from "next/server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * PASS 24 — best-effort mark-read for the studio support surface.
 *
 * The MessageThread engine fires this on mount and after each incoming
 * realtime message so the "Read" status moment lands quickly. For studio
 * staff there's no per-staff read-state column in support_threads, so we
 * stamp the thread's `last_seen_by_staff_at` column when it exists and
 * fall through cleanly when it doesn't — the engine never blocks the UI
 * on this, and the next page mount recomputes from server-rendered data.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    let threadId = "";
    const contentType = request.headers.get("content-type") || "";
    if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const formData = await request.formData();
      threadId = String(
        formData.get("threadId") || formData.get("thread_id") || "",
      );
    } else {
      const payload = await request.json().catch(() => ({}));
      threadId = String(payload.threadId || payload.thread_id || "");
    }
    if (!threadId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const admin = createAdminSupabase();
    // The optional `last_seen_by_staff_at` column lets staff dashboards
    // surface unread counts. If it's not deployed, the update is a no-op
    // and the engine continues to work correctly.
    try {
      await admin
        .from("support_threads")
        .update({ last_seen_by_staff_at: new Date().toISOString() } as never)
        .eq("id", threadId);
    } catch {
      // Column may not exist on every environment. Best-effort.
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
