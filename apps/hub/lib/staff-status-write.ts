import "server-only";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * THE staff suspend/reactivate write path — extracted from
 * toggleStaffMemberStatusAction (F3, 2026-07-10) so the founder action rail
 * executes through the EXACT same sequence the human console uses: the auth
 * ban flip + the staff audit row + surface revalidation. One path, two callers.
 *
 * CALLERS MUST AUTHORIZE FIRST (requireOwner) and pass the resolved actor —
 * this module deliberately does not gate or resolve identity itself.
 */
export async function applyStaffStatusToggle(input: {
  userId: string;
  intent: "suspend" | "reactivate";
  actorId: string;
  actorRole: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminSupabase();

  const result = await admin.auth.admin.updateUserById(input.userId, {
    ban_duration: input.intent === "suspend" ? "876000h" : "none",
  });
  if (result.error) {
    console.error("[staff-status-write]", result.error);
    return { ok: false, error: "Could not change this account's status right now." };
  }

  // The ban flip above is the point of no return. Audit + revalidate are
  // best-effort and must never flip a landed change to a failure.
  try {
    const { error } = await admin.from("staff_audit_logs").insert({
      actor_id: input.actorId,
      actor_role: input.actorRole || "owner",
      action: input.intent === "suspend" ? "staff.suspend" : "staff.reactivate",
      entity: "staff",
      entity_id: input.userId,
      meta: {},
    } as never);
    if (error) {
      console.error("[staff-status-write] staff_audit_logs insert failed", error.message);
    }
    revalidatePath("/owner/staff");
    revalidatePath("/owner/staff/directory");
    revalidatePath("/owner");
  } catch (e) {
    console.error("[staff-status-write] post-write step failed (status change landed)", e);
  }

  return { ok: true };
}

/** The account's live ban state — the F3 true-state reader. */
export async function readStaffStatus(userId: string): Promise<{
  userId: string;
  email: string | null;
  bannedUntil: string | null;
  suspended: boolean;
} | null> {
  const admin = createAdminSupabase();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data?.user) return null;
  const bannedUntil =
    (data.user as unknown as { banned_until?: string | null }).banned_until ?? null;
  const suspended = Boolean(bannedUntil && new Date(bannedUntil).getTime() > Date.now());
  return { userId, email: data.user.email ?? null, bannedUntil, suspended };
}
