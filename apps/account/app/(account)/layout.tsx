import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  ContextDrawer,
  DEFAULT_CSS_VAR_VALUES,
  IdentityBar,
  MOTION_KEYFRAMES_CSS,
  NotificationsDrawerBody,
  NotificationsToastViewport,
} from "@henryco/dashboard-shell";
import {
  buildUnifiedViewer,
  loadDashboardOptions,
  setDashboardPreference,
  clearDashboardPreference,
} from "@henryco/auth/server";
import type { DashboardOption } from "@henryco/auth";
import AccountLayoutInner from "./AccountLayoutInner";
import AccountRouteLoading from "@/components/layout/AccountRouteLoading";
import { requireAccountUser } from "@/lib/auth";
import { getPreferences } from "@/lib/account-data";
import { RealtimeBrowserBridge } from "./RealtimeBrowserBridge";

/**
 * V2-DASH-01 G7 + V2-DASH-06 — apps/account shell composition.
 *
 * DASH-6 wires the realtime spine: the SupabaseRealtimeProvider
 * receives the unified viewer + a browser Supabase client factory, so
 * a SINGLE subscription per session powers the bell, popover, toast
 * viewport, and drawer body. The legacy in-app bridge has been removed
 * — every consumer (NotificationBell, PreferencesForm, lifecycle
 * controls) reads the shell hooks (`useNotificationSignal`,
 * `useUnreadCount`, `useNotificationPreferences`) directly.
 *
 * Mount points:
 *   - SupabaseRealtimeProvider  — root, provides spine to everything
 *   - IdentityBar               — top chrome
 *   - ContextDrawer (in trigger) — opens drawer with NotificationsDrawerBody
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
      <div
        style={{
          ...DEFAULT_CSS_VAR_VALUES,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--hc-surface)",
        }}
      >
        <IdentityBar
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
    </RealtimeBrowserBridge>
  );
}
