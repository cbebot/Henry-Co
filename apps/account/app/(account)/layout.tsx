import { requireAccountUser } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/account-data";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAccountUser();
  const unreadCount = await getUnreadNotificationCount(user.id);

  const userInfo = {
    fullName: user.fullName,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };

  return (
    <div className="min-h-screen">
      <Sidebar user={userInfo} unreadCount={unreadCount} />
      <MobileNav user={userInfo} unreadCount={unreadCount} />
      <main className="lg:pl-[var(--acct-sidebar-width)]">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
