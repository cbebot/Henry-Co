import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  ContextDrawer,
  DEFAULT_CSS_VAR_VALUES,
  MOTION_KEYFRAMES_CSS,
  NotificationsDrawerBody,
  NotificationsToastViewport,
  getEligibleModules,
} from "@henryco/dashboard-shell";
import type { ModuleJumpEntry } from "@henryco/search-ui";
import {
  buildUnifiedViewer,
  loadDashboardOptions,
  setDashboardPreference,
  clearDashboardPreference,
} from "@henryco/auth/server";
import type { DashboardOption } from "@henryco/auth";
import AccountLayoutInner from "./AccountLayoutInner";
import AccountRouteLoading from "@/components/layout/AccountRouteLoading";
import IdentityBarPaletteBridge from "@/components/search/IdentityBarPaletteBridge";
import AccountPaletteHost from "@/components/search/PaletteHost";
import { requireAccountUser } from "@/lib/auth";
import { getPreferences } from "@/lib/account-data";
import { RealtimeBrowserBridge } from "./RealtimeBrowserBridge";

// Side-effect import — registers every module so getEligibleModules
// has a populated registry when computing moduleJumpEntries below.
import "@/app/(account)/_modules";

/**
 * V2-DASH-01 G7 + V2-DASH-05 + V2-DASH-06 — apps/account shell composition.
 *
 * DASH-6 wires the realtime spine: RealtimeBrowserBridge supplies the
 * browser Supabase client to a single SupabaseRealtimeProvider, so a
 * SINGLE subscription per session powers the bell, popover, toast
 * viewport, and drawer body.
 *
 * DASH-5 wires the Cmd+K palette: AccountPaletteHost mounts the
 * PaletteOpenProvider so any descendant client component (the
 * IdentityBar's search button via IdentityBarPaletteBridge) can call
 * `openPalette()` without a navigation. moduleJumpEntries is computed
 * server-side from `getEligibleModules(viewer)` for Cmd+1..9 (no
 * client-side role re-derivation; anti-pattern #7).
 *
 * Mount points:
 *   - RealtimeBrowserBridge      — root, provides spine to everything
 *   - AccountPaletteHost         — palette context for IdentityBar's
 *                                   search button + the palette UI
 *   - IdentityBarPaletteBridge   — top chrome, wires onSearchClick to
 *                                   palette.open and onSignOut to a
 *                                   recents-clear before the server
 *                                   action redirects to logout
 *   - NotificationsToastViewport — bottom-right (mobile bottom)
 */

type LayoutProps = {
  children: ReactNode;
  rail?: ReactNode;
  drawer?: ReactNode;
};

async function selectLaneAction(key: DashboardOption["key"]): Promise<void> {
  "use server";
  await setDashboardPreference(key);
  const user = await requireAccountUser();
  const options = await loadDashboardOptions({
    id: user.id,
    email: user.email,
  });
  const chosen = options.find((o) => o.key === key);
  if (chosen) {
    redirect(chosen.href);
  }
}

async function signOutAction(): Promise<void> {
  "use server";
  await clearDashboardPreference();
  redirect("/api/auth/logout");
}

export default async function AccountLayout({ children, rail, drawer }: LayoutProps) {
  return (
    <Suspense
      fallback={
        <AccountRouteLoading
          title="Opening your account"
          description="Confirming your session and loading navigation."
        />
      }
    >
      <ShellChromeRoot rail={rail} drawer={drawer}>
        {children}
      </ShellChromeRoot>
    </Suspense>
  );
}

async function ShellChromeRoot({ children, rail, drawer }: LayoutProps) {
  const user = await requireAccountUser();
  const [viewer, options, preferences] = await Promise.all([
    buildUnifiedViewer({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
    }),
    loadDashboardOptions({
      id: user.id,
      email: user.email,
    }),
    getPreferences(user.id),
  ]);

  const switcherOptions = options.length > 1 ? options : undefined;

  // Cmd+1..9 module shortcuts — first 9 eligible modules in rail
  // order. Computed server-side so the client bridge receives a
  // stable list (no client role re-derivation; anti-pattern #7).
  const moduleJumpEntries: ModuleJumpEntry[] = getEligibleModules(viewer)
    .slice(0, 9)
    .map((m) => ({
      slug: m.slug,
      href: m.slug === "customer-overview" ? "/" : `/modules/${m.slug}`,
    }));

  return (
    <RealtimeBrowserBridge
      viewer={viewer}
      initialPreferences={
        preferences && typeof preferences === "object"
          ? (preferences as Record<string, unknown>)
          : null
      }
    >
      <style dangerouslySetInnerHTML={{ __html: MOTION_KEYFRAMES_CSS }} />
      <AccountPaletteHost userId={user.id} moduleJumpEntries={moduleJumpEntries}>
        <div
          style={{
            ...DEFAULT_CSS_VAR_VALUES,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "var(--hc-surface)",
          }}
        >
          <IdentityBarPaletteBridge
            viewer={viewer}
            options={switcherOptions}
            onSelectOption={selectLaneAction}
            onSignOut={signOutAction}
            notificationsTrigger={
              <ContextDrawer>
                <NotificationsDrawerBody
                  inboxHref="/notifications"
                  recentlyDeletedHref="/notifications/recently-deleted"
                  preferencesEndpoint="/api/notifications/preferences"
                />
              </ContextDrawer>
            }
          />
          <AccountLayoutInner>
            {rail}
            {children}
            {drawer}
          </AccountLayoutInner>
          <NotificationsToastViewport audience="customer" />
        </div>
      </AccountPaletteHost>
    </RealtimeBrowserBridge>
  );
}
