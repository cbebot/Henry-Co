import { requireAccountUser } from "@/lib/auth";
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
export default async function AccountLayoutInner({ children }: { children: React.ReactNode }) {
  const user = await requireAccountUser();

  const userInfo = {
    fullName: user.fullName,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };

  return (
    <div className="min-h-screen">
      {/* V5-4 a11y: skip link only visible when keyboard-focused */}
      <a href="#hc-main" className="hc-skip-link">
        Skip to main content
      </a>
      <AccountStudioToastRoot />
      <Sidebar user={userInfo} />
      <main id="hc-main" className="hc-shell-main lg:pl-[var(--acct-sidebar-width)]">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
