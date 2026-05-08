import { requireAccountUser } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { AccountStudioToastRoot } from "@/components/studio/AccountStudioToastRoot";
import AccountPaletteHost from "@/components/search/PaletteHost";

/**
 * V2-DASH-06 — apps/account inner chrome.
 *
 * The notification spine is owned at the shell level by
 * `<SupabaseRealtimeProvider>` (mounted via `<RealtimeBrowserBridge>` in
 * the parent layout). Bells / popovers / lifecycle controls under this
 * subtree consume the shell hooks (`useNotificationSignal`,
 * `useUnreadCount`, `useNotificationPreferences`) directly — the legacy
 * in-app `NotificationSignalProvider` bridge has been removed. This
 * inner shell now only carries apps/account-specific chrome (Sidebar,
 * MobileNav, palette host, studio toast root).
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
      <AccountPaletteHost />
      <Sidebar user={userInfo} />
      <MobileNav user={userInfo} />
      <main className="lg:pl-[var(--acct-sidebar-width)]">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
