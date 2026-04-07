import { Bell } from "lucide-react";
import { RouteLiveRefresh } from "@henryco/ui";
import { requireAccountUser } from "@/lib/auth";
import { getNotificationFeed } from "@/lib/account-data";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";
import NotificationsFeed from "@/components/notifications/NotificationsFeed";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireAccountUser();
  const notifications = await getNotificationFeed(user.id, 50);

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh intervalMs={12000} />
      <PageHeader
        title="Notifications"
        description="Stay updated on everything across HenryCo."
        icon={Bell}
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up. Notifications from across HenryCo services will appear here."
        />
      ) : (
        <NotificationsFeed notifications={notifications} />
      )}
    </div>
  );
}
