import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  ContextDrawer,
  DEFAULT_CSS_VAR_VALUES,
  MOTION_KEYFRAMES_CSS,
  SupabaseRealtimeProvider,
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

// Side-effect import — registers every module so getEligibleModules
// has a populated registry when computing moduleJumpEntries below.
import "@/app/(account)/_modules";

/**
 * V2-DASH-01 G7 — apps/account shell composition.
 *
 * Wraps the existing AccountLayoutInner (Sidebar / MobileNav /
 * AccountPaletteHost / NotificationSignalProvider — preserved
 * unchanged for back-compat with all 45 protected routes) with the
 * new dashboard-shell chrome:
 *   - SupabaseRealtimeProvider at the root (DASH-6 wires fan-out)
 *   - IdentityBar at the top with avatar + role pill + role switcher
 *     + search trigger + theme toggle slot + ContextDrawer trigger
 *     + sign-out
 *   - The IdentityBar's role-switcher consumes `loadDashboardOptions`
 *     from `@henryco/auth/server` — the SAME function the chooser POST
 *     handler uses, so the shell and the chooser share one resolver.
 *     Closes V2-AUTH-RT-01 contract.
 *
 * Parallel route slots (`@rail`, `@drawer`) accepted as props so
 * DASH-2 (rail population) and DASH-6 (drawer fan-out) can land
 * without changing this file again.
 */

type LayoutProps = {
  children: ReactNode;
  /**
   * Parallel-route slot for the WorkspaceRail.
   * Optional in DASH-1 (empty stub via @rail/default.tsx); DASH-2
   * fills with module entries.
   */
  rail?: ReactNode;
  /**
   * Parallel-route slot for the ContextDrawer signal feed.
   * Optional in DASH-1 (empty stub via @drawer/default.tsx); DASH-6
   * fills with the realtime feed.
   */
  drawer?: ReactNode;
};

async function selectLaneAction(key: DashboardOption["key"]): Promise<void> {
  "use server";
  await setDashboardPreference(key);
  // The IdentityBar fires this server action and the client expects
  // navigation to follow. Look up the destination href from the
  // options snapshot and redirect.
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
  // Clear the preference cookie so a subsequent user on the same
  // device doesn't pre-resolve into the prior user's lane.
  await clearDashboardPreference();
  // Defer to the existing /api/auth/logout endpoint — it owns the
  // Supabase global signOut + cookie cleanup. Redirect picks up the
  // logout flow which terminates at /login.
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
  const viewer = await buildUnifiedViewer({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  });
  const options = await loadDashboardOptions({
    id: user.id,
    email: user.email,
  });

  // Single-lane viewers don't see the switcher; the IdentityBar
  // hides it when options.length <= 1.
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
    <SupabaseRealtimeProvider>
      <style
        // The dashboard-shell motion keyframes ship as a CSS string
        // so the host app injects them once at the layout root. The
        // alternative — bundling a CSS file — adds a build-tooling
        // dep the package is intentionally avoiding.
        // The keyframes are reduced-motion-aware via the same string.
        dangerouslySetInnerHTML={{ __html: MOTION_KEYFRAMES_CSS }}
      />
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
          />
          {/* Existing inner chrome — Sidebar + MobileNav + legacy
               palette host + notification stack. DASH-5 replaces the
               legacy palette host with PaletteHost mounted via
               AccountPaletteHost above; AccountLayoutInner no longer
               renders its own palette. */}
          <AccountLayoutInner>
            {/* Parallel route slot for the rail. */}
            {rail}
            {children}
            {/* Parallel route slot for the drawer. */}
            {drawer}
          </AccountLayoutInner>
          {/* Floating ContextDrawer trigger — fixed bottom-right.
               DASH-6 will move this trigger into IdentityBar's
               trailing slot once the unread count + categories
               surface from the realtime spine. */}
          <div
            style={{
              position: "fixed",
              bottom: "1.25rem",
              right: "1.25rem",
              zIndex: 80,
            }}
          >
            <ContextDrawer />
          </div>
        </div>
      </AccountPaletteHost>
    </SupabaseRealtimeProvider>
  );
}
