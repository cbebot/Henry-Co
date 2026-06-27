import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { appendSupportMessage } from "@/lib/studio/shared-account";
import { loadStudioThread } from "@/lib/studio/support-threads";

export const runtime = "nodejs";

const ALLOWED_DIVISIONS = new Set([
  "studio",
  "care",
  "jobs",
  "learn",
  "property",
  "logistics",
  "marketplace",
  "account",
  "support",
]);

const ALLOWED_OWNER_ROLES = new Set(["studio_owner", "owner"]);

/**
 * Transfer a support thread to another division.
 *
 * Owner-only — re-categorizing a thread shifts the audience and the
 * notification fanout, so it's not on the staff role's allow-list.
 *
 * Body: { threadId, division, category?, note? }
 * Response: { ok: true, division: string }
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
    if (![...staffRoles].some((r) => ALLOWED_OWNER_ROLES.has(r))) {
      return NextResponse.json(
        { ok: false, error: "Forbidden — owner role required to transfer" },
        { status: 403 },
      );
    }

    const payload = (await request.json().catch(() => ({}))) as {
      threadId?: unknown;
      division?: unknown;
      category?: unknown;
      note?: unknown;
    };
    const threadId = String(payload.threadId || "").trim();
    const division = String(payload.division || "")
      .trim()
      .toLowerCase();
    const category = String(payload.category || "").trim();
    const note = String(payload.note || "").trim().slice(0, 280);
    if (!threadId || !division || !ALLOWED_DIVISIONS.has(division)) {
      return NextResponse.json(
        { ok: false, error: "Valid threadId + division required" },
        { status: 400 },
      );
    }

    // STU-a — the SOURCE thread must be studio-division before we move it.
    // (The TARGET division write below is intentionally unscoped — transfer
    // is precisely the act of re-homing the thread to another division.)
    const existing = await loadStudioThread(admin, threadId);
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Thread not found" },
        { status: 404 },
      );
    }

    const updates: Record<string, unknown> = {
      division,
      updated_at: new Date().toISOString(),
    };
    if (category) updates.category = category;

    await admin
      .from("support_threads")
      .update(updates as never)
      .eq("id", threadId);

    const transferLine = `Thread transferred from ${existing.division || "(unset)"} to ${division}${
      category ? ` · category: ${category}` : ""
    }${note ? `. Note: ${note}` : ""}.`;

    try {
      await appendSupportMessage({
        threadId,
        senderId: user.id,
        senderType: "system",
        body: transferLine,
      });
    } catch {
      // System message is best-effort — actual division flip is durable.
    }

    return NextResponse.json({ ok: true, division });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 },
    );
  }
}
