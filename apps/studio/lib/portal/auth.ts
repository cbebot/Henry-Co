import "server-only";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { getStudioLoginUrl } from "@/lib/studio/links";
import { getStudioViewer } from "@/lib/studio/auth";
import type { ClientPortalViewer } from "@/types/portal";

export async function getClientPortalViewer(): Promise<ClientPortalViewer | null> {
  let viewer: Awaited<ReturnType<typeof getStudioViewer>>;
  try {
    viewer = await getStudioViewer();
  } catch (error) {
    /** Defensive: if the studio viewer cannot be resolved (missing env,
     * Supabase outage, etc.), treat the visitor as unauthenticated. The
     * caller will issue a 307 to the login URL — never a 200 with the
     * dashboard rendered. CHROME-01A audit caught a soft 200 on this
     * route which was traced to upstream errors leaking into render. */
    if (isRedirectError(error)) throw error;
    return null;
  }
  if (!viewer.user) return null;

  return {
    userId: viewer.user.id,
    email: viewer.user.email,
    fullName: viewer.user.fullName,
    avatarUrl: viewer.user.avatarUrl ?? null,
    normalizedEmail: viewer.normalizedEmail,
  };
}

export async function requireClientPortalViewer(nextPath: string): Promise<ClientPortalViewer> {
  const viewer = await getClientPortalViewer();
  if (!viewer) {
    redirect(getStudioLoginUrl(nextPath));
  }
  return viewer;
}
