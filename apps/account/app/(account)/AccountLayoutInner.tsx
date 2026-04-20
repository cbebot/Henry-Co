import { requireAccountUser } from "@/lib/auth";
import { getPreferences } from "@/lib/account-data";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { AccountStudioToastRoot } from "@/components/studio/AccountStudioToastRoot";
import {
  NotificationPreviewToastStack,
  NotificationSignalProvider,
} from "@/lib/notification-signal";

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
        <Sidebar user={userInfo} />
        <MobileNav user={userInfo} />
        <main className="lg:pl-[var(--acct-sidebar-width)]">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
        <NotificationPreviewToastStack />
      </div>
    </NotificationSignalProvider>
  );
}
