import type { WorkspaceShellProps } from "./types";
import { WorkspaceSidebar } from "./sidebar";
import { WorkspaceMobileHeader } from "./mobile-header";
import { WorkspaceBottomNav } from "./bottom-nav";
import { isTakeoverPath } from "./internal";

/**
 * Top-level workspace shell. Composes sidebar (desktop), mobile-header,
 * bottom-nav, and the main content area into a single layout.
 *
 * Server-component compatible. The host's layout.tsx wraps its
 * `{children}` with this and passes:
 *   - division (sets data-workspace-division for token mapping)
 *   - viewer + brand + navigation
 *   - pathname (from x-pathname header stamped by the proxy)
 *   - badges + attentionCount (from snapshot data)
 *   - takeoverPrefixes (routes that opt out of chrome)
 *
 * For takeover routes (eg. /client/messages full-bleed inbox), the shell
 * short-circuits and just renders children with no chrome — the host
 * page is responsible for its own layout there.
 */
export function WorkspaceShell({
  division,
  brand,
  viewer,
  navigation,
  mobileNavigation,
  badges,
  attentionCount,
  notificationsHref,
  profileHref,
  accountSettingsUrl,
  takeoverPrefixes,
  pathname,
  sidebarTopSlot,
  children,
}: WorkspaceShellProps) {
  // Resolve sensible defaults from the navigation array so hosts can pass
  // less and still get a working shell.
  const resolvedNotifHref = notificationsHref ?? navigation[0]?.href ?? "/";
  const resolvedProfileHref =
    profileHref ??
    navigation.find((n) => /profile|settings/i.test(n.label))?.href ??
    navigation[0]?.href ??
    "/";
  const resolvedMobileNav =
    mobileNavigation && mobileNavigation.length > 0
      ? mobileNavigation
      : navigation.slice(0, 5);

  // Takeover: route opts out of chrome (eg. inbox/threads). We still keep
  // the data-workspace-division attribute so children can consume the
  // tokens if they want to.
  if (isTakeoverPath(pathname, takeoverPrefixes)) {
    return (
      <div data-workspace-division={division} className="ws-shell-takeover">
        {children}
      </div>
    );
  }

  return (
    <div data-workspace-division={division} className="ws-shell-root">
      <WorkspaceSidebar
        brand={brand}
        viewer={viewer}
        navigation={navigation}
        badges={badges}
        attentionCount={attentionCount}
        pathname={pathname}
        accountSettingsUrl={accountSettingsUrl}
        topSlot={sidebarTopSlot}
      />

      <div className="ws-shell-body">
        <WorkspaceMobileHeader
          brand={brand}
          viewer={viewer}
          attentionCount={attentionCount}
          notificationsHref={resolvedNotifHref}
          profileHref={resolvedProfileHref}
        />

        <main id="henryco-main" tabIndex={-1} className="ws-shell-main">
          <div className="ws-shell-main-inner">{children}</div>
        </main>

        <WorkspaceBottomNav
          navigation={resolvedMobileNav}
          pathname={pathname}
          badges={badges}
        />
      </div>
    </div>
  );
}
