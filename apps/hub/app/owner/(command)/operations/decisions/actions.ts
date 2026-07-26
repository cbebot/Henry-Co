"use server";

/**
 * SA-4 — decisions-inbox server actions. Dismiss clears a pending operator
 * proposal WITHOUT executing anything (CAS pending→expired, owner-scoped); the
 * confirm path is the existing reauth-gated
 * /api/owner/intelligence/actions/confirm route — never duplicated here.
 */

import { requireOwner } from "@/app/lib/owner-auth";
import { createAdminSupabase } from "@/lib/supabase";

export async function dismissOperatorProposalAction(input: {
  token: string;
}): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireOwner();
  if (!auth.ok) return { ok: false, error: "not_authorized" };
  const token = String(input.token ?? "").trim();
  if (!token) return { ok: false, error: "missing_token" };

  try {
    const admin = createAdminSupabase();
    // CAS on pending + owner-scoped: a double-tap or a foreign token no-ops.
    const { data, error } = await admin
      .from("founder_action_proposals")
      .update({ status: "expired", resolved_at: new Date().toISOString() } as never)
      .eq("token", token)
      .eq("user_id", auth.user.id)
      .eq("origin", "operator")
      .eq("status", "pending")
      .select("token")
      .maybeSingle();
    if (error || !data) return { ok: false, error: "already_resolved" };
    return { ok: true };
  } catch {
    return { ok: false, error: "failed" };
  }
}
