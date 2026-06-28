import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  ContextDrawer,
  MOBILE_SHELL_CSS,
  MOTION_KEYFRAMES_CSS,
  NotificationsDrawerBody,
  NotificationsToastViewport,
  getEligibleModules,
  type ModuleNavEntry,
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
import AccountRouteLoader from "@/components/layout/AccountRouteLoader";
import IdentityBarPaletteBridge from "@/components/search/IdentityBarPaletteBridge";
import AccountPaletteHost from "@/components/search/PaletteHost";
import { SensitiveActionProviderBridge } from "@/components/auth/SensitiveActionProviderBridge";
import { requireAccountUser } from "@/lib/auth";
import { getPreferences } from "@/lib/account-data";
import { resolveModuleHomeHref } from "@/lib/module-home-href";
import { RealtimeBrowserBridge } from "./RealtimeBrowserBridge";
import { MobileChromeBridge } from "./MobileChromeBridge";
import { COMPANY } from "@henryco/config";

// Side-effect import — registers every module so getEligibleModules
// has a populated registry when computing moduleJumpEntries below.
import "@/app/(account)/_modules";

/**
 * Per-slug accent overrides for module slugs that do NOT map 1:1 onto a
 * `COMPANY.divisions` key:
 *   - `play` → the gaming division's magenta (the slug is `play`, the
 *     division key is `gaming`).
 *   - `business` → a dedicated indigo (the seller/business workspace is
 *     cross-division and has no `DivisionKey`). Kept in lockstep with
 *     `BUSINESS_IDENTITY.accent` in `@henryco/dashboard-modules-business`.
 *
 * The six division-aligned new modules (care, jobs, learn, logistics,
 * property, studio) resolve directly from `COMPANY.divisions` below, so
 * they need no override; they are listed here for completeness/intent.
 */
const MODULE_ACCENT_OVERRIDES: Record<string, string> = {
  care: "#6B7CFF",
  jobs: "#0E7C86",
  learn: "#3C8C7A",
  logistics: "#D06F32",
  property: "#B06C3E",
  studio: "#4AC1C5",
  play: "#A21CAF",
  business: "#4F46E5",
};

/**
 * Map a module slug to its division accent hex.
 * - play / business and the six division-aligned new slugs →
 *   `MODULE_ACCENT_OVERRIDES[slug]` (authoritative for slugs the
 *   division catalog doesn't key directly, e.g. `play`/`business`).
 * - care/marketplace/property/logistics/studio/jobs/learn/building/hotel
 *   → COMPANY.divisions[slug].accent
 * - customer-overview / wallet / support / notifications / settings →
 *   the default HenryCo gold (`COMPANY.divisions.hub.accent`).
 *
 * Lives in apps/account because COMPANY.divisions is the host-app's
 * canonical config; the shell stays decoupled from the division
 * catalog.
 */
function divisionAccentFor(slug: string): string {
  const override = MODULE_ACCENT_OVERRIDES[slug];
  if (override) return override;
  const direct = (COMPANY.divisions as Record<string, { accent: string }>)[slug];
  if (direct) return direct.accent;
  return COMPANY.divisions.hub.accent;
}

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
        <AccountRouteLoader />
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
  // DIAG-IOS-01 hardening. The previous Promise.all rejected as a unit
  // — a single fetcher hiccup (e.g. a transient Supabase auth-RLS flake
  // mid-deploy) collapsed every authenticated route into V3-10's
  // fallback because the layout error bubbled up through the route
  // segment. `allSettled` barriers each fetcher independently so a
  // partial-data render degrades to a "no notifications preferences
  // yet" state instead of a full-page "Something didn't load."
  //
  // The mandatory primitive is `buildUnifiedViewer` — the viewer drives
  // role-aware module visibility downstream. We retain the synchronous
  // throw on its rejection so the V3-10 boundary fires for the
  // genuinely-unrecoverable case (no viewer = no shell). The two
  // optional fetchers (`loadDashboardOptions`, `getPreferences`)
  // degrade silently when they fail; missing options collapse the lane
  // switcher chrome rather than crashing.
  const [viewerResult, optionsResult, preferencesResult] = await Promise.allSettled([
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

  if (viewerResult.status !== "fulfilled") {
    // The viewer is the only fetcher whose failure must surface the
    // V3-10 boundary — without it we can't compute eligible modules,
    // accent themes, or the role-aware identity bar. Re-throw with the
    // original cause so Sentry + the runtime-error log capture the
    // upstream reason.
    throw viewerResult.reason;
  }

  const viewer = viewerResult.value;
  const options: DashboardOption[] =
    optionsResult.status === "fulfilled" ? optionsResult.value : [];
  const preferences =
    preferencesResult.status === "fulfilled" ? preferencesResult.value : null;

  const switcherOptions = options.length > 1 ? options : undefined;

  // Cmd+1..9 module shortcuts — first 9 eligible modules in rail
  // order. Computed server-side so the client bridge receives a
  // stable list (no client role re-derivation; anti-pattern #7).
  const eligibleModules = getEligibleModules(viewer);
  const moduleJumpEntries: ModuleJumpEntry[] = eligibleModules
    .slice(0, 9)
    .map((m) => ({
      slug: m.slug,
      // Honor a module's declared `homeHref` (e.g. wallet → `/wallet`)
      // so Cmd-jump opens the real surface, not the `/modules/<slug>`
      // summary. customer-overview stays at `/`.
      href: resolveModuleHomeHref(m),
    }));

  // BottomActionBar Modules drawer — richer entry with title +
  // description + icon + division accent for the role-aware module
  // list. Same registry walk as moduleJumpEntries so the two surfaces
  // stay in sync. Accent maps via COMPANY.divisions so each entry
  // wears its division color in the drawer (premium polish).
  const mobileModuleEntries: ModuleNavEntry[] = eligibleModules.map((m) => ({
    slug: m.slug,
    title: m.title,
    description: m.description,
    // Same homeHref resolution as the rail + Cmd-jump so tapping a module
    // in the mobile drawer lands on its canonical surface in one tap.
    href: resolveModuleHomeHref(m),
    icon: typeof m.icon === "function" ? m.icon() : m.icon,
    accentHex: divisionAccentFor(m.slug),
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
      <style dangerouslySetInnerHTML={{ __html: MOTION_KEYFRAMES_CSS + MOBILE_SHELL_CSS }} />
      <SensitiveActionProviderBridge email={viewer.user.email}>
      <AccountPaletteHost userId={user.id} moduleJumpEntries={moduleJumpEntries}>
        {/*
          Theme-aware shell wrapper. The shell's `--hc-*` tokens are
          provided by `packages/ui/src/styles/globals.css` (imported by
          `apps/account/app/globals.css`) with both `:root` (light) and
          `.dark` overrides. We deliberately do NOT spread
          `DEFAULT_CSS_VAR_VALUES` here — that constant carries
          light-only values, and as inline styles it would force shell
          surfaces to render light even when `.dark` is active on the
          html root. Letting the global cascade win lets every shell
          primitive inside (Panel, SignalCard, MetricCard, etc.) follow
          the active theme uniformly with the chrome (`--acct-*` tokens),
          closing the "dark chrome / light panel" mixed-theme bug.
        */}
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "var(--acct-bg)",
            color: "var(--acct-ink)",
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
          <MobileChromeBridge
            modules={mobileModuleEntries}
            onSignOut={signOutAction}
          />
          <NotificationsToastViewport audience="customer" />
        </div>
      </AccountPaletteHost>
      </SensitiveActionProviderBridge>
    </RealtimeBrowserBridge>
  );
}
