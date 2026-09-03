import "server-only";

/**
 * V3-40 — the acting-staff resolver for risk enforcement server actions.
 *
 * Server actions cannot rely on the page-level role gate alone (a direct POST
 * bypasses rendering) — every risk action re-derives the caller's roles here and
 * throws unless the caller holds security-division staff access (owner/admin/
 * superadmin via the legacy mapping — the TS mirror of `is_staff_in('security')`).
 * The returned id is the actor of record on every enforcement row.
 */

import { buildUnifiedViewer, getViewerRoles } from "@henryco/auth/server";
import { hasStaffAccessIn } from "@henryco/auth/staff";
import { createStaffSupabaseServer } from "@/lib/supabase/server";

export interface SecurityStaffActor {
  userId: string;
  hasOwnerAccess: boolean;
}

export async function requireSecurityStaffActor(): Promise<SecurityStaffActor> {
  const supabase = await createStaffSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  const unified = await buildUnifiedViewer({
    id: user.id,
    email: user.email ?? null,
    fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
    avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
    app_metadata: user.app_metadata,
    user_metadata: user.user_metadata,
  });
  const roles = await getViewerRoles(unified);
  if (!hasStaffAccessIn({ staffMemberships: roles.staffMemberships }, "security")) {
    throw new Error("Security staff access required.");
  }
  return { userId: user.id, hasOwnerAccess: roles.hasOwnerAccess };
}
