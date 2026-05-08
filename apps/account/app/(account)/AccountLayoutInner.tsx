import { requireAccountUser } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { AccountStudioToastRoot } from "@/components/studio/AccountStudioToastRoot";

/**
 * V2-DASH-05 + V2-DASH-06 — apps/account inner chrome.
 *
 * The notification spine is owned at the shell level by
 * `<SupabaseRealtimeProvider>` (mounted via `<RealtimeBrowserBridge>` in
 * the parent layout). Bells / popovers / lifecycle controls under this
 * subtree consume the shell hooks (`useNotificationSignal`,
 * `useUnreadCount`, `useNotificationPreferences`) directly — the legacy
 * in-app `NotificationSignalProvider` bridge has been removed.
 *
 * The Cmd+K palette is similarly mounted at the parent layout
 * (`<AccountPaletteHost>` wraps this entire subtree plus the
 * IdentityBar). This inner shell therefore only carries
 * apps/account-specific chrome: Sidebar, MobileNav, studio toast root,
 * and the main content area.
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
      <AccountStudioToastRoot />
      <Sidebar user={userInfo} />
      <MobileNav user={userInfo} />
      <main className="lg:pl-[var(--acct-sidebar-width)]">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
