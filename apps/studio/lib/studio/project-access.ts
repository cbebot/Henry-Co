/**
 * V3-73 — Studio Project Suite: server-side client/business ownership check.
 *
 * A project is accessible to a client when they are the project's client
 * (by user id or normalized email) OR an active member of the linked V3-57
 * business (`studio_projects.client_business_id`). Used by the deliverable
 * revision + asset-unlock routes which write/read via the service-role admin
 * client and therefore MUST re-verify ownership in code (RLS is bypassed).
 */
import type { createAdminSupabase } from "@/lib/supabase";

type AdminClient = ReturnType<typeof createAdminSupabase>;

export type ProjectOwnerRow = {
  id: string;
  client_user_id: string | null;
  normalized_email: string | null;
  client_business_id: string | null;
};

export const PROJECT_OWNER_COLUMNS = "id, client_user_id, normalized_email, client_business_id";

export async function clientOwnsProject(
  admin: AdminClient,
  project: ProjectOwnerRow,
  viewerId: string,
  viewerEmail: string | null,
): Promise<boolean> {
  if (project.client_user_id && project.client_user_id === viewerId) return true;
  if (
    project.normalized_email &&
    viewerEmail &&
    project.normalized_email.toLowerCase() === viewerEmail.toLowerCase()
  ) {
    return true;
  }
  if (project.client_business_id) {
    const { data: membership } = await admin
      .from("business_members")
      .select("user_id")
      .eq("business_id", project.client_business_id)
      .eq("user_id", viewerId)
      .maybeSingle<{ user_id: string }>();
    if (membership) return true;
  }
  return false;
}
