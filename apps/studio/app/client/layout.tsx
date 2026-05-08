import { headers } from "next/headers";
import { createSupabaseServer } from "@/lib/supabase/server";
import { resolveViewerContext } from "@/lib/messaging/queries";
import { NotificationToast } from "@/components/messaging";
import { requireClientPortalViewer } from "@/lib/portal/auth";
import {
  buildAttentionItems,
  getClientPortalSnapshot,
  unreadMessageCount,
} from "@/lib/portal/data";
import { getStudioAccountUrl } from "@/lib/studio/links";
import { PortalSidebar } from "@/components/portal/sidebar";
import { PortalMobileHeader } from "@/components/portal/mobile-header";
import { PortalBottomNav } from "@/components/portal/bottom-nav";

/** Authenticated portal — never serve a cached unauthenticated render
 * (CHROME-01A FIX 15). All client-portal pages re-evaluate the auth
 * gate on every request. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const FULL_TAKEOVER_PREFIXES = ["/client/messages"];

/**
 * /client workspace layout — wraps every client-portal page in the
 * premium portal shell (desktop sidebar + mobile header + bottom nav).
 * One page deliberately opts out: /client/messages renders a full-bleed
 * inbox-and-thread takeover that would only be cluttered by chrome.
 *
 * The shell pre-loads the viewer's portal snapshot once at the layout
 * level so the sidebar can show live unread/outstanding/attention
 * counts without each page re-fetching them.
 */
export default async function StudioClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await requireClientPortalViewer("/client");
  const subscriptions = await resolveViewerProjectSubscriptions();

  const pathname = await currentPathname();
  const isTakeover = FULL_TAKEOVER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isTakeover) {
    return (
      <>
        {children}
        {subscriptions.viewerId ? (
          <NotificationToast
            viewerId={subscriptions.viewerId}
            projectSubscriptions={subscriptions.projects}
            hrefTemplate="/client/projects/{projectId}/messages"
          />
        ) : null}
      </>
    );
  }

  const snapshot = await getClientPortalSnapshot(viewer);
  const attentionCount = buildAttentionItems(snapshot).length;
  const unreadCount = unreadMessageCount(snapshot);
  const outstandingInvoices = snapshot.invoices.filter(
    (invoice) => invoice.status === "sent" || invoice.status === "overdue",
  ).length;
  const accountUrl = getStudioAccountUrl();

  return (
    <div className="flex min-h-[100dvh] bg-[var(--studio-bg)] text-[var(--studio-ink)]">
      <PortalSidebar
        viewer={viewer}
        unreadCount={unreadCount}
        outstandingInvoices={outstandingInvoices}
        attentionCount={attentionCount}
        accountUrl={accountUrl}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <PortalMobileHeader viewer={viewer} attentionCount={attentionCount} />
        <main
          id="henryco-main"
          className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10"
        >
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
        <PortalBottomNav
          unreadCount={unreadCount}
          outstandingInvoices={outstandingInvoices}
        />
      </div>

      {subscriptions.viewerId ? (
        <NotificationToast
          viewerId={subscriptions.viewerId}
          projectSubscriptions={subscriptions.projects}
          hrefTemplate="/client/projects/{projectId}/messages"
        />
      ) : null}
    </div>
  );
}

async function currentPathname(): Promise<string> {
  // next/headers exposes the current request path via the
  // "x-invoke-path" or "next-url" header in app-router server components.
  // We try a couple of common locations and fall back gracefully so the
  // takeover detection never breaks the render.
  try {
    const headerStore = await headers();
    return (
      headerStore.get("x-invoke-path") ||
      headerStore.get("next-url") ||
      headerStore.get("x-pathname") ||
      ""
    );
  } catch {
    return "";
  }
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
