import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { markSupportThreadRead } from "@/lib/account-data";

/**
 * Marks a support thread as read by the authenticated customer.
 * Called by the MessageThread engine on mount + after each incoming
 * realtime message. Fire-and-forget — never blocks the UI thread.
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
    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      threadId = String(formData.get("threadId") || formData.get("thread_id") || "");
    } else {
      const payload = await request.json().catch(() => ({}));
      threadId = String(payload.threadId || payload.thread_id || "");
    }

    if (!threadId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await markSupportThreadRead(user.id, threadId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
