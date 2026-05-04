import { createSupabaseServer } from "@/lib/supabase/server";
import { resolveViewerContext } from "@/lib/messaging/queries";
import { NotificationToast } from "@/components/messaging";
import { requireClientPortalViewer } from "@/lib/portal/auth";

/** Authenticated portal — never serve a cached unauthenticated render
 * (CHROME-01A FIX 15). All client-portal pages re-evaluate the auth
 * gate on every request. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * STUDIO-MSG-01: client-section layout mounts the system-level
 * notification toast so an inbound message surfaces from any portal
 * page (dashboard, files, payments, projects). The toast subscribes
 * to all projects the viewer participates in.
 *
 * STUDIO-CP-01 will likely wrap this layout in the portal shell
 * (sidebar, header). When that lands, this layout becomes the inner
 * wrapper that mounts cross-page system overlays.
 *
 * CHROME-01A: also enforces the client-portal auth gate at the layout
 * level so every nested route (dashboard, files, projects, payments,
 * profile, messages, proposals, reviews) returns a server-side redirect
 * to the shared account login when the viewer is unauthenticated.
 * Without this, a portal page that forgets to call the gate would
 * render server-side as 200.
 */
export default async function StudioClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireClientPortalViewer("/client");
  const subscriptions = await resolveViewerProjectSubscriptions();

  return (
    <>
      {children}
      {subscriptions.viewerId ? (
        <NotificationToast
          viewerId={subscriptions.viewerId}
          projectSubscriptions={subscriptions.projects}
          hrefForProject={(projectId) =>
            `/client/projects/${projectId}/messages`
          }
        />
      ) : null}
    </>
  );
}

async function resolveViewerProjectSubscriptions(): Promise<{
  viewerId: string | null;
  projects: Array<{ projectId: string; projectTitle: string }>;
}> {
  try {
    const supabase = await createSupabaseServer();
    const viewer = await resolveViewerContext(supabase);
    if (!viewer.userId) {
      return { viewerId: null, projects: [] };
    }
    const result = await supabase
      .from("studio_projects")
      .select("id, title")
      .order("updated_at", { ascending: false })
      .limit(20);
    if (!Array.isArray(result.data)) {
      return { viewerId: viewer.userId, projects: [] };
    }
    return {
      viewerId: viewer.userId,
      projects: (result.data as Array<{ id: string; title: string }>).map(
        (row) => ({
          projectId: row.id,
          projectTitle: row.title,
        }),
      ),
    };
  } catch {
    return { viewerId: null, projects: [] };
  }
}
