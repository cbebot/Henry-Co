import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { appendSupportMessage } from "@/lib/studio/shared-account";
import { loadStudioThread } from "@/lib/studio/support-threads";

export const runtime = "nodejs";

const ALLOWED_ROLES = new Set([
  "studio_owner",
  "client_success",
  "owner",
  "support",
]);

const ALLOWED_ACTIONS = new Set(["resolve", "reopen"]);

/**
 * Staff-side status transitions for a support thread.
 *
 * Two actions today, both restricted to studio_owner / client_success:
 *   * "resolve" — flips `status` to "resolved" and appends a system
 *     message so the conversation timeline shows the transition.
 *   * "reopen"  — flips `status` back to "open" and appends a system
 *     message.
 *
 * Body: { action: "resolve" | "reopen", threadId: string, note?: string }
 * Response: { ok: true, status: "resolved" | "open" }
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
      action?: unknown;
      threadId?: unknown;
      note?: unknown;
    };
    const action = String(payload.action || "").trim();
    const threadId = String(payload.threadId || "").trim();
    const note = String(payload.note || "").trim().slice(0, 280);
    if (!threadId || !ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json(
        { ok: false, error: "Action and Thread ID required" },
        { status: 400 },
      );
    }

    // STU-a — refuse to transition a thread that isn't studio-division.
    const thread = await loadStudioThread(admin, threadId);
    if (!thread) {
      return NextResponse.json(
        { ok: false, error: "Thread not found" },
        { status: 404 },
      );
    }

    const nextStatus = action === "resolve" ? "resolved" : "open";

    await admin
      .from("support_threads")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", threadId);

    const systemBody =
      action === "resolve"
        ? note
          ? `Thread marked as resolved. ${note}`
          : "Thread marked as resolved."
        : note
          ? `Thread re-opened. ${note}`
          : "Thread re-opened.";

    try {
      await appendSupportMessage({
        threadId,
        senderId: user.id,
        senderType: "system",
        body: systemBody,
      });
    } catch {
      // Already-stamped status is the truth; system-message append is
      // a nice-to-have for the timeline.
    }

    return NextResponse.json({ ok: true, status: nextStatus });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 },
    );
  }
}
