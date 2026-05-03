import "server-only";

import { redirect } from "next/navigation";
import { getStudioLoginUrl } from "@/lib/studio/links";
import { getStudioViewer } from "@/lib/studio/auth";
import type { ClientPortalViewer } from "@/types/portal";

export async function getClientPortalViewer(): Promise<ClientPortalViewer | null> {
  const viewer = await getStudioViewer();
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
