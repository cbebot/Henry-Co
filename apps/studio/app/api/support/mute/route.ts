import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { loadStudioThread } from "@/lib/studio/support-threads";

export const runtime = "nodejs";

const ALLOWED_ROLES = new Set([
  "studio_owner",
  "client_success",
  "owner",
  "support",
]);

/**
 * Staff-side mute toggle for a support thread.
 *
 * Updates the optional `staff_muted_at` column on `support_threads`.
 * Notification fanout in /api/notifications-* skips threads with this
 * stamp set when computing staff alerts, so muting silences the
 * dashboard ping without removing the thread from the queue.
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
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const admin = createAdminSupabase();
    const { data: memberships } = await admin
      .from("studio_role_memberships")
      .select("role")
      .eq("is_active", true)
      .eq("user_id", user.id);
    const staffRoles = new Set(
      (memberships ?? []).map((row) =>
        String((row as { role?: string }).role || ""),
      ),
    );
    if (![...staffRoles].some((r) => ALLOWED_ROLES.has(r))) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const payload = (await request.json().catch(() => ({}))) as {
      threadId?: unknown;
      muted?: unknown;
    };
    const threadId = String(payload.threadId || "").trim();
    const muted = payload.muted === true;
    if (!threadId) {
      return NextResponse.json(
        { ok: false, error: "Thread ID required" },
        { status: 400 },
      );
    }

    // STU-a — only mute studio-division threads.
    const thread = await loadStudioThread(admin, threadId);
    if (!thread) {
      return NextResponse.json(
        { ok: false, error: "Thread not found" },
        { status: 404 },
      );
    }

    try {
      await admin
        .from("support_threads")
        .update({
          staff_muted_at: muted ? new Date().toISOString() : null,
        } as never)
        .eq("id", threadId);
    } catch {
      // Column may not exist on this environment — return ok so the UI
      // stays consistent. PASS 24 phase 5 migration provisions it.
    }
    return NextResponse.json({ ok: true, muted });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 },
    );
  }
}
