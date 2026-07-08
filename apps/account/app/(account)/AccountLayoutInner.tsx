import { translateSurfaceLabel } from "@henryco/i18n";
import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";
import Sidebar from "@/components/layout/Sidebar";
import { AccountStudioToastRoot } from "@/components/studio/AccountStudioToastRoot";

/**
 * V2-DASH-05 + V2-DASH-06 + V2-DASH-07 — apps/account inner chrome.
 *
 * The notification spine is owned at the shell level by
 * `<SupabaseRealtimeProvider>` (mounted via `<RealtimeBrowserBridge>` in
 * the parent layout). Bells / popovers / lifecycle controls under this
 * subtree consume the shell hooks (`useNotificationSignal`,
 * `useUnreadCount`, `useNotificationPreferences`) directly — the legacy
 * in-app `NotificationSignalProvider` bridge has been removed.
 *
 * The Cmd+K palette is mounted at the parent layout
 * (`<AccountPaletteHost>` wraps this entire subtree plus the
 * IdentityBar). The mobile bottom action bar is mounted at the parent
 * layout via `<MobileChromeBridge>`; the legacy `<MobileNav>` has been
 * retired in favour of the shell's `<BottomActionBar>` primitive
 * (DASH-7). This inner shell carries only:
 *
 *   - Sidebar (desktop only — `lg:flex`)
 *   - AccountStudioToastRoot (studio cross-toast)
 *   - The main content area
 */
export default async function AccountLayoutInner({
  children,
  rail,
}: {
  children: React.ReactNode;
  /** The @rail parallel-route slot (WorkspaceRail) — seated as a sticky
   *  side column at >=768px; below that the BottomActionBar owns module
   *  navigation (the rail's own CSS hides it under 768px anyway). */
  rail?: React.ReactNode;
}) {
  const [user, locale] = await Promise.all([requireAccountUser(), getAccountAppLocale()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const userInfo = {
    fullName: user.fullName,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };

  return (
    <div className="min-h-screen">
      {/* V5-4 a11y: skip link only visible when keyboard-focused */}
      <a href="#hc-main" className="hc-skip-link">
        {t("Skip to main content")}
      </a>
      <AccountStudioToastRoot />
      <Sidebar user={userInfo} />
      <main id="hc-main" className="hc-shell-main lg:pl-[var(--acct-sidebar-width)]">
        <div className="hc-shell-content mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* CHROME-OPENER FIX (redesign 2026-07-08): the module rail sits
              in its intended sticky side column instead of stacking above
              the page — every inner page regains ~573px of first paint. */}
          <div className="md:grid md:grid-cols-[220px_minmax(0,1fr)] md:items-start md:gap-8 lg:gap-10">
            {rail ? (
              <div className="hidden md:block md:sticky md:top-6 md:max-h-[calc(100vh-3rem)] md:overflow-y-auto">
                {rail}
              </div>
            ) : null}
            <div className="min-w-0">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
