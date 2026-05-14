import Link from "next/link";
import { Trash2 } from "lucide-react";

import { translateSurfaceLabel } from "@henryco/i18n/server";
import { RouteLiveRefresh } from "@henryco/ui";

import { requireAccountUser } from "@/lib/auth";
import { getNotificationFeed } from "@/lib/account-data";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/notifications/editorial.css";
import { NotificationsHero } from "@/components/notifications/NotificationsHero";
import { notificationStats } from "@/components/notifications/helpers";
import NotificationsFeed from "@/components/notifications/NotificationsFeed";
import { NotificationsFeedEmptyState } from "@/components/notifications/NotificationsFeedEmptyState";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const notifications = await getNotificationFeed(user.id, 50, locale);
  const stats = notificationStats(notifications);

  return (
    <div className="acct-notif acct-fade-in">
      <RouteLiveRefresh intervalMs={12000} />
      <NotificationsHero
        totalUnread={stats.totalUnread}
        totalToday={stats.totalToday}
        totalThisWeek={stats.totalThisWeek}
        divisions={stats.divisions}
        lastActivity={stats.lastActivity}
      />
      <section aria-labelledby="acct-notif-inbox">
        <div className="acct-notif__section-head">
          <h2 id="acct-notif-inbox" className="acct-notif__section-title">
            {t("Inbox")}
          </h2>
          <span className="acct-notif__section-meta">
            {t("Tap to open, swipe to archive — filters work across every division.")}
          </span>
        </div>
        {notifications.length === 0 ? (
          <NotificationsFeedEmptyState variant="inbox" />
        ) : (
          <NotificationsFeed notifications={notifications} />
        )}
      </section>
      <div className="acct-notif__footer">
        <Link href="/notifications/recently-deleted" className="acct-notif__recently-deleted">
          <Trash2 size={13} aria-hidden />
          {t("Recently deleted")}
        </Link>
      </div>
    </div>
  );
}
