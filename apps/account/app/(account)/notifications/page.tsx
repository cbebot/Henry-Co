import { Bell } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getNotifications } from "@/lib/account-data";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";
import MarkAllReadButton from "@/components/notifications/MarkAllReadButton";
import NotificationFeed from "@/components/notifications/NotificationFeed";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireAccountUser();
  const notifications = await getNotifications(user.id, 50);
  const hasUnread = notifications.some((notification: Record<string, unknown>) => !notification.is_read);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Notifications"
        description="Updates across HenryCo. Opening this feed marks visible items as read, and you can keep anything unread for later follow-up."
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
        <NotificationFeed
          initialNotifications={notifications.map((notification: Record<string, unknown>) => ({
            id: String(notification.id || ""),
            title: String(notification.title || "Update"),
            body: typeof notification.body === "string" ? notification.body : null,
            category:
              typeof notification.category === "string" ? notification.category : null,
            division:
              typeof notification.division === "string" ? notification.division : null,
            created_at: String(notification.created_at || new Date().toISOString()),
            is_read: Boolean(notification.is_read),
            action_url:
              typeof notification.action_url === "string" ? notification.action_url : null,
            action_label:
              typeof notification.action_label === "string"
                ? notification.action_label
                : null,
          }))}
        />
      )}
    </div>
  );
}
