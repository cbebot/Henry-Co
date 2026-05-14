import { NextResponse } from "next/server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * PASS 24 — best-effort mark-read for the studio support surface.
 *
 * The MessageThread engine fires this on mount and after each incoming
 * realtime message so the "Read" status moment lands quickly. We stamp
 * `staff_last_read_at` on the support_thread row so staff dashboards
 * can compute unread counts; engine never blocks the UI on this.
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
    await admin
      .from("support_threads")
      .update({ staff_last_read_at: new Date().toISOString() } as never)
      .eq("id", threadId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
