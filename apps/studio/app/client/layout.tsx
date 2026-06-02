import { headers } from "next/headers";
import { Sparkles } from "lucide-react";
import {
  WorkspaceShell,
  type WorkspaceBrand,
  type WorkspaceViewer,
} from "@henryco/workspace-shell";
import { NotificationsToastViewport } from "@henryco/dashboard-shell";
import { createSupabaseServer } from "@/lib/supabase/server";
import { resolveViewerContext } from "@/lib/messaging/queries";
import { NotificationToast } from "@/components/messaging";
import { StudioRealtimeBridge } from "@/components/portal/RealtimeBrowserBridge";
import { requireClientPortalViewer } from "@/lib/portal/auth";
import {
  buildAttentionItems,
  getClientPortalSnapshot,
  unreadMessageCount,
} from "@/lib/portal/data";
import { getStudioAccountUrl } from "@/lib/studio/links";
import { portalNavItems, portalMobileNavItems } from "@/lib/portal/navigation";

/** Authenticated portal — never serve a cached unauthenticated render
 * (CHROME-01A FIX 15). All client-portal pages re-evaluate the auth
 * gate on every request. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Routes that opt out of the standard chrome — currently only the
 * messages inbox, which renders a full-bleed thread layout. */
const FULL_TAKEOVER_PREFIXES = ["/client/messages"];

const STUDIO_BRAND: WorkspaceBrand = {
  shortName: "Studio portal",
  kicker: "Henry & Co.",
  href: "/client",
  icon: Sparkles,
};

/**
 * /client workspace layout — composes the shared @henryco/workspace-shell
 * engine. Auth + data fetching stay here in the host; the engine handles
 * sidebar / mobile-header / bottom-nav / takeover branching from typed props.
 */
export default async function StudioClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await requireClientPortalViewer("/client");
  const subscriptions = await resolveViewerProjectSubscriptions();
  const pathname = await currentPathname();

  const snapshot = await getClientPortalSnapshot(viewer);
  const attentionCount = buildAttentionItems(snapshot).length;
  const unreadCount = unreadMessageCount(snapshot);
  const outstandingInvoices = snapshot.invoices.filter(
    (invoice) => invoice.status === "sent" || invoice.status === "overdue",
  ).length;
  const accountUrl = getStudioAccountUrl();

  const shellViewer: WorkspaceViewer = {
    fullName: viewer.fullName,
    email: viewer.email,
    avatarUrl: viewer.avatarUrl,
  };

  const badges = {
    "/client/messages": unreadCount,
    "/client/payments": outstandingInvoices,
    "/client/notifications": attentionCount,
  };

  return (
    <StudioRealtimeBridge viewer={viewer}>
      <WorkspaceShell
        division="studio"
        brand={STUDIO_BRAND}
        viewer={shellViewer}
        navigation={portalNavItems}
        mobileNavigation={portalMobileNavItems}
        badges={badges}
        attentionCount={attentionCount}
        notificationsHref="/client/notifications"
        profileHref="/client/profile"
        accountSettingsUrl={accountUrl}
        takeoverPrefixes={FULL_TAKEOVER_PREFIXES}
        pathname={pathname}
      >
        {children}
      </WorkspaceShell>

      {/* Cross-division customer-notifications toast — fires when a row
       * lands in customer_notifications for this viewer (orders, system
       * updates, invoice emails, etc). The studio-specific
       * NotificationToast below stays for now and covers project-direct
       * postgres_changes (project messages + updates), which the
       * cross-division spine doesn't see yet. */}
      <NotificationsToastViewport audience="customer" />

      {subscriptions.viewerId ? (
        <NotificationToast
          viewerId={subscriptions.viewerId}
          projectSubscriptions={subscriptions.projects}
          hrefTemplate="/client/projects/{projectId}/messages"
        />
      ) : null}
    </StudioRealtimeBridge>
  );
}

async function currentPathname(): Promise<string> {
  // proxy.ts stamps x-pathname on every request; we also fall back to
  // the canonical Next.js header keys defensively.
  try {
    const headerStore = await headers();
    return (
      headerStore.get("x-pathname") ||
      headerStore.get("x-invoke-path") ||
      headerStore.get("next-url") ||
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
      projects: (result.data as Array<{ id: string; title: string }>).map((row) => ({
        projectId: row.id,
        projectTitle: row.title,
      })),
    };
  } catch {
    return { viewerId: null, projects: [] };
  }
}
