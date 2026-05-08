import { requireAccountUser } from "@/lib/auth";
import { getPreferences } from "@/lib/account-data";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { AccountStudioToastRoot } from "@/components/studio/AccountStudioToastRoot";
import { NotificationSignalProvider } from "@/lib/notification-signal";
import AccountPaletteHost from "@/components/search/PaletteHost";

/**
 * V2-DASH-06 — `NotificationSignalProvider` is now a thin BRIDGE that
 * re-projects the shell-level realtime store into the legacy
 * `useNotificationSignalContext()` shape so existing call sites
 * (Sidebar / MobileNav `<NotificationBell>`, `<NotificationLifecycleControls>`,
 * etc.) compile unchanged. The shell's `<SupabaseRealtimeProvider>`
 * (mounted in the parent layout via `<RealtimeBrowserBridge>`) owns the
 * single Supabase channel.
 *
 * The shell-wide `<NotificationsToastViewport>` is mounted in the
 * parent layout, replacing the legacy `<NotificationPreviewToastStack>`
 * (which subscribed to the same shell store via the bridge).
 */
export default async function AccountLayoutInner({ children }: { children: React.ReactNode }) {
  const user = await requireAccountUser();
  const preferences = await getPreferences(user.id);

  const userInfo = {
    fullName: user.fullName,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };

  return (
    <NotificationSignalProvider initialPreferences={preferences}>
      <div className="min-h-screen">
        <AccountStudioToastRoot />
        <AccountPaletteHost />
        <Sidebar user={userInfo} />
        <MobileNav user={userInfo} />
        <main className="lg:pl-[var(--acct-sidebar-width)]">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </NotificationSignalProvider>
  );
}
