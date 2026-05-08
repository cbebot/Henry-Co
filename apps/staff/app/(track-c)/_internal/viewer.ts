import "server-only";

import { redirect } from "next/navigation";
import { getAccountUrl } from "@henryco/config";
import {
  buildUnifiedViewer,
  getViewerRoles,
} from "@henryco/auth/server";
import type { StaffViewer } from "@henryco/auth/staff";
import { createStaffSupabaseServer } from "@/lib/supabase/server";

/**
 * apps/staff/(track-c)/_internal/viewer — Track C entry helper.
 *
 * Composes the host-app's authenticated supabase client with the
 * unified viewer + staff gate. Returns a StaffViewer for layout/page
 * consumption; redirects to the unified login page if the viewer
 * lacks any staff access.
 *
 * The shell calls this once per render in (track-c)/layout.tsx; pages
 * receive the viewer via prop drilling rather than re-calling.
 */
export async function requireTrackCStaffViewer(): Promise<StaffViewer> {
  const supabase = await createStaffSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(getAccountUrl("/login?role=staff&next=/"));
  }

  const unified = await buildUnifiedViewer({
    id: user.id,
    email: user.email ?? null,
    fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
    avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
    app_metadata: user.app_metadata,
    user_metadata: user.user_metadata,
  });

  const roles = await getViewerRoles(unified);
  if (!roles.hasStaffAccess) {
    redirect(getAccountUrl("/login?role=staff&next=/"));
  }

  return { ...unified, staffMemberships: roles.staffMemberships };
}
