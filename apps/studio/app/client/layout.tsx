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
  kicker: "Henry Onyx",
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
      {/* V3-INNER-L-STUDIO — the client portal runs on Register L: the shared
          light-primary, theme-aware Henry Onyx dashboard system. The
          .studio-workspace-light scope (app/globals.css) re-grounds the studio
          tokens on the light register + the configured teal accent and re-tones
          the shared WorkspaceShell + the studio/portal utilities. Dark is the
          device-preference flip, not the default — the forced-dark client-portal
          defect is gone here. V3-INNER-L-STUDIO-TAIL folded the realtime
          messages centre into the scope too (its --studio-thread-* tokens carry
          the near-black chat under .dark and an AA light register under light),
          so the whole customer portal is one register with no dark room. */}
      <div className="studio-workspace-light">
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

        {/* The studio project-message toast lives INSIDE the scope so its
         * --studio-thread-* tokens resolve theme-correctly (it is position:fixed,
         * so nesting doesn't move it). Covers project-direct postgres_changes
         * (messages + updates) the cross-division spine doesn't see yet. */}
        {subscriptions.viewerId ? (
          <NotificationToast
            viewerId={subscriptions.viewerId}
            projectSubscriptions={subscriptions.projects}
            hrefTemplate="/client/projects/{projectId}/messages"
          />
        ) : null}
      </div>

      {/* Cross-division customer-notifications toast — fires when a row
       * lands in customer_notifications for this viewer (orders, system
       * updates, invoice emails, etc). Has its own theming; stays outside. */}
      <NotificationsToastViewport audience="customer" />
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
