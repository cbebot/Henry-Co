import { Bell } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { RouteLiveRefresh } from "@henryco/ui";
import { requireAccountUser } from "@/lib/auth";
import { getNotificationFeed } from "@/lib/account-data";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";
import NotificationsFeed from "@/components/notifications/NotificationsFeed";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const notifications = await getNotificationFeed(user.id, 50);

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh intervalMs={12000} />
      <PageHeader
        title={t("Notifications")}
        description={t("Stay updated on everything across HenryCo.")}
        icon={Bell}
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={t("No notifications")}
          description={t("You're all caught up. Notifications from across HenryCo services will appear here.")}
        />
      ) : (
        <NotificationsFeed notifications={notifications} />
      )}
    </div>
  );
}
