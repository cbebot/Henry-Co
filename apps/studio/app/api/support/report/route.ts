import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { appendSupportMessage } from "@/lib/studio/shared-account";

export const runtime = "nodejs";

const ALLOWED_ROLES = new Set([
  "studio_owner",
  "client_success",
  "owner",
  "support",
]);

/**
 * Staff-side "flag thread for review" action.
 *
 * Promotes the thread to `priority: high` (so it lands at the top of
 * the inbox), stamps an audit trail in `care_security_logs`, and
 * appends a system message. No new table is needed — operations
 * surface flagged threads via the priority pill and audit log.
 *
 * Body: { threadId: string, reason?: string }
 * Response: { ok: true }
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
      reason?: unknown;
    };
    const threadId = String(payload.threadId || "").trim();
    const reason = String(payload.reason || "").trim().slice(0, 500);
    if (!threadId) {
      return NextResponse.json(
        { ok: false, error: "Thread ID required" },
        { status: 400 },
      );
    }

    await admin
      .from("support_threads")
      .update({
        priority: "high",
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", threadId);

    try {
      await admin.from("care_security_logs").insert({
        event_type: "studio_support_thread_reported",
        route: "/api/support/report",
        user_id: user.id,
        email: user.email || null,
        role: "studio_staff",
        success: true,
        details: {
          threadId,
          reason: reason || null,
          source: "support_overflow_menu",
        },
      } as never);
    } catch {
      // Audit log best-effort — priority bump is the load-bearing change.
    }

    try {
      await appendSupportMessage({
        threadId,
        senderId: user.id,
        senderType: "system",
        body: reason
          ? `Thread flagged for review. ${reason}`
          : "Thread flagged for review.",
      });
    } catch {
      // System message best-effort.
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 },
    );
  }
}
