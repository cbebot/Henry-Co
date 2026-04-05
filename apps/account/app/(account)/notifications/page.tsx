import { Bell } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getNotificationFeed } from "@/lib/account-data";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";
import MarkAllReadButton from "@/components/notifications/MarkAllReadButton";
import NotificationsFeed from "@/components/notifications/NotificationsFeed";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireAccountUser();
  const notifications = await getNotificationFeed(user.id, 50);
  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Notifications"
        description="Stay updated on everything across HenryCo."
        icon={Bell}
        actions={hasUnread ? <MarkAllReadButton /> : undefined}
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
