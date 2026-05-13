import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * Customer-side mute toggle for a support thread.
 *
 * Updates the optional `customer_muted_at` column on `support_threads`.
 * The notification fanout in /api/notifications-* skips threads that
 * have this stamp set, so muting a thread silences email + push
 * without removing the thread from the customer's inbox.
 *
 * Body: { threadId: string, muted: boolean }
 * Response: { ok: true, muted: boolean }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json().catch(() => ({}))) as {
      threadId?: unknown;
      muted?: unknown;
    };
    const threadId = String(payload.threadId || "").trim();
    const muted = payload.muted === true;
    if (!threadId) {
      return NextResponse.json({ ok: false, error: "Thread ID required" }, { status: 400 });
    }

    const admin = createAdminSupabase();
    const { data: thread } = await admin
      .from("support_threads")
      .select("id, user_id")
      .eq("id", threadId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!thread) {
      return NextResponse.json({ ok: false, error: "Thread not found" }, { status: 404 });
    }

    // Best-effort — when the `customer_muted_at` column has not yet been
    // migrated on this environment, swallow the error so the engine
    // surfaces "muted" in the menu UI without breaking. The migration
    // (20260513200000_support_thread_state_pass24_phase5.sql) provisions
    // it idempotently.
    try {
      await admin
        .from("support_threads")
        .update({ customer_muted_at: muted ? new Date().toISOString() : null } as never)
        .eq("id", threadId);
    } catch {
      // Column not present — return ok so UI stays optimistic.
    }
    return NextResponse.json({ ok: true, muted });
  } catch {
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
